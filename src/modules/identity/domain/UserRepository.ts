import { User } from './User';

export interface UserRepository {
  save(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByIdentifier(identifier: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  countUsers(): Promise<number>;
  delete(id: string): Promise<boolean>;
}
