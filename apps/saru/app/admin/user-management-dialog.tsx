'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  Coins,
  CreditCard,
  History,
  ShieldCheck,
  Trash2,
  UserCheck,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  addUserCreditsAction,
  deleteUserAction,
  updateUserPlanAction,
  updateUserRoleAction,
  updateUserVerificationAction,
} from './actions';
import { ConfirmSubmitButton } from './confirm-submit-button';
import {
  CreditTransactionsList,
  type CreditTransactionItem,
} from '@/components/credit-transactions-list';
import { fetcher } from '@/lib/utils';

type TransactionsResponse = {
  transactions: CreditTransactionItem[];
};

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  stripeCustomerId: string | null;
  documentCount: number;
  chatCount: number;
  sessionCount: number;
  subscriptionStatus: string | null;
  subscriptionPlan: string | null;
  creditBalance: number | null;
  creditPlanSnapshot: string | null;
  creditPeriodEnd: Date | string | null;
};

function normalizePlan(plan: string | null | undefined) {
  if (!plan) return 'free';
  const lower = plan.toLowerCase();
  if (lower === 'saru' || lower === 'pro') return 'premium';
  if (lower === 'premium' || lower === 'ultra') return lower;
  return 'free';
}

function formatDate(value?: Date | string | null) {
  if (!value) return 'None';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function shortId(value?: string | null) {
  if (!value) return 'None';
  if (value.length <= 16) return value;
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

export function UserManagementDialog({ user }: { user: ManagedUser }) {
  const [open, setOpen] = useState(false);
  const effectivePlan = normalizePlan(user.subscriptionPlan ?? user.creditPlanSnapshot);
  const balance = user.creditBalance ?? 0;

  const { data: transactionsData, isLoading: isTransactionsLoading, error: transactionsError } =
    useSWR<TransactionsResponse>(
      open ? `/api/admin/users/${user.id}/credit-transactions` : null,
      fetcher
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="block w-full rounded-md text-left transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="block px-2 py-1">
            <span className="block font-medium">{user.name}</span>
            <span className="block text-muted-foreground">{user.email}</span>
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[88dvh] max-w-3xl overflow-y-auto p-0">
        <DialogHeader className="border-b px-6 py-5">
          <div className="flex flex-col gap-3 pr-8 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <DialogTitle className="text-xl">Manage user</DialogTitle>
              <DialogDescription className="mt-1">
                {user.email} · {shortId(user.id)}
              </DialogDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                {user.role}
              </Badge>
              <Badge variant={user.emailVerified ? 'outline' : 'destructive'}>
                {user.emailVerified ? 'verified' : 'unverified'}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-5 px-6 py-5 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-muted-foreground" />
              <h3 className="font-semibold">Access</h3>
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="grid grid-cols-2 gap-3 rounded-md bg-muted/50 p-3">
                <div>
                  <div className="text-xs text-muted-foreground">Documents</div>
                  <div className="font-medium tabular-nums">{user.documentCount}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Chats</div>
                  <div className="font-medium tabular-nums">{user.chatCount}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Sessions</div>
                  <div className="font-medium tabular-nums">{user.sessionCount}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Updated</div>
                  <div className="font-medium">{formatDate(user.updatedAt)}</div>
                </div>
              </div>

              <form action={updateUserRoleAction} className="grid gap-2">
                <input type="hidden" name="userId" value={user.id} />
                <label className="text-xs font-medium text-muted-foreground" htmlFor={`role-${user.id}`}>
                  Role
                </label>
                <div className="flex gap-2">
                  <select
                    id={`role-${user.id}`}
                    name="role"
                    defaultValue={user.role}
                    className="h-9 flex-1 rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <Button size="sm" variant="outline">
                    <ShieldCheck className="size-4" />
                    Save
                  </Button>
                </div>
              </form>

              <form action={updateUserVerificationAction}>
                <input type="hidden" name="userId" value={user.id} />
                <input
                  type="hidden"
                  name="emailVerified"
                  value={String(!user.emailVerified)}
                />
                <Button size="sm" variant="outline" className="w-full">
                  <UserCheck className="size-4" />
                  {user.emailVerified ? 'Mark email unverified' : 'Mark email verified'}
                </Button>
              </form>
            </div>
          </section>

          <section className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-muted-foreground" />
              <h3 className="font-semibold">Plan</h3>
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="rounded-md bg-muted/50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">Current plan</span>
                  <Badge variant="outline">{effectivePlan}</Badge>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Status: {user.subscriptionStatus ?? 'none'}
                </div>
                <div className="text-xs text-muted-foreground">
                  Credit period ends: {formatDate(user.creditPeriodEnd)}
                </div>
              </div>

              <form action={updateUserPlanAction} className="grid gap-2">
                <input type="hidden" name="userId" value={user.id} />
                <label className="text-xs font-medium text-muted-foreground" htmlFor={`plan-${user.id}`}>
                  Set plan
                </label>
                <div className="flex gap-2">
                  <select
                    id={`plan-${user.id}`}
                    name="plan"
                    defaultValue={effectivePlan}
                    className="h-9 flex-1 rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="free">Free</option>
                    <option value="premium">Premium</option>
                    <option value="ultra">Ultra</option>
                  </select>
                  <ConfirmSubmitButton
                    confirmText={`Change ${user.email}'s plan? This refills credits to the selected plan allowance.`}
                    size="sm"
                    variant="outline"
                  >
                    <CreditCard className="size-4" />
                    Save
                  </ConfirmSubmitButton>
                </div>
              </form>
            </div>
          </section>

          <section className="rounded-lg border p-4 lg:col-span-2">
            <div className="flex items-center gap-2">
              <Coins className="size-4 text-muted-foreground" />
              <h3 className="font-semibold">Credits</h3>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-[220px_1fr]">
              <div className="rounded-md bg-muted/50 p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Balance
                </div>
                <div className="mt-2 text-3xl font-semibold tabular-nums">
                  {balance.toLocaleString()}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Snapshot: {user.creditPlanSnapshot ?? 'none'}
                </div>
              </div>

              <form action={addUserCreditsAction} className="grid gap-3 rounded-md border p-4">
                <input type="hidden" name="userId" value={user.id} />
                <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
                  <div className="grid gap-2">
                    <label className="text-xs font-medium text-muted-foreground" htmlFor={`credits-${user.id}`}>
                      Add credits
                    </label>
                    <Input
                      id={`credits-${user.id}`}
                      name="amount"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="100"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-medium text-muted-foreground" htmlFor={`note-${user.id}`}>
                      Note
                    </label>
                    <Input
                      id={`note-${user.id}`}
                      name="note"
                      placeholder="Manual adjustment, support credit, etc."
                    />
                  </div>
                </div>
                <Button size="sm" className="justify-self-start">
                  <Coins className="size-4" />
                  Add credits
                </Button>
              </form>
            </div>

            <div className="mt-4 rounded-md border">
              <div className="flex items-center gap-2 border-b px-4 py-3">
                <History className="size-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold">Transactions</h4>
                <span className="text-xs text-muted-foreground">Last 100</span>
              </div>
              <div className="max-h-64 overflow-y-auto px-1 py-1">
                <CreditTransactionsList
                  transactions={transactionsData?.transactions}
                  isLoading={isTransactionsLoading}
                  error={Boolean(transactionsError)}
                  emptyMessage="No credit transactions for this user."
                />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-destructive/30 p-4 lg:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-destructive">Danger zone</h3>
                <p className="text-sm text-muted-foreground">
                  Deletes this user and cascades their app data.
                </p>
              </div>
              <form action={deleteUserAction}>
                <input type="hidden" name="userId" value={user.id} />
                <ConfirmSubmitButton
                  confirmText={`Delete ${user.email} and all of their documents, chats, sessions, accounts, credits, and subscriptions?`}
                  size="sm"
                  variant="destructive"
                >
                  <Trash2 className="size-4" />
                  Delete user
                </ConfirmSubmitButton>
              </form>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
