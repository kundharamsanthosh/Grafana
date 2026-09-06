# Demoblaze Playwright Practice

Small Playwright TypeScript project for <https://www.demoblaze.com/>.

## Important

Run commands from the project root folder:

```powershell
cd C:\Automation\DemoblazeGrafanaPractice
```

Do not run from:

```powershell
C:\Automation\DemoblazeGrafanaPractice\tests
```

## Install

```powershell
npm install
```

This project uses your installed Google Chrome, so you do not need `npx playwright install` unless you remove `channel: 'chrome'` from `playwright.config.ts`.

## Run All Tests

```powershell
npm test
```

## Run Tests in Headed Mode

```powershell
npm run test:headed
```

## Run Only Smoke Test

```powershell
npm run test:smoke
```

## Run Using npx

```powershell
npx playwright test --config=playwright.config.ts --headed
```

## Test Files

```text
tests/demoblaze.spec.ts
```

## Page Objects

```text
pages/HomePage.ts
pages/LoginPage.ts
pages/ProductPage.ts
pages/CartPage.ts
```
