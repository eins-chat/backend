import { verify } from "../util/jwt";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

function verifyToken(req: Request, res: Response, next: NextFunction) {
  const { authorization } = req.headers;

  // No token passed
  if (!authorization) {
    throw new Error("No token passed");
  }

  // Verify token and get payload
  const payload = verify(authorization);

  // Token has invalid payload
  if (typeof payload === "string") {
    throw new Error("Invalid token");
  }

  res.locals.username = payload.username;

  next();
}

export default verifyToken;
