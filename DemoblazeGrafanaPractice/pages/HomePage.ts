import { expect, type Locator, type Page } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly loginLink: Locator;
  readonly cartLink: Locator;
  readonly phonesCategory: Locator;
  readonly laptopsCategory: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginLink = page.locator('#login2');
    this.cartLink = page.locator('#cartur');
    this.phonesCategory = page.getByRole('link', { name: 'Phones' });
    this.laptopsCategory = page.getByRole('link', { name: 'Laptops' });
  }

  async goto() {
    await this.page.goto('/');
    await expect(this.page).toHaveTitle(/STORE/);
    await expect(this.page.locator('#tbodyid')).toBeVisible();
  }

  async openCategory(name: 'Phones' | 'Laptops') {
    const category = name === 'Phones' ? this.phonesCategory : this.laptopsCategory;
    await category.click();
    await expect.poll(async () => this.page.locator('.card-title').count()).toBeGreaterThan(0);
  }

  async openProduct(productName: string) {
    await this.page.getByRole('link', { name: productName }).click();
    await expect(this.page.locator('.name')).toHaveText(productName);
  }

  async openLogin() {
    await this.loginLink.click();
    await expect(this.page.locator('#logInModal')).toBeVisible();
  }

  async openCart() {
    await this.cartLink.click();
    await expect(this.page).toHaveURL(/cart\.html/);
  }
}
