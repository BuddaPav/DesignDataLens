import { test, expect } from '@playwright/test';
import { gotoGameScreenAfterCharacterCreation } from './helpers';

/**
 * BACKLOG #32: карта по M, выход Esc (без мыши).
 */
test.describe('Тактическая карта — клавиши', () => {
  test('KeyM открывает оверлей, Escape закрывает', async ({ page }) => {
    await gotoGameScreenAfterCharacterCreation(page);

    await page.keyboard.press('KeyM');
    await expect(page.getByTestId('chronos-tactical-map')).toBeVisible({ timeout: 5000 });

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('chronos-tactical-map')).toHaveCount(0);
  });
});
