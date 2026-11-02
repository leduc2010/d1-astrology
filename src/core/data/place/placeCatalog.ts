import { birthPlace, type BirthPlace } from '../../model';
import { VIETNAM_ZONE } from './birthZones';

const DEFAULT_LIMIT = 6;
const RANK_PREFIX = 0;
const RANK_NAME = 1;
const RANK_REGION = 2;

function combiningMarks(): RegExp {
  try {
    return new RegExp('\\p{Mn}+', 'gu');
  } catch {
    // Engines without Unicode property escapes: the combining diacritics block covers Vietnamese.
    return new RegExp('[\\u0300-\\u036f]+', 'g');
  }
}

const COMBINING_MARKS = combiningMarks();

const vn = (name: string, province: string, lat: number, lon: number): BirthPlace =>
  birthPlace(name, province, lat, lon, VIETNAM_ZONE);

const VIETNAM: readonly BirthPlace[] = [
  vn('Hà Nội', 'Hà Nội', 21.03, 105.85),
  vn('Hà Đông', 'Hà Nội', 20.97, 105.78),
  vn('Sài Gòn', 'TP. Hồ Chí Minh', 10.78, 106.7),
  vn('Hải Phòng', 'Hải Phòng', 20.86, 106.68),
  vn('Đà Nẵng', 'Đà Nẵng', 16.05, 108.22),
  vn('Cần Thơ', 'Cần Thơ', 10.03, 105.78),
  vn('Huế', 'Thừa Thiên Huế', 16.46, 107.59),
  vn('Nha Trang', 'Khánh Hòa', 12.24, 109.19),
  vn('Đà Lạt', 'Lâm Đồng', 11.94, 108.44),
  vn('Vinh', 'Nghệ An', 18.67, 105.69),
  vn('Thanh Hóa', 'Thanh Hóa', 19.81, 105.78),
  vn('Nam Định', 'Nam Định', 20.43, 106.18),
  vn('Hải Dương', 'Hải Dương', 20.94, 106.33),
  vn('Bắc Ninh', 'Bắc Ninh', 21.19, 106.08),
  vn('Thái Nguyên', 'Thái Nguyên', 21.59, 105.85),
  vn('Hạ Long', 'Quảng Ninh', 20.95, 107.08),
  vn('Lạng Sơn', 'Lạng Sơn', 21.85, 106.76),
  vn('Lào Cai', 'Lào Cai', 22.48, 103.98),
  vn('Điện Biên Phủ', 'Điện Biên', 21.39, 103.02),
  vn('Sơn La', 'Sơn La', 21.33, 103.91),
  vn('Hòa Bình', 'Hòa Bình', 20.82, 105.34),
  vn('Ninh Bình', 'Ninh Bình', 20.25, 105.97),
  vn('Thái Bình', 'Thái Bình', 20.45, 106.34),
  vn('Hà Tĩnh', 'Hà Tĩnh', 18.34, 105.91),
  vn('Đồng Hới', 'Quảng Bình', 17.47, 106.62),
  vn('Đông Hà', 'Quảng Trị', 16.82, 107.1),
  vn('Quảng Ngãi', 'Quảng Ngãi', 15.12, 108.8),
  vn('Quy Nhơn', 'Bình Định', 13.78, 109.22),
  vn('Tuy Hòa', 'Phú Yên', 13.1, 109.3),
  vn('Buôn Ma Thuột', 'Đắk Lắk', 12.67, 108.04),
  vn('Pleiku', 'Gia Lai', 13.98, 108.0),
  vn('Kon Tum', 'Kon Tum', 14.35, 108.0),
  vn('Phan Thiết', 'Bình Thuận', 10.93, 108.1),
  vn('Biên Hòa', 'Đồng Nai', 10.95, 106.82),
  vn('Thủ Dầu Một', 'Bình Dương', 10.98, 106.65),
  vn('Vũng Tàu', 'Bà Rịa – Vũng Tàu', 10.35, 107.08),
  vn('Tây Ninh', 'Tây Ninh', 11.31, 106.1),
  vn('Mỹ Tho', 'Tiền Giang', 10.36, 106.36),
  vn('Bến Tre', 'Bến Tre', 10.24, 106.38),
  vn('Vĩnh Long', 'Vĩnh Long', 10.25, 105.97),
  vn('Long Xuyên', 'An Giang', 10.39, 105.44),
  vn('Rạch Giá', 'Kiên Giang', 10.01, 105.08),
  vn('Sóc Trăng', 'Sóc Trăng', 9.6, 105.97),
  vn('Bạc Liêu', 'Bạc Liêu', 9.29, 105.72),
  vn('Cà Mau', 'Cà Mau', 9.18, 105.15),
];

