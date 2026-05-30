import { NextResponse } from 'next/server';
import { streamText } from 'ai';
import { headers } from 'next/headers';
import { myProvider } from '@/lib/ai/providers';
import { auth } from '@/lib/auth';
import { assertMinimumCredits, deductCreditsFromUsage } from '@/lib/credits/usage-billing';
import { getEffectiveMinCredits } from '@/lib/credits/token-pricing';
import { getUserSubscriptionPlan } from '@/lib/subscription';

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const readonlyHeaders = await headers();
    const requestHeaders = new Headers(readonlyHeaders);
    const session = await auth.api.getSession({ headers: requestHeaders });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const plan = await getUserSubscriptionPlan(userId);

    if (plan !== 'premium' && plan !== 'ultra') {
      return NextResponse.json(
        { error: 'upgrade_required', message: 'Style training requires Premium or Ultra.' },
        { status: 402 }
      );
    }

    const creditError = await assertMinimumCredits(userId, getEffectiveMinCredits());
    if (creditError) return creditError;

    const { sampleText } = await request.json();

    if (typeof sampleText !== 'string' || sampleText.trim().length < 200) {
      return NextResponse.json(
        { error: 'Please provide at least ~200 characters of sample text.' },
        { status: 400 }
      );
    }

    const analysisPrompt = `You are a literary style analyst. Summarize the distinctive writing style of the author in 2-3 concise sentences, focusing on tone, vocabulary, sentence structure, and any notable quirks. Do not mention the author in third person; instead, describe the style directly (e.g., "Uses short, punchy sentences and casual slang."). Text to analyse is delimited by triple quotes.\n\n"""${sampleText}"""`;

    const result = streamText({
      model: myProvider.languageModel('artifact-model'),
      system: 'You are an expert writing assistant.',
      prompt: analysisPrompt,
      temperature: 0.3,
      maxOutputTokens: 150,
    });

    let summary = '';
    for await (const delta of result.fullStream) {
      if (delta.type === 'text-delta') {
        summary += delta.text;
      }
    }

    try {
      const usage = await result.usage;
      const deductResult = await deductCreditsFromUsage({
        userId,
        modelId: 'artifact-model',
        usage,
        reason: 'user_style',
      });
      if (!deductResult.ok) {
        return NextResponse.json(
          {
            error: 'insufficient_credits',
            balance: deductResult.balance,
            required: deductResult.required,
          },
          { status: 402 }
        );
      }
    } catch (error) {
      console.error('[user-style] Failed to deduct credits:', error);
    }

    return NextResponse.json({ summary: summary.trim() });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to analyse style.';
    console.error('[user-style] Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
