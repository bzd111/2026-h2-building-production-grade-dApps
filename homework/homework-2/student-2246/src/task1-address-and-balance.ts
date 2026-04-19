import { ethers } from "ethers";
import { formatEther } from "viem";
import { h160ToSs58, ss58ToH160 } from "./address";
import { getEthersProvider, getPapiApi, getViemClient } from "./utils";

// ============================================================
// Task 1: 地址转换 + 余额一致性验证
//
// 目标：
//   1. 把一个 H160 (EVM) 地址转成 SS58 (Substrate) 地址
//   2. 再把 SS58 转回 H160，验证一致（round-trip）
//   3. 用 ethers / viem / papi 三个库分别查余额，验证结果一致
// ============================================================

// 这是一个在 Westend Asset Hub 测试网上有余额的地址
// 你也可以换成自己的地址
const TEST_H160 = "0x5c434e203265949d679ec97b950dacf4e4d2e17e";

// Westend Asset Hub 的单位说明：
//   Substrate层: planck，精度12位 (1 WND = 10^12 planck)
//   EVM层:       wei，  精度18位 (1 WND = 10^18 wei)
// 所以 1 planck = 10^6 wei，需要乘以 10^6 才能对比
const SUBSTRATE_DECIMALS = 12;
const EVM_DECIMALS       = 18;

function scalePlanckToWei(planck: bigint): bigint {
  // planck * 10^(18-12) = planck * 10^6
  return planck * 10n ** BigInt(EVM_DECIMALS - SUBSTRATE_DECIMALS);
}

async function main() {
  console.log("================================================");
  console.log("  Task 1: 地址转换 + 余额一致性验证");
  console.log("  网络: Westend Asset Hub 测试网");
  console.log("================================================\n");

  // ---- Step 1: 地址转换 ----
  console.log("【Step 1】地址转换");
  const ss58         = h160ToSs58(TEST_H160);
  const roundTripH160 = ss58ToH160(ss58);

  console.log("  原始 H160 地址  :", TEST_H160);
  console.log("  转换后 SS58 地址 :", ss58);
  console.log("  SS58 转回 H160  :", roundTripH160);

  const roundTripOk =
    roundTripH160.toLowerCase() === ethers.getAddress(TEST_H160).toLowerCase();
  console.log("  Round-trip 验证 :", roundTripOk ? "✅ PASS" : "❌ FAIL");

  // ---- Step 2: 查询余额 ----
  console.log("\n【Step 2】用三个库分别查询余额");

  const ethersProvider = getEthersProvider();
  const viemClient     = getViemClient();
  const papiApi        = await getPapiApi();

  // ethers.js 查 EVM 余额
  const ethersBal = await ethersProvider.getBalance(TEST_H160);
  console.log("  ethers 余额 (wei)      :", ethersBal.toString());

  // viem 查 EVM 余额
  const viemBal = await viemClient.getBalance({
    address: TEST_H160 as `0x${string}`,
  });
  console.log("  viem 余额   (wei)      :", viemBal.toString());

  // papi 查 Substrate 余额
  const accountInfo  = await papiApi.query.system.account(ss58);
  const substrateFree = BigInt(accountInfo.data.free.toString());
  const substrateAsWei = scalePlanckToWei(substrateFree);
  console.log("  papi 余额   (planck)   :", substrateFree.toString());
  console.log("  papi 换算   (wei)      :", substrateAsWei.toString());

  // ---- Step 3: 一致性验证 ----
  console.log("\n【Step 3】一致性验证");

  // ethers 和 viem 应该完全一致（查的是同一个 EVM 节点数据）
  const evmAgree = ethersBal === viemBal;
  console.log("  ethers vs viem         :", evmAgree ? "✅ PASS" : "❌ FAIL");

  // EVM 和 Substrate 允许小误差（精度换算可能有舍入）
  const diff      = ethersBal > substrateAsWei
    ? ethersBal - substrateAsWei
    : substrateAsWei - ethersBal;
  const tolerance = 10n ** 15n; // 允许 0.001 WND 的误差
  const substrateClose = diff <= tolerance;
  console.log("  EVM vs papi (误差容忍 0.001 WND):", substrateClose ? "✅ PASS" : "❌ FAIL");
  console.log("  实际误差 (wei)         :", diff.toString());

  // ---- 汇总 ----
  console.log("\n【汇总】");
  console.log("  ethers 余额:", formatEther(ethersBal), "WND");
  console.log("  viem 余额  :", formatEther(viemBal),   "WND");
  console.log("  papi 余额  :", (Number(substrateFree) / 10 ** SUBSTRATE_DECIMALS).toFixed(6), "WND");

  await papiApi.disconnect();
  console.log("\n✅ Task 1 完成！");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ 运行出错:", err);
    process.exit(1);
  });
