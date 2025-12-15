# E2E Testing Guide

This project uses Playwright for end-to-end testing of the admin dashboard and other critical flows.

## Quick Start

1. **Install Playwright browsers** (if not already done):
```bash
npx playwright install --with-deps chromium
```

2. **Create test users**:
```bash
npm run test:e2e:seed
```

This creates three test users:
- `admin@test.com` / `admin123` (ADMIN role)
- `moderator@test.com` / `moderator123` (MODERATOR role)
- `user@test.com` / `user123` (USER role)

3. **Start your dev server** (in a separate terminal):
```bash
npm run dev
```

4. **Run tests**:
```bash
npm run test:e2e
```

## Test Commands

- `npm run test:e2e` - Run all E2E tests
- `npm run test:e2e:ui` - Run tests in interactive UI mode
- `npm run test:e2e:headed` - Run tests with visible browser
- `npm run test:e2e:debug` - Run tests in debug mode
- `npm run test:e2e:report` - View test report
- `npm run test:e2e:seed` - Create/update test users

## Test Coverage

### Admin Dashboard Tests

**Role-Based Access:**
- ✅ Non-admin users see access denied
- ✅ Admin users see all 8 tabs
- ✅ Moderator users see only 4 tabs (Overview, Orders, Products, Reviews)
- ✅ Tab navigation works correctly for each role

**Tab Functionality:**
- ✅ Overview tab shows key metrics and recent data
- ✅ Orders tab displays order list with filters
- ✅ Products tab shows products with stock management
- ✅ Users tab displays user list with role management
- ✅ Analytics tab shows analytics dashboard
- ✅ Coupons tab displays coupon management
- ✅ Reviews tab displays review management
- ✅ Settings tab displays store settings

**Operations:**
- ✅ Search orders
- ✅ Filter products by category
- ✅ Filter users by role
- ✅ Export orders
- ✅ Open Add Product modal
- ✅ Navigation from Overview to other tabs

## Writing New Tests

1. Create a new test file in `e2e/`:
```javascript
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test('my new test', async ({ page }) => {
  await loginAsAdmin(page);
  // Your test code
});
```

2. Use authentication helpers:
   - `loginAsAdmin(page)` - Login as admin
   - `loginAsModerator(page)` - Login as moderator
   - `loginAsUser(page)` - Login as regular user
   - `logout(page)` - Logout current user

## Configuration

- Base URL: `http://localhost:3000` (or set `PLAYWRIGHT_TEST_BASE_URL`)
- Browser: Chromium (can add Firefox/WebKit in `playwright.config.js`)
- Screenshots: Taken on test failure
- Reports: HTML report generated in `playwright-report/`

## CI/CD Integration

For CI/CD pipelines, set the `CI` environment variable:

```bash
CI=true npm run test:e2e
```

This will:
- Retry failed tests twice
- Run tests sequentially (not in parallel)
- Generate detailed reports

## Troubleshooting

**Tests fail with "User not found":**
- Run `npm run test:e2e:seed` to create test users
- Verify users exist in database

**Tests timeout:**
- Ensure dev server is running on port 3000
- Check network connectivity
- Increase timeout in `playwright.config.js`

**Tests fail with authentication errors:**
- Verify NextAuth is configured correctly
- Check session cookies are being set
- Ensure test users have correct passwords

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use `beforeEach` to clear cookies/storage
3. **Wait**: Always wait for elements/actions to complete
4. **Selectors**: Prefer text content or data-testid over CSS classes
5. **Assertions**: Use specific assertions (`toBeVisible`, `toHaveText`, etc.)

## Next Steps

Consider adding tests for:
- Product creation/editing flows
- Order status updates
- Payment processing
- User role changes
- Coupon creation/validation
- Review moderation

