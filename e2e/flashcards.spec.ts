import { test, expect } from '@playwright/test';

test('has title and displays the login screen', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/spanish-trainer/);

    // Expect the sign in header to be visible since we are not authenticated
    await expect(page.locator('h1:has-text("Sign In to Play")')).toBeVisible();

    // Ensure there is the Supabase Auth UI email input
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
});
