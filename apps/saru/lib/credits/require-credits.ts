import 'server-only';

import { NextResponse } from 'next/server';
import { deductCredits } from './service';

export const insufficientCreditsResponse = (balance: number, required: number) =>
  NextResponse.json(
    {
      error: 'insufficient_credits',
      balance,
      required,
    },
    { status: 402 }
  );

export const requireCredits = async ({
  userId,
  cost,
  reason,
  metadata,
}: {
  userId: string;
  cost: number;
  reason: string;
  metadata?: Record<string, unknown>;
}): Promise<NextResponse | null> => {
  const result = await deductCredits({ userId, cost, reason, metadata });
  if (!result.ok) {
    return insufficientCreditsResponse(result.balance, result.required);
  }
  return null;
};
