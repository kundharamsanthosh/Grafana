import { expect, type Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async login(username: string, password: string) {
    await this.page.locator('#loginusername').fill(username);
    await this.page.locator('#loginpassword').fill(password);
    await this.page.getByRole('button', { name: 'Log in' }).click();
  }

  async loginExpectingError(username: string, password: string, message: RegExp | string) {
    await this.page.locator('#loginusername').fill(username);
    await this.page.locator('#loginpassword').fill(password);
    const dialogPromise = this.page.waitForEvent('dialog');
    await this.page.getByRole('button', { name: 'Log in' }).click();
    const dialog = await dialogPromise;
    expect(dialog.message()).toMatch(message instanceof RegExp ? message : new RegExp(message));
    await dialog.accept();
  }
}
