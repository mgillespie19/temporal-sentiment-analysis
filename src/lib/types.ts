export type Review = {
  id: string;
  sku: string;
  rating: number;
  title: string;
  comment: string;
  submissionTime: string;
};

export type ScoredReview = Review & {
  sentiment: number; // 0-100
};

export type Report = {
  sku: string;
  canonicalUrl: string;
  count: number;
  avgSentiment: number;
  avgStars: number;
  reviews: ScoredReview[];
};

export type WorkflowInput = {
  inputUrl: string;
  maxReviews?: number;
};

export type SkuWorkflowInput = {
  sku: string;
  maxReviews?: number;
};

export type ApiResponse<T = unknown> = {
  status: "running" | "complete" | "error" | "not_found";
  message?: string;
  data?: T;
};

export type RunRequest = {
  url: string;
};

export type RunResponse = {
  runId: string;
  workflowId: string;
};

export class InvalidProductUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidProductUrlError";
  }
}