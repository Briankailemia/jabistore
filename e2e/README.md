# E2E Tests with Playwright

This directory contains end-to-end tests for the JabiStore application using Playwright.

## Setup

1. Install dependencies (already done):
```bash
npm install --save-dev @playwright/test playwright
```

2. Install Playwright browsers:
```bash
npx playwright install --with-deps chromium
```

3. Create test users in your database. You can use the seed script or create them manually:
   - Admin user: `admin@test.com` / `admin123`
   - Moderator user: `moderator@test.com` / `moderator123`
   - Regular user: `user@test.com` / `user123`

   Or set environment variables:
   ```bash
   export TEST_ADMIN_EMAIL=admin@test.com
   export TEST_ADMIN_PASSWORD=admin123
   export TEST_MODERATOR_EMAIL=moderator@test.com
   export TEST_MODERATOR_PASSWORD=moderator123
   export TEST_USER_EMAIL=user@test.com
   export TEST_USER_PASSWORD=user123
   ```

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run tests in UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Run tests in debug mode
```bash
npm run test:e2e:debug
```

### View test report
```bash
npm run test:e2e:report
```

### Run specific test file
```bash
npx playwright test e2e/admin-dashboard.spec.js
```

### Run tests matching a pattern
```bash
npx playwright test --grep "role-based"
```

## Test Structure

- `e2e/admin-dashboard.spec.js` - Admin dashboard role-based access and operations tests
- `e2e/helpers/auth.js` - Authentication helper functions

## Writing New Tests

1. Create a new test file in the `e2e/` directory
2. Import Playwright test utilities:
```javascript
import { test, expect } from '@playwright/test';
```

3. Use authentication helpers:
```javascript
import { loginAsAdmin, loginAsModerator, loginAsUser } from './helpers/auth';

test('my test', async ({ page }) => {
  await loginAsAdmin(page);
  // Your test code here
});
```

## Configuration

Test configuration is in `playwright.config.js`. Key settings:
- Base URL: `http://localhost:3000` (or set `PLAYWRIGHT_TEST_BASE_URL`)
- Tests run in parallel by default
- Screenshots on failure
- HTML report generated

## CI/CD

For CI/CD, set the `CI` environment variable:
```bash
CI=true npm run test:e2e
```

This will:
- Retry failed tests twice
- Run tests sequentially
- Generate reports

