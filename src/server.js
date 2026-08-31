import app from "./app.js";
import connectDB from "./config/db.js";
import { env } from "./config/env.js";

const startServer = async () => {
  await connectDB();

  app.listen(env.port, () => {
    console.log("");
    console.log("======================================");
    console.log("       FINDBACK AI BACKEND");
    console.log("======================================");
    console.log(`Server: http://localhost:${env.port}`);
    console.log(`API:    http://localhost:${env.port}/api`);
    console.log("======================================");
    console.log("");
  });
};

startServer();