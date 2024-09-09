import EventHandlerInterface from "../../../@shared/event/event-handler.interface";
import EventCreated from '../../../customer/event/customer-created.event';

export default class SendEmailWhenProductIsCreatedHandler
  implements EventHandlerInterface<EventCreated>
{
  handle(event: EventCreated): void {
    console.log(`Sending email to .....`); 
  }
}
