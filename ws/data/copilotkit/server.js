import express from "express";
import cors from "cors";
import { CopilotRuntime, copilotRuntimeNodeHttpEndpoint, EmptyAdapter } from "@copilotkit/runtime";

const app = express();
app.use(cors());

const serviceAdapter = new EmptyAdapter();
const runtime = new CopilotRuntime({ serviceAdapter });

app.use("/api/copilotkit", copilotRuntimeNodeHttpEndpoint({ runtime, serviceAdapter, basePath: "/api/copilotkit" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const port = process.env.PORT || 4201;
app.listen(port, () => {
  console.log(`CopilotKit Runtime listening on port ${port}`);
});
