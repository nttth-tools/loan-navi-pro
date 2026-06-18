import type { AreaMasterEntry } from '@/types';

const KEY = 'loan_navi_area_master_v1';

const DEFAULTS: AreaMasterEntry[] = [
  {
    id: 'ja_osaka_nakakauchi_matsubara',
    institutionType: 'ja',
    institutionName: 'JA大阪中河内',
    branchName: '吹田支店',
    contactName: '田中 一郎',
    phone: '06-XXXX-XXXX',
    targetAreas: ['大阪府吹田市', '大阪府茨木市', '大阪府摂津市'],
    excludedAreas: [],
    notes: '大阪府北摂エリアが管轄。審査は厳しくないが書類が多め。',
    lastConfirmedDate: '2024-07-01',
  },
  {
    id: 'ja_nara_all',
    institutionType: 'ja',
    institutionName: 'JA奈良県',
    branchName: '本店',
    contactName: '山田 花子',
    phone: '0742-XX-XXXX',
    targetAreas: ['奈良県全域'],
    excludedAreas: [],
    notes: '奈良県全域対応。転職者・自営業にも比較的柔軟。',
    lastConfirmedDate: '2024-06-15',
  },
  {
    id: 'osaka_city_shinkin',
    institutionType: 'shinkin',
    institutionName: '大阪シティ信用金庫',
    branchName: '豊中支店',
    contactName: '鈴木 次郎',
    phone: '06-XXXX-XXXX',
    targetAreas: ['大阪府豊中市', '大阪府池田市', '大阪府箕面市', '大阪府高槻市'],
    excludedAreas: [],
    notes: '営業エリアは大阪府北部中心。担当者との関係構築が審査に影響しやすい。',
    lastConfirmedDate: '2024-07-05',
  },
  {
    id: 'kinki_rokin',
    institutionType: 'rokin',
    institutionName: '近畿ろうきん',
    branchName: '大阪支店',
    contactName: '佐藤 三郎',
    phone: '06-XXXX-XXXX',
    targetAreas: ['関西'],
    excludedAreas: [],
    notes: '労働組合員が対象。一般申込は組合加入が必要。金利優遇あり。',
    lastConfirmedDate: '2024-05-20',
  },
  {
    id: 'nanto_bank',
    institutionType: 'chiho',
    institutionName: '南都銀行',
    branchName: '本店営業部',
    contactName: '中村 四郎',
    phone: '0742-XX-XXXX',
    targetAreas: ['奈良県全域', '大阪府一部', '京都府南部'],
    excludedAreas: [],
    notes: '奈良県内最大の地方銀行。大阪・京都の一部も対応。',
    lastConfirmedDate: '2024-06-01',
  },
  {
    id: 'kansai_mirai_bank',
    institutionType: 'chiho',
    institutionName: '関西みらい銀行',
    branchName: '枚方支店',
    contactName: '木村 五郎',
    phone: '06-XXXX-XXXX',
    targetAreas: ['関西'],
    excludedAreas: [],
    notes: '関西地盤の地方銀行。審査スピードが速い。',
    lastConfirmedDate: '2024-07-10',
  },
];

export function loadAreaMaster(): AreaMasterEntry[] {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return JSON.parse(raw) as AreaMasterEntry[];
  } catch {
    return DEFAULTS;
  }
}

export function saveAreaMaster(entries: AreaMasterEntry[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(entries));
}

export { DEFAULTS as AREA_MASTER_DEFAULTS };
