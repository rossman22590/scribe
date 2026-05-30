import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Activity,
  CreditCard,
  Database,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Mail,
  MessageSquare,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getAdminDashboard, getCurrentAdminUser } from '@/lib/admin';
import {
  deleteChatAction,
  deleteDocumentAction,
  deleteUserAction,
  deleteWaitlistEntryAction,
  revokeSessionAction,
  updateDocumentVisibilityAction,
  updateUserRoleAction,
  updateUserVerificationAction,
} from './actions';
import { ConfirmSubmitButton } from './confirm-submit-button';
import { UserManagementDialog } from './user-management-dialog';

export const dynamic = 'force-dynamic';

type AdminPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatDate(value?: Date | string | null) {
  if (!value) return 'None';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function shortId(value?: string | null) {
  if (!value) return 'None';
  if (value.length <= 14) return value;
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function roleBadge(role: string) {
  return role === 'admin' ? (
    <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300">
      Admin
    </Badge>
  ) : (
    <Badge variant="secondary">User</Badge>
  );
}

function statusBadge(status?: string | null) {
  if (!status) return <Badge variant="outline">None</Badge>;

  const active = status === 'active' || status === 'trialing';

  return (
    <Badge
      className={
        active
          ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-700 hover:bg-cyan-500/10 dark:text-cyan-300'
          : 'border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300'
      }
      variant="outline"
    >
      {status}
    </Badge>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="mt-3 text-3xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const admin = await getCurrentAdminUser();

  if (!admin) {
    redirect('/documents');
  }

  const params = searchParams ? await searchParams : {};
  const rawSearch = params.q;
  const search = Array.isArray(rawSearch) ? rawSearch[0] ?? '' : rawSearch ?? '';
  const dashboard = await getAdminDashboard({ search });

  return (
    <main className="min-h-dvh bg-muted/30 text-foreground">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ShieldCheck className="size-4" />
              <span>{admin.email}</span>
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-normal">System Admin</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Manage users, credits, plans, documents, chats, sessions, subscriptions, and waitlist data.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <form action="/admin" className="flex min-w-0 gap-2">
              <div className="relative min-w-0 flex-1 sm:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="q"
                  defaultValue={search}
                  placeholder="Search users, documents, waitlist"
                  className="h-9 pl-9"
                />
              </div>
              <Button size="sm" type="submit">
                <Search className="size-4" />
                Search
              </Button>
            </form>
            {search ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/admin">Clear</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline" size="sm">
              <Link href="/documents">Documents</Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Metric icon={Users} label="Users" value={dashboard.metrics.users} />
          <Metric icon={ShieldCheck} label="Admins" value={dashboard.metrics.admins} />
          <Metric icon={FileText} label="Documents" value={dashboard.metrics.documents} />
          <Metric icon={MessageSquare} label="Chats" value={dashboard.metrics.chats} />
          <Metric icon={Mail} label="Waitlist" value={dashboard.metrics.waitlist} />
          <Metric icon={UserCheck} label="Verified" value={dashboard.metrics.verifiedUsers} />
          <Metric icon={Eye} label="Public Docs" value={dashboard.metrics.publicDocuments} />
          <Metric icon={Activity} label="Messages" value={dashboard.metrics.messages} />
          <Metric icon={CreditCard} label="Active Subs" value={dashboard.metrics.activeSubscriptions} />
          <Metric icon={KeyRound} label="Sessions" value={dashboard.metrics.sessions} />
        </section>

        <section className="rounded-lg border bg-background">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <div>
              <h2 className="text-base font-semibold">Users</h2>
              <p className="text-xs text-muted-foreground">Click a user to manage role, plan, credits, verification, and removal.</p>
            </div>
            <Badge variant="outline">{dashboard.users.length} shown</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">User</th>
                  <th className="px-4 py-3 text-left font-medium">Plan & credits</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">Verified</th>
                  <th className="px-4 py-3 text-left font-medium">Usage</th>
                  <th className="px-4 py-3 text-left font-medium">Created</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {dashboard.users.map((user) => (
                  <tr key={user.id} className="align-top">
                    <td className="px-4 py-3">
                      <UserManagementDialog user={user} />
                      <div className="mt-1 font-mono text-xs text-muted-foreground">{shortId(user.id)}</div>
                      {user.username ? (
                        <div className="mt-1 text-xs text-muted-foreground">@{user.username}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {statusBadge(user.subscriptionStatus)}
                        <Badge variant="outline">
                          {user.subscriptionPlan ?? user.creditPlanSnapshot ?? 'free'}
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm font-medium tabular-nums">
                        {(user.creditBalance ?? 0).toLocaleString()} credits
                      </div>
                      <div className="text-xs text-muted-foreground">
                        resets {formatDate(user.creditPeriodEnd)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        {roleBadge(user.role)}
                        <form action={updateUserRoleAction} className="flex gap-2">
                          <input type="hidden" name="userId" value={user.id} />
                          <select
                            name="role"
                            defaultValue={user.role}
                            className="h-8 rounded-md border bg-background px-2 text-xs"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                          <Button size="sm" variant="outline" className="h-8">
                            <ShieldCheck className="size-3.5" />
                            Save
                          </Button>
                        </form>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <form action={updateUserVerificationAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input
                          type="hidden"
                          name="emailVerified"
                          value={String(!user.emailVerified)}
                        />
                        <Button size="sm" variant="outline" className="h-8">
                          <UserCheck className="size-3.5" />
                          {user.emailVerified ? 'Unverify' : 'Verify'}
                        </Button>
                      </form>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div>{user.documentCount} docs</div>
                      <div>{user.chatCount} chats</div>
                      <div>{user.sessionCount} sessions</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <form action={deleteUserAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <ConfirmSubmitButton
                            confirmText={`Delete ${user.email} and all of their documents, chats, sessions, accounts, and subscriptions?`}
                            size="sm"
                            variant="destructive"
                            className="h-8"
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
                {dashboard.users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No users match the current search.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border bg-background">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <div>
              <h2 className="text-base font-semibold">Documents</h2>
              <p className="text-xs text-muted-foreground">Publish state and document removal.</p>
            </div>
            <Badge variant="outline">{dashboard.documents.length} shown</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Document</th>
                  <th className="px-4 py-3 text-left font-medium">Owner</th>
                  <th className="px-4 py-3 text-left font-medium">Visibility</th>
                  <th className="px-4 py-3 text-left font-medium">Updated</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {dashboard.documents.map((document) => (
                  <tr key={document.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{document.title}</div>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>{document.kind}</span>
                        <span className="font-mono">{shortId(document.id)}</span>
                        {document.slug ? <span>/{document.slug}</span> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div>{document.ownerEmail ?? 'Deleted user'}</div>
                      <div className="text-xs">{document.ownerName ?? document.author ?? 'No name'}</div>
                    </td>
                    <td className="px-4 py-3">
                      {document.visibility === 'public' ? (
                        <Badge className="border-cyan-500/30 bg-cyan-500/10 text-cyan-700 hover:bg-cyan-500/10 dark:text-cyan-300">
                          Public
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Private</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(document.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <form action={updateDocumentVisibilityAction}>
                          <input type="hidden" name="documentId" value={document.id} />
                          <input
                            type="hidden"
                            name="visibility"
                            value={document.visibility === 'public' ? 'private' : 'public'}
                          />
                          <Button size="sm" variant="outline" className="h-8">
                            {document.visibility === 'public' ? (
                              <EyeOff className="size-3.5" />
                            ) : (
                              <Eye className="size-3.5" />
                            )}
                            {document.visibility === 'public' ? 'Make private' : 'Make public'}
                          </Button>
                        </form>
                        <form action={deleteDocumentAction}>
                          <input type="hidden" name="documentId" value={document.id} />
                          <ConfirmSubmitButton
                            confirmText={`Delete document "${document.title}"?`}
                            size="sm"
                            variant="destructive"
                            className="h-8"
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
                {dashboard.documents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No documents match the current search.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-lg border bg-background">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h2 className="text-base font-semibold">Chats</h2>
                <p className="text-xs text-muted-foreground">Recent conversations and message volume.</p>
              </div>
              <MessageSquare className="size-4 text-muted-foreground" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Chat</th>
                    <th className="px-4 py-3 text-left font-medium">Owner</th>
                    <th className="px-4 py-3 text-left font-medium">Messages</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {dashboard.chats.map((chat) => (
                    <tr key={chat.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium">{chat.title}</div>
                        <div className="font-mono text-xs text-muted-foreground">{shortId(chat.id)}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{chat.ownerEmail ?? 'Deleted user'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{chat.messageCount}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <form action={deleteChatAction}>
                            <input type="hidden" name="chatId" value={chat.id} />
                            <ConfirmSubmitButton
                              confirmText={`Delete chat "${chat.title}" and its messages? Linked documents will be kept.`}
                              size="sm"
                              variant="destructive"
                              className="h-8"
                            >
                              <Trash2 className="size-3.5" />
                              Delete
                            </ConfirmSubmitButton>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-lg border bg-background">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h2 className="text-base font-semibold">Sessions</h2>
                <p className="text-xs text-muted-foreground">Active and recent login sessions.</p>
              </div>
              <KeyRound className="size-4 text-muted-foreground" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">User</th>
                    <th className="px-4 py-3 text-left font-medium">Client</th>
                    <th className="px-4 py-3 text-left font-medium">Expires</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {dashboard.sessions.map((session) => (
                    <tr key={session.id}>
                      <td className="px-4 py-3">
                        <div>{session.ownerEmail ?? 'Deleted user'}</div>
                        <div className="font-mono text-xs text-muted-foreground">{shortId(session.id)}</div>
                      </td>
                      <td className="max-w-sm px-4 py-3 text-muted-foreground">
                        <div>{session.ipAddress ?? 'No IP'}</div>
                        <div className="truncate text-xs">{session.userAgent ?? 'No user agent'}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(session.expiresAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <form action={revokeSessionAction}>
                            <input type="hidden" name="sessionId" value={session.id} />
                            <ConfirmSubmitButton
                              confirmText={`Revoke session for ${session.ownerEmail ?? session.userId}?`}
                              size="sm"
                              variant="outline"
                              className="h-8"
                            >
                              <KeyRound className="size-3.5" />
                              Revoke
                            </ConfirmSubmitButton>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-lg border bg-background">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h2 className="text-base font-semibold">Subscriptions</h2>
                <p className="text-xs text-muted-foreground">Billing state from the app database.</p>
              </div>
              <CreditCard className="size-4 text-muted-foreground" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Subscriber</th>
                    <th className="px-4 py-3 text-left font-medium">Plan</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Period</th>
                    <th className="px-4 py-3 text-left font-medium">Stripe</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {dashboard.subscriptions.map((subscription) => (
                    <tr key={subscription.id}>
                      <td className="px-4 py-3">
                        <div>{subscription.ownerEmail ?? 'Deleted user'}</div>
                        <div className="font-mono text-xs text-muted-foreground">{shortId(subscription.referenceId)}</div>
                      </td>
                      <td className="px-4 py-3">{subscription.plan}</td>
                      <td className="px-4 py-3">{statusBadge(subscription.status)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div>Renews {formatDate(subscription.periodEnd)}</div>
                        {subscription.cancelAtPeriodEnd ? (
                          <div className="text-xs text-amber-700 dark:text-amber-300">Canceling at period end</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        <div>{shortId(subscription.stripeCustomerId)}</div>
                        <div>{shortId(subscription.stripeSubscriptionId)}</div>
                      </td>
                    </tr>
                  ))}
                  {dashboard.subscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No subscriptions found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-lg border bg-background">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h2 className="text-base font-semibold">Waitlist</h2>
                <p className="text-xs text-muted-foreground">Latest captured emails.</p>
              </div>
              <Mail className="size-4 text-muted-foreground" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[580px] text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Email</th>
                    <th className="px-4 py-3 text-left font-medium">Created</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {dashboard.waitlist.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-4 py-3">{entry.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(entry.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <form action={deleteWaitlistEntryAction}>
                            <input type="hidden" name="waitlistId" value={entry.id} />
                            <ConfirmSubmitButton
                              confirmText={`Remove ${entry.email} from the waitlist?`}
                              size="sm"
                              variant="outline"
                              className="h-8"
                            >
                              <Trash2 className="size-3.5" />
                              Remove
                            </ConfirmSubmitButton>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {dashboard.waitlist.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                        No waitlist entries match the current search.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <footer className="flex items-center gap-2 pb-4 text-xs text-muted-foreground">
          <Database className="size-3.5" />
          <span>Admin actions execute on the server and refresh this console after completion.</span>
        </footer>
      </div>
    </main>
  );
}
