import { test, expect } from '@playwright/test';

/**
 * Дымовые проверки первого экрана — то же, что замечает игрок за первые 30 секунд.
 */
test.describe('Intro — игрок', () => {
  test('видит заголовок окна и главную область', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Chronos/i);
    await expect(page.locator('#chronos-main')).toBeVisible();
  });

  test('кнопка «начать историю» доступна', async ({ page }) => {
    await page.goto('/');
    const start = page.getByTestId('intro-start-story');
    await expect(start).toBeVisible();
    await expect(start).toBeEnabled();
  });

  test('шаг имени: пустое имя блокирует старт', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('intro-start-story').click();

    await expect(page.getByTestId('intro-player-name')).toBeVisible();
    const begin = page.getByTestId('intro-begin-adventure');
    await expect(begin).toBeDisabled();

    await page.getByTestId('intro-player-name').fill('PlaywrightHero');
    await expect(begin).toBeEnabled();
  });

  test('кнопка настроек в шапке имеет доступное имя', async ({ page }) => {
    await page.goto('/');
    const settings = page.getByRole('button', { name: /настройки|settings/i });
    await expect(settings).toBeVisible();
  });
});
