// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Storage {
    uint256 public storedNumber;
    event NumberStored(uint256 newNumber);

    function setNumber(uint256 fibNumber) public {
        storedNumber = fibonacci(fibNumber);
        emit NumberStored(storedNumber);
    }

    function fibonacci(uint256 n) public pure returns (uint256) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
}
