import { User } from '../domain/User';
import { UserRepository } from '../domain/UserRepository';

interface promoteUserToAdminProps {
  userId: string;
  userRepository: UserRepository;
}

export async function promoteUserToAdmin({
  userId,
  userRepository,
}: promoteUserToAdminProps): Promise<User> {
  const user = await userRepository.findById(userId);
  if (user === null) {
    throw new Error(`[promoteUserToAdmin] User with id ${userId} not found`);
  }
  if (user.isAdmin()) {
    return user;
  }
  return await userRepository.save(user.promoteToAdmin());
}
