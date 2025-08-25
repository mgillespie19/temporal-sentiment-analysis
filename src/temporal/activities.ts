const { request } = require('undici');
const { InvalidProductUrlError } = require('./types');
const { config } = require('./config');

async function resolveSkuAndCanonicalUrl(inputUrl: string): Promise<{ sku: string; canonicalUrl: string }> {
  try {
    // First try to extract SKU from URL pattern /site/<slug>/<SKU>.p
    const skuMatch = inputUrl.match(/\/(\d+)\.p(?:\?|$)/);
    if (skuMatch) {
      return {
        sku: skuMatch[1],
        canonicalUrl: inputUrl.split('?')[0] // Remove query params for clean URL
      };
    }

    // If it's a short URL (/product/ form), follow redirects
    if (inputUrl.includes('/product/')) {
      const { statusCode, headers } = await request(inputUrl, {
        method: 'HEAD'
      });
      
      if (statusCode >= 300 && statusCode < 400 && headers.location) {
        const redirectUrl = Array.isArray(headers.location) ? headers.location[0] : headers.location;
        const redirectSkuMatch = redirectUrl.match(/\/(\d+)\.p(?:\?|$)/);
        if (redirectSkuMatch) {
          return {
            sku: redirectSkuMatch[1],
            canonicalUrl: redirectUrl.split('?')[0]
          };
        }
      }
    }

    // Fallback: Parse HTML for skuId
    const { body } = await request(inputUrl, { method: 'GET' });
    const html = await body.text();
    const htmlSkuMatch = html.match(/"skuId":"(\d+)"/);
    
    if (htmlSkuMatch) {
      return {
        sku: htmlSkuMatch[1],
        canonicalUrl: inputUrl.split('?')[0]
      };
    }

    throw new InvalidProductUrlError(`Unable to extract SKU from URL: ${inputUrl}`);
  } catch (error) {
    if (error instanceof InvalidProductUrlError) throw error;
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new InvalidProductUrlError(`Failed to resolve SKU from URL: ${inputUrl}. Error: ${errorMessage}`);
  }
}

async function fetchReviewsPaginated(sku: string, limit = 100): Promise<any[]> {
  const reviews: any[] = [];
  const pageSize = 20;
  const maxPages = Math.ceil(limit / pageSize);

  for (let page = 1; page <= maxPages; page++) {
    try {
      const url = `https://api.bestbuy.com/v1/reviews(sku=${sku})?apiKey=${config.BESTBUY_API_KEY}&format=json&show=id,sku,rating,submissionTime,title,comment&sort=submissionTime.desc&pageSize=${pageSize}&page=${page}`;
      
      const { body } = await request(url, { method: 'GET' });
      const response = await body.json() as { reviews?: Array<{ id: string; sku: string; rating: number; title: string; comment: string; submissionTime: string }> };
      
      if (!response.reviews || response.reviews.length === 0) {
        break; // No more reviews
      }

      const normalizedReviews: any[] = response.reviews.map((review) => ({
        id: review.id.toString(),
        sku: review.sku.toString(),
        rating: review.rating,
        title: review.title || '',
        comment: review.comment || '',
        submissionTime: review.submissionTime
      }));

      reviews.push(...normalizedReviews);

      // Stop if we've reached our limit
      if (reviews.length >= limit) {
        break;
      }

      // Stop if this page had fewer results than requested (last page)
      if (response.reviews.length < pageSize) {
        break;
      }
    } catch (error) {
      console.error(`Error fetching reviews page ${page}:`, error);
      if (page === 1) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to fetch reviews for SKU ${sku}: ${errorMessage}`);
      }
      // If it's not the first page, just stop fetching more
      break;
    }
  }

  return reviews.slice(0, limit);
}

async function scoreSentimentsTomorrow(reviews: any[]): Promise<any[]> {
  const scoredReviews: any[] = [];
  
  for (const review of reviews) {
    try {
      const reviewText = `${review.title}\n\n${review.comment}`.trim();
      
      const requestBody = {
        model: 'gpt-oss-20b',
        messages: [
          {
            role: 'system',
            content: 'You are a strict sentiment scorer. Return ONLY valid JSON: {"score": <integer 0-100>}.'
          },
          {
            role: 'user',
            content: `Review text:\n"""\n${reviewText}\n"""\nRules:\n- 0 = extremely negative, 100 = extremely positive.\n- Return only: {"score": <0-100 integer>}`
          }
        ],
        max_tokens: 50,
        temperature: 0
      };

      const { body } = await request(`${config.TOGETHER_API_BASE}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.TOGETHER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const response = await body.json() as { choices?: Array<{ message?: { content?: string } }> };
      
      if (!response.choices?.[0]?.message?.content) {
        throw new Error('No content in API response');
      }

      let sentimentScore: number;
      try {
        const parsed = JSON.parse(response.choices[0].message.content.trim());
        sentimentScore = Math.max(0, Math.min(100, parseInt(parsed.score)));
      } catch {
        // Retry with clearer prompt
        const retryBody = {
          ...requestBody,
          messages: [
            ...requestBody.messages,
            {
              role: 'assistant',
              content: response.choices[0].message.content
            },
            {
              role: 'user',
              content: 'Return only JSON'
            }
          ]
        };

        const { body: retryBodyResponse } = await request(`${config.TOGETHER_API_BASE}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.TOGETHER_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(retryBody)
        });

        const retryResponse = await retryBodyResponse.json() as { choices: Array<{ message: { content: string } }> };
        const retryParsed = JSON.parse(retryResponse.choices[0].message.content.trim());
        sentimentScore = Math.max(0, Math.min(100, parseInt(retryParsed.score)));
      }

      scoredReviews.push({
        ...review,
        sentiment: sentimentScore
      });
    } catch (error) {
      console.error(`Error scoring sentiment for review ${review.id}:`, error);
      // Skip this review rather than failing the entire batch
      scoredReviews.push({
        ...review,
        sentiment: 50 // Default neutral sentiment
      });
    }
  }

  return scoredReviews;
}

async function aggregate(scoredReviews: any[]): Promise<{ avgSentiment: number; avgStars: number; count: number }> {
  if (scoredReviews.length === 0) {
    return {
      avgSentiment: 0,
      avgStars: 0,
      count: 0
    };
  }

  const totalSentiment = scoredReviews.reduce((sum, review) => sum + review.sentiment, 0);
  const totalStars = scoredReviews.reduce((sum, review) => sum + review.rating, 0);

  return {
    avgSentiment: Math.round((totalSentiment / scoredReviews.length) * 10) / 10,
    avgStars: Math.round((totalStars / scoredReviews.length) * 10) / 10,
    count: scoredReviews.length
  };
}

// In-memory storage for results (replace with DB for production)
const resultsStore = new Map<string, { status: string; data?: unknown; message?: string; timestamp?: string }>();

async function publish(runId: string, payload: unknown): Promise<void> {
  resultsStore.set(runId, {
    status: 'complete',
    data: payload,
    timestamp: new Date().toISOString()
  });
}

function getResult(runId: string): { status: string; data?: unknown; message?: string; timestamp?: string } | { status: string } {
  return resultsStore.get(runId) || { status: 'running' };
}

function setRunningStatus(runId: string): void {
  resultsStore.set(runId, { status: 'running' });
}

async function setErrorStatus(runId: string, message: string): Promise<void> {
  resultsStore.set(runId, { 
    status: 'error', 
    message,
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  resolveSkuAndCanonicalUrl,
  fetchReviewsPaginated,
  scoreSentimentsTomorrow,
  aggregate,
  publish,
  getResult,
  setRunningStatus,
  setErrorStatus
};