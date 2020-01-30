const { setup: setupDevServer } = require('jest-dev-server');
const { setup: setupPuppeteer } = require('jest-environment-puppeteer');

module.exports = async function globalSetup(globalConfig) {
  await setupDevServer({
    command: "yarn test:server",
    launchTimeout: 50000,
    port: 9000,
  });

  await setupPuppeteer(globalConfig);
};
