# KVLedger

Educational **micro-lending ledger** on the **EVM**: register loans and repayments on-chain with borrower identities represented as **`bytes32` hashes** (so real-world IDs are not stored in plain text on the blockchain). Includes a **Next.js** web app that connects with **MetaMask** and uses **ethers.js v6** to call the contracts.

> [!WARNING]
> **Educational Use Only**
>
> This is a **learning MVP**, not production-ready lending software:
> - ❌ No KYC/AML compliance
> - ❌ No custodial wallet or payment processing
> - ❌ No legal loan agreement enforcement
> - ❌ No credit scoring or risk assessment
>
> **Deploy only on testnets or local nodes.** Using real funds requires legal, regulatory, and security expertise beyond this codebase.

---

## Why this project?

This MVP demonstrates:

- **Transparency** — All loan flows are publicly verifiable on-chain.
- **Privacy** — Borrower identities are hashed; plaintext names or IDs are not written to the chain (still avoid sensitive data in off-chain forms if you need stronger privacy).
- **Educational** — Learn Solidity, smart contract deployment, and Web3 integration by building something concrete.
- **Ledger, not a bank account** — The contract does not custody ETH or tokens; it records loan data. The **admin** address controls on-chain writes, which is separate from “non-custodial” in the user-wallet sense.

Perfect for learning blockchain fundamentals or prototyping micro-finance transparency tools.

---

## Features

- **On-chain loan registry** — amounts in **cents**, term in **days**, currency as a string (e.g. `USD`).
- **Repayment history** — per-loan payments; loan moves to **Completed** when fully repaid.
- **Admin-only writes** — `createLoan`, `recordRepayment`, and `markAsDefaulted` are restricted to the contract **admin** (the deployer by default).
- **Events** — `LoanCreated`, `RepaymentRecorded`, `LoanCompleted`, `LoanDefaulted` for indexing and transparency.
- **Multiple contract variants** — baseline `LoanRegistry`, plus optimized and **OpenZeppelin**-based secure variants for comparison and gas experiments.
- **Web UI** — "Koinonia Ventures" style landing page plus a **loan creation** flow for the admin wallet.

---

## Tech stack

| Layer | Technology |
| ----- | ---------- |
| Contracts | Solidity `^0.8.19`, Hardhat |
| Libraries | OpenZeppelin (secure variant), Hardhat toolbox |
| Frontend | Next.js 16, React 18, TypeScript |
| Wallet / RPC | **ethers.js v6**, MetaMask (`window.ethereum`) |
| Networks | **Local Hardhat** (`localhost:8545`, chain ID **31337** for the default node); **Sepolia** supported in the frontend via env (see below) |

The frontend does **not** use Wagmi or Viem. There is **no** Supabase or other borrower database in this repo—privacy is handled **on-chain** via hashed identifiers; any mapping from hash to real identity would be **off-chain** and is **not** implemented here.

**Sepolia vs Hardhat:** The app (`contractAddresses.ts`, `NETWORK_CONFIG`) is wired to point at a **Sepolia** deployment using `NEXT_PUBLIC_SEPOLIA_*` and an RPC URL. **`hardhat.config.js` only defines the in-process `hardhat` network and `localhost`.** To deploy contracts to Sepolia, add a `sepolia` network (RPC URL and funded deployer key) to Hardhat yourself, then set the deployed address in `.env.local`.

---

## Repository layout

```
KVLedger/
├── README.md
└── loan-ledger-mvp/
    ├── contracts/           # Solidity: LoanRegistry + optimized/secure variants
    ├── scripts/             # deploy.js, createLoan.js, viewLoans.js
    ├── test/                # Hardhat tests
    ├── hardhat.config.js
    ├── package.json
    └── frontend/            # Next.js app
        ├── src/
        │   ├── app/         # page.tsx, layout
        │   ├── components/  # LoanCreation, wallet UI
        │   ├── hooks/       # useContract.ts
        │   └── utils/       # contractAddresses.ts, security helpers
        └── env.example      # copy → .env.local
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [MetaMask](https://metamask.io/) (or another injected `window.ethereum` wallet)
- Git

---

## Quick start (local blockchain + UI)

### 1. Install dependencies

```bash
cd loan-ledger-mvp
npm install

