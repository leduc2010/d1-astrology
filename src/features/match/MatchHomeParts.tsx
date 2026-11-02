import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  civilDateOfEpochDay,
  relationshipName,
  solarDateText,
  stemBranchName,
  YearSeal,
  zodiacSignName,
} from '@/core/ui';
import {
  IconBox,
  OrtusCard,
  OrtusCardRow,
  OrtusColors,
  OrtusGlowCard,
  OrtusIcons,
  OrtusListRow,
  OrtusRadii,
  OrtusSizes,
  OrtusSpacing,
  OrtusStroke,
  OrtusText,
  SectionLabel,
} from '@/designsystem';
import { useT } from '@/i18n';

import type { MatchHomeUiState, OwnerSummary, PartnerSummary } from './matchHomeModel';

type Ready = Extract<MatchHomeUiState, { kind: 'Ready' }>;

/** The two people side by side with a heart between them. */
export function PairCards({ state, onAddPartner }: { state: Ready; onAddPartner: () => void }) {
  const t = useT();
  const owner = state.owner;
  const other = state.selected;
  const year = other?.lunarYear ?? null;
  return (
    <View style={styles.pair}>
      <OrtusCardRow>
        <PersonCard
          name={owner.name}
          detail={t.tf('match_detail', stemBranchName(t, owner.lunarYear), zodiacSignName(t, owner.sunLongitude))}
          seal={<YearSeal branch={owner.lunarYear.branch} />}
        />
        {other === null ? (
          <PersonCard
            name={t.tf('match_pick_partner')}
            detail={null}
            onPress={onAddPartner}
            seal={<IconBox icon={OrtusIcons.Plus} style={styles.emptySeal} />}
          />
        ) : (
          <PersonCard
            name={other.partner.profile.name}
            detail={t.tf(
              'match_detail',
              year ? stemBranchName(t, year) : t.tf('match_partner_out_of_range'),
              relationshipName(t, other.partner.relationship),
            )}
            seal={year ? <YearSeal branch={year.branch} /> : <IconBox icon={OrtusIcons.Me} style={styles.emptySeal} />}
          />
        )}
      </OrtusCardRow>
      <View style={styles.heartLayer} pointerEvents="none">
        <HeartBadge />
      </View>
    </View>
  );
}

type PersonCardProps = { name: string; detail: string | null; onPress?: () => void; seal: ReactNode };

function PersonCard({ name, detail, onPress, seal }: PersonCardProps) {
  const content = (
    <View style={styles.person}>
      {seal}
      <OrtusText variant="title" color={OrtusColors.textPrimary} style={styles.center}>
        {name}
      </OrtusText>
      {detail !== null ? (
        <OrtusText variant="caption" color={OrtusColors.textBody} style={styles.center}>
          {detail}
        </OrtusText>
      ) : null}
    </View>
  );
  // A person who is in the pair glows; the empty slot stays a plain card inviting a tap.
  return detail !== null ? (
    <OrtusGlowCard onPress={onPress} showStar={false} style={styles.fill}>
      {content}
    </OrtusGlowCard>
  ) : (
    <OrtusCard onPress={onPress} style={styles.fill} accessibilityLabel={name}>
      {content}
    </OrtusCard>
  );
}

function HeartBadge() {
  return (
    <View style={styles.heart}>
      <OrtusIcons.Heart size={OrtusSizes.cardStar} color={OrtusColors.accentLight} />
    </View>
  );
}

type SavedPairsProps = { state: Ready; onOpenResult: (id: number) => void; onSelect: (id: number) => void };

/** Everyone added before, newest first; a tap picks the person and opens the match. */
export function SavedPairs({ state, onOpenResult, onSelect }: SavedPairsProps) {
  const t = useT();
  const newestFirst = [...state.partners].reverse();
  return (
    <View style={styles.saved}>
      <SectionLabel text={t.tf('match_saved_pairs')} />
      {newestFirst.length === 0 ? (
        <OrtusText variant="callout" color={OrtusColors.textMuted}>
          {t.tf('match_empty')}
        </OrtusText>
      ) : (
        <OrtusCard contentPadding={OrtusSpacing.xs}>
          {newestFirst.map((person, index) => {
            const partner = person.partner;
            return (
              <OrtusListRow
                key={partner.id}
                title={t.tf('match_pair_name', state.owner.name, partner.profile.name)}
                subtitle={t.tf(
                  'match_detail',
                  relationshipName(t, partner.relationship),
                  solarDateText(civilDateOfEpochDay(partner.addedOnEpochDay), t.language, 'medium'),
                )}
                leading={<PairAvatars owner={state.owner} person={person} />}
                showDivider={index < newestFirst.length - 1}
                onPress={() => {
                  onSelect(partner.id);
                  onOpenResult(partner.id);
                }}
              />
            );
          })}
        </OrtusCard>
      )}
    </View>
  );
}

/** Two small overlapping seals: the owner's year and the other person's. */
function PairAvatars({ owner, person }: { owner: OwnerSummary; person: PartnerSummary }) {
  return (
    <View style={styles.avatars}>
      <YearSeal branch={owner.lunarYear.branch} size={OrtusSizes.pairAvatar} variant="hanTag" />
      {person.lunarYear ? (
        <YearSeal
          branch={person.lunarYear.branch}
          size={OrtusSizes.pairAvatar}
          variant="hanTag"
          style={styles.secondAvatar}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pair: { width: '100%', justifyContent: 'center' },
  heartLayer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  heart: {
    width: OrtusSizes.matchHeart,
    height: OrtusSizes.matchHeart,
    borderRadius: OrtusRadii.pill,
    backgroundColor: OrtusColors.surfaceRaised,
    borderWidth: OrtusStroke.hairline,
    borderColor: OrtusColors.glowBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: { flex: 1 },
  person: { width: '100%', alignItems: 'center', gap: OrtusSpacing.xs },
  center: { textAlign: 'center' },
  emptySeal: { width: OrtusSizes.matchSeal, height: OrtusSizes.matchSeal },
  saved: { gap: OrtusSpacing.xs },
  avatars: { width: OrtusSizes.pairAvatar + OrtusSpacing.md, height: OrtusSizes.pairAvatar },
  secondAvatar: { position: 'absolute', left: OrtusSpacing.md, top: 0 },
});