const WORLD: readonly BirthPlace[] = [
  birthPlace('Bangkok', 'Thailand', 13.76, 100.5, 'Asia/Bangkok'),
  birthPlace('Phnom Penh', 'Cambodia', 11.56, 104.92, 'Asia/Phnom_Penh'),
  birthPlace('Vientiane', 'Laos', 17.97, 102.63, 'Asia/Vientiane'),
  birthPlace('Singapore', 'Singapore', 1.35, 103.82, 'Asia/Singapore'),
  birthPlace('Kuala Lumpur', 'Malaysia', 3.14, 101.69, 'Asia/Kuala_Lumpur'),
  birthPlace('Jakarta', 'Indonesia', -6.21, 106.85, 'Asia/Jakarta'),
  birthPlace('Manila', 'Philippines', 14.6, 120.98, 'Asia/Manila'),
  birthPlace('Beijing', 'China', 39.9, 116.4, 'Asia/Shanghai'),
  birthPlace('Shanghai', 'China', 31.23, 121.47, 'Asia/Shanghai'),
  birthPlace('Hong Kong', 'China', 22.32, 114.17, 'Asia/Hong_Kong'),
  birthPlace('Taipei', 'Taiwan', 25.03, 121.57, 'Asia/Taipei'),
  birthPlace('Tokyo', 'Japan', 35.68, 139.69, 'Asia/Tokyo'),
  birthPlace('Seoul', 'South Korea', 37.57, 126.98, 'Asia/Seoul'),
  birthPlace('New Delhi', 'India', 28.61, 77.21, 'Asia/Kolkata'),
  birthPlace('Mumbai', 'India', 19.08, 72.88, 'Asia/Kolkata'),
  birthPlace('Dhaka', 'Bangladesh', 23.81, 90.41, 'Asia/Dhaka'),
  birthPlace('Dubai', 'United Arab Emirates', 25.2, 55.27, 'Asia/Dubai'),
  birthPlace('Cairo', 'Egypt', 30.04, 31.24, 'Africa/Cairo'),
  birthPlace('Moscow', 'Russia', 55.76, 37.62, 'Europe/Moscow'),
  birthPlace('Berlin', 'Germany', 52.52, 13.4, 'Europe/Berlin'),
  birthPlace('Paris', 'France', 48.86, 2.35, 'Europe/Paris'),
  birthPlace('Amsterdam', 'Netherlands', 52.37, 4.9, 'Europe/Amsterdam'),
  birthPlace('London', 'United Kingdom', 51.51, -0.13, 'Europe/London'),
  birthPlace('Madrid', 'Spain', 40.42, -3.7, 'Europe/Madrid'),
  birthPlace('São Paulo', 'Brazil', -23.55, -46.63, 'America/Sao_Paulo'),
  birthPlace('Mexico City', 'Mexico', 19.43, -99.13, 'America/Mexico_City'),
  birthPlace('New York', 'United States', 40.71, -74.01, 'America/New_York'),
  birthPlace('Los Angeles', 'United States', 34.05, -118.24, 'America/Los_Angeles'),
  birthPlace('Toronto', 'Canada', 43.65, -79.38, 'America/Toronto'),
  birthPlace('Sydney', 'Australia', -33.87, 151.21, 'Australia/Sydney'),
];

/** Lowercase without diacritics; đ folds to d, which Unicode decomposition leaves alone. */
export function foldPlaceText(text: string): string {
  return text.trim().toLowerCase().normalize('NFD').replace(COMBINING_MARKS, '').replace(/đ/g, 'd');
}

/**
 * Offline list of birth places: Vietnamese provincial cities plus major world cities.
 * Place names are proper nouns and stay in their local form in every language.
 */
const places: readonly BirthPlace[] = Object.freeze([...VIETNAM, ...WORLD]);

interface IndexedPlace {
  readonly place: BirthPlace;
  readonly name: string;
  readonly region: string;
}

let indexed: readonly IndexedPlace[] | null = null;

function index(): readonly IndexedPlace[] {
  indexed ??= places.map((place) => ({ place, name: foldPlaceText(place.name), region: foldPlaceText(place.region) }));
  return indexed;
}

function rankOf(entry: IndexedPlace, needle: string): number | null {
  if (entry.name.startsWith(needle)) return RANK_PREFIX;
  if (entry.name.includes(needle)) return RANK_NAME;
  if (entry.region.includes(needle)) return RANK_REGION;
  return null;
}

/**
 * Places matching [query], ignoring case and diacritics ("ha dong" finds "Hà Đông").
 * Names starting with the query come first, then other name matches, then region matches;
 * catalog order is kept within a rank.
 */
export function searchPlaces(query: string, limit: number = DEFAULT_LIMIT): readonly BirthPlace[] {
  const needle = foldPlaceText(query);
  if (needle === '') return [];
  return index()
    .flatMap((entry) => {
      const rank = rankOf(entry, needle);
      return rank === null ? [] : [{ rank, place: entry.place }];
    })
    .sort((a, b) => a.rank - b.rank)
    .slice(0, Math.max(limit, 0))
    .map((it) => it.place);
}

export const PlaceCatalog = Object.freeze({
  places,
  search: searchPlaces,
  fold: foldPlaceText,
});
