require('dotenv').config();
const fs = require('fs');
const axios = require('axios');
const crypto = require('crypto');

const KUBERA_API_KEY = process.env.KUBERA_API_KEY;
const KUBERA_API_SECRET = process.env.KUBERA_API_SECRET;
const YNAB_JSON_FILE = process.env.YNAB_JSON_FILE || 'ynab_accounts.json';
const KUBERA_BASE_URL = 'https://api.kubera.com';

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
  console.log('\n🔄 Syncing YNAB accounts to Kubera:\n');

  for (const account of accounts) {
    const map = mapping[account.id];
    if (!map || !map.kubera_account_id || map.kubera_account_id.trim() === '') {
      continue;
    }

    await updateKuberaItem(account, map);
  }
}

syncAll();