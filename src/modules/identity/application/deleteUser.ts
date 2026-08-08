import { UserRepository } from '../domain/UserRepository';

interface deleteUserProps {
  userId: string;
  /** The administrator performing the deletion. */
  actingUserId: string;
  userRepository: UserRepository;
  /** Port: lets other modules clean up data tied to the user. */
  onUserDeleted?: (userId: string) => Promise<void>;
}

/**
 * Permanently removes a user. Sessions, progress, exam results and
 * certificates go with it (database-level cascade); anything without a
 * foreign key is cleaned up through the port. Admins cannot delete their
 * own account, which also guarantees at least one admin always remains.
 */
export async function deleteUser({
  userId,
  actingUserId,
  userRepository,
  onUserDeleted,
}: deleteUserProps): Promise<void> {
  if (userId === actingUserId) {
    throw new Error('[deleteUser] Administrators cannot delete their own account');
  }

  const user = await userRepository.findById(userId);
  if (user === null) {
    throw new Error(`[deleteUser] User with id ${userId} not found`);
  }

  await userRepository.delete(userId);

  if (onUserDeleted) {
    await onUserDeleted(userId);
  }
}
