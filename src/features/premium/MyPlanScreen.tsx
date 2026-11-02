import { useState } from "react";
import { StyleSheet } from "react-native";

import {
  CalloutTone,
  OrtusCallout,
  OrtusCard,
  OrtusColors,
  OrtusGlowCard,
  OrtusIcons,
  OrtusListRow,
  OrtusSpacing,
  OrtusSpinner,
  OrtusText,
  OrtusTopBar,
  OrtusWideButton,
  RowTrailing,
} from "@/designsystem";
import { useServices } from "@/core/data";
import {
  civilDateOfEpochDay,
  openLink,
  OrtusScreen,
  premiumPlanName,
  Reveal,
  solarDateText,
  useResumedOnly,
  type UiText,
} from "@/core/ui";
import { useT } from "@/i18n";
import { goBack, navigateToPaywall } from "@/navigation/routes";
import { MyPlanModel, RestoreStatus, type PlanDetails } from "./myPlanModel";
import { PremiumHero, priceText } from "./premiumBits";
import { useScreenModel } from "@/core/ui";

/**
 * Google Play's own subscriptions page; cancelling and payment methods live there, not in the app.
 * TODO(parity): iOS would open the App Store subscriptions page; the strings still name Google Play.
 */
const PLAY_SUBSCRIPTIONS_URL =
  "https://play.google.com/store/account/subscriptions";

/** S08-03 my plan: what is paid, when it renews, and where to manage it. */
export function MyPlanScreen() {
  const t = useT();
  const { billing } = useServices();
  const [state, model] = useScreenModel(() => new MyPlanModel(billing));
  const onBack = useResumedOnly(goBack);
  const onOpenPaywall = useResumedOnly(navigateToPaywall);
  const details = state.details;

  return (
    <OrtusScreen
      header={
        <OrtusTopBar
          title={t.tf("myplan_title")}
          onBack={onBack}
          backAccessibilityLabel={t.tf("premium_back")}
        />
      }
    >
      {details ? (
        <>
          <PlanSummary t={t} details={details} />
          <ManageCard
            t={t}
            restore={state.restore}
            onRestore={() => void model.restorePurchases()}
          />
          <RestoreAnswer t={t} restore={state.restore} />
          <Reveal index={2}>
            <OrtusCallout
              text={t.tf("myplan_cancel_note")}
              tone={CalloutTone.Info}
            />
          </Reveal>
        </>
      ) : (
        <>
          <PremiumHero
            title={t.tf("myplan_free_title")}
            subtitle={t.tf("myplan_free_body")}
            revealIndex={0}
          />
          <Reveal index={1}>
            <OrtusWideButton
              text={t.tf("myplan_see_premium")}
              onPress={onOpenPaywall}
            />
          </Reveal>
        </>
      )}
    </OrtusScreen>
  );
}

function PlanSummary({ t, details }: { t: UiText; details: PlanDetails }) {
  const trialLeft = details.trialDaysLeft;
  const status =
    trialLeft !== null
      ? t.tp("myplan_trial_left", trialLeft, trialLeft)
      : t.tf("myplan_active");
  const date = solarDateText(
    civilDateOfEpochDay(details.renewsOnEpochDay),
    t.language,
    "medium",
  );
  const offer = details.renewalPrice;
  const price = offer
    ? priceText(offer.priceMicros, offer.currencyCode, t.language)
    : null;
  return (
    <Reveal index={0} style={styles.column}>
      <OrtusGlowCard>
        <OrtusText variant="price" color={OrtusColors.accentLight}>
          {t.tf("myplan_plan", premiumPlanName(t, details.plan))}
        </OrtusText>
        <OrtusText variant="caption" color={OrtusColors.textSecondary}>
          {status}
        </OrtusText>
      </OrtusGlowCard>
      <OrtusCard contentPadding={OrtusSpacing.none}>
        <OrtusListRow
          title={t.tf(
            trialLeft !== null ? "myplan_first_charge" : "myplan_renews",
          )}
          trailing={RowTrailing.value(
            price !== null ? t.tf("myplan_renewal_value", date, price) : date,
          )}
          showDivider
        />
        <OrtusListRow
          title={t.tf("myplan_billed_via")}
          trailing={RowTrailing.value(t.tf("myplan_google_play"))}
        />
      </OrtusCard>
    </Reveal>
  );
}

function ManageCard({
  t,
  restore,
  onRestore,
}: {
  t: UiText;
  restore: RestoreStatus;
  onRestore: () => void;
}) {
  // Some devices (no store, no browser) have nothing that opens the link.
  const [cannotOpen, setCannotOpen] = useState(false);
  const openPlay = useResumedOnly(() => {
    void openLink(PLAY_SUBSCRIPTIONS_URL).then((opened) =>
      setCannotOpen(!opened),
    );
  });
  const restoring = restore === RestoreStatus.Restoring;
  return (
    <Reveal index={1} style={styles.column}>
      <OrtusCard contentPadding={OrtusSpacing.none}>
        <OrtusListRow
          title={t.tf("myplan_manage")}
          icon={OrtusIcons.Settings}
          showDivider
          onPress={openPlay}
        />
        <OrtusListRow
          title={t.tf("premium_restore")}
          icon={OrtusIcons.Check}
          leading={restoring ? <OrtusSpinner /> : undefined}
          trailing={restoring ? RowTrailing.None : RowTrailing.Chevron}
          onPress={restoring ? undefined : onRestore}
        />
      </OrtusCard>
      {cannotOpen ? (
        <OrtusCallout
          text={t.tf("myplan_open_play_failed")}
          tone={CalloutTone.Warning}
        />
      ) : null}
    </Reveal>
  );
}

function RestoreAnswer({ t, restore }: { t: UiText; restore: RestoreStatus }) {
  switch (restore) {
    case RestoreStatus.UpToDate:
      return (
        <OrtusCallout
          text={t.tf("myplan_up_to_date")}
          tone={CalloutTone.Good}
        />
      );
    case RestoreStatus.NothingFound:
      return (
        <OrtusCallout
          text={t.tf("premium_nothing_found")}
          tone={CalloutTone.Info}
        />
      );
    case RestoreStatus.Failed:
      return (
        <OrtusCallout
          text={t.tf("myplan_restore_failed")}
          tone={CalloutTone.Warning}
        />
      );
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  column: { gap: OrtusSpacing.cardGap },
});
