const COMBINING_MARKS = /\p{Mn}+/gu;
// Spacing marks (Mc) are kept: they are part of the word in Devanagari and Bengali.
const NON_LETTERS = /[^\p{L}\p{N}\p{Mc}]+/gu;

/**
 * Lower case, Vietnamese marks and "đ" folded away, punctuation turned into single spaces, padded
 * with a space on each side, so "Tôi muốn chết!" becomes " toi muon chet ".
 */
export function folded(text: string): string {
  const stripped = text.toLowerCase().normalize('NFD').replace(COMBINING_MARKS, '');
  // Recomposed so Hangul stays in syllables: decomposed, "투자" would turn up inside "투잡".
  const bare = stripped.normalize('NFC').replace(/đ/g, 'd');
  return ` ${bare.replace(NON_LETTERS, ' ').trim()} `;
}

/** True when [phrase] (already folded, without padding) appears as whole words in folded text. */
export function hasPhrase(foldedText: string, phrase: string): boolean {
  return foldedText.includes(` ${phrase} `);
}

/**
 * Phrases looked for in a question, folded once up front. [words] must match whole words; [fragments]
 * may sit anywhere, for scripts that run words together or attach particles (Chinese, Korean, Arabic,
 * Hindi, Bengali), so they should be long enough not to turn up inside unrelated words.
 */
export class Phrases {
  private readonly words: readonly string[];
  private readonly fragments: readonly string[];

  constructor(words: readonly string[], fragments: readonly string[] = []) {
    this.words = words.map((it) => folded(it).trim());
    this.fragments = fragments.map((it) => folded(it).trim());
  }

  anyIn(foldedText: string): boolean {
    return (
      this.words.some((it) => hasPhrase(foldedText, it)) ||
      this.fragments.some((it) => foldedText.includes(it))
    );
  }
}
