# Routiq Frontend Testing Guide

This guide details the testing architecture, scripts, and best practices for the Routiq frontend.

---

## 1. Testing Frameworks

The frontend uses two main testing frameworks:

1. **Vitest + React Testing Library**: For fast, isolated unit and component integration tests.
2. **Playwright**: For full end-to-end (E2E) browser testing, including drag-and-drop mechanics and AI-generated itinerary streams.

---

## 2. Test Structure

Test files are placed alongside the code or in designated E2E folders:

```
frontend/
├── e2e/                             # Playwright E2E tests
│   ├── itinerary.drag.spec.ts       ← Timeline drag-and-drop test
│   └── itinerary.generation.spec.ts ← Core AI SSE generation test
├── src/
│   ├── features/
│   │   ├── groups/
│   │   │   └── components/
│   │   │       ├── CreateGroupMembersStep.test.tsx ← Member email validation test
│   │   │       └── GroupDetailSidebar.test.tsx     ← Sidebar invite validation test
│   │   └── planner/
│   │       └── components/
│   │           └── PlannerForm.test.tsx            ← Planner form inputs and Zod validations
│   └── utils/
│       └── date.utils.test.ts                      ← Date arithmetic and timezone unit tests
```

---

## 3. Running the Tests

Ensure dependencies are installed before running tests:
```bash
npm install
```

### A. Unit & Component Integration Tests (Vitest)
Unit and component tests run in a simulated `jsdom` environment.

```bash
# Run all tests once
npm run test

# Run tests in interactive watch mode (hot reloading on save)
npm run test:unit

# Run tests in production-style one-shot mode
npm run test:unit:run
```

### B. End-to-End Tests (Playwright)
E2E tests run in a real browser. Playwright automatically boots up the Vite development server in the background using `--mode e2e` so it is isolated from your active dev server.

```bash
# Run E2E tests headlessly
npm run test:e2e

# Run E2E tests in Playwright interactive UI mode
npm run test:e2e:ui
```

---

## 4. Key Bypasses & Mocks for Testing

### Authentication Bypassing
To prevent E2E tests from needing real login credentials, the frontend includes a secure test mode bypass.
* The configuration in `frontend/playwright.config.ts` passes `VITE_E2E_BYPASS_AUTH: 'true'`.
* When the application initializes in `src/app/Providers.tsx`, if it detects `VITE_E2E_BYPASS_AUTH === 'true'`, it automatically logs in as a mock `e2e-user` (`e2e@routiq.test`), enabling E2E tests to run instantly without hitting Supabase.

### SSE Stream Interception
Playwright uses native network routing (`page.route`) to mock Server-Sent Events (SSE) stream endpoints like `/api/itinerary/generate`, feeding simulated progress and completion events to the calendar view.
