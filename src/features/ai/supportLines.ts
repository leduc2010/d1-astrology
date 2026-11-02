import type { StringKey } from '@/i18n';

/**
 * Somewhere to turn: a free line to call, or a directory of them. The first one is tried first.
 * A phone [number] is shown as written and dialled digits only; an empty one opens the dialler blank.
 */
export type SupportLine =
  | { kind: 'phone'; name: StringKey; detail: StringKey; number: string; primary: boolean }
  | { kind: 'web'; name: StringKey; detail: StringKey; url: string; primary: boolean };

/** The lines for one place, under a heading, with what to do when in danger right now. */
export type SupportLines = {
  heading: StringKey;
  lines: readonly SupportLine[];
  danger: StringKey;
};

/** Directory of free, vetted helplines by country (ThroughLine), for places with no list here. */
export const HELPLINE_DIRECTORY_URL = 'https://findahelpline.com';

function phone(name: StringKey, detail: StringKey, number: string, primary = false): SupportLine {
  return { kind: 'phone', name, detail, number, primary };
}

const VIETNAM: SupportLines = {
  heading: 'ai_support_country',
  lines: [
    phone('ai_support_mind_name', 'ai_support_mind_detail', '096 306 1414', true),
    phone('ai_support_emergency_name', 'ai_support_emergency_detail', '115'),
    phone('ai_support_child_name', 'ai_support_child_detail', '111'),
  ],
  danger: 'ai_support_danger',
};

/**
 * Anywhere else: no number is guessed (a wrong one in a crisis is worse than none), so the
 * directory leads and the local emergency number is one tap into the dialler.
 */
const ELSEWHERE: SupportLines = {
  heading: 'ai_support_world',
  lines: [
    {
      kind: 'web',
      name: 'ai_support_find_name',
      detail: 'ai_support_find_detail',
      url: HELPLINE_DIRECTORY_URL,
      primary: true,
    },
    phone('ai_support_local_name', 'ai_support_local_detail', ''),
  ],
  danger: 'ai_support_danger_world',
};

/** Picks the lines for [countryIso] (ISO 3166 alpha-2, any case; blank when unknown). */
export function supportLinesFor(countryIso: string): SupportLines {
  return countryIso.toUpperCase() === 'VN' ? VIETNAM : ELSEWHERE;
}

/** The number as dialled: digits only, so "096 306 1414" becomes "0963061414". */
export function dialDigits(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '');
}
