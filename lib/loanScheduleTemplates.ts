import type { LoanScheduleTemplate } from "@/types";

// デフォルトのローンスケジュールテンプレート
export const DEFAULT_TEMPLATES: LoanScheduleTemplate[] = [
  {
    id: "tmpl_default",
    name: "標準テンプレート",
    tasks: [
      // 土地決済 21日前
      { id: "t1",  name: "売買契約書提出",         baseDateKey: "landSettlementDate",      offsetDays: -21, requiredDocuments: ["売買契約書"] },
      { id: "t2",  name: "重要事項説明書提出",      baseDateKey: "landSettlementDate",      offsetDays: -21, requiredDocuments: ["重要事項説明書"] },
      { id: "t3",  name: "土地謄本提出",            baseDateKey: "landSettlementDate",      offsetDays: -21, requiredDocuments: ["土地登記事項証明書"] },
      { id: "t4",  name: "決済日確定・司法書士確認", baseDateKey: "landSettlementDate",     offsetDays: -14, requiredDocuments: [] },
      // 着工金 14日前
      { id: "t5",  name: "銀行へ分割実行可否確認",   baseDateKey: "constructionPaymentDate", offsetDays: -14, requiredDocuments: [] },
      { id: "t6",  name: "工事請負契約書提出",       baseDateKey: "constructionPaymentDate", offsetDays: -14, requiredDocuments: ["工事請負契約書"] },
      { id: "t7",  name: "建築確認済証提出",         baseDateKey: "constructionPaymentDate", offsetDays: -14, requiredDocuments: ["建築確認済証"] },
      { id: "t8",  name: "着工金請求書提出",         baseDateKey: "constructionPaymentDate", offsetDays: -7,  requiredDocuments: ["着工金請求書"] },
      // 中間金 14日前
      { id: "t9",  name: "中間金請求書提出",         baseDateKey: "interimPaymentDate",      offsetDays: -14, requiredDocuments: ["中間金請求書"] },
      { id: "t10", name: "上棟予定日確認",           baseDateKey: "interimPaymentDate",      offsetDays: -14, requiredDocuments: [] },
      { id: "t11", name: "銀行担当者へ実行予定連絡", baseDateKey: "interimPaymentDate",      offsetDays: -14, requiredDocuments: [] },
      // 金消契約 7日前
      { id: "t12", name: "住民票提出",              baseDateKey: "loanContractDate",         offsetDays: -7,  requiredDocuments: ["住民票"] },
      { id: "t13", name: "印鑑証明提出",            baseDateKey: "loanContractDate",         offsetDays: -7,  requiredDocuments: ["印鑑証明書"] },
      { id: "t14", name: "本人確認書類提出",        baseDateKey: "loanContractDate",          offsetDays: -7,  requiredDocuments: ["運転免許証"] },
      { id: "t15", name: "火災保険見積提出",        baseDateKey: "loanContractDate",          offsetDays: -7,  requiredDocuments: ["火災保険見積書"] },
      // 引渡し 14日前
      { id: "t16", name: "最終金請求書提出",        baseDateKey: "deliveryDate",              offsetDays: -14, requiredDocuments: ["最終金請求書"] },
      { id: "t17", name: "表示登記・保存登記確認",  baseDateKey: "deliveryDate",              offsetDays: -14, requiredDocuments: [] },
      { id: "t18", name: "融資実行日確定",          baseDateKey: "deliveryDate",              offsetDays: -7,  requiredDocuments: [] },
    ],
  },
  {
    id: "tmpl_ja",
    name: "JA・信用金庫テンプレート",
    tasks: [
      // 本申込は土地決済45日前まで
      { id: "j1",  name: "本申込書類一式提出",       baseDateKey: "landSettlementDate",      offsetDays: -45, requiredDocuments: ["本申込書類一式"] },
      { id: "j2",  name: "組合員加入手続き確認",     baseDateKey: "mainApplicationDate",     offsetDays: -7,  requiredDocuments: [] },
      // つなぎ融資申込は着工金21日前
      { id: "j3",  name: "つなぎ融資申込",           baseDateKey: "constructionPaymentDate", offsetDays: -21, requiredDocuments: ["つなぎ融資申込書"] },
      { id: "j4",  name: "売買契約書提出",           baseDateKey: "landSettlementDate",      offsetDays: -21, requiredDocuments: ["売買契約書"] },
      { id: "j5",  name: "重要事項説明書提出",       baseDateKey: "landSettlementDate",      offsetDays: -21, requiredDocuments: ["重要事項説明書"] },
      { id: "j6",  name: "土地謄本提出",             baseDateKey: "landSettlementDate",      offsetDays: -21, requiredDocuments: ["土地登記事項証明書"] },
      { id: "j7",  name: "工事請負契約書提出",       baseDateKey: "constructionPaymentDate", offsetDays: -14, requiredDocuments: ["工事請負契約書"] },
      { id: "j8",  name: "建築確認済証提出",         baseDateKey: "constructionPaymentDate", offsetDays: -14, requiredDocuments: ["建築確認済証"] },
      { id: "j9",  name: "着工金請求書提出",         baseDateKey: "constructionPaymentDate", offsetDays: -7,  requiredDocuments: ["着工金請求書"] },
      { id: "j10", name: "中間金請求書提出",         baseDateKey: "interimPaymentDate",      offsetDays: -14, requiredDocuments: ["中間金請求書"] },
      { id: "j11", name: "住民票提出",              baseDateKey: "loanContractDate",          offsetDays: -7,  requiredDocuments: ["住民票"] },
      { id: "j12", name: "印鑑証明提出",            baseDateKey: "loanContractDate",          offsetDays: -7,  requiredDocuments: ["印鑑証明書"] },
      { id: "j13", name: "火災保険見積提出",        baseDateKey: "loanContractDate",          offsetDays: -7,  requiredDocuments: ["火災保険見積書"] },
      { id: "j14", name: "最終金請求書提出",        baseDateKey: "deliveryDate",              offsetDays: -14, requiredDocuments: ["最終金請求書"] },
      { id: "j15", name: "融資実行日確定",          baseDateKey: "deliveryDate",              offsetDays: -7,  requiredDocuments: [] },
    ],
  },
  {
    id: "tmpl_mega",
    name: "メガバンク・ネット銀行テンプレート",
    tasks: [
      // 本申込は土地決済30日前
      { id: "m1",  name: "本申込書類一式提出",      baseDateKey: "landSettlementDate",       offsetDays: -30, requiredDocuments: ["本申込書類一式"] },
      { id: "m2",  name: "売買契約書提出",          baseDateKey: "landSettlementDate",       offsetDays: -21, requiredDocuments: ["売買契約書"] },
      { id: "m3",  name: "重要事項説明書提出",      baseDateKey: "landSettlementDate",       offsetDays: -21, requiredDocuments: ["重要事項説明書"] },
      { id: "m4",  name: "分割実行依頼書提出",      baseDateKey: "constructionPaymentDate",  offsetDays: -14, requiredDocuments: ["分割実行依頼書"] },
      { id: "m5",  name: "工事請負契約書提出",      baseDateKey: "constructionPaymentDate",  offsetDays: -14, requiredDocuments: ["工事請負契約書"] },
      { id: "m6",  name: "建築確認済証提出",        baseDateKey: "constructionPaymentDate",  offsetDays: -14, requiredDocuments: ["建築確認済証"] },
      { id: "m7",  name: "着工金請求書提出",        baseDateKey: "constructionPaymentDate",  offsetDays: -7,  requiredDocuments: ["着工金請求書"] },
      { id: "m8",  name: "中間金請求書提出",        baseDateKey: "interimPaymentDate",       offsetDays: -14, requiredDocuments: ["中間金請求書"] },
      // 金消契約は融資実行7日前まで
      { id: "m9",  name: "住民票提出",             baseDateKey: "loanContractDate",           offsetDays: -7,  requiredDocuments: ["住民票"] },
      { id: "m10", name: "印鑑証明提出",           baseDateKey: "loanContractDate",           offsetDays: -7,  requiredDocuments: ["印鑑証明書"] },
      { id: "m11", name: "本人確認書類提出",       baseDateKey: "loanContractDate",           offsetDays: -7,  requiredDocuments: ["運転免許証"] },
      { id: "m12", name: "火災保険証券提出",       baseDateKey: "loanContractDate",           offsetDays: -7,  requiredDocuments: ["火災保険証券"] },
      { id: "m13", name: "最終金請求書提出",       baseDateKey: "deliveryDate",               offsetDays: -14, requiredDocuments: ["最終金請求書"] },
      { id: "m14", name: "表示登記予定確認",       baseDateKey: "deliveryDate",               offsetDays: -14, requiredDocuments: [] },
      { id: "m15", name: "融資実行日確定連絡",     baseDateKey: "deliveryDate",               offsetDays: -7,  requiredDocuments: [] },
    ],
  },
];
