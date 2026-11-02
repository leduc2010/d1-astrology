import { memo, type ComponentType } from 'react';
import { I18nManager, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { OrtusColors } from '../theme/colors';
import { OrtusSizes } from '../theme/dimens';
import { ICON_STROKE, ICON_VIEWPORT, OrtusIconPaths, type IconSpec, type OrtusIconName } from './iconPaths';

export type OrtusIconProps = {
  /** Square size in dp (Kotlin `Modifier.size`); defaults to `OrtusSizes.icon`. */
  size?: number;
  /** Tint, applied by the caller like Compose `Icon(tint = ...)`. */
  color?: string;
  style?: StyleProp<ViewStyle>;
};

/** An icon is a component, so it can be passed as a prop (`leadingIcon={OrtusIcons.Share}`). */
export type OrtusIconComponent = ComponentType<OrtusIconProps>;

const MIRRORED: ViewStyle = { transform: [{ scaleX: -1 }] };

/** Renders one glyph. Icons are decorative: the owning control carries the accessible label. */
export function IconGlyph({
  spec,
  size = OrtusSizes.icon,
  color = OrtusColors.textPrimary,
  style,
}: OrtusIconProps & { spec: IconSpec }) {
  const mirrored = spec.mirror === true && I18nManager.isRTL;
  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${ICON_VIEWPORT} ${ICON_VIEWPORT}`}
      style={mirrored ? [MIRRORED, style] : style}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
    >
      {spec.paths.map((d) =>
        spec.filled ? (
          <Path key={d} d={d} fill={color} />
        ) : (
          <Path
            key={d}
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={ICON_STROKE}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ),
      )}
    </Svg>
  );
}

function makeIcon(name: OrtusIconName): OrtusIconComponent {
  const spec = OrtusIconPaths[name];
  const Icon = memo(function OrtusIcon(props: OrtusIconProps) {
    return <IconGlyph spec={spec} {...props} />;
  });
  Icon.displayName = `OrtusIcons.${name}`;
  return Icon;
}

/** App icon set (Kotlin `OrtusIcons`): 24dp line icons, stroke 1.6, round caps. */
export const OrtusIcons = Object.fromEntries(
  (Object.keys(OrtusIconPaths) as OrtusIconName[]).map((name) => [name, makeIcon(name)]),
) as Record<OrtusIconName, OrtusIconComponent>;
