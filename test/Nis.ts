import { expect } from "chai";
import hre, { ethers }  from "hardhat";
import { NisERC20 } from "../typechain-types";
import { Signer } from "ethers";

import chai from "chai";
import chaiAsPromised from "chai-as-promised";


const TOKEN_NAME = "Nikita Isachenko Sergiyovich";
const TOKEN_SYMBOL = "NIS";
const TOKEN_DECIMALS = 10;

let minter: Signer;
let alice: Signer;
let bob: Signer;
let eve: Signer;

(async () => {
  [minter, alice, bob, eve] = await ethers.getSigners();
})();

const deployToken = async (signer: Signer) => {
  return await ethers.deployContract("NisERC20", [TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DECIMALS], signer);
};

chai.use(chaiAsPromised);

describe("deployment", () => {
  let token: NisERC20;

  before(async () => {
    token = await deployToken(minter);
  });

  it ("should set correct token data", async () => {
    expect(await token.name()).equal(TOKEN_NAME);
    expect(await token.symbol()).equal(TOKEN_SYMBOL);
    expect(await token.decimals()).equal(TOKEN_DECIMALS);
    expect(await token.minter()).equal(minter);
  });
})

describe("token minting and burning", () => {
  // Contract
  let token: NisERC20;
  
  before(async () => {
    token = await deployToken(minter);
  });

  it ("should mint only from minter account", async () => {
    expect(await token.minter()).to.equal(minter);
    expect(await token.connect(alice).mint(alice, 300_000).catch(() => undefined)).to.be.undefined;
  });

  it ("should mint correct amount", async () => {
    // Mint some amount of tokens to alice
    await token.connect(minter).mint(alice, 100_000);
    // Check, if her balance exactly as we expected
    expect(await token.balanceOf(alice)).to.equal(100_000);
    // Check total supply to be correct
    expect(await token.totalSupply()).to.equal(100_000);
    // Mint token to minter
    await token.connect(minter).mint(minter, 500_000);

    expect(await token.balanceOf(minter)).to.equal(500_000);
    expect(await token.totalSupply()).to.equal(600_000);
  });

  it ("should change the minter correctly", async () => {
    await token.connect(minter).change_minter(bob);
    expect(await token.minter()).to.equal(bob);
  });
});

describe("transfer tokens between accounts", async () => {
  let token: NisERC20;
  before(async () => {
    token = await deployToken(minter);
    await token.connect(minter).mint(alice, 500000);
  });

  it ("should be correct if transfer from alice to bob", async () => {
    await token.connect(alice).transfer(bob, 13042);
    expect(await token.balanceOf(bob)).to.equal(13042);
  });

  it ("should be correct if transfer from bob to bob", async () => {
    let oldBalance = await token.connect(bob).balanceOf(bob);
    await token.connect(bob).transfer(bob, 20);
    expect(await token.balanceOf(bob)).to.equal(oldBalance);
  });

  it ("should be reverted if balance is insufficient", async () => {
    expect(await token.connect(bob).transfer(bob, 1_000_000).catch(() => undefined)).to.be.undefined;
  });
});

describe("token allowance", async () => {
  let token: NisERC20;
  before(async () => {
    token = await deployToken(minter);
    await token.connect(minter).mint(alice, 100_000);
    await token.connect(alice).approve(eve, 1000);
  });

  it ("allowance should be set correct", async () => {
    expect(await token.allowance(alice, eve)).to.equal(1000);
  });

  it ("must be impossible to spend more alice tokens than it was allowed", async () => {
    expect(await token.connect(eve).transferFrom(alice, bob, 500_000).catch(() => undefined)).to.be.undefined;
  });

  it ("should be proccessed", async () => {
    await token.connect(eve).transferFrom(alice, bob, 800);
    await token.connect(eve).transferFrom(alice, eve, 200);
    expect(await token.balanceOf(bob)).be.equal(800);
    expect(await token.balanceOf(eve)).be.equal(200);
    expect(await token.allowance(alice, eve)).equal(0);
    expect(await token.balanceOf(alice)).be.equal(100_000 - 1000);
  });
});

describe("change color", async () => {
  let token: NisERC20;
  before(async () => {
    token = await deployToken(minter);
    await token.connect(minter).mint(eve, 100_000);
  });

  it ("should set default color after mint", async () => {
    expect((await token.connect(minter).balanceOfWithColor(alice)).amount).to.eq(0);
  });

  it ("should set color fee properly", async () => {

  });

  it ("should change color with burning tokens", async() => {
    await expect(token.setFavouriteColor(0xff55ff)).to.be.not.rejected;
  });

});

describe("burn tokens", async () => {
  let token: NisERC20;
  before(async () => {
    token = await deployToken(minter);
    await token.connect(minter).mint(eve, 100_000);
  });

  it("should decrease supply", async () => {
    expect(await token.totalSupply()).equal(100_000);
    await token.connect(eve).burn(50_000);
    expect(await token.totalSupply()).equal(50_000);
  });
});