export type EmploymentType =
  | '正社員'
  | '公務員'
  | '契約社員'
  | 'パート・アルバイト'
  | '自営業'
  | 'その他';

export type ScreeningStatus =
  | '未申込'
  | '書類準備中'
  | '申込済'
  | '審査中'
  | '承認'
  | '否決'
  | '保留';

export type ApplicationMethod = 'web' | 'paper' | 'unknown';

export type SupportLevel = 'supported' | 'unsupported' | 'confirm';
export const SUPPORT_LEVEL_LABELS: Record<SupportLevel, string> = {
  supported: '対応',
  unsupported: '非対応',
  confirm: '要確認',
};
export const SUPPORT_LEVEL_STYLES: Record<SupportLevel, { bg: string; color: string }> = {
  supported: { bg: '#DCFCE7', color: '#15803D' },
  unsupported: { bg: '#FEE2E2', color: '#DC2626' },
  confirm: { bg: '#FEF3C7', color: '#B45309' },
};

export type RepaymentStartTiming =
  | 'land'         // 土地実行時から
  | 'building'     // 建物実行時から
  | 'final'        // 最終実行後から
  | 'interestOnly' // 利息のみ先払い
  | 'confirm';     // 要確認

export const REPAYMENT_TIMING_LABELS: Record<RepaymentStartTiming, string> = {
  land: '土地実行時から',
  building: '建物実行時から',
  final: '最終実行後から',
  interestOnly: '利息のみ先払い',
  confirm: '要確認',
};

export type LoanImpactLevel = 'なし' | '低' | '中' | '高';
export type ProductType = 'variable' | 'fixed';
export type FixedPeriodType = 'flat35' | 'fixed10' | 'fixed20' | 'allFixed';

export const FIXED_PERIOD_LABELS: Record<FixedPeriodType, string> = {
  flat35: 'フラット35',
  fixed10: '固定10年',
  fixed20: '固定20年',
  allFixed: '全期間固定',
};

export interface BankMaster {
  id: string;
  name: string;
  productName: string;
  productType: ProductType;
  fixedPeriod?: FixedPeriodType;
  rate: number;
  danshin: string;
  feeYen: number;
  guarantee: string;
  areas: string[];
  minIncome: number;
  minYearsEmployed: number;
  allowedEmployments: EmploymentType[];
  maxLoanRatio: number;
  features: string[];

  // 雇用・属性条件
  jobChangeMonths: number | null;
  selfEmployedYears: number | null;
  corporateRepOk: boolean;
  contractOk: boolean;
  dispatchOk: boolean;
  foreignNationalOk: boolean;
  permanentResidencyRequired: boolean;

  // ローン組み方
  incomeAggregationOk: boolean;
  pairLoanOk: boolean;

  // 既存ローン影響
  carLoanImpact: LoanImpactLevel;
  cardLoanImpact: LoanImpactLevel;

  // 団信・優遇
  danshinTypes: string[];
  zehDiscount: number | null;
  longTermQualityDiscount: number | null;

  // 融資エリア
  targetAreas?: string[];
  excludedAreas?: string[];

  // 銀行担当者
  contact?: BankContact;

  // 申込・審査情報
  webApplicationUrl?: string;      // WEB事前審査URL
  paperApplicationUrl?: string;    // 紙申込PDFダウンロードURL
  preScreeningDays?: string;       // 事前審査目安日数（例: "3営業日"）

  // つなぎ融資・分割実行
  bridgeLoanSupport?: SupportLevel;       // つなぎ融資対応
  splitExecutionSupport?: SupportLevel;   // 分割実行対応
  landFirstLoanSupport?: SupportLevel;    // 土地先行融資
  buildingInterimSupport?: SupportLevel;  // 建物中間金対応
  repaymentStartTiming?: RepaymentStartTiming; // 返済開始タイミング
  bridgeLoanMemo?: string;
  splitExecutionMemo?: string;
  repaymentStartMemo?: string;

  // 営業メモ
  staffMemo: string;

  // 管理情報
  lastConfirmedDate?: string;
  confirmedBy?: string;
}

export interface BankContact {
  name: string;
  branch: string;
  phone: string;
  email: string;
  mobile: string;
  title: string;
  availableAreas: string[];
  lastContactDate: string;
  memo: string;
}

export type InstitutionType = 'ja' | 'shinkin' | 'rokin' | 'chiho' | 'mega' | 'net' | 'other';

export const INSTITUTION_TYPE_LABELS: Record<InstitutionType, string> = {
  ja:     'JA農協',
  shinkin:'信用金庫',
  rokin:  '労働金庫',
  chiho:  '地方銀行',
  mega:   'メガバンク',
  net:    'ネット銀行',
  other:  'その他',
};

export interface AreaMasterEntry {
  id: string;
  institutionType: InstitutionType;
  institutionName: string;
  branchName: string;
  contactName: string;
  phone: string;
  targetAreas: string[];
  excludedAreas: string[];
  notes: string;
  lastConfirmedDate: string;
}

export interface DiagnosisInput {
  customerName: string;
  age: number | '';
  income: number | '';
  yearsEmployed: number | '';
  employmentType: EmploymentType;
  spouseIncome: number | '';
  savings: number | '';
  existingLoan: number | '';
  desiredAmount: number | '';
  repaymentPeriod: number | '';
  area: string;
  constructionAddress: string;
  // 物件・購入条件
  isBuyingLand: boolean;        // 土地から購入
  hasConstructionContract: boolean; // 建物請負契約あり
  hasInterimPayment: boolean;   // 中間金あり
  needsBridgeLoan: boolean;     // つなぎ融資が必要
}

export interface DiagnosisResult {
  bank: BankMaster;
  score: number;
  feasibility: '高' | '中' | '低' | '困難';
  feasibilityColor: string;
  estimatedRate: number;
  monthlyPayment: number;
  totalPayment: number;
  comment: string;
  cautions: string[];
}

export interface ScreeningRecord {
  id: string;
  customerName: string;
  bankName: string;
  productName: string;        // 商品名
  applicationMethod: ApplicationMethod; // WEB / 紙 / unknown
  appliedAt: string;          // 申込日
  status: ScreeningStatus;
  expectedResponseDate: string; // 回答予定日
  requiredDocs: string;
  missingDocs: string;
  bankContact: string;
  memo: string;
  createdAt: string;
  // optional extras
  desiredAmount?: number;     // 希望借入額（万円）
  rate?: number;              // 適用金利
  preScreeningDays?: string;  // 目安日数（表示用）
}

export interface Customer {
  id: string;
  name: string;
  age: string;
  employer: string;
  yearsEmployed: string;
  income: string;
  spouseIncome: string;
  employment: string;
  savings: string;
  existingLoan: string;
  desiredAmount: string;
  desiredPayment: string;
  area: string;
  builder: string;
  referral: string;
  memo: string;
  status: string;
  createdAt: string;
}
