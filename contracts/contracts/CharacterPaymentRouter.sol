// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CharacterPaymentRouter
 * @dev Handles payments for AI character services with platform fee collection
 */
contract CharacterPaymentRouter is Ownable, ReentrancyGuard {
    address public creator;
    address public platform;
    uint256 public platformFeePercent; // e.g., 15 for 15%
    
    struct ServicePrice {
        uint256 exclusiveContentAccess;
        uint256 chatPerMessage;
        uint256 voicePerMinute;
        uint256 brandPromo;
    }
    
    mapping(string => ServicePrice) public servicePrices; // character name => prices
    mapping(address => uint256) public creatorEarnings;
    
    event ServicePriceSet(string characterName, string service, uint256 price);
    event PaymentReceived(string characterName, string service, address payer, uint256 amount, uint256 creatorAmount, uint256 platformFee);
    event EarningsWithdrawn(address creator, uint256 amount);
    
    constructor(
        address _creator,
        address _platform,
        uint256 _platformFeePercent
    ) Ownable(msg.sender) {
        require(_creator != address(0), "Invalid creator address");
        require(_platform != address(0), "Invalid platform address");
        require(_platformFeePercent <= 50, "Platform fee too high");
        
        creator = _creator;
        platform = _platform;
        platformFeePercent = _platformFeePercent;
    }
    
    /**
     * @dev Set service prices for a character
     * @param characterName Name of the AI character
     * @param exclusiveContentAccess Price for exclusive content access
     * @param chatPerMessage Price per chat message
     * @param voicePerMinute Price per minute for voice calls
     * @param brandPromo Price for brand promotions
     */
    function setServicePrices(
        string memory characterName,
        uint256 exclusiveContentAccess,
        uint256 chatPerMessage,
        uint256 voicePerMinute,
        uint256 brandPromo
    ) external onlyOwner {
        servicePrices[characterName] = ServicePrice({
            exclusiveContentAccess: exclusiveContentAccess,
            chatPerMessage: chatPerMessage,
            voicePerMinute: voicePerMinute,
            brandPromo: brandPromo
        });
        
        emit ServicePriceSet(characterName, "exclusiveContentAccess", exclusiveContentAccess);
        emit ServicePriceSet(characterName, "chatPerMessage", chatPerMessage);
        emit ServicePriceSet(characterName, "voicePerMinute", voicePerMinute);
        emit ServicePriceSet(characterName, "brandPromo", brandPromo);
    }
    
    /**
     * @dev Pay for a specific service
     * @param characterName Name of the AI character
     * @param service Service type (exclusiveContentAccess, chatPerMessage, voicePerMinute, brandPromo)
     */
    function payForService(string memory characterName, string memory service) 
        external 
        payable 
        nonReentrant 
    {
        require(msg.value > 0, "Payment amount must be greater than 0");
        
        ServicePrice memory prices = servicePrices[characterName];
        uint256 requiredAmount = 0;
        
        if (keccak256(bytes(service)) == keccak256(bytes("exclusiveContentAccess"))) {
            requiredAmount = prices.exclusiveContentAccess;
        } else if (keccak256(bytes(service)) == keccak256(bytes("chatPerMessage"))) {
            requiredAmount = prices.chatPerMessage;
        } else if (keccak256(bytes(service)) == keccak256(bytes("voicePerMinute"))) {
            requiredAmount = prices.voicePerMinute;
        } else if (keccak256(bytes(service)) == keccak256(bytes("brandPromo"))) {
            requiredAmount = prices.brandPromo;
        } else {
            revert("Invalid service type");
        }
        
        require(msg.value >= requiredAmount, "Insufficient payment amount");
        
        // Calculate fee distribution
        uint256 platformFee = (msg.value * platformFeePercent) / 100;
        uint256 creatorAmount = msg.value - platformFee;
        
        // Transfer platform fee
        (bool platformSuccess, ) = platform.call{value: platformFee}("");
        require(platformSuccess, "Platform fee transfer failed");
        
        // Add to creator earnings
        creatorEarnings[creator] += creatorAmount;
        
        emit PaymentReceived(characterName, service, msg.sender, msg.value, creatorAmount, platformFee);
    }
    
    /**
     * @dev Allow creator to withdraw their earnings
     */
    function withdraw() external nonReentrant {
        require(msg.sender == creator, "Only creator can withdraw");
        require(creatorEarnings[creator] > 0, "No earnings to withdraw");
        
        uint256 amount = creatorEarnings[creator];
        creatorEarnings[creator] = 0;
        
        (bool success, ) = creator.call{value: amount}("");
        require(success, "Withdrawal failed");
        
        emit EarningsWithdrawn(creator, amount);
    }
    
    /**
     * @dev Get service prices for a character
     * @param characterName Name of the AI character
     * @return ServicePrice struct with all prices
     */
    function getServicePrices(string memory characterName) 
        external 
        view 
        returns (ServicePrice memory) 
    {
        return servicePrices[characterName];
    }
    
    /**
     * @dev Get creator's current earnings
     * @return Current earnings balance
     */
    function getCreatorEarnings() external view returns (uint256) {
        return creatorEarnings[creator];
    }
    
    /**
     * @dev Update platform fee percentage (only owner)
     * @param newFeePercent New platform fee percentage
     */
    function updatePlatformFee(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= 50, "Platform fee too high");
        platformFeePercent = newFeePercent;
    }
    
    /**
     * @dev Update platform address (only owner)
     * @param newPlatform New platform address
     */
    function updatePlatform(address newPlatform) external onlyOwner {
        require(newPlatform != address(0), "Invalid platform address");
        platform = newPlatform;
    }
    
    // Allow contract to receive ETH
    receive() external payable {}
} 