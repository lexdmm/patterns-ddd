import EventHandlerInterface from '../../../@shared/event/event-handler.interface';
import EventCreated from '../customer-created.event';

export default class NotifyWhenCustomerIsCreated2Handler
  implements EventHandlerInterface<EventCreated>
{
  handle(event: EventCreated): void {
    console.log('Esse é o segundo console.log do evento: CustomerCreated'); 
  }
}