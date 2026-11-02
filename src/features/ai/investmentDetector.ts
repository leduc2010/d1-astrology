import { folded, Phrases } from './textMatch';

/**
 * Spots a question about investing or trading (stocks, crypto, funds…). The spec rules out
 * investment advice (§12), so such a question gets a short refusal instead of a reading and costs no
 * question from the day's allowance. Every app language is checked, like the crisis detector.
 */
const PHRASES = new Phrases(
  // Words that also have an everyday sense ("invest time", "take stock", French "bourse" for a
  // grant, Russian "биржа труда") are only matched in a money phrase.
  [
    // English
    'invest money', 'invest my money', 'invest my savings', 'investment advice', 'my investments',
    'stock market', 'stocks', 'crypto', 'cryptocurrency', 'bitcoin', 'forex', 'day trading',
    'mutual fund', 'mutual funds', 'index fund', 'index funds',
    // Vietnamese (folded)
    'co nen dau tu khong', 'dau tu tien', 'dau tu vang', 'dau tu dat', 'dau tu bat dong san',
    'dau tu tai chinh', 'chung khoan', 'co phieu', 'tien ao', 'tien ma hoa', 'tien dien tu', 'ngoai hoi',
    // German
    'geld investieren', 'geldanlage', 'aktie', 'aktien', 'börse', 'krypto', 'kryptowährung',
    // Spanish
    'invertir dinero', 'invertir mi dinero', 'bolsa de valores', 'cripto', 'criptomonedas',
    // French
    'investir mon argent', 'placer mon argent', 'en bourse', 'cryptomonnaie', 'cryptomonnaies',
    // Portuguese
    'investir dinheiro', 'investir meu dinheiro', 'bolsa de valores', 'criptomoeda', 'criptomoedas',
    // Dutch
    'beleggen', 'geld investeren', 'aandelen',
    // Indonesian
    'investasi saham', 'investasi uang', 'investasi emas', 'saham', 'kripto', 'reksa dana',
    // Russian
    'инвестировать деньги', 'вложить деньги', 'фондовый рынок', 'фондовая биржа', 'на бирже',
    'криптовалюта', 'биткоин',
  ],
  [
    // Arabic
    'استثمار', 'أستثمر', 'استثمر', 'الأسهم', 'البورصة', 'العملات الرقمية', 'بيتكوين',
    // Hindi
    'निवेश', 'शेयर बाजार', 'शेयर मार्केट', 'क्रिप्टो', 'बिटकॉइन',
    // Bengali
    'বিনিয়োগ', 'শেয়ার বাজার', 'ক্রিপ্টো', 'বিটকয়েন',
    // Chinese
    '投资', '投資', '股票', '股市', '炒股', '基金', '加密货币', '加密貨幣', '比特币', '比特幣', '期货', '期貨',
    // Korean ("주식회사" is a company, so 주식 needs a particle or a money word)
    '투자', '주식 투자', '주식투자', '주식을', '주식은', '주식이', '주식에', '주식 시장', '주식시장', '비트코인',
    '암호화폐', '가상화폐',
  ],
);

export function isInvestmentQuestion(text: string): boolean {
  return PHRASES.anyIn(folded(text));
}
