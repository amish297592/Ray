import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseBuyerIntent } from '@/lib/ai/buyer/intent';

const Schema = z.object({
  query: z.string().min(2),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parse = Schema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ success: false, error: 'Query is required' }, { status: 400 });
    }

    const intent = parseBuyerIntent(parse.data.query);
    return NextResponse.json({ success: true, intent });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
