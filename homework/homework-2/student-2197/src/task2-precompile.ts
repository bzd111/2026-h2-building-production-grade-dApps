import { ethers } from "ethers";
import { createHash } from "node:crypto";
import { EVM_RPC_URLS, getEthersProvider, getViemClient } from "./utils";

const SHA256_PRECOMPILE = "0x0000000000000000000000000000000000000002";
const IDENTITY_PRECOMPILE = "0x0000000000000000000000000000000000000004";
const MODEXP_PRECOMPILE = "0x0000000000000000000000000000000000000005";

async function main() {
  console.log("=== Task2: Precompile call ===");
  console.log("Network: Westend Asset Hub testnet");
  console.log("Note: Demonstrating ethers.js & viem precompile calls");
  console.log("Public testnet RPCs may have limited precompile support\n");

  // Test precompiles
  const precompiles = [
    {
      address: SHA256_PRECOMPILE,
      name: "SHA256",
      input: "hello-polkadot-testnet",
      description: "Computes SHA256 hash"
    },
    {
      address: IDENTITY_PRECOMPILE,
      name: "Identity",
      input: "0x12345678",
      description: "Returns input unchanged"
    },
    {
      address: MODEXP_PRECOMPILE,
      name: "ModExp",
      input: "0x0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000310000000000000000000000000000000000000000000000000000000000000002010000000000000000000000000000000000000000000000000000000000000002",
      description: "Modular exponentiation (2^3 mod 2)"
    }
  ];

  console.log("=".repeat(80));
  console.log("PRECOMPILE ADDRESS REFERENCE:");
  console.log("=".repeat(80));
  console.log("0x0000000000000000000000000000000000000001 - ecrecover");
  console.log("0x0000000000000000000000000000000000000002 - sha256hash");
  console.log("0x0000000000000000000000000000000000000003 - ripemd160hash");
  console.log("0x0000000000000000000000000000000000000004 - datacopy (identity)");
  console.log("0x0000000000000000000000000000000000000005 - bigModExp");
  console.log("...and more (BN256, Blake2f, etc.)");
  console.log("=".repeat(80));
  console.log();

  for (const { address, name, input, description } of precompiles) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`Testing ${name} Precompile`);
    console.log(`${'─'.repeat(80)}`);
    console.log("Description:", description);
    console.log("Address:   ", address);
    console.log("Name:      ", name);

    const inputHex = input.startsWith("0x") ? input as `0x${string}` : `0x${Buffer.from(input, "utf8").toString("hex")}` as `0x${string}`;
    const inputDisplay = input.startsWith("0x") ? input : input;

    console.log("Input:     ", inputDisplay.length > 50 ? inputDisplay.substring(0, 50) + "..." : inputDisplay);
    console.log("Input hex: ", inputHex.length > 50 ? inputHex.substring(0, 50) + "..." : inputHex);

    let ethersOut: string | null = null;
    let viemOut: `0x${string}` | null = null;
    let ethersRpcUsed: string | null = null;
    let viemRpcUsed: string | null = null;
    const attemptLogs: string[] = [];

    // Try ethers.js with multiple RPCs
    for (const rpcUrl of EVM_RPC_URLS) {
      const ethersProvider = getEthersProvider(rpcUrl);
      try {
        const out = await ethersProvider.call({
          to: address,
          data: inputHex,
        });
        ethersOut = out;
        ethersRpcUsed = rpcUrl;
        break;
      } catch (err) {
        const errorMsg = (err as Error).message;
        if (!errorMsg.includes("retry in") && !errorMsg.includes("failed to detect network")) {
          attemptLogs.push(`ethers @ ${rpcUrl.split('/')[2]}: ${errorMsg.substring(0, 80)}`);
        }
      }
    }

    // Try viem with multiple RPCs
    for (const rpcUrl of EVM_RPC_URLS) {
      const viemClient = getViemClient(rpcUrl);
      try {
        const result = await viemClient.call({
          to: address as `0x${string}`,
          data: inputHex,
        });
        viemOut = result.data ?? null;
        viemRpcUsed = rpcUrl;
        break;
      } catch (err) {
        const errorMsg = (err as Error).message;
        if (!errorMsg.includes("retry in") && !errorMsg.includes("failed to detect network")) {
          attemptLogs.push(`viem @ ${rpcUrl.split('/')[2]}: ${errorMsg.substring(0, 80)}`);
        }
      }
    }

    // Log any fallback attempts
    if (attemptLogs.length > 0) {
      console.log("\n⚠️  RPC fallback attempts:");
      for (const log of attemptLogs) console.log(`   ${log}`);
    }

    // Calculate expected value locally
    let expectedValue: string;
    if (name === "SHA256") {
      expectedValue = `0x${createHash("sha256").update(inputDisplay).digest("hex")}`;
    } else if (name === "Identity") {
      expectedValue = inputHex;
    } else if (name === "ModExp") {
      // 2^3 mod 2 = 0
      expectedValue = "0x0000000000000000000000000000000000000000000000000000000000000000";
    } else {
      expectedValue = "0x";
    }

    // Display results
    console.log("\n📊 Results:");
    console.log("   ethers output:", ethersOut ?? "(RPC returned no data)");
    console.log("   ethers rpc:   ", ethersRpcUsed ? ethersRpcUsed.split('/')[2] : "(none succeeded)");
    console.log("   viem output: ", viemOut ?? "(RPC returned no data)");
    console.log("   viem rpc:    ", viemRpcUsed ? viemRpcUsed.split('/')[2] : "(none succeeded)");

    if (name !== "ModExp") {
      console.log("   expected:    ", expectedValue);
    }

    // Verification
    if (name === "SHA256") {
      const ethersOk = ethersOut && ethersOut.toLowerCase() === expectedValue.toLowerCase();
      const viemOk = viemOut && viemOut.toLowerCase() === expectedValue.toLowerCase();
      console.log("\n✅ Verification:");
      console.log("   ethers == sha256:", ethersOk ? "✅ PASS" : "❌ FAIL");
      console.log("   viem   == sha256:", viemOk ? "✅ PASS" : "❌ FAIL");
    } else if (name === "Identity") {
      const ethersOk = ethersOut && ethersOut.toLowerCase() === expectedValue.toLowerCase();
      const viemOk = viemOut && viemOut.toLowerCase() === expectedValue.toLowerCase();
      console.log("\n✅ Verification:");
      console.log("   ethers == expected:", ethersOk ? "✅ PASS" : "❌ FAIL");
      console.log("   viem   == expected:", viemOk ? "✅ PASS" : "❌ FAIL");
    } else if (name === "ModExp") {
      const ethersOk = ethersOut === expectedValue;
      const viemOk = viemOut === expectedValue;
      console.log("\n✅ Verification (2^3 mod 2 = 0):");
      console.log("   ethers result:", ethersOk ? "✅ PASS" : "❌ FAIL");
      console.log("   viem result:  ", viemOk ? "✅ PASS" : "❌ FAIL");
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("SUMMARY");
  console.log("=".repeat(80));
  console.log("✅ Successfully demonstrated:");
  console.log("   • Using ethers.js to call precompile contracts");
  console.log("   • Using viem to call precompile contracts");
  console.log("   • RPC fallback mechanism for reliability");
  console.log("   • Local hash calculation for verification");
  console.log("\n⚠️  Note:");
  console.log("   Public testnet RPCs may have limited precompile support.");
  console.log("   For production use, consider running a local node or using dedicated RPC providers.");
  console.log("=".repeat(80));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
