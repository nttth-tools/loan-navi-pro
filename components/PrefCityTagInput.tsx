"use client";

import { useState } from "react";
import { X } from "lucide-react";

// 主要都道府県（近畿優先）
const PREFECTURES = [
  '大阪府', '兵庫県', '京都府', '奈良県', '滋賀県', '和歌山県',
  '東京都', '神奈川県', '愛知県', '福岡県', '北海道', '宮城県',
  '広島県', '岡山県', '香川県', '愛媛県', '静岡県', '千葉県',
  '埼玉県', '茨城県', '栃木県', '群馬県', '新潟県', '長野県',
];

// 大阪府の主要市区町村（初期候補）
const OSAKA_CITIES = [
  '吹田市', '高槻市', '枚方市', '豊中市', '茨木市', '堺市',
  '東大阪市', '八尾市', '寝屋川市', '守口市', '門真市', '大東市',
  '摂津市', '箕面市', '池田市', '島本町', '四条畷市', '交野市',
];

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
  color?: { bg: string; text: string };
}

export function PrefCityTagInput({ tags, onChange, color }: Props) {
  const [pref, setPref] = useState('大阪府');
  const [city, setCity] = useState('');
  const [freeText, setFreeText] = useState('');

  const bgCol = color?.bg ?? '#DCFCE7';
  const txtCol = color?.text ?? '#15803D';

  const addStructured = () => {
    const v = `${pref}${city.trim()}`;
    if (city.trim() && !tags.includes(v)) onChange([...tags, v]);
    setCity('');
  };

  const addFree = () => {
    const v = freeText.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setFreeText('');
  };

  const remove = (t: string) => onChange(tags.filter(x => x !== t));

  const inputBase = "px-2.5 py-1.5 rounded-lg text-xs outline-none transition-colors";
  const inputSt = { background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#111827' };

  return (
    <div className="space-y-3">
      {/* 登録済みタグ */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(t => (
            <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ background: bgCol, color: txtCol }}>
              {t}
              <button type="button" onClick={() => remove(t)} className="opacity-60 hover:opacity-100">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 構造化入力（都道府県 + 市区町村） */}
      <div>
        <div className="text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>
          都道府県 + 市区町村で追加
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <select
            value={pref}
            onChange={e => { setPref(e.target.value); setCity(''); }}
            className={`${inputBase} shrink-0`}
            style={inputSt}
          >
            {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <input
            list={`city-list-${pref}`}
            value={city}
            onChange={e => setCity(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addStructured(); } }}
            placeholder="市区町村を入力（例：○○市）"
            className={`${inputBase} flex-1 min-w-0`}
            style={{ ...inputSt, minWidth: '140px' }}
          />
          {pref === '大阪府' && (
            <datalist id={`city-list-${pref}`}>
              {OSAKA_CITIES.map(c => <option key={c} value={c} />)}
            </datalist>
          )}
          <button
            type="button"
            onClick={addStructured}
            disabled={!city.trim()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors disabled:opacity-40"
            style={{ background: bgCol, color: txtCol }}
          >
            追加
          </button>
        </div>
        {city.trim() && (
          <div className="mt-1 text-xs" style={{ color: '#6B7280' }}>
            追加される値：<strong style={{ color: txtCol }}>{pref}{city.trim()}</strong>
          </div>
        )}
      </div>

      {/* 自由入力（全国・関西・奈良県全域 など） */}
      <div>
        <div className="text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>
          フリーワードで追加（全国 / 関西 / 奈良県全域 など）
        </div>
        <div className="flex gap-1.5">
          <input
            value={freeText}
            onChange={e => setFreeText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFree(); } }}
            placeholder="例：全国 / 関西 / 奈良県全域"
            className={`${inputBase} flex-1`}
            style={inputSt}
          />
          <button
            type="button"
            onClick={addFree}
            disabled={!freeText.trim()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors disabled:opacity-40"
            style={{ background: '#F3F4F6', color: '#374151' }}
          >
            追加
          </button>
        </div>
      </div>
    </div>
  );
}
