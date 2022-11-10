const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { query } = require("express");
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

// midlware

app.use(cors());
app.use(express.json());

// mongod Db Connection

// const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster1.evach3k.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// jwt verify

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorize Access" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(401).send({ message: "Unauthorize Access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const serviceCollection = client.db("roofsie").collection("services");

    const reviewCollection = client.db("roofsie").collection("reviews");

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.TOKEN_SECRET, {
        expiresIn: "10h",
      });
      res.send({ token });
    });

    //   ==get item ==
    app.get("/services", async (req, res) => {
      const limit = parseInt(req.query.limit);
      const query = {};
      const cursor = serviceCollection.find(query);
      const result = await cursor.sort({ date: -1 }).limit(limit).toArray();
      res.send(result);
    });

    // post a service

    app.post("/services", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });

    //  ==get single items===
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await serviceCollection.findOne(query);
      res.send(result);
    });

    // get reviews for specific email

    app.get("/reviews", verifyJWT, async (req, res) => {
      let query = {};
      const decoded = req.decoded;

      if (decoded.email !== req.query.email) {
        res.status(403).send({ message: "Unauthorize Access" });
      }
      if (req.query.email) {
        query = { email: req.query.email };
      }

      const cursor = reviewCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Reveiws Get method for specific service

    app.get("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { serviceId: id };
      const cursor = reviewCollection.find(query);
      const result = await cursor.sort({ date: -1 }).toArray();
      res.send(result);
    });

    // for update review

    app.get("/review/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.findOne(query);
      res.send(result);
    });

    // Reviews post method

    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });

    // review patch method

    app.patch("/reviews", async (req, res) => {
      const message = req.body.message;

      const Ratings = req.body.Ratings;
      const id = req.body.id;

      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };

      const updateDoc = {
        $set: {
          Ratings: Ratings,
          message: message,
        },
      };

      const result = await reviewCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    // Review Delete Method

    app.delete("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
  }
}
run().catch((err) => console.log(err.name, err.message));

//== get method for testing

app.get("/", (req, res) => {
  res.send("WellCome to Roofsie Server");
});

// ==listen

app.listen(port, () => {
  console.log(`server is running on port :${port}`);
});
