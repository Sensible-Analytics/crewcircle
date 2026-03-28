import { clerkClient } from '@clerk/nextjs/server';
import { auth } from '@clerk/nextjs/server';

export { clerkClient, auth };

export async function getUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

export async function requireUserId(): Promise<string> {
  const userId = await getUserId();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
}
