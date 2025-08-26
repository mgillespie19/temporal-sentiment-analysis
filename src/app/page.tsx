'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-gray-500">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Best Buy Sentiment Analysis
            </CardTitle>
            <CardDescription>
              Paste any Best Buy product URL to analyze customer sentiment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
            
            <div className="mt-6 text-xs text-gray-500 space-y-1">
              <p>Example URLs:</p>
              <p>• https://www.bestbuy.com/site/apple-iphone-15/6418599.p</p>
              <p>• https://www.bestbuy.com/product/6418599</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
