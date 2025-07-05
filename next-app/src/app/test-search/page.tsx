'use client';

import { useState } from 'react';

export default function TestSearch() {
  const [query, setQuery] = useState('');
  const [characterId, setCharacterId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyCheck, setApiKeyCheck] = useState<{isSet: boolean; value: string | null} | null>(null);

  const handleSearch = async () => {
    if (!query || !characterId) {
      setError('请输入搜索查询和角色ID');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, characterId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '搜索请求失败');
      }

      setResults(data.results || '没有搜索结果');
    } catch (err: any) {
      setError(`错误: ${err.message}`);
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const checkApiKey = async () => {
    try {
      const response = await fetch('/api/check-env?key=TAVILY_API_KEY');
      const data = await response.json();
      
      setApiKeyCheck({
        isSet: data.isSet,
        value: data.value
      });
    } catch (err: any) {
      setError(`无法检查API密钥: ${err.message}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Tavily API 测试页面</h1>
      
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
        <p className="font-bold">提示</p>
        <p>此页面用于测试Tavily搜索API集成。您需要提供一个有效的角色ID。</p>
        <p>确保您的.env.local文件中设置了有效的TAVILY_API_KEY。</p>
      </div>
      
      <div className="mb-6">
        <button 
          onClick={checkApiKey}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          检查API密钥设置
        </button>
        
        {apiKeyCheck && (
          <div className="mt-2 p-3 border rounded">
            <p>API密钥设置: {apiKeyCheck.isSet ? '已设置' : '未设置'}</p>
            {apiKeyCheck.isSet && apiKeyCheck.value && (
              <p>前4个字符: {apiKeyCheck.value.substring(0, 4)}...</p>
            )}
          </div>
        )}
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">搜索查询</label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="输入搜索查询，例如：最新的AI研究"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">角色ID</label>
        <input
          type="text"
          value={characterId}
          onChange={(e) => setCharacterId(e.target.value)}
          placeholder="输入角色ID"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
        />
      </div>
      
      <div className="mb-6">
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isLoading ? '搜索中...' : '执行搜索'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p className="font-bold">错误</p>
          <p>{error}</p>
        </div>
      )}
      
      {results && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">搜索结果</h2>
          <div className="bg-gray-100 p-4 rounded whitespace-pre-wrap">
            {results}
          </div>
        </div>
      )}
    </div>
  );
} 