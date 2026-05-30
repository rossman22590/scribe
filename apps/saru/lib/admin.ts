import 'server-only';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@saru/db';
import * as schema from '@saru/db';
import {
  and,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';

export const ADMIN_ROLE = 'admin';
export const USER_ROLE = 'user';

export type AdminRole = typeof ADMIN_ROLE | typeof USER_ROLE;

const bootstrapAdminEmails = (process.env.ADMIN_EMAILS || 'rcohen@mytsi.org')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function isBootstrapAdminEmail(email?: string | null) {
  return Boolean(email && bootstrapAdminEmails.includes(email.toLowerCase()));
}

export async function getCurrentAdminUser() {
  const readonlyHeaders = await headers();
  const session = await auth.api.getSession({
    headers: new Headers(readonlyHeaders),
  });

  if (!session?.user?.id) return null;

  const [user] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, session.user.id))
    .limit(1);

  if (!user) return null;

  if (user.role === ADMIN_ROLE) return user;

  if (isBootstrapAdminEmail(user.email)) {
    const [promoted] = await db
      .update(schema.user)
      .set({ role: ADMIN_ROLE, updatedAt: new Date() })
      .where(eq(schema.user.id, user.id))
      .returning();

    return promoted ?? { ...user, role: ADMIN_ROLE };
  }

  return null;
}

export async function requireAdminUser() {
  const admin = await getCurrentAdminUser();

  if (!admin) {
    throw new Error('Admin access required');
  }

  return admin;
}

async function countAll(from: any, where?: SQL) {
  const query = db.select({ value: sql<number>`count(*)::int` }).from(from).$dynamic();
  const [row] = where ? await query.where(where) : await query;
  return Number(row?.value ?? 0);
}

