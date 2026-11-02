import type { PlanOffer } from "@/core/data";
import { PremiumPlan } from "@/core/model";

const MICROS_SCALE = 6;
const MONTHS_PER_YEAR = 12;
const PERCENT = 100;

/** True when the runtime knows [code] as a currency (Kotlin `Currency.getInstance`). */
function isKnownCurrency(code: string): boolean {
  const supported = (Intl as { supportedValuesOf?: (key: string) => string[] })
    .supportedValuesOf;
  if (supported) return supported("currency").includes(code.toUpperCase());
  try {
    new Intl.NumberFormat("en", { style: "currency", currency: code });
    return true;
  } catch {
    return false;
  }
}

/** A store price in the buyer's [locale], with the currency's own decimals (none for VND). */
export function formatPrice(
  priceMicros: number,
  currencyCode: string,
  locale: string,
): string {
  if (!isKnownCurrency(currencyCode)) {
    const amount = priceMicros / 10 ** MICROS_SCALE;
    return `${new Intl.NumberFormat(locale).format(amount)} ${currencyCode}`;
  }
  const digits =
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
    }).resolvedOptions().maximumFractionDigits ?? 0;
  // Never round a price up: a per-month equivalent must not claim more than it costs.
  const units = Math.trunc(priceMicros / 10 ** (MICROS_SCALE - digits));
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(units / 10 ** digits);
}

/** What the yearly plan comes to per month, rounded down so the claim is never generous. */
export function monthlyEquivalentMicros(offer: PlanOffer): number {
  return offer.plan === PremiumPlan.YEARLY
    ? Math.trunc(offer.priceMicros / MONTHS_PER_YEAR)
    : offer.priceMicros;
}

/**
 * Whole percent saved by paying yearly instead of twelve monthly payments, rounded down. Null when
 * either plan is missing, the currencies differ, or yearly saves nothing.
 */
export function yearlySavingsPercent(
  offers: readonly PlanOffer[],
): number | null {
  const yearly = offers.find((it) => it.plan === PremiumPlan.YEARLY);
  const monthly = offers.find((it) => it.plan === PremiumPlan.MONTHLY);
  if (!yearly || !monthly) return null;
  if (yearly.currencyCode !== monthly.currencyCode || monthly.priceMicros <= 0)
    return null;
  const twelveMonths = monthly.priceMicros * MONTHS_PER_YEAR;
  const saved = Math.trunc(
    ((twelveMonths - yearly.priceMicros) * PERCENT) / twelveMonths,
  );
  return saved > 0 ? saved : null;
}
