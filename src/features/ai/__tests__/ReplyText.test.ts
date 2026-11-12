import { plainReply } from '../replyText';

test('takes Markdown marks out of a reply', () => {
  const md = '**Xu hướng:** Thiên Cơ *linh hoạt*.\n\n*   **Giá trị:** chậm mà chắc\n- Mộc\n## Gợi ý\nNghỉ ngơi.';
  expect(plainReply(md)).toBe('Xu hướng: Thiên Cơ linh hoạt.\n\n• Giá trị: chậm mà chắc\n• Mộc\nGợi ý\nNghỉ ngơi.');
});

test('leaves plain text and lone symbols alone', () => {
  expect(plainReply('2 * 3 = 6, a-b, • already a bullet')).toBe('2 * 3 = 6, a-b, • already a bullet');
});
