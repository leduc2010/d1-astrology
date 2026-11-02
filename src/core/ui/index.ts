/*
 * core/ui: display text and shared screen pieces (mirrors Kotlin `core/ui`).
 *
 * Text-helper convention
 * ----------------------
 * Compose read resources from context inside `@Composable` functions. Here every text helper is
 * a plain function that takes a `UiText` first:
 *
 *     stemBranchName(t, pillar)        hourRange(t, branch)        planetInSign(t, planet, sign)
 *
 * `UiText` is `{ tf, tp, ta, language }`:
 *   - In a component, pass the result of `useT()` from `src/i18n` (it already has that shape and
 *     re-renders the component when the language changes): `const t = useT();`.
 *   - Outside React (view models, notifications, tests), use `currentUiText()`.
 * Helpers that need no strings take no `t` (`stemHan`, `planetGlyph`, `elementColors`). Helpers
 * that only format numbers or dates take a `language` string (`clockText`, `solarDateText`).
 * Hooks (`useX`) exist only where Compose needed composition state: `useResumedOnly`,
 * `useReveal`, `useWidestText`, `useOpenLink`, `usePremiumOffered`, `useAdPlacements`.
 */

export { capitalized, currentUiText, fillTemplate, itemOf, type UiText } from './uiText';

export * from './ganZhiText';
export * from './almanacText';
export * from './chartText';
export * from './natalText';
export * from './ziWeiText';
export * from './dateText';
export * from './elementStyle';
export * from './textItems';

export * from './appLanguage';
export * from './navigationGuard';
export * from './textWidth';
export * from './reveal';
export * from './placements';
export * from './legalLinks';
export * from './readingBits';

export * from './ortusScreen';
export * from './placeholderSection';
export * from './pillarTile';
export * from './peopleBits';
export * from './strengthCard';
export * from './hoursGrid';
export * from './sampleNativeAd';

export * from './birth/birthDates';
export * from './birth/birthPlaceText';
export * from './birth/birthWheels';
