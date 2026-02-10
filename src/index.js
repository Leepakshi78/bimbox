import express from "express";
import connectDB from "./config/db.js";
import cors from "cors";
import dotenv from "dotenv";
import httpLogger from "./middlewares/httpLogger.js";
import { errorLogger } from "./middlewares/errorLogger.js";
import userRoute from "./routes/userRoute.js";
import errorHandler from "./middlewares/error.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 6001;

// Connect database
connectDB();

// Middleware (request)
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(httpLogger); // before routes

// Routes
app.get("/", (req, res) => {
  res.status(200).send("The site is working finely");
});

app.use("/api/user", userRoute);



// Middleware (error) ALWAYS KEEP AT LAST
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Listening on ${port}`);
});
