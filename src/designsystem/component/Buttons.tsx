import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { UiCue } from "../feedback/UiFeedback";
import type { OrtusIconComponent } from "../icons/OrtusIcons";
import { glowStyle } from "../modifiers/glow";
import { OrtusPressable } from "../modifiers/OrtusPressable";
import { OrtusAlpha } from "../theme/alpha";
import { OrtusColors as c } from "../theme/colors";
import {
  OrtusGlow,
  OrtusSizes,
  OrtusSpacing,
  OrtusStroke,
} from "../theme/dimens";
import { OrtusGradients } from "../theme/gradients";
import { TRANSPARENT } from "../theme/palette";
import { OrtusRadii } from "../theme/shapes";
import type { OrtusTypeVariant } from "../theme/typography";
import { OrtusText } from "./OrtusText";

/** Figma C01 variants. Calm/CalmSoft: support screen only (quiet jade). */
export const ButtonStyle = {
  Primary: "Primary",
  Outline: "Outline",
  Secondary: "Secondary",
  Calm: "Calm",
  CalmSoft: "CalmSoft",
} as const;
// eslint-disable-next-line @typescript-eslint/no-redeclare -- enum-like const + type
export type ButtonStyle = (typeof ButtonStyle)[keyof typeof ButtonStyle];

export const ButtonSize = { Regular: "Regular", Small: "Small" } as const;
// eslint-disable-next-line @typescript-eslint/no-redeclare -- enum-like const + type
export type ButtonSize = (typeof ButtonSize)[keyof typeof ButtonSize];

type ButtonColors = {
  background: ViewStyle;
  content: string;
  border: string;
  glow: string;
};

function buttonColors(variant: ButtonStyle, enabled: boolean): ButtonColors {
  if (!enabled) {
    return {
      background: { backgroundColor: c.disabledContainer },
      content: c.textMuted,
      border: TRANSPARENT,
      glow: TRANSPARENT,
    };
  }
  switch (variant) {
    case ButtonStyle.Primary:
      return {
        background: { backgroundImage: OrtusGradients.gold },
        content: c.onAccent,
        border: TRANSPARENT,
        glow: c.accentGlow,
      };
    case ButtonStyle.Outline:
      return {
        background: {},
        content: c.accentLight,
        border: c.outlineStrong,
        glow: TRANSPARENT,
      };
    case ButtonStyle.Secondary:
      return {
        background: { backgroundColor: c.surfaceRaised },
        content: c.textPrimary,
        border: TRANSPARENT,
        glow: TRANSPARENT,
      };
    case ButtonStyle.Calm:
      return {
        background: { backgroundColor: c.calm.container },
        content: c.calm.content,
        border: TRANSPARENT,
        glow: TRANSPARENT,
      };
    case ButtonStyle.CalmSoft:
      return {
        background: { backgroundColor: c.calmSoft.container },
        content: c.calmSoft.content,
        border: c.calmSoft.border,
        glow: TRANSPARENT,
      };
  }
}

export type OrtusButtonProps = {
  text: string;
  onPress: () => void;
  /** Visual variant (Kotlin `style`). */
  variant?: ButtonStyle;
  size?: ButtonSize;
  enabled?: boolean;
  leadingIcon?: OrtusIconComponent;
  cue?: UiCue;
  /** Outer layout style (margins, width, flex). */
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
};

/**
 * The single button component. Variants only change colors, so layout, press motion and sound
 * stay identical across the app.
 */
export function OrtusButton({
  text,
  onPress,
  variant = ButtonStyle.Primary,
  size = ButtonSize.Regular,
  enabled = true,
  leadingIcon,
  cue = UiCue.Tap,
  style,
  accessibilityLabel,
  testID,
}: OrtusButtonProps) {
  const colors = buttonColors(variant, enabled);
  const height =
    size === ButtonSize.Small
      ? OrtusSizes.buttonHeightSmall
      : OrtusSizes.buttonHeight;
  const hasBorder = colors.border !== TRANSPARENT;
  return (
    <OrtusPressable
      onPress={onPress}
      cue={cue}
      disabled={!enabled}
      pressScale
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      outerStyle={[
        styles.outer,
        { height },
        colors.glow !== TRANSPARENT &&
          glowStyle(colors.glow, OrtusGlow.button, OrtusGlow.buttonOffsetY),
        style,
      ]}
      style={[
        styles.box,
        colors.background,
        hasBorder && {
          borderWidth: OrtusStroke.hairline,
          borderColor: colors.border,
        },
      ]}
    >
      <ButtonContent
        text={text}
        icon={leadingIcon}
        color={colors.content}
        variant={size === ButtonSize.Small ? "buttonSmall" : "button"}
      />
    </OrtusPressable>
  );
}

