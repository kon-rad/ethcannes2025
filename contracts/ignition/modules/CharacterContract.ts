import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CharacterContractModule", (m) => {
  // Deploy CharacterContract
  const characterContract = m.contract("CharacterContract", [
    "0x0000000000000000000000000000000000000000", // characterOwner - will be set during deployment
    "0x0000000000000000000000000000000000000000", // platform - will be set during deployment
    15, // platformFeePercent (15%)
    0, // consultationCallPricePerMinute (0 for free)
    "1000000000000000000", // sponsorshipReelPrice (1 ETH in wei)
  ]);

  return { characterContract };
}); 