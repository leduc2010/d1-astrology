import { dialDigits, HELPLINE_DIRECTORY_URL, supportLinesFor } from '../supportLines';

// Port of SupportLinesTest.

test.each(['VN', 'vn'])('in Vietnam the local lines lead, whatever case the network reports: %s', (country) => {
  const support = supportLinesFor(country);

  expect(support.heading).toBe('ai_support_country');
  expect(support.lines[0]).toEqual({
    kind: 'phone',
    name: 'ai_support_mind_name',
    detail: 'ai_support_mind_detail',
    number: '096 306 1414',
    primary: true,
  });
  expect(support.danger).toBe('ai_support_danger');
});

test.each(['us', 'DE', ''])('elsewhere no Vietnamese number is offered: "%s"', (country) => {
  const support = supportLinesFor(country);

  expect(support.heading).toBe('ai_support_world');
  expect(support.lines[0]).toEqual({
    kind: 'web',
    name: 'ai_support_find_name',
    detail: 'ai_support_find_detail',
    url: HELPLINE_DIRECTORY_URL,
    primary: true,
  });
  expect(support.lines.every((it) => it.kind !== 'phone' || it.number === '')).toBe(true);
  expect(support.danger).toBe('ai_support_danger_world');
});

// RN only: Kotlin filtered digits inline in the screen.
test('a number is dialled digits only', () => {
  expect(dialDigits('096 306 1414')).toBe('0963061414');
});
