import { useEffect } from "react";
import { BackHandler, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useNavigation } from "expo-router";

import {
  ButtonStyle,
  CalloutTone,
  OrtusCallout,
  OrtusColors,
  OrtusIconButton,
  OrtusIcons,
  OrtusLinkButton,
  OrtusMotion,
  OrtusSpacing,
  OrtusSpinner,
  OrtusTag,
  OrtusText,
  OrtusTopBar,
  OrtusWideButton,
  TagTone,
  useReducedMotion,
} from "@/designsystem";
import { useServices } from "@/core/data";
import type { AppLinks } from "@/core/model";
import {
  civilDateOfEpochDay,
  LegalLinks,
  OrtusScreen,
  premiumPlanName,
  Reveal,
  solarDateText,
  useResumedOnly,
  type UiText,
} from "@/core/ui";
import { useT } from "@/i18n";
import { goBack } from "@/navigation/routes";
import { APP_LINKS, useScreenModel } from "@/core/ui";
import { PaywallModel, type PaywallUiState } from "./paywallModel";
import { PlansAndCheckout } from "./PaywallPlans";
import { BenefitRow, PremiumHero } from "./premiumBits";

type PaywallStage = "Offer" | "Confirming" | "Activated";

const stageOf = (state: PaywallUiState): PaywallStage => {
  switch (state.status.kind) {
    case "Confirming":
      return "Confirming";
    case "Activated":
      return "Activated";
    default:
      return "Offer";
  }
};

/** S08-01 paywall, then S08-02a/b in place once the store is involved. No ads on any of it. */
export function PaywallScreen() {
  const t = useT();
  const { billing } = useServices();
  const [state, model] = useScreenModel(() => new PaywallModel(billing));
  const onClose = useResumedOnly(goBack);
  const stage = stageOf(state);
  const confirming = stage === "Confirming";
  useHoldWhile(confirming);
  const reduced = useReducedMotion();
  const entering = reduced
    ? undefined
    : FadeIn.duration(OrtusMotion.EMPHASIZED).easing(OrtusMotion.settle);

  return (
    <OrtusScreen
      header={
        <OrtusTopBar
          title=""
          actions={
            <OrtusIconButton
              icon={OrtusIcons.Close}
              accessibilityLabel={t.tf("premium_close")}
              onPress={onClose}
              enabled={!confirming}
            />
          }
        />
      }
    >
      <Animated.View key={stage} entering={entering} style={styles.stage}>
        {stage === "Offer" ? (
          <OfferContent
            t={t}
            state={state}
            links={APP_LINKS}
            onSelect={model.select}
            onPurchase={() => void model.purchase()}
            onRestore={() => void model.restore()}
            onRetryOffers={() => void model.loadOffers()}
          />
        ) : null}
        {stage === "Confirming" ? <ConfirmingContent t={t} /> : null}
        {stage === "Activated" ? (
          <ActivatedContent t={t} state={state} onDone={onClose} />
        ) : null}
      </Animated.View>
    </OrtusScreen>
  );
}

/** The store sheet is up: leaving now would drop its answer, so back and swipe wait for it. */
function useHoldWhile(holding: boolean): void {
  const navigation = useNavigation();
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !holding });
    if (!holding) return undefined;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true,
    );
    return () => subscription.remove();
  }, [holding, navigation]);
}

type OfferProps = {
  t: UiText;
  state: PaywallUiState;
  links: AppLinks;
  onSelect: PaywallModel["select"];
  onPurchase: () => void;
  onRestore: () => void;
  onRetryOffers: () => void;
};

function OfferContent({
  t,
  state,
  links,
  onSelect,
  onPurchase,
  onRestore,
  onRetryOffers,
}: OfferProps) {
  return (
    <>
      <PremiumHero
        title={t.tf("premium_title")}
        subtitle={t.tf("premium_subtitle")}
        eyebrow={
          <OrtusText variant="label" color={OrtusColors.accent}>
            {t.tf("premium_eyebrow")}
          </OrtusText>
        }
        revealIndex={0}
      />
      <Reveal index={1} style={styles.benefits}>
        <BenefitRow text={t.tf("premium_benefit_ads")} />
        <BenefitRow text={t.tf("premium_benefit_ai")} />
        <BenefitRow text={t.tf("premium_benefit_deep")} />
        <BenefitRow text={t.tf("premium_benefit_free")} />
      </Reveal>
      {state.loadingOffers ? <OrtusSpinner style={styles.centered} /> : null}
      {!state.loadingOffers && state.offers.length === 0 ? (
        <>
          <OrtusCallout
            text={t.tf("premium_offers_unavailable")}
            tone={CalloutTone.Warning}
          />
          <OrtusWideButton
            text={t.tf("premium_retry")}
            onPress={onRetryOffers}
            variant={ButtonStyle.Outline}
          />
        </>
      ) : null}
      {!state.loadingOffers && state.offers.length > 0 ? (
        <PlansAndCheckout
          t={t}
          state={state}
          onSelect={onSelect}
          onPurchase={onPurchase}
          revealIndex={2}
        />
      ) : null}
      <OrtusLinkButton
        text={t.tf("premium_restore")}
        onPress={onRestore}
        style={styles.centered}
      />
      <LegalLinks links={links} style={styles.centered} />
    </>
  );
}

function ConfirmingContent({ t }: { t: UiText }) {
  return (
    <>
      <PremiumHero
        title={t.tf("premium_confirming_title")}
        subtitle={t.tf("premium_confirming_body")}
        active
      />
      <OrtusCallout
        text={t.tf("premium_confirming_note")}
        tone={CalloutTone.Info}
      />
      <OrtusText
        variant="caption"
        color={OrtusColors.textMuted}
        style={styles.note}
      >
        {t.tf("premium_test_build")}
      </OrtusText>
    </>
  );
}

function ActivatedContent({
  t,
  state,
  onDone,
}: {
  t: UiText;
  state: PaywallUiState;
  onDone: () => void;
}) {
  const member = state.membership;
  let subtitle: string | null = null;
  if (member) {
    const plan = premiumPlanName(t, member.plan);
    const trialEnd = member.trialEndsOnEpochDay;
    subtitle =
      trialEnd !== null
        ? t.tf(
            "premium_welcome_trial",
            plan,
            solarDateText(civilDateOfEpochDay(trialEnd), t.language, "medium"),
          )
        : t.tf(
            "premium_welcome_renews",
            plan,
            solarDateText(
              civilDateOfEpochDay(member.renewsOnEpochDay),
              t.language,
              "medium",
            ),
          );
  }
  return (
    <>
      <PremiumHero
        title={t.tf("premium_welcome_title")}
        subtitle={subtitle}
        eyebrow={
          <OrtusTag
            text={t.tf("premium_activated")}
            tone={TagTone.Auspicious}
          />
        }
        revealIndex={0}
      />
      <Reveal index={1} style={styles.benefits}>
        <BenefitRow text={t.tf("premium_welcome_ads")} />
        <BenefitRow text={t.tf("premium_welcome_ai")} />
      </Reveal>
      <Reveal index={2}>
        <OrtusWideButton
          text={t.tf("premium_welcome_start")}
          onPress={onDone}
        />
      </Reveal>
    </>
  );
}

const styles = StyleSheet.create({
  stage: { gap: OrtusSpacing.cardGap },
  benefits: { gap: OrtusSpacing.sm },
  centered: { alignSelf: "center" },
  note: { textAlign: "center", alignSelf: "stretch" },
});
