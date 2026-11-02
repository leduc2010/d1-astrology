import type { BirthPlace } from '../../model';
import type { UiText } from '../uiText';

/** "Hà Đông, Hà Nội"; just "Hà Nội" when the city is its own province or the place has no region. */
export function placeName(t: UiText, place: Pick<BirthPlace, 'name' | 'region'>): string {
  return place.region.trim().length === 0 || place.region === place.name
    ? place.name
    : t.tf('birth_place_name', place.name, place.region);
}
