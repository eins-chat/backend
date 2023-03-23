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

const usersCollection = database.collection<User>("users");
const messagesCollection = database.collection<Message>("messages");
const groupCollection = database.collection<Group>("groups");

export async function getUserByName(name: string): Promise<User> {
	const document = await usersCollection.findOne({ name: name });

	if (!document) {
		throw new Error("User not found");
	}

	return {
		name: document.name,
		passwordHash: document.passwordHash,
	};
}

export async function userExists(name: string): Promise<boolean> {
	const document = await usersCollection.findOne({ name: name });
	return document !== null;
}

export async function addUser(user: User) {
	if (!(await userExists(user.name))) {
		await usersCollection.insertOne(user);
	} else {
		throw new Error("User already exists");
	}
}

export async function addMessage(message: Message) {
	await messagesCollection.insertOne(message);
}

export async function searchUser(name: string) {
	return await usersCollection
		.find({
			name: {
				$regex: `.*${name}.*`,
				$options: "i",
			},
		})
		.map((user) => user.name)
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
					foreignField: "id",
					as: "group",
				},
			},
			{
				$match: {
					"group.members": username,
				},
			},
			{
				$set: {
					receiver: {
            $first: "$group.id",
					},
				},
			},
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

	return groupMessages.concat(privateMessages);
}

export async function createGroup(group: Group) {
	await groupCollection.insertOne(group);
}

export async function getGroupByID(id: string) {
	return await groupCollection.findOne({
		id: id,
	});
}
