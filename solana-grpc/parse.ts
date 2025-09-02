import { Connection, PublicKey } from "@solana/web3.js";
import { Liquidity } from "@raydium-io/raydium-sdk";

const connection = new Connection("https://api.mainnet-beta.solana.com");

// Example Raydium pool (SOL-USDC v4 AMM pool)
const RAYDIUM_POOL_ADDRESS = new PublicKey("7C6zHy7sCENZibYX8tS8waF7VxnFod7UXpP2jUg5cfyW");

async function main() {
  // Fetch pool state (on-chain data)
  const poolInfo = await Liquidity.fetchInfo({
    connection,
    poolKeys: {
      id: RAYDIUM_POOL_ADDRESS,
      programId: new PublicKey("RVKd61ztZW9sgo96hN7eWLchsvhp2Wxw9LqdpMMfKXo"), // Raydium AMM program v4
      // normally you'd provide the full poolKeys object here (baseVault, quoteVault, etc.)
      baseVault: new PublicKey("8HoQnePLqPj4M7PUDzfw8e3Ymdwgc7NLGnaTUapubyvu"), // Example base vault (SOL)
      quoteVault: new PublicKey("CoU3mXgGZ4Yq6Zz8hV4F6d7Y3c2D9n4b5v5Z1fXoJt7v"), // Example quote vault (USDC)
    },
  });

  console.log("Pool Vaults:", {
    baseVault: poolInfo.baseVault.toBase58(),
    quoteVault: poolInfo.quoteVault.toBase58(),
  });

  // Subscribe to vault accounts to get real-time reserves
  connection.onAccountChange(poolInfo.baseVault, (accountInfo) => {
    const amount = accountInfo.data.readBigUInt64LE(64); // SPL token account balance
    console.log("Base reserve updated:", amount.toString());
  });

  connection.onAccountChange(poolInfo.quoteVault, (accountInfo) => {
    const amount = accountInfo.data.readBigUInt64LE(64);
    console.log("Quote reserve updated:", amount.toString());
  });
}

main();
