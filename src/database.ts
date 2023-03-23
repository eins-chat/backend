import { MongoClient } from "mongodb";
import { Group, Message, User } from "./models";

const hostname = process.env.DATABASE_HOST || "";
const username = process.env.DATABASE_USER || "";
const password = process.env.DATABASE_PASSWORD || "";

const client = new MongoClient(hostname, {
  auth: {
    username,
    password,
  },
});
const database = client.db("einsChat");

const usersCollection = database.collection("users");
const messagesCollection = database.collection("messages");
const groupCollection = database.collection("groups");
export async function getUserByName(name: string): Promise<User> {
  const document = await usersCollection.findOne({ username: name });
  if (document) {
    return new User(document.username, document.passwortHash);
  }
  throw new Error("user not found");
}

export async function userExists(name: string): Promise<boolean> {
  const document = await usersCollection.findOne({ username: name });
  return document !== null;
}

export async function addUser(user: User) {
  if (!(await userExists(user.username))) {
    usersCollection.insertOne(user);
  } else {
    throw new Error("user already exists");
  }
}

export function addMessage(message: Message) {
  messagesCollection.insertOne(message);
}
export async function searchUser(name: string) {
  const query = ".*" + name + ".*";
  return await usersCollection
    .find({ username: { $regex: query, $options: "i" } })
    .map((obj) => obj.username)
    .toArray();
}
export async function getMessages(username: string) {
  const groupMessages = await messagesCollection
    .aggregate([
      {
        $match: {
          type: 1,
        },
      },
      {
        $lookup: {
          from: "groups",
          localField: "receiver",
          foreignField: "groupID",
          as: "group",
        },
      },
      {
        $match: {
          "group.memberList": username,
        },
      },
      { $replaceWith: {
        $setField: {
           field: "receiver",
           input: "$$ROOT",
           value: "$group.displayName"
      }
    } }
    ])
    .toArray();
    console.log(groupMessages);
    
  const privateMessages = await messagesCollection
    .find({
      $and: [
        { type: 0 },
        { $or: [{ author: username }, { receiver: username }] },
      ],
    })
    .toArray();
    //return privateMessages;
  return groupMessages.concat(privateMessages)
}

export function createGroup(groupToCreate: Group) {
  groupCollection.insertOne(groupToCreate);
}
export async function getGroupByID(groupID: string) {
  return (await groupCollection.findOne({
    groupID: groupID,
  })) as unknown as Group;
}
