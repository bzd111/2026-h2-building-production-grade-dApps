import { createPublicClient, defineChain, http, hexToBigInt, createWalletClient, parseEther, getContract } from "viem"
import { ABI, BYTECODE } from "./erc20"
import { privateKeyToAccount } from "viem/accounts"
import dotenv from "dotenv"
dotenv.config()
export const localChain = (url: string) => defineChain({
    id: 420420417,
    name: 'Polkadot Hub TestNet',
    network: 'Polkadot Hub TestNet',
    nativeCurrency: {
        name: 'PAS',
        symbol: 'PAS',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: [url],
        },
    },
    testnet: true,
})
async function main() {

    const privateKey = dotenv.config().parsed?.PRIVATE_KEY
    if (!privateKey) {
        throw new Error("PRIVATE_KEY is not set")
    }
    const url = "https://services.polkadothub-rpc.com/testnet"
    const account = privateKeyToAccount(privateKey as `0x${string}`)
    const publicClient = createPublicClient({ chain: localChain(url), transport: http() })
    const walletClient = createWalletClient({ chain: localChain(url), transport: http(), account: account })
    const to = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"

    const contract = getContract({
        address: "0xbb95aa2d7262cbdb5b4ff7880c3410d0cbd76d84",
        abi: ABI,
        client: walletClient
    })
    const balance = await contract.read.balanceOf([to])
    console.log(`balance is ${balance}`)
    const transfer = await contract.write.transfer([to, 123])
    console.log(`transfer is ${transfer}`)
    const receipt = await publicClient.waitForTransactionReceipt({ hash: transfer })
    console.log(`receipt is ${receipt?.blockNumber}`)
    const balance2 = await contract.read.balanceOf([to])
    console.log(`balance2 is ${balance2}`)
}

main().catch((error) => {
    console.error(error)
})
