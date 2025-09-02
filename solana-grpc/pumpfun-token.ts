import Client, { CommitmentLevel, SubscribeRequest, SubscribeUpdate } from "@triton-one/yellowstone-grpc";
import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { BorshInstructionCoder } from "@coral-xyz/anchor";
import * as fs from 'fs';
import * as path from 'path';
import dotenv from "dotenv";

const pumpfunIdl = JSON.parse(fs.readFileSync(path.join(__dirname, 'IDLS/pumpfunIDL.json'), 'utf8'));

dotenv.config();

const ENDPOINT = process.env.GRPC_ENDPOINT;
if (!ENDPOINT) {
    throw new Error("GRPC_ENDPOINT environment variable is not set. Please set it in a .env file.");
}
const GRPC_ENDPOINT: string = ENDPOINT;

const Pumpfun_programId = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";

const coder = new BorshInstructionCoder(pumpfunIdl as any);
const mintDiscriminator = Buffer.from([24, 30, 200, 40, 5, 28, 7, 119]);

interface InstructionData {
    name: string;
    symbol: string;
    uri: string;
}

async function main() {
    const client = new Client(GRPC_ENDPOINT, undefined, undefined);
    
    console.log("✅ Connected to gPRC endpoint");
    const stream = await client.subscribe();
    
    const request: SubscribeRequest = {
        accounts: {},
        slots: {},
        transactions: {
            pumpfun: {
                accountInclude: [Pumpfun_programId],
                accountExclude: [],
                accountRequired: []
            },
        },
        transactionsStatus: {},
        entry: {}, 
        blocks: {},
        blocksMeta: {},
        accountsDataSlice: [],
        commitment: CommitmentLevel.FINALIZED,
        ping: undefined,
    };

    stream.write(request);
    console.log("📁 Listening for new Pumpfun tokens...\n");

    stream.on("data", async (data: SubscribeUpdate) => {
        const txs = data.transaction?.transaction;
        const message = txs?.transaction?.message;
        const signature = bs58.encode(txs?.signature || new Uint8Array());

        if (!txs || !message) {
            return;
        }
        // Have to check each instruction in the transaction to see if it matches the mint discriminator
        const createInstruction = message.instructions.find(
            (ix) => ix.data && mintDiscriminator.equals(ix.data.slice(0, 8))
        );

        if (!createInstruction) {
            return;
        }

        try {
            const tokenData = await parseTokenData(message, createInstruction, signature);
            if (tokenData) {
                console.log("-----------------------------------------------------------------");
                console.log("🚀 New Pumpfun Token Created:");
                console.log(JSON.stringify(tokenData, null, 2));
                console.log("-----------------------------------------------------------------");
            }
        } catch (error) {
            console.error("Error parsing token data: ", error);
        }
    });

    stream.on("error", (error: any) => console.error("Stream error: ", error));
    stream.on("end", () => console.log("Stream ended"));
    stream.on("close", () => console.log("Stream closed"));
}

async function parseTokenData(
    message: any,
    instruction: any,
    signature: string
): Promise<any> {
    try {
        const accountKeys = message.accountKeys;
        const accounts = instruction.accounts;
        const decoded = coder.decode(instruction.data);
        if (!decoded) {
            return null;
        }
        console.log("suas");


        const args = decoded.data as InstructionData;

        const mint = new PublicKey(accountKeys[accounts[0]]).toBase58();
        const mint_authority = new PublicKey(accountKeys[accounts[1]]).toBase58();
        const bonding_curve = new PublicKey(accountKeys[accounts[2]]).toBase58();
        const creator = new PublicKey(accountKeys[accounts[7]]).toBase58();
        const Signature = signature;

        return {
            name: args.name,
            symbol: args.symbol,
            uri: args.uri,
            Signature,
            mint,
            mint_authority,
            bonding_curve,
            creator
        };
    } catch (error) {
        console.error("Error in parseTokenData: ", error);
        return null;
    }
}

main().catch(console.error);
