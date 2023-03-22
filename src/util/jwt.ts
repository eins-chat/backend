import jwt from "jsonwebtoken";

const PRIVATE_KEY = process.env.JWT_PRIVATE_KEY || '';

const issuer = "1 Chat";
const subject = "Client Authentication";

export function sign(username: string): string {
  return jwt.sign(
    {
      username: username,
    },
    PRIVATE_KEY,
    {
      algorithm: "RS256",
      issuer: issuer,
      subject: subject,
    }
  );
}

export function verify(token: string) {
  return jwt.verify(token, PRIVATE_KEY, {
    algorithms: ["RS256"],
    issuer: issuer,
    subject: subject,
  });
}
