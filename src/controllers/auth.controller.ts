import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { config } from "../config";
import { ApiError } from "../utils/ApiError";
import { TokenPayload, User, AuthTokens } from "../types";

// In-memory user storage (replace with a database in production)
const users: User[] = [];

const generateTokens = (payload: TokenPayload): AuthTokens => {
  // Ensure the expiresIn values are correctly handled as strings
  const accessToken = jwt.sign(
    payload,
    config.jwt.accessSecret as string,
    {
      expiresIn: config.jwt.accessExpiry, // JWT accepts strings like '15m', '1h'
    } as SignOptions,
  );

  const refreshToken = jwt.sign(
    payload,
    config.jwt.refreshSecret as string,
    {
      expiresIn: config.jwt.refreshExpiry, // Same here for refresh expiry
    } as SignOptions,
  );

  return { accessToken, refreshToken };
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = users.find((user) => user.email === email);
    if (existingUser) {
      throw new ApiError(400, "Email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user: User = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    users.push(user);

    const tokens = generateTokens({ userId: user.id, email: user.email });

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      status: "success",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        accessToken: tokens.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;

    const user = users.find((u) => u.email === email);
    if (!user) {
      throw new ApiError(401, "Invalid credentials");
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new ApiError(401, "Invalid credentials");
    }

    const tokens = generateTokens({ userId: user.id, email: user.email });

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      status: "success",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        accessToken: tokens.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie("refreshToken");
  res.json({
    status: "success",
    message: "Logged out successfully",
  });
};

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = users.find((u) => u.id === req.user?.userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    res.json({
      status: "success",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
