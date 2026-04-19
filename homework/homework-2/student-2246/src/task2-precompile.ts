import { ethers } from "ethers";
import { EVM_RPC_URLS, getEthersProvider, getViemClient } from "./utils";

// ============================================================
// Task 2: 调用 Identity Precompile（地址: 0x0000...0004）
//
// Identity precompile：输入什么，原样返回什么（像镜子）
// 自动尝试多个 RPC 节点，避免单节点故障
// ============================================================

const IDENTITY_PRECOMPILE = "0x0000000000000000000000000000000000000004";

async function main() {
  console.log("================================================");
  console.log("  Task 2: 调用 Identity Precompile");
  console.log("  网络: Westend Asset Hub 测试网");
  console.log("  合约地址:", IDENTITY_PRECOMPILE);
  console.log("================================================\n");

  const inputText = "hello-polkadot-westend";
  const inputHex  = `0x${Buffer.from(inputText, "utf8").toString("hex")}` as `0x${string}`;

  console.log("【输入数据】");
  console.log("  文本     :", inputText);
  console.log("  十六进制 :", inputHex);

  // ---- ethers：自动尝试多个节点 ----
  console.log("\n【ethers.js 调用】");
  let ethersResult = "";
  for (const url of EVM_RPC_URLS) {
    try {
      const provider = getEthersProvider(url);
      ethersResult = await provider.call({
        to:   IDENTITY_PRECOMPILE,
        data: inputHex,
      });
      console.log("  使用节点 :", url);
      console.log("  返回结果 :", ethersResult);
      break;
    } catch (e) {
      console.log("  节点失败 :", url, "→ 尝试下一个");
    }
  }
  const ethersDecoded = ethersResult
    ? Buffer.from(ethersResult.slice(2), "hex").toString("utf8")
    : "";
  console.log("  解码文本 :", ethersDecoded);

  // ---- viem：自动尝试多个节点 ----
  console.log("\n【viem 调用】");
  let viemData = "";
  for (const url of EVM_RPC_URLS) {
    try {
      const client = getViemClient(url);
      const result = await client.call({
        to:   IDENTITY_PRECOMPILE as `0x${string}`,
        data: inputHex,
      });
      viemData = result.data ?? "";
      console.log("  使用节点 :", url);
      console.log("  返回结果 :", viemData);
      break;
    } catch (e) {
      console.log("  节点失败 :", url, "→ 尝试下一个");
    }
  }
  const viemDecoded = viemData
    ? Buffer.from(viemData.slice(2), "hex").toString("utf8")
    : "";
  console.log("  解码文本 :", viemDecoded);

  // ---- 验证 ----
  console.log("\n【结果验证】");
  const ethersOk = ethersDecoded === inputText;
  const viemOk   = viemDecoded   === inputText;
  const bothSame = ethersResult.toLowerCase() === viemData.toLowerCase();

  console.log("  ethers 返回 == 输入原文 :", ethersOk ? "✅ PASS" : "❌ FAIL");
  console.log("  viem 返回   == 输入原文 :", viemOk   ? "✅ PASS" : "❌ FAIL");
  console.log("  ethers == viem          :", bothSame ? "✅ PASS" : "❌ FAIL");

  console.log("\n✅ Task 2 完成！");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ 运行出错:", err);
    process.exit(1);
  });
