import express from "express";
import cors from "cors";
import { CopilotRuntime, copilotRuntimeNodeHttpEndpoint } from "@copilotkit/runtime";

const app = express();
app.use(cors());

const runtime = new CopilotRuntime();

app.use("/api/copilotkit", copilotRuntimeNodeHttpEndpoint({ runtime, basePath: "/api/copilotkit" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const port = process.env.PORT || 4201;
app.listen(port, () => {
  console.log(`CopilotKit Runtime listening on port ${port}`);
});
