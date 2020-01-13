const baseConfig = require('../../config/jest.config.base.js');

module.exports = {
  projects: [
    {
      ...baseConfig,
      displayName: 'node',
      testEnvironment: 'node',
    },
    {
      ...baseConfig,
      displayName: 'jsdom',
      testEnvironment: 'jsdom'
    }
  ]
};
