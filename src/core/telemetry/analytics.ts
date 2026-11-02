/**
 * Product analytics. Nothing is sent until `setEnabled(true)` is called with the owner's consent,
 * and events carry only screen names: never birth data, names or places.
 */
export interface Analytics {
  setEnabled(enabled: boolean): void;
  log(event: AnalyticsEvent): void;
}

/** Analytics that drops everything; used when the build has no analytics backend. */
export const NoOpAnalytics: Analytics = Object.freeze({
  setEnabled: () => undefined,
  log: () => undefined,
});

/** The only event the app logs. Its one parameter is a sanitised screen name. */
export interface ScreenViewEvent {
  readonly name: typeof SCREEN_VIEW;
  readonly screen: string;
  readonly params: Readonly<Record<string, string>>;
}

export type AnalyticsEvent = ScreenViewEvent;

export const SCREEN_VIEW = 'screen_view';
const SCREEN_NAME_PARAM = 'screen_name';
const MAX_SCREEN_NAME = 40;
/** expo-router's index route is the Today tab; its segments are empty. */
const ROOT_SCREEN = 'today';

export function screenViewEvent(screen: string): ScreenViewEvent {
  return Object.freeze({
    name: SCREEN_VIEW,
    screen,
    params: Object.freeze({ [SCREEN_NAME_PARAM]: screen }),
  });
}

/** A screen view for a Kotlin-style route string, or null when it names no screen. */
export function screenViewOf(route: string | null | undefined): ScreenViewEvent | null {
  const screen = screenNameOf(route);
  return screen === null ? null : screenViewEvent(screen);
}

/**
 * A safe screen name for a route (Kotlin `screenNameOf`): the route's class name in snake case,
 * without the package, the `Route` suffix or any argument, so no birth data can leak into it.
 */
export function screenNameOf(route: string | null | undefined): string | null {
  const base = (route ?? '').split('/')[0].split('?')[0];
  const simple = base.slice(base.lastIndexOf('.') + 1).replace(/Route$/, '');
  return sanitize(simple.replace(/([a-z0-9])([A-Z])/g, '$1_$2'));
}

/**
 * RN addition: a screen name from expo-router segments (`useSegments()`), e.g.
 * `['match', '[id]']` -> `match_id`. Pass segments, never `usePathname()`: segments keep the
 * parameter names, a pathname carries their values.
 */
export function screenNameOfSegments(segments: readonly string[]): string | null {
  const parts = segments
    .filter((s) => !(s.startsWith('(') && s.endsWith(')')))
    .map((s) => s.replace(/^\[+\.{0,3}|\]+$/g, ''))
    .filter((s) => s.length > 0 && s !== 'index');
  return parts.length === 0 ? ROOT_SCREEN : sanitize(parts.join('_').replace(/-/g, '_'));
}

function sanitize(name: string): string | null {
  const clean = name.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, MAX_SCREEN_NAME);
  return clean.length === 0 ? null : clean;
}