export async function getAdminDashboard({ search = '' }: { search?: string } = {}) {
  await requireAdminUser();

  const normalizedSearch = search.trim();
  const likeSearch = `%${normalizedSearch}%`;

  const userSearch = normalizedSearch
    ? or(
        ilike(schema.user.email, likeSearch),
        ilike(schema.user.name, likeSearch),
        ilike(schema.user.username, likeSearch),
      )
    : undefined;

  const documentSearch = normalizedSearch
    ? or(
        ilike(schema.Document.title, likeSearch),
        ilike(schema.Document.author, likeSearch),
        ilike(schema.user.email, likeSearch),
      )
    : undefined;

  const waitlistSearch = normalizedSearch
    ? ilike(schema.waitlist.email, likeSearch)
    : undefined;

  const metrics = {
    users: await countAll(schema.user),
    admins: await countAll(schema.user, eq(schema.user.role, ADMIN_ROLE)),
    verifiedUsers: await countAll(schema.user, eq(schema.user.emailVerified, true)),
    documents: await countAll(schema.Document),
    publicDocuments: await countAll(
      schema.Document,
      eq(schema.Document.visibility, 'public'),
    ),
    chats: await countAll(schema.Chat),
    messages: await countAll(schema.Message),
    activeSubscriptions: await countAll(
      schema.subscription,
      inArray(schema.subscription.status, ['active', 'trialing']),
    ),
    sessions: await countAll(schema.session),
    waitlist: await countAll(schema.waitlist),
  };

  let usersQuery = db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      username: schema.user.username,
      role: schema.user.role,
      emailVerified: schema.user.emailVerified,
      createdAt: schema.user.createdAt,
      updatedAt: schema.user.updatedAt,
      stripeCustomerId: schema.user.stripeCustomerId,
      documentCount: sql<number>`count(distinct ${schema.Document.id})::int`,
      chatCount: sql<number>`count(distinct ${schema.Chat.id})::int`,
      sessionCount: sql<number>`count(distinct ${schema.session.id})::int`,
      subscriptionStatus: sql<string | null>`max(${schema.subscription.status})`,
    })
    .from(schema.user)
    .leftJoin(schema.Document, eq(schema.Document.userId, schema.user.id))
    .leftJoin(schema.Chat, eq(schema.Chat.userId, schema.user.id))
    .leftJoin(schema.session, eq(schema.session.userId, schema.user.id))
    .leftJoin(schema.subscription, eq(schema.subscription.referenceId, schema.user.id))
    .$dynamic();

  if (userSearch) usersQuery = usersQuery.where(userSearch);

  const users = await usersQuery
    .groupBy(
      schema.user.id,
      schema.user.name,
      schema.user.email,
      schema.user.username,
      schema.user.role,
      schema.user.emailVerified,
      schema.user.createdAt,
      schema.user.updatedAt,
      schema.user.stripeCustomerId,
    )
    .orderBy(desc(schema.user.createdAt))
    .limit(80);

  let documentsQuery = db
    .select({
      id: schema.Document.id,
      title: schema.Document.title,
      kind: schema.Document.kind,
      visibility: schema.Document.visibility,
      author: schema.Document.author,
      slug: schema.Document.slug,
      userId: schema.Document.userId,
      ownerEmail: schema.user.email,
      ownerName: schema.user.name,
      createdAt: schema.Document.createdAt,
      updatedAt: schema.Document.updatedAt,
    })
    .from(schema.Document)
    .leftJoin(schema.user, eq(schema.Document.userId, schema.user.id))
    .$dynamic();

  if (documentSearch) documentsQuery = documentsQuery.where(documentSearch);

  const documents = await documentsQuery
    .orderBy(desc(schema.Document.updatedAt))
    .limit(80);

  let waitlistQuery = db
    .select()
    .from(schema.waitlist)
    .$dynamic();

  if (waitlistSearch) waitlistQuery = waitlistQuery.where(waitlistSearch);

  const waitlist = await waitlistQuery
    .orderBy(desc(schema.waitlist.createdAt))
    .limit(80);

  const subscriptions = await db
    .select({
      id: schema.subscription.id,
      plan: schema.subscription.plan,
      status: schema.subscription.status,
      referenceId: schema.subscription.referenceId,
      stripeCustomerId: schema.subscription.stripeCustomerId,
      stripeSubscriptionId: schema.subscription.stripeSubscriptionId,
      periodEnd: schema.subscription.periodEnd,
      trialEnd: schema.subscription.trialEnd,
      cancelAtPeriodEnd: schema.subscription.cancelAtPeriodEnd,
      createdAt: schema.subscription.createdAt,
      ownerEmail: schema.user.email,
      ownerName: schema.user.name,
    })
    .from(schema.subscription)
    .leftJoin(schema.user, eq(schema.subscription.referenceId, schema.user.id))
    .orderBy(desc(schema.subscription.createdAt))
    .limit(50);

  const sessions = await db
    .select({
      id: schema.session.id,
      userId: schema.session.userId,
      ownerEmail: schema.user.email,
      ownerName: schema.user.name,
      expiresAt: schema.session.expiresAt,
      createdAt: schema.session.createdAt,
      updatedAt: schema.session.updatedAt,
      ipAddress: schema.session.ipAddress,
      userAgent: schema.session.userAgent,
    })
    .from(schema.session)
    .leftJoin(schema.user, eq(schema.session.userId, schema.user.id))
    .orderBy(desc(schema.session.updatedAt))
    .limit(50);

  const chats = await db
    .select({
      id: schema.Chat.id,
      title: schema.Chat.title,
      userId: schema.Chat.userId,
      ownerEmail: schema.user.email,
      ownerName: schema.user.name,
      createdAt: schema.Chat.createdAt,
      messageCount: sql<number>`count(${schema.Message.id})::int`,
    })
    .from(schema.Chat)
    .leftJoin(schema.user, eq(schema.Chat.userId, schema.user.id))
    .leftJoin(schema.Message, eq(schema.Message.chatId, schema.Chat.id))
    .groupBy(
      schema.Chat.id,
      schema.Chat.title,
      schema.Chat.userId,
      schema.user.email,
      schema.user.name,
      schema.Chat.createdAt,
    )
    .orderBy(desc(schema.Chat.createdAt))
    .limit(50);

  return {
    metrics,
    users,
    documents,
    waitlist,
    subscriptions,
    sessions,
    chats,
  };
}

