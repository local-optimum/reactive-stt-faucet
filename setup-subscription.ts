import "dotenv/config";
import { createPublicClient, createWalletClient, http, parseGwei, keccak256, toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { SDK } from "@somnia-chain/reactivity";

const somniaTestnet = {
    id: 50312,
    name: "Somnia Testnet",
    nativeCurrency: { name: "Somnia Testnet Token", symbol: "STT", decimals: 18 },
    rpcUrls: { default: { http: ["https://api.infra.testnet.somnia.network/"] } },
} as const;

async function main() {
    const privateKey = process.env.PRIVATE_KEY as `0x${string}`;
    if (!privateKey) throw new Error("PRIVATE_KEY not set in .env");

    const faucetRequestAddress = process.env.FAUCET_REQUEST_ADDRESS as `0x${string}`;
    const faucetHandlerAddress = process.env.FAUCET_HANDLER_ADDRESS as `0x${string}`;
    if (!faucetRequestAddress || !faucetHandlerAddress) {
        throw new Error("FAUCET_REQUEST_ADDRESS and FAUCET_HANDLER_ADDRESS must be set in .env");
    }

    const account = privateKeyToAccount(privateKey);

    const publicClient = createPublicClient({
        chain: somniaTestnet,
        transport: http(),
    });

    const walletClient = createWalletClient({
        account,
        chain: somniaTestnet,
        transport: http(),
    });

    const sdk = new SDK({
        public: publicClient,
        wallet: walletClient,
    });

    // --- STT Faucet Subscription ---
    const sttEventSignature = keccak256(toHex("FaucetRequested(address)"));

    console.log("Creating STT Faucet Reactivity subscription...");
    console.log("  Emitter (FaucetRequest):", faucetRequestAddress);
    console.log("  Handler (FaucetHandler):", faucetHandlerAddress);
    console.log("  Event topic:", sttEventSignature);

    const sttResult = await sdk.createSoliditySubscription({
        handlerContractAddress: faucetHandlerAddress,
        priorityFeePerGas: parseGwei("2"),
        maxFeePerGas: parseGwei("10"),
        gasLimit: 3_000_000n,
        isGuaranteed: true,
        isCoalesced: false,
        emitter: faucetRequestAddress,
        eventTopics: [sttEventSignature],
    });

    if (sttResult instanceof Error) {
        console.error("STT subscription creation failed:", sttResult.message);
        process.exit(1);
    }

    console.log("STT Faucet subscription created! TX hash:", sttResult);

    // --- SOMUSD Token Faucet Subscription ---
    const tokenFaucetRequestAddress = process.env.TOKEN_FAUCET_REQUEST_ADDRESS as `0x${string}`;
    const tokenFaucetHandlerAddress = process.env.TOKEN_FAUCET_HANDLER_ADDRESS as `0x${string}`;

    if (!tokenFaucetRequestAddress || !tokenFaucetHandlerAddress) {
        console.log("\nTOKEN_FAUCET_REQUEST_ADDRESS or TOKEN_FAUCET_HANDLER_ADDRESS not set — skipping token faucet subscription.");
        return;
    }

    const tokenEventSignature = keccak256(toHex("TokenFaucetRequested(address)"));

    console.log("\nCreating SOMUSD Token Faucet Reactivity subscription...");
    console.log("  Emitter (TokenFaucetRequest):", tokenFaucetRequestAddress);
    console.log("  Handler (TokenFaucetHandler):", tokenFaucetHandlerAddress);
    console.log("  Event topic:", tokenEventSignature);

    const tokenResult = await sdk.createSoliditySubscription({
        handlerContractAddress: tokenFaucetHandlerAddress,
        priorityFeePerGas: parseGwei("2"),
        maxFeePerGas: parseGwei("10"),
        gasLimit: 7_000_000n,
        isGuaranteed: true,
        isCoalesced: false,
        emitter: tokenFaucetRequestAddress,
        eventTopics: [tokenEventSignature],
    });

    if (tokenResult instanceof Error) {
        console.error("Token faucet subscription creation failed:", tokenResult.message);
        process.exit(1);
    }

    console.log("SOMUSD Token Faucet subscription created! TX hash:", tokenResult);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
