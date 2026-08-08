import { User } from '../domain/User';
import { UserRepository } from '../domain/UserRepository';

interface listUsersProps {
  userRepository: UserRepository;
}

export async function listUsers({ userRepository }: listUsersProps): Promise<User[]> {
  return await userRepository.findAll();
}
