'use server';

import { revalidatePath } from 'next/cache';
import {
  ADMIN_ROLE,
  USER_ROLE,
  deleteChatByAdmin,
  deleteDocumentByAdmin,
  deleteUserCascade,
  deleteWaitlistEntryByAdmin,
  revokeSessionByAdmin,
  setDocumentVisibility,
  setUserEmailVerified,
  setUserRole,
  type AdminRole,
} from '@/lib/admin';

function readRequired(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== 'string' || !value) {
    throw new Error(`Missing ${key}`);
  }
  return value;
}

function refreshAdmin() {
  revalidatePath('/admin');
}

export async function updateUserRoleAction(formData: FormData) {
  const userId = readRequired(formData, 'userId');
  const role = readRequired(formData, 'role') as AdminRole;

  if (role !== ADMIN_ROLE && role !== USER_ROLE) {
    throw new Error('Invalid role');
  }

  await setUserRole({ userId, role });
  refreshAdmin();
}

export async function updateUserVerificationAction(formData: FormData) {
  const userId = readRequired(formData, 'userId');
  const emailVerified = readRequired(formData, 'emailVerified') === 'true';

  await setUserEmailVerified({ userId, emailVerified });
  refreshAdmin();
}

export async function deleteUserAction(formData: FormData) {
  const userId = readRequired(formData, 'userId');

  await deleteUserCascade({ userId });
  refreshAdmin();
}

export async function updateDocumentVisibilityAction(formData: FormData) {
  const documentId = readRequired(formData, 'documentId');
  const visibility = readRequired(formData, 'visibility');

  if (visibility !== 'public' && visibility !== 'private') {
    throw new Error('Invalid visibility');
  }

  await setDocumentVisibility({ documentId, visibility });
  refreshAdmin();
}

export async function deleteDocumentAction(formData: FormData) {
  const documentId = readRequired(formData, 'documentId');

  await deleteDocumentByAdmin({ documentId });
  refreshAdmin();
}

export async function deleteChatAction(formData: FormData) {
  const chatId = readRequired(formData, 'chatId');

  await deleteChatByAdmin({ chatId });
  refreshAdmin();
}

export async function revokeSessionAction(formData: FormData) {
  const sessionId = readRequired(formData, 'sessionId');

  await revokeSessionByAdmin({ sessionId });
  refreshAdmin();
}

export async function deleteWaitlistEntryAction(formData: FormData) {
  const waitlistId = readRequired(formData, 'waitlistId');

  await deleteWaitlistEntryByAdmin({ waitlistId });
  refreshAdmin();
}
