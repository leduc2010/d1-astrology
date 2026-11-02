import { Topic, TOPICS } from '@/core/reading';

import { folded, hasPhrase } from './textMatch';

/**
 * Picks the topic a question is about from plain keywords (English and Vietnamese, folded).
 * The topic with the most hits wins; ties go to the order of [Topic]; no hit means personality.
 * Investment wording never gets here: the investment detector turns it away first.
 * Words that fold into other everyday words ("yếu"/"yêu", "tiến"/"tiền", "nhá"/"nhà") are left out
 * or only used inside a longer phrase.
 */
const KEYWORDS: Readonly<Record<Topic, readonly string[]>> = {
  [Topic.PERSONALITY]: [
    'personality', 'character', 'who am i', 'strength', 'strengths', 'direct',
    'tinh cach', 'ban than', 'diem manh', 'noi thang', 'con nguoi minh',
  ],
  [Topic.CAREER]: [
    'career', 'job', 'jobs', 'work', 'boss', 'promotion', 'business', 'interview',
    'cong viec', 'su nghiep', 'doi viec', 'thang chuc', 'kinh doanh', 'phong van', 'sep',
  ],
  [Topic.LOVE]: [
    'love', 'partner', 'relationship', 'marriage', 'marry', 'dating', 'crush',
    'tinh yeu', 'nguoi yeu', 'hon nhan', 'ket hon', 'vo chong', 'tinh cam', 'hen ho',
  ],
  [Topic.MONEY]: [
    'money', 'finance', 'finances', 'salary', 'income', 'savings',
    'tien bac', 'kiem tien', 'tai chinh', 'tien luong', 'muc luong', 'thu nhap', 'tiet kiem',
  ],
  [Topic.FAMILY]: [
    'family', 'parents', 'home', 'children', 'kids', 'mother', 'father',
    'gia dinh', 'bo me', 'cha me', 'nha cua', 'con cai', 'anh chi em',
  ],
  [Topic.WELLBEING]: [
    'health', 'stress', 'stressed', 'sleep', 'tired', 'rest', 'anxious', 'wellbeing',
    'suc khoe', 'giac ngu', 'mat ngu', 'met moi', 'cang thang', 'nghi ngoi', 'lo lang',
  ],
};

export function topicOf(question: string): Topic {
  const text = folded(question);
  const hits = TOPICS.map((topic) => KEYWORDS[topic].filter((it) => hasPhrase(text, it)).length);
  const best = Math.max(...hits);
  return best === 0 ? Topic.PERSONALITY : TOPICS[hits.indexOf(best)];
}
