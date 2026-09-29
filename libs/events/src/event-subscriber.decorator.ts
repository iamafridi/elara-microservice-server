import { SetMetadata } from '@nestjs/common';

export const EVENT_SUBSCRIBER_KEY = 'event_subscriber';

export interface EventSubscriberOptions {
  events: string[];
}

export const EventSubscriber = (events: string[]): ClassDecorator => {
  return SetMetadata(EVENT_SUBSCRIBER_KEY, { events });
};

export const OnEvent = (eventName: string): MethodDecorator => {
  return SetMetadata('event_handler', eventName);
};
