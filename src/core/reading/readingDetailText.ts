import { elementName } from '../ui/almanacText';
import { mainStarName, palaceRoleName, planetName } from '../ui/chartText';
import { zodiacSignNameOf } from '../ui/ganZhiText';
import { planetInHouse, planetInSign, risingInSign } from '../ui/natalText';
import { itemOf, type UiText } from '../ui/uiText';
import { brightnessName, starInPalace } from '../ui/ziWeiText';
import type { ReadingDetail } from './readingDetails';

/** The chart detail a [detail] reads: "Tian Ji in Career · Temple", "Venus in house 7". */
export function detailLabel(t: UiText, detail: ReadingDetail): string {
  const { tf, ta } = t;
  switch (detail.kind) {
    case 'StarInPalace':
      return tf(
        detail.borrowed ? 'reading_detail_star_borrowed' : 'reading_detail_star',
        mainStarName(t, detail.star),
        palaceRoleName(t, detail.role),
        brightnessName(t, detail.brightness),
      );
    case 'DayMasterLevel':
      return tf('reading_detail_level', itemOf(ta('strength_levels'), detail.level));
    case 'UsefulFields':
      return tf('reading_detail_fields', elementName(t, detail.element));
    case 'UsefulHabits':
      return tf('reading_detail_habits', elementName(t, detail.element));
    case 'WealthCapacity':
      return tf('reading_detail_wealth');
    case 'PlanetInSign':
      return tf('reading_fact_planet', planetName(t, detail.planet), zodiacSignNameOf(t, detail.sign));
    case 'PlanetInHouse':
      return tf('reading_detail_house', planetName(t, detail.planet), detail.house);
    case 'Rising':
      return tf('reading_detail_rising', zodiacSignNameOf(t, detail.sign));
  }
}

/** What the [detail] says, as one or two full sentences. */
export function detailBody(t: UiText, detail: ReadingDetail): string {
  const { tf, ta } = t;
  switch (detail.kind) {
    case 'StarInPalace':
      return starInPalace(t, detail.star, detail.role);
    case 'DayMasterLevel':
      return itemOf(ta('strength_bodies'), detail.level);
    case 'UsefulFields':
      return tf('reading_detail_fields_body', itemOf(ta('useful_fields'), detail.element));
    case 'UsefulHabits':
      return itemOf(ta('useful_habits'), detail.element);
    case 'WealthCapacity':
      return itemOf(ta('reading_wealth_by_strength'), detail.level);
    case 'PlanetInSign':
      return planetInSign(t, detail.planet, detail.sign);
    case 'PlanetInHouse':
      return planetInHouse(t, detail.planet, detail.house);
    case 'Rising':
      return risingInSign(t, detail.sign);
  }
}
