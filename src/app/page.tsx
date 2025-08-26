'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'url' | 'sku'>('sku');
  const [url, setUrl] = useState('');
  const [sku, setSku] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start analysis');
      }

      router.push(`/report?runId=${data.runId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSkuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/run-sku', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sku }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start analysis');
      }

      router.push(`/report?runId=${data.runId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-gray-500">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Best Buy Sentiment Analysis
            </CardTitle>
            <CardDescription>
              Analyze customer sentiment using a product URL or SKU
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Tab Navigation */}
            <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('url')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'url'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                By URL
              </button>
              <button
                onClick={() => setActiveTab('sku')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'sku'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                By SKU
              </button>
            </div>

            {/* URL Tab Content */}
            {activeTab === 'url' && (
              <form onSubmit={handleUrlSubmit} className="space-y-4">
                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                    Product URL
                  </label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://www.bestbuy.com/site/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                    {error}
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  disabled={loading || !url}
                  className="w-full"
                >
                  {loading ? 'Starting Analysis...' : 'Run Analysis'}
                </Button>
              </form>
            )}

            {/* SKU Tab Content */}
            {activeTab === 'sku' && (
              <form onSubmit={handleSkuSubmit} className="space-y-4">
                <div>
                  <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                    Product SKU
                  </label>
                  <Input
                    id="sku"
                    type="text"
                    placeholder="6418599"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    required
                    pattern="[0-9]+"
                    title="SKU must be numeric"
                    className="w-full"
                  />
                </div>
                
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                    {error}
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  disabled={loading || !sku}
                  className="w-full"
                >
                  {loading ? 'Starting Analysis...' : 'Run Analysis'}
                </Button>
              </form>
            )}
            
            <div className="mt-6 text-xs text-gray-500 space-y-1">
              {activeTab === 'url' ? (
                <>
                  <p>Example URLs:</p>
                  <p>• https://www.bestbuy.com/site/apple-iphone-15/6418599.p</p>
                  <p>• https://www.bestbuy.com/product/6418599</p>
                </>
              ) : (
                <>
                  <p>Example SKUs:</p>
                  <p>• 6418599 (Macbook Air)</p>
                  <p>• 6585114 (Galaxy Watch 7)</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
