import { router } from 'expo-router';

import { type CivilDate, isoDate } from '@/engine';

/**
 * Every screen's path and the one way to open it, so features never import each other
 * (Kotlin: each feature's `navigateToX` plus the app's `OrtusNavHost`).
 *
 * Like the Kotlin graph, only the five tabs live under the tab bar; every other screen is a
 * sibling on the root stack, so the bar steps away while it is open.
 */
export const Paths = {
  today: '/',
  calendar: '/calendar',
  charts: '/charts',
  ai: '/ai',
  me: '/me',
  onboarding: '/onboarding',
  editBirth: '/edit-birth',
  day: '/day/[date]',
  bazi: '/chart/bazi',
  ziwei: '/chart/ziwei',
  natal: '/chart/natal',
  readings: '/readings',
  reading: '/readings/[topic]',
  trio: '/readings/trio',
  match: '/match',
  addPartner: '/match/add',
  matchResult: '/match/[id]',
  profiles: '/me/profiles',
  privacy: '/me/privacy',
  paywall: '/premium/paywall',
  myPlan: '/premium/plan',
  aiSupport: '/ai-support',
} as const;

/** Bottom-bar order. */
export const TABS = ['today', 'calendar', 'charts', 'ai', 'me'] as const;
export type Tab = (typeof TABS)[number];

export type ChartKind = 'bazi' | 'ziwei' | 'natal';

/** One copy of each tab; Back from any tab returns to Today (handled by the tab layout). */
export function navigateToTab(tab: Tab): void {
  router.navigate(Paths[tab]);
}

export function navigateToDay(date: CivilDate): void {
  router.push({ pathname: Paths.day, params: { date: isoDate(date) } });
}

export function navigateToChart(kind: ChartKind): void {
  router.push(Paths[kind]);
}

export function navigateToReadings(): void {
  router.push(Paths.readings);
}

/** [topic] and [lens] are enum key names (e.g. "CAREER", "COMBINED"); the screen parses them. */
export function navigateToReading(topic: string, lens: string): void {
  router.push({ pathname: Paths.reading, params: { topic, lens } });
}

export function navigateToTrio(): void {
  router.push(Paths.trio);
}

export function navigateToMatch(): void {
  router.push(Paths.match);
}

export function navigateToAddPartner(): void {
  router.push(Paths.addPartner);
}

export function navigateToMatchResult(partnerId: number): void {
  router.push({ pathname: Paths.matchResult, params: { id: String(partnerId) } });
}

/** After saving someone: the result replaces the add screen, so Back skips the finished form. */
export function navigateToSavedPartner(partnerId: number): void {
  router.replace({ pathname: Paths.matchResult, params: { id: String(partnerId) } });
}

export function navigateToProfiles(): void {
  router.push(Paths.profiles);
}

export function navigateToPrivacy(): void {
  router.push(Paths.privacy);
}

export function navigateToEditBirth(): void {
  router.push(Paths.editBirth);
}

export function navigateToPaywall(): void {
  router.push(Paths.paywall);
}

export function navigateToMyPlan(): void {
  router.push(Paths.myPlan);
}

export function navigateToAiSupport(): void {
  router.push(Paths.aiSupport);
}

/** Onboarding is done: Today replaces it so Back cannot return to the finished flow. */
export function finishOnboarding(): void {
  router.replace(Paths.today);
}

/**
 * Starts over at onboarding with nothing left in memory: the whole stack is dropped, so no
 * erased chat, chart or half-typed birth data comes back.
 */
export function restartAtOnboarding(): void {
  if (router.canDismiss()) router.dismissAll();
  router.replace(Paths.onboarding);
}

export function goBack(): void {
  if (router.canGoBack()) router.back();
  else router.replace(Paths.today);
}
