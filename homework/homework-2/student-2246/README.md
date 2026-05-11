# Homework 2

使用 `ethers` / `viem` / `PAPI` 连接 **Polkadot Hub TestNet**，完成：

1. 地址转换（H160 <-> SS58）并验证余额一致性
2. 调用 Identity Precompile（`0x0000000000000000000000000000000000000004`）

## 目录结构
homework-2/
├── src/
│   ├── utils.ts
│   ├── address.ts
│   ├── task1-address-and-balance.ts
│   └── task2-precompile.ts
├── package.json
├── tsconfig.json
└── README.md

## 网络配置

- EVM RPC: `https://eth-rpc-testnet.polkadot.io/`
- Substrate WS: `wss://asset-hub-paseo-rpc.n.dwellir.com`
- Chain ID: 420420417

## 安装

```bash
npm install
```

## 运行

### Task 1: 地址转换 + 余额一致性

```bash
npm run task1
```

- H160 -> SS58 转换
- SS58 -> H160 回转校验
- ethers / viem / PAPI 三库余额对比

### Task 2: 调用 Precompile

```bash
npm run task2
```

选择 Identity Precompile（`0x...0004`），分别通过 ethers 和 viem 调用，验证返回值与输入一致。