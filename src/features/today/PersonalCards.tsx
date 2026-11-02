import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import {
  capitalized,
  directionName,
  elementColorName,
  elementColors,
  fillTemplate,
  itemOf,
  listText,
  stemBranchName,
  tenGodName,
} from '@/core/ui';
import {
  ColorSwatch,
  InsightSource,
  OrtusCard,
  OrtusCardRow,
  OrtusColors as c,
  OrtusIcons,
  OrtusMysticCard,
  OrtusSizes,
  OrtusSpacing,
  OrtusText,
  SourceChip,
  type OrtusIconComponent,
} from '@/designsystem';
import { type Direction, type StemBranch, tenGodGroup } from '@/engine';
import { useT } from '@/i18n';
import type { PersonalDay } from './todayModel';

/** The reading for today drawn from how the day stem meets the owner's day master. */
export function PersonalMessage({
  personal,
  dayPillar,
  style,
}: {
  personal: PersonalDay;
  dayPillar: StemBranch;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useT();
  const group = tenGodGroup(personal.tenGod);
  const body = fillTemplate(
    itemOf(t.ta('today_group_bodies'), group),
    stemBranchName(t, dayPillar),
    tenGodName(t, personal.tenGod),
  );
  return (
    <OrtusMysticCard label={t.tf('today_message_label', personal.name)} style={style}>
      <OrtusText variant="h2" color={c.textPrimary}>
        {itemOf(t.ta('today_group_titles'), group)}
      </OrtusText>
      <OrtusText variant="body" color={c.textBody}>
        {body}
      </OrtusText>
      <SourceChip text={t.tf('today_source')} source={InsightSource.BatTu} />
    </OrtusMysticCard>
  );
}

/** Lucky colours, good direction, love and wealth in a two-by-two grid. */
export function PersonalGrid({
  personal,
  direction,
  style,
}: {
  personal: PersonalDay;
  direction: Direction;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useT();
  const group = tenGodGroup(personal.tenGod);
  return (
    <View style={[styles.grid, style]}>
      <OrtusCardRow>
        <ColorsCard personal={personal} />
        <FactCard
          icon={OrtusIcons.Pin}
          label={t.tf('today_direction_label')}
          value={directionName(t, direction)}
          hint={t.tf('today_direction_hint')}
        />
      </OrtusCardRow>
      <OrtusCardRow>
        <FactCard
          icon={OrtusIcons.Heart}
          label={t.tf('today_love_label')}
          value={itemOf(t.ta('today_love_levels'), group)}
          hint={itemOf(t.ta('today_love_hints'), group)}
        />
        <FactCard
          icon={OrtusIcons.Sparkle}
          label={t.tf('today_wealth_label')}
          value={itemOf(t.ta('today_wealth_levels'), group)}
          hint={itemOf(t.ta('today_wealth_hints'), group)}
        />
      </OrtusCardRow>
    </View>
  );
}

function ColorsCard({ personal }: { personal: PersonalDay }) {
  const t = useT();
  const names = listText(
    t,
    personal.luckyElements.map((e) => elementColorName(t, e)),
  );
  return (
    <GridCard label={t.tf('today_colors_label')}>
      <View style={styles.swatches}>
        {personal.luckyElements.map((e) => (
          <ColorSwatch key={e} color={elementColors(e).content} />
        ))}
      </View>
      <OrtusText variant="captionSmall" color={c.textSecondary}>
        {capitalized(names, t.language)}
      </OrtusText>
    </GridCard>
  );
}

type FactCardProps = { icon: OrtusIconComponent; label: string; value: string; hint: string };

function FactCard({ icon: Icon, label, value, hint }: FactCardProps) {
  return (
    <GridCard label={label}>
      <View style={styles.valueRow}>
        <Icon size={OrtusSizes.iconSmall} color={c.accent} />
        <OrtusText variant="subtitle" color={c.textPrimary} style={styles.shrink}>
          {value}
        </OrtusText>
      </View>
      <OrtusText variant="captionSmall" color={c.textSecondary}>
        {hint}
      </OrtusText>
    </GridCard>
  );
}

function GridCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <OrtusCard gap={OrtusSpacing.xs} style={styles.flex}>
      <OrtusText variant="footnote" color={c.textSecondary}>
        {label}
      </OrtusText>
      {children}
    </OrtusCard>
  );
}

const styles = StyleSheet.create({
  grid: { gap: OrtusSpacing.cardGap },
  flex: { flex: 1 },
  swatches: { flexDirection: 'row', gap: OrtusSpacing.xs },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: OrtusSpacing.tight },
  shrink: { flexShrink: 1 },
});
