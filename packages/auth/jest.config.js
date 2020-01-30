module.exports = {
  ...require('../../config/jest.config.base.js'),
  preset: 'jest-puppeteer',
  globalSetup: './__tests__/setup/globalSetup.js',
};
