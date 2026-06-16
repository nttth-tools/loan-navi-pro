import type { BankMaster, AreaMasterEntry } from '@/types';

export type AreaJudgment = 'in' | 'out' | 'unknown';

const KANSAI_PREFS = ['大阪', '兵庫', '京都', '奈良', '滋賀', '和歌山'];
const TOHOKU_PREFS = ['青森', '岩手', '宮城', '秋田', '山形', '福島'];
const KANTO_PREFS  = ['東京', '神奈川', '埼玉', '千葉', '茨城', '栃木', '群馬'];
const CHUBU_PREFS  = ['愛知', '岐阜', '三重', '静岡', '長野', '山梨', '新潟', '富山', '石川', '福井'];
const CHUGOKU_PREFS = ['広島', '岡山', '山口', '島根', '鳥取'];
const SHIKOKU_PREFS = ['愛媛', '高知', '徳島', '香川'];
const KYUSHU_PREFS  = ['福岡', '佐賀', '長崎', '熊本', '大分', '宮崎', '鹿児島', '沖縄'];

const REGION_MAP: Record<string, string[]> = {
  '関西': KANSAI_PREFS,
  '近畿': KANSAI_PREFS,
  '東北': TOHOKU_PREFS,
  '関東': KANTO_PREFS,
  '中部': CHUBU_PREFS,
  '中国': CHUGOKU_PREFS,
  '四国': SHIKOKU_PREFS,
  '九州': KYUSHU_PREFS,
  '九州・沖縄': KYUSHU_PREFS,
};

// Normalize area label: strip suffixes like 全域/全体/南部/北部/一部
function normalizeArea(label: string): string {
  return label
    .replace(/全域|全体|全域内|南部|北部|東部|西部|中部|一部|周辺|近郊/g, '')
    .trim();
}

// Check if address string matches an area label
function matchesAreaLabel(address: string, areaLabel: string): boolean {
  // Check regional groups first
  const regionPrefs = REGION_MAP[areaLabel];
  if (regionPrefs) {
    return regionPrefs.some(p => address.includes(p));
  }
  // Normalize and do substring match
  const normalized = normalizeArea(areaLabel);
  if (!normalized) return false;
  return address.includes(normalized);
}

export function judgeArea(address: string, bank: BankMaster): AreaJudgment {
  if (!address.trim()) return 'unknown';

  const targetAreas  = bank.targetAreas  ?? [];
  const excludedAreas = bank.excludedAreas ?? [];
  const legacyAreas  = bank.areas ?? [];

  // Excluded areas take priority
  if (excludedAreas.some(e => matchesAreaLabel(address, e))) return 'out';

  // 全国 = always in
  if (legacyAreas.includes('全国') || targetAreas.includes('全国')) return 'in';

  // Regional groups from legacy areas
  for (const a of legacyAreas) {
    if (REGION_MAP[a] && matchesAreaLabel(address, a)) return 'in';
  }

  // Regional groups from targetAreas
  for (const a of targetAreas) {
    if (REGION_MAP[a] && matchesAreaLabel(address, a)) return 'in';
  }

  // Specific targetAreas match
  if (targetAreas.some(a => matchesAreaLabel(address, a))) return 'in';

  // Specific legacy areas (non-keyword entries like '奈良', '大阪')
  if (legacyAreas.some(a => !REGION_MAP[a] && a !== '全国' && matchesAreaLabel(address, a))) return 'in';

  // No areas defined at all → unknown (要確認)
  if (legacyAreas.length === 0 && targetAreas.length === 0) return 'unknown';

  // Areas defined but none matched → out
  return 'out';
}

// Judge area against AreaMasterEntry
export function judgeAreaMaster(address: string, entry: AreaMasterEntry): AreaJudgment {
  if (!address.trim()) return 'unknown';

  if (entry.excludedAreas.some(e => matchesAreaLabel(address, e))) return 'out';
  if (entry.targetAreas.includes('全国')) return 'in';
  if (entry.targetAreas.some(a => matchesAreaLabel(address, a))) return 'in';
  if (entry.targetAreas.length === 0) return 'unknown';
  return 'out';
}

export const AREA_JUDGMENT_LABELS: Record<AreaJudgment, string> = {
  in:      '融資エリア内',
  out:     '融資エリア外',
  unknown: '要確認',
};

export const AREA_JUDGMENT_STYLES: Record<AreaJudgment, { bg: string; color: string }> = {
  in:      { bg: '#DCFCE7', color: '#15803D' },
  out:     { bg: '#FEE2E2', color: '#DC2626' },
  unknown: { bg: '#FEF3C7', color: '#B45309' },
};
