import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createTemporalClient } from '../../../temporal/client';
import type { RunResponse } from '../../../lib/types';

const runSkuRequestSchema = z.object({
  sku: z.string().regex(/^\d+$/, "SKU must be numeric"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sku } = runSkuRequestSchema.parse(body);
    
    const client = await createTemporalClient();
    
    const workflowId = `sentiment-sku-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const runId = `run-${workflowId}`;
    
    // Start the SKU-based workflow
    console.log(`Starting SKU workflow: ${workflowId} on task queue: sentiment-analysis`);
    const handle = await client.workflow.start('sentimentWorkflowBySku', {
      args: [{ sku, maxReviews: 100 }],
      taskQueue: 'sentiment-analysis',
      workflowId,
    });
    console.log(`SKU workflow started successfully: ${handle.workflowId}`);
    
    const response: RunResponse = {
      runId,
      workflowId: handle.workflowId,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error starting SKU workflow:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to start SKU sentiment analysis' },
      { status: 500 }
    );
  }
}
