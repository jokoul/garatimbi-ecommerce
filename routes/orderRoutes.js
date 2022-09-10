import express from "express";
import expressAsyncHandler from "express-async-handler";

import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";
import { isAuth, isAdmin, mailgun, payOrderEmailTemplate } from "../Utils.js";

const orderRouter = express.Router();

orderRouter.get(
  "/",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const orders = await Order.find().populate("user", "name"); //populate('user','name') means that from user object define in order model we just want to retrieve the name not other info like email or password
    res.send(orders);
  })
);

orderRouter.post(
  "/",
  isAuth, //this middleware is responsible to fill the user property
  expressAsyncHandler(async (req, res) => {
    const newOrder = new Order({
      orderItems: req.body.orderItems.map((x) => ({ ...x, product: x._id })),
      shippingAddress: req.body.shippingAddress,
      paymentMethod: req.body.paymentMethod,
      itemsPrice: req.body.itemsPrice,
      shippingPrice: req.body.shippingPrice,
      taxPrice: req.body.taxPrice,
      totalPrice: req.body.totalPrice,
      user: req.user._id, //req.user come from isAuth middleware
    });
    const order = await newOrder.save();
    res.status(201).send({ message: "New Order Creates", order });
  })
);

orderRouter.get(
  "/summary",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    //we use agregation from mongo db it allows to process multiple data and send a computed result
    const orders = await Order.aggregate([
      {
        //each object is a pipeline
        $group: {
          _id: null, //group all data
          numOrders: { $sum: 1 }, //calculate some of all item. "$sum:1" means count all item in the document and set numOrders with the result
          totalSales: { $sum: "$totalPrice" }, //calculate sum of total price failed in the order document
        },
      },
    ]);
    //User aggregation
    const users = await User.aggregate([
      {
        $group: {
          _id: null,
          numUsers: { $sum: 1 },
        },
      },
    ]);
    const dailyOrders = await Order.aggregate([
      //define a group pipeline
      {
        $group: {
          //Here we group data based on the date of the order
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, //ID or Key of this group based on date,its the create_date of the order but formated with full year, month and day.
          orders: { $sum: 1 }, //calculate to return number of orders in that current date specified above
          sales: { $sum: "$totalPrice" }, //calculate total price in that current date specified above
        },
      },
      {
        $sort: { _id: 1 }, //sort by id
      },
    ]);
    const productCategories = await Product.aggregate([
      {
        //we group data based on category in the Product model
        $group: {
          _id: "$category",
          count: { $sum: 1 }, //count the number of item in each category
        },
      },
    ]);
    res.send({ users, orders, dailyOrders, productCategories });
  })
);

//It important to put this route before the route below "/:id", otherwise the 'mine' route gonna be handle by "/:id" route
orderRouter.get(
  "/mine",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id }); //ew search order based on user filter. Always "req.user" come from isAuth middleware
    res.send(orders);
  })
);

orderRouter.get(
  "/:id",
  isAuth, //this middleware is responsible to fill the user property
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      res.send(order);
    } else {
      res.status(404).send({ message: "Order Not Found" });
    }
  })
);

orderRouter.put(
  "/:id/deliver",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    //get order from db
    const order = await Order.findById(req.params.id);
    //check result
    if (order) {
      //make change
      order.isDelivered = true; //set it to true
      order.deliveredAt = Date.now(); //set current date
      //save change in db
      await order.save();
      //send back answer to frontend
      res.send({ message: "Order Delivered" });
    } else {
      res.status(404).send({ message: "Order Not Found" });
    }
  })
);

orderRouter.put(
  "/:id/pay",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "email name"
    );
    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.email_address,
      };
      const updatedOrder = await order.save();

      //send email after payment
      mailgun()
        .messages()
        .send(
          {
            //parameter for send
            from: "Garatimbi <garatimbi@mg.joan-kouloumba.in>",
            to: `${order.user.name} <${order.user.email}>`,
            subject: `New order ${order._id}`,
            html: payOrderEmailTemplate(order),
          },
          (error, body) => {
            if (error) {
              console.log(error);
            } else {
              console.log(body);
            }
          }
        );
      res.send({ message: "Order Paid", order: updatedOrder });
    } else {
      res.status(404).send({ message: "Order Not Found" });
    }
  })
);

orderRouter.delete(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      await order.remove();
      res.send({ message: "Order Deleted" });
    } else {
      res.status(404).send({ message: "Order Not Found" });
    }
  })
);

export default orderRouter;
