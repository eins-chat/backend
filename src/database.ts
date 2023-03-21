import { MongoClient } from "mongodb";
import { User } from "./models";

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri, {
  auth: {
    username: "root",
    password: "pw",
  },
});
const database = client.db("einsChat");

const usersCollection = database.collection("users");
export async function getUserByName(name: string): Promise<User> {
  const bla = await usersCollection.findOne({ username: name });
  if (bla) {
    return new User(bla.username, bla.passwortHash);
  }
  throw new Error("user not found");
}

export async function userExists(name: string): Promise<boolean> {
  const bla = await usersCollection.findOne({ username: name });
  return bla !== null;
}
export async function addUser(user: User) {
  if (!userExists(user.username)) {
    usersCollection.insertOne(user);
  } else {
    throw new Error("user already exists");
  }
}
