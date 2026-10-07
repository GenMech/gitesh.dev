import test from 'node:test';
import assert from 'node:assert/strict';
import { SNAKE_TRACK, advanceSnake, snakeFrame } from '../src/assets/logo-snake.mjs';

test('the snake track is a continuous closed loop around the G boundary', () => {
  assert.equal(SNAKE_TRACK.length, 24);
  assert.equal(new Set(SNAKE_TRACK.map(({ x, y }) => `${x},${y}`)).size, 24);
  SNAKE_TRACK.forEach(({ x, y }, i) => {
    const next = SNAKE_TRACK[(i + 1) % SNAKE_TRACK.length];
    assert.ok(x === 4 || x === 76 || y === 4 || y === 76);
    assert.equal(Math.abs(x - next.x) + Math.abs(y - next.y), 12);
  });
});

test('the three-block snake follows the border and never overlaps the meal after a step', () => {
  let state = { head: 2, food: 8 };
  for (let i = 0; i < 240; i++) {
    const { segments, meal } = snakeFrame(state);
    assert.equal(segments.length, 3);
    assert.equal(new Set(segments.map(({ x, y }) => `${x},${y}`)).size, 3);
    assert.ok(segments.every((p) => SNAKE_TRACK.includes(p)));
    assert.ok(segments.every((p) => p !== meal));
    state = advanceSnake(state);
  }
  assert.equal(state.head, 2);
});

test('the meal stays still until caught, then reappears ahead while the snake stays three blocks long', () => {
  const before = { head: 6, food: 8 };
  const approaching = advanceSnake(before);
  assert.deepEqual(approaching, { head: 7, food: 8 });
  assert.deepEqual(before, { head: 6, food: 8 });
  const caught = advanceSnake(approaching);
  assert.deepEqual(caught, { head: 8, food: 16 });
  assert.equal(snakeFrame(caught).segments.length, 3);
  assert.deepEqual(advanceSnake({ head: 23, food: 0 }), { head: 0, food: 8 });
});
