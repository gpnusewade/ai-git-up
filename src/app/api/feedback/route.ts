import { NextRequest, NextResponse } from 'next/server';
import { log, logError } from '@/lib/logger';
import { FeedbackData } from '@/types';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body: FeedbackData = await request.json();

    if (!body.featureType || !body.dimensions || !body.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    log('feedback.submitted', {
      featureType: body.featureType,
      dimensions: Object.keys(body.dimensions),
      duration: Date.now() - startTime,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError('feedback.error', error, { duration: Date.now() - startTime });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Feedback submission failed' },
      { status: 500 }
    );
  }
}
