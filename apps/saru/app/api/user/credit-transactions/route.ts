import { NextResponse } from 'next/server';
import { getSession } from '@/app/(auth)/auth';
import { getCreditTransactions } from '@/lib/credits/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const transactions = await getCreditTransactions(session.user.id);

  return NextResponse.json({
    transactions: transactions.map((tx) => ({
      id: tx.id,
      amount: tx.amount,
      balanceAfter: tx.balanceAfter,
      reason: tx.reason,
      metadata: tx.metadata,
      createdAt: tx.createdAt.toISOString(),
    })),
  });
}
