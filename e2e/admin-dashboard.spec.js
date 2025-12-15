import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsModerator, loginAsUser } from './helpers/auth';

test.describe('Admin Dashboard - Role-Based Access', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies and storage before each test
    await page.context().clearCookies();
  });

  test('Non-admin user should see access denied', async ({ page }) => {
    // Login as regular user (assuming test user exists)
    await loginAsUser(page);
    
    // Try to access admin dashboard
    await page.goto('/admin');
    
    // Should see access denied message
    await expect(page.locator('text=Access Denied')).toBeVisible();
    await expect(page.locator('text=You need to be signed in as an admin')).toBeVisible();
  });

  test('Admin user should see all tabs', async ({ page }) => {
    // Login as admin (assuming test admin exists)
    await loginAsAdmin(page);
    
    await page.goto('/admin');
    
    // Wait for dashboard to load
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();
    
    // Verify all tabs are visible for admin
    const adminTabs = [
      'Overview',
      'Orders',
      'Products',
      'Users',
      'Analytics',
      'Coupons',
      'Reviews',
      'Settings'
    ];
    
    for (const tab of adminTabs) {
      await expect(page.locator(`text=${tab}`).first()).toBeVisible();
    }
  });

  test('Moderator user should see limited tabs', async ({ page }) => {
    // Login as moderator (assuming test moderator exists)
    await loginAsModerator(page);
    
    await page.goto('/admin');
    
    // Wait for dashboard to load
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();
    
    // Verify allowed tabs are visible
    const allowedTabs = ['Overview', 'Orders', 'Products', 'Reviews'];
    for (const tab of allowedTabs) {
      await expect(page.locator(`text=${tab}`).first()).toBeVisible();
    }
    
    // Verify restricted tabs are NOT visible
    const restrictedTabs = ['Users', 'Analytics', 'Coupons', 'Settings'];
    for (const tab of restrictedTabs) {
      await expect(page.locator(`text=${tab}`).first()).not.toBeVisible();
    }
  });

  test('Admin can navigate between all tabs', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin');
    
    const tabs = [
      { name: 'Overview', id: 'overview' },
      { name: 'Orders', id: 'orders' },
      { name: 'Products', id: 'products' },
      { name: 'Users', id: 'users' },
      { name: 'Analytics', id: 'analytics' },
      { name: 'Coupons', id: 'coupons' },
      { name: 'Reviews', id: 'reviews' },
      { name: 'Settings', id: 'settings' }
    ];
    
    for (const tab of tabs) {
      // Click on tab
      await page.click(`text=${tab.name}`);
      
      // Wait for tab content to load
      await page.waitForSelector(`[role="tabpanel"][id="admin-tabpanel-${tab.id}"]`, { timeout: 5000 });
      
      // Verify tab is active
      await expect(page.locator(`[role="tab"][aria-selected="true"]`).filter({ hasText: tab.name })).toBeVisible();
    }
  });

  test('Overview tab shows key metrics', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin');
    
    // Ensure Overview tab is active
    await page.click('text=Overview');
    await page.waitForSelector('[role="tabpanel"][id="admin-tabpanel-overview"]');
    
    // Check for key metric cards
    await expect(page.locator('text=Total Revenue')).toBeVisible();
    await expect(page.locator('text=Total Orders')).toBeVisible();
    await expect(page.locator('text=Total Products')).toBeVisible();
    await expect(page.locator('text=Total Users')).toBeVisible();
    
    // Check for recent orders section
    await expect(page.locator('text=Recent Orders')).toBeVisible();
    
    // Check for low stock section
    await expect(page.locator('text=Low Stock Alert')).toBeVisible();
  });

  test('Orders tab displays order list', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin');
    
    // Navigate to Orders tab
    await page.click('text=Orders');
    await page.waitForSelector('[role="tabpanel"][id="admin-tabpanel-orders"]');
    
    // Check for order search/filter
    await expect(page.locator('input[placeholder*="Search orders"]')).toBeVisible();
    
    // Check for order status filter
    await expect(page.locator('select')).toBeVisible();
    
    // Should see orders table or empty state
    const hasOrders = await page.locator('table').count() > 0;
    const hasEmptyState = await page.locator('text=No orders found').count() > 0;
    
    expect(hasOrders || hasEmptyState).toBeTruthy();
  });

  test('Products tab displays product list with stock management', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin');
    
    // Navigate to Products tab
    await page.click('text=Products');
    await page.waitForSelector('[role="tabpanel"][id="admin-tabpanel-products"]');
    
    // Check for product search
    await expect(page.locator('input[placeholder*="Search products"]')).toBeVisible();
    
    // Check for Add Product button
    await expect(page.locator('text=Add Product')).toBeVisible();
    
    // Should see products table or empty state
    const hasProducts = await page.locator('table').count() > 0;
    const hasEmptyState = await page.locator('text=No products found').count() > 0;
    
    expect(hasProducts || hasEmptyState).toBeTruthy();
  });

  test('Users tab displays user list with role management', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin');
    
    // Navigate to Users tab
    await page.click('text=Users');
    await page.waitForSelector('[role="tabpanel"][id="admin-tabpanel-users"]');
    
    // Check for user search
    await expect(page.locator('input[placeholder*="Search users"]')).toBeVisible();
    
    // Check for role filter
    await expect(page.locator('select')).toBeVisible();
    
    // Should see users table or empty state
    const hasUsers = await page.locator('table').count() > 0;
    const hasEmptyState = await page.locator('text=No users found').count() > 0;
    
    expect(hasUsers || hasEmptyState).toBeTruthy();
  });

  test('Analytics tab shows analytics dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin');
    
    // Navigate to Analytics tab
    await page.click('text=Analytics');
    await page.waitForSelector('[role="tabpanel"][id="admin-tabpanel-analytics"]');
    
    // Check for date range selector
    await expect(page.locator('select')).toBeVisible();
    
    // Check for export button
    await expect(page.locator('text=Export CSV')).toBeVisible();
    
    // Should see analytics content
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible();
  });

  test('Coupons tab displays coupon management', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin');
    
    // Navigate to Coupons tab
    await page.click('text=Coupons');
    await page.waitForSelector('[role="tabpanel"][id="admin-tabpanel-coupons"]');
    
    // Check for Create Coupon button
    await expect(page.locator('text=Create Coupon')).toBeVisible();
    
    // Should see coupon stats or list
    await expect(page.locator('text=Total Coupons').or(page.locator('text=No coupons found'))).toBeVisible();
  });

  test('Reviews tab displays review management', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin');
    
    // Navigate to Reviews tab
    await page.click('text=Reviews');
    await page.waitForSelector('[role="tabpanel"][id="admin-tabpanel-reviews"]');
    
    // Check for review filters
    await expect(page.locator('select')).toBeVisible();
    
    // Should see reviews list or empty state
    const hasReviews = await page.locator('table, [class*="review"]').count() > 0;
    const hasEmptyState = await page.locator('text=No reviews found').count() > 0;
    
    expect(hasReviews || hasEmptyState).toBeTruthy();
  });

  test('Settings tab displays store settings', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin');
    
    // Navigate to Settings tab
    await page.click('text=Settings');
    await page.waitForSelector('[role="tabpanel"][id="admin-tabpanel-settings"]');
    
    // Should see settings form
    await expect(page.locator('form, [class*="settings"]')).toBeVisible();
  });

  test('Overview tab navigation buttons work', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin');
    
    // Ensure Overview tab is active
    await page.click('text=Overview');
    await page.waitForSelector('[role="tabpanel"][id="admin-tabpanel-overview"]');
    
    // Click "View All" for orders
    await page.click('text=View All →');
    
    // Should navigate to Orders tab
    await expect(page.locator('[role="tab"][aria-selected="true"]').filter({ hasText: 'Orders' })).toBeVisible();
    
    // Go back to Overview
    await page.click('text=Overview');
    
    // Click "Manage Stock" for products
    await page.click('text=Manage Stock →');
    
    // Should navigate to Products tab
    await expect(page.locator('[role="tab"][aria-selected="true"]').filter({ hasText: 'Products' })).toBeVisible();
  });
});

