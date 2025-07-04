// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CharacterContract
 * @dev Smart contract for individual AI character payments
 * Handles consultation calls and sponsorship reels with configurable pricing
 */
contract CharacterContract is Ownable, ReentrancyGuard {
    address public characterOwner;
    address public platform;
    uint256 public platformFeePercent; // e.g., 15 for 15%
    
    // Pricing in wei
    uint256 public consultationCallPricePerMinute; // 0 for free
    uint256 public sponsorshipReelPrice;
    
    // Access tracking
    mapping(address => uint256) public consultationCallMinutes; // minutes purchased
    mapping(address => uint256) public sponsorshipReelAccess; // timestamp of access
    mapping(address => uint256) public userPayments; // total payments made
    
    // Owner earnings
    uint256 public ownerEarnings;
    
    event ConsultationCallPurchased(address user, uint256 minutes, uint256 totalCost);
    event SponsorshipReelPurchased(address user, uint256 cost);
    event ConsultationCallUsed(address user, uint256 minutesUsed, uint256 remainingMinutes);
    event SponsorshipReelAccessGranted(address user, uint256 accessUntil);
    event PriceUpdated(string service, uint256 newPrice);
    event EarningsWithdrawn(address owner, uint256 amount);
    
    constructor(
        address _characterOwner,
        address _platform,
        uint256 _platformFeePercent,
        uint256 _consultationCallPricePerMinute,
        uint256 _sponsorshipReelPrice
    ) Ownable(msg.sender) {
        require(_characterOwner != address(0), "Invalid owner address");
        require(_platform != address(0), "Invalid platform address");
        require(_platformFeePercent <= 50, "Platform fee too high");
        
        characterOwner = _characterOwner;
        platform = _platform;
        platformFeePercent = _platformFeePercent;
        consultationCallPricePerMinute = _consultationCallPricePerMinute;
        sponsorshipReelPrice = _sponsorshipReelPrice;
    }
    
    /**
     * @dev Purchase consultation call minutes
     * @param minutes Number of minutes to purchase
     */
    function purchaseConsultationCall(uint256 minutes) 
        external 
        payable 
        nonReentrant 
    {
        require(minutes > 0, "Minutes must be greater than 0");
        require(consultationCallPricePerMinute > 0, "Consultation calls are free");
        
        uint256 totalCost = minutes * consultationCallPricePerMinute;
        require(msg.value >= totalCost, "Insufficient payment");
        
        // Calculate fee distribution
        uint256 platformFee = (msg.value * platformFeePercent) / 100;
        uint256 ownerAmount = msg.value - platformFee;
        
        // Transfer platform fee
        (bool platformSuccess, ) = platform.call{value: platformFee}("");
        require(platformSuccess, "Platform fee transfer failed");
        
        // Add to owner earnings
        ownerEarnings += ownerAmount;
        
        // Add minutes to user's balance
        consultationCallMinutes[msg.sender] += minutes;
        userPayments[msg.sender] += msg.value;
        
        emit ConsultationCallPurchased(msg.sender, minutes, msg.value);
    }
    
    /**
     * @dev Purchase sponsorship reel access
     */
    function purchaseSponsorshipReel() 
        external 
        payable 
        nonReentrant 
    {
        require(sponsorshipReelPrice > 0, "Sponsorship reels not available");
        require(msg.value >= sponsorshipReelPrice, "Insufficient payment");
        
        // Calculate fee distribution
        uint256 platformFee = (msg.value * platformFeePercent) / 100;
        uint256 ownerAmount = msg.value - platformFee;
        
        // Transfer platform fee
        (bool platformSuccess, ) = platform.call{value: platformFee}("");
        require(platformSuccess, "Platform fee transfer failed");
        
        // Add to owner earnings
        ownerEarnings += ownerAmount;
        
        // Grant access for 30 days
        sponsorshipReelAccess[msg.sender] = block.timestamp + 30 days;
        userPayments[msg.sender] += msg.value;
        
        emit SponsorshipReelPurchased(msg.sender, msg.value);
        emit SponsorshipReelAccessGranted(msg.sender, sponsorshipReelAccess[msg.sender]);
    }
    
    /**
     * @dev Use consultation call minutes (called by owner or authorized service)
     * @param user User address
     * @param minutesUsed Minutes to deduct
     */
    function useConsultationCall(address user, uint256 minutesUsed) 
        external 
        onlyOwner 
    {
        require(consultationCallMinutes[user] >= minutesUsed, "Insufficient minutes");
        
        consultationCallMinutes[user] -= minutesUsed;
        
        emit ConsultationCallUsed(user, minutesUsed, consultationCallMinutes[user]);
    }
    
    /**
     * @dev Check if user has consultation call access
     * @param user User address
     * @return minutes Available minutes
     */
    function getConsultationCallMinutes(address user) external view returns (uint256) {
        return consultationCallMinutes[user];
    }
    
    /**
     * @dev Check if user has sponsorship reel access
     * @param user User address
     * @return hasAccess Whether user has access
     * @return accessUntil Timestamp until access expires
     */
    function getSponsorshipReelAccess(address user) 
        external 
        view 
        returns (bool hasAccess, uint256 accessUntil) 
    {
        hasAccess = sponsorshipReelAccess[user] > block.timestamp;
        accessUntil = sponsorshipReelAccess[user];
    }
    
    /**
     * @dev Update consultation call price (only owner)
     * @param newPrice New price per minute in wei
     */
    function updateConsultationCallPrice(uint256 newPrice) external onlyOwner {
        consultationCallPricePerMinute = newPrice;
        emit PriceUpdated("consultationCall", newPrice);
    }
    
    /**
     * @dev Update sponsorship reel price (only owner)
     * @param newPrice New price in wei
     */
    function updateSponsorshipReelPrice(uint256 newPrice) external onlyOwner {
        sponsorshipReelPrice = newPrice;
        emit PriceUpdated("sponsorshipReel", newPrice);
    }
    
    /**
     * @dev Allow owner to withdraw earnings
     */
    function withdrawEarnings() external nonReentrant {
        require(msg.sender == characterOwner, "Only character owner can withdraw");
        require(ownerEarnings > 0, "No earnings to withdraw");
        
        uint256 amount = ownerEarnings;
        ownerEarnings = 0;
        
        (bool success, ) = characterOwner.call{value: amount}("");
        require(success, "Withdrawal failed");
        
        emit EarningsWithdrawn(characterOwner, amount);
    }
    
    /**
     * @dev Get contract pricing information
     * @return consultationPrice Consultation call price per minute
     * @return sponsorshipPrice Sponsorship reel price
     */
    function getPricing() 
        external 
        view 
        returns (
            uint256 consultationPrice,
            uint256 sponsorshipPrice
        ) 
    {
        return (
            consultationCallPricePerMinute,
            sponsorshipReelPrice
        );
    }
    
    /**
     * @dev Get user's payment history
     * @param user User address
     * @return totalPayments Total amount paid
     */
    function getUserPayments(address user) external view returns (uint256) {
        return userPayments[user];
    }
    
    /**
     * @dev Get owner's current earnings
     * @return Current earnings balance
     */
    function getOwnerEarnings() external view returns (uint256) {
        return ownerEarnings;
    }
    
    // Allow contract to receive ETH
    receive() external payable {}
} 