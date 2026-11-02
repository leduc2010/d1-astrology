import type { ArrayKey, PluralKey, StringKey } from './generated/keys';

/** A positional format argument, as passed to Android's getString(id, vararg). */
export type FormatArg = string | number;

/** The minimal translate call the helpers need (an i18next `t` fixed to one language). */
export type Translate = (key: string, options: Record<string, unknown>) => unknown;

export type Helpers = {
  /** ≈ stringResource(id, a, b...): positional args fill {{p1}}, {{p2}}... */
  tf: (key: StringKey, ...args: FormatArg[]) => string;
  /** ≈ pluralStringResource(id, count, a, b...): count picks the form, args fill {{p1}}... */
  tp: (key: PluralKey, count: number, ...args: FormatArg[]) => string;
  /** ≈ stringArrayResource(id). */
  ta: (key: ArrayKey) => string[];
};

/**
 * Positional args -> {p1, p2...}. Values are inserted as String(value): like Android's %.1f, any
 * number formatting (decimals, grouping) is the caller's job before passing the value in.
 */
export function positionalParams(args: readonly FormatArg[]): Record<string, string> {
  const params: Record<string, string> = {};
  args.forEach((arg, i) => {
    params[`p${i + 1}`] = String(arg);
  });
  return params;
}

export function makeHelpers(translate: Translate): Helpers {
  return {
    tf: (key, ...args) => String(translate(key, positionalParams(args))),
    tp: (key, count, ...args) => String(translate(key, { ...positionalParams(args), count })),
    ta: (key) => {
      const items = translate(key, { returnObjects: true });
      return Array.isArray(items) ? items.map(String) : [];
    },
  };
}
