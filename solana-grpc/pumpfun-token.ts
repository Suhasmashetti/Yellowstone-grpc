import Client, { CommitmentLevel, SubscribeRequest, SubscribeUpdate } from "@triton-one/yellowstone-grpc";
import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import dotenv from "dotenv";

dotenv.config();


const ENDPOINT = process.env.GRPC_ENDPOINT;
const Pumpfun_programId = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
const mintDiscriminator = Buffer.from(
    [24,
        30,
        200,
        40,
        5,
        28,
        7,
        119]);

async function main() {
    console.log("Starting Pumpfun token listner...");
    
    const client = new Client(ENDPOINT, undefined, undefined);
    console.log("✅ Connected to gPRC endpoint");
    const stream = await client.subscribe();

    const request: SubscribeRequest = {
        accounts: {},
        slots: {},
        transactions: {
            raydiumFilter: {
                accountInclude: [Pumpfun_programId],
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
    console.log("'📁 Listening for new Pumpfun tokens...\n");

    stream.on("data", async(data: SubscribeUpdate) => {
        const txs = data.transaction?.transaction;
        const message = txs?.transaction?.message;
        const signature = bs58.encode(txs?.signature || new Uint8Array());

        if (!txs || !message) return;

        const createInstruction = message.instructions.find(
            (ix) => ix.data && mintDiscriminator.equals(ix.data.slice(0, 8))
        );

        if(!createInstruction) return;
        try {
            const tokenData = await parseTokenData(message, createInstruction, signature);
            if(tokenData) {
                console.log("-----------------------------------------------------------------");
                console.log("🚀 New Pumpfun Token Created: ", tokenData);
                console.log("-----------------------------------------------------------------");
            }
        }catch (error) {
            console.error("Error parsing token data: ", error);
        }
    });
    stream.on("error", (error: any) => console.error("Stream error: ", error));
    stream.on("end", () => console.log("Stream ended"));
    stream.on("close", () => console.log("Stream closed")); 
}   
    async function parseTokenData(message: any, instruction: any, signature: string
    ): Promise<any> {
        try {
            const accountKeys = message.accountKeys;
            const accounts = instruction.accounts;
            

        const mint = new PublicKey(accountKeys[accounts[0]]).toBase58();
        const mint_authority = new PublicKey(accountKeys[accounts[1]]).toBase58();
        const bonding_curve = new PublicKey(accountKeys[accounts[2]]).toBase58();
        const creator = new PublicKey(accountKeys[accounts[7]]).toBase58(); 
        const Signature = signature;
            return {
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