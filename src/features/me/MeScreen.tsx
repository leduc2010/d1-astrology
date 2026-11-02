import { useState } from "react";
import { StyleSheet } from "react-native";

import {
  Disclaimer,
  OrtusColors,
  OrtusRootHeader,
  OrtusSpacing,
  OrtusText,
} from "@/designsystem";
import { useServices } from "@/core/data";
import { hasAnyLink } from "@/core/model";
import {
  LanguageSheet,
  OrtusScreen,
  Reveal,
  usePremiumOffered,
  useResumedOnly,
  APP_LINKS,
  APP_VERSION,
  useScreenModel,
} from "@/core/ui";
import { useT } from "@/i18n";
import {
  navigateToMyPlan,
  navigateToPaywall,
  navigateToPrivacy,
  navigateToProfiles,
} from "@/navigation/routes";
import { MeModel } from "./meModel";
import {
  AboutSection,
  AccountSection,
  CalendarSection,
  type MeActions,
  Preferences,
  PremiumRow,
  ProfileCard,
  WeekStartSheet,
} from "./meSections";

type MeSheet = "None" | "Language" | "WeekStart";

/** S10: the Me tab — who the app is about, preferences, account, and help. */
export function MeScreen() {
  const t = useT();
  const services = useServices();
  const [state, model] = useScreenModel(
    () =>
      new MeModel(
        services.settings,
        services.profile,
        services.partners,
        services.billing,
      ),
  );
  const premiumOffered = usePremiumOffered();
  const [sheet, setSheet] = useState<MeSheet>("None");
  const actions: MeActions = {
    onSoundChange: (enabled) => void model.setSoundEnabled(enabled),
    onReducedMotionChange: (enabled) => void model.setReducedMotion(enabled),
    onWeekStartChange: (weekStart) => void model.setWeekStart(weekStart),
    onShowLunarChange: (enabled) => void model.setShowLunarInCalendar(enabled),
    onOpenProfiles: useResumedOnly(navigateToProfiles),
    onOpenPrivacy: useResumedOnly(navigateToPrivacy),
    onOpenPaywall: useResumedOnly(navigateToPaywall),
    onOpenPlan: useResumedOnly(navigateToMyPlan),
  };
  const closeSheet = () => setSheet("None");

  return (
    <>
      <OrtusScreen
        header={
          <OrtusRootHeader
            label={t.tf("me_header_label")}
            title={t.tf("me_header_title")}
          />
        }
      >
        {state.owner ? (
          <ProfileCard
            t={t}
            owner={state.owner}
            premium={state.premium}
            onPress={actions.onOpenProfiles}
          />
        ) : null}
        {premiumOffered ? (
          <PremiumRow t={t} premium={state.premium} actions={actions} />
        ) : null}
        <Preferences
          t={t}
          state={state}
          actions={actions}
          startIndex={2}
          onOpenLanguage={() => setSheet("Language")}
        />
        <CalendarSection
          t={t}
          state={state}
          actions={actions}
          startIndex={4}
          onOpenWeekStart={() => setSheet("WeekStart")}
        />
        <AccountSection t={t} state={state} actions={actions} startIndex={6} />
        {hasAnyLink(APP_LINKS) ? (
          <AboutSection
            t={t}
            links={APP_LINKS}
            appVersion={APP_VERSION}
            startIndex={8}
          />
        ) : null}
        <Reveal index={10} style={styles.footer}>
          <Disclaimer text={t.tf("me_disclaimer")} />
          <OrtusText
            variant="caption"
            color={OrtusColors.textMuted}
            style={styles.centered}
          >
            {t.tf("me_version", APP_VERSION)}
          </OrtusText>
        </Reveal>
      </OrtusScreen>
      {sheet === "Language" ? (
        <LanguageSheet
          onDismiss={closeSheet}
          onChosen={(code) => void model.setLanguage(code)}
        />
      ) : null}
      {sheet === "WeekStart" ? (
        <WeekStartSheet
          t={t}
          selected={state.weekStart}
          onSelect={actions.onWeekStartChange}
          onDismiss={closeSheet}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  footer: { alignItems: "center", gap: OrtusSpacing.xs },
  centered: { textAlign: "center" },
});
