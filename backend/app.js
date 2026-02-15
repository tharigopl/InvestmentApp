const fs = require("fs");
const path = require("path");
const cors = require("cors");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const placesRoutes = require("./routes/places-routes");
const friendsRoutes = require("./routes/friends-routes");
const usersRoutes = require("./routes/users-routes");
const stripeRoutes = require("./routes/stripe-routes");
const HttpError = require("./models/http-error");
// Gives us access to variables set in the .env file via `process.env.VARIABLE_NAME` syntax
require("dotenv").config();

const user = process.env.MONGO_USER;
const pass = process.env.MONGO_PASS;
const db = process.env.MONGO_DB;
const hosts = process.env.MONGO_HOSTS;
const replicaSet = process.env.MONGO_REPLICA_SET;
const options = process.env.MONGO_OPTIONS;

const uri = `mongodb://${user}:${pass}@${hosts}/${db}?replicaSet=${replicaSet}&${options}`;


const app = express();

app.use(bodyParser.json());

app.use("/uploads/images", express.static(path.join("uploads", "images")));

app.use(
  cors({
    origin: ["http://localhost:19006", "exp://192.168.0.157:19000", "exp://192.168.0.165:19000", "http://localhost:8081", "https://happykid-396701.web.app", "http://localhost:3000", "http://localhost:8082"],
  })
);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

  next();
});

app.use("/api/places", placesRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/stripe", stripeRoutes);
app.use("/api/friends", friendsRoutes);

app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});
console.log("@@@@@@@@@@@@@@@", uri);
mongoose
  .connect(uri)
  .then(() => {
    app.listen(5000);
  })
  .catch((err) => {
    console.log(err);
  });
