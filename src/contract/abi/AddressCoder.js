const { alignBuffer } = require('../../util');
const format = require('../../util/format');
const BaseCoder = require('./BaseCoder');

class AddressCoder extends BaseCoder {
  static from({ type, ...options }) {
    if (type !== 'address') {
      return undefined;
    }
    return new this({ ...options, type });
  }

  constructor({ type, ...options }) {
    super({ ...options, type });
    this.networkId = options.networkId;
  }

  /**
   * @param {string} address
   * @return {Buffer}
   */
  encode(address) {
    return alignBuffer(format.hexBuffer(format.hexAddress(address)));
  }

  /**
   * @param {import('../../util/HexStream')} stream
   * @return {string}
   */
  decode(stream) {
    const hexAddress = stream.read(40);
    const isProxyProviderAddress = hexAddress.startsWith('1') || hexAddress.startsWith('0') || hexAddress.startsWith('8');
    return (isProxyProviderAddress && this.networkId) ? format.address(`0x${hexAddress}`, this.networkId) : format.hexAddress(`0x${hexAddress}`);
  }
}

module.exports = AddressCoder;
