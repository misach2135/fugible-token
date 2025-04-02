// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./IERC20.sol";

contract TokenSwap {
    enum SwapStatus {
        NONE,
        PROPOSED,
        EXECUTED,
        CANCELLED
    }

    struct SwapProposal {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOut;
    }

    // address private _owner;

    // modifier onlyOwner {
    //   require(msg.sender == _owner, "Ownable: You are not the owner, Bye.");
    //   _;
    // }

    event Swap(
        SwapStatus status,
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    mapping(address initiator => SwapProposal proposition) public swapProposals;

    constructor() {
        // _owner = msg.sender;
    }

    function createSwapProposal(
        address _tokenIn,
        uint256 _amountIn,
        address _tokenOut,
        uint256 _amountOut
    ) public {
        require(
            _amountOut <=
                IERC20(_tokenOut).allowance(msg.sender, address(this)),
            "TokenSwap: Not enough allowance"
        );
        require(
            IERC20(_tokenOut).transferFrom(
                msg.sender,
                address(this),
                _amountOut
            ),
            "TokenSwap: Transfer failed"
        );
        swapProposals[msg.sender] = SwapProposal({
            tokenIn: _tokenIn,
            tokenOut: _tokenOut,
            amountIn: _amountIn,
            amountOut: _amountOut
        });

        emit Swap(
            SwapStatus.PROPOSED,
            msg.sender,
            swapProposals[msg.sender].tokenIn,
            swapProposals[msg.sender].tokenOut,
            swapProposals[msg.sender].amountIn,
            swapProposals[msg.sender].amountOut
        );
    }

    function getSwapProposal(
        address swapInitiator
    ) public view returns (SwapProposal memory) {
        return swapProposals[swapInitiator];
    }

    function cancelSwapProposal() public {
        SwapProposal memory proposal = swapProposals[msg.sender];

        require(
            proposal.amountIn > 0 && proposal.amountOut > 0,
            "TokenSwap: No swap proposal found"
        );
        require(
            IERC20(proposal.tokenOut).transfer(msg.sender, proposal.amountOut),
            "TokenSwap: Transfer failed"
        );

        emit Swap(
            SwapStatus.CANCELLED,
            msg.sender,
            proposal.tokenIn,
            proposal.tokenOut,
            proposal.amountIn,
            proposal.amountOut
        );
        delete swapProposals[msg.sender];
    }

    function swap(address swapInitiator) public {
        SwapProposal memory proposal = swapProposals[swapInitiator];
        // TODO: move to modifier
        require(
            proposal.amountIn > 0 && proposal.amountOut > 0,
            "TokenSwap: No swap proposal found"
        );
        require(
            IERC20(proposal.tokenIn).allowance(msg.sender, address(this)) >=
                proposal.amountIn,
            "TokenSwap: Not enough allowance"
        );
        
        require(
            IERC20(proposal.tokenIn).transferFrom(
                msg.sender,
                address(this),
                proposal.amountIn
            ),
            "TokenSwap: Transfer failed"
        );
        
        require(
            IERC20(proposal.tokenIn).transfer(
                swapInitiator,
                proposal.amountIn
            ),
            "TokenSwap: Transfer failed"
        );
        
        require(
            IERC20(proposal.tokenOut).transfer(msg.sender, proposal.amountOut),
            "TokenSwap: Transfer failed"
        );

        delete swapProposals[swapInitiator];

        emit Swap(
            SwapStatus.EXECUTED,
            msg.sender,
            proposal.tokenIn,
            proposal.tokenOut,
            proposal.amountIn,
            proposal.amountOut
        );
    }

    // receive() external payable {} // to receive ETH
}
