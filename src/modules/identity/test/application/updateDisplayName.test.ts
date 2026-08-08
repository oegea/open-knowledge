import { updateDisplayName } from '../../application/updateDisplayName';
import * as UserMother from '../helpers/UserMother';
import * as UserRepositoryMother from '../helpers/UserRepositoryMother';

describe('updateDisplayName (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sets the friendly name and propagates it to issued certificates', async () => {
    const userRepository = UserRepositoryMother.create({
      findById: jest.fn().mockResolvedValue(UserMother.create()),
    });
    const onDisplayNameChanged = jest.fn().mockResolvedValue(undefined);

    const updated = await updateDisplayName({
      userId: 'user-1',
      displayName: '  Ada Lovelace  ',
      userRepository,
      onDisplayNameChanged,
    });

    expect(updated.getDisplayName()).toBe('Ada Lovelace');
    expect(updated.getCertificateName()).toBe('Ada Lovelace');
    expect(userRepository.save).toHaveBeenCalledWith(updated);
    expect(onDisplayNameChanged).toHaveBeenCalledWith('user-1', 'Ada Lovelace');
  });

  it('clears the name with an empty string, falling back to the identifier', async () => {
    const userRepository = UserRepositoryMother.create({
      findById: jest.fn().mockResolvedValue(UserMother.create({ displayName: 'Ada' })),
    });

    const updated = await updateDisplayName({
      userId: 'user-1',
      displayName: '',
      userRepository,
    });

    expect(updated.getDisplayName()).toBe('');
    expect(updated.getCertificateName()).toBe('Erudito#4821');
  });

  it('rejects names over 100 characters', async () => {
    const userRepository = UserRepositoryMother.create({
      findById: jest.fn().mockResolvedValue(UserMother.create()),
    });

    await expect(
      updateDisplayName({ userId: 'user-1', displayName: 'x'.repeat(101), userRepository })
    ).rejects.toThrow('[User] displayName cannot exceed 100 characters');
  });

  it('throws for unknown users', async () => {
    await expect(
      updateDisplayName({
        userId: 'missing',
        displayName: 'Ada',
        userRepository: UserRepositoryMother.create(),
      })
    ).rejects.toThrow('[updateDisplayName] User with id missing not found');
  });
});
