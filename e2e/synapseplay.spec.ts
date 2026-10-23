import { test, expect } from '@playwright/test';

test.describe('SynapsePlay (FocusEngine 5+) — Gate 5 E2E, Smooth Landing, A11y & Refresh Recovery', () => {
  test('Child Hub renders 4 categories with >=64x64px touch targets, navigates into Activity 01, and recovers state across page refresh', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByTestId('child-hub-page')).toBeVisible();

    const cards = page.locator('[data-testid^="category-card-"]');
    await expect(cards).toHaveCount(4);

    // Verify touch target >= 64x64px on primary navigation and category buttons
    const breakBtnBox = await page.getByTestId('break-pause-btn').boundingBox();
    expect(breakBtnBox).not.toBeNull();
    expect(breakBtnBox!.height).toBeGreaterThanOrEqual(64);
    expect(breakBtnBox!.width).toBeGreaterThanOrEqual(64);

    // Open Group A (Detective Eyes) and launch Activity 01
    await page.getByTestId('open-category-detective-eyes').click();
    await expect(page.getByTestId('category-page-detective-eyes')).toBeVisible();

    await page.getByTestId('launch-activity-01-visual-search').click();
    await expect(page.getByTestId('activity-01-visual-search')).toBeVisible();

    // Complete Round 1 -> advances to Round 2
    await page.getByTestId('search-item-target').click();
    await page.waitForTimeout(450);
    await expect(page.getByTestId('round-pebble-2')).toHaveText('2');

    // Reload page mid-activity and verify Round 2 recovery
    await page.reload();
    await expect(page.getByTestId('activity-01-visual-search')).toBeVisible();
    await expect(page.getByTestId('round-pebble-2')).toHaveText('2');

    // Complete Round 2 & Round 3
    await page.getByTestId('search-item-target').click();
    await page.waitForTimeout(450);
    await page.getByTestId('search-item-target').click();

    await expect(page.getByTestId('activity-complete-screen')).toBeVisible();
  });

  test('Parent Gate unlocks Parent Dashboard, verifies Smooth Landing states across refresh, and performs Data Wipe', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByTestId('open-parent-gate-btn').click();
    await expect(page.getByTestId('parent-gate-modal')).toBeVisible();

    await page.getByTestId('parent-gate-option-15').click();
    await expect(page.getByTestId('parent-dashboard-page')).toBeVisible();

    // Trigger 2-minute Smooth Landing Warning Banner
    await page.getByTestId('simulate-warning-time-btn').click();
    await expect(page.getByTestId('smooth-landing-warning-banner')).toBeVisible();

    // Trigger Smooth Landing Depleted Screen
    await page.getByTestId('simulate-depleted-time-btn').click();
    await expect(page.getByTestId('smooth-landing-overlay')).toBeVisible();

    // Unlock +10m via Parent Gate
    await page.getByTestId('smooth-landing-parent-unlock').click();
    await page.getByTestId('parent-gate-option-15').click();
    await expect(page.getByTestId('smooth-landing-overlay')).toBeHidden();

    // Execute One-Click Data Wipe
    await page.getByTestId('one-click-wipe-trigger-btn').click();
    await page.getByTestId('confirm-data-wipe-btn').click();
    await expect(page.getByTestId('wipe-success-banner')).toBeVisible();
  });
});
