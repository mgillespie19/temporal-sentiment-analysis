export interface Review {
  id: string;
  sku: string;
  rating: number;
  title: string;
  comment: string;
  submissionTime: string;
}

export interface ScoredReview extends Review {
  sentiment: number;
}

export interface WorkflowInput {
  inputUrl: string;
  maxReviews?: number;
}

export interface Report {
  sku: string;
  canonicalUrl: string;
  count: number;
  avgSentiment: number;
  avgStars: number;
  reviews: ScoredReview[];
}

export class InvalidProductUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidProductUrlError';
  }
}
