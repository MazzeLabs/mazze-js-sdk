const { keccak256, ecdsaSign, ecdsaRecover, publicKeyToAddress } = require('./util/sign');
const format = require('./util/format');

/** Class provide message sign utilities. */
class Message {
  /**
   * Signs the hash with the privateKey.
   *
   * @param {string|Buffer} privateKey - Private key used to sign message
   * @param {string|Buffer} messageHash - The message hash need to be signed
   * @return {string} The signature as hex string.
   *
   * @example
   * > Message.sign(
   '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', // privateKey
   '0x592fa743889fc7f92ac2a37bb1f5ba1daf2a5c84741ca0e0061d243a2e6707ba',
   )
   "0x6e913e2b76459f19ebd269b82b51a70e912e909b2f5c002312efc27bcc280f3c29134d382aad0dbd3f0ccc9f0eb8f1dbe3f90141d81574ebb6504156b0d7b95f01"
   */
  static sign(privateKey, messageHash) {
    const { r, s, v } = ecdsaSign(format.hexBuffer(messageHash), format.hexBuffer(privateKey));
    const buffer = Buffer.concat([r, s, format.hexBuffer(v)]);
    return format.hex(buffer);
  }

  /**
   * Recovers the signers publicKey from the signature.
   *
   * @param {string|Buffer} signature
   * @param {string|Buffer} messageHash
   * @return {string} The publicKey as hex string.
   *
   * @example
   * > Message.recover(
   '0x6e913e2b76459f19ebd269b82b51a70e912e909b2f5c002312efc27bcc280f3c29134d382aad0dbd3f0ccc9f0eb8f1dbe3f90141d81574ebb6504156b0d7b95f01',
   '0x592fa743889fc7f92ac2a37bb1f5ba1daf2a5c84741ca0e0061d243a2e6707ba',
   )
   "0x4646ae5047316b4230d0086c8acec687f00b1cd9d1dc634f6cb358ac0a9a8ffffe77b4dd0a4bfb95851f3b7355c781dd60f8418fc8a65d14907aff47c903a559"
   */
  static recover(signature, messageHash) {
    const signatureBuffer = format.hexBuffer(signature);
    const r = signatureBuffer.slice(0, 32);
    const s = signatureBuffer.slice(32, 64);
    const v = signatureBuffer[64];
    const buffer = ecdsaRecover(format.hexBuffer(messageHash), { r, s, v });
    return format.publicKey(buffer);
  }

  /**
   * @param {string} message
   * @return {Message}
   *
   * @example
   * > msg = new Message('Hello World');
   Message {
      message: 'Hello World',
    }
   * > msg.sign('0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');
   Message {
      message: 'Hello World',
      signature: '0x6e913e2b76459f19ebd269b82b51a70e912e909b2f5c002312efc27bcc280f3c29134d382aad0dbd3f0ccc9f0eb8f1dbe3f90141d81574ebb6504156b0d7b95f01'
    }
   * > msg.signature
   "0x6e913e2b76459f19ebd269b82b51a70e912e909b2f5c002312efc27bcc280f3c29134d382aad0dbd3f0ccc9f0eb8f1dbe3f90141d81574ebb6504156b0d7b95f01"
   * > msg.hash
   "0x592fa743889fc7f92ac2a37bb1f5ba1daf2a5c84741ca0e0061d243a2e6707ba"
   * > msg.from
   "mazzetest:aasm4c231py7j34fghntcfkdt2nm9xv1tu6jd3r1s7"
   * > msg.r
   "0x6e913e2b76459f19ebd269b82b51a70e912e909b2f5c002312efc27bcc280f3c"
   * > msg.s
   "0x29134d382aad0dbd3f0ccc9f0eb8f1dbe3f90141d81574ebb6504156b0d7b95f"
   * > msg.v
   1
   */
  constructor(message) {
    this.message = message;
  }

  /**
   * Getter of message hash include signature.
   *
   * > Note: calculate every time.
   *
   * @return {string}
   */
  get hash() {
    return format.hex(keccak256(Buffer.from(this.message)));
  }

  /**
   * Getter of sender address.
   *
   * > Note: calculate every time.
   *
   * @return {string|undefined} If ECDSA recover success return address, else return undefined.
   */
  get from() {
    try {
      const publicKey = Message.recover(this.signature, this.hash);
      return format.address(publicKeyToAddress(format.hexBuffer(publicKey)), this.networkId);
    } catch (e) {
      return undefined;
    }
  }

  /**
   * Sign message and set 'r','s','v' and 'hash'.
   *
   * @param {string} privateKey - Private key hex string.
   * @param {number} networkId - Network id of account
   * @return {Message}
   */
  sign(privateKey, networkId) {
    this.signature = Message.sign(privateKey, this.hash);
    this.networkId = networkId;
    return this;
  }

  /**
   * Get signatures r
   * @return {string}
   */
  get r() {
    try {
      return this.signature.slice(0, 2 + 64);
    } catch (e) {
      return undefined;
    }
  }

  /**
   * Get signatures s
   * @return {string}
   */
  get s() {
    try {
      return `0x${this.signature.slice(2 + 64, 2 + 128)}`;
    } catch (e) {
      return undefined;
    }
  }

  /**
   * Get signatures v
   * @return {number}
   */
  get v() {
    try {
      return parseInt(this.signature.slice(2 + 128, 2 + 130), 16);
    } catch (e) {
      return undefined;
    }
  }
}

module.exports = Message;
