const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
// const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);
const port = process.env.PORT || 5000;

// middleware
const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());


const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  // console.log("authorization", authorization);
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }
  
  const token = authorization.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};







const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3iohovs.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
      // await client.connect();
      const instructorCollection = client.db('summerCamp').collection('instructors')
      const classCollection = client.db('summerCamp').collection('classes')
      const userCollection = client.db('summerCamp').collection('users')
      const cartCollection = client.db('summerCamp').collection('carts')


    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });

      res.send({ token });
    });

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user?.role !== "admin") {
        return res
          .status(403)
          .send({ error: true, message: "forbidden message" });
      }
      next();
    };
    
    app.patch("/makeInstructors/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id)
      const filter = { _id: new ObjectId(id)}
      // const query = { role: "instructor" };
       const updateDoc = {
         $set: {
           role: "instructor",
         },
       };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.get("/instructors", async (req, res) => {
      // const id = req.body;
      // console.log(id)
      const filter = { role: 'instructor'}
      // const query = { role: "instructor" };
      //  const updateDoc = {
      //    $set: {
      //      role: "instructor",
      //    },
      //  };
      const result = await userCollection.find(filter).toArray();
      res.send(result);
    });

   
    



    app.get('/activeClasses', async(req, res) => {
      // const query = req.body;
      // console.log(query)
      const query = {status: 'active'}
      const result = await classCollection.find(query).toArray();
      res.send(result);
    })
    

    app.get('/allClasses', async(req, res) => {
      // const query = req.body;
      // console.log(query)
      // const query = {status: 'active'}
      const result = await classCollection.find().toArray();
      res.send(result);
    })
    // all classes data shorting
    app.get('/allClasses', async(req, res) => {
      // const query = req.body;

      const result = await classCollection.find().toArray();
      res.send(result);
      })
   
 app.get("/SixClasses", async (req, res) => {
   const query = {};
   const options = {
     sort: { availableSeats: -1 },
   };
   const result = await classCollection.find(query, options).toArray();
   res.send(result);
 });

    
        app.patch("/statusUpdate/:id", async(req, res) => {
          const id = req.params.id;
        console.log(id)
          const filter = { _id: new ObjectId(id) };
          // const options = { upsert: true };
          const updateDoc = {
            $set: {
              status: "active",
            },
          };

          const result = await classCollection.updateOne(filter, updateDoc);
          res.send(result);
        });
    
        app.patch("/classFeedback/:id", async(req, res) => {
         const id = req.params.id;
         const textClass = req.body.feedback;

         console.log(id, textClass);
          const filter = { _id: new ObjectId(id) };
          const options = { upsert: true };
          const updateDoc = {
            $set: {
              feedback: textClass,
            },
          };

          const result = await classCollection.updateOne(
            filter,
            updateDoc,
            options
          );
          res.send(result);
        });

    
       app.post("/classes", async(req, res) => {
         const newClass = req.body;
         console.log(newClass)
         const result = await classCollection.insertOne(newClass);
         res.send(result);
       });
    
    
    
    app.post('/carts', async(req, res) => {
      const newCart = req.body;
      // console.log(newCart);
      const result = await cartCollection.insertOne(newCart);
      res.send(result)
    })

    app.delete('/carts/:id', async(req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) }
      // console.log(query)
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    })
    
    // app.get('/carts', async(req, res) => {
    
    //   const result = await cartCollection.find().toArray();
    //   res.send(result);
    //   })

    app.get('/carts', verifyJWT, async(req, res) => {
      const email = req.query.email;
      console.log(email)
      if (!email) {
        res.send([]);
      }

       const decodedEmail = req.decoded.email;
       if (email !== decodedEmail) {
         return res
           .status(403)
           .send({ error: true, message: "porviden access" });
       }

      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
      })

    // user apis

    app.get("/users", verifyJWT, verifyAdmin, async(req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    })

  app.post("/users", async(req, res) => {
    const user = req.body;
    const query = { email: user.email };
    const existingUser = await userCollection.findOne(query);
    console.log(existingUser);
    if (existingUser) {
      return res.send({ message: "user already exists" });
    }

    const result = await userCollection.insertOne(user);
    res.send(result);
  });

    // admin apis

      app.get("/users/admin/:email", verifyJWT, async (req, res) => {
        const email = req.params.email;

        if (req.decoded.email !== email) {
          res.send({ admin: false });
        }

        const query = { email: email };
        const user = await userCollection.findOne(query);
        const result = { admin: user?.role === "admin" };
        res.send(result);
      });




  app.patch("/users/admin/:id", async(req, res) => {
    const id = req.params.id;
    // console.log(id);
    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
      $set: {
        role: "admin",
      },
    };

    const result = await userCollection.updateOne(filter, updateDoc);
    res.send(result);
  });
     







    
    // instructor apis

  app.get("/users/instructor/:email", verifyJWT, async (req, res) => {
    const email = req.params.email;

    if (req.decoded.email !== email) {
      res.send({ instructor: false });
    }

    const query = { email: email };
    const user = await userCollection.findOne(query);
    const result = { instructor: user?.role === "instructor" };
    res.send(result);
  });



  app.patch("/users/instructor/:id", async(req, res) => {
    const id = req.params.id;
    // console.log(id);
    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
      $set: {
        role: "instructor",
      },
    };

    const result = await userCollection.updateOne(filter, updateDoc);
    res.send(result);
  });







    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);






app.get("/", (req, res) => {
  res.send("SUMMER CAMP SCHOOL IS RUNNING");
});

app.listen(port, () => {
  console.log(`summer  is sitting on port ${port}`);
});