import { Injectable } from '@nestjs/common';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

@Injectable()
export class PushNotificationService {
  private expo = new Expo();

  async sendNotifications(tokens: string[], title: string, body: string, data?: any) {
    if (!tokens || tokens.length === 0) return;

    const messages: ExpoPushMessage[] = [];
    
    for (const pushToken of tokens) {
      if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`Push token ${pushToken} is not a valid Expo push token`);
        continue;
      }
      messages.push({
        to: pushToken,
        sound: 'default',
        title,
        body,
        data,
      });
    }

    const chunks = this.expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        const ticketChunks = await this.expo.sendPushNotificationsAsync(chunk);
        console.log('Push notification tickets:', ticketChunks);
        for (const ticket of ticketChunks) {
          if (ticket.status === 'error') {
            console.error('Expo Push Error (Ticket):', ticket.message);
            if (ticket.details && (ticket.details as any).error) {
              console.error('Expo Push Error Code:', (ticket.details as any).error);
            }
          }
        }
      } catch (error) {
        console.error('Exception sending push notification chunk:', error);
      }
    }
  }
}
