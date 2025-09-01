import Client, {
  CommitmentLevel,
  SubscribeRequest,
  SubscribeUpdate,
} from "@triton-one/yellowstone-grpc";
import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { BorshInstructionCoder } from "@coral-xyz/anchor";
import raydiumIDL from "./IDLS/raydiumIDL.json" with { type: "json" };


//@ts-ignore
const coder = new BorshInstructionCoder(raydiumIDL);

const ENDPOINT = "https://solana-rpc.parafi.tech:10443";
const RAYDIUM_PROGRAM_ID = "LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj";
const CREATE_DISCRIMINATOR = Buffer.from([
  175, 175, 109, 31, 13, 152, 155, 237,
]);

interface Args {
  name: string;
  data: {
    base_mint_param: {
      name: string;
      symbol: string;
      uri: string;
    };
  };
}

async function main() {
  console.log("Starting Raydium-(LetsbonkFun) token listener...");

  const client = new Client(ENDPOINT, undefined, undefined);
  const stream = await client.subscribe();

  const request: SubscribeRequest = {
    accounts: {},
    slots: {},
    transactions: {
      raydiumFilter: {
        accountInclude: [RAYDIUM_PROGRAM_ID],
        accountExclude: [],
        accountRequired: [],
      },
    },
    transactionsStatus: {},
    entry: {},
    blocks: {},
    blocksMeta: {},
    commitment: CommitmentLevel.FINALIZED,
    accountsDataSlice: [],
    ping: undefined,
  };

  stream.write(request);
  console.log("✓ Listening for new Raydium-(LetsbonkFun) tokens...\n");

  stream.on("data", async (data: SubscribeUpdate) => {
    const transaction = data.transaction?.transaction;
    const message = transaction?.transaction?.message;

    if (!transaction || !message) return;

    // method one
    const createInstruction = message.instructions.find(
      (ix) => ix.data && CREATE_DISCRIMINATOR.equals(ix.data.slice(0, 8))
    );

    // method two
    //     const createInstruction = message.instructions.find(ix => {
    //     const descrimnator = ix.data.slice(0,8);

    //    if(CREATE_DISCRIMINATOR.equals(descrimnator)){
    //     console.log("created-----")
    //    }

    // });
    if (!createInstruction) return;

    // if(createInstruction){
    //     console.log("token created ------", bs58.encode(Buffer.from(transaction.signature)) );
    // }

    try {
      const tokenData = await parseTokenData(
        message,
        createInstruction,
        transaction,
        data
      );
        if (tokenData) {
          console.log("🚀 NEW TOKEN DETECTED!");
          console.log(tokenData);
          console.log("─".repeat(50));
        }
    } catch (error) {
      console.error("Error parsing token data:", error);
    }
  });

  stream.on("error", (error: any) => console.error("Stream error:", error));
  stream.on("end", () => console.log("Stream ended"));
}

async function parseTokenData(
  message: any,
  instruction: any,
  transaction: any,
  data: any
) {
  try {
    const accountKeys = message.accountKeys;
    const accounts = instruction.accounts;

    // Guard against missing accounts
    if (!accounts || accounts.length < 11) {
      console.warn("Not enough accounts in instruction:", accounts);
      return null;
    }

    // Decode instruction data safely
    const decoded = coder.decode(bs58.decode(instruction.data), "base58");
    if (!decoded) {
      console.warn("Failed to decode instruction data:", instruction.data);
      return null;
    }

    const args: Args = decoded as Args;

    // Extract accounts safely
    const payer = new PublicKey(accountKeys[accounts[0]]).toBase58();
    const mint = new PublicKey(accountKeys[accounts[6]]).toBase58();
    const base_vault = new PublicKey(accountKeys[accounts[8]]).toBase58();
    const quote_vault = new PublicKey(accountKeys[accounts[9]]).toBase58();
    const metadata_account = new PublicKey(
      accountKeys[accounts[10]]
    ).toBase58();

    // Handle signature safely
    let signature: string;
    if (transaction.signature instanceof Uint8Array) {
      signature = bs58.encode(transaction.signature);
    } else if (Array.isArray(transaction.signature)) {
      signature = bs58.encode(Uint8Array.from(transaction.signature));
    } else {
      signature = String(transaction.signature);
    }

    return {
      user: payer,
      signature,
      slot: data.transaction?.slot?.toString() || "",
      mint,
      name: args.data?.base_mint_param?.name ?? "",
      uri: args.data?.base_mint_param?.uri ?? "",
      symbol: args.data?.base_mint_param?.symbol ?? "",
      creator: payer,
      base_vault,
      quote_vault,
      metadata_account,
    };
  } catch (error) {
    console.error("Error parsing token data:", error);
    return null;
  }
}

main().catch(console.error);