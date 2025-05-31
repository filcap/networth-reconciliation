
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
  # YNAB API Configuration
  YNAB_TOKEN=
  YNAB_BUDGET_IDS=ed7f48e4-7fdb-498e-83a6-47fafb4d8a12,2c246751-919d-45bd-8008-7200f0688c33,0e51426f-3522-48fe-9a13-93ee7eff653d,3383846a-bd9a-4157-8077-0c02125e532f,6ae4c733-6842-4120-a33b-266f78e8a9a4,bf0e7966-51b6-4e11-90a5-fd0db523ac71,b8c1a9f0-1370-4f1b-9324-4e37c74417ee,45681778-7b92-440f-822d-c4074dc8bd9b
  YNAB_JSON_FILE=ynab_accounts.json
  MAPPING_FILE=account_mapping.json

  # Kubera API Configuration
  KUBERA_API_KEY=
  KUBERA_API_SECRET=
  KUBERA_PORTFOLIO_ID=306a96a1-3812-46e0-9288-cee4f0d1e1f9
  KUBERA_DELAY_MS=1000
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
