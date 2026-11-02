import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  lunarDateShortText,
  Reveal,
  solarDateText,
  stemBranchName,
  type UiText,
  zodiacSignName,
} from '@/core/ui';
import {
  AstralHalo,
  CalloutTone,
  FadingScrollView,
  OrtusAlpha,
  OrtusCallout,
  OrtusCard,
  OrtusColors as c,
  OrtusIcons,
  OrtusMotion,
  OrtusProgressBar,
  OrtusRadii,
  OrtusSizes,
  OrtusSpacing,
  OrtusSpinner,
  OrtusStroke,
  OrtusText,
  OrtusWideButton,
  useReducedMotion,
  withAlpha,
} from '@/designsystem';
import { type StringKey, useT } from '@/i18n';

import { BUILD_TASKS, BuildTask, buildProgress, type ChartSummary, type OnboardingUiState } from './onboardingState';

const PERCENT = 100;
const PILLAR_SEPARATOR = ' · ';

enum TaskStatus {
  Done,
  Running,
  Waiting,
}

const TASK_TITLES: Record<BuildTask, StringKey> = {
  [BuildTask.Lunar]: 'onboarding_task_lunar',
  [BuildTask.Pillars]: 'onboarding_task_pillars',
  [BuildTask.ZiWei]: 'onboarding_task_ziwei',
  [BuildTask.Planets]: 'onboarding_task_planets',
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.Done]: c.textPrimary,
  [TaskStatus.Running]: c.accentLight,
  [TaskStatus.Waiting]: c.textMuted,
};

export type BuildingStepProps = { state: OnboardingUiState; onRetry: () => void };

/** S01-08: the chart is worked out task by task, then the profile is saved. */
export function BuildingStep({ state, onRetry }: BuildingStepProps) {
  const t = useT();
  const reduced = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { build } = state;
  const progress = buildProgress(build);
  const summary = build.summary;
  return (
    <FadingScrollView
      style={[styles.fill, { marginTop: insets.top, marginBottom: insets.bottom }]}
      contentContainerStyle={styles.content}
    >
      <Reveal index={0}>
        <AstralHalo size={OrtusSizes.halo} active={!build.saveFailed} />
      </Reveal>
      <Reveal index={1} style={styles.centerColumn}>
        <OrtusText variant="h1" color={c.textPrimary} style={styles.center}>
          {t.tf('onboarding_building_title')}
        </OrtusText>
        <View style={styles.gapXs} />
        <OrtusText variant="body" color={c.textSecondary} style={styles.center}>
          {t.tf('onboarding_building_body')}
        </OrtusText>
      </Reveal>
      {summary !== null && (
        <Reveal index={2} style={styles.stretch}>
          <OrtusCard gap={OrtusSpacing.md}>
            <View style={styles.headerRow}>
              <OrtusText variant="bodyMedium" color={c.textPrimary} style={styles.fill}>
                {t.tf(
                  'onboarding_review_pair',
                  summary.birth.profile.name,
                  solarDateText(summary.birth.solarDate, t.language, 'medium'),
                )}
              </OrtusText>
              <OrtusText variant="captionStrong" color={c.accent}>
                {t.tf('onboarding_progress', Math.round(progress * PERCENT))}
              </OrtusText>
            </View>
            <OrtusProgressBar progress={progress} />
            {BUILD_TASKS.map((task) => (
              <TaskRow key={task} task={task} status={statusOf(task, build.completedTasks)} summary={summary} />
            ))}
          </OrtusCard>
        </Reveal>
      )}
      {build.saveFailed && (
        <Animated.View
          entering={reduced ? undefined : FadeIn.duration(OrtusMotion.STANDARD).easing(OrtusMotion.settle)}
          style={styles.failed}
        >
          <OrtusCallout text={t.tf('onboarding_save_failed')} tone={CalloutTone.Warning} />
          <OrtusWideButton text={t.tf('onboarding_retry')} onPress={onRetry} />
        </Animated.View>
      )}
    </FadingScrollView>
  );
}

function statusOf(task: BuildTask, completedTasks: number): TaskStatus {
  if (task < completedTasks) return TaskStatus.Done;
  return task === completedTasks ? TaskStatus.Running : TaskStatus.Waiting;
}

function TaskRow({ task, status, summary }: { task: BuildTask; status: TaskStatus; summary: ChartSummary }) {
  const t = useT();
  const detail =
    status === TaskStatus.Done
      ? taskResult(t, task, summary)
      : t.tf(status === TaskStatus.Running ? 'onboarding_task_running' : 'onboarding_task_waiting');
  return (
    <View style={styles.taskRow}>
      <StatusIcon status={status} />
      <View style={styles.fill}>
        <OrtusText variant="bodyMedium" color={STATUS_COLORS[status]}>
          {t.tf(TASK_TITLES[task])}
        </OrtusText>
        <OrtusText variant="caption" color={c.textSecondary}>
          {detail}
        </OrtusText>
      </View>
    </View>
  );
}

function StatusIcon({ status }: { status: TaskStatus }) {
  if (status === TaskStatus.Done) {
    return (
      <View style={[styles.statusIcon, styles.doneIcon]}>
        <OrtusIcons.Check size={OrtusSizes.iconTiny} color={c.success} />
      </View>
    );
  }
  return (
    <View style={styles.statusIcon}>
      {status === TaskStatus.Running ? (
        <OrtusSpinner size={OrtusSizes.spinner} />
      ) : (
        <View style={[styles.statusIcon, styles.waitingIcon]} />
      )}
    </View>
  );
}

/** What a finished task found, e.g. "Ất Hợi · Giáp Thân · …" for the pillars. */
function taskResult(t: UiText, task: BuildTask, summary: ChartSummary): string {
  switch (task) {
    case BuildTask.Lunar:
      return lunarDateShortText(t, summary.birth.lunarDate);
    case BuildTask.Pillars: {
      const { year, month, day, hour } = summary.pillars;
      return [year, month, day, hour]
        .filter((pillar) => pillar !== null)
        .map((pillar) => stemBranchName(t, pillar))
        .join(PILLAR_SEPARATOR);
    }
    case BuildTask.ZiWei:
      return summary.lifePalace === null
        ? t.tf('onboarding_task_skipped')
        : t.tf('onboarding_task_life_palace', stemBranchName(t, summary.lifePalace));
    case BuildTask.Planets:
      return t.tf('onboarding_task_sun', zodiacSignName(t, summary.sunLongitude));
  }
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: OrtusSpacing.screen,
    paddingVertical: OrtusSpacing.xl,
    gap: OrtusSpacing.cardGap,
  },
  centerColumn: { alignItems: 'center' },
  center: { textAlign: 'center' },
  gapXs: { height: OrtusSpacing.xs },
  stretch: { alignSelf: 'stretch' },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: OrtusSpacing.sm },
  statusIcon: {
    width: OrtusSizes.statusIcon,
    height: OrtusSizes.statusIcon,
    borderRadius: OrtusRadii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneIcon: { backgroundColor: withAlpha(c.success, OrtusAlpha.STATUS_FILL) },
  waitingIcon: { borderWidth: OrtusStroke.control, borderColor: c.outline },
  failed: { alignSelf: 'stretch', gap: OrtusSpacing.sm },
});
