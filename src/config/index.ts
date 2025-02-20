import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("5001"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),
});

const env = envSchema.parse(process.env);

export const config = Object.freeze({
  PORT: parseInt(env.PORT, 10),
  NODE_ENV: env.NODE_ENV,
  jwt: {
    ACCESS_SECRET: env.JWT_ACCESS_SECRET,
    REFRESH_SECRET: env.JWT_REFRESH_SECRET,
    ACCESS_EXPIRY: env.JWT_ACCESS_EXPIRY,
    REFRESH_EXPIRY: env.JWT_REFRESH_EXPIRY,
  },
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
} as const);
