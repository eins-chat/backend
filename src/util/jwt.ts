import jwt from "jsonwebtoken";
import fs from "fs";

const key = fs.readFileSync("resources\\jwt-private-key.txt", "utf8");
const issuer = "1 Chat";
const subject = "Client Authentication";

export function sign(username: string): string {
  return jwt.sign(
    {
      username: username,
    },
    key,
    {
      algorithm: "RS256",
      issuer: issuer,
      subject: subject,
    }
  );
}

export function verify(token: string) {
  return jwt.verify(token, key, {
    algorithms: ["RS256"],
    issuer: issuer,
    subject: subject,
  });
}
