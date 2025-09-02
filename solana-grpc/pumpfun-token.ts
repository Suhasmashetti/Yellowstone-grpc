import Client, { CommitmentLevel, SubscribeRequest, SubscribeUpdate } from "@triton-one/yellowstone-grpc";


const ENDPOINT = "solana-rpc.parafin.tech:10443"; 
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
const client = new Client(ENDPOINT, undefined, undefined);
const stream = await client.subscribe();

async function main() {
    console.log("Starting Pumpfun token listner...");
    
    const client = new Client(ENDPOINT, undefined, undefined);
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
        ;
    })
}   