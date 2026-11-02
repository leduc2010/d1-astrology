/**
 * Mirrors the Kotlin repo's build/check_locales.py on the generated JSON: same names as English
 * (minus translatable="false"), same placeholders per string and array item, array lengths, and
 * plural forms that cover every category the runtime will ask for.
 */
import { ARRAY_KEYS, PLURAL_KEYS, STRING_KEYS, UNTRANSLATABLE_KEYS } from '../generated/keys';
import { SUPPORTED_LANGUAGES } from '../languages';
import { LOCALE_STRINGS, type LocaleStrings } from '../resources';

const QUANTITIES = ['zero', 'one', 'two', 'few', 'many', 'other'];
const PLACEHOLDER = /\{\{(\w+)\}\}/g;
const OPTIONAL_PLACEHOLDER_FORMS = new Set(['zero', 'one', 'two']);

const en = LOCALE_STRINGS.en;
const untranslatable = new Set<string>(UNTRANSLATABLE_KEYS);
const pluralNames = new Set<string>(PLURAL_KEYS);
const others = SUPPORTED_LANGUAGES.map((l) => l.code).filter((c) => c !== 'en');

function placeholders(text: string): string[] {
  return [...new Set([...text.matchAll(PLACEHOLDER)].map((m) => m[1]))].sort();
}

/** Resource names in a flat file, plural suffixes folded back onto their name. */
function resourceNames(strings: LocaleStrings): Set<string> {
  return new Set(
    Object.keys(strings).map((key) => {
      const m = key.match(/^(.*)_(zero|one|two|few|many|other)$/);
      return m && pluralNames.has(m[1]) ? m[1] : key;
    }),
  );
}

function pluralForms(strings: LocaleStrings, name: string): Record<string, string> {
  const forms: Record<string, string> = {};
  for (const q of QUANTITIES) {
    const text = strings[`${name}_${q}`];
    if (typeof text === 'string') forms[q] = text;
  }
  return forms;
}

describe('English source', () => {
  it('holds every generated key list', () => {
    const names = resourceNames(en);
    expect([...names].sort()).toEqual([...STRING_KEYS, ...ARRAY_KEYS, ...PLURAL_KEYS].sort());
  });

  it('has no unconverted Java format specifiers or Android escapes', () => {
    for (const strings of Object.values(LOCALE_STRINGS)) {
      for (const value of Object.values(strings)) {
        for (const text of ([] as string[]).concat(value)) {
          // No space flag here: "{{p1}} % sparen" (from "%1$d %% sparen") is a correct literal percent.
          expect(text).not.toMatch(/%(\d+\$)?[-#+0,(]*\d*(\.\d+)?[sdfcx]|\\['"nt@?u]/);
        }
      }
    }
  });
});

describe.each(others)('%s', (code) => {
  const strings = LOCALE_STRINGS[code];

  it('has exactly the English names minus translatable="false"', () => {
    const want = [...resourceNames(en)].filter((n) => !untranslatable.has(n)).sort();
    expect([...resourceNames(strings)].sort()).toEqual(want);
  });

  it('keeps the placeholders of every string', () => {
    const mismatches = STRING_KEYS.filter((k) => !untranslatable.has(k) && typeof strings[k] === 'string')
      .filter((k) => placeholders(strings[k] as string).join() !== placeholders(en[k] as string).join());
    expect(mismatches).toEqual([]);
  });

  it('keeps array lengths and item placeholders', () => {
    for (const key of ARRAY_KEYS.filter((k) => !untranslatable.has(k))) {
      const ours = en[key] as readonly string[];
      const theirs = strings[key] as readonly string[];
      expect({ key, length: theirs.length }).toEqual({ key, length: ours.length });
      theirs.forEach((item, i) => {
        expect({ key, i, p: placeholders(item) }).toEqual({ key, i, p: placeholders(ours[i]) });
      });
    }
  });

  it('has plural forms for every category the runtime selects, with matching placeholders', () => {
    const categories = new Intl.PluralRules(code).resolvedOptions().pluralCategories;
    for (const name of PLURAL_KEYS.filter((k) => !untranslatable.has(k))) {
      const forms = pluralForms(strings, name);
      const ref = placeholders(Object.values(pluralForms(en, name)).join(' '));
      expect({ name, missing: categories.filter((c) => !(c in forms)) }).toEqual({ name, missing: [] });
      for (const [q, text] of Object.entries(forms)) {
        const got = placeholders(text);
        if (got.length > 0 && !OPTIONAL_PLACEHOLDER_FORMS.has(q)) {
          expect({ name, q, got }).toEqual({ name, q, got: ref });
        }
      }
    }
  });
});
