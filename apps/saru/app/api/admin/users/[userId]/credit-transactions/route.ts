import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/admin';
import { getCreditTransactions } from '@/lib/credits/service';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const admin = await getCurrentAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const transactions = await getCreditTransactions(userId, 100);

  return NextResponse.json({
    transactions: transactions.map((tx) => ({
      id: tx.id,
      amount: tx.amount,
      balanceAfter: tx.balanceAfter,
      reason: tx.reason,
      metadata: tx.metadata as Record<string, unknown> | null,
      createdAt: tx.createdAt.toISOString(),
    })),
  });
}
