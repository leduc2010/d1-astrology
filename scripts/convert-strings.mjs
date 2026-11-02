#!/usr/bin/env node
/**
 * Converts the Kotlin app's Android string resources into i18next JSON, one flat file per locale.
 *
 * Usage: node scripts/convert-strings.mjs [androidRoot] [outDir]   (npm run i18n:convert)
 *   androidRoot defaults to $ORTUS_ANDROID_ROOT or the Kotlin reference worktree; outDir to src/i18n.
 *
 * Output (deterministic, sorted keys), under outDir:
 *   locales/<code>.json   flat { resourceName: string | string[] }
 *   generated/keys.ts     key lists and key types for the typed helpers and tests
 *
 * Rules, mirroring aapt2 + Resources.getString:
 * - <string> -> string, <string-array> -> string[], <plurals> -> name_<quantity> (i18next v4 suffixes).
 *   Other resource types (color, style, array, dimen...) are ignored.
 * - translatable="false" entries of the default file are emitted in en only; other locales fall back.
 * - Escapes \' \" \\ \n \t \@ \? \# \uXXXX; unescaped double quotes toggle "preserve whitespace" and are
 *   removed; outside quotes runs of whitespace collapse to one space and the ends are trimmed.
 * - XML entities and CDATA are decoded by the parser. Inline markup (<b>, <i>, <u>, <xliff:g>...) is
 *   dropped and its inner text kept: stringResource() returns unstyled text, so plain text is parity.
 * - Java format specifiers become i18next variables: %1$s / %2$d / %1$.1f -> {{p1}} / {{p2}} / {{p1}};
 *   unindexed %s %d take the next ordinary index ({{p1}}, {{p2}}...); %% -> %. Format details such as
 *   ".1f" are dropped: the caller formats the number before passing it.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RN_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_ANDROID_ROOT = 'D:/DLAB/d1-astrology/.claude/worktrees/react-native-port-22002a';
const DEFAULT_OUT_DIR = join(RN_ROOT, 'src', 'i18n');

/** App locale codes, English first; order matches the Kotlin AppLanguage list (plus en default). */
const LOCALES = ['en', 'vi', 'es', 'pt-BR', 'fr', 'de', 'ru', 'hi', 'id', 'ko', 'zh', 'ar', 'nl', 'bn'];
/** Android's legacy ISO 639 codes. */
const LEGACY_LANGUAGE = { in: 'id', iw: 'he', ji: 'yi' };
const PLURAL_QUANTITIES = ['zero', 'one', 'two', 'few', 'many', 'other'];
/** Non-UI resources (Google Fonts provider certificates), skipped like build/check_locales.py does. */
const SKIP_FILES = new Set(['font_certs.xml']);
const SKIP_DIRS = new Set(['build', 'node_modules', '.git', '.gradle', '.idea', 'src/test', 'src/androidTest']);

// ---------------------------------------------------------------- XML parsing

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decodeEntities(text, where) {
  return text.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, (whole, body) => {
    if (body.startsWith('#x')) return String.fromCodePoint(parseInt(body.slice(2), 16));
    if (body.startsWith('#')) return String.fromCodePoint(parseInt(body.slice(1), 10));
    if (body in ENTITIES) return ENTITIES[body];
    throw new Error(`${where}: unknown entity ${whole}`);
  });
}

