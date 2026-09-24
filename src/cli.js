"use strict";

const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { monitorWebsites } = require("./monitor");

async function loadConfig(configPath) {
  const absolutePath = path.isAbsolute(configPath) ? configPath : path.resolve(configPath);
  const configModule = await import(pathToFileURL(absolutePath).href);

  if (configModule.default && typeof configModule.default === "object" && "config" in configModule.default) {
    return configModule.default.config;
  }

  if ("default" in configModule) {
    return configModule.default;
  }

  if ("config" in configModule) {
    return configModule.config;
  }

  throw new TypeError("Config file must export a default config or a named config export");
}

async function main() {
  const configPath = process.argv[2];

  if (!configPath) {
    throw new Error("Usage: provide a path to a monitor config file");
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

module.exports = {
  loadConfig,
  main
};
