import { NextRequest, NextResponse } from 'next/server';
import * as dotenv from 'dotenv';

// 加載環境變量以確保它們可用
dotenv.config({ path: '.env.local' });

/**
 * API 路由，用於檢查環境變數是否正確設定
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyToCheck = searchParams.get('key');

    // 如果沒有指定 key，則列出所有安全的環境變量（不包括敏感信息）
    if (!keyToCheck) {
      const safeEnvVars = {
        NODE_ENV: process.env.NODE_ENV,
        TAVILY_API_KEY_LENGTH: process.env.TAVILY_API_KEY ? process.env.TAVILY_API_KEY.length : 0,
        TAVILY_API_KEY_STARTS_WITH: process.env.TAVILY_API_KEY ? process.env.TAVILY_API_KEY.substring(0, 5) : null,
        TOGETHER_API_KEY_LENGTH: process.env.TOGETHER_API_KEY ? process.env.TOGETHER_API_KEY.length : 0,
        TOGETHER_API_KEY_STARTS_WITH: process.env.TOGETHER_API_KEY ? process.env.TOGETHER_API_KEY.substring(0, 5) : null,
        ENV_VARS_PRESENT: {
          TAVILY_API_KEY: !!process.env.TAVILY_API_KEY,
          TOGETHER_API_KEY: !!process.env.TOGETHER_API_KEY,
          S3_UPLOAD_KEY: !!process.env.S3_UPLOAD_KEY,
          S3_UPLOAD_SECRET: !!process.env.S3_UPLOAD_SECRET,
          DEEPGRAM_API_KEY: !!process.env.DEEPGRAM_API_KEY,
          REPLICATE_API_TOKEN: !!process.env.REPLICATE_API_TOKEN,
          DATABASE_URL: !!process.env.DATABASE_URL
        }
      };

      return NextResponse.json(safeEnvVars);
    }

    // 檢查指定的環境變數
    const envValue = process.env[keyToCheck];
    
    if (envValue === undefined) {
      return NextResponse.json({ 
        key: keyToCheck,
        isSet: false,
        value: null,
        message: `Environment variable ${keyToCheck} is not set`
      });
    }

    // 對於敏感變量，只顯示前5個字符和長度，而不是完整值
    const isSensitive = ['API_KEY', 'SECRET', 'PASSWORD', 'TOKEN'].some(term => 
      keyToCheck.toUpperCase().includes(term)
    );

    return NextResponse.json({
      key: keyToCheck,
      isSet: true,
      value: isSensitive ? `${envValue.substring(0, 5)}...` : envValue,
      length: envValue.length,
      message: `Environment variable ${keyToCheck} is set${isSensitive ? ' (sensitive value partially masked)' : ''}`
    });

  } catch (error) {
    console.error('Error checking environment variables:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to check environment variables',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 