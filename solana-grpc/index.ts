// Run with: npx ts-node raydium-subscribe.ts
import Client,{ SubscribeRequest, SubscribeUpdate } from "@triton-one/yellowstone-grpc";
import dotenv from "dotenv";


dotenv.config();
const ENDPOINT = process.env.GRPC_ENDPOINT;

const client = new Client(ENDPOINT, undefined, undefined);

// Example Raydium pool AMM state accounts
const raydiumPools = [
  "6UeJ85naTpmXcM9Y14GxZ9YUwK9Nw8YhYgZz99KbK4R", // RAY/USDC
  "CiKu4e8Z9WavLkUeEjG6mh7K1L6sYVY6CDaYGi4qC1qx"  // SOL/USDC
];

function handleUpdate(data: SubscribeUpdate): void {
  console.log("📡 Raydium Pool Update:");
  console.dir(data, { depth: 6 });
}

async function main() {
  const stream = await client.subscribe();

  const streamClosed = new Promise<void>((resolve, reject) => {
    stream.on("error", (error: any) => {
      reject(error);
      stream.end();
    });
    stream.on("end", () => resolve());
    stream.on("close", () => resolve());
  });

  stream.on("data", handleUpdate);

  // ✅ Correct filter: specify pubkeys explicitly
  const req: SubscribeRequest  = {
    
  }

  await new Promise<void>((resolve, reject) => {
    stream.write(req, (error: any) => {
      if (error) reject(error);
      else resolve();
    });
  });

  await streamClosed;
}

main().catch(console.error);
