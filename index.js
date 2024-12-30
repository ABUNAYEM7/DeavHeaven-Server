const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(
  cors({
    origin: [
      "https://gadget-heaven-2fcab.web.app",
      "https://gadget-heaven-2fcab.firebaseapp.com/",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qcus7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();

    const jobCollection = client.db("JobCollection").collection("jobs");
    const applyCollection = client.db("JobCollection").collection("applyJobs");

    // get-all-jobs
    app.get("/jobs", async (req, res) => {
      const homePage = req.query?.home;
      const email = req.query.email;
      const searchQuery = req.query?.search;
      const sort = req.query?.sort;
      const min = req.query?.min;
      const max = req.query?.max


      let query = {};
      let sortQuery = {}

      if (email) {
        query = { hr_email: email };
      }

      if (homePage) {
        const result = await jobCollection.find().limit(6).toArray();
        return res.send(result);
      }

      if (searchQuery) {
        query = {
          title:{$regex:searchQuery, $options:'i'}
        };
      }

      if(sort === 'true'){
        sortQuery={"salaryRange.min" : -1}
      }

      if(min && max){
        query={
          ...query,
          "salaryRange.max" : {$lte:parseInt(max)},
          "salaryRange.min" : {$gte:parseInt(min)},
        }
      }
      const result = await jobCollection.find(query)
      .sort(sortQuery)
      .toArray();
      res.send(result);
    });

    // get-single-job-details
    app.get("/details/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobCollection.findOne(query);
      res.send(result);
    });

    // find-single-candidate-applications
    app.get("/myApplications", verifyToken, async (req, res) => {
      const email = req.query.email;
      const cursor = { email: email };
      if (req.user.email !== req.query?.email) {
        return res.status(403).send("Forbidden Access");
      }
      const result = await applyCollection.find(cursor).toArray();
      res.send(result);
    });

    // get-single-application
    app.get("/application/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await applyCollection.findOne(query);
      res.send(result);
    });

    //view-candidate-by-jobId
    app.get("/view-candidate/jobs/:jobId", verifyToken, async (req, res) => {
      const id = req.params.jobId;
      const query = { jobId: id };
      const result = await applyCollection.find(query).toArray();
      res.send(result);
    });

    // jwt-post-route
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "1d" });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    // logout
    app.post("/logout", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    // post-candidate-applications-count
    app.post("/applyJobs", verifyToken, async (req, res) => {
      const application = req.body;
      const result = await applyCollection.insertOne(application);

      const id = application.jobId;
      const query = { _id: new ObjectId(id) };
      const job = await jobCollection.findOne(query);

      let newCount = 0;
      if (job.applyCount) {
        newCount = job.applyCount + 1;
      } else {
        newCount = 1;
      }

      const filter = { _id: new ObjectId(id) };

      const updatedCount = {
        $set: {
          applyCount: newCount,
        },
      };

      const updatedResult = await jobCollection.updateOne(filter, updatedCount);

      res.send(result);
    });

    // post-new-job
    app.post("/newJob", verifyToken, async (req, res) => {
      const newJob = req.body;
      const result = await jobCollection.insertOne(newJob);
      res.send(result);
    });

    // update-candidate-application
    app.patch("/updateApplication/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const data = req.body;
      const updatedData = {
        $set: {
          companyName: data.companyName,
          position: data.position,
          jobId: data.jobId,
          email: data.email,
          linkDing: data.linkDing,
          github: data.github,
          resume: data.resume,
        },
      };
      const result = await applyCollection.updateOne(filter, updatedData);
      res.send(result);
    });

    // application-status-change
    app.patch("/review-application/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const data = req.body;
      const updatedData = {
        $set: {
          status: data.status,
        },
      };
      const result = await applyCollection.updateOne(filter, updatedData);
      res.send(result);
    });

    // update-jobPost
    app.patch("/updateMyPost/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const data = req.body;
      const updatedData = {
        $set: {
          title: data.title,
          location: data.location,
          jobType: data.jobType,
          category: data.category,
          applicationDeadline: data.applicationDeadline,
          salaryRange: data.salaryRange,
          description: data.description,
          company: data.company,
          requirements: data.requirements,
          responsibilities: data.responsibilities,
          status: data.status,
          hr_email: data.hr_email,
          hr_name: data.hr_name,
          company_logo: data.company_logo,
        },
      };
      const result = await jobCollection.updateOne(filter, updatedData);
      res.send(result);
    });

    // delete-candidate-application
    app.delete("/delete-application/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await applyCollection.deleteOne(query);
      res.send(result);
    });

    // delete-my-posted-job
    app.delete("/myPostedJob/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobCollection.deleteOne(query);
      res.send(result);
    });

    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("DevHeaven Server Is Running");
});

app.listen(port, () => {
  console.log("Server is running on Port", port);
});
