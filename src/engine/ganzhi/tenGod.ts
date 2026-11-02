import { idiv } from '../util';
import { controls, generatedBy, generates, Stem, stemElement, stemIsYang } from './ganzhi';

/** The ten gods (Thập thần): how a stem relates to the day master, by phase and polarity. */
export enum TenGod {
  FRIEND,
  ROB_WEALTH,
  EATING_GOD,
  HURTING_OFFICER,
  INDIRECT_WEALTH,
  DIRECT_WEALTH,
  SEVEN_KILLINGS,
  DIRECT_OFFICER,
  INDIRECT_RESOURCE,
  DIRECT_RESOURCE,
}

/** The five relation groups, two gods each (same polarity first). */
export enum TenGodGroup {
  COMPANION,
  OUTPUT,
  WEALTH,
  POWER,
  RESOURCE,
}
export const TEN_GOD_GROUPS: readonly TenGodGroup[] = [
  TenGodGroup.COMPANION, TenGodGroup.OUTPUT, TenGodGroup.WEALTH, TenGodGroup.POWER, TenGodGroup.RESOURCE,
];

export const tenGodGroup = (god: TenGod): TenGodGroup => idiv(god, 2);

/** Relation of [other] to the day master [self]. */
export function tenGodOf(self: Stem, other: Stem): TenGod {
  const own = stemElement(self);
  const theirs = stemElement(other);
  let group: TenGodGroup;
  if (theirs === own) group = TenGodGroup.COMPANION;
  else if (theirs === generates(own)) group = TenGodGroup.OUTPUT;
  else if (theirs === controls(own)) group = TenGodGroup.WEALTH;
  else if (theirs === generatedBy(own)) group = TenGodGroup.RESOURCE;
  else group = TenGodGroup.POWER;
  const samePolarity = stemIsYang(self) === stemIsYang(other);
  return group * 2 + (samePolarity ? 0 : 1);
}
