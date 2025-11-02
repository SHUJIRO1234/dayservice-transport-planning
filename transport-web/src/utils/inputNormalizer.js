/**
 * 入力値の正規化ユーティリティ
 * 半角全角の統一、スペースの削除などを行う
 */

/**
 * 全角英数字を半角に変換
 * @param {string} str - 変換する文字列
 * @returns {string} 半角に変換された文字列
 */
export const toHalfWidth = (str) => {
  if (!str) return '';
  return str.replace(/[！-～]/g, (char) => {
    return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
  });
};

/**
 * 電話番号を正規化（半角数字とハイフンのみ）
 * @param {string} phone - 電話番号
 * @returns {string} 正規化された電話番号
 */
export const normalizePhoneNumber = (phone) => {
  if (!phone) return '';
  
  // 全角を半角に変換
  let normalized = toHalfWidth(phone);
  
  // 数字とハイフンのみを抽出
  normalized = normalized.replace(/[^0-9-]/g, '');
  
  // 連続するハイフンを1つに
  normalized = normalized.replace(/-+/g, '-');
  
  // 先頭と末尾のハイフンを削除
  normalized = normalized.replace(/^-+|-+$/g, '');
  
  return normalized;
};

/**
 * 郵便番号を正規化（半角数字とハイフンのみ、7桁）
 * @param {string} zipCode - 郵便番号
 * @returns {string} 正規化された郵便番号
 */
export const normalizeZipCode = (zipCode) => {
  if (!zipCode) return '';
  
  // 全角を半角に変換
  let normalized = toHalfWidth(zipCode);
  
  // 数字のみを抽出
  normalized = normalized.replace(/[^0-9]/g, '');
  
  // 7桁の場合、3桁-4桁の形式に
  if (normalized.length === 7) {
    normalized = normalized.slice(0, 3) + '-' + normalized.slice(3);
  }
  
  return normalized;
};

/**
 * 住所を正規化（全角カタカナ、数字は半角に）
 * @param {string} address - 住所
 * @returns {string} 正規化された住所
 */
export const normalizeAddress = (address) => {
  if (!address) return '';
  
  let normalized = address;
  
  // 全角英数字を半角に変換
  normalized = normalized.replace(/[０-９]/g, (char) => {
    return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
  });
  
  // 全角ハイフンを半角に
  normalized = normalized.replace(/[－―‐]/g, '-');
  
  // 複数のスペースを1つに
  normalized = normalized.replace(/\s+/g, ' ');
  
  // 先頭と末尾のスペースを削除
  normalized = normalized.trim();
  
  return normalized;
};

/**
 * 名前を正規化（全角カタカナ、スペースは全角）
 * @param {string} name - 名前
 * @returns {string} 正規化された名前
 */
export const normalizeName = (name) => {
  if (!name) return '';
  
  let normalized = name;
  
  // 半角カタカナを全角カタカナに変換
  normalized = normalized.replace(/[\uFF61-\uFF9F]/g, (char) => {
    const code = char.charCodeAt(0);
    if (code >= 0xFF61 && code <= 0xFF9F) {
      // 半角カタカナから全角カタカナへの変換テーブル
      const halfToFull = {
        'ｱ': 'ア', 'ｲ': 'イ', 'ｳ': 'ウ', 'ｴ': 'エ', 'ｵ': 'オ',
        'ｶ': 'カ', 'ｷ': 'キ', 'ｸ': 'ク', 'ｹ': 'ケ', 'ｺ': 'コ',
        'ｻ': 'サ', 'ｼ': 'シ', 'ｽ': 'ス', 'ｾ': 'セ', 'ｿ': 'ソ',
        'ﾀ': 'タ', 'ﾁ': 'チ', 'ﾂ': 'ツ', 'ﾃ': 'テ', 'ﾄ': 'ト',
        'ﾅ': 'ナ', 'ﾆ': 'ニ', 'ﾇ': 'ヌ', 'ﾈ': 'ネ', 'ﾉ': 'ノ',
        'ﾊ': 'ハ', 'ﾋ': 'ヒ', 'ﾌ': 'フ', 'ﾍ': 'ヘ', 'ﾎ': 'ホ',
        'ﾏ': 'マ', 'ﾐ': 'ミ', 'ﾑ': 'ム', 'ﾒ': 'メ', 'ﾓ': 'モ',
        'ﾔ': 'ヤ', 'ﾕ': 'ユ', 'ﾖ': 'ヨ',
        'ﾗ': 'ラ', 'ﾘ': 'リ', 'ﾙ': 'ル', 'ﾚ': 'レ', 'ﾛ': 'ロ',
        'ﾜ': 'ワ', 'ｦ': 'ヲ', 'ﾝ': 'ン',
        'ｧ': 'ァ', 'ｨ': 'ィ', 'ｩ': 'ゥ', 'ｪ': 'ェ', 'ｫ': 'ォ',
        'ｬ': 'ャ', 'ｭ': 'ュ', 'ｮ': 'ョ', 'ｯ': 'ッ',
        'ｰ': 'ー', '｡': '。', '｢': '「', '｣': '」', '､': '、', '･': '・'
      };
      return halfToFull[char] || char;
    }
    return char;
  });
  
  // 複数のスペースを1つの全角スペースに
  normalized = normalized.replace(/\s+/g, '　');
  
  // 先頭と末尾のスペースを削除
  normalized = normalized.trim();
  
  return normalized;
};

/**
 * 時刻を正規化（HH:MM形式）
 * @param {string} time - 時刻
 * @returns {string} 正規化された時刻
 */
export const normalizeTime = (time) => {
  if (!time) return '';
  
  // 全角数字を半角に変換
  let normalized = toHalfWidth(time);
  
  // 数字とコロンのみを抽出
  normalized = normalized.replace(/[^0-9:]/g, '');
  
  // HH:MM形式に整形
  const parts = normalized.split(':');
  if (parts.length >= 2) {
    const hour = parts[0].padStart(2, '0').slice(0, 2);
    const minute = parts[1].padStart(2, '0').slice(0, 2);
    return `${hour}:${minute}`;
  }
  
  return normalized;
};

/**
 * フォームデータを一括で正規化
 * @param {Object} formData - フォームデータ
 * @returns {Object} 正規化されたフォームデータ
 */
export const normalizeFormData = (formData) => {
  return {
    ...formData,
    name: formData.name ? normalizeName(formData.name) : '',
    address: formData.address ? normalizeAddress(formData.address) : '',
    phone: formData.phone ? normalizePhoneNumber(formData.phone) : '',
    zipCode: formData.zipCode ? normalizeZipCode(formData.zipCode) : '',
    pickupTime: formData.pickupTime ? normalizeTime(formData.pickupTime) : ''
  };
};

