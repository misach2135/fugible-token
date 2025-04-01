// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;


contract NisERC20 {
    // General info about token
    string private _name;
    string private _symbol;
    uint8 private _decimals;

    // Mint authority
    address private _minter;
    uint256 private _changeColorCostFee;

    uint256 private _total_supply;
    mapping(address => uint256) private _balances;
    mapping(address => uint32) private _favouriteColors;
    mapping(address => mapping(address => uint256)) private _allowaces;

    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);

    constructor(string memory name_, string memory symbol_, uint8 decimals_) {
        _name = name_;
        _symbol = symbol_;
        _decimals = decimals_;
        // Set the address of mint authority(im kinda freak, because i grabbed it from solana))
        _minter = msg.sender;
        _changeColorCostFee = 0;
    }

    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function decimals() public view returns (uint8) {
        return _decimals;
    }

    function minter() public view returns (address minter_) {
        return _minter;
    }

    function balanceOf(address owner) public view returns (uint256 amount) {
        return _balances[owner];
    }

    function balanceOfWithColor(address owner) public view returns (uint32 color, uint256 amount ) {
        return (_favouriteColors[owner], _balances[owner]);
    }

    function totalSupply() public view returns (uint256) {
        return _total_supply;
    }

    function change_minter(address newMinter) public returns (bool success) {
        require(msg.sender == _minter, "Only minter can change minter");
        _minter = newMinter;
        return true;
    }

    function mint(address to, uint256 amount) public returns (bool success) {
        require(msg.sender == _minter, "Only minter can mint");
        
        _balances[to] += amount;
        _total_supply += amount;
        _favouriteColors[to] = 0;

        return true;
    }

    function burn(uint256 amount) public returns (bool success) {
        require(_balances[msg.sender] >= amount, "Trying to burn more than youv have.");
        _balances[msg.sender] -= amount;
        _total_supply -= amount;
        return true;
    }

    function transfer(address to, uint256 amount) public returns (bool success) {
        require(_balances[msg.sender] >= amount, "Insufficent balance");

        _balances[msg.sender] -= amount;
        _balances[to] += amount;

        emit Transfer(msg.sender, to, amount);

        return true;
    }

    function transferFrom(address from, address to, uint256 value) public returns (bool success) {
        require(_allowaces[from][msg.sender] >= value, "Insufficent allowance balance");

        _balances[to] += value;
        _allowaces[from][msg.sender] -= value;

        return true;
    }

    function approve(address spender, uint256 value) public returns (bool success) {
        require(_balances[msg.sender] >= value, "Insufficent balance");
        _balances[msg.sender] -= value;
        _allowaces[msg.sender][spender] += value;
        return true;
    }

    function revertApprove(address spender, uint256 value) public returns (bool success) {
        require(_allowaces[msg.sender][spender] >= value, "Insufficient allowance");
        _allowaces[msg.sender][spender] -= value;
        _balances[msg.sender] += value;
        return true;
    }

    function allowance(address owner, address spender) public view returns (uint256 remaining) {
        return _allowaces[owner][spender];
    }

    function setColorChangingFee(uint256 fee) public returns (bool status) {
        require(msg.sender == _minter, "Only minter can set color changing fee");
        _changeColorCostFee = fee;

        return true;
    }

    function setFavouriteColor(uint32 color) public returns(bool status) {
        require(_balances[msg.sender] >= _changeColorCostFee, "Not enogh tokens to change the favourite token color");
        require(color <= 0xffffff, "Incorrect color format");
        burn(_changeColorCostFee);

        _favouriteColors[msg.sender] = color;

        return true;
    }
}
