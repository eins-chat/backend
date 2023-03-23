import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

function log(err: unknown, req: Request, res: Response, next: NextFunction) {
	console.log(err);

	const msg =
		(err instanceof Error && err.message) || "Internal Server Error";

	sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, msg);
}

function sendError(res: Response, status: number, message: string) {
	res.status(status);
	res.json(message);
	res.end();
}

export default log;
