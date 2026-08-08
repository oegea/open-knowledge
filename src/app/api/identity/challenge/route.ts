import QRCode from 'qrcode';
import identityFactory from '@/modules/identity/application/factory';
import settingsFactory from '@/modules/settings/application/factory';
import { apiError } from '../../apiError';

export async function POST() {
  try {
    const settings = await settingsFactory.getInstanceSettings();
    const hasUsers = await identityFactory.hasUsers();
    if (hasUsers && !settings.isRegistrationOpen()) {
      return Response.json({ error: 'Registration is closed on this instance' }, { status: 403 });
    }

    const challenge = await identityFactory.generateRegistrationChallenge();
    const qrDataUrl = await QRCode.toDataURL(challenge.otpauthUri, { margin: 1, width: 320 });

    return Response.json({ ...challenge, qrDataUrl });
  } catch (error) {
    return apiError(error);
  }
}
