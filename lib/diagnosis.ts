import { BANKS } from './banks';
import type { BankMaster, DiagnosisInput, DiagnosisResult } from '@/types';

function calcMonthlyPayment(principal: number, annualRate: number, years: number): number {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return Math.round(principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1));
}

export function runDiagnosis(input: DiagnosisInput, banks: BankMaster[] = BANKS): DiagnosisResult[] {
  const income = Number(input.income) || 0;
  const spouseIncome = Number(input.spouseIncome) || 0;
  const totalIncome = income + spouseIncome;
  const desiredAmount = Number(input.desiredAmount) || 0;
  const savings = Number(input.savings) || 0;
  const existingLoan = Number(input.existingLoan) || 0;
  const yearsEmployed = Number(input.yearsEmployed) || 0;
  const age = Number(input.age) || 0;
  const repaymentPeriod = Number(input.repaymentPeriod) || 35;

  const results: DiagnosisResult[] = banks.map((bank) => {
    let score = 100;
    const cautions: string[] = [];

    // 年収チェック
    if (totalIncome < bank.minIncome) {
      score -= 40;
      cautions.push(`この銀行の審査基準年収（${bank.minIncome}万円）を下回っています`);
    }

    // 雇用形態チェック
    if (!bank.allowedEmployments.includes(input.employmentType)) {
      score -= 50;
      cautions.push(`${input.employmentType}は審査対象外の場合があります`);
    }

    // 勤続年数チェック
    if (yearsEmployed < bank.minYearsEmployed) {
      score -= 30;
      cautions.push(`勤続年数が${bank.minYearsEmployed}年未満のため審査が厳しくなります`);
    }

    // 借入倍率チェック
    if (totalIncome > 0) {
      const loanRatio = desiredAmount / totalIncome;
      if (loanRatio > bank.maxLoanRatio) {
        score -= 25;
        cautions.push(`借入希望額が年収の${loanRatio.toFixed(1)}倍で基準（${bank.maxLoanRatio}倍）を超えています`);
      }
    }

    // 年齢チェック（完済時年齢80歳以内）
    if (age + repaymentPeriod > 80) {
      score -= 20;
      cautions.push(`完済時年齢が${age + repaymentPeriod}歳となり、80歳超のため期間短縮が必要な場合があります`);
    }

    // 返済比率チェック（年収の35%以内が目安）
    const monthlyPayment = calcMonthlyPayment(desiredAmount * 10000, bank.rate, repaymentPeriod);
    const annualRepayment = (monthlyPayment + existingLoan * 10000 / 12) * 12;
    const repaymentRatio = totalIncome > 0 ? (annualRepayment / (totalIncome * 10000)) * 100 : 0;
    if (repaymentRatio > 40) {
      score -= 30;
      cautions.push(`返済比率が約${repaymentRatio.toFixed(0)}%となり基準（40%以内）を超えています`);
    } else if (repaymentRatio > 35) {
      score -= 10;
      cautions.push(`返済比率が約${repaymentRatio.toFixed(0)}%となり審査が厳しくなる場合があります`);
    }

    // 自己資金チェック
    if (savings < desiredAmount * 0.1) {
      score -= 10;
      cautions.push('自己資金が借入希望額の10%未満のため審査に影響する場合があります');
    }

    // 金利加点（低いほど高評価）
    score += Math.max(0, (2.0 - bank.rate) * 10);

    score = Math.max(0, Math.min(100, score));

    let feasibility: DiagnosisResult['feasibility'];
    let feasibilityColor: string;
    if (score >= 75) { feasibility = '高'; feasibilityColor = '#10b981'; }
    else if (score >= 50) { feasibility = '中'; feasibilityColor = '#f59e0b'; }
    else if (score >= 25) { feasibility = '低'; feasibilityColor = '#ef4444'; }
    else { feasibility = '困難'; feasibilityColor = '#6b7280'; }

    const estimatedRate = bank.rate;
    const monthly = calcMonthlyPayment(desiredAmount * 10000, estimatedRate, repaymentPeriod);
    const total = monthly * repaymentPeriod * 12;

    let comment = '';
    if (score >= 75) {
      comment = `審査通過の可能性が高く、強くおすすめします。${bank.features[0]}`;
    } else if (score >= 50) {
      comment = `審査通過の可能性はありますが、条件次第では調整が必要です。`;
    } else if (score >= 25) {
      comment = `審査が厳しい可能性があります。収入合算や借入額の見直しをご検討ください。`;
    } else {
      comment = `現状では審査通過が困難です。条件を見直してから再診断することをおすすめします。`;
    }

    return {
      bank,
      score,
      feasibility,
      feasibilityColor,
      estimatedRate,
      monthlyPayment: monthly,
      totalPayment: total,
      comment,
      cautions,
    };
  });

  return results.sort((a, b) => b.score - a.score);
}
