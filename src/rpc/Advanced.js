const Big = require('big.js');
const CONST = require('../CONST');
const format = require('../util/format');

class AdvancedRPCUtilities {
  constructor(proxyProvider) {
    this.proxyProvider = proxyProvider;
  }

  /**
   * First try to use txpool_nextNonce method, if failed use mazze_getNextNonce
   *
   * @param {string} address - The address to get nonce
   * @returns {Promise<BigInt>}
   */
  async getNextUsableNonce(address) {
    address = this.proxyProvider._formatAddress(address);
    let nonce;
    try {
      nonce = await this.proxyProvider.txpool.nextNonce(address);
    } catch (e) {
      nonce = await this.proxyProvider.mazze.getNextNonce(address);
    }
    return nonce;
  }

  
  /**
   * A advance method to check whether user's balance is enough to pay one transaction
   *
   * @param {Object} options Transaction info
   * @param {string|number} [epochNumber] Optional epoch number
   * @returns {Promise<Object>} A object indicate whether user's balance is capable to pay the transaction.
   * - `BigInt` gasUsed: The gas used.
   * - `BigInt` gasLimit: The gas limit.
   * - `BigInt` storageCollateralized: The storage collateralized in Byte.
   * - `Boolean` isBalanceEnough: indicate balance is enough for gas and storage fee
   * - `Boolean` isBalanceEnoughForValueAndFee: indicate balance is enough for gas and storage fee plus value
   * - `Boolean` willPayCollateral: false if the transaction is eligible for storage collateral sponsorship, true otherwise
   * - `Boolean` willPayTxFee: false if the transaction is eligible for gas sponsorship, true otherwise
   */
  async estimateGasAndCollateralAdvance(options, epochNumber) {
    const estimateResult = await this.proxyProvider.mazze.estimateGasAndCollateral(options, epochNumber);
    if (!options.from) {
      throw new Error('Can not check balance without `from`');
    }
    options = this.proxyProvider._formatCallTx(options);
    const gasPrice = format.bigInt(options.gasPrice || BigInt(1));
    const txValue = format.bigInt(options.value || BigInt(0));
    const gasFee = gasPrice * estimateResult.gasLimit;
    const storageFee = estimateResult.storageCollateralized * (BigInt(1e18) / BigInt(1024));
    const balance = await this.proxyProvider.mazze.getBalance(options.from);
    estimateResult.balance = balance;
    if (!options.to) {
      estimateResult.willPayCollateral = true;
      estimateResult.willPayTxFee = true;
      estimateResult.isBalanceEnough = balance > (gasFee + storageFee);
      estimateResult.isBalanceEnoughForValueAndFee = balance > (gasFee + storageFee + txValue);
    } else {
      const checkResult = await this.proxyProvider.mazze.checkBalanceAgainstTransaction(
        options.from,
        options.to,
        estimateResult.gasLimit,
        gasPrice,
        estimateResult.storageCollateralized,
        epochNumber,
      );
      Object.assign(estimateResult, checkResult);
      let totalValue = txValue;
      totalValue += checkResult.willPayTxFee ? gasFee : BigInt(0);
      totalValue += checkResult.willPayCollateral ? storageFee : BigInt(0);
      estimateResult.isBalanceEnoughForValueAndFee = balance > totalValue;
    }
    return estimateResult;
  }
}

module.exports = AdvancedRPCUtilities;
