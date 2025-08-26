import { proxyActivities, workflowInfo } from '@temporalio/workflow';
import type { WorkflowInput, Report } from '../lib/types';
import type * as activities from './activities';

const {
  resolveSkuAndCanonicalUrl,
  fetchReviewsPaginated,
  scoreSentimentsTogether,
  aggregate,
  publish,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes',
  retry: {
    initialInterval: '1s',
    maximumInterval: '30s',
    maximumAttempts: 3,
  },
});

export async function sentimentWorkflow(input: WorkflowInput): Promise<Report> {
  const { inputUrl, maxReviews = 100 } = input;
  const runId = `run-${workflowInfo().workflowId}`;
  
  try {
    // Step 1: Resolve SKU and canonical URL
    const { sku, canonicalUrl } = await resolveSkuAndCanonicalUrl(inputUrl);
    
    // Step 2: Fetch reviews
    const reviews = await fetchReviewsPaginated(sku, maxReviews);
    
    // Step 3: Score sentiments
    const scoredReviews = await scoreSentimentsTogether(reviews);
    
    // Step 4: Aggregate results
    const aggregation = await aggregate(scoredReviews);
    
    // Step 5: Build final report
    const report: Report = {
      sku,
      canonicalUrl,
      count: aggregation.count,
      avgSentiment: aggregation.avgSentiment,
      avgStars: aggregation.avgStars,
      reviews: scoredReviews,
    };
    
    // Step 6: Publish results
    await publish(runId, report);
    
    return report;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Sentiment workflow failed: ${errorMessage}`);
  }
}