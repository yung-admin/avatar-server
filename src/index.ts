import dotenv from "dotenv";
dotenv.config();

import { loadConfig } from "./config";
import { createApp } from "./app";

const config = loadConfig();
const app = createApp(config);

app.listen(config.port, () => {
  console.log(`Avatar server running on port ${config.port}`);
  console.log(`Image serving mode: ${config.imageServing.mode}`);
  console.log(`Auth: ${config.auth.enabled ? "enabled" : "disabled"}`);
});
