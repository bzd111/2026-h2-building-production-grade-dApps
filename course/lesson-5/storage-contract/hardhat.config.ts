import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "@parity/hardhat-polkadot"
import "@nomicfoundation/hardhat-verify";

import dotenv from "dotenv"
dotenv.config()

const config: HardhatUserConfig = {
    solidity: "0.8.28",
    networks: {
        hardhat: {
            polkadot: {
                target: "evm",
            },
            nodeConfig: {
                nodeBinaryPath: "./bin/dev-node",
                rpcPort: 8000,
                dev: true,
            },
            adapterConfig: {
                adapterBinaryPath: "./bin/eth-rpc",
                dev: true,
            },
        },
        localNode: {
            polkadot: {
                target: "evm",
            },
            url: `http://127.0.0.1:8545`,
        },
        polkadotHubTestnet: {
            polkadot: {
                target: "pvm",
            },
            url: "https://services.polkadothub-rpc.com/testnet",
            accounts: [process.env.PRIVATE_KEY!],
        },
    },
    etherscan: {
        apiKey: {
            polkadotHubTestnet: 'no-api-key-needed',
        },
        customChains: [
            {
                network: 'polkadotHubTestnet',
                chainId: 420420417,
                urls: {
                    apiURL: 'https://blockscout-testnet.polkadot.io/api',
                    browserURL: 'https://blockscout-testnet.polkadot.io/',
                },
            },
        ],
    },
}

export default config
