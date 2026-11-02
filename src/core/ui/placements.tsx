import { createContext, useContext } from 'react';

import { AD_PLACEMENTS, type AdPlacement } from '../model';

/*
 * App-wide switches screens read without prop drilling (Compose CompositionLocals). The app root
 * provides them; the defaults are what a screen sees in tests and previews.
 */

/**
 * Whether this build sells Premium at all. False until a real store is wired: no plan row,
 * paywall link, Premium teaser or Premium wording is shown.
 */
const PremiumOfferedContext = createContext(false);

export const PremiumOfferedProvider = PremiumOfferedContext.Provider;
export const usePremiumOffered = (): boolean => useContext(PremiumOfferedContext);

/**
 * The ad placements that may show right now. The app provides it from remote config and the
 * membership: empty for Premium members, so every ad slot stays empty.
 */
const AdPlacementsContext = createContext<ReadonlySet<AdPlacement>>(new Set(AD_PLACEMENTS));

export const AdPlacementsProvider = AdPlacementsContext.Provider;
export const useAdPlacements = (): ReadonlySet<AdPlacement> => useContext(AdPlacementsContext);
