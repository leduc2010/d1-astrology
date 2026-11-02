import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  branchHan,
  branchName,
  elementColors,
  elementName,
  itemOf,
  lifeStageName,
  naYinName,
  stemHan,
  stemName,
  tenGodName,
} from '@/core/ui';
import {
  OrtusColors as c,
  OrtusCard,
  OrtusGradients,
  OrtusShapes,
  OrtusSpacing,
  OrtusStroke,
  OrtusText,
} from '@/designsystem';
import { branchElement, stemElement, type Element } from '@/engine';
import { useT } from '@/i18n';

import { columnHiddenStems, PillarKind, type BaZiView, type PillarColumn } from '../model/chartViews';

const LABEL_WEIGHT = 1.1;

/**
 * The four pillars as a table: hour, day, month and year columns; ten god, stem, branch, hidden
 * stems, growth stage and sound rows. The day column — the self — is lit.
 */
export function PillarTable({ baZi }: { baZi: BaZiView }) {
  const t = useT();
  const columns = baZi.columns;
  const stemCell = (col: PillarColumn) => {
    const stem = col.pillar?.stem;
    if (stem === undefined) return <SmallCell text={null} />;
    return <HanCell han={stemHan(stem)} element={stemElement(stem)} name={stemName(t, stem)} />;
  };
  const branchCell = (col: PillarColumn) => {
    const branch = col.pillar?.branch;
    if (branch === undefined) return <SmallCell text={null} />;
    return <HanCell han={branchHan(branch)} element={branchElement(branch)} name={branchName(t, branch)} />;
  };
  return (
    <OrtusCard contentPadding={OrtusSpacing.sm}>
      <View>
        <DayHighlight columns={columns} />
        <TableRow label={null} columns={columns} cell={(col) => <KindHeader kind={col.kind} />} />
        <TableRow label={t.tf('charts_row_ten_god')} columns={columns} cell={(col) => <TenGodCell column={col} />} />
        <TableRow label={t.tf('charts_row_stem')} columns={columns} cell={stemCell} />
        <TableRow label={t.tf('charts_row_branch')} columns={columns} cell={branchCell} />
        <TableRow label={t.tf('charts_row_hidden')} columns={columns} cell={(col) => <HiddenStemsCell column={col} />} />
        <TableRow
          label={t.tf('charts_row_stage')}
          columns={columns}
          cell={(col) => <SmallCell text={col.lifeStage === null ? null : lifeStageName(t, col.lifeStage)} />}
        />
        <TableRow
          label={t.tf('charts_row_nayin')}
          columns={columns}
          showDivider={false}
          cell={(col) => <SmallCell text={col.pillar ? naYinName(t, col.pillar) : null} />}
        />
      </View>
    </OrtusCard>
  );
}

/** The lit day column, drawn behind the rows over the table's full height. */
function DayHighlight({ columns }: { columns: readonly PillarColumn[] }) {
  return (
    <View style={styles.highlight} pointerEvents="none">
      <View style={styles.labelColumn} />
      {columns.map((col) => (
        <View key={col.kind} style={[styles.column, col.kind === PillarKind.DAY && styles.lit]} />
      ))}
    </View>
  );
}

type TableRowProps = {
  label: string | null;
  columns: readonly PillarColumn[];
  showDivider?: boolean;
  cell: (column: PillarColumn) => ReactNode;
};

function TableRow({ label, columns, showDivider = true, cell }: TableRowProps) {
  return (
    <>
      <View style={styles.row}>
        <OrtusText variant="micro" color={c.textMuted} style={[styles.labelColumn, styles.label]}>
          {label ?? ''}
        </OrtusText>
        {columns.map((col) => (
          <View key={col.kind} style={[styles.column, styles.cell]}>
            {cell(col)}
          </View>
        ))}
      </View>
      {showDivider ? <View style={styles.divider} /> : null}
    </>
  );
}

function KindHeader({ kind }: { kind: PillarKind }) {
  const { ta } = useT();
  return (
    <OrtusText variant="nano" color={kind === PillarKind.DAY ? c.accent : c.textSecondary}>
      {itemOf(ta('charts_pillar_kinds'), kind).toLocaleUpperCase()}
    </OrtusText>
  );
}

function TenGodCell({ column }: { column: PillarColumn }) {
  const t = useT();
  const isSelf = column.kind === PillarKind.DAY && column.pillar !== null;
  const text = isSelf ? t.tf('charts_day_master') : column.tenGod === null ? null : tenGodName(t, column.tenGod);
  return <SmallCell text={text} strong={isSelf} />;
}

/** A Han character tinted by its element above its name and element: "戊 / Mậu Thổ". */
function HanCell({ han, element, name }: { han: string; element: Element; name: string }) {
  const t = useT();
  return (
    <View style={styles.centred}>
      <OrtusText variant="han" color={elementColors(element).content}>
        {han}
      </OrtusText>
      <OrtusText variant="micro" color={c.textSecondary} style={styles.centreText}>
        {t.tf('charts_name_element', name, elementName(t, element))}
      </OrtusText>
    </View>
  );
}

function HiddenStemsCell({ column }: { column: PillarColumn }) {
  const t = useT();
  const stems = columnHiddenStems(column);
  if (stems.length === 0) return <SmallCell text={null} />;
  return (
    <View style={styles.centred}>
      {stems.map((stem) => (
        <OrtusText key={stem} variant="micro" color={elementColors(stemElement(stem)).content}>
          {stemName(t, stem)}
        </OrtusText>
      ))}
    </View>
  );
}

/** Centred small text, or a dash when the value is unknown (no birth hour). */
function SmallCell({ text, strong = false }: { text: string | null; strong?: boolean }) {
  const { tf } = useT();
  const color = text === null ? c.textMuted : strong ? c.accent : c.textBody;
  return (
    <OrtusText variant={strong ? 'microStrong' : 'micro'} color={color} style={styles.centreText}>
      {text ?? tf('charts_unknown')}
    </OrtusText>
  );
}

const styles = StyleSheet.create({
  highlight: { ...StyleSheet.absoluteFill, flexDirection: 'row' },
  labelColumn: { flex: LABEL_WEIGHT },
  column: { flex: 1 },
  lit: {
    ...OrtusShapes.cell,
    overflow: 'hidden',
    backgroundImage: OrtusGradients.selectedCell,
    borderWidth: OrtusStroke.hairline,
    borderColor: c.chart.selectedBorder,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: OrtusSpacing.xs },
  label: { paddingStart: OrtusSpacing.xxs },
  cell: { paddingHorizontal: OrtusSpacing.hair, alignItems: 'center', justifyContent: 'center' },
  divider: { height: OrtusStroke.hairline, backgroundColor: c.divider },
  centred: { alignItems: 'center' },
  centreText: { textAlign: 'center' },
});
