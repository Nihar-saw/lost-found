import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const generateToken = (userId) => {
  return jwt.sign(
    {
      id: userId,
    },
    env.jwtSecret,
    {
      expiresIn: "7d",
    }
  );
};

export default generateToken;