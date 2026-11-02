import { StyleSheet, View } from "react-native";

import {
  OrtusBottomSheet,
  OrtusCard,
  OrtusColors,
  OrtusGlowCard,
  OrtusIcons,
  OrtusListRow,
  OrtusRadioOption,
  OrtusSizes,
  OrtusSpacing,
  OrtusText,
  PremiumTag,
  RowTrailing,
  SectionLabel,
  type OrtusIconComponent,
} from "@/designsystem";
import { type AppLinks, WeekStart } from "@/core/model";
import {
  currentLanguageLabel,
  premiumPlanName,
  Reveal,
  useOpenLink,
  type UiText,
} from "@/core/ui";
import type { MeUiState, PremiumStatus } from "./meModel";
import { PersonSeal, personDetail, weekStartName } from "./personBits";
import type { PersonSummary } from "./personSummary";

/** Everything the Me page can change or open. */
export type MeActions = {
  readonly onSoundChange: (enabled: boolean) => void;
  readonly onReducedMotionChange: (enabled: boolean) => void;
  readonly onWeekStartChange: (weekStart: WeekStart) => void;
  readonly onShowLunarChange: (enabled: boolean) => void;
  readonly onOpenProfiles: () => void;
  readonly onOpenPrivacy: () => void;
  readonly onOpenPaywall: () => void;
  readonly onOpenPlan: () => void;
};

const premiumTagText = (t: UiText, premium: PremiumStatus): string =>
  premium.trialDaysLeft === null
    ? t.tf("me_premium")
    : t.tp("me_premium_trial", premium.trialDaysLeft, premium.trialDaysLeft);

/** S10-01: who the app is about, opening the profiles list. */
export function ProfileCard(props: {
  t: UiText;
  owner: PersonSummary;
  premium: PremiumStatus | null;
  onPress: () => void;
}) {
  const { t, owner, premium, onPress } = props;
  return (
    <Reveal index={0}>
      <OrtusGlowCard onPress={onPress}>
        <View style={styles.profileRow}>
          <PersonSeal person={owner} size={OrtusSizes.matchSeal} />
          <View style={styles.profileText}>
            <OrtusText variant="subtitle" color={OrtusColors.textPrimary}>
              {owner.name}
            </OrtusText>
            <OrtusText variant="caption" color={OrtusColors.textSecondary}>
              {personDetail(t, owner)}
            </OrtusText>
            {premium ? (
              <PremiumTag
                text={premiumTagText(t, premium)}
                style={styles.premiumTag}
              />
            ) : null}
          </View>
        </View>
      </OrtusGlowCard>
    </Reveal>
  );
}

export function PremiumRow({
  t,
  premium,
  actions,
}: {
  t: UiText;
  premium: PremiumStatus | null;
  actions: MeActions;
}) {
  return (
    <Reveal index={1}>
      <OrtusCard contentPadding={OrtusSpacing.none}>
        <OrtusListRow
          title={t.tf("me_premium_title")}
          subtitle={
            premium
              ? t.tf("me_premium_member", premiumPlanName(t, premium.plan))
              : t.tf("me_premium_free")
          }
          icon={OrtusIcons.Sparkle}
          onPress={premium ? actions.onOpenPlan : actions.onOpenPaywall}
        />
      </OrtusCard>
    </Reveal>
  );
}

type SectionProps = {
  t: UiText;
  state: MeUiState;
  actions: MeActions;
  startIndex: number;
};

export function Preferences({
  t,
  state,
  actions,
  startIndex,
  onOpenLanguage,
}: SectionProps & { onOpenLanguage: () => void }) {
  return (
    <>
      <Reveal index={startIndex}>
        <SectionLabel text={t.tf("me_section_preferences")} />
      </Reveal>
      <Reveal index={startIndex + 1}>
        <OrtusCard contentPadding={OrtusSpacing.none}>
          <OrtusListRow
            title={t.tf("me_language_title")}
            icon={OrtusIcons.Globe}
            trailing={RowTrailing.value(currentLanguageLabel(t))}
            showDivider
            onPress={onOpenLanguage}
          />
          <OrtusListRow
            title={t.tf("me_sound_title")}
            subtitle={t.tf("me_sound_subtitle")}
            icon={OrtusIcons.Bell}
            trailing={RowTrailing.toggle(
              state.soundEnabled,
              actions.onSoundChange,
            )}
            showDivider
          />
          <OrtusListRow
            title={t.tf("me_motion_title")}
            subtitle={t.tf("me_motion_subtitle")}
            icon={OrtusIcons.Moon}
            trailing={RowTrailing.toggle(
              state.reducedMotion,
              actions.onReducedMotionChange,
            )}
          />
        </OrtusCard>
      </Reveal>
    </>
  );
}

