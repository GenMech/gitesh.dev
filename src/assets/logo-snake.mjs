// Clockwise perimeter of the existing 7 × 7 pixel logo.
export const SNAKE_TRACK = [
  ...Array.from({ length: 7 }, (_, i) => ({ x: 4 + i * 12, y: 4 })),
  ...Array.from({ length: 6 }, (_, i) => ({ x: 76, y: 16 + i * 12 })),
  ...Array.from({ length: 6 }, (_, i) => ({ x: 64 - i * 12, y: 76 })),
  ...Array.from({ length: 5 }, (_, i) => ({ x: 4, y: 64 - i * 12 })),
];

export function advanceSnake({ head, food }) {
  const nextHead = (head + 1) % SNAKE_TRACK.length;
  return {
    head: nextHead,
    food: nextHead === food ? (food + 8) % SNAKE_TRACK.length : food,
  };
}

export function snakeFrame({ head, food }) {
  return {
    segments: [0, 1, 2].map((offset) => SNAKE_TRACK[(head - offset + SNAKE_TRACK.length) % SNAKE_TRACK.length]),
    meal: SNAKE_TRACK[food],
  };
}
