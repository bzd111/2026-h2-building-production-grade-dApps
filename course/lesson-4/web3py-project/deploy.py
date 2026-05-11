from web3 import Web3
from web3.exceptions import TransactionNotFound
import json
from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()

ARTIFACTS_DIR = Path(__file__).parent
ABI_DIR = ARTIFACTS_DIR / "abis"
BYTECODE_DIR = ARTIFACTS_DIR / "artifacts"

def get_abi(contract_name):
    try:
        with open(ABI_DIR / f"{contract_name}.json", 'r') as file:
            return json.load(file)
    except Exception as error:
        print(f"❌ Could not find ABI for contract {contract_name}: {error}")
        raise error

def get_bytecode(contract_name):
    try:
        with open(BYTECODE_DIR / f"{contract_name}.bin", 'r') as file:
            bytecode = file.read().strip()
            return bytecode if bytecode.startswith('0x') else f"0x{bytecode}"
    except Exception as error:
        print(f"❌ Could not find bytecode for contract {contract_name}: {error}")
        raise error

def deploy(config):
    try:
        # Initialize Web3 with RPC URL and longer timeout
        web3 = Web3(Web3.HTTPProvider(
            config["rpc_url"],
            request_kwargs={'timeout': 120}
        ))

        if not config.get("private_key"):
            raise ValueError("PRIVATE_KEY is missing (set it in .env)")

        # Prepare account
        formatted_private_key = config["private_key"] if config["private_key"].startswith('0x') else f"0x{config['private_key']}"
        account = web3.eth.account.from_key(formatted_private_key)
        print(f"Deploying from address: {account.address}")

        chain_id = web3.eth.chain_id
        print(f"Chain ID: {chain_id}")

        # Load ABI and bytecode
        abi = get_abi('Storage')
        bytecode = get_bytecode('Storage')
        print(f"Bytecode length: {len(bytecode)}")

        # Create contract instance
        contract = web3.eth.contract(abi=abi, bytecode=bytecode)

        # Get current nonce (this will test the connection)
        print("Getting nonce...")
        nonce = web3.eth.get_transaction_count(account.address)
        print(f"Nonce: {nonce}")

        balance = web3.eth.get_balance(account.address)
        print(f"Balance: {balance}")

        # Estimate gas using the real constructor call (not raw bytecode only)
        print("Estimating gas...")
        gas_estimate = contract.constructor().estimate_gas({"from": account.address})
        gas_with_buffer = int(gas_estimate * 1.25)
        print(f"Estimated gas: {gas_estimate} (using {gas_with_buffer} with headroom)")

        # Build deployment transaction
        print("Building transaction...")
        construct_txn = contract.constructor().build_transaction({
            'from': account.address,
            'nonce': nonce,
            'chainId': chain_id,
            'gas': gas_with_buffer,
        })

        # Sign transaction
        print("Signing transaction...")
        signed_txn = web3.eth.account.sign_transaction(construct_txn, private_key=formatted_private_key)

        # Send transaction
        print("Sending transaction...")
        tx_hash = web3.eth.send_raw_transaction(signed_txn.raw_transaction)
        print(f"Transaction hash: {tx_hash.hex()}")

        # Wait for transaction receipt
        print("Waiting for transaction receipt...")
        tx_receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=300)
        contract_address = tx_receipt.contractAddress

        # Log results
        print(f"✅ Contract deployed at: {contract_address}")
        print(f"Gas used: {tx_receipt.gasUsed}")
        print(f"Block number: {tx_receipt.blockNumber}")

        return web3.eth.contract(address=contract_address, abi=abi)

    except Exception as error:
        print(f'❌ Deployment failed: {error}')
        raise error

if __name__ == "__main__":
    deployment_config = {
        "rpc_url": "https://services.polkadothub-rpc.com/testnet",
        "private_key": os.getenv("PRIVATE_KEY")
    }

    deploy(deployment_config)

