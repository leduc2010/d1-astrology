import { Text, type TextProps } from 'react-native';

import { OrtusColors } from '../theme/colors';
import { isBalancedVariant, OrtusTypography, type OrtusTypeVariant } from '../theme/typography';

export type OrtusTextProps = TextProps & {
  /** Type-scale style (Kotlin `OrtusTheme.typography.x`). */
  variant?: OrtusTypeVariant;
  /** Semantic color; styles carry none of their own. Defaults to `textPrimary`. */
  color?: string;
};

/**
 * Text in an Ortus type style. Serif headings balance their lines (Kotlin `LineBreak.Heading`)
 * and font padding is off so line heights match the Compose layout.
 */
export function OrtusText({ variant = 'body', color = OrtusColors.textPrimary, style, ...rest }: OrtusTextProps) {
  return (
    <Text
      textBreakStrategy={isBalancedVariant(variant) ? 'balanced' : 'highQuality'}
      {...rest}
      style={[OrtusTypography[variant], { color }, style]}
    />
  );
}
