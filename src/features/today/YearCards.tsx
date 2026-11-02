import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { elementName, fillTemplate, InsightLine, itemOf, ReadingDisclaimer, stemBranchName, type UiText } from '@/core/ui';
import {
  OrtusBottomSheet,
  OrtusCard,
  OrtusColors as c,
  OrtusIcons,
  OrtusSizes,
  OrtusSpacing,
  OrtusTag,
  OrtusText,
  SectionLabel,
  TagTone,
} from '@/designsystem';
import { stemElement, type YearOutlook } from '@/engine';
import { useT } from '@/i18n';

const yearSubtitle = (t: UiText, year: YearOutlook): string =>
  t.tf('year_subtitle', stemBranchName(t, year.pillar), year.folkAge);

/** The lunar year read against the owner: theme, Cửu Diệu star, Thái Tuế and Tam Tai at a glance. */
export function YearCard({ year, onPress, style }: { year: YearOutlook; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  const t = useT();
  return (
    <OrtusCard onPress={onPress} gap={OrtusSpacing.xs} style={style}>
      <OrtusText variant="footnote" color={c.textSecondary}>
        {t.tf('year_title', year.lunarYear)}
      </OrtusText>
      <OrtusText variant="caption" color={c.textSecondary}>
        {yearSubtitle(t, year)}
      </OrtusText>
      {year.theme !== null ? (
        <OrtusText variant="subtitle" color={c.textPrimary}>
          {itemOf(t.ta('year_theme_titles'), year.theme)}
        </OrtusText>
      ) : null}
      <View style={styles.tags}>
        <OrtusTag text={itemOf(t.ta('nine_star_names'), year.nineStar)} tone={TagTone.Gold} />
        <OrtusTag text={itemOf(t.ta('tai_sui_titles'), year.taiSui)} tone={TagTone.Neutral} />
        {year.tamTaiYear !== null ? <OrtusTag text={t.tf('year_tam_tai')} tone={TagTone.Neutral} /> : null}
      </View>
      <View style={styles.openRow}>
        <OrtusText variant="captionStrong" color={c.accent}>
          {t.tf('year_open')}
        </OrtusText>
        <OrtusIcons.ChevronRight size={OrtusSizes.iconSmall} color={c.accent} />
      </View>
    </OrtusCard>
  );
}

/** The full year reading, section by section, with the folk-custom footnote and disclaimer. */
export function YearSheet({ year, onDismiss }: { year: YearOutlook; onDismiss: () => void }) {
  const t = useT();
  const elementLine = fillTemplate(
    itemOf(t.ta('year_element_lines'), year.elementRole),
    elementName(t, stemElement(year.pillar.stem)),
  );
  const tamTai = year.tamTaiYear !== null ? itemOf(t.ta('tam_tai_years'), year.tamTaiYear - 1) : t.tf('tam_tai_none');
  return (
    <OrtusBottomSheet onDismiss={onDismiss} title={t.tf('year_title', year.lunarYear)} subtitle={yearSubtitle(t, year)}>
      <ScrollView contentContainerStyle={styles.sheetColumn}>
        {year.theme !== null ? (
          <YearSection
            label={t.tf('year_theme')}
            title={itemOf(t.ta('year_theme_titles'), year.theme)}
            body={itemOf(t.ta('year_theme_bodies'), year.theme)}
          />
        ) : null}
        <YearSection label={t.tf('year_element')} body={elementLine} />
        <YearSection
          label={t.tf('year_tai_sui')}
          title={itemOf(t.ta('tai_sui_titles'), year.taiSui)}
          body={itemOf(t.ta('tai_sui_bodies'), year.taiSui)}
        />
        <YearSection label={t.tf('year_tam_tai')} body={tamTai} />
        <YearSection
          label={t.tf('year_nine_star')}
          title={itemOf(t.ta('nine_star_names'), year.nineStar)}
          body={itemOf(t.ta('nine_star_bodies'), year.nineStar)}
        />
        {year.customsApply ? <CustomsSection year={year} /> : null}
        <OrtusText variant="footnote" color={c.textMuted}>
          {t.tf('year_footnote')}
        </OrtusText>
        <ReadingDisclaimer />
      </ScrollView>
    </OrtusBottomSheet>
  );
}

function CustomsSection({ year }: { year: YearOutlook }) {
  const t = useT();
  const kimLau = year.kimLau !== null ? itemOf(t.ta('kim_lau_lines'), year.kimLau) : t.tf('kim_lau_none');
  return (
    <View style={styles.customs}>
      <SectionLabel text={t.tf('year_customs')} />
      <InsightLine label={t.tf('year_kim_lau')} value={kimLau} />
      {year.hoangOc !== null ? (
        <InsightLine label={t.tf('year_hoang_oc')} value={itemOf(t.ta('hoang_oc_lines'), year.hoangOc)} />
      ) : null}
    </View>
  );
}

function YearSection({ label, title, body }: { label: string; title?: string; body: string }) {
  return (
    <View style={styles.section}>
      <SectionLabel text={label} />
      {title ? (
        <OrtusText variant="subtitle" color={c.textPrimary}>
          {title}
        </OrtusText>
      ) : null}
      <OrtusText variant="body" color={c.textBody}>
        {body}
      </OrtusText>
    </View>
  );
}

const styles = StyleSheet.create({
  tags: { flexDirection: 'row', flexWrap: 'wrap', columnGap: OrtusSpacing.xs, rowGap: OrtusSpacing.xxs },
  openRow: { flexDirection: 'row', alignItems: 'center', gap: OrtusSpacing.xxs },
  sheetColumn: { gap: OrtusSpacing.md },
  customs: { gap: OrtusSpacing.xs },
  section: { gap: OrtusSpacing.xxs },
});
