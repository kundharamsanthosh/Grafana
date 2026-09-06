import { expect, type Page } from '@playwright/test';

export class CartPage {
  constructor(private readonly page: Page) {}

  async expectProductInCart(productName: string) {
    await expect(this.page.locator('#tbodyid')).toContainText(productName);
  }

  async placeOrder(name: string, country: string, city: string, card: string, month: string, year: string) {
    await this.page.getByRole('button', { name: 'Place Order' }).click();
    await this.page.locator('#name').fill(name);
    await this.page.locator('#country').fill(country);
    await this.page.locator('#city').fill(city);
    //Hi This is text 
    await this.page.locator('#card').fill(card);
    await this.page.locator('#month').fill(month);
    await this.page.locator('#year').fill(year);
    await this.page.getByRole('button', { name: 'Purchase' }).click();
  }

  async expectPurchaseComplete() {
    await expect(this.page.locator('.sweet-alert')).toContainText('Thank you for your purchase');
  }
}
