import { revokeCertificate } from '../../application/revokeCertificate';
import * as CertificateRepositoryMother from '../helpers/CertificateRepositoryMother';

describe('revokeCertificate (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes the certificate', async () => {
    const certificateRepository = CertificateRepositoryMother.create();

    await revokeCertificate({ certificateId: 'cert-1', certificateRepository });

    expect(certificateRepository.delete).toHaveBeenCalledWith('cert-1');
  });

  it('throws when the certificate does not exist', async () => {
    const certificateRepository = CertificateRepositoryMother.create({
      delete: jest.fn().mockResolvedValue(false),
    });

    await expect(
      revokeCertificate({ certificateId: 'missing', certificateRepository })
    ).rejects.toThrow('[revokeCertificate] Certificate with id missing not found');
  });

  it('requires an id', async () => {
    await expect(
      revokeCertificate({
        certificateId: '',
        certificateRepository: CertificateRepositoryMother.create(),
      })
    ).rejects.toThrow('[revokeCertificate] Certificate id must be provided');
  });
});
