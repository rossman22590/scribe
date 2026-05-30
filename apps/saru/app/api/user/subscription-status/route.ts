import { NextResponse } from 'next/server';
import { getSession } from '@/app/(auth)/auth';
import { unpublishAllDocumentsByUserId } from '@/lib/db/queries';
import { getSubscriptionStatusForUser } from '@/lib/subscription';
import { isStripeBillingEnforced } from '@/lib/credits/config';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({
      hasActiveSubscription: false,
      plan: 'free',
      status: null,
      periodEnd: null,
      cancelAtPeriodEnd: false,
      trialEnd: null,
    });
  }

  const userId = session.user.id;
  const status = await getSubscriptionStatusForUser(userId);

  if (isStripeBillingEnforced() && !status.hasActiveSubscription) {
    try {
      await unpublishAllDocumentsByUserId({ userId });
    } catch (error) {
      console.error(`[API /user/subscription-status] Failed to unpublish for ${userId}:`, error);
    }
  }

  return NextResponse.json(status);
}
