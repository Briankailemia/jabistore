/**
 * Authentication helpers for Playwright tests
 * 
 * These helpers assume you have test users in your database.
 * You can create them using the seed script or API endpoints.
 */

/**
 * Login as a specific user
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} email - User email
 * @param {string} password - User password
 */
export async function loginAs(page, email, password) {
  await page.goto('/auth/signin');
  
  // Fill in credentials
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for navigation after login
  await page.waitForURL(/\/(admin|products|orders|profile|)/, { timeout: 10000 });
  
  // Wait a bit for session to be established
  await page.waitForTimeout(1000);
}

/**
 * Login as admin user
 */
export async function loginAsAdmin(page) {
  const adminEmail = process.env.TEST_ADMIN_EMAIL || 'admin@test.com';
  const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'admin123';
  await loginAs(page, adminEmail, adminPassword);
}

/**
 * Login as moderator user
 */
export async function loginAsModerator(page) {
  const modEmail = process.env.TEST_MODERATOR_EMAIL || 'moderator@test.com';
  const modPassword = process.env.TEST_MODERATOR_PASSWORD || 'moderator123';
  await loginAs(page, modEmail, modPassword);
}

/**
 * Login as regular user
 */
export async function loginAsUser(page) {
  const userEmail = process.env.TEST_USER_EMAIL || 'user@test.com';
  const userPassword = process.env.TEST_USER_PASSWORD || 'user123';
  await loginAs(page, userEmail, userPassword);
}

/**
 * Logout current user
 */
export async function logout(page) {
  // Look for sign out button/link
  const signOutButton = page.locator('text=Sign out, button:has-text("Sign out")').first();
  if (await signOutButton.count() > 0) {
    await signOutButton.click();
    await page.waitForURL(/\//, { timeout: 5000 });
  }
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page) {
  const signOutButton = page.locator('text=Sign out, button:has-text("Sign out")').first();
  return await signOutButton.count() > 0;
}

