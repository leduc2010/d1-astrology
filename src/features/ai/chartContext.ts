import {
  branchOfRole,
  ELEMENTS,
  houseOf,
  PALACE_ROLES,
  Planet,
  PLANETS,
  type ZiWeiChart,
} from '@/engine';
import {
  detailBody,
  detailLabel,
  factLine,
  ReadingSystem,
  systemName,
  topicHeadline,
  topicName,
  type ReadingCharts,
  type TopicReading,
} from '@/core/reading';
import {
  elementName,
  itemOf,
  mainStarName,
  palaceRoleName,
  planetName,
  stemName,
  zodiacSignNameOf,
  type UiText,
} from '@/core/ui';

/**
 * The chart summary Ask AI sends to the proxy: what the device already worked out, in the app
 * language so the model can quote names the owner sees on screen. It holds no name or birth place
 * and no literal date or clock time; tests check that. It is computed from the birth date and
 * time, so a determined reader could work them back out: the consent sheet says so.
 */
export function chartContext(t: UiText, charts: ReadingCharts, readings: readonly TopicReading[]): string {
  return [overview(t, charts), ...readings.map((r) => topicSection(t, r))].join('\n\n');
}

function overview(t: UiText, charts: ReadingCharts): string {
  const lines = ['# Chart overview'];
  lines.push(`${systemName(t, ReadingSystem.BAZI)} [BaZi]:`);
  lines.push(`- Day master: ${stemName(t, charts.dayMaster)}; strength: ${itemOf(t.ta('strength_levels'), charts.strength.level)}`);
  lines.push(`- Useful element: ${elementName(t, charts.strength.useful)}; supporting: ${elementName(t, charts.strength.favorable)}`);
  const balance = ELEMENTS.map((e) => `${elementName(t, e)} ${charts.balance.get(e) ?? 0}`).join(', ');
  lines.push(`- Five-element count: ${balance}`);
  if (charts.ziWei) lines.push(`${systemName(t, ReadingSystem.ZIWEI)} [Zi Wei Dou Shu] palaces:`, ...palaces(t, charts.ziWei));
  else lines.push(`${systemName(t, ReadingSystem.ZIWEI)} [Zi Wei Dou Shu]: not available (birth time unknown)`);
  lines.push(`${systemName(t, ReadingSystem.WESTERN)} [Western natal chart]:`);
  const chart = charts.natal;
  for (const planet of PLANETS) {
    const position = chart.planets.get(planet);
    if (!position) continue;
    const house = houseOf(chart, planet);
    const uncertain = planet === Planet.MOON && !charts.isMoonCertain ? ' (uncertain: birth time unknown)' : '';
    lines.push(
      `- ${planetName(t, planet)}: ${zodiacSignNameOf(t, position.sign)}${house === null ? '' : `, house ${house}`}${uncertain}`,
    );
  }
  if (chart.ascendant) lines.push(`- Rising: ${zodiacSignNameOf(t, chart.ascendant.sign)}`);
  else lines.push('- Rising and houses: not available (birth time unknown)');
  return lines.join('\n');
}

function palaces(t: UiText, ziWei: ZiWeiChart): string[] {
  return PALACE_ROLES.map((role) => {
    const branch = branchOfRole(ziWei, role);
    const stars = [...ziWei.mainStars].filter(([, b]) => b === branch).map(([star]) => mainStarName(t, star));
    return `- ${palaceRoleName(t, role)}: ${stars.length > 0 ? stars.join(', ') : 'no main star'}`;
  });
}

function topicSection(t: UiText, reading: TopicReading): string {
  const lines = [`# ${topicName(t, reading.topic)}`, `Overall: ${topicHeadline(t, reading.topic, reading.tone)}`];
  lines.push(`Systems agreeing: ${reading.agreement} of ${reading.available}`);
  for (const fact of reading.facts) lines.push(`- ${systemName(t, fact.system)}: ${factLine(t, fact)}`);
  for (const detail of reading.details) lines.push(`- ${detailLabel(t, detail)}: ${detailBody(t, detail)}`);
  return lines.join('\n');
}