cd frontend
npm install
```

### 2. Start a local node

In `loan-ledger-mvp`:

```bash
npx hardhat node
```

Keep this terminal open. Default JSON-RPC: `http://127.0.0.1:8545` (chain ID **31337** with standard Hardhat node settings).

### 3. Deploy `LoanRegistry`

In a **second** terminal, from `loan-ledger-mvp`:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

Note the printed **contract address**. The frontend defaults to a common Hardhat **first-deploy** address; if yours differs, set `NEXT_PUBLIC_CONTRACT_ADDRESS` (see [Environment variables](#environment-variables)).

### 4. Run the frontend

```bash
cd loan-ledger-mvp/frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), connect MetaMask to **localhost** (matching chain ID **31337**), and import a test key from the `hardhat node` output. Use the **deployer** account—only the **admin** can create loans.

---

## Environment variables

Copy the template and adjust:

```bash
cd loan-ledger-mvp/frontend
copy env.example .env.local   # Windows
# cp env.example .env.local   # macOS / Linux
```

Important keys:

| Variable | Purpose |
| -------- | ------- |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Deployed `LoanRegistry` on **localhost** |
| `NEXT_PUBLIC_SEPOLIA_LOAN_REGISTRY` | Deployed address on **Sepolia** (if you use it) |
| `NEXT_PUBLIC_LOCALHOST_RPC_URL` | Defaults to `http://localhost:8545` |
| `NEXT_PUBLIC_SEPOLIA_RPC_URL` | Your Sepolia RPC (e.g. Infura) |

Restart `npm run dev` after changing `.env.local`. **Never commit** `.env.local` or real API keys (they are gitignored).

---

## MetaMask (local)

1. Network: **RPC** `http://127.0.0.1:8545`, **chain ID** `31337` (or whatever `hardhat node` prints).
2. Import a private key from the terminal where `hardhat node` is running.
3. The **first** account is typically the **deployer** and contract **admin**.

---

## Smart contracts (baseline behavior)

**`LoanRegistry.sol`** (primary contract wired in `scripts/deploy.js` and the default UI):

- `createLoan(borrowerHash, amountInCents, durationDays, currency)` — **admin only**
- `recordRepayment(loanId, amountInCents, notes)` — **admin only**
- `markAsDefaulted(loanId)` — **admin only**, after due date
- View helpers: `getLoanDetails`, `getRepaymentHistory`, `getRemainingBalance`, `getTotalLoans`, etc.

Other files (`LoanRegistryOptimized.sol`, `LoanRegistrySecure.sol`, `LoanRegistryUltraOptimized.sol`) require their own deployment and ABI/address updates if you want to use them from the app.

---

## Testing (Hardhat)

From `loan-ledger-mvp`:

```bash
npx hardhat test
```

---

## Scripts

| Script | Description |
| ------ | ----------- |
| `scripts/deploy.js` | Deploys `LoanRegistry`, optional sample loans and repayment demo |
| `scripts/createLoan.js` | Helper for creating loans (if used in your workflow) |
| `scripts/viewLoans.js` | Inspect loans (if used in your workflow) |

---

## UI notes

- The loan form includes a **purpose** field validated in the browser; it is **not** stored on-chain (the contract has no purpose field).
- The main page emphasizes **loan creation**; recording repayments is available on the contract (e.g. via Hardhat console or a small script)—extend the UI if you need it.

---

## Extending the project

Ideas that are **not** in the current codebase but match common next steps:

- Deploy to **Polygon** or another chain (add network config + addresses).
- Use **Supabase** (or another DB) **off-chain** to map `borrowerHash` to PII under proper governance.
- Add **Wagmi/Viem** for a more standard React wallet stack.
- Build a **repayment** UI and admin tooling.

---

## License

See `loan-ledger-mvp/package.json` (ISC) for the root package metadata. Add a top-level `LICENSE` file if you want explicit terms on GitHub.

---

## Acknowledgements

Built as a **transparent micro-lending** demo using **Solidity**, **Hardhat**, and a **Next.js** frontend with **ethers.js**.
