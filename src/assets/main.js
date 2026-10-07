import { describeByte, toggleBit } from './byte.mjs';
import { advanceSnake, snakeFrame } from './logo-snake.mjs';

const { email, timeZone, copy } = JSON.parse(document.querySelector('#portfolio-config').textContent);
const label = (template, values) => template.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);

const liveCounter = document.querySelector('#live-counter');
const counterToggle = document.querySelector('#counter-toggle');
const liveCounterValue = document.querySelector('#live-counter-value');
const liveCounterBinary = document.querySelector('#live-counter-binary');
const liveCounterDecimal = document.querySelector('#live-counter-decimal');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const logoAnimation = document.querySelector('#logo-animation');
const snakeSegments = [...document.querySelectorAll('[data-snake-segment]')];
const snakeMeal = document.querySelector('#snake-meal');
let snakeState = { head: 2, food: 8 };
let snakeRunning = !reducedMotion.matches;

function renderSnakeControl() {
  const action = snakeRunning ? copy.logo.pause : copy.logo.resume;
  logoAnimation.setAttribute('aria-label', action);
  logoAnimation.title = `${action} (${copy.logo.hint})`;
}

logoAnimation.disabled = false;
renderSnakeControl();
logoAnimation.addEventListener('click', () => {
  snakeRunning = !snakeRunning;
  renderSnakeControl();
});
reducedMotion.addEventListener('change', (event) => {
  if (event.matches) {
    snakeRunning = false;
    renderSnakeControl();
  }
});

setInterval(() => {
  if (!snakeRunning || document.hidden || !logoAnimation.getClientRects().length) return;
  snakeState = advanceSnake(snakeState);
  const { segments, meal } = snakeFrame(snakeState);
  segments.forEach(({ x, y }, index) => {
    snakeSegments[index].setAttribute('x', x);
    snakeSegments[index].setAttribute('y', y);
  });
  snakeMeal.setAttribute('x', meal.x);
  snakeMeal.setAttribute('y', meal.y);
}, 190);

let counterValue = 0;
let counterRunning = !reducedMotion.matches;

function renderCounterControl() {
  counterToggle.textContent = counterRunning ? copy.counter.pause : copy.counter.resume;
  counterToggle.setAttribute('aria-label', counterRunning ? copy.counter.pauseLabel : copy.counter.resumeLabel);
}

counterToggle.addEventListener('click', () => {
  counterRunning = !counterRunning;
  renderCounterControl();
});
reducedMotion.addEventListener('change', (event) => {
  if (event.matches) {
    counterRunning = false;
    renderCounterControl();
  }
});
renderCounterControl();
liveCounter.hidden = false;

setInterval(() => {
  if (!counterRunning || document.hidden) return;
  counterValue = (counterValue + 1) % 256;
  liveCounterBinary.textContent = describeByte(counterValue).binary;
  liveCounterDecimal.textContent = String(counterValue).padStart(3, '0');
  liveCounterValue.setAttribute('aria-label', label(copy.counter.valueLabel, { value: counterValue }));
}, 1000);

let byte = 71;
const bitButtons = [...document.querySelectorAll('[data-bit]')];
const decimalOutput = document.querySelector('#byte-decimal');
const hexOutput = document.querySelector('#byte-hex');
const asciiOutput = document.querySelector('#byte-ascii');
const binaryOutput = document.querySelector('#byte-binary');

function renderByte() {
  const representation = describeByte(byte);
  for (const button of bitButtons) {
    const on = Boolean(byte & (1 << Number(button.dataset.bit)));
    button.setAttribute('aria-pressed', String(on));
    button.textContent = on ? '1' : '0';
  }
  decimalOutput.textContent = representation.decimal;
  hexOutput.textContent = representation.hex;
  asciiOutput.textContent = representation.ascii;
  binaryOutput.textContent = `0b${representation.binary}`;
}

for (const button of bitButtons) {
  button.disabled = false;
  button.addEventListener('click', () => {
    byte = toggleBit(byte, Number(button.dataset.bit));
    renderByte();
  });
}

for (const button of document.querySelectorAll('[data-preset]')) {
  button.disabled = false;
  button.addEventListener('click', () => {
    byte = Number(button.dataset.preset);
    renderByte();
  });
}

const invertButton = document.querySelector('#invert-byte');
invertButton.disabled = false;
invertButton.addEventListener('click', () => {
  byte ^= 255;
  renderByte();
});

const resetButton = document.querySelector('#reset-byte');
resetButton.disabled = false;
resetButton.addEventListener('click', () => {
  byte = 71;
  renderByte();
});

const copyButton = document.querySelector('#copy-email');
const copyStatus = document.querySelector('#copy-status');
let copyTimeout;
copyButton.hidden = false;
copyButton.addEventListener('click', async () => {
  clearTimeout(copyTimeout);
  try {
    await navigator.clipboard.writeText(email);
    copyStatus.textContent = copy.clipboard.success;
    copyButton.setAttribute('aria-label', copy.clipboard.copiedLabel);
  } catch {
    copyStatus.textContent = copy.clipboard.failure;
  }
  copyTimeout = setTimeout(() => {
    copyStatus.textContent = '';
    copyButton.setAttribute('aria-label', copy.clipboard.label);
  }, 6000);
});

const timeFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
function updateClock() {
  document.querySelector('#local-time').textContent = timeFormat.format(new Date());
}
updateClock();
setInterval(updateClock, 60_000);
document.querySelector('#year').textContent = new Date().getFullYear();

const navLinks = [...document.querySelectorAll('nav a')];
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        for (const link of navLinks) {
          if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        }
      }
    }
  }, { rootMargin: '-10% 0px -65% 0px' });
  for (const section of document.querySelectorAll('main > section')) observer.observe(section);
}
