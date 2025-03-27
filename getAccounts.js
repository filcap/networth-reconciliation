require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

const YNAB_BASE_URL = 'https://api.ynab.com/v1';
const { YNAB_TOKEN, YNAB_BUDGET_IDS, YNAB_JSON_FILE } = process.env;

const budgetIds = YNAB_BUDGET_IDS.split(',').map(id => id.trim());
const outputFile = YNAB_JSON_FILE || 'ynab_accounts.json';

async function fetchAccountsForBudget(budgetId) {
  try {
    const budgetRes = await axios.get(`${YNAB_BASE_URL}/budgets/${budgetId}`, {
      headers: { Authorization: `Bearer ${YNAB_TOKEN}` }
    });

    const budget = budgetRes.data.data.budget;
    const budgetName = budget.name;
    const currencySymbol = budget.currency_format.currency_symbol;

    const accountsRes = await axios.get(`${YNAB_BASE_URL}/budgets/${budgetId}/accounts`, {
      headers: { Authorization: `Bearer ${YNAB_TOKEN}` }
    });

    const accounts = accountsRes.data.data.accounts.map(account => {
      const balance = account.balance / 1000;
      const cleared = account.cleared_balance / 1000;

      console.log(`📘 [${budgetName}] ${account.name}: ${currencySymbol}${balance.toFixed(2)} (Cleared: ${currencySymbol}${cleared.toFixed(2)})`);

      return {
        budget_id: budgetId,
        budget_name: budgetName,
        currency_symbol: currencySymbol,
        id: account.id,
        name: account.name,
        type: account.type,
        balance,
        cleared_balance: cleared,
        deleted: account.deleted,
        closed: account.closed
      };
    });

    return accounts;
  } catch (error) {
    console.error(`❌ Failed to fetch data for budget ${budgetId}:`, error.response?.data || error.message);
    return [];
  }
}

async function fetchAllAccounts() {
  const allAccounts = [];

  for (const budgetId of budgetIds) {
    const accounts = await fetchAccountsForBudget(budgetId);
    allAccounts.push(...accounts);
  }

  fs.writeFileSync(outputFile, JSON.stringify(allAccounts, null, 2));
  console.log(`✅ All accounts written to ${outputFile}`);
}

fetchAllAccounts();