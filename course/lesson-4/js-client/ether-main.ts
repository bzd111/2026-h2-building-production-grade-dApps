import { Contract, ethers, Wallet } from "ethers"
import { ABI, BYTECODE } from "./erc20"
import dotenv from "dotenv"
dotenv.config()

async function main() {
    const url = "https://services.polkadothub-rpc.com/testnet"
    const privateKey = dotenv.config().parsed?.PRIVATE_KEY
    if (!privateKey) {
        throw new Error("PRIVATE_KEY is not set")
    }

    const provider = new ethers.JsonRpcProvider(url)
    const wallet = new ethers.Wallet(privateKey, provider)
    const factory = new ethers.ContractFactory(ABI, BYTECODE, wallet)
    const contract = await factory.deploy("name", "symbol", 18, 123)
    await contract.waitForDeployment()
    const contractAddress = await contract.getAddress()

    const deployedContract = new ethers.Contract(contractAddress, ABI, wallet)
    const balance = await deployedContract.balanceOf(wallet.address)
    console.log(`balance is ${balance}`)
    const transfer = await deployedContract.transfer("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", BigInt(123))
    console.log(`transfer is ${transfer}`)
    const receipt = await transfer.wait()
    console.log(`receipt is ${receipt?.blockNumber}`)
    const balance2 = await deployedContract.balanceOf("0x70997970C51812dc3A010C7d01b50e0d17dc79C8")
    console.log(`balance2 is ${balance2}`)
}

main().catch((e) => {
    console.error(e)
    process.exitCode = 1
})
