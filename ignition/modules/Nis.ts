// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("NikitaIsachenkoToken", (m) => {
  const token = m.contract("NisERC20", [
    "Nikita Isachenko Sergiyovich",
    "NIS",
    10,
  ]);

  return { token };
});

