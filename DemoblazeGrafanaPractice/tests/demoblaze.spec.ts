import { test, expect } from '@playwright/test';
import { CartPage } from '../pages/CartPage';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { ProductPage } from '../pages/ProductPage';

test.describe('Demoblaze storefront', () => {
  test('loads home page and shows products @smoke', async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.goto();

    await expect.poll(async () => page.locator('.card-title').count()).toBeGreaterThan(0);
    await expect(page.getByRole('link', { name: 'Samsung galaxy s6' })).toBeVisible();
  });

  test('filters laptop category @regression', async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.goto();
    await homePage.openCategory('Laptops');

    await expect(page.getByRole('link', { name: 'Sony vaio i5' })).toBeVisible();
  });

  test('shows error for invalid login @negative', async ({ page }) => {
    const homePage = new HomePage(page);
    const loginPage = new LoginPage(page);

    await homePage.goto();
    await homePage.openLogin();
    await loginPage.loginExpectingError(`invalid_user_${Date.now()}`, 'wrong-password', /User does not exist/);
  });

  test('adds product to cart and places order @e2e', async ({ page }) => {
    const homePage = new HomePage(page);
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);
    const productName = 'Samsung galaxy s6';

    await homePage.goto();
    await homePage.openProduct(productName);
    await productPage.addToCart();
    await homePage.openCart();
    await cartPage.expectProductInCart(productName);
    await cartPage.placeOrder('Practice User', 'India', 'Hyderabad', '4111111111111111', '09', '2026');
    await cartPage.expectPurchaseComplete();
  });
});
