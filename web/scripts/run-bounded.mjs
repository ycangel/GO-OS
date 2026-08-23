import { spawn } from "node:child_process";

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error("usage: node scripts/run-bounded.mjs command [args...]");
  process.exit(64);
}

const timeoutMs = duration(
  process.env.SITES_BUILD_TIMEOUT_MS ?? process.env.SITES_BUILD_TIMEOUT,
  3 * 60 * 1000,
);
const killAfterMs = duration(
  process.env.SITES_BUILD_KILL_AFTER_MS ?? process.env.SITES_BUILD_KILL_AFTER,
  10 * 1000,
);

const useProcessGroup = process.platform !== "win32";
const child = spawn(command, args, {
  detached: useProcessGroup,
  env: process.env,
  stdio: "inherit",
});

let timedOut = false;
let killTimer;
const timer = setTimeout(() => {
  timedOut = true;
  console.error(`Build exceeded ${timeoutMs}ms; sending SIGTERM.`);
  killChildTree("SIGTERM");
  killTimer = setTimeout(() => killChildTree("SIGKILL"), killAfterMs);
}, timeoutMs);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    killChildTree(signal);
    process.exitCode = signal === "SIGINT" ? 130 : 143;
  });
}

child.once("error", (error) => {
  clearTimeout(timer);
  if (killTimer) clearTimeout(killTimer);
  console.error(error.message);
  process.exitCode = 69;
});

child.once("exit", (code, signal) => {
  clearTimeout(timer);
  if (killTimer) clearTimeout(killTimer);
  if (timedOut) {
    process.exitCode = 124;
  } else if (signal) {
    console.error(`Build stopped by ${signal}.`);
    process.exitCode = 1;
  } else {
    process.exitCode = code ?? 1;
  }
});

function duration(value, fallback) {
  if (!value) return fallback;
  const match = /^(\d+(?:\.\d+)?)(ms|s|m|h)?$/.exec(value.trim());
  if (!match) return fallback;
  const unit = match[2] ?? "ms";
  const multiplier = { ms: 1, s: 1000, m: 60_000, h: 3_600_000 }[unit];
  const parsed = Number(match[1]) * multiplier;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function killChildTree(signal) {
  if (!child.pid) return;
  try {
    if (useProcessGroup) process.kill(-child.pid, signal);
    else child.kill(signal);
  } catch (error) {
    if (error?.code !== "ESRCH") throw error;
  }
}
