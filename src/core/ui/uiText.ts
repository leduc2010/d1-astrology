import { type FormatArg, getAppLanguage, type Helpers, ta, tf, tp } from '../../i18n';

/**
 * What every text helper in core/ui and core/reading takes as its first argument: the i18n
 * helpers plus the language they speak. `useT()` returns one (re-renders on language change);
 * `currentUiText()` builds one outside React.
 */
export type UiText = Helpers & { readonly language: string };

/** The global helpers in the current app language, for code outside a component. */
export function currentUiText(): UiText {
  return { tf, tp, ta, language: getAppLanguage() };
}

/** Item `index` of a string array; empty if the locale's array is short. */
export function itemOf(items: readonly string[], index: number): string {
  return items[index] ?? '';
}

/**
 * Fills `{{p1}}`, `{{p2}}`... in an array item. i18next does not interpolate items read with
 * `returnObjects`, so array templates (like Android's `.format`) are filled here.
 */
export function fillTemplate(template: string, ...args: FormatArg[]): string {
  return template.replace(/\{\{p(\d+)\}\}/g, (match, n: string) => {
    const value = args[Number(n) - 1];
    return value === undefined ? match : String(value);
  });
}

/** First character in title case, as Kotlin `replaceFirstChar { it.titlecase(locale) }`. */
export function capitalized(text: string, language: string): string {
  if (text.length === 0) return text;
  const first = String.fromCodePoint(text.codePointAt(0) ?? 0);
  return first.toLocaleUpperCase(language) + text.slice(first.length);
}
