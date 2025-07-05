import { prisma } from '@/lib/prisma';
import { summarizeWithAI } from './aiService';

interface SummaryRequest {
  characterId: string;
  userId: string;
  topicCount?: number;
  format?: 'list' | 'json';
}

interface SummaryResponse {
  topics: string[];
  raw: string;
}

export class SummaryGenerationService {
  /**
   * 根据当前状态数据生成主题摘要
   */
  async generateTopicSummary({
    characterId,
    userId,
    topicCount = 5,
    format = 'list'
  }: SummaryRequest): Promise<SummaryResponse> {
    try {
      console.log('Generating topic summary', { characterId, userId, topicCount });

      // 获取角色信息
      const character = await prisma.aICharacter.findUnique({
        where: { id: characterId }
      });

      if (!character) {
        throw new Error('Character not found');
      }

      // 获取当前状态数据
      const currentState = await prisma.currentState.findUnique({
        where: {
          userId_characterId: {
            userId,
            characterId
          }
        }
      });

      if (!currentState?.searchResults) {
        throw new Error('No search results found in current state');
      }

      // 为AI提供的系统提示
      const systemPrompt = `You are a professional content strategist helping ${character.name} create engaging content.
Based on the search results data provided, generate ${topicCount} engaging and specific content topic ideas.
Each topic should be concise but descriptive enough to guide content creation.
Focus on topics that would be interesting to an audience interested in ${character.description}.`;

      // 为AI提供的用户消息
      const userMessage = `
Here is the search data to analyze:

${currentState.searchResults}

Based on this information, generate ${topicCount} content topic ideas for ${character.name}.
${format === 'json' ? 'Format the response as a valid JSON array of strings.' : 'Format each topic as a numbered list item.'}
Make the topics specific, actionable, and interesting to the target audience.
`;

      // 使用AI生成摘要
      const summaryResponse = await summarizeWithAI({
        systemPrompt,
        userMessage,
        modelName: 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo'
      });

      // 解析返回的主题
      let topics: string[];
      
      if (format === 'json') {
        try {
          // 尝试解析JSON格式的响应
          topics = JSON.parse(summaryResponse);
          if (!Array.isArray(topics)) {
            // 如果不是数组，尝试提取数组部分
            const arrayPattern = /\[([\s\S]*)\]/; // 使用[\s\S]*代替.s标志以兼容更多环境
            const match = summaryResponse.match(arrayPattern);
            if (match) {
              topics = JSON.parse(`[${match[1]}]`);
            } else {
              throw new Error('Response is not a valid JSON array');
            }
          }
        } catch (error) {
          console.error('Failed to parse JSON response', error);
          // 回退到按行解析
          topics = summaryResponse
            .split('\n')
            .filter(line => line.trim().length > 0)
            .map(line => line.replace(/^\d+\.\s*/, '').trim());
        }
      } else {
        // 列表格式，按行分割并移除数字前缀
        topics = summaryResponse
          .split('\n')
          .filter(line => line.trim().length > 0)
          .map(line => line.replace(/^\d+\.\s*/, '').trim());
      }

      // 保存生成的主题到当前状态
      await prisma.currentState.update({
        where: {
          userId_characterId: {
            userId,
            characterId
          }
        },
        data: {
          topicSuggestions: JSON.stringify(topics),
          updatedAt: new Date()
        }
      });

      return {
        topics,
        raw: summaryResponse
      };
    } catch (error) {
      console.error('Error generating topic summary:', error);
      throw error;
    }
  }

  /**
   * 获取之前生成的主题摘要
   */
  async getSavedTopics(userId: string, characterId: string): Promise<string[] | null> {
    try {
      const state = await prisma.currentState.findUnique({
        where: {
          userId_characterId: {
            userId,
            characterId
          }
        }
      });

      if (state?.topicSuggestions) {
        return JSON.parse(state.topicSuggestions);
      }

      return null;
    } catch (error) {
      console.error('Error retrieving saved topics:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const summaryGenerationService = new SummaryGenerationService(); 