import { test, expect } from '@playwright/test';
import { gotoGameScreenAfterCharacterCreation } from './helpers';

test.describe('Панели — горячие клавиши', () => {
  test('I открывает боковую панель, Esc закрывает', async ({ page }) => {
    await gotoGameScreenAfterCharacterCreation(page);

    await page.keyboard.press('KeyI');
    await expect(page.getByTestId('chronos-side-panel')).toBeVisible({ timeout: 5000 });

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('chronos-side-panel')).toHaveCount(0);
  });
});
