import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CharacterPaymentRouterModule", (m) => {
  // Platform address - this should be the address that receives platform fees
  const platformAddress = "0x0000000000000000000000000000000000000000"; // Replace with actual platform address
  
  // Platform fee percentage (15%)
  const platformFeePercent = 15n;
  
  // Deploy the CharacterPaymentRouter contract
  const characterPaymentRouter = m.contract("CharacterPaymentRouter", [
    "0x0000000000000000000000000000000000000000", // creator address (will be set per character)
    platformAddress,
    platformFeePercent
  ]);

  return { characterPaymentRouter };
}); 