import { CustomClient } from '../structures/CustomClient';
import { startStreamPolling } from '../utils/streamNotifier';
import { config } from '../config';

export function register(client: CustomClient): void {
  client.on('ready', () => {
    if (!config.TWITCH_CLIENT_ID || !config.TWITCH_CLIENT_SECRET) {
      console.log('[Stream] Notificações de stream desativadas: credenciais da Twitch não configuradas.');
      return;
    }

    if (!config.STREAM_NOTIFICATION_CHANNEL_ID) {
      console.log('[Stream] Notificações de stream desativadas: canal de notificação não configurado.');
      return;
    }

    startStreamPolling(client);
  });
}
