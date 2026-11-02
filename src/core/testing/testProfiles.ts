import { searchPlaces } from '../data/place/placeCatalog';
import { birthClock, Gender, type BirthDate, type BirthPlace, type BirthProfile } from '../model';

function firstPlace(query: string): BirthPlace {
  const place = searchPlaces(query)[0];
  if (!place) throw new Error(`no catalog place for ${query}`);
  return place;
}

const hanoi = firstPlace('Hà Nội');

/** Made-up birth profiles every feature's tests can share. */
export const TestProfiles = Object.freeze({
  hanoi,

  /** The app's owner: a known date and time. */
  owner: Object.freeze<BirthProfile>({
    name: 'Lan',
    gender: Gender.FEMALE,
    date: Object.freeze({ year: 1990, month: 5, day: 15 }),
    clock: birthClock(12, 0),
    place: hanoi,
    enteredAsLunar: false,
  }),

  /** Someone added by the owner, birth time unknown. */
  other: Object.freeze<BirthProfile>({
    name: 'Minh',
    gender: Gender.MALE,
    date: Object.freeze({ year: 1988, month: 10, day: 3 }),
    clock: null,
    place: hanoi,
    enteredAsLunar: false,
  }),

  /** A date before the supported calendar range. */
  outOfRange: Object.freeze<BirthDate>({ year: 1850, month: 1, day: 1 }),
});
