import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5174/';

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage();

page.on('console', (msg) => {
  // Surface runtime errors early
  if (msg.type() === 'error') console.error('[browser console error]', msg.text());
});
page.on('pageerror', (err) => {
  console.error('[pageerror]', err);
});

await page.goto(BASE_URL, { waitUntil: 'networkidle' });

// Start story (RU by default)
await page.getByRole('button', { name: /Начать историю|Start story/i }).click();

// Enter name and proceed
const nameInput = page.getByPlaceholder(/Введите ваше имя|Enter your name/i);
await nameInput.fill('Ден');
await page.getByRole('button', { name: /Начать приключение|Begin adventure/i }).click();

// Character creation: go through steps quickly
await page.getByRole('button', { name: /Далее|Next/i }).click(); // origin -> attributes
await page.getByRole('button', { name: /Далее|Next/i }).click(); // attributes -> personality
await page.getByRole('button', { name: /Далее|Next/i }).click(); // personality -> tone
await page.getByRole('button', { name: /Далее|Next/i }).click(); // tone -> confirm

// Enter the world
await page.getByRole('button', { name: /Войти в мир|Enter the World/i }).click();

// Expect: narrative begins to type
await page.waitForTimeout(500);

// Either we see an error banner, or we see story text growing
const errorBanner = page.getByText(/Ошибка генерации истории/i);
if (await errorBanner.isVisible().catch(() => false)) {
  const text = await errorBanner.textContent();
  await browser.close();
  fail(`Story generation error banner visible: ${text}`);
}

// Narrative paragraph should have some non-empty text
const narrative = page.locator('main p').first();
await page.waitForFunction(() => {
  const p = document.querySelector('main p');
  return !!p && (p.textContent || '').trim().length > 10;
});

// Choices should appear after typewriter completes (may take a few seconds)
const choiceBtn = page.locator('button.w-full.text-left').first();
await choiceBtn.waitFor({ state: 'visible', timeout: 15000 });

const narrativeBefore = await page.locator('main .prose.prose-invert p').first().textContent();
if (!narrativeBefore || narrativeBefore.trim().length < 8) {
  await browser.close();
  fail('Narrative too short before choice.');
}

await choiceBtn.click();

// Next scene: narrative should eventually differ (typewriter may reset)
await page.waitForFunction(
  (prev) => {
    const p = document.querySelector('main .prose.prose-invert p');
    const t = (p?.textContent || '').trim();
    return t.length > 12 && t !== prev;
  },
  narrativeBefore,
  { timeout: 25000 }
);

await browser.close();
console.log('SMOKE OK: story starts, choices render, choice advances narrative.');

