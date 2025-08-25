'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime, getSentimentColor } from '@/lib/utils';
import type { ApiResponse, Report } from '@/lib/types';

function SentimentMeter({ sentiment }: { sentiment: number }) {
  return (
    <div className="flex items-center space-x-3">
      <div className="flex-1">
        <Progress value={sentiment} />
      </div>
      <span className={`text-sm font-medium px-2 py-1 rounded ${getSentimentColor(sentiment)}`}>
        {sentiment}
      </span>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-sm text-gray-600">{rating}</span>
    </div>
  );
}

export default function ReportPage() {
  const [result, setResult] = useState<ApiResponse<Report> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const runId = searchParams.get('runId');

  useEffect(() => {
    if (!runId) {
      setError('No runId provided');
      setLoading(false);
      return;
    }

    const pollForResults = async () => {
      try {
        const response = await fetch(`/api/result?runId=${runId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch results');
        }
        
        setResult(data);
        
        if (data.status === 'running') {
          setTimeout(pollForResults, 3000);
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    pollForResults();
  }, [runId]);

  if (!runId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <p className="text-red-600">No analysis ID provided</p>
            <Button onClick={() => router.push('/')} className="mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || (result?.status === 'running')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Analyzing sentiment...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a few minutes</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || result?.status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <p className="text-red-600 mb-4">{error || result?.message || 'Analysis failed'}</p>
            <Button onClick={() => router.push('/')} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!result?.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <p className="text-gray-600">No data available</p>
            <Button onClick={() => router.push('/')} className="mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const report = result.data;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Sentiment Analysis Report</h1>
          <Button variant="outline" onClick={() => router.push('/')}>
            New Analysis
          </Button>
        </div>

        {/* Product Link */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Product SKU: {report.sku}</span>
              <a 
                href={report.canonicalUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm"
              >
                <Button variant="outline">
                  Open on Best Buy
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Average Sentiment</CardTitle>
              <CardDescription>{report.count} reviews analyzed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{report.avgSentiment}/100</div>
              <SentimentMeter sentiment={report.avgSentiment} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Average Rating</CardTitle>
              <CardDescription>Customer star ratings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{report.avgStars}/5</div>
              <StarRating rating={report.avgStars} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reviews</CardTitle>
              <CardDescription>Total analyzed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{report.count}</div>
              <div className="text-sm text-gray-600">Most recent reviews</div>
            </CardContent>
          </Card>
        </div>

        {/* Reviews Table */}
        <Card>
          <CardHeader>
            <CardTitle>Review Details</CardTitle>
            <CardDescription>Individual review sentiment scores</CardDescription>
          </CardHeader>
          <CardContent>
            {report.reviews.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No reviews found for this product.
              </div>
            ) : (
              <div className="space-y-4">
                {report.reviews.map((review) => (
                  <div key={review.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{review.title}</h4>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-3">{review.comment}</p>
                      </div>
                      <div className="ml-4 flex flex-col items-end space-y-2">
                        <Badge className={getSentimentColor(review.sentiment)}>
                          {review.sentiment} sentiment
                        </Badge>
                        <StarRating rating={review.rating} />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatRelativeTime(review.submissionTime)}</span>
                      <a 
                        href={`${report.canonicalUrl}#tabbed-customerreviews`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View on Best Buy →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}