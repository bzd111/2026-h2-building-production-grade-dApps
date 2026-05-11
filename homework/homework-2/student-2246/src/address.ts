import { getAddress, getBytes, keccak256 } from "ethers";
import { decodeAddress, encodeAddress } from "@polkadot/util-crypto";

// ============================================================
// 地址转换说明
//
// Polkadot 有两种地址格式：
//   - H160 (EVM地址):      0x开头，20字节，以太坊格式
//   - SS58 (Substrate地址): 5开头，人类可读格式，底层是32字节 AccountId32
//
// 转换规则（EVM派生地址）：
//   H160 -> AccountId32: 把20字节放前面，后12字节全填 0xEE
//   AccountId32 -> H160: 如果后12字节都是 0xEE，直接取前20字节
// ============================================================

const SS58_PREFIX = 42; // 42 = 通用前缀（测试网用）

// 判断一个 AccountId32 是否是从 EVM 地址派生出来的
function isEthDerived(accountId: Uint8Array): boolean {
  if (accountId.length !== 32) return false;
  for (let i = 20; i < 32; i++) {
    if (accountId[i] !== 0xee) return false;
  }
  return true;
}

// H160 (EVM地址) -> AccountId32 (32字节)
// 规则：前20字节 = H160，后12字节 = 0xEE
export function h160ToAccountId32(h160: string): Uint8Array {
  const normalized = getAddress(h160); // 转为 checksum 格式
  const h160Bytes  = getBytes(normalized);
  const out        = new Uint8Array(32);
  out.fill(0xee);       // 先全填 0xEE
  out.set(h160Bytes, 0); // 前20字节放 H160
  return out;
}

// AccountId32 (32字节) -> H160 (EVM地址)
export function accountId32ToH160(accountId: Uint8Array): string {
  if (accountId.length !== 32) {
    throw new Error(`AccountId32 必须是32字节，实际是 ${accountId.length} 字节`);
  }
  if (isEthDerived(accountId)) {
    // EVM派生地址：直接取前20字节
    return getAddress(`0x${Buffer.from(accountId.slice(0, 20)).toString("hex")}`);
  } else {
    // 原生Substrate地址：用 keccak256 哈希后取后20字节
    const hash = getBytes(keccak256(accountId));
    return getAddress(`0x${Buffer.from(hash.slice(12)).toString("hex")}`);
  }
}

// H160 -> SS58（最常用的转换：EVM地址 -> 波卡地址）
export function h160ToSs58(h160: string): string {
  return encodeAddress(h160ToAccountId32(h160), SS58_PREFIX);
}

// SS58 -> H160（波卡地址 -> EVM地址）
export function ss58ToH160(ss58: string): string {
  return accountId32ToH160(decodeAddress(ss58));
}
