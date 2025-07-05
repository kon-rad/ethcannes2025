import { prisma } from '@/lib/prisma';
import { tavily } from '@tavily/core';

interface TavilySearchOptions {
  query: string;
  search_depth?: 'basic' | 'advanced';
  max_results?: number;
  include_domains?: string[];
  exclude_domains?: string[];
  include_answer?: boolean;
}

interface TavilySearchResponse {
  query: string;
  answer?: string;
  results: Array<{
    url: string;
    content: string;
    title: string;
    score: number;
  }>;
}

export class TavilySearchService {
  private client: any;

  constructor() {
    try {
      if (!process.env.TAVILY_API_KEY) {
        console.error('TAVILY_API_KEY is not set in environment variables');
        console.error('Please add TAVILY_API_KEY to your .env.local file');
        throw new Error('TAVILY_API_KEY is not set in environment variables');
      }
      
      console.log('Initializing Tavily client with API key:', 
                 process.env.TAVILY_API_KEY ? `${process.env.TAVILY_API_KEY.substring(0, 5)}...` : 'undefined');
      
      // 正確初始化 Tavily 客戶端
      this.client = tavily({ apiKey: process.env.TAVILY_API_KEY });
      console.log('Tavily client initialized successfully');
    } catch (error) {
      console.error('Error initializing Tavily client:', error);
      throw error;
    }
  }

  /**
   * Perform a search query using Tavily API
   */
  async search(options: TavilySearchOptions): Promise<TavilySearchResponse> {
    try {
      console.log('Tavily Search Service - Query:', options.query);
      console.log('Using Tavily client with methods:', Object.keys(this.client));

      // 正確調用方式：直接傳入查詢字串作為第一個參數
      const response = await this.client.search(options.query);
      
      console.log('Tavily Search Service - Response received');
      
      return response;
    } catch (error) {
      console.error('Tavily Search Error - Full Details:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        name: error instanceof Error ? error.name : 'Unknown error type',
        client: this.client ? 'Client initialized' : 'Client not initialized',
        apiKey: process.env.TAVILY_API_KEY ? `${process.env.TAVILY_API_KEY.substring(0, 5)}...` : 'undefined'
      });
      throw error; // 透傳原始錯誤，保留完整錯誤信息
    }
  }

  /**
   * Save search results to the current_state table in the database
   */
  async saveSearchResults(userId: string, characterId: string, searchResponse: TavilySearchResponse): Promise<void> {
    try {
      // Format the results as a readable text string
      let formattedContent = `Search Query: ${searchResponse.query}\n\n`;
      
      if (searchResponse.answer) {
        formattedContent += `Answer: ${searchResponse.answer}\n\n`;
      }
      
      formattedContent += 'Search Results:\n';
      
      searchResponse.results.forEach((result, index) => {
        formattedContent += `\n[${index + 1}] ${result.title}\n`;
        formattedContent += `URL: ${result.url}\n`;
        formattedContent += `${result.content}\n`;
      });

      // Save to the current_state table
      await prisma.currentState.upsert({
        where: {
          userId_characterId: {
            userId,
            characterId
          }
        },
        update: {
          searchResults: formattedContent,
          updatedAt: new Date()
        },
        create: {
          userId,
          characterId,
          searchResults: formattedContent,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log('Search results saved to current_state table');
    } catch (error) {
      console.error('Error saving search results:', error);
      throw error; // 透傳原始錯誤
    }
  }

  /**
   * Get the latest search results from the current_state table
   */
  async getLatestSearchResults(userId: string, characterId: string): Promise<string | null> {
    try {
      const state = await prisma.currentState.findUnique({
        where: {
          userId_characterId: {
            userId,
            characterId
          }
        }
      });

      return state?.searchResults || null;
    } catch (error) {
      console.error('Error retrieving search results:', error);
      throw error; // 透傳原始錯誤
    }
  }

  /**
   * Perform a search and save the results in one operation
   */
  async searchAndSave(options: TavilySearchOptions, userId: string, characterId: string): Promise<string> {
    try {
      const searchResponse = await this.search(options);
      await this.saveSearchResults(userId, characterId, searchResponse);
      
      // Return formatted content for immediate use
      let formattedContent = '';
      
      if (searchResponse.answer) {
        formattedContent += searchResponse.answer + '\n\n';
      }
      
      searchResponse.results.forEach((result) => {
        formattedContent += `${result.content}\n\n`;
      });

      return formattedContent.trim();
    } catch (error) {
      console.error('Error in searchAndSave:', error);
      throw error; // 透傳原始錯誤
    }
  }
}

// Export a singleton instance
export const tavilySearchService = new TavilySearchService(); 