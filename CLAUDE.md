# Reactive Faucet — Testnet Project Brief

A fully on-chain STT faucet for Somnia testnet that uses native Reactivity to make
eligibility decisions. No backend, no off-chain relayer. A wallet calls a contract
to request tokens; the request fires an event; a subscribed handler contract — invoked
directly by chain validators — checks eligibility and transfers STT if criteria are met.

---

## Read these skills first

Before writing any code, read the following SKILL.md files in order. They contain live
contract addresses, canonical patterns, and critical gas model information.

```
./somnia-skills/skills/somnia-blockchain/SKILL.md   ← gas model, Reactivity API, deployment
```

> `somnia-skills` is cloned into the project root and gitignored.
> Run `git clone <somnia-skills-repo-url> somnia-skills` if it's not there.

---

## What to build

### Contract 1 — `FaucetRequest.sol`

A minimal trigger contract. Any EOA calls `request()`, which emits an event. That's it.
The contract holds no funds and makes no decisions.

```
FaucetRequest
  └─ function request() external
       └─ emit FaucetRequested(msg.sender)
```

```solidity
event FaucetRequested(address indexed requester);
```

No access control needed on `request()` — the handler enforces all rules.

---

### Contract 2 — `FaucetHandler.sol`

Extends `SomniaEventHandler`. Subscribed to `FaucetRequested` events from `FaucetRequest`.
When called by validators:

1. Decode `requester` from `eventTopics[1]` (indexed arg → topic[1])
2. Check `block.timestamp - lastGrant[requester] >= COOLDOWN` (suggested: 24 hours)
3. Check `requester.balance < MAX_BALANCE` (suggested: 1 STT — prevent farming)
4. If eligible: `payable(requester).call{value: DRIP_AMOUNT}("")` + `lastGrant[requester] = block.timestamp`
5. If not eligible: emit `FaucetDenied(requester, reason)` (optional, for frontend UX)

