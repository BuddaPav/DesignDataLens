import { test } from '@playwright/test';
import { gotoGameScreenAfterCharacterCreation } from './helpers';

/**
 * Полный путь: интро → имя → создание персонажа (дефолты + шаги) → игровой экран.
 * Учитывает возможный оверлей генерации сцены.
 */
test.describe('Новая игра → мир', () => {
  test('доходит до игрового экрана после создания персонажа', async ({ page }) => {
    await gotoGameScreenAfterCharacterCreation(page);
  });
});
