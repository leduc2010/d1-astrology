import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import {
  animalName,
  branchName,
  capitalized,
  datePattern,
  mansionName,
  moonPhaseName,
  officerAvoid,
  officerGood,
  officerName,
  PillarTile,
  solarTermName,
} from "@/core/ui";
import {
  asCard,
  OrtusCard,
  OrtusCardRow,
  OrtusColors as c,
  OrtusFactCard,
  OrtusSpacing,
  OrtusText,
  OrtusToneCard,
  SectionLabel,
  type ToneColors,
} from "@/designsystem";
import { branchClash, type DayAlmanac } from "@/engine";
import { useT } from "@/i18n";
import type { DayUiState } from "./dayModel";

type SectionProps = { style?: StyleProp<ViewStyle> };

export function PillarRow({
  state,
  style,
}: SectionProps & { state: DayUiState }) {
  const t = useT();
  return (
    <OrtusCardRow style={style}>
      <PillarTile
        label={t.tf("day_pillar_day")}
        pillar={state.day.dayPillar}
        style={styles.cell}
      />
      <PillarTile
        label={t.tf("day_pillar_month")}
        pillar={state.day.monthPillar}
        style={styles.cell}
      />
      <PillarTile
        label={t.tf("day_pillar_year")}
        pillar={state.yearPillar}
        style={styles.cell}
      />
    </OrtusCardRow>
  );
}

/** Officer and mansion, then the moon and the solar term, in two even rows. */
export function DayFacts({
  state,
  style,
}: SectionProps & { state: DayUiState }) {
  const t = useT();
  const day = state.day;
  return (
    <View style={[styles.facts, style]}>
      <OrtusCardRow>
        <OrtusFactCard
          label={t.tf("day_officer")}
          value={officerName(t, day.officer)}
          style={styles.cell}
        />
        <OrtusFactCard
          label={t.tf("day_mansion")}
          value={mansionName(t, day.mansion)}
          style={styles.cell}
        />
      </OrtusCardRow>
      <OrtusCardRow>
        <OrtusFactCard
          label={t.tf("day_moon")}
          value={moonPhaseName(t, day.moonPhase)}
          hint={t.tf("day_moon_hint", day.lunar.day)}
          style={styles.cell}
        />
        <OrtusFactCard
          label={t.tf("day_term")}
          value={solarTermName(t, day.solarTerm)}
          hint={t.tf(
            "day_term_hint",
            datePattern(t, "date_day_month_pattern", state.termStart),
          )}
          style={styles.cell}
        />
      </OrtusCardRow>
    </View>
  );
}

/** What the day officer favours and warns against, on green and red washed cards. */
export function DayAdvice({ day, style }: SectionProps & { day: DayAlmanac }) {
  const t = useT();
  return (
    <OrtusCardRow style={style}>
      <AdviceCard
        label={t.tf("day_good")}
        text={officerGood(t, day.officer)}
        tone={asCard(c.auspicious, c.auspicious.content)}
      />
      <AdviceCard
        label={t.tf("day_avoid")}
        text={officerAvoid(t, day.officer)}
        tone={asCard(c.inauspicious, c.inauspicious.content)}
      />
    </OrtusCardRow>
  );
}

function AdviceCard({
  label,
  text,
  tone,
}: {
  label: string;
  text: string;
  tone: ToneColors;
}) {
  const { language } = useT();
  return (
    <OrtusToneCard
      label={label}
      tone={tone}
      contentPadding={OrtusSpacing.md}
      style={styles.cell}
    >
      <OrtusText variant="body" color={c.textBody}>
        {capitalized(text, language)}
      </OrtusText>
    </OrtusToneCard>
  );
}

/** The sign whose branch opposes the day's: "Monkey", "Tiger – Monkey clash". */
export function ClashCard({ day, style }: SectionProps & { day: DayAlmanac }) {
  const t = useT();
  const branch = day.dayPillar.branch;
  const clash = branchClash(branch);
  return (
    <OrtusCard style={style}>
      <View style={styles.clashRow}>
        <View style={styles.clashName}>
          <SectionLabel text={t.tf("day_clash_label")} />
          <OrtusText variant="subtitle" color={c.textPrimary}>
            {animalName(t, clash)}
          </OrtusText>
        </View>
        <OrtusText
          variant="caption"
          color={c.textSecondary}
          style={styles.clashValue}
        >
          {t.tf("day_clash_value", branchName(t, branch), branchName(t, clash))}
        </OrtusText>
      </View>
    </OrtusCard>
  );
}

const styles = StyleSheet.create({
  cell: { flex: 1 },
  facts: { gap: OrtusSpacing.cardGap },
  clashRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: OrtusSpacing.md,
  },
  clashName: { flex: 1, gap: OrtusSpacing.xxs },
  clashValue: { textAlign: "right" },
});
