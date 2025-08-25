import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createTemporalClient } from '../../../temporal/client';
import { setRunningStatus } from '../../../temporal/activities';
import type { RunResponse } from '../../../lib/types';

const runRequestSchema = z.object({
  url: z.string().url("Invalid URL format"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = runRequestSchema.parse(body);
    
    // Validate it's a Best Buy URL
    if (!url.includes('bestbuy.com')) {
      return NextResponse.json(
        { error: 'Only Best Buy URLs are supported' },
        { status: 400 }
      );
    }
    
    const client = await createTemporalClient();
    
    const workflowId = `sentiment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const runId = `run-${workflowId}`;
    
    // Set initial running status
    setRunningStatus(runId);
    
    // Start the workflow
    console.log(`Starting workflow: ${workflowId} on task queue: sentiment-analysis`);
    const handle = await client.workflow.start('sentimentWorkflow', {
      args: [{ inputUrl: url, maxReviews: 100 }],
      taskQueue: 'sentiment-analysis',
      workflowId,
    });
    console.log(`Workflow started successfully: ${handle.workflowId}`);
    
    const response: RunResponse = {
      runId,
      workflowId: handle.workflowId,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error starting workflow:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to start sentiment analysis' },
      { status: 500 }
    );
  }
}