import { StyleSheet, View } from "react-native";

import {
  CalloutTone,
  OrtusCallout,
  OrtusChoiceCard,
  OrtusColors,
  OrtusSpacing,
  OrtusTag,
  OrtusText,
  OrtusWideButton,
  TagTone,
} from "@/designsystem";
import type { PlanOffer } from "@/core/data";
import { PremiumPlan } from "@/core/model";
import {
  civilDateOfEpochDay,
  premiumPlanName,
  Reveal,
  solarDateText,
  type UiText,
} from "@/core/ui";
import {
  firstChargeEpochDay,
  savingsPercent,
  selectedOffer,
  type PaywallUiState,
  type StoreStatus,
} from "./paywallModel";
import { CenteredNote, priceText } from "./premiumBits";
import { monthlyEquivalentMicros } from "./pricing";

type PlansProps = {
  t: UiText;
  state: PaywallUiState;
  onSelect: (plan: PremiumPlan) => void;
  onPurchase: () => void;
  revealIndex: number;
};

/** The plan cards, what happens when, the store's answer, and the one call to action. */
export function PlansAndCheckout({
  t,
  state,
  onSelect,
  onPurchase,
  revealIndex,
}: PlansProps) {
  const saving = savingsPercent(state);
  const offer = selectedOffer(state);
  return (
    <Reveal index={revealIndex} style={styles.column}>
      {state.offers.map((it) => (
        <PlanCard
          key={it.plan}
          t={t}
          offer={it}
          selected={it.plan === state.selected}
          savingsPercent={it.plan === PremiumPlan.YEARLY ? saving : null}
          onPress={() => onSelect(it.plan)}
        />
      ))}
      {offer ? (
        <>
          <CenteredNote
            text={chargeNote(t, offer, firstChargeEpochDay(state))}
            variant="caption"
            color={OrtusColors.textSecondary}
          />
          <StoreAnswer t={t} status={state.status} />
          <OrtusWideButton text={callToAction(t, offer)} onPress={onPurchase} />
          <CenteredNote text={finePrint(t, offer)} />
          <CenteredNote text={t.tf("premium_test_build")} />
        </>
      ) : null}
    </Reveal>
  );
}

type PlanCardProps = {
  t: UiText;
  offer: PlanOffer;
  selected: boolean;
  savingsPercent: number | null;
  onPress: () => void;
};

function PlanCard({
  t,
  offer,
  selected,
  savingsPercent: saving,
  onPress,
}: PlanCardProps) {
  const price = priceText(offer.priceMicros, offer.currencyCode, t.language);
  const yearly = offer.plan === PremiumPlan.YEARLY;
  const note = yearly
    ? t.tf(
        "premium_yearly_note",
        priceText(
          monthlyEquivalentMicros(offer),
          offer.currencyCode,
          t.language,
        ),
      )
    : t.tf("premium_monthly_note");
  const period = t.tf(yearly ? "premium_per_year" : "premium_per_month");
  return (
    <OrtusChoiceCard selected={selected} onPress={onPress}>
      <View style={styles.planText}>
        <View style={styles.planTitle}>
          <OrtusText variant="subtitle" color={OrtusColors.textPrimary}>
            {premiumPlanName(t, offer.plan)}
          </OrtusText>
          {saving !== null ? (
            <OrtusTag text={t.tf("premium_save", saving)} tone={TagTone.Gold} />
          ) : null}
        </View>
        <OrtusText variant="captionSmall" color={OrtusColors.textSecondary}>
          {note}
        </OrtusText>
      </View>
      <View style={styles.planPrice}>
        <OrtusText
          variant="price"
          color={selected ? OrtusColors.accentLight : OrtusColors.textPrimary}
        >
          {price}
        </OrtusText>
        <OrtusText variant="footnote" color={OrtusColors.textMuted}>
          {period}
        </OrtusText>
      </View>
    </OrtusChoiceCard>
  );
}

function chargeNote(
  t: UiText,
  offer: PlanOffer,
  firstCharge: number | null,
): string {
  if (firstCharge === null) return t.tf("premium_no_trial_note");
  const date = solarDateText(
    civilDateOfEpochDay(firstCharge),
    t.language,
    "medium",
  );
  return t.tp("premium_trial_note", offer.trialDays, offer.trialDays, date);
}

function callToAction(t: UiText, offer: PlanOffer): string {
  const price = priceText(offer.priceMicros, offer.currencyCode, t.language);
  if (offer.trialDays > 0)
    return t.tp("premium_cta_trial", offer.trialDays, offer.trialDays);
  return offer.plan === PremiumPlan.YEARLY
    ? t.tf("premium_cta_yearly", price)
    : t.tf("premium_cta_subscribe", price);
}

function finePrint(t: UiText, offer: PlanOffer): string {
  const price = priceText(offer.priceMicros, offer.currencyCode, t.language);
  return offer.plan === PremiumPlan.YEARLY
    ? t.tf("premium_fine_yearly", price)
    : t.tf("premium_fine_monthly", price);
}

/** S08-02c in place: what the store said, and that nothing was charged. Cancelling says nothing. */
function StoreAnswer({ t, status }: { t: UiText; status: StoreStatus }) {
  switch (status.kind) {
    case "Failed":
      return (
        <>
          <OrtusCallout
            text={t.tf("premium_failed")}
            tone={CalloutTone.Warning}
          />
          <CenteredNote text={t.tf("premium_failed_code", status.code)} />
        </>
      );
    case "NothingToRestore":
      return (
        <OrtusCallout
          text={t.tf("premium_nothing_found")}
          tone={CalloutTone.Info}
        />
      );
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  column: { gap: OrtusSpacing.sm },
  planText: { flex: 1, gap: OrtusSpacing.hair },
  planTitle: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: OrtusSpacing.xs,
  },
  planPrice: { alignItems: "flex-end" },
});
