import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { NisERC20, TokenSwap } from "../typechain-types";
import { Signer, AddressLike } from "ethers";

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
  tokenA: AddressLike,
  tokenB: AddressLike,
  rateAtoB: bigint,
  rateBtoA: bigint
) => {
  return await ethers.deployContract(
    "TokenSwap",
    [tokenA, tokenB, rateAtoB, rateBtoA],
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
      swap = await deploySwap(
        swapAuthority,
        token1.getAddress(),
        await token2.getAddress(),
        100n,
        200n
      );
      expect(await swap.rateAtoB()).to.equal(100n);
      expect(await swap.rateBtoA()).to.equal(200n);
      expect(await swap.tokenA()).to.equal(await token1.getAddress());
      expect(await swap.tokenB()).to.equal(await token2.getAddress());
    });
  });

  describe("Token swap", () => {
    beforeEach(async () => {
      swap = await deploySwap(
        swapAuthority,
        token1.getAddress(),
        token2.getAddress(),
        100n,
        200n
      );
    });

    it("should swap tokens correctly", async () => {
      await token1.connect(minter1).mint(alice.getAddress(), 1000n);
      await token2.connect(minter2).mint(bob.getAddress(), 2000n);

      await token1.connect(alice).approve(swap.getAddress(), 1000n);
      await token2.connect(bob).approve(swap.getAddress(), 2000n);

      const aliceBalanceBefore = await token1.balanceOf(await alice.getAddress());
      const bobBalanceBefore = await token2.balanceOf(await bob.getAddress());

      await swap
        .connect(alice)
        .swapAtoB(100n);
      await swap
        .connect(bob)
        .swapBtoA(200n);

      const aliceBalanceAfter = await token1.balanceOf(alice.getAddress());
      const bobBalanceAfter = await token2.balanceOf(bob.getAddress());

      expect(aliceBalanceAfter - aliceBalanceBefore).to.equal(100n);
      expect(bobBalanceAfter - bobBalanceBefore).to.equal(200n);
    });
  });
});
