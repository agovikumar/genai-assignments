import { test, expect } from '@core/fixtures';
import { LedgermasterPage } from '../../src/pages/LedgermasterPage';

test.describe('Ledger master flow', () => {
  test('navigate from customers to accounts', async ({ page }) => {
    const ledger = new LedgermasterPage(page);

    // Open the Ledger master landing page.
    await ledger.goto();

    // Step 1 – go to the Customers list.
    await ledger.navigateToCustomers();
    await ledger.gotoCustomerList();
    await expect(page).toHaveURL(/\/customerlist/); // verify we are on the customer list page

    // Step 2 – open the first customer and view its transaction.
    await ledger.openFirstCustomerTransaction();
    await ledger.gotoAccountViewReason();
    await expect(page).toHaveURL(/accountviewreason/); // verify transaction view page

    // Step 3 – navigate to the Accounts section and list.
    await ledger.navigateToAccounts();
    await ledger.gotoAccountList();
    await expect(page).toHaveURL(/accountlist/); // verify we are on the accounts list page
  });
});
===END===