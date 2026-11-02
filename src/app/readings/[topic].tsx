import { useLocalSearchParams } from 'expo-router';

import { ReadingArticleScreen } from '@/features/readings';

export default function ReadingRoute() {
  const { topic, lens } = useLocalSearchParams<{ topic: string; lens?: string }>();
  return <ReadingArticleScreen topicKey={topic} lensKey={lens} />;
}
