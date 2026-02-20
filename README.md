# Reactive STT Faucet

A fully on-chain STT faucet for Somnia testnet using native Reactivity. A wallet calls a trigger contract, the event fires, validators invoke a handler contract that checks eligibility and transfers 0.5 STT. No backend needed.

## Architecture

```
User → FaucetRequest.request()
         ↓ emits FaucetRequested(address)
Validators → FaucetHandler._onEvent()
         ↓ checks eligibility (24h cooldown, <1 STT balance)
         ↓ transfers 0.5 STT to requester
```

## Contracts

| Contract | Purpose |
|---|---|
| `FaucetRequest` | Trigger — `request()` emits `FaucetRequested(address)` |
| `FaucetHandler` | Reactive handler — checks eligibility, transfers STT |

## Setup

```bash
# Install dependencies
npm install
forge install

# Copy env and fill in your private key
cp .env.example .env

# Deploy (see gas notes below!)
forge script script/Deploy.s.sol --rpc-url https://api.infra.testnet.somnia.network/ --private-key $PRIVATE_KEY --gas-estimate-multiplier 2000 --broadcast

# Fund the handler with STT
cast send <HANDLER_ADDRESS> --value 10ether --rpc-url https://api.infra.testnet.somnia.network/ --private-key $PRIVATE_KEY

# Create Reactivity subscription (update .env with deployed addresses first)
npx tsx setup-subscription.ts

# Frontend
cd Frontend
cp .env.example .env.local  # fill in contract addresses + WalletConnect project ID
npm install
npm run dev
```

## Somnia Gas — Deployment Gotchas

Somnia's gas model is very different from Ethereum. **Contract bytecode storage costs 3,125 gas/byte** (vs 200 on Ethereum — ~16x more expensive). Cold storage and account access are 100–400x more expensive.

This means Forge's local gas estimates (based on Ethereum costs) are drastically wrong. The `--gas-estimate-multiplier` flag is critical:

| Multiplier | What happens |
|---|---|
| `200` (2x) | **Fails** — out of gas on both contracts |
| `1000` (10x) | **Fails** — FaucetHandler still runs out (needs ~7M gas for bytecode alone) |
| `2000` (20x) | **Works** — enough headroom for both contracts |

**Observed deployment gas usage:**

| Contract | Bytecode size | Bytecode gas (Somnia) | Actual gas used |
|---|---|---|---|
| FaucetRequest | 174 bytes | ~544K | ~854K |
| FaucetHandler | 2,219 bytes | ~6.9M | ~5.7M |

Always use `--gas-estimate-multiplier 2000` (or higher) when deploying to Somnia. You only pay for gas actually consumed, so overshooting the limit is safe.

### Handler invocation gas budget

Each Reactivity callback (handler invocation) has its own gas costs:

| Operation | Gas estimate |
|---|---|
| Cold account access (`requester.balance`) | ~1,000,000 |
| Cold SLOAD (`lastGrant[requester]`, first time) | ~1,000,100 |
| Warm SLOAD (second access, same slot) | ~100 |
| SSTORE new slot (`lastGrant[requester]`) | ~200,100 |
| STT transfer via `.call` | ~21,000 |
| **Total (worst case, new address)** | **~2,300,000** |

The subscription is configured with `gasLimit: 3,000,000` to cover this. Subsequent calls for the same address are much cheaper (~250K gas, warm slots).

## Network

| | |
|---|---|
| Testnet RPC | `https://api.infra.testnet.somnia.network/` |
| Chain ID | 50312 |
| Symbol | STT |
| Explorer | https://shannon-explorer.somnia.network/ |

## Testing

```bash
forge test -vvv
```