**Storage layout** (optimise for Somnia's gas model — minimise cold reads):
```solidity
mapping(address => uint256) public lastGrant;   // requester → last grant timestamp
uint256 public constant COOLDOWN    = 24 hours;
uint256 public constant DRIP_AMOUNT = 0.5 ether; // 0.5 STT
uint256 public constant MAX_BALANCE = 1 ether;   // don't grant if balance > 1 STT
```

**Important implementation notes:**
- Inherit `ReentrancyGuard` from OpenZeppelin — handler transfers value
- The `_onEvent` function should NOT emit any event that the subscription also listens to
  (causes infinite loop). `FaucetDenied` is safe; `FaucetRequested` is not
- Add a `receive()` payable function so the contract can be funded with STT
- Add an `owner` + `withdraw()` function for reclaiming funds if needed
- Add a `fund()` payable function or just use `receive()`

**Constructor:**
```solidity
constructor() {
    owner = msg.sender;
}
```

**Eligibility check helper (internal):**
```solidity
function _isEligible(address requester) internal view returns (bool, string memory) {
    if (block.timestamp - lastGrant[requester] < COOLDOWN)
        return (false, "cooldown");
    if (requester.balance >= MAX_BALANCE)
        return (false, "balance_too_high");
    if (address(this).balance < DRIP_AMOUNT)
        return (false, "faucet_empty");
    return (true, "");
}
```

---

### Script 3 — `setup-subscription.ts`

TypeScript script (run once) to create the Reactivity subscription.

```typescript
// Key parameters to set:
{
  handlerContractAddress: '<deployed FaucetHandler address>',
  priorityFeePerGas: parseGwei('2'),
  maxFeePerGas: parseGwei('10'),
  gasLimit: 3_000_000n,   // generous — first-time addresses hit cold SLOAD + cold account access
  isGuaranteed: true,     // retry if delivery fails
  isCoalesced: false,     // one handler call per event, not batched

  // Filter to only FaucetRequested events from FaucetRequest contract:
  emitter: '<deployed FaucetRequest address>',
  eventTopics: ['<keccak256("FaucetRequested(address)")>'],
}
```

The subscription owner wallet needs 32+ SOM balance. Each handler invocation is paid
from this wallet's gas budget — monitor it and top up as needed.

---

## Gas budget reasoning (Somnia-specific)

Somnia's cold storage/account access costs are 100–400x Ethereum. For `_onEvent`:

| Operation | Gas estimate |
|---|---|
| Cold account access (`requester.balance`) | ~1,000,000 |
| Cold SLOAD (`lastGrant[requester]`, first time) | ~1,000,100 |
| Warm SLOAD (second access, same slot) | ~100 |
| SSTORE new slot (`lastGrant[requester]`) | ~200,100 |
| STT transfer via `.call` | ~21,000 |
| `_isEligible` logic + decoding | ~5,000 |
| **Total (worst case, new address)** | **~2,300,000** |

Set `gasLimit: 3_000_000n` with headroom. Subsequent calls for the same address are
much cheaper (warm slots, ~250K gas).

---

## Recommended project structure

```
reactive-faucet-testnet/
├── foundry.toml
├── .env.example
├── src/
│   ├── FaucetRequest.sol
│   └── FaucetHandler.sol
├── script/
│   └── Deploy.s.sol          ← deploys both contracts
├── test/
│   └── FaucetHandler.t.sol   ← unit tests (mock _onEvent calls)
└── setup-subscription.ts     ← one-time subscription creation
```

---

## Foundry config

Use this `foundry.toml` — required for Somnia's gas model:

```toml
[profile.default]
solc_version = "0.8.33"
evm_version = "cancun"
optimizer = true
optimizer_runs = 200

[fmt]
line_length = 120
tab_width = 4
```

Deploy command (always use `--gas-estimate-multiplier` on Somnia):

```bash
forge script script/Deploy.s.sol \
  --rpc-url https://api.infra.testnet.somnia.network/ \
  --gas-estimate-multiplier 200 \
  --broadcast
```

---

## Dependencies

```bash
# Solidity (via npm for the reactivity contracts)
npm i @somnia-chain/reactivity-contracts

# TypeScript (for subscription setup)
npm i @somnia-chain/reactivity viem
```

For Foundry, the reactivity-contracts package doesn't have a public Forge repo yet —
import via npm and reference the node_modules path, or copy `SomniaEventHandler.sol`
into `lib/` manually.

---

## Deployment checklist

- [ ] Deploy `FaucetRequest.sol` → note address A
- [ ] Deploy `FaucetHandler.sol` → note address B
- [ ] Fund `FaucetHandler` with STT (e.g., 10 STT to start): send from wallet to address B
- [ ] Ensure subscription owner wallet has 32+ SOM
- [ ] Run `setup-subscription.ts` with addresses A and B → note subscription ID
- [ ] Verify subscription: `sdk.getAllSoliditySubscriptionsForOwner(ownerAddress)`
- [ ] Test: call `FaucetRequest.request()` from a fresh wallet, confirm STT arrives
- [ ] Test: call again immediately, confirm `FaucetDenied` (cooldown enforced)
- [ ] Verify both contracts on: https://shannon-explorer.somnia.network/

---

## Network config

```
Testnet RPC:   https://api.infra.testnet.somnia.network/
Chain ID:      50312
Symbol:        STT
Explorer:      https://shannon-explorer.somnia.network/
Faucet:        https://testnet.somnia.network/
```

---

## Stretch ideas (post-MVP)

- **Tiered drip**: grant more STT to wallets with lower balances (poverty weighting)
- **Streak bonus**: reward wallets that come back daily over multiple days
- **Schedule-based refill**: use Somnia's `Schedule` system event to auto-emit a
  "faucet refilled" notification after each dispense for frontend UX
- **Block-tick stats**: subscribe to `BlockTick` to maintain a rolling stats counter
  (total dispensed, unique addresses) on-chain
