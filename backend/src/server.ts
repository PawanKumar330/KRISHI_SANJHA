import "dotenv/config";
import { createApp } from "./app.js";

const port = Number(process.env["PORT"] ?? 8000);
createApp().listen(port, () => {
  console.log(`Jamui agri-rental API listening on :${port}`);
});
