import { test, expect } from '@playwright/test';
import { gotoGameScreenAfterCharacterCreation } from './helpers';

/**
 * После входа в мир видна сюжетная панель (логика сцены + UI).
 */
test.describe('Мир — первая сцена', () => {
  test('панель сцены видна на игровом экране', async ({ page }) => {
    await gotoGameScreenAfterCharacterCreation(page);
    await expect(page.getByTestId('chronos-scene-panel')).toBeVisible({ timeout: 15_000 });
  });
});
