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

const ENDPOINT = "solana-rpc.parafin.tech:10443"; // Must support Yellowstone gRPC
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

    // Extract account addresses

    const payer = new PublicKey(accountKeys[accounts[0]]).toBase58();

    const mint = new PublicKey(accountKeys[accounts[6]]).toBase58();
    const base_vault = new PublicKey(accountKeys[accounts[8]]).toBase58();
    const quote_vault = new PublicKey(accountKeys[accounts[9]]).toBase58();
    const metadata_account = new PublicKey(
      accountKeys[accounts[10]]
    ).toBase58();

    const decoded = coder.decode(instruction.data, "base58");

    if (!decoded) {
      return null;
    }

    const args: Args = decoded as Args;

    // console.log("here is data", args);

    return {
      user: payer,
      signature: bs58.encode(Buffer.from(transaction.signature)),
      slot: data.transaction?.slot?.toString() || "",
      mint,
      name: args.data.base_mint_param.name,
      uri: args.data.base_mint_param.uri,
      symbol: args.data.base_mint_param.symbol,
      creator: payer,
      base_vault:base_vault,
      quote_vault:quote_vault,
      metadata_account: metadata_account,
    };
  } catch (error) {
    console.error("Error parsing token data:", error);
    return null;
  }
}

main().catch(console.error);