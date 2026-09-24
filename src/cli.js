"use strict";

const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { monitorWebsites } = require("./monitor");

async function loadConfig(configPath) {
  const absolutePath = path.resolve(process.cwd(), configPath);
  const configModule = await import(pathToFileURL(absolutePath).href);
  return configModule.default || configModule;
}

async function main() {
  const configPath = process.argv[2];

  if (!configPath) {
    throw new Error("Usage: npm start -- ./path/to/monitor.config.js");
  }

  const config = await loadConfig(configPath);
  const results = await monitorWebsites(config);
  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
