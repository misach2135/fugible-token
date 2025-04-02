import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { NisERC20, TokenSwap } from "../typechain-types";
import { Signer, AddressLike, ZeroAddress } from "ethers";

import chai from "chai";
import chaiAsPromised from "chai-as-promised";

const TOKEN_A_NAME = "GoydaCoin";
const TOKEN_A_SYMBOL = "GOY";
const TOKEN_A_DECIMALS = 10;

const TOKEN_B_NAME = "TrubaCoin";
const TOKEN_B_SYMBOL = "TRB";
const TOKEN_B_DECIMALS = 10;

let token1: NisERC20;
let token2: NisERC20;
let swap: TokenSwap;

let swapAuthority: Signer;
let minter1: Signer;
let minter2: Signer;

let alice: Signer;
let bob: Signer;

(async () => {
  [minter1, minter2, swapAuthority, alice, bob] = await ethers.getSigners();
})();

const deployToken = async (
  signer: Signer,
  tokenName: string,
  tokenSymbol: string,
  tokenDecimals: number
) => {
  return await ethers.deployContract(
    "NisERC20",
    [tokenName, tokenSymbol, tokenDecimals],
    signer
  );
};

const deploySwap = async (
  signer: Signer,
) => {
  return await ethers.deployContract(
    "TokenSwap",
    [],
    signer
  );
};

describe("Token Exchange", () => {
  beforeEach(async () => {
    token1 = await deployToken(
      minter1,
      TOKEN_A_NAME,
      TOKEN_A_SYMBOL,
      TOKEN_A_DECIMALS
    );
    token2 = await deployToken(
      minter2,
      TOKEN_B_NAME,
      TOKEN_B_SYMBOL,
      TOKEN_B_DECIMALS
    );
  });

  describe("Token Swap Setup", () => {
    it("should deploy swap correctly", async () => {
      swap = await deploySwap(swapAuthority);
    });
  });

  describe("Swap proposal creation", () => {
    beforeEach(async () => {
      swap = await deploySwap(swapAuthority);
    });

    it ("should create swap proposals correctly", async () => {
      await token1.connect(minter1).mint(alice.getAddress(), 1000n);
      await token2.connect(minter2).mint(bob.getAddress(), 2000n);

      expect(await token1.balanceOf(alice.getAddress())).to.equal(1000n);
      expect(await token2.balanceOf(bob.getAddress())).to.equal(2000n);

      await token1.connect(alice).approve(await swap.getAddress(), 1000n);
      await token2.connect(bob).approve(await swap.getAddress(), 2000n);

      expect(await token1.allowance(await alice.getAddress(), await swap.getAddress())).to.equal(1000n);
      expect(await token2.allowance(await bob.getAddress(), await swap.getAddress())).to.equal(2000n);

      const proposal = await swap
        .connect(alice)
        .createSwapProposal(
          token2.getAddress(),
          100n,
          token1.getAddress(),
          50n,
        );

      expect((await swap.getSwapProposal(alice)).amountIn).to.equal(100n);
      expect((await swap.getSwapProposal(alice)).amountOut).to.equal(50n);
    });

  });

  describe("Token swap", () => {
    beforeEach(async () => {
      swap = await deploySwap(swapAuthority);
      await token1.connect(minter1).mint(alice.getAddress(), 1000n);
      await token2.connect(minter2).mint(bob.getAddress(), 2000n);
      
      expect(await token1.balanceOf(await alice.getAddress())).to.equal(1000n);
      expect(await token2.balanceOf(await bob.getAddress())).to.equal(2000n);
      
      await token1.connect(alice).approve(swap.getAddress(), 500n);
      await token2.connect(bob).approve(swap.getAddress(), 1000n);
      
      let token1AliceBalanceOld = await token1.balanceOf(alice.getAddress());
      await swap.connect(alice).createSwapProposal(
        token2.getAddress(),
        1000n,
        token1.getAddress(),
        500n,
      );

      let token1AliceBalanceNew = await token1.balanceOf(alice.getAddress());
      expect((await swap.getSwapProposal(alice)).amountOut).to.equal(500n);
      expect((await swap.getSwapProposal(alice)).amountIn).to.equal(1000n);
      expect(token1AliceBalanceNew).to.equal(token1AliceBalanceOld - 500n);
    });

    it("should swap tokens correctly", async () => {
      let tokenOutAlice = (await swap.getSwapProposal(alice)).amountOut;
      let tokenInAlice = (await swap.getSwapProposal(alice)).amountIn;
      let token2AliceBalanceOld = await token2.balanceOf(alice.getAddress());
      let token1BobBalanceOld = await token1.balanceOf(bob.getAddress());
      let token2BobBalanceOld = await token2.balanceOf(bob.getAddress());

      expect(token2AliceBalanceOld).to.equal(0n);
      expect(token1BobBalanceOld).to.equal(0n);
      expect(token2BobBalanceOld).to.equal(2000n);

      await expect(swap.connect(bob).swap(alice)).to.not.be.rejected;

      let token2AliceBalanceNew = await token2.balanceOf(alice.getAddress());
      let token1BobBalanceNew = await token1.balanceOf(bob.getAddress());
      let token2BobBalanceNew = await token2.balanceOf(bob.getAddress());
      
      expect(token2BobBalanceNew).to.equal(token2BobBalanceOld - tokenInAlice);
      expect(token2AliceBalanceNew).to.equal(tokenInAlice);
      expect(token1BobBalanceNew).to.equal(tokenOutAlice);

      expect((await swap.getSwapProposal(alice)).tokenIn).to.equal(ZeroAddress);
      expect((await swap.getSwapProposal(alice)).tokenOut).to.equal(ZeroAddress);
      expect((await swap.getSwapProposal(alice)).amountIn).to.equal(0n);
      expect((await swap.getSwapProposal(alice)).amountOut).to.equal(0n);
    });
      
  });
});
