import { NextRequest, NextResponse } from 'next/server';
import { getResult } from '../../../temporal/activities';
import type { ApiResponse } from '../../../lib/types';

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
    
    const result = getResult(runId);
    
    if (!result) {
      return NextResponse.json({
        status: 'not_found',
        message: 'No results found for this runId'
      } as ApiResponse);
    }
    
    return NextResponse.json(result as ApiResponse);
  } catch (error) {
    console.error('Error getting result:', error);
    return NextResponse.json(
      { error: 'Failed to get results' },
      { status: 500 }
    );
  }
}