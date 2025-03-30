
# 💰 Net Worth Reconciliation with YNAB + Kubera

This project automates syncing your YNAB account balances to Kubera to keep your net worth dashboard up to date.

## 🧰 Prerequisites

- Node.js v18+ recommended
- A Kubera API Key + Secret
- A YNAB Personal Access Token


## ⚙️ Setup

1. Clone this repo:

   ```bash
   git clone https://github.com/your-user/networth-reconciliation.git
   cd networth-reconciliation
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file:

   ```env
   YNAB_TOKEN=your_ynab_access_token
   YNAB_BUDGET_IDS=budget_id_1,budget_id_2,...
   YNAB_JSON_FILE=ynab_accounts.json
   MAPPING_FILE=account_mapping.json

   KUBERA_API_KEY=your_kubera_api_key
   KUBERA_API_SECRET=your_kubera_api_secret
   KUBERA_PORTFOLIO_ID=your_kubera_portfolio_id
   KUBERA_DELAY_MS=2500
   ```


## 🚀 First-Time Usage

### Step 1: Pull YNAB Account Data

This will fetch all YNAB accounts and save them to `ynab_accounts.json`.

```bash
node getAccounts.js
```

> 💡 Make sure your `.env` contains valid YNAB token and budget IDs.



### Step 2: Set Up Account Mapping

Use the generated `ynab_accounts.json` to create a `account_mapping.json`. Use the sample template format:

```json
{
  "<<ynab_account_id>>": {
    "budget_name": "🇵🇭 Philippines",
    "ynab_account_name": "GCash",
    "currency": "PHP",
    "kubera_account_id": "<<kubera-item-id>>"
  }
}
```

Only fill in the `kubera_account_id` for the accounts you want to sync.



### Step 3: Run the Sync

Once your mapping is ready:

```bash
node syncToKubera.js
```

This will:
- Print all mapped YNAB accounts
- Update the corresponding Kubera items
- Automatically respect Kubera's API rate limit



## 🧮 Grouped Budgets (`BUDGET_GROUP_MAP`)

If you want to sum multiple YNAB accounts from a specific budget and sync them as a **single Kubera item**, you can define a `BUDGET_GROUP_MAP` inside `syncToKubera.js`.

### 🔧 Example:

```js
const BUDGET_GROUP_MAP = {
  '<<ynab_budget_id>>': '<<kubera_item_id>>',
  '<<ynab_budget_id>>': '<<kubera_item_id>>'
};
```



## ⏱ Rate Limiting

Kubera allows **30 requests per minute**. The script includes a built-in delay:

```env
KUBERA_DELAY_MS=2500
```

You can adjust this in `.env` if needed.



## ✅ TODO / Future Enhancements

- Add dry-run mode for testing
- Automatically retry failed updates
- Export sync logs to file


## 📫 Questions?

Open an issue or ping [@filcap](https://github.com/filcap) on GitHub.
