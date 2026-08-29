import { BasePage } from '@core/base/BasePage';
import {
  byCss,
  byRole,
  LocatorDescriptor,
} from '@core/locators/SelfHealingLocator';

export class LedgermasterPage extends BasePage {
  protected readonly pageUrl = '/ledgermaster/';

  protected readonly pageIdentifier: LocatorDescriptor = {
    name: 'Customers link',
    strategies: [
      byCss('div:nth-of-type(2) > ul > li:nth-of-type(1) > a'),
      byRole('link', { name: 'Customers' }),
    ],
  };

  private readonly customersLink: LocatorDescriptor = {
    name: 'Customers link',
    strategies: [
      byCss('div:nth-of-type(2) > ul > li:nth-of-type(1) > a'),
      byRole('link', { name: 'Customers' }),
    ],
  };

  private readonly firstRowActionButton: LocatorDescriptor = {
    name: 'Button',
    strategies: [
      byCss('tr:nth-of-type(1) > td:nth-of-type(1) > button'),
      byRole('button'),
    ],
  };

  private readonly transactionLink: LocatorDescriptor = {
    name: '200539165642435 link',
    strategies: [
      byCss('div:nth-of-type(1) > table > tbody > tr > td:nth-of-type(1) > a:nth-of-type(1)'),
      byRole('link', { name: '200539165642435' }),
    ],
  };

  private readonly accountsLink: LocatorDescriptor = {
    name: 'Accounts link',
    strategies: [
      byCss('span:nth-of-type(2) > li > a'),
      byRole('link', { name: 'Accounts' }),
    ],
  };

  /** Navigate to the Customers section from the Ledger master landing page. */
  async navigateToCustomers(): Promise<void> {
    await this.click(this.customersLink);
  }

  /** Open the first customer row, then follow its transaction link. */
  async openFirstCustomerTransaction(): Promise<void> {
    await this.click(this.firstRowActionButton);
    await this.click(this.transactionLink);
  }

  /** Navigate to the Accounts section from wherever the test currently is. */
  async navigateToAccounts(): Promise<void> {
    await this.click(this.accountsLink);
  }

  /** Direct navigation helpers for URLs that are not reachable via UI actions. */
  async gotoCustomerList(): Promise<void> {
    await this.page.goto('/ledgermaster/#/customerlist');
  }

  async gotoAccountViewReason(): Promise<void> {
    await this.page.goto('/ledgermaster/#/account/accountviewreason/7830002');
  }

  async gotoAccountList(): Promise<void> {
    await this.page.goto('/ledgermaster/#/accountlist');
  }
}