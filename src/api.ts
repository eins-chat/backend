import express from "express";
import { sign } from "./util/jwt";
import { StatusCodes } from "http-status-codes";
import { hashPw, verifyPw } from "./util/crypto";
import * as db from "./database";
import { User } from "./models";
import errorMiddleware from "./error-middleware";
import authMiddleware from "./middlewares/auth.middleware";
import corsMiddleware from "cors";

const PORT = 3000;

const app = express();

export function start() {
  console.log("Starting API...");

  registerPreMiddlewares();
  registerEndpoints();
  registerPostMiddlewares();

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

function registerPreMiddlewares() {
  app.use(
    corsMiddleware({
      origin: "http://localhost:4200",
      methods: ["GET", "POST"],
    })
  );

  app.use(express.json());
}

function registerEndpoints() {
  app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    const userExist = await db.userExists(username);

    if (!userExist) {
      const token = sign(username);
      const passwortHash = await hashPw(password);
      db.addUser(new User(username, passwortHash));
      res.status(StatusCodes.CREATED).json({ token: token });
    } else {
      res
        .status(StatusCodes.CONFLICT)
        .send("Du bist schon registriert, du Otto!");
    }
  });

  app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await db.getUserByName(username);
    const isPasswordCorrect = await verifyPw(password, user.passwortHash);
    if (isPasswordCorrect) {
      const token = sign(username);
      res.status(StatusCodes.OK).json({ token: token });
    } else {
      res.status(StatusCodes.UNAUTHORIZED).send("Invalid username or password");
    }
  });

  app.get("/users/:username", authMiddleware, async (req, res) => {
    const { username } = req.params;
    const users = await db.searchUser(username);
    res.send(users);
  });
}

function registerPostMiddlewares() {
  app.use(errorMiddleware);
}
