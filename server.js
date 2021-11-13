const express = require("express");
const app = express();
const cors = require("cors");
const admin = require("firebase-admin");
const ObjectId = require("mongodb").ObjectId;
require("dotenv").config();
const { MongoClient } = require("mongodb");
const port = process.env.PORT || 8000;

var serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

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

//  Middleware to verify before making admin
const verifyToken = async (req, res, next) => {
  if (req.headers?.authorization?.startsWith("Bearer ")) {
    const token = req.headers.authorization.split(" ")[1];

    try {
      const decodedUser = await admin.auth().verifyIdToken(token);
      req.decodedEmail = decodedUser.email;
    } catch {}
  }
  next();
};

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

    // Post Products
    app.post("/products", async (req, res) => {
      const product = req.body;
      const addedProduct = await productsCollection.insertOne(product);
      res.send(addedProduct);
    });

    // Get A Single Product
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const singleProduct = await productsCollection.findOne(query);
      res.send(singleProduct);
    });

    // Delete A Order
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const deletedProduct = await productsCollection.deleteOne(query);
      res.send(deletedProduct);
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

    //  Update order status
    app.put("/orders/manage/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: { status: "approved" },
      };
      const approvedOrder = await ordersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(approvedOrder);
    });

    //  delete order
    app.delete("/orders/manage/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const deletedOrder = await ordersCollection.deleteOne(query);
      res.send(deletedOrder);
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

    // Make Admin and verify requeter with jwt token
    app.put("/users/admin", verifyToken, async (req, res) => {
      const user = req.body;
      const requester = req.decodedEmail;
      if (requester) {
        const requesterAccount = await usersCollection.findOne({
          email: requester,
        });
        if (requesterAccount.role === "admin") {
          const filter = { email: user.email };
          const updateDoc = {
            $set: { role: "admin" },
          };
          const admin = await usersCollection.updateOne(filter, updateDoc);
          res.send(admin);
        }
      }
    });

    // Get If Admin
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.send({ admin: isAdmin });
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