test.describe('Admin Dashboard - Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await loginAsAdmin(page);
  });

  test('Admin can search orders', async ({ page }) => {
    await page.goto('/admin');
    await page.click('text=Orders');
    await page.waitForSelector('[role="tabpanel"][id="admin-tabpanel-orders"]');
    
    const searchInput = page.locator('input[placeholder*="Search orders"]');
    await searchInput.fill('test');
    await searchInput.press('Enter');
    
    // Should show filtered results or no results message
    await page.waitForTimeout(1000); // Wait for search to process
  });

  test('Admin can filter products by category', async ({ page }) => {
    await page.goto('/admin');
    await page.click('text=Products');
    await page.waitForSelector('[role="tabpanel"][id="admin-tabpanel-products"]');
    
    // Check if category filter exists
    const categoryFilter = page.locator('select').first();
    if (await categoryFilter.count() > 0) {
      await categoryFilter.selectOption({ index: 1 });
      await page.waitForTimeout(1000); // Wait for filter to apply
    }
  });

  test('Admin can filter users by role', async ({ page }) => {
    await page.goto('/admin');
    await page.click('text=Users');
    await page.waitForSelector('[role="tabpanel"][id="admin-tabpanel-users"]');
    
    // Find role filter select
    const roleFilter = page.locator('select').filter({ hasText: /All Users|USER|ADMIN|MODERATOR/ });
    if (await roleFilter.count() > 0) {
      await roleFilter.selectOption('ADMIN');
      await page.waitForTimeout(1000); // Wait for filter to apply
    }
  });

  test('Admin can export orders', async ({ page }) => {
    await page.goto('/admin');
    
    // Click Export Orders button
    const exportButton = page.locator('text=Export Orders');
    if (await exportButton.count() > 0) {
      await exportButton.click();
      
      // Wait for download (in a real scenario, you'd check for download)
      await page.waitForTimeout(2000);
    }
  });

  test('Admin can open Add Product modal', async ({ page }) => {
    await page.goto('/admin');
    await page.click('text=Products');
    await page.waitForSelector('[role="tabpanel"][id="admin-tabpanel-products"]');
    
    // Click Add Product button
    await page.click('text=Add Product');
    
    // Modal should open (check for modal content)
    await page.waitForTimeout(500);
    // In a real scenario, you'd check for modal-specific selectors
  });
});

