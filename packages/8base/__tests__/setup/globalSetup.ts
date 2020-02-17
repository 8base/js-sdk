const path = require('path');

require('dotenv').config({
  path: path.resolve('../../', '.env'),
});

module.exports = async function globalSetup() {};
