import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // return type is void, not Response
  if (err instanceof ApiError) {
    logger.error(`API Error: ${err.message}`);
    res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
    return;
  }

  logger.error(`Unhandled Error: ${err.message}`);
  res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
};
