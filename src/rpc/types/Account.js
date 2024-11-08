const format = require('../../util/format');
const CONST = require('../../CONST');

const formatAccount = format({
  accumulatedInterestReturn: format.bigUInt,
  balance: format.bigUInt,
  nonce: format.bigUInt,
}, {
  name: 'format.account',
});

class Account {
  static format(data) {
    return formatAccount(data);
  }

  constructor(accountMeta) {
    const {
      address,
      balance,
      nonce,
      codeHash,
      accumulatedInterestReturn,
      admin,
    } = Account.format(accountMeta);
    /** @type {string} */
    this.address = address;
    /** @type {BigInt} */
    this.balance = balance;
    /** @type {BigInt} */
    this.nonce = nonce;
    /** @type {string} */
    this.codeHash = codeHash;
    /** @type {string} */
    this.admin = admin;
    return this;
  }

  isExternalAccount() {
    return this.codeHash === CONST.KECCAK_EMPTY;
  }
}

module.exports = Account;
