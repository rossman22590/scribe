export const CREDIT_REASON_LABELS: Record<string, string> = {
  period_refill: 'Monthly refill',
  chat: 'Chat',
  suggestion: 'Suggestion',
  inline_suggestion: 'Inline suggestion',
  user_style: 'Style analysis',
  admin_credit_grant: 'Admin credit grant',
};

export const formatCreditTransactionReason = (
  reason: string,
  metadata: Record<string, unknown> | null
): string => {
  if (reason === 'admin_credit_grant') {
    const note = metadata?.note;
    if (typeof note === 'string' && note.length > 0) {
      return `Admin grant · ${note}`;
    }
    const adminEmail = metadata?.adminEmail;
    if (typeof adminEmail === 'string' && adminEmail.length > 0) {
      return `Admin grant · ${adminEmail}`;
    }
  }

  const label = CREDIT_REASON_LABELS[reason] ?? reason.replace(/_/g, ' ');
  const modelId = metadata?.modelId;
  if (typeof modelId === 'string' && modelId.length > 0) {
    return `${label} · ${modelId.replace(/^chat-model-/, '')}`;
  }
  return label;
};

export const formatCreditTransactionDate = (dateString: string): string =>
  new Date(dateString).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
