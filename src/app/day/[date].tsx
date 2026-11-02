import { useLocalSearchParams } from 'expo-router';

import { parseIsoDate } from '@/engine';
import { DayScreen } from '@/features/calendar';

/** `/day/2026-11-01`: an unreadable date opens today. */
export default function DayRoute() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  return <DayScreen start={typeof date === 'string' ? parseIsoDate(date) : null} />;
}