export type OrtusWideButtonProps = Omit<OrtusButtonProps, "size">;

/** Full-width convenience used by forms and sheets. */
export function OrtusWideButton({ style, ...rest }: OrtusWideButtonProps) {
  return (
    <OrtusButton
      {...rest}
      size={ButtonSize.Regular}
      style={[styles.wide, style]}
    />
  );
}

export type OrtusLinkButtonProps = {
  text: string;
  onPress: () => void;
  /** Gold by default, mystic for AI actions. */
  color?: string;
  trailingIcon?: OrtusIconComponent;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/** C01 link: text only. */
export function OrtusLinkButton({
  text,
  onPress,
  color = c.accent,
  trailingIcon: Trailing,
  style,
  accessibilityLabel,
}: OrtusLinkButtonProps) {
  return (
    <OrtusPressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      outerStyle={[styles.linkOuter, style]}
      style={styles.link}
    >
      <OrtusText variant="link" color={color}>
        {text}
      </OrtusText>
      {Trailing ? (
        <Trailing
          size={OrtusSizes.iconSmall}
          color={color}
          style={styles.linkIcon}
        />
      ) : null}
    </OrtusPressable>
  );
}

export type OrtusIconButtonProps = {
  icon: OrtusIconComponent;
  /** Accessible label; required because the glyph has no text. */
  accessibilityLabel: string;
  onPress: () => void;
  tint?: string;
  enabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** Round 40dp icon button used in headers (C15), inside a 48dp touch target. */
export function OrtusIconButton({
  icon: Icon,
  accessibilityLabel,
  onPress,
  tint = c.textPrimary,
  enabled = true,
  style,
  testID,
}: OrtusIconButtonProps) {
  return (
    <View style={[styles.iconTouch, !enabled && styles.dimmed, style]}>
      <OrtusPressable
        onPress={onPress}
        disabled={!enabled}
        pressScale
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        hitSlop={(OrtusSizes.minTouch - OrtusSizes.headerButton) / 2}
        outerStyle={styles.iconOuter}
        style={styles.iconBox}
      >
        <Icon size={OrtusSizes.iconButtonGlyph} color={tint} />
      </OrtusPressable>
    </View>
  );
}

function ButtonContent({
  text,
  icon: Icon,
  color,
  variant,
}: {
  text: string;
  icon?: OrtusIconComponent;
  color: string;
  variant: OrtusTypeVariant;
}) {
  return (
    <View style={styles.content}>
      {Icon ? <Icon size={OrtusSizes.iconSmall} color={color} /> : null}
      <OrtusText variant={variant} color={color} numberOfLines={1}>
        {text}
      </OrtusText>
    </View>
  );
}

const styles = StyleSheet.create({
  // Hugs its content at the start like a Compose Box; OrtusWideButton stretches.
  outer: {
    alignSelf: "flex-start",
    minWidth: OrtusSizes.buttonMinWidth,
    borderRadius: OrtusRadii.pill,
  },
  box: {
    flex: 1,
    borderRadius: OrtusRadii.pill,
    paddingHorizontal: OrtusSpacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  wide: { alignSelf: "stretch" },
  content: { flexDirection: "row", alignItems: "center", gap: OrtusSpacing.xs },
  linkOuter: { alignSelf: "flex-start", borderRadius: OrtusRadii.pill },
  // A link hugs its text: without this the pressable's fill-the-box grow can stretch it down a whole card.
  link: {
    flexGrow: 0,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: OrtusRadii.pill,
    padding: OrtusSpacing.xs,
  },
  linkIcon: { marginStart: OrtusSpacing.xxs },
  iconTouch: {
    minWidth: OrtusSizes.minTouch,
    minHeight: OrtusSizes.minTouch,
    alignItems: "center",
    justifyContent: "center",
  },
  dimmed: { opacity: OrtusAlpha.DIMMED },
  iconOuter: {
    width: OrtusSizes.headerButton,
    height: OrtusSizes.headerButton,
    borderRadius: OrtusRadii.pill,
  },
  iconBox: {
    flex: 1,
    borderRadius: OrtusRadii.pill,
    backgroundColor: c.iconButtonContainer,
    alignItems: "center",
    justifyContent: "center",
  },
});
