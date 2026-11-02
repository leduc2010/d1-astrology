import { useLocalSearchParams } from 'expo-router';

import { MatchResultScreen } from '@/features/match';

/** A link with no stored person behind it (or no number at all) reads as gone and goes back. */
export default function MatchResultRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MatchResultScreen partnerId={Number(id)} />;
}
