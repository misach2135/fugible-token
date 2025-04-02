// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./IERC20.sol";

contract TokenSwap {
    address private _owner;

    modifier onlyOwner {
      require(msg.sender == _owner, "Ownable: You are not the owner, Bye.");
      _;
    }

    IERC20 public tokenA;
    IERC20 public tokenB;

    uint256 public rateAtoB; // Rate: tokenA to tokenB, e.g., 1 tokenA = rateAtoB tokenB
    uint256 public rateBtoA; // Rate: tokenB to tokenA

    event Swap(address indexed user, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);

    constructor(address _tokenA, address _tokenB, uint256 _rateAtoB, uint256 _rateBtoA) {
        _owner = msg.sender;
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
        rateAtoB = _rateAtoB;
        rateBtoA = _rateBtoA;
    }

    function setRateAtoB(uint256 _rate) public onlyOwner {
        require(_rate > 0, "Rate must be greater than 0");
        rateAtoB = _rate;
    }

    function setRateBtoA(uint256 _rate) public onlyOwner {
        require(_rate > 0, "Rate must be greater than 0");
        rateBtoA = _rate;
    }

    function swapAtoB(uint256 _amountA) public {
        require(_amountA > 0, "Amount must be greater than 0");

        require(tokenA.allowance(msg.sender, address(this)) >= _amountA, "Allowance too low");
        require(tokenA.transferFrom(msg.sender, address(this), _amountA), "Transfer failed");

        uint256 amountB = _amountA * rateAtoB;

        require(tokenB.balanceOf(address(this)) >= amountB, "Insufficient tokenB balance in contract");
        require(tokenB.transfer(msg.sender, amountB), "Transfer failed");

        emit Swap(msg.sender, address(tokenA), address(tokenB), _amountA, amountB);
    }

    function swapBtoA(uint256 _amountB) public {
        require(_amountB > 0, "Amount must be greater than 0");

        require(tokenB.allowance(msg.sender, address(this)) >= _amountB, "Allowance too low");
        require(tokenB.transferFrom(msg.sender, address(this), _amountB), "Transfer failed");

        uint256 amountA = _amountB * rateBtoA;

        require(tokenA.balanceOf(address(this)) >= amountA, "Insufficient tokenA balance in contract");
        require(tokenA.transfer(msg.sender, amountA), "Transfer failed");

        emit Swap(msg.sender, address(tokenB), address(tokenA), _amountB, amountA);
    }

    // Function to allow users to add tokens to the contract
    function addTokenA(uint256 _amount) public {
        require(_amount > 0, "Amount must be greater than 0");
        require(tokenA.transferFrom(msg.sender, address(this), _amount), "Transfer failed");
    }

    function addTokenB(uint256 _amount) public {
        require(_amount > 0, "Amount must be greater than 0");
        require(tokenB.transferFrom(msg.sender, address(this), _amount), "Transfer failed");
    }

    // Function to allow the owner to withdraw leftover tokens.
    function withdrawTokenA(uint256 _amount) public onlyOwner {
        require(_amount <= tokenA.balanceOf(address(this)), "Insufficient balance");
        require(tokenA.transfer(_owner, _amount), "Transfer failed");
    }

    function withdrawTokenB(uint256 _amount) public onlyOwner {
        require(_amount <= tokenB.balanceOf(address(this)), "Insufficient balance");
        require(tokenB.transfer(_owner, _amount), "Transfer failed");
    }

    // receive() external payable {} // to receive ETH
}