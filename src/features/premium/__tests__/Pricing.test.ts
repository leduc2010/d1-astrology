import { planOffer } from "@/core/data";
import { PremiumPlan } from "@/core/model";
import { SAMPLE_OFFERS } from "@/core/testing";
import {
  formatPrice,
  monthlyEquivalentMicros,
  yearlySavingsPercent,
} from "../pricing";

describe("Pricing", () => {
  test("formats dollars with cents", () => {
    expect(formatPrice(32_990_000, "USD", "en-US")).toBe("$32.99");
  });

  test("formats dong without decimals", () => {
    const text = formatPrice(129_000_000_000, "VND", "vi-VN");
    expect(text.startsWith("129.000")).toBe(true);
    expect(text).not.toContain(",");
  });

  test("unknown currency falls back to the code", () => {
    expect(formatPrice(5_000_000, "XYZQ", "en-US")).toBe("5 XYZQ");
  });

  test("monthly equivalent rounds down, never up", () => {
    const yearly = SAMPLE_OFFERS.find((it) => it.plan === PremiumPlan.YEARLY)!;
    expect(formatPrice(monthlyEquivalentMicros(yearly), "USD", "en-US")).toBe(
      "$2.74",
    );
  });

  test("yearly saving against twelve monthly payments", () => {
    expect(yearlySavingsPercent(SAMPLE_OFFERS)).toBe(44);
  });

  test("no saving shown when currencies differ or a plan is missing", () => {
    const mixed = [
      planOffer(PremiumPlan.YEARLY, 32_990_000, "USD", 7),
      planOffer(PremiumPlan.MONTHLY, 99_000_000_000, "VND", 0),
    ];
    expect(yearlySavingsPercent(mixed)).toBeNull();
    expect(yearlySavingsPercent(SAMPLE_OFFERS.slice(0, 1))).toBeNull();
  });

  test("no saving shown when yearly costs more", () => {
    const offers = [
      planOffer(PremiumPlan.YEARLY, 70_000_000, "USD", 0),
      planOffer(PremiumPlan.MONTHLY, 4_990_000, "USD", 0),
    ];
    expect(yearlySavingsPercent(offers)).toBeNull();
  });
});
