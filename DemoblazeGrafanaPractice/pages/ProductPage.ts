import { expect, type Page } from '@playwright/test';

export class ProductPage {
  constructor(private readonly page: Page) {}

  async addToCart() {
    const dialogPromise = this.page.waitForEvent('dialog');
    await this.page.getByRole('link', { name: 'Add to cart' }).click();
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('Product added');
    await dialog.accept();
  }
}
