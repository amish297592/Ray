import { NextResponse } from 'next/server';
import { z } from 'zod';
import { runGrowthAgentAnalysis } from '@/lib/ai/agent';

const AnalyzeSchema = z.object({
  merchantSlug: z.string().default('nova-run'),
  query: z.string().optional(),
  sessionId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const parseResult = AnalyzeSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid analysis request', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const result = await runGrowthAgentAnalysis(parseResult.data);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Agent Analysis Failed', details: error?.message },
      { status: 500 }
    );
  }
}
