const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const data = vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../data.js'), 'utf8') + '\nHISTORY_DATA;');
const topics = Object.values(data).flatMap(section => section.topics);
const questions = topics.flatMap(topic => topic.questions);

test('570 distinct questions across the 19 selected textbook topics', () => {
  assert.equal(data.jahon.topics.length, 10);
  assert.equal(data.uzbekiston.topics.length, 9);
  assert.equal(data.jahon.topics.flatMap(t => t.questions).length, 300);
  assert.equal(data.uzbekiston.topics.flatMap(t => t.questions).length, 270);
  assert.equal(questions.length, 570);
  assert.equal(new Set(questions.map(q => q.id)).size, 570);
  assert.equal(new Set(questions.map(q => q.q)).size, 570);
  assert.deepEqual(questions.map(q => q.id).sort((a,b) => a-b), Array.from({length:570}, (_,i) => i+1));
});

test('each topic has 10 questions per difficulty and its own numbers 1–30', () => {
  for (const topic of topics) {
    assert.equal(topic.questions.length, 30, topic.id);
    assert.deepEqual(Array.from(topic.questions, q => q.number), Array.from({length:30}, (_,i) => i+1));
    for (const [index, difficulty] of ['easy', 'medium', 'hard'].entries()) {
      const group = topic.questions.filter(q => q.difficulty === difficulty);
      assert.equal(group.length, 10, `${topic.id}: ${difficulty}`);
      assert.ok(group.every(q => q.number > index*10 && q.number <= (index+1)*10));
    }
  }
});

test('every question has four distinct, nonempty choices and a valid answer', () => {
  for (const q of questions) {
    assert.ok(q.q.trim(), String(q.id));
    assert.deepEqual(Object.keys(q.opts), ['A','B','C','D']);
    assert.equal(new Set(Object.values(q.opts)).size, 4, String(q.id));
    assert.ok(Object.values(q.opts).every(v => typeof v === 'string' && v.trim()));
    assert.ok(Object.hasOwn(q.opts, q.ans), String(q.id));
  }
});
