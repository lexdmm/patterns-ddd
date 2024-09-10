import { Sequelize } from "sequelize-typescript";
import Order from "../../../order/entity/order";
import OrderItem from "../../../order/entity/order_item";
import Customer from "../../../customer/entity/customer";
import Address from "../../../customer/value-object/address";
import Product from "../../../product/entity/product";
import CustomerModel from "../../customer/sequelize/customer.model";
import CustomerRepository from "../../customer/sequelize/customer.repository";
import ProductModel from "../../product/sequelize/product.model";
import ProductRepository from "../../product/sequelize/product.repository";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepository from "./order.repository";

describe("Order repository test", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    sequelize.addModels([
      CustomerModel,
      OrderModel,
      OrderItemModel,
      ProductModel,
    ]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should create a new order", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("1", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("1", "Product 1", 10);
    await productRepository.create(product);

    const orderItem = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      2
    );

    const order = new Order("1", "1", [orderItem]);
    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "1",
      customer_id: "1",
      total: order.totalEntity(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: order.id,
          product_id: product.id,
        },
      ],
    });
  });

  it("should update an order", async () => {
    const customerRepository = new CustomerRepository();
    const customer1 = new Customer("1", "Customer 1");
    const address1 = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer1.address = address1;
    await customerRepository.create(customer1);

    const customer2 = new Customer("2", "Customer 2");
    const address2 = new Address("Street 2", 1, "Zipcode 2", "City 2");
    customer2.address = address2;
    await customerRepository.create(customer2);

    const productRepository = new ProductRepository();
    const product = new Product("1", "Product 1", 10);
    await productRepository.create(product);

    const orderItem = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      2
    );

    const orderItem2 = new OrderItem(
      "2",
      product.name,
      product.price,
      product.id,
      1
    );
    
    const orderRepository = new OrderRepository();
    const order = new Order("1", customer1.id, [orderItem]);
    await orderRepository.create(order);

    order.updateCustomer(customer2.id);

    order.addOrderItem(orderItem2);

    await orderRepository.update(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    }); 

    expect(orderModel.toJSON()).toStrictEqual({
      id: order.id,
      customer_id: customer2.id,
      total: order.totalEntity(),
      items: [{
        id: orderItem.id,
        name: orderItem.name,
        price: orderItem.price,
        quantity: orderItem.quantity,
        order_id: order.id,
        product_id: product.id
      }, {
        id: orderItem2.id,
        name: orderItem2.name,
        price: orderItem2.price,
        quantity: orderItem2.quantity,
        order_id: order.id,
        product_id: product.id
      }]
    })
  })

  it("should not update an order if some error occurs on update process", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("1", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.address = address;

    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("1", "Product 1", 10);
    await productRepository.create(product);

    const orderItem = new OrderItem("1", product.name, product.price, product.id, 2);
    
    
    const order = new Order("1", customer.id, [orderItem]);
    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const inexistentCustomerId = "2";

    order.updateCustomer(inexistentCustomerId);

    await expect(async ()=> {
      await orderRepository.update(order);
    }).rejects.toThrow("Error updating order");

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
    })

    expect(orderModel.customer_id).toBe(customer.id);
  })

  it("should find an order by id", async () => {
    const customerRepository = new CustomerRepository();
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    const customer = new Customer("1", "Customer 1");
    customer.address = address;

    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("1", "Product 1", 10);
    await productRepository.create(product);

    const orderItem = new OrderItem("1", product.name, product.price, product.id, 2);
   
    const order = new Order("1", customer.id, [orderItem]);
    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"]
    })

    const orderFound = await orderRepository.find(order.id);

    expect(orderModel.toJSON()).toStrictEqual({
      id: orderFound.id,
      customer_id: customer.id,
      total: orderFound.totalEntity(),
      items: [{
        id: orderItem.id,
        name: orderItem.name,
        price: orderItem.price,
        quantity: orderItem.quantity,
        order_id: order.id,
        product_id: product.id
      }]
    });
  })


  it("should throw an error when trying to find an order by id that does not exist", async () => {
    const orderRepository = new OrderRepository();
    await expect(orderRepository.find("1")).rejects.toThrowError("Order not found");
  })

  it("should find all orders", async () => {
    const customerRepository = new CustomerRepository();
    const orderRepository = new OrderRepository();
    const productRepository = new ProductRepository();

    const address1 = new Address("Street 1", 1, "Zipcode 1", "City 1");
    const customer1 = new Customer("1", "Customer 1");
    customer1.address = address1;
    await customerRepository.create(customer1);

    const product = new Product("1", "Product 1", 10);
    await productRepository.create(product);

    const orderItem1 = new OrderItem("1", product.name, product.price, product.id, 2);
    const order = new Order("1", customer1.id, [orderItem1]);
    await orderRepository.create(order);

    const customer2= new Customer("2", "Customer 2");
    customer2.address = address1;
    await customerRepository.create(customer2);

    const product2 = new Product("2", "Product 2", 20);
    await productRepository.create(product2);

    const orderItem2 = new OrderItem("2", product2.name, product2.price, product2.id, 5);
    const order2 = new Order("2", customer2.id, [orderItem2]);
    await orderRepository.create(order2);

    const ordersFound = await orderRepository.findAll()
    
    expect(ordersFound).toHaveLength(2);
    expect(ordersFound).toContainEqual(order);
    expect(ordersFound).toContainEqual(order2);

  })
})
