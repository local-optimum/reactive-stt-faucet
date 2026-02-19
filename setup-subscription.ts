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

    const eventSignature = keccak256(toHex("FaucetRequested(address)"));

    console.log("Creating Reactivity subscription...");
    console.log("  Emitter (FaucetRequest):", faucetRequestAddress);
    console.log("  Handler (FaucetHandler):", faucetHandlerAddress);
    console.log("  Event topic:", eventSignature);

    const result = await sdk.createSoliditySubscription({
        handlerContractAddress: faucetHandlerAddress,
        priorityFeePerGas: parseGwei("2"),
        maxFeePerGas: parseGwei("10"),
        gasLimit: 3_000_000n,
        isGuaranteed: true,
        isCoalesced: false,
        emitter: faucetRequestAddress,
        eventTopics: [eventSignature],
    });

    if (result instanceof Error) {
        console.error("Subscription creation failed:", result.message);
        process.exit(1);
    }

    console.log("Subscription created! TX hash:", result);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
