import { loginUser } from '../../application/loginUser';
import { createSession, hashSessionToken } from '../../application/createSession';
import { getSessionUser } from '../../application/getSessionUser';
import { deleteSession } from '../../application/deleteSession';
import { Session } from '../../domain/Session';
import * as UserMother from '../helpers/UserMother';
import * as UserRepositoryMother from '../helpers/UserRepositoryMother';
import * as TotpRepositoryMother from '../helpers/TotpRepositoryMother';
import * as SessionRepositoryMother from '../helpers/SessionRepositoryMother';

describe('login and sessions (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loginUser', () => {
    it('returns the user for valid credentials', async () => {
      const user = UserMother.create();
      const userRepository = UserRepositoryMother.create({
        findByIdentifier: jest.fn().mockResolvedValue(user),
      });

      const result = await loginUser({
        identifier: 'Erudito#4821',
        code: '123456',
        userRepository,
        totpRepository: TotpRepositoryMother.create(),
      });

      expect(result).toBe(user);
    });

    it('uses the same error for unknown identifier and wrong code', async () => {
      const unknownError = loginUser({
        identifier: 'Nadie#999',
        code: '123456',
        userRepository: UserRepositoryMother.create(),
        totpRepository: TotpRepositoryMother.create(),
      });
      await expect(unknownError).rejects.toThrow(
        '[loginUser] Invalid identifier or verification code'
      );

      const wrongCodeError = loginUser({
        identifier: 'Erudito#4821',
        code: '000000',
        userRepository: UserRepositoryMother.create({
          findByIdentifier: jest.fn().mockResolvedValue(UserMother.create()),
        }),
        totpRepository: TotpRepositoryMother.create({
          verify: jest.fn().mockReturnValue(false),
        }),
      });
      await expect(wrongCodeError).rejects.toThrow(
        '[loginUser] Invalid identifier or verification code'
      );
    });
  });

  describe('createSession / getSessionUser / deleteSession', () => {
    it('creates a session and resolves the user from its token', async () => {
      const user = UserMother.create();
      const sessionRepository = SessionRepositoryMother.create();
      const { token, session } = await createSession({ userId: 'user-1', sessionRepository });

      expect(session.getTokenHash()).toBe(hashSessionToken(token));
      expect(sessionRepository.save).toHaveBeenCalledWith(session);

      const userRepository = UserRepositoryMother.create({
        findById: jest.fn().mockResolvedValue(user),
      });
      const resolved = await getSessionUser({
        token,
        sessionRepository: SessionRepositoryMother.create({
          findByTokenHash: jest.fn().mockResolvedValue(session),
        }),
        userRepository,
      });

      expect(resolved).toBe(user);
      expect(userRepository.findById).toHaveBeenCalledWith('user-1');
    });

    it('returns null and cleans up for expired sessions', async () => {
      const expired = Session.create('hash', 'user-1', new Date(Date.now() - 1000));
      const sessionRepository = SessionRepositoryMother.create({
        findByTokenHash: jest.fn().mockResolvedValue(expired),
      });

      const resolved = await getSessionUser({
        token: 'whatever',
        sessionRepository,
        userRepository: UserRepositoryMother.create(),
      });

      expect(resolved).toBeNull();
      expect(sessionRepository.delete).toHaveBeenCalledWith('hash');
    });

    it('returns null without a token', async () => {
      const resolved = await getSessionUser({
        token: null,
        sessionRepository: SessionRepositoryMother.create(),
        userRepository: UserRepositoryMother.create(),
      });
      expect(resolved).toBeNull();
    });

    it('deletes the session by token hash', async () => {
      const sessionRepository = SessionRepositoryMother.create();
      await deleteSession({ token: 'abc', sessionRepository });
      expect(sessionRepository.delete).toHaveBeenCalledWith(hashSessionToken('abc'));
    });
  });
});
