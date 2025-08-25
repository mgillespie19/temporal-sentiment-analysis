# Best Buy Sentiment Analysis Pipeline

A Next.js application that analyzes customer sentiment from Best Buy product reviews using Temporal workflows and AI-powered sentiment scoring.

## Features

- **URL Processing**: Extract product SKU from Best Buy URLs with redirect following
- **Review Fetching**: Paginated retrieval of up to 100 most recent reviews via Best Buy API
- **Sentiment Analysis**: AI-powered sentiment scoring (0-100) using Tomorrow API
- **Real-time UI**: Live results display with polling and loading states
- **Comprehensive Reporting**: Shows averages, individual reviews, and product links

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API routes, Temporal workflows
- **APIs**: Best Buy Reviews API, Tomorrow API (Together AI)
- **Workflow Engine**: Temporal TypeScript SDK

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in your API keys:

```bash
cp .env.example .env.local
```

Required environment variables:
- `BESTBUY_API_KEY`: Your Best Buy Developer API key
- `TOGETHER_API_BASE`: Tomorrow API base URL (usually https://api.together.xyz)
- `TOGETHER_API_KEY`: Your Tomorrow/Together AI API key
- `TEMPORAL_ADDRESS`: Temporal server address (localhost:7233 for local dev)

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Temporal Server

You need a running Temporal server. For local development:

```bash
# Using Temporal CLI (recommended)
temporal server start-dev

# Or using Docker
docker run --network=host --rm temporalio/auto-setup:latest
```

### 4. Start the Temporal Worker

In a separate terminal:

```bash
npm run worker:dev
```

### 5. Start the Next.js Application

```bash
npm run dev
```

Visit http://localhost:3000 to use the application.

## Usage

1. **Input URL**: Paste any Best Buy product URL into the form
   - Full URLs: `https://www.bestbuy.com/site/apple-iphone-15/6418599.p`
   - Short URLs: `https://www.bestbuy.com/product/6418599`

2. **Analysis Process**: The system will:
   - Extract the product SKU from the URL
   - Fetch up to 100 most recent reviews
   - Score each review's sentiment using AI (0-100 scale)
   - Calculate average sentiment and star ratings

3. **Results**: View the comprehensive report showing:
   - Overall sentiment average and star rating
   - Individual review details with sentiment scores
   - Links back to the product on Best Buy

## API Endpoints

- `POST /api/run` - Start a new sentiment analysis
- `GET /api/result?runId=<id>` - Get analysis results

## Architecture

### Temporal Workflow: `sentimentWorkflow`

1. **resolveSkuAndCanonicalUrl**: Extract SKU from URL with redirect handling
2. **fetchReviewsPaginated**: Fetch reviews from Best Buy API (paginated)
3. **scoreSentimentsTomorrow**: Score sentiment using Tomorrow API
4. **aggregate**: Calculate averages
5. **publish**: Store results for UI retrieval

### Activities

Each step is implemented as a Temporal activity with proper error handling, retries, and timeouts.

### UI Components

- **Home Page**: URL input form with validation
- **Report Page**: Results display with real-time polling
- **Components**: Reusable UI elements using shadcn/ui

## Development Scripts

```bash
npm run dev          # Start Next.js dev server
npm run worker       # Start Temporal worker (production)
npm run worker:dev   # Start Temporal worker (development)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Error Handling

- **Invalid URLs**: Clear error messages for unsupported URLs
- **API Failures**: Retry logic with exponential backoff
- **Rate Limiting**: Respects API rate limits with proper delays
- **Network Issues**: Graceful handling of connectivity problems

## Security & Compliance

- Uses official Best Buy Reviews API (no scraping)
- No PII storage (only review text and scores)
- Proper input validation and sanitization
- Secure environment variable handling

## Limitations

- Maximum 100 reviews per analysis (API pagination limit)
- Sentiment scoring uses AI model with ~50-token responses
- Requires active Temporal server for workflow execution
- Best Buy URLs only (no other retailer support)

## Production Deployment

1. Set up Temporal Cloud or self-hosted Temporal cluster
2. Configure environment variables for production APIs
3. Deploy Next.js application (Vercel, AWS, etc.)
4. Run Temporal worker as a separate service
5. Set up monitoring and logging
