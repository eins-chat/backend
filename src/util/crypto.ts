import { hash, compare } from "bcrypt";

export async function hashPw(password: string): Promise<string> {
	return hash(password, 1);
}

export async function verifyPw(
	password: string,
	pwHash: string
): Promise<boolean> {
	return compare(password, pwHash);
}