export async function setUserRole({
  userId,
  role,
}: {
  userId: string;
  role: AdminRole;
}) {
  const admin = await requireAdminUser();

  if (![ADMIN_ROLE, USER_ROLE].includes(role)) {
    throw new Error('Invalid role');
  }

  if (admin.id === userId && role !== ADMIN_ROLE) {
    throw new Error('You cannot remove your own admin role');
  }

  await db
    .update(schema.user)
    .set({ role, updatedAt: new Date() })
    .where(eq(schema.user.id, userId));
}

export async function setUserEmailVerified({
  userId,
  emailVerified,
}: {
  userId: string;
  emailVerified: boolean;
}) {
  await requireAdminUser();

  await db
    .update(schema.user)
    .set({ emailVerified, updatedAt: new Date() })
    .where(eq(schema.user.id, userId));
}

export async function deleteUserCascade({ userId }: { userId: string }) {
  const admin = await requireAdminUser();

  const [target] = await db
    .select({
      id: schema.user.id,
      email: schema.user.email,
    })
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1);

  if (!target) throw new Error('User not found');
  if (target.id === admin.id) throw new Error('You cannot delete your own user');
  if (isBootstrapAdminEmail(target.email)) {
    throw new Error('Bootstrap admin users cannot be deleted');
  }

  await db.transaction(async (tx) => {
    const chats = await tx
      .select({ id: schema.Chat.id })
      .from(schema.Chat)
      .where(eq(schema.Chat.userId, userId));
    const chatIds = chats.map((chat) => chat.id);

    if (chatIds.length > 0) {
      await tx
        .delete(schema.Message)
        .where(inArray(schema.Message.chatId, chatIds));
    }

    await tx.delete(schema.Document).where(
      chatIds.length > 0
        ? or(eq(schema.Document.userId, userId), inArray(schema.Document.chatId, chatIds))
        : eq(schema.Document.userId, userId),
    );

    if (chatIds.length > 0) {
      await tx.delete(schema.Chat).where(inArray(schema.Chat.id, chatIds));
    }

    await tx.delete(schema.account).where(eq(schema.account.userId, userId));
    await tx.delete(schema.session).where(eq(schema.session.userId, userId));
    await tx.delete(schema.subscription).where(eq(schema.subscription.referenceId, userId));
    await tx.delete(schema.user).where(eq(schema.user.id, userId));
  });
}

export async function setDocumentVisibility({
  documentId,
  visibility,
}: {
  documentId: string;
  visibility: 'public' | 'private';
}) {
  await requireAdminUser();

  await db
    .update(schema.Document)
    .set(
      visibility === 'private'
        ? { visibility, slug: null, updatedAt: new Date() }
        : { visibility, updatedAt: new Date() },
    )
    .where(eq(schema.Document.id, documentId));
}

export async function deleteDocumentByAdmin({ documentId }: { documentId: string }) {
  await requireAdminUser();

  await db
    .delete(schema.Document)
    .where(eq(schema.Document.id, documentId));
}

export async function deleteChatByAdmin({ chatId }: { chatId: string }) {
  await requireAdminUser();

  await db.transaction(async (tx) => {
    await tx.delete(schema.Message).where(eq(schema.Message.chatId, chatId));
    await tx
      .update(schema.Document)
      .set({ chatId: null, updatedAt: new Date() })
      .where(eq(schema.Document.chatId, chatId));
    await tx.delete(schema.Chat).where(eq(schema.Chat.id, chatId));
  });
}

export async function revokeSessionByAdmin({ sessionId }: { sessionId: string }) {
  await requireAdminUser();

  await db
    .delete(schema.session)
    .where(eq(schema.session.id, sessionId));
}

export async function deleteWaitlistEntryByAdmin({ waitlistId }: { waitlistId: string }) {
  await requireAdminUser();

  await db
    .delete(schema.waitlist)
    .where(eq(schema.waitlist.id, waitlistId));
}
