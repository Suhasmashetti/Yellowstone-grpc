import { Connection } from "@solana/web3.js";

// QuickNode endpoint (only the URL)
const QUICKNODE_URL = "https://silent-virulent-rain.solana-mainnet.quiknode.pro/a82cf8d69c4b5f5a1f02d85b9a0d13ffe6f72c9a/";

const connection = new Connection(QUICKNODE_URL, "confirmed");

(async () => {
  const slot = await connection.getSlot();
  console.log("Current slot:", slot);
})();
