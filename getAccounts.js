require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

const YNAB_BASE_URL = 'https://api.ynab.com/v1';
const { YNAB_TOKEN, YNAB_BUDGET_IDS } = process.env;

const budgetIds = YNAB_BUDGET_IDS.split(',').map(id => id.trim());

async function fetchAccountsForBudget(budgetId) {
  try {
    // Fetch budget name
    const budgetRes = await axios.get(`${YNAB_BASE_URL}/budgets/${budgetId}`, {
      headers: {
        Authorization: `Bearer ${YNAB_TOKEN}`
      }
    });

    const budgetName = budgetRes.data.data.budget.name;

    // Fetch accounts
    const response = await axios.get(`${YNAB_BASE_URL}/budgets/${budgetId}/accounts`, {
      headers: {
        Authorization: `Bearer ${YNAB_TOKEN}`,
      },
    });

    const accounts = response.data.data.accounts.map(account => ({
      budget_id: budgetId,
      budget_name: budgetName,
      id: account.id,
      name: account.name,
      type: account.type,
      balance: account.balance / 1000,
      cleared_balance: account.cleared_balance / 1000,
      deleted: account.deleted,
      closed: account.closed
    }));

    return accounts;
  } catch (error) {
    console.error(`❌ Failed to fetch accounts for budget ${budgetId}:`, error.response?.data || error.message);
    return [];
  }
}

async function fetchAllAccounts() {
  const allAccounts = [];

  for (const budgetId of budgetIds) {
    const accounts = await fetchAccountsForBudget(budgetId);
    allAccounts.push(...accounts);
  }

  fs.writeFileSync('ynab_accounts.json', JSON.stringify(allAccounts, null, 2));
  console.log('✅ All accounts written to ynab_accounts.json');
}

fetchAllAccounts();