export function CalendarSection({
  t,
  state,
  actions,
  startIndex,
  onOpenWeekStart,
}: SectionProps & { onOpenWeekStart: () => void }) {
  return (
    <>
      <Reveal index={startIndex}>
        <SectionLabel text={t.tf("me_section_calendar")} />
      </Reveal>
      <Reveal index={startIndex + 1}>
        <OrtusCard contentPadding={OrtusSpacing.none}>
          <OrtusListRow
            title={t.tf("me_week_start_title")}
            icon={OrtusIcons.Calendar}
            trailing={RowTrailing.value(
              weekStartName(t.language, state.weekStart),
            )}
            showDivider
            onPress={onOpenWeekStart}
          />
          <OrtusListRow
            title={t.tf("me_lunar_title")}
            subtitle={t.tf("me_lunar_subtitle")}
            icon={OrtusIcons.Moon}
            trailing={RowTrailing.toggle(
              state.showLunarInCalendar,
              actions.onShowLunarChange,
            )}
          />
        </OrtusCard>
      </Reveal>
    </>
  );
}

export function AccountSection({
  t,
  state,
  actions,
  startIndex,
}: SectionProps) {
  return (
    <>
      <Reveal index={startIndex}>
        <SectionLabel text={t.tf("me_section_account")} />
      </Reveal>
      <Reveal index={startIndex + 1}>
        <OrtusCard contentPadding={OrtusSpacing.none}>
          <OrtusListRow
            title={t.tf("me_profiles_title")}
            icon={OrtusIcons.Me}
            trailing={RowTrailing.value(
              t.tp("me_profiles_count", state.profileCount, state.profileCount),
            )}
            showDivider
            onPress={actions.onOpenProfiles}
          />
          <OrtusListRow
            title={t.tf("me_privacy_title")}
            subtitle={t.tf("me_privacy_subtitle")}
            icon={OrtusIcons.Lock}
            onPress={actions.onOpenPrivacy}
          />
        </OrtusCard>
      </Reveal>
    </>
  );
}

type AboutRow = {
  title: string;
  subtitle?: string;
  icon: OrtusIconComponent;
  uri: string;
};

function aboutRows(t: UiText, links: AppLinks, appVersion: string): AboutRow[] {
  const rows: AboutRow[] = [];
  if (links.supportEmail.trim() !== "") {
    const subject = encodeURIComponent(t.tf("me_help_subject", appVersion));
    rows.push({
      title: t.tf("me_help_title"),
      subtitle: t.tf("me_help_subtitle"),
      icon: OrtusIcons.Send,
      uri: `mailto:${links.supportEmail}?subject=${subject}`,
    });
  }
  if (links.termsUrl.trim() !== "")
    rows.push({
      title: t.tf("legal_terms"),
      icon: OrtusIcons.Info,
      uri: links.termsUrl,
    });
  if (links.privacyUrl.trim() !== "")
    rows.push({
      title: t.tf("legal_privacy"),
      icon: OrtusIcons.Lock,
      uri: links.privacyUrl,
    });
  return rows;
}

/** Help, terms and privacy policy: only the links this build was given. */
export function AboutSection(props: {
  t: UiText;
  links: AppLinks;
  appVersion: string;
  startIndex: number;
}) {
  const { t, links, appVersion, startIndex } = props;
  const openLink = useOpenLink();
  const rows = aboutRows(t, links, appVersion);
  return (
    <>
      <Reveal index={startIndex}>
        <SectionLabel text={t.tf("me_section_about")} />
      </Reveal>
      <Reveal index={startIndex + 1}>
        <OrtusCard contentPadding={OrtusSpacing.none}>
          {rows.map((row, index) => (
            <OrtusListRow
              key={row.uri}
              title={row.title}
              subtitle={row.subtitle}
              icon={row.icon}
              showDivider={index < rows.length - 1}
              onPress={() => openLink(row.uri)}
            />
          ))}
        </OrtusCard>
      </Reveal>
    </>
  );
}

const WEEK_STARTS: readonly WeekStart[] = [WeekStart.MONDAY, WeekStart.SUNDAY];

export function WeekStartSheet(props: {
  t: UiText;
  selected: WeekStart;
  onSelect: (weekStart: WeekStart) => void;
  onDismiss: () => void;
}) {
  const { t, selected, onSelect, onDismiss } = props;
  return (
    <OrtusBottomSheet onDismiss={onDismiss} title={t.tf("me_week_start_sheet")}>
      {(close) => (
        <View style={styles.options}>
          {WEEK_STARTS.map((option) => (
            <OrtusRadioOption
              key={option}
              text={weekStartName(t.language, option)}
              selected={option === selected}
              onPress={() => {
                onSelect(option);
                close();
              }}
            />
          ))}
        </View>
      )}
    </OrtusBottomSheet>
  );
}

const styles = StyleSheet.create({
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: OrtusSpacing.md,
  },
  profileText: { flex: 1, gap: OrtusSpacing.xxs },
  premiumTag: { marginTop: OrtusSpacing.xxs, alignSelf: "flex-start" },
  options: { gap: OrtusSpacing.xs },
});
