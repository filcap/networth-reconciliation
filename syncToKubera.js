require('dotenv').config();
const fs = require('fs');
const axios = require('axios');
const crypto = require('crypto');

const KUBERA_API_KEY = process.env.KUBERA_API_KEY;
const KUBERA_API_SECRET = process.env.KUBERA_API_SECRET;
const KUBERA_DELAY_MS = process.env.KUBERA_DELAY_MS || 2500;
const YNAB_JSON_FILE = process.env.YNAB_JSON_FILE || 'ynab_accounts.json';
const KUBERA_BASE_URL = 'https://api.kubera.com';

const BUDGET_GROUP_MAP = {
    '6ae4c733-6842-4120-a33b-266f78e8a9a4': 'f616723a-702b-40ab-92a9-d82d78bddd85', // Thailand
    'bf0e7966-51b6-4e11-90a5-fd0db523ac71': '6e3bd812-96c3-47bf-af1d-0641588ecaba', // Mexico
    '3383846a-bd9a-4157-8077-0c02125e532f': '86955fba-4ff0-4d23-8a94-e91933ce189f' // Hong Kong
};

if (!KUBERA_API_KEY || !KUBERA_API_SECRET) {
  console.error("❌ Missing KUBERA_API_KEY or KUBERA_API_SECRET in .env");
  process.exit(1);
}

const accounts = JSON.parse(fs.readFileSync(YNAB_JSON_FILE));
const mapping = JSON.parse(fs.readFileSync('account_mapping.json'));

function generateSignature(apiKey, secret, timestamp, path, method = 'POST', body = '') {
  const dataToSign = `${apiKey}${timestamp}${method}${path}${body}`;
  return crypto
    .createHmac('sha256', secret)
    .update(dataToSign)
    .digest('hex');
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function countMappedKuberaAccounts(mapping) {
  const uniqueIds = new Set();

  for (const map of Object.values(mapping)) {
    const id = map.kubera_account_id;
    if (id && id.trim() !== '') {
      uniqueIds.add(id.trim());
    }
  }

  return uniqueIds.size;
}

async function fetchKuberaPortfolioItems() {
  const portfolioId = process.env.KUBERA_PORTFOLIO_ID;
  if (!portfolioId) {
    console.error("❌ Missing KUBERA_PORTFOLIO_ID in .env");
    return [];
  }

  const path = `/api/v3/data/portfolio/${portfolioId}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = generateSignature(KUBERA_API_KEY, KUBERA_API_SECRET, timestamp, path, 'GET');

  const headers = {
    'x-api-token': KUBERA_API_KEY,
    'x-timestamp': timestamp,
    'x-signature': signature,
    'Content-Type': 'application/json'
  };

  try {
    const response = await axios.get(`${KUBERA_BASE_URL}${path}`, { headers });
    console.log(`📥 Loaded portfolio (${portfolioId}) with ${response.data?.data?.asset?.length || 0} assets`);
    return response.data?.data?.asset || [];
  } catch (err) {
    console.error("❌ Failed to fetch portfolio data:", err.response?.data || err.message);
    return [];
  }
}

async function updateKuberaItem(account, map) {
  const label = `${map.budget_name} → ${map.ynab_account_name}`;
  const kuberaId = map.kubera_account_id;
  const currency = map.currency || 'USD';
  const path = `/api/v3/data/item/${kuberaId}`;
  const timestamp = Math.floor(Date.now() / 1000);

  const body = {
    value: account.balance
  };

  const payload = JSON.stringify(body);
  const signature = generateSignature(KUBERA_API_KEY, KUBERA_API_SECRET, timestamp, path, 'POST', payload);

  const headers = {
    'x-api-token': KUBERA_API_KEY,
    'x-timestamp': timestamp,
    'x-signature': signature,
    'Content-Type': 'application/json'
  };

  // console.log(`\n🔧 Request Preview for ${label}`);
  // console.log(`POST ${KUBERA_BASE_URL}${path}`);
  // console.log('Headers:', headers);
  // console.log('Body:', payload);

  try {
    const response = await axios.post(`${KUBERA_BASE_URL}${path}`, body, { headers });
    console.log(`✅ Updated ${label}: ${account.balance.toFixed(2)} ${currency}`);
  } catch (error) {
    console.error(`❌ Failed to update ${label}:`, error.response?.data || error.message);
  }
}

async function syncAll() {
    const totalMappedKuberaAccounts = countMappedKuberaAccounts(mapping);
    console.log(`\n📦 ${totalMappedKuberaAccounts} unique Kubera accounts mapped.`);

    const portfolioItems = await fetchKuberaPortfolioItems();

    console.log('🔄 Syncing YNAB accounts to Kubera:\n');
  
    const processedBudgetIds = new Set();
  
    for (const account of accounts) {
      const map = mapping[account.id];
      if (!map || !map.kubera_account_id || map.kubera_account_id.trim() === '') {
        continue;
      }
  
      const budgetId = account.budget_id;
  
      // 🧠 Special case: budget is in group map
      if (BUDGET_GROUP_MAP[budgetId]) {
        if (processedBudgetIds.has(budgetId)) continue;
  
        const groupAccounts = accounts.filter(a =>
          a.budget_id === budgetId &&
          !a.deleted && !a.closed &&
          mapping[a.id] &&
          mapping[a.id].kubera_account_id &&
          mapping[a.id].kubera_account_id.trim() !== ''
        );
  
        const total = groupAccounts.reduce((sum, a) => sum + a.balance, 0);
        const targetKuberaId = BUDGET_GROUP_MAP[budgetId];
        const currency = mapping[groupAccounts[0].id].currency;
  
        const syntheticMap = {
          budget_name: mapping[groupAccounts[0].id].budget_name,
          ynab_account_name: 'Total (Grouped)',
          kubera_account_id: targetKuberaId,
          currency: currency
        };
  
        const portfolioItem = portfolioItems.find(item => item.id === map.kubera_account_id);
        if(portfolioItem.value.amount !== total) {
          await updateKuberaItem({ balance: total }, syntheticMap);
          await sleep(KUBERA_DELAY_MS);
        } else {
          console.log(`⏭ Skipped ${portfolioItem.name}`);
        }
  
        processedBudgetIds.add(budgetId);
      } else {
        // Normal item-by-item update
        const portfolioItem = portfolioItems.find(item => item.id === map.kubera_account_id);
        if(portfolioItem.value.amount !== account.balance) {
          await updateKuberaItem(account, map);
          await sleep(KUBERA_DELAY_MS);
        } else {
          console.log(`⏭ Skipped ${portfolioItem.name}`);
        }
      }
    }
  }

syncAll();
