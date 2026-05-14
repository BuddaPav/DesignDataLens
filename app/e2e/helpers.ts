import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/** Интро → CC (5× Далее) → мир; ждёт исчезновения оверлея загрузки. */
export async function gotoGameScreenAfterCharacterCreation(page: Page): Promise<void> {
  await page.goto('/');

  await page.getByTestId('intro-start-story').click();
  await page.getByTestId('intro-player-name').fill('E2EHero');
  await page.getByTestId('intro-begin-adventure').click();

  await expect(page.getByTestId('character-creation-root')).toBeVisible();

  const next = page.getByTestId('cc-next');
  for (let i = 0; i < 5; i += 1) {
    await next.click();
  }

  await page.getByTestId('cc-enter-world').click();

  await page.waitForFunction(
    () => !document.querySelector('[data-testid="chronos-loading-overlay"]'),
    { timeout: 90_000 },
  );

  await expect(page.getByTestId('game-screen')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('#chronos-main')).toBeVisible();
}
