import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';

import { useMembership, useServices, useSettings } from '@/core/data';
import { AdPlacement, todayEpochDay } from '@/core/model';
import { useRemoteValues } from '@/core/telemetry';
import { useAdPlacements } from '@/core/ui';

import { AiModel, type AiUiState } from './aiModel';

/**
 * The Ask AI model for the screen (Kotlin `AiViewModel` + `AiNavigation` wiring): Premium from the
 * membership, limits from remote config, and the ad offer only while the `ai_rewarded` placement
 * may show.
 */
export function useAiModel(): { state: AiUiState; model: AiModel } {
  const services = useServices();
  const membership = useMembership();
  const remote = useRemoteValues(services.telemetry.remote);
  const placements = useAdPlacements();
  const [model] = useState(
    () =>
      new AiModel({
        profiles: services.profile,
        rewardedAds: services.rewardedAds,
        usage: services.askUsage,
        today: todayEpochDay,
        askAi: services.askAi,
        grantAiConsent: () => services.settings.setAiConsent(true),
      }),
  );

  useEffect(() => model.start(), [model]);

  const premium = membership.kind === 'premium';
  const adsOn = placements.has(AdPlacement.AI_REWARDED);
  const limits = useMemo(
    () => (adsOn ? remote.askLimits : { ...remote.askLimits, adsPerDay: 0 }),
    [adsOn, remote.askLimits],
  );
  useEffect(() => model.setAllowance(premium, limits), [model, premium, limits]);

  const aiConsent = useSettings()?.aiConsent ?? false;
  useEffect(() => model.setAiConsent(aiConsent), [model, aiConsent]);

  const state = useSyncExternalStore(model.subscribe, model.getState);
  return { state, model };
}
