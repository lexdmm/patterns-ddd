import { Sequelize } from "sequelize-typescript";
import EventDispatcher from '../../@shared/event/event-dispatcher';
import Customer from '../entity/customer';
import CustomerModel from '../repository/sequelize/customer.model';
import Address from '../value-object/address';
import CustomerCreatedEvent from './customer-created.event';
import NotifyWhenCustomerIsCreated1Handler from './handler/notify-when-customer-is-created-1.handler';
import NotifyWhenCustomerIsCreated2Handler from './handler/notify-when-customer-is-created-2.handler';
import CustomerRepository from '../repository/sequelize/customer.repository';
import NotifyWhenCustomerAddressChangedHandler from './handler/notify-when-customer-address-changed.handler';
import CustomerCreatedChangeAddressEvent from './customer-created-change-address.event';

describe("Domain events tests", () => {
  let sequelize: Sequelize;
  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    sequelize.addModels([CustomerModel]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should register customer created event handler", () => {
    const eventDispatcher = new EventDispatcher();
    const eventHandler1 = new NotifyWhenCustomerIsCreated1Handler();


    eventDispatcher.register("CustomerCreatedEvent", eventHandler1);

    expect(
      eventDispatcher.getEventHandlers["CustomerCreatedEvent"]
    ).toBeDefined();
    expect(eventDispatcher.getEventHandlers["CustomerCreatedEvent"].length).toBe(1);
    expect(eventDispatcher.getEventHandlers["CustomerCreatedEvent"][0]).toMatchObject(eventHandler1);

    const eventHandler2 = new NotifyWhenCustomerIsCreated2Handler();
    eventDispatcher.register("CustomerCreatedEvent", eventHandler2);
    expect(eventDispatcher.getEventHandlers["CustomerCreatedEvent"].length).toBe(2);
    expect(eventDispatcher.getEventHandlers["CustomerCreatedEvent"][1]).toMatchObject(eventHandler2);

  });

  it("should notify customer created event handlers", async () => {
    const eventDispatcher = new EventDispatcher();
    const eventMessage1Handler = new NotifyWhenCustomerIsCreated1Handler();
    const eventMessage2Handler = new NotifyWhenCustomerIsCreated2Handler();

    const spy1EventHandler = jest.spyOn(eventMessage1Handler, "handle");
    const spy2EventHandler = jest.spyOn(eventMessage2Handler, "handle");


    eventDispatcher.register("CustomerCreatedEvent", eventMessage1Handler);
    expect(eventDispatcher.getEventHandlers["CustomerCreatedEvent"][0]).toMatchObject(eventMessage1Handler);

    eventDispatcher.register("CustomerCreatedEvent", eventMessage2Handler);
    expect(eventDispatcher.getEventHandlers["CustomerCreatedEvent"][1]).toMatchObject(eventMessage2Handler);

    const customerRepository = new CustomerRepository();
    const customer = new Customer("1", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.address = address;
    customer.addRewardPoints(10);
    customer.activate();

    await customerRepository.create(customer);

    const customerCreatedEvent = new CustomerCreatedEvent(customer);


    eventDispatcher.notify(customerCreatedEvent);

    expect(spy1EventHandler).toHaveBeenCalled();
    expect(spy2EventHandler).toHaveBeenCalled();
  });

  it("should notify customer change address event handlers", async () => {
    const eventDispatcher = new EventDispatcher();
  
    const eventMessageHandler1 = new NotifyWhenCustomerIsCreated1Handler();
    const spyEventHandler = jest.spyOn(eventMessageHandler1, "handle");
    eventDispatcher.register("CustomerCreatedEvent", eventMessageHandler1);
    expect(eventDispatcher.getEventHandlers["CustomerCreatedEvent"][0]).toMatchObject(eventMessageHandler1);

    const eventMessageHandlerChangeAddress = new NotifyWhenCustomerAddressChangedHandler();
    const spyEventChangeAddressHandler = jest.spyOn(eventMessageHandlerChangeAddress, "handle");
    eventDispatcher.register("CustomerCreatedChangeAddressEvent", eventMessageHandlerChangeAddress);
    expect(eventDispatcher.getEventHandlers["CustomerCreatedChangeAddressEvent"][0]).toMatchObject(eventMessageHandlerChangeAddress);

    const customerRepository = new CustomerRepository();
    const customer = new Customer("1", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.address = address;
    customer.addRewardPoints(10);
    customer.activate();

    await customerRepository.create(customer);
    const customerCreatedEvent = new CustomerCreatedEvent(customer);
    eventDispatcher.notify(customerCreatedEvent);

    const address2 = new Address("Street 2", 2, "Zipcode 2", "City 2");
    customer.changeAddress(address2)

    const customerChangeAddresEvent = new CustomerCreatedChangeAddressEvent(customer);
    eventDispatcher.notify(customerChangeAddresEvent);

    expect(spyEventChangeAddressHandler).toHaveBeenCalled();
    expect(spyEventHandler).toHaveBeenCalled()
    
  });

  it("should unregister all event handlers", () => {
    const eventDispatcher = new EventDispatcher();
    const eventHandler2 = new NotifyWhenCustomerIsCreated1Handler();
    const eventHandler3 = new NotifyWhenCustomerIsCreated2Handler();

    eventDispatcher.register("CustomerCreatedEvent", eventHandler2);
    expect(eventDispatcher.getEventHandlers["CustomerCreatedEvent"][0]).toMatchObject(eventHandler2);

    eventDispatcher.register("CustomerCreatedEvent", eventHandler3);
    expect(eventDispatcher.getEventHandlers["CustomerCreatedEvent"][1]).toMatchObject(eventHandler3);

    eventDispatcher.unregisterAll();

    expect(eventDispatcher.getEventHandlers["ProductCreatedEvent"]).toBeUndefined();
  });
})