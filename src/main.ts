import 'dotenv/config';

import { start as startServer } from "./server";
import { start as startApi } from "./api";

function main() {
  startServer();
  startApi();
}

main();
