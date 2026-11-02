import { Topic } from '@/core/reading';

import { isCrisis } from '../crisisDetector';
import { isInvestmentQuestion } from '../investmentDetector';
import { folded } from '../textMatch';
import { topicOf } from '../topicDetector';

// Port of TextDetectorsTest.

test('folding drops marks, case and punctuation', () => {
  expect(folded('Tôi muốn CHẾT!')).toBe(' toi muon chet ');
  expect(folded('  Đầu   tư?? ')).toBe(' dau tu ');
});

test.each([
  'I want to die',
  'sometimes I think about suicide',
  'Tôi muốn chết',
  'mình không muốn sống nữa',
  'có nên tự tử không',
  'toi muon tu tu',
  "I don't want to live anymore",
  'sometimes I want to end it all',
  'everyone would be better off dead without me',
  'I cut myself again',
])('crisis wording is caught in both languages: %s', (text) => {
  expect(isCrisis(text)).toBe(true);
});

test.each([
  'Ich will sterben',
  'a veces quiero morir',
  "j'ai envie de mourir",
  'às vezes quero morrer',
  'ik denk aan zelfmoord',
  'aku ingin mati',
  'я хочу умереть',
  'أفكر في الانتحار',
  'मैं आत्महत्या के बारे में सोचता हूँ',
  'আমি আত্মহত্যার কথা ভাবি',
  '我有时候想死',
  '요즘 죽고 싶어요',
])('crisis wording is caught in every app language: %s', (text) => {
  expect(isCrisis(text)).toBe(true);
});

test.each([
  'Will my career grow this year?',
  'Tình yêu của tôi thế nào?',
  'Tôi có nên đổi việc?',
  'Tiền bạc tháng này ra sao',
  "I'm dying to know about my love life",
  'tự tin hơn trong công việc',
  'Wie wird mein Liebesleben?',
  '我的事业怎么样？',
  '올해 연애운은 어때요?',
  'मेरा करियर कैसा रहेगा?',
])('everyday questions are not crisis: %s', (text) => {
  expect(isCrisis(text)).toBe(false);
});

test.each([
  'Should I invest in stocks this year?',
  'Có nên đầu tư không?',
  'mua cổ phiếu tháng này được không',
  'Soll ich in Aktien investieren?',
  '¿Debería invertir en cripto?',
  'Dois-je investir en bourse ?',
  'Vale a pena investir em criptomoedas?',
  'Moet ik gaan beleggen?',
  'Apakah saya harus beli saham?',
  'Стоит ли вкладывать в биткоин?',
  'هل أستثمر في الأسهم؟',
  'क्या मुझे शेयर बाजार में निवेश करना चाहिए?',
  'আমি কি শেয়ার বাজারে বিনিয়োগ করব?',
  '今年适合炒股吗？',
  '올해 주식 투자해도 될까요?',
])('investment questions are spotted in any app language: %s', (text) => {
  expect(isInvestmentQuestion(text)).toBe(true);
});

test.each([
  'How will my finances look this year?',
  'Tiền bạc tháng này ra sao',
  'Wie steht es um mein Einkommen?',
  '我今年的收入怎么样？',
  'Should I invest more time in my relationship?',
  'Time to take stock of my career?',
  'Có nên đầu tư cho con cái học thêm không?',
  "J'ai demandé une bourse d'études, vais-je l'obtenir ?",
  'Krijg ik een beurs voor mijn studie?',
  'Стоит ли идти на биржу труда?',
  '투잡을 해도 될까요?',
  '주식회사에 취업할 수 있을까요?',
])('money questions that are not about investing pass through: %s', (text) => {
  expect(isInvestmentQuestion(text)).toBe(false);
});

test('questions go to the topic they are about', () => {
  expect(topicOf('Should I change jobs?')).toBe(Topic.CAREER);
  expect(topicOf('Công việc của tôi năm nay thế nào?')).toBe(Topic.CAREER);
  expect(topicOf('Tình yêu của mình ra sao?')).toBe(Topic.LOVE);
  expect(topicOf('Thu nhập năm nay thế nào?')).toBe(Topic.MONEY);
  expect(topicOf('How are things with my parents?')).toBe(Topic.FAMILY);
  expect(topicOf('Dạo này tôi mất ngủ, căng thẳng')).toBe(Topic.WELLBEING);
});

test('look-alike words do not switch the topic', () => {
  // "yếu" folds to "yeu" but is not "tình yêu"; "tiến" folds to "tien" but is not money.
  expect(topicOf('Điểm yếu của tôi là gì?')).toBe(Topic.PERSONALITY);
  expect(topicOf('Sự nghiệp có tiến triển không?')).toBe(Topic.CAREER);
});

test('no keyword means personality', () => {
  expect(topicOf('Hello there')).toBe(Topic.PERSONALITY);
});
