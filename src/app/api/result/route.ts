import { NextRequest, NextResponse } from 'next/server';
import { createTemporalClient } from '../../../temporal/client';
import type { ApiResponse, Report } from '../../../lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('runId');
    
    if (!runId) {
      return NextResponse.json(
        { error: 'runId parameter is required' },
        { status: 400 }
      );
    }
    
    // Extract workflowId from runId (format: run-workflowId)
    const workflowId = runId.replace('run-', '');
    
    const client = await createTemporalClient();
    
    try {
      // Get workflow handle
      const handle = client.workflow.getHandle(workflowId);
      
      // Check if workflow is still running
      const description = await handle.describe();
      console.log(`[result] Workflow ${workflowId} status:`, description.status);
      
      if (description.status.name === 'RUNNING') {
        return NextResponse.json({
          status: 'running',
          message: 'Analysis in progress'
        } as ApiResponse);
      }
      
      if (description.status.name === 'COMPLETED') {
        // Get the workflow result
        const result = await handle.result();
        console.log(`[result] Workflow completed with result:`, result);
        
        return NextResponse.json({
          status: 'complete',
          data: result,
          timestamp: new Date().toISOString()
        } as ApiResponse<Report>);
      }
      
      if (description.status.name === 'FAILED') {
        return NextResponse.json({
          status: 'error',
          message: 'Workflow failed',
          timestamp: new Date().toISOString()
        } as ApiResponse);
      }
      
      // Other statuses (CANCELLED, TERMINATED, etc.)
      return NextResponse.json({
        status: 'error',
        message: `Workflow ended with status: ${description.status.name}`,
        timestamp: new Date().toISOString()
      } as ApiResponse);
      
    } catch (workflowError: any) {
      if (workflowError.code === 5) { // NOT_FOUND
        return NextResponse.json({
          status: 'not_found',
          message: 'No workflow found for this runId'
        } as ApiResponse);
      }
      throw workflowError;
    }
    
  } catch (error) {
    console.error('Error getting result:', error);
    return NextResponse.json(
      { error: 'Failed to get results' },
      { status: 500 }
    );
  }
}