import { listUsers } from '../../application/listUsers';
import { promoteUserToAdmin } from '../../application/promoteUserToAdmin';
import { deleteUser } from '../../application/deleteUser';
import * as UserMother from '../helpers/UserMother';
import * as UserRepositoryMother from '../helpers/UserRepositoryMother';

describe('manage users (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listUsers', () => {
    it('returns every registered user', async () => {
      const users = [UserMother.create(), UserMother.create({ id: 'user-2', identifier: 'Atlas#1111' })];
      const userRepository = UserRepositoryMother.create({
        findAll: jest.fn().mockResolvedValue(users),
      });

      expect(await listUsers({ userRepository })).toEqual(users);
    });
  });

  describe('promoteUserToAdmin', () => {
    it('promotes a regular user and saves it', async () => {
      const userRepository = UserRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(UserMother.create({ isAdmin: false })),
      });

      const promoted = await promoteUserToAdmin({ userId: 'user-1', userRepository });

      expect(promoted.isAdmin()).toBe(true);
      expect(userRepository.save).toHaveBeenCalledWith(promoted);
    });

    it('leaves an existing admin untouched', async () => {
      const admin = UserMother.create({ isAdmin: true });
      const userRepository = UserRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(admin),
      });

      const result = await promoteUserToAdmin({ userId: 'user-1', userRepository });

      expect(result).toBe(admin);
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('throws for unknown users', async () => {
      await expect(
        promoteUserToAdmin({ userId: 'missing', userRepository: UserRepositoryMother.create() })
      ).rejects.toThrow('[promoteUserToAdmin] User with id missing not found');
    });
  });

  describe('deleteUser', () => {
    it('deletes the user and lets other modules clean up through the port', async () => {
      const userRepository = UserRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(UserMother.create()),
      });
      const onUserDeleted = jest.fn().mockResolvedValue(undefined);

      await deleteUser({ userId: 'user-1', actingUserId: 'admin-1', userRepository, onUserDeleted });

      expect(userRepository.delete).toHaveBeenCalledWith('user-1');
      expect(onUserDeleted).toHaveBeenCalledWith('user-1');
    });

    it('refuses to delete the acting administrator itself', async () => {
      const userRepository = UserRepositoryMother.create();

      await expect(
        deleteUser({ userId: 'admin-1', actingUserId: 'admin-1', userRepository })
      ).rejects.toThrow('[deleteUser] Administrators cannot delete their own account');
      expect(userRepository.delete).not.toHaveBeenCalled();
    });

    it('throws for unknown users', async () => {
      await expect(
        deleteUser({
          userId: 'missing',
          actingUserId: 'admin-1',
          userRepository: UserRepositoryMother.create(),
        })
      ).rejects.toThrow('[deleteUser] User with id missing not found');
    });
  });
});
