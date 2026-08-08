import { User } from '../domain/User';
import { UserRepository } from '../domain/UserRepository';

interface updateDisplayNameProps {
  userId: string;
  displayName: string;
  userRepository: UserRepository;
  /** Port: keeps already-issued certificates in sync with the new name. */
  onDisplayNameChanged?: (userId: string, displayName: string) => Promise<void>;
}

/**
 * Sets (or clears, with an empty string) the learner's optional friendly
 * name. Its only purpose is to feature a real name on certificates; nothing
 * else in the platform uses it.
 */
export async function updateDisplayName({
  userId,
  displayName,
  userRepository,
  onDisplayNameChanged,
}: updateDisplayNameProps): Promise<User> {
  if (!userId) {
    throw new Error('[updateDisplayName] User id must be provided');
  }

  const user = await userRepository.findById(userId);
  if (user === null) {
    throw new Error(`[updateDisplayName] User with id ${userId} not found`);
  }

  const saved = await userRepository.save(user.setDisplayName(displayName));

  if (onDisplayNameChanged) {
    await onDisplayNameChanged(userId, saved.getDisplayName());
  }

  return saved;
}