function parseAttributes(source, where) {
  const attrs = {};
  for (const m of source.matchAll(/([\w:.-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) {
    attrs[m[1]] = decodeEntities(m[3] ?? m[4], where);
  }
  return attrs;
}

/** Minimal XML parser: elements, attributes, text, entities, CDATA, comments, PI. Returns the root element. */
function parseXml(source, where) {
  const root = { tag: '#document', attrs: {}, children: [] };
  const stack = [root];
  let i = 0;
  const top = () => stack[stack.length - 1];
  while (i < source.length) {
    if (source.startsWith('<!--', i)) {
      i = indexAfter(source, '-->', i, where);
    } else if (source.startsWith('<![CDATA[', i)) {
      const end = source.indexOf(']]>', i);
      if (end < 0) throw new Error(`${where}: unterminated CDATA`);
      top().children.push(source.slice(i + 9, end));
      i = end + 3;
    } else if (source.startsWith('<?', i) || source.startsWith('<!', i)) {
      i = indexAfter(source, '>', i, where);
    } else if (source.startsWith('</', i)) {
      const end = indexAfter(source, '>', i, where);
      const tag = source.slice(i + 2, end - 1).trim();
      const open = stack.pop();
      if (!open || open.tag !== tag) throw new Error(`${where}: </${tag}> does not close <${open?.tag}>`);
      i = end;
    } else if (source[i] === '<') {
      const end = indexAfter(source, '>', i, where);
      const body = source.slice(i + 1, end - 1);
      const selfClosing = body.endsWith('/');
      const inner = selfClosing ? body.slice(0, -1) : body;
      const tag = inner.match(/^[\w:.-]+/)?.[0];
      if (!tag) throw new Error(`${where}: bad tag <${body}>`);
      const element = { tag, attrs: parseAttributes(inner.slice(tag.length), where), children: [] };
      top().children.push(element);
      if (!selfClosing) stack.push(element);
      i = end;
    } else {
      const next = source.indexOf('<', i);
      const end = next < 0 ? source.length : next;
      top().children.push(decodeEntities(source.slice(i, end), where));
      i = end;
    }
  }
  if (stack.length !== 1) throw new Error(`${where}: unclosed <${top().tag}>`);
  const element = root.children.find((c) => typeof c !== 'string');
  if (!element) throw new Error(`${where}: no root element`);
  return element;
}

function indexAfter(source, token, from, where) {
  const at = source.indexOf(token, from);
  if (at < 0) throw new Error(`${where}: expected ${token}`);
  return at + token.length;
}

/** Character data of a node with inline markup removed (styling spans and xliff:g keep their text). */
function innerText(node) {
  return node.children.map((c) => (typeof c === 'string' ? c : innerText(c))).join('');
}

// ---------------------------------------------------------------- Android string semantics

const WHITESPACE = /[ \t\n\r\f\v]/;
const SIMPLE_ESCAPES = { n: '\n', t: '\t' };

/** aapt2 StringBuilder: escapes, quote toggling, whitespace collapsing and trimming. */
function androidUnescape(raw, where) {
  /** Each output char remembers whether it may be collapsed/trimmed (unquoted, unescaped whitespace). */
  const out = [];
  let quoted = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c === '\\') {
      const next = raw[++i];
      if (next === undefined) throw new Error(`${where}: trailing backslash`);
      if (next === 'u') {
        const hex = raw.slice(i + 1, i + 5);
        if (!/^[0-9a-fA-F]{4}$/.test(hex)) throw new Error(`${where}: bad \\u escape`);
        out.push({ c: String.fromCharCode(parseInt(hex, 16)), soft: false });
        i += 4;
      } else {
        out.push({ c: SIMPLE_ESCAPES[next] ?? next, soft: false });
      }
    } else if (c === '"') {
      quoted = !quoted;
    } else if (!quoted && WHITESPACE.test(c)) {
      const last = out[out.length - 1];
      if (!(last?.soft)) out.push({ c: ' ', soft: true });
    } else {
      out.push({ c, soft: false });
    }
  }
  if (quoted) throw new Error(`${where}: unbalanced double quote`);
  while (out.length && out[0].soft) out.shift();
  while (out.length && out[out.length - 1].soft) out.pop();
  return out.map((o) => o.c).join('');
}

const FORMAT_SPEC = /%(?:(\d+)\$)?([-#+ 0,(<]*)(\d+)?(\.\d+)?([a-zA-Z%])/g;
/** Conversions the app uses (same set as build/check_locales.py); anything else fails loudly. */
const CONVERSIONS = new Set(['s', 'S', 'd', 'f', 'x', 'X', 'c']);

/** Java format specifiers -> {{pN}}; returns the converted text. */
function convertPlaceholders(text, where) {
  let ordinary = 0;
  return text.replace(FORMAT_SPEC, (whole, index, flags, width, precision, conversion) => {
    if (conversion === '%') return '%';
    if (conversion === 'n') return '\n';
    if (!CONVERSIONS.has(conversion)) throw new Error(`${where}: unsupported format "${whole}"`);
    if (flags.includes('<')) throw new Error(`${where}: relative index "${whole}" unsupported`);
    const n = index ? Number(index) : ++ordinary;
    return `{{p${n}}}`;
  });
}

function convertText(node, where) {
  const text = innerText(node);
  if (/^\s*@(string|array|plurals)\//.test(text)) throw new Error(`${where}: resource references unsupported`);
  if (text.includes('{{') || text.includes('$t(')) throw new Error(`${where}: i18next syntax in source text`);
  return convertPlaceholders(androidUnescape(text, where), where);
}

// ---------------------------------------------------------------- resource collection

/** Folder qualifier -> app locale code, or null when the folder is not a plain language folder. */
function localeOf(folder) {
  if (folder === 'values') return 'en';
  const m = folder.match(/^values-([a-z]{2,3})(?:-r([A-Z]{2}))?$/);
  if (!m) return null;
  const language = LEGACY_LANGUAGE[m[1]] ?? m[1];
  return m[2] ? `${language}-${m[2]}` : language;
}

function findResDirs(dir, found = []) {
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name);
    if (!statSync(path).isDirectory() || SKIP_DIRS.has(name)) continue;
    const rel = relative(dir, path).replace(/\\/g, '/');
    if (SKIP_DIRS.has(rel)) continue;
    if (path.replace(/\\/g, '/').endsWith('src/main/res')) found.push(path);
    else findResDirs(path, found);
  }
  return found;
}

/** One file's string resources: [{ name, kind, value, translatable }]. */
function readResourceFile(path, where) {
  const root = parseXml(readFileSync(path, 'utf8'), where);
  if (root.tag !== 'resources') return [];
  const entries = [];
  for (const el of root.children) {
    if (typeof el === 'string') continue;
    const name = el.attrs.name;
    const at = `${where} ${el.tag} ${name}`;
    const translatable = el.attrs.translatable !== 'false';
    if (el.tag === 'string') {
      entries.push({ name, kind: 'string', value: convertText(el, at), translatable });
    } else if (el.tag === 'string-array') {
      const items = el.children.filter((c) => typeof c !== 'string' && c.tag === 'item');
      entries.push({ name, kind: 'array', value: items.map((it, i) => convertText(it, `${at}[${i}]`)), translatable });
    } else if (el.tag === 'plurals') {
      const forms = {};
      for (const it of el.children) {
        if (typeof it === 'string' || it.tag !== 'item') continue;
        const q = it.attrs.quantity;
        if (!PLURAL_QUANTITIES.includes(q)) throw new Error(`${at}: bad quantity ${q}`);
        forms[q] = convertText(it, `${at}[${q}]`);
      }
      if (!forms.other) throw new Error(`${at}: plurals without "other"`);
      entries.push({ name, kind: 'plurals', value: forms, translatable });
    }
  }
  return entries;
}

function collect(androidRoot) {
  /** locale -> name -> { kind, value, translatable, origin } */
  const byLocale = Object.fromEntries(LOCALES.map((l) => [l, new Map()]));
  const collisions = [];
  for (const resDir of findResDirs(androidRoot)) {
    const module = relative(androidRoot, resDir).replace(/\\/g, '/').replace('/src/main/res', '');
    for (const folder of readdirSync(resDir).sort()) {
      if (!folder.startsWith('values')) continue;
      const locale = localeOf(folder);
      if (locale === null) continue;
      if (!byLocale[locale]) throw new Error(`${module}/${folder}: locale ${locale} is not in LOCALES`);
      for (const file of readdirSync(join(resDir, folder)).filter((f) => f.endsWith('.xml') && !SKIP_FILES.has(f)).sort()) {
        const origin = `${module}/${folder}/${file}`;
        for (const entry of readResourceFile(join(resDir, folder, file), origin)) {
          const seen = byLocale[locale].get(entry.name);
          if (seen) collisions.push(`${locale}: ${entry.name} in ${seen.origin} and ${origin}`);
          byLocale[locale].set(entry.name, { ...entry, origin });
        }
      }
    }
  }
  if (collisions.length) throw new Error(`Resource name collisions:\n${collisions.join('\n')}`);
  return byLocale;
}

// ---------------------------------------------------------------- output

function flatten(entries, locale, defaults, notes) {
  const out = {};
  for (const [name, entry] of entries) {
    const base = defaults.get(name);
    if (locale !== 'en') {
      if (!base) {
        notes.push(`${locale}: extra ${entry.kind} ${name} (${entry.origin}) dropped`);
        continue;
      }
      if (!base.translatable) notes.push(`${locale}: overrides non-translatable ${name}`);
      if (base.kind !== entry.kind) throw new Error(`${entry.origin}: ${name} is ${entry.kind}, en has ${base.kind}`);
    }
    if (entry.kind === 'plurals') {
      for (const [q, text] of Object.entries(entry.value)) out[`${name}_${q}`] = text;
    } else {
      out[name] = entry.value;
    }
  }
  return out;
}

function sortedJson(object) {
  const sorted = Object.fromEntries(Object.keys(object).sort().map((k) => [k, object[k]]));
  return `${JSON.stringify(sorted, null, 2)}\n`;
}

function keysModule(defaults) {
  const names = (pred) => [...defaults.values()].filter(pred).map((e) => e.name).sort();
  const list = (items) => items.map((k) => `  '${k}',`).join('\n');
  const block = (title, constName, items) =>
    `/** ${title} */\nexport const ${constName} = [\n${list(items)}\n] as const;\n`;
  return [
    '// Generated by scripts/convert-strings.mjs from the Android resources. Do not edit.',
    '',
    block('<string> resource names.', 'STRING_KEYS', names((e) => e.kind === 'string')),
    block('<string-array> resource names.', 'ARRAY_KEYS', names((e) => e.kind === 'array')),
    block('<plurals> resource names (JSON keys carry _one/_other... suffixes).', 'PLURAL_KEYS', names((e) => e.kind === 'plurals')),
    block('translatable="false" names: present in en only.', 'UNTRANSLATABLE_KEYS', names((e) => !e.translatable)),
    'export type StringKey = (typeof STRING_KEYS)[number];',
    'export type ArrayKey = (typeof ARRAY_KEYS)[number];',
    'export type PluralKey = (typeof PLURAL_KEYS)[number];',
    '',
  ].join('\n');
}

function main() {
  const androidRoot = resolve(process.argv[2] ?? process.env.ORTUS_ANDROID_ROOT ?? DEFAULT_ANDROID_ROOT);
  if (!existsSync(androidRoot)) throw new Error(`Android root not found: ${androidRoot}`);
  const byLocale = collect(androidRoot);
  const defaults = byLocale.en;
  const notes = [];
  const outDir = resolve(process.argv[3] ?? DEFAULT_OUT_DIR);
  const outLocales = join(outDir, 'locales');
  const outKeys = join(outDir, 'generated', 'keys.ts');
  mkdirSync(outLocales, { recursive: true });
  mkdirSync(dirname(outKeys), { recursive: true });
  for (const locale of LOCALES) {
    const flat = flatten(byLocale[locale], locale, defaults, notes);
    writeFileSync(join(outLocales, `${locale}.json`), sortedJson(flat));
    console.log(`${locale}: ${byLocale[locale].size} resources, ${Object.keys(flat).length} keys`);
  }
  writeFileSync(outKeys, keysModule(defaults));
  for (const note of notes) console.warn(`note: ${note}`);
}

main();
