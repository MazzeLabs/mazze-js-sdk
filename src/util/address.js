const {
  encode,
  decode,
  isValidMazzeAddress,
  verifyMazzeAddress,
  hasNetworkPrefix,
  simplifyMazzeAddress,
  shortenMazzeAddress,
  isZeroAddress,
  isInternalContractAddress,
  isValidHexAddress,
  isValidMazzeHexAddress,
} = require('@mazze-labs/mazze-address-js');
const { checksumAddress, keccak256 } = require('./sign');
const { ADDRESS_TYPES } = require('../CONST');

/**
 * encode hex40 address to base32 address
 * @function encodeMazzeAddress
 * @param {string|Buffer} address - hex40 address
 * @param {number} numberId - networkId
 * @param {boolean} [verbose] - if true, return verbose address
 * @return {string} base32 string address
 */

/**
 * decode base32 address to hex40 address
 * @function decodeMazzeAddress
 * @param {string} address - base32 string
 * @return {object}
 */

/**
 * check if the address is valid
 * @function isValidMazzeAddress
 * @param {string} address - base32 string
 * @return {boolean}
 */

/**
 * verify base32 address if pass return true if not throw error
 * @function verifyMazzeAddress
 * @param {string} address - base32 string
 * @return {boolean}
 */

/**
 * check if the address has network prefix
 * @function hasNetworkPrefix
 * @param {string} address - base32 string
 * @return {boolean}
 */

/**
 * simplify base32 address to non verbose address
 * @function simplifyMazzeAddress
 * @param {string} address - base32 string
 * @return {string} return a non verbose address
 */

/**
 * @function shortenMazzeAddress
 * @param {string} address - base32 string
 * @return {string} Return a short address
 */

/**
 * @function isZeroAddress
 * @param {string} address - base32 string
 * @return {boolean}
 */

/**
 * @function isInternalContractAddress
 * @param {string} address - base32 string
 * @return {boolean}
 */

/**
 * @function isValidHexAddress
 * @param {string} address - hex string
 * @return {boolean}
 */

/**
 * check if the address is valid proxyProvider hex address
 * @function isValidMazzeHexAddress
 * @param {string} address - hex string
 * @return {boolean}
 */

/**
 * Makes a ethereum checksum address
 *
 * > Note: support [EIP-55](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-55.md)
 * > Note: not support [RSKIP60](https://github.com/rsksmart/RSKIPs/blob/master/IPs/RSKIP60.md) yet
 *
 * @param {string} address - Hex string
 * @return {string}
 *
 * @example
 * > ethChecksumAddress('0x1b716c51381e76900ebaa7999a488511a4e1fd0a')
 "0x1B716c51381e76900EBAA7999A488511A4E1fD0a"
 */
function ethChecksumAddress(address) {
  return checksumAddress(address);
}

/**
 * Convert an ethereum address to proxyProvider hex address by replace it's first letter to 1
 * @param {string} address
 * @return {string}
 */
function ethAddressToMazzeAddress(address) {
  return `0x1${address.toLowerCase().slice(3)}`;
}

/**
 * Calculate MAZZE space address's mapped EVM address
 * @param {string} address - base32 string
 * @returns {string}
 *
 * @example
 * > mazzeMappedEVMSpaceAddress(mazze:aak2rra2njvd77ezwjvx04kkds9fzagfe6ku8scz91)
 * "0x12Bf6283CcF8Ad6ffA63f7Da63EDc217228d839A"
 */
function mazzeMappedEVMSpaceAddress(address) {
  const { hexAddress } = decode(address);
  const mappedBuf = keccak256(hexAddress).slice(-20);
  return checksumAddress(`0x${mappedBuf.toString('hex')}`);
}

module.exports = {
  encodeMazzeAddress: encode,
  decodeMazzeAddress: decode,
  ethChecksumAddress,
  ethAddressToMazzeAddress,
  mazzeMappedEVMSpaceAddress,
  ADDRESS_TYPES,
  isValidMazzeAddress,
  verifyMazzeAddress,
  hasNetworkPrefix,
  simplifyMazzeAddress,
  shortenMazzeAddress,
  isZeroAddress,
  isInternalContractAddress,
  isValidHexAddress,
  isValidMazzeHexAddress,
};
