const { spawn } = require("node:child_process");

const mode = process.argv[2];

if (mode === "ignore-sigterm") process.on("SIGTERM", () => {});

const grandchild = spawn("sleep", ["300"], { stdio: "ignore" });

process.stdout.write(`${JSON.stringify({ type: "grandchild", pid: grandchild.pid })}\n`);
process.stdout.write(`${JSON.stringify({ type: "agent_settled" })}\n`);

setInterval(() => {}, 1000);
