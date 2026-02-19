export const FAUCET_REQUEST_ADDRESS = (process.env
  .NEXT_PUBLIC_FAUCET_REQUEST_ADDRESS || "0x") as `0x${string}`;
export const FAUCET_HANDLER_ADDRESS = (process.env
  .NEXT_PUBLIC_FAUCET_HANDLER_ADDRESS || "0x") as `0x${string}`;

export const faucetRequestABI = [
  {
    name: "request",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    name: "FaucetRequested",
    type: "event",
    inputs: [{ name: "requester", type: "address", indexed: true }],
  },
] as const;

export const faucetHandlerABI = [
  {
    name: "lastGrant",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "totalGranted",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "totalClaimers",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "FaucetGranted",
    type: "event",
    inputs: [
      { name: "requester", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    name: "FaucetDenied",
    type: "event",
    inputs: [
      { name: "requester", type: "address", indexed: true },
      { name: "reason", type: "string", indexed: false },
    ],
  },
] as const;
