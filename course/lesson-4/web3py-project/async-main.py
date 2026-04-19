from __future__ import annotations

import asyncio
import json
import os
import time
from pathlib import Path
from dotenv import load_dotenv
from web3 import AsyncHTTPProvider, AsyncWeb3, Web3
from web3.exceptions import TransactionNotFound

load_dotenv()

ROOT = Path(__file__).resolve().parent
ABI_PATH = ROOT / "abis" / "Storage.json"
BIN_PATH = ROOT / "artifacts" / "Storage.bin"

_MIN_PRIORITY_WEI = Web3.to_wei(2, "gwei")


def _format_key(pk: str) -> str:
    pk = pk.strip()
    return pk if pk.startswith("0x") else f"0x{pk}"


def _load_abi_bytecode() -> tuple[list, str]:
    abi = json.loads(ABI_PATH.read_text())
    raw = BIN_PATH.read_text().strip()
    bytecode = raw if raw.startswith("0x") else f"0x{raw}"
    return abi, bytecode


def _tx_hex(tx_hash) -> str:
    h = tx_hash.hex() if hasattr(tx_hash, "hex") else str(tx_hash)
    return h if h.startswith("0x") else f"0x{h}"


async def wait_for_receipt_async(
    w3: AsyncWeb3,
    tx_hash,
    *,
    timeout: float = 600,
    poll_latency: float = 3,
) -> dict:
    deadline = time.monotonic() + timeout
    tx_hex = _tx_hex(tx_hash)
    await asyncio.sleep(poll_latency)
    last_log = time.monotonic()
    while time.monotonic() < deadline:
        try:
            receipt = await w3.eth.get_transaction_receipt(tx_hex)
            if receipt is not None:
                return receipt
        except TransactionNotFound:
            pass
        except ValueError:
            pass
        if time.monotonic() - last_log >= 30:
            print(f"… waiting for receipt {tx_hex[:22]}…")
            last_log = time.monotonic()
        await asyncio.sleep(poll_latency)
    raise TimeoutError(f"No receipt for {tx_hex} after {timeout}s")


async def deploy_storage(w3: AsyncWeb3, private_key: str) -> str:
    abi, bytecode = _load_abi_bytecode()
    account = w3.eth.account.from_key(private_key)
    print(f"Deploy from {account.address}")
    print(f"chain_id={await w3.eth.chain_id}")

    contract = w3.eth.contract(abi=abi, bytecode=bytecode)
    nonce = await w3.eth.get_transaction_count(account.address)
    gas_est = await contract.constructor().estimate_gas({"from": account.address})
    gas = int(gas_est * 1.25)
    
    tx = await contract.constructor().build_transaction(
        {
            "from": account.address,
            "nonce": nonce,
            "chainId": await w3.eth.chain_id,
            "gas": gas,
        }
    )
    signed = w3.eth.account.sign_transaction(tx, private_key=private_key)
    raw = signed.raw_transaction
    tx_hash = await w3.eth.send_raw_transaction(raw)
    print(f"deploy tx {_tx_hex(tx_hash)}")
    receipt = await wait_for_receipt_async(w3, tx_hash)
    addr = receipt["contractAddress"]
    if not addr:
        raise RuntimeError("Deployment receipt missing contractAddress")
    print(f"deployed Storage at {addr}")
    return addr


async def read_stored(w3: AsyncWeb3, address: str, abi: list) -> int:
    c = w3.eth.contract(address=Web3.to_checksum_address(address), abi=abi)
    return await c.functions.storedNumber().call()


async def set_stored(
    w3: AsyncWeb3,
    private_key: str,
    contract_address: str,
    abi: list,
    value: int,
) -> None:
    account = w3.eth.account.from_key(private_key)
    c = w3.eth.contract(
        address=Web3.to_checksum_address(contract_address), abi=abi
    )
    nonce = await w3.eth.get_transaction_count(account.address)
    fn = c.functions.setNumber(value)
    gas_est = await fn.estimate_gas({"from": account.address})
    gas = int(gas_est * 1.25)
    tx = await fn.build_transaction(
        {
            "from": account.address,
            "nonce": nonce,
            "chainId": await w3.eth.chain_id,
            "gas": gas,
        }
    )
    signed = w3.eth.account.sign_transaction(tx, private_key=private_key)
    tx_hash = await w3.eth.send_raw_transaction(signed.raw_transaction)
    print(f"setNumber tx {_tx_hex(tx_hash)}")
    receipt = await wait_for_receipt_async(w3, tx_hash)
    print(f"mined block {receipt['blockNumber']} gasUsed {receipt['gasUsed']}")


async def run() -> None:
    if not ABI_PATH.is_file() or not BIN_PATH.is_file():
        raise SystemExit("Run `python compile.py` first to create abis/ and artifacts/.")
    rpc = "https://services.polkadothub-rpc.com/testnet"
    pk_raw = os.getenv("PRIVATE_KEY", "")
    if not pk_raw:
        raise SystemExit("PRIVATE_KEY is not set")

    pk = _format_key(pk_raw)
    abi, _ = _load_abi_bytecode()

    w3 = AsyncWeb3(AsyncHTTPProvider(rpc, request_kwargs={"timeout": 120}))

    existing = os.environ.get("STORAGE_CONTRACT_ADDRESS", "").strip()
    if existing:
        addr = Web3.to_checksum_address(existing)
        print(f"Using STORAGE_CONTRACT_ADDRESS={addr}")
    else:
        addr = await deploy_storage(w3, pk)
        print(f"\nAdd to .env: STORAGE_CONTRACT_ADDRESS={addr}\n")

    before = await read_stored(w3, addr, abi)
    print(f"storedNumber (before) = {before}")

    new_val = 42
    await set_stored(w3, pk, addr, abi, new_val)

    after = await read_stored(w3, addr, abi)
    print(f"storedNumber (after)  = {after}")


def main() -> None:
    asyncio.run(run())


if __name__ == "__main__":
    main()
