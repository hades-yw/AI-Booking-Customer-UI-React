// Local read-only browser checks; no booking or payment submissions.
import { chromium } from 'playwright';
import { expect } from 'playwright/test';
import { mkdir } from 'node:fs/promises';
const origin = process.env.CUSTOMER_TEST_URL || 'http://localhost:5174';
const output = '/tmp/booking-availability-review';
const message = 'Online booking is temporarily unavailable. Please contact the business directly.';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.BROWSER_TEST_CHANNEL || 'chrome' });
const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
const page = await context.newPage();
let writes = 0;
await page.route('http://localhost:8001/**', route => {
  if (route.request().method() === 'POST') { writes++; return route.abort(); }
  return route.continue();
});
let checks = 0;
try {
  const hint = await page.request.get('http://localhost:8001/v1/billing/public/demo-frozen/options');
  expect(hint.status()).toBe(200);
  expect((await hint.json()).booking_available).toBe(false);
  expect(await hint.text()).not.toMatch(/credits|reload|review|balance|debt/i);
  checks++;
  await page.goto(origin + '/');
  await expect(page.getByText('Demo Frozen Bookings', { exact: true })).toBeVisible();
  await expect(page.getByText('Luna Hair Studio', { exact: true })).toHaveCount(0);
  await page.screenshot({ path: output + '/demo-customer-list.png', fullPage: true });
  checks++;
  await page.goto(origin + '/merchants/demo-frozen?tab=packages');
  await expect(page.getByText(message, { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Booking unavailable', exact: true })).toBeDisabled();
  await page.screenshot({ path: output + '/paused-desktop.png', fullPage: true });
  checks++;
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Booking unavailable', exact: true })).toBeDisabled();
  await page.screenshot({ path: output + '/paused-mobile.png', fullPage: true });
  checks++;
  await page.goto(origin + '/merchants/demo-welcome?tab=packages');
  await expect(page.getByRole('button', { name: 'Book Now', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Book Now', exact: true }).click();
  await expect(page).toHaveURL(/\/merchants\/demo-welcome\/book$/);
  checks++;
  // Browser-only pause transition: never change the demo branch's credit ledger.
  await page.route('**/v1/billing/public/demo-welcome/options', route => route.fulfill({ json: {
    options: ['venue'], deposit_sen: 0, gateway: null, booking_available: false, booking_message: message,
  } }));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByText(message, { exact: true }).last()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Proceed to Confirmation' })).toBeDisabled();
  checks++;
  await page.evaluate(() => {
    const draft = JSON.parse(sessionStorage.getItem('rservo_booking_draft'));
    draft.state.schedule = { date: '2026-11-10', slot: '10:00', startTime: '2026-11-10T10:00:00' };
    draft.state.customer = { name: 'Browser check', email: 'check@example.com', phone: '0123456789' };
    draft.savedAt = Date.now();
    sessionStorage.setItem('rservo_booking_draft', JSON.stringify(draft));
  });
  await page.goto(origin + '/merchants/demo-welcome/checkout');
  await expect(page.getByText(message, { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Booking unavailable', exact: true })).toBeDisabled();
  checks++;
  await page.route('**/v1/billing/public/demo-welcome/options', route => route.abort());
  await page.getByRole('button', { name: 'Check again', exact: true }).click();
  await expect(page.getByText('Unable to check online booking availability. Please try again.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Booking unavailable', exact: true })).toBeDisabled();
  await page.unroute('**/v1/billing/public/demo-welcome/options');
  await page.getByRole('button', { name: 'Retry availability', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Confirm · pay at venue' })).toBeEnabled();
  checks++;
  expect(writes).toBe(0);
  console.log(`${checks} booking-availability browser checks passed; no booking/payment writes. Screenshots: ${output}`);
} catch (error) {
  await page.screenshot({ path: output + '/failure.png', fullPage: true }).catch(() => {});
  throw error;
} finally { await browser.close(); }
