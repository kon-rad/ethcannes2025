interface WorldcoinPriceResponse {
  result: {
    prices: {
      WLD: {
        USD: {
          asset: string;
          amount: string;
          decimals: number;
          symbol: string;
        };
      };
    };
  };
}

/**
 * Fetches the current WLD price in USD from Worldcoin's price API
 */
export async function getWLDPriceInUSD(): Promise<number> {
  try {
    const response = await fetch(
      'https://app-backend.worldcoin.dev/public/v1/miniapps/prices?cryptoCurrencies=WLD&fiatCurrencies=USD'
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch WLD price');
    }
    
    const data: WorldcoinPriceResponse = await response.json();
    const wldPriceData = data.result.prices.WLD.USD;
    
    // Calculate the actual price: amount * 10^(-decimals)
    const price = parseInt(wldPriceData.amount) * Math.pow(10, -wldPriceData.decimals);
    
    return price;
  } catch (error) {
    console.error('Error fetching WLD price:', error);
    // Fallback to a reasonable default if API fails
    return 1.5; // Approximate WLD price as fallback
  }
}

/**
 * Converts USD amount to WLD based on current price
 */
export async function usdToWLD(usdAmount: number): Promise<number> {
  const wldPrice = await getWLDPriceInUSD();
  return usdAmount / wldPrice;
}

/**
 * Gets the WLD equivalent of $0.01 USD for exclusive content pricing
 */
export async function getDefaultExclusiveContentPrice(): Promise<number> {
  return await usdToWLD(0.01);
}

/**
 * Gets the WLD equivalent of $0.001 USD for chat pricing
 */
export async function getDefaultChatPrice(): Promise<number> {
  return await usdToWLD(0.001);
}

/**
 * Gets the WLD equivalent of $0.01 USD for voice pricing
 */
export async function getDefaultVoicePrice(): Promise<number> {
  return await usdToWLD(0.01);
}

/**
 * Gets the WLD equivalent of $0.05 USD for brand promotion pricing
 */
export async function getDefaultBrandPromoPrice(): Promise<number> {
  return await usdToWLD(0.05);
} 