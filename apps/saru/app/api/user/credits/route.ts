import { NextResponse } from 'next/server';
import { getSession } from '@/app/(auth)/auth';
import { getCreditBalance } from '@/lib/credits/service';
import { isStripeBillingEnforced } from '@/lib/credits/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isStripeBillingEnforced()) {
    const info = await getCreditBalance(session.user.id);
    return NextResponse.json({
      balance: info.balance,
      allowance: info.allowance,
      plan: info.plan,
      periodEnd: info.periodEnd.toISOString(),
      stripeEnabled: false,
    });
  }

  const info = await getCreditBalance(session.user.id);
  return NextResponse.json({
    balance: info.balance,
    allowance: info.allowance,
    plan: info.plan,
    periodEnd: info.periodEnd.toISOString(),
    stripeEnabled: true,
  });
}
