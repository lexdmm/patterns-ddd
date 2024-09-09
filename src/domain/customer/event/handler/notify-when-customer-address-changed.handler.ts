import EventHandlerInterface from '../../../@shared/event/event-handler.interface';
import EventCreated from '../customer-created.event';

export default class NotifyWhenCustomerAddressChangedHandler 
  implements EventHandlerInterface<EventCreated>
{
  handle(event: EventCreated): void {
    const address = `${event.eventData.Address.street}, ${event.eventData.Address.number}, ${event.eventData.Address.zip}, ${event.eventData.Address.city}`
    console.log(`Aterando endereço do cliente ${event.eventData.id} - ${event.eventData.name} para: ${address}`);
  }
}