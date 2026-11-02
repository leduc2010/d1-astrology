import { folded, Phrases } from './textMatch';

/**
 * Spots a question that sounds like the person may be in danger, so the app offers real people
 * to talk to (S06-06) instead of an astrology answer. Every app language is checked whatever the
 * app is set to, since people often write in their own language.
 *
 * Matching is on folded text, so it works with or without Vietnamese marks. Phrases that fold into
 * everyday words ("tự tử" and "từ từ" both become "tu tu") are matched only with their marks.
 */
const PHRASES = new Phrases(
  [
    // English
    'suicide', 'suicidal', 'kill myself', 'end my life', 'take my own life', 'want to die', 'wanna die',
    'self harm', 'hurt myself', 'cut myself', 'no reason to live', "don't want to live", 'dont want to live',
    'do not want to live', 'end it all', 'better off dead',
    // Vietnamese (folded)
    'tu sat', 'muon chet', 'khong muon song', 'chan song', 'ket lieu', 'tu ket lieu', 'muon tu tu',
    'tu lam hai', 'tu hai ban than', 'rach tay',
    // German
    'selbstmord', 'suizid', 'mich umbringen', 'will sterben', 'nicht mehr leben', 'mir das leben nehmen',
    'mich selbst verletzen', 'mich ritzen',
    // Spanish
    'suicidio', 'suicidarme', 'quiero morir', 'quiero morirme', 'matarme', 'quitarme la vida',
    'no quiero vivir', 'hacerme daño', 'autolesión',
    // French
    'me suicider', 'me tuer', 'envie de mourir', 'veux mourir', 'en finir avec la vie',
    'plus envie de vivre', 'me faire du mal', 'automutilation', 'me scarifier',
    // Portuguese
    'suicídio', 'me matar', 'quero morrer', 'tirar minha vida', 'tirar a minha vida', 'não quero viver',
    'me machucar', 'automutilação', 'me cortar',
    // Dutch
    'zelfmoord', 'zelfdoding', 'mezelf van kant maken', 'wil dood', 'niet meer leven', 'mezelf pijn doen',
    'zelfbeschadiging',
    // Indonesian
    'bunuh diri', 'ingin mati', 'pengen mati', 'mau mati', 'mengakhiri hidup', 'tidak ingin hidup',
    'menyakiti diri',
    // Russian
    'самоубийство', 'суицид', 'убить себя', 'покончить с собой', 'хочу умереть', 'не хочу жить',
    'причинить себе вред', 'порезать себя',
  ],
  [
    // Arabic
    'انتحار', 'انتحر', 'اقتل نفسي', 'أقتل نفسي', 'أريد أن أموت', 'اريد ان اموت', 'لا أريد أن أعيش', 'إيذاء نفسي',
    // Hindi
    'आत्महत्या', 'खुदकुशी', 'ख़ुदकुशी', 'मरना चाहता', 'मरना चाहती', 'जीना नहीं चाहता', 'जीना नहीं चाहती',
    'खुद को मार', 'खुद को नुकसान',
    // Bengali
    'আত্মহত্যা', 'মরে যেতে চাই', 'মরতে চাই', 'বাঁচতে চাই না', 'নিজেকে শেষ করে', 'নিজের ক্ষতি করতে',
    // Chinese
    '自杀', '自殺', '想死', '不想活', '轻生', '輕生', '结束生命', '結束生命', '自残', '自殘', '割腕',
    // Korean
    '자살', '죽고 싶', '죽고싶', '살고 싶지 않', '살기 싫', '목숨을 끊', '자해',
  ],
);

const MARKED = ['tự tử', 'tự vẫn'] as const;

export function isCrisis(text: string): boolean {
  const lower = text.toLowerCase();
  return PHRASES.anyIn(folded(text)) || MARKED.some((it) => lower.includes(it));
}
