const DEVNET_MOCK_SERVER = 'http://39.100.93.109';
const CONST = require('../src/CONST');
const util = require('../src/util');

function isHash(hash) {
  return util.isHexString(hash) && hash.length === 66;
}

const TEST_KEY = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

module.exports = {
  DEVNET_MOCK_SERVER,
  DEVNET_NETWORK_ID: CONST.DEVNET_ID,
  ZERO_HASH: CONST.ZERO_HASH,
  isHash,
  TEST_KEY,
};
