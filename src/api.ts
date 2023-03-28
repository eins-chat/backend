import express from 'express';
import { sign } from './util/jwt';
import { StatusCodes } from 'http-status-codes';
import { hashPw, verifyPw } from './util/crypto';
import * as db from './database';
import { Group } from './models';
import errorMiddleware from './middlewares/error.middleware';
import authMiddleware from './middlewares/auth.middleware';
import corsMiddleware from 'cors';
import { v4 as uuidv4 } from 'uuid';
require('express-async-errors');

const PORT = process.env.API_PORT || 3000;
const CORS_ORIGIN = process.env.API_CORS_ORIGIN || '';

const app = express();

export function start() {
	console.log('Starting API...');

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
			origin: CORS_ORIGIN,
			methods: ['GET', 'POST'],
		})
	);

	app.use(express.json());
}

function registerEndpoints() {
	app.post('/register', async (req, res) => {
		const { username, password } = req.body;
		const userExist = await db.userExists(username);

		if (!userExist) {
			const token = sign(username);
			const hash = await hashPw(password);

			db.addUser({ name: username, passwordHash: hash });

			res.status(StatusCodes.CREATED).json({ token: token });
		} else {
			res.status(StatusCodes.CONFLICT).send(
				'Du bist schon registriert, du Otto!'
			);
		}
	});

	app.post('/login', async (req, res) => {
		const { username, password } = req.body;
		const user = await db.getUserByName(username);

		const isPasswordCorrect = await verifyPw(password, user.passwordHash);

		if (isPasswordCorrect) {
			const token = sign(username);
			res.status(StatusCodes.OK).json({ token: token });
		} else {
			res.status(StatusCodes.UNAUTHORIZED).send(
				'Invalid username or password'
			);
		}
	});

	app.post('/validateSession', authMiddleware, (req, res) => {
		res.status(StatusCodes.OK).end();
	});

	app.get('/users/:username', authMiddleware, async (req, res) => {
		const { username } = req.params;
		const users = await db.searchUser(username);
		res.send(users);
	});

	app.get('/messages', authMiddleware, async (req, res) => {
		const username = res.locals.username;
		const users = await db.getMessages(username);
		res.send(users);
	});

	app.post('/createGroup', authMiddleware, async (req, res) => {
		const group: Group = req.body;
		const realMemberList: string[] = [];

		for (let username of group.members) {
			if (await db.userExists(username)) {
				realMemberList.push(username);
			} else {
				res.status(StatusCodes.NOT_FOUND)
					.send(`User "${username}" does not exist`)
					.end();
				return;
			}
		}

		const groupToCreate: Group = {
			id: uuidv4(),
			name: group.name,
			members: realMemberList,
		};

		db.createGroup(groupToCreate);

		res.status(StatusCodes.CREATED).send(groupToCreate.id).end();
	});

	app.get('/group/:groupID', authMiddleware, async (req, res) => {
		const { groupID } = req.params;
		const group = await db.getGroupByID(groupID);
		res.send(group).end();
	});
}

function registerPostMiddlewares() {
	app.use(errorMiddleware);
}
