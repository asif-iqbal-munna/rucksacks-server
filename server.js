const express = require("express");
const app = express();
const cors = require("cors");
const ObjectId = require("mongodb").ObjectId;
require("dotenv").config();
const { MongoClient } = require("mongodb");
const port = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bauja.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

// Create Mongo Client
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const run = async () => {
  try {
    await client.connect();
    const database = client.db("rucksackData");
    const productsCollection = database.collection("products");
    const reviewsCollection = database.collection("reviews");
    const ordersCollection = database.collection("orders");
    const usersCollection = database.collection("users");

    // Get All Products
    app.get("/products", async (req, res) => {
      const products = await productsCollection.find({}).toArray();
      res.json(products);
    });

    // Get A Single Product
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const singleProduct = await productsCollection.findOne(query);
      res.send(singleProduct);
    });

    // Get All Reviews
    app.get("/reviews", async (req, res) => {
      const reviews = await reviewsCollection.find({}).toArray();
      res.send(reviews);
    });

    // Post a review
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const saveReview = await reviewsCollection.insertOne(review);
      res.send(saveReview);
    });

    // Post Orders To MongoDB
    app.post("/orders", async (req, res) => {
      const orderInfo = req.body;
      const saveOrderData = await ordersCollection.insertOne(orderInfo);
      res.send(saveOrderData);
    });

    // Get All Orders
    app.get("/orders", async (req, res) => {
      const allOrders = await ordersCollection.find({}).toArray();
      res.send(allOrders);
    });

    // Get A Specific User's Oders By His Email With Query Parameter
    app.get("/orders/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const ordersByEmail = await ordersCollection.find(query).toArray();
      res.send(ordersByEmail);
    });

    // Delete Order
    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const orderDltConfirmation = await ordersCollection.deleteOne(query);
      res.send(orderDltConfirmation);
    });

    // Get All User
    app.get("/users", async (req, res) => {
      const users = await usersCollection.find({}).toArray();
      res.send(users);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const userInfo = await usersCollection.insertOne(user);
      res.send(userInfo);
    });

    // Make Admin
    app.put("/users/admin", async (req, res) => {
      const user = req.body;
      console.log(user);
      const filter = { email: user.email };
      const updateDoc = {
        $set: { role: "admin" },
      };
      const admin = await usersCollection.updateOne(filter, updateDoc);
      res.send(admin);
    });
  } finally {
    // await client.close();
  }
};

run().catch(console.dir);

app.get("/", (req, res) => {
  console.log("from server");
  res.send("from server");
});

app.listen(port, () => {
  console.log("listening to the port ", port);
});
