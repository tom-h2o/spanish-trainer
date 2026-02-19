import { test, expect } from '@playwright/test';

test('has title and displays a flashcard', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/spanish-trainer/);

    // Expect the header to be visible
    await expect(page.locator('h1:has-text("Spanish Flashcards")')).toBeVisible();

    // Ensure there is an input field for checking
    const input = page.locator('input[placeholder="Type English translation..."]');
    await expect(input).toBeVisible();
});
