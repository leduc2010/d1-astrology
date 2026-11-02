import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import {
  AstralHalo,
  OrtusColors,
  OrtusIcons,
  OrtusShapes,
  OrtusSizes,
  OrtusSpacing,
  OrtusText,
} from "@/designsystem";
import { Reveal } from "@/core/ui";
import { formatPrice } from "./pricing";

/** A store price in the current language (Kotlin `priceText`). */
export const priceText = (
  priceMicros: number,
  currencyCode: string,
  language: string,
): string => formatPrice(priceMicros, currencyCode, language);

type PremiumHeroProps = {
  title: string;
  eyebrow?: ReactNode;
  subtitle?: string | null;
  active?: boolean;
  /** Reveal cascade index; omitted for content that should simply be there. */
  revealIndex?: number;
  style?: StyleProp<ViewStyle>;
};

/** The astral halo over a centred title block, shared by the paywall and its outcome. */
export function PremiumHero({
  title,
  eyebrow,
  subtitle,
  active = false,
  revealIndex,
  style,
}: PremiumHeroProps) {
  const body = (
    <View style={[styles.hero, style]}>
      <AstralHalo size={OrtusSizes.haloSmall} active={active} />
      <View style={styles.heroText}>
        {eyebrow}
        <OrtusText
          variant="display"
          color={OrtusColors.accentLight}
          style={styles.centered}
        >
          {title}
        </OrtusText>
        {subtitle ? (
          <OrtusText
            variant="body"
            color={OrtusColors.textSecondary}
            style={styles.centered}
          >
            {subtitle}
          </OrtusText>
        ) : null}
      </View>
    </View>
  );
  return revealIndex === undefined ? (
    body
  ) : (
    <Reveal index={revealIndex}>{body}</Reveal>
  );
}

/** One Premium benefit: a small gold check, then the line. */
export function BenefitRow({ text }: { text: string }) {
  return (
    <View style={styles.benefit}>
      <View style={styles.badge}>
        <OrtusIcons.Check
          size={OrtusSizes.iconTiny}
          color={OrtusColors.accentLight}
        />
      </View>
      <OrtusText
        variant="body"
        color={OrtusColors.textPrimary}
        style={styles.benefitText}
      >
        {text}
      </OrtusText>
    </View>
  );
}

/** A full-width centred line of small print. */
export function CenteredNote({
  text,
  variant = "footnote",
  color = OrtusColors.textMuted,
}: CenteredNoteProps) {
  return (
    <OrtusText variant={variant} color={color} style={styles.centered}>
      {text}
    </OrtusText>
  );
}

type CenteredNoteProps = {
  text: string;
  variant?: "footnote" | "caption";
  color?: string;
};

const styles = StyleSheet.create({
  hero: { alignSelf: "stretch", alignItems: "center" },
  heroText: { alignItems: "center", gap: OrtusSpacing.xs },
  centered: { textAlign: "center", alignSelf: "stretch" },
  benefit: { flexDirection: "row", alignItems: "center", gap: OrtusSpacing.sm },
  badge: {
    width: OrtusSizes.benefitBadge,
    height: OrtusSizes.benefitBadge,
    ...OrtusShapes.pill,
    backgroundColor: OrtusColors.accentGlowSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: { flex: 1 },
});
