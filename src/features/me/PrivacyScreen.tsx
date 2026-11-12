import { useState } from "react";

import {
  ButtonStyle,
  CalloutTone,
  OrtusBottomSheet,
  OrtusCallout,
  OrtusCard,
  OrtusIcons,
  OrtusListRow,
  OrtusSpacing,
  OrtusTopBar,
  OrtusWideButton,
  RowTrailing,
  SectionLabel,
} from "@/designsystem";
import { EraseStatus, useServices } from "@/core/data";
import {
  OrtusScreen,
  Reveal,
  usePremiumOffered,
  useResumedOnly,
  type UiText,
} from "@/core/ui";
import { useT } from "@/i18n";
import { goBack } from "@/navigation/routes";
import { PrivacyModel } from "./privacyModel";
import { useScreenModel } from "@/core/ui";

/**
 * S10-07: one switch per consent, and a way to take everything off the device. Once everything
 * is gone the root layout starts over at onboarding, so this screen does not navigate itself.
 */
export function PrivacyScreen() {
  const t = useT();
  const services = useServices();
  const [state, model] = useScreenModel(
    () => new PrivacyModel(services.settings, services.eraser),
  );
  const [confirming, setConfirming] = useState(false);
  const onBack = useResumedOnly(goBack);

  // A failed erase closes the sheet so its callout shows (Kotlin `LaunchedEffect(state.erase)`).
  const erase = () =>
    void model.eraseAll().then(() => {
      if (model.state.current().erase === EraseStatus.Failed)
        setConfirming(false);
    });

  return (
    <>
      <OrtusScreen
        header={
          <OrtusTopBar
            title={t.tf("privacy_title")}
            onBack={onBack}
            backAccessibilityLabel={t.tf("me_back")}
          />
        }
      >
        <Reveal index={0}>
          <SectionLabel text={t.tf("privacy_consents")} />
        </Reveal>
        <Reveal index={1}>
          <OrtusCard contentPadding={OrtusSpacing.none}>
            <OrtusListRow
              title={t.tf("privacy_tips_title")}
              subtitle={t.tf("privacy_tips_subtitle")}
              trailing={RowTrailing.toggle(
                state.personalizedTips,
                (on) => void model.setPersonalizedTips(on),
              )}
              showDivider
            />
            <OrtusListRow
              title={t.tf("privacy_ads_title")}
              subtitle={t.tf("privacy_ads_subtitle")}
              trailing={RowTrailing.toggle(
                state.personalizedAds,
                (on) => void model.setPersonalizedAds(on),
              )}
              showDivider
            />
            <OrtusListRow
              title={t.tf("privacy_analytics_title")}
              subtitle={t.tf("privacy_analytics_subtitle")}
              trailing={RowTrailing.toggle(
                state.analytics,
                (on) => void model.setAnalytics(on),
              )}
              showDivider={services.askAi !== null}
            />
            {services.askAi !== null ? (
              <OrtusListRow
                title={t.tf("privacy_ai_title")}
                subtitle={t.tf("privacy_ai_subtitle")}
                trailing={RowTrailing.toggle(
                  state.aiConsent,
                  (on) => void model.setAiConsent(on),
                )}
              />
            ) : null}
          </OrtusCard>
        </Reveal>
        <Reveal index={2}>
          <OrtusCallout
            text={t.tf("privacy_on_device")}
            tone={CalloutTone.Info}
          />
        </Reveal>
        <Reveal index={3}>
          <SectionLabel text={t.tf("privacy_data")} />
        </Reveal>
        {state.erase === EraseStatus.Failed ? (
          <OrtusCallout
            text={t.tf("privacy_erase_failed")}
            tone={CalloutTone.Warning}
          />
        ) : null}
        <Reveal index={4}>
          <OrtusCard contentPadding={OrtusSpacing.none}>
            <OrtusListRow
              title={t.tf("privacy_erase_title")}
              subtitle={t.tf("privacy_erase_subtitle")}
              icon={OrtusIcons.Close}
              onPress={() => setConfirming(true)}
            />
          </OrtusCard>
        </Reveal>
      </OrtusScreen>
      {confirming ? (
        <EraseSheet
          t={t}
          erasing={state.erase === EraseStatus.Erasing}
          onConfirm={erase}
          onDismiss={() => setConfirming(false)}
        />
      ) : null}
    </>
  );
}

function EraseSheet(props: {
  t: UiText;
  erasing: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const { t, erasing, onConfirm, onDismiss } = props;
  const premiumOffered = usePremiumOffered();
  return (
    <OrtusBottomSheet
      onDismiss={onDismiss}
      title={t.tf("privacy_erase_sheet_title")}
      subtitle={t.tf(
        premiumOffered
          ? "privacy_erase_sheet_body_premium"
          : "privacy_erase_sheet_body",
      )}
    >
      {(close) => (
        <>
          <OrtusWideButton
            text={t.tf("privacy_erase_confirm")}
            onPress={onConfirm}
            enabled={!erasing}
          />
          <OrtusWideButton
            text={t.tf("privacy_erase_cancel")}
            onPress={close}
            variant={ButtonStyle.Outline}
            enabled={!erasing}
          />
        </>
      )}
    </OrtusBottomSheet>
  );
}
