const RPCMethodFactory = require('./index');
const format = require('../util/format');
const mazzeFormat = require('./types/formatter');
const addressUtil = require('../util/address');
const CONST = require('../CONST');
const { assert } = require('../util');
const { decodeMazzeAddress, ADDRESS_TYPES } = require('../util/address');
const PendingTransaction = require('../subscribe/PendingTransaction');
const Contract = require('../contract');
const RPCTypes = require('./types/index');

/**
 * @typedef { import('../Transaction').TransactionMeta } TransactionMeta
 */
class MAZZE extends RPCMethodFactory {
  constructor(proxyProvider) {
    super(proxyProvider);
    this.proxyProvider = proxyProvider;
    this._formatAddress = proxyProvider._formatAddress.bind(proxyProvider);
    // add RPC methods
    super.addMethods(this.methods());
    // decorate methods;
    this.sendRawTransaction = this._decoratePendingTransaction(this.sendRawTransaction);
    this.sendTransaction = this._decoratePendingTransaction(this.sendTransaction);
    this._addRequestBuilderToCustomMethods();
  }

  methods() {
    const formatAddressWithNetworkId = this._formatAddress;
    return [
      {
        method: 'mazze_clientVersion',
      },
      {
        method: 'mazze_getSupplyInfo',
        requestFormatters: [
          format.epochNumberOrUndefined,
        ],
        responseFormatter: mazzeFormat.supplyInfo,
      },
      {
        method: 'mazze_getStatus',
        responseFormatter: mazzeFormat.status,
      },
      {
        method: 'mazze_gasPrice',
        alias: 'getGasPrice',
        responseFormatter: format.bigUInt,
      },
      {
        method: 'mazze_maxPriorityFeePerGas',
        responseFormatter: format.bigUInt,
      },
      {
        method: 'mazze_getFeeBurnt',
        requestFormatters: [
          format.epochNumberOrUndefined,
        ],
        responseFormatter: format.bigUInt,
      },
      {
        method: 'mazze_feeHistory',
        requestFormatters: [
          format.bigUIntHex,
          format.epochNumber,
          format.any, // f64 array
        ],
        responseFormatter: mazzeFormat.feeHistory,
      },
      {
        method: 'mazze_getInterestRate',
        requestFormatters: [
          format.epochNumberOrUndefined,
        ],
        responseFormatter: format.bigUInt,
      },
      {
        method: 'mazze_getAccumulateInterestRate',
        requestFormatters: [
          format.epochNumberOrUndefined,
        ],
        responseFormatter: format.bigUInt,
      },
      {
        method: 'mazze_getAccount',
        requestFormatters: [
          formatAddressWithNetworkId,
          format.epochNumberOrUndefined,
        ],
        responseFormatter: data => new RPCTypes.Account(data),
      },
      {
        method: 'mazze_getBalance',
        requestFormatters: [
          formatAddressWithNetworkId,
          format.epochNumberOrBlockHash,
        ],
        responseFormatter: format.bigUInt,
      },
      {
        method: 'mazze_getNextNonce',
        requestFormatters: [
          formatAddressWithNetworkId,
          format.epochNumberOrBlockHash,
        ],
        responseFormatter: format.bigUInt,
      },
      {
        method: 'mazze_getAdmin',
        requestFormatters: [
          formatAddressWithNetworkId,
          format.epochNumberOrUndefined,
        ],
      },
      {
        method: 'mazze_getVoteList',
        requestFormatters: [
          formatAddressWithNetworkId,
          format.epochNumberOrUndefined,
        ],
        responseFormatter: mazzeFormat.voteList,
      },
      {
        method: 'mazze_getDepositList',
        requestFormatters: [
          formatAddressWithNetworkId,
          format.epochNumberOrUndefined,
        ],
        responseFormatter: mazzeFormat.depositList,
      },
      {
        method: 'mazze_epochNumber',
        alias: 'getEpochNumber',
        requestFormatters: [
          format.epochNumberOrUndefined,
        ],
        responseFormatter: format.uInt,
      },
      {
        method: 'mazze_getBlockByEpochNumber',
        requestFormatters: [
          format.epochNumber,
          format.boolean, // TODO default false
        ],
        responseFormatter: mazzeFormat.block.$or(null),
      },
      {
        method: 'mazze_getBlockByBlockNumber',
        requestFormatters: [
          format.bigUIntHex,
          format.boolean,
        ],
        responseFormatter: mazzeFormat.block.$or(null),
      },
      {
        method: 'mazze_getBlocksByEpoch',
        alias: 'getBlocksByEpochNumber',
        requestFormatters: [
          format.epochNumber,
        ],
      },
      {
        method: 'mazze_getBlockRewardInfo',
        requestFormatters: [
          format.epochNumber,
        ],
        responseFormatter: mazzeFormat.rewardInfo,
      },
      {
        method: 'mazze_getBestBlockHash',
      },
      {
        method: 'mazze_getBlockByHash',
        requestFormatters: [
          format.blockHash,
          format.boolean,
        ],
        responseFormatter: mazzeFormat.block.$or(null),
      },
      {
        method: 'mazze_getBlockByHashWithPivotAssumption',
        requestFormatters: [
          format.blockHash,
          format.blockHash,
          format.epochNumber,
        ],
        responseFormatter: mazzeFormat.block,
      },
      {
        method: 'mazze_getConfirmationRiskByHash',
        requestFormatters: [
          format.blockHash,
        ],
        responseFormatter: format.fixed64.$or(null),
      },
      {
        method: 'mazze_getTransactionByHash',
        requestFormatters: [
          format.transactionHash,
        ],
        responseFormatter: mazzeFormat.transaction.$or(null),
      },
      {
        method: 'mazze_getTransactionReceipt',
        requestFormatters: [
          format.transactionHash,
        ],
        responseFormatter: mazzeFormat.receipt.$or(null),
      },
      {
        method: 'mazze_sendRawTransaction',
        requestFormatters: [
          format.hex,
        ],
      },
      {
        method: 'mazze_getCode',
        requestFormatters: [
          formatAddressWithNetworkId,
          format.epochNumberOrBlockHash,
        ],
        responseFormatter: format.any,
      },
      {
        method: 'mazze_getStorageAt',
        requestFormatters: [
          formatAddressWithNetworkId,
          format.hex64,
          format.epochNumberOrBlockHash,
        ],
      },
      {
        method: 'mazze_getStorageRoot',
        requestFormatters: [
          formatAddressWithNetworkId,
          format.epochNumberOrUndefined,
        ],
      },
      {
        method: 'mazze_getSponsorInfo',
        requestFormatters: [
          formatAddressWithNetworkId,
          format.epochNumberOrUndefined,
        ],
        responseFormatter: mazzeFormat.sponsorInfo,
      },
      {
        method: 'mazze_getAccountPendingInfo',
        requestFormatters: [
          formatAddressWithNetworkId,
        ],
        responseFormatter: mazzeFormat.accountPendingInfo,
      },
      {
        method: 'mazze_getAccountPendingTransactions',
        requestFormatters: [
          formatAddressWithNetworkId,
          format.bigUIntHex.$or(undefined),
          format.bigUIntHex.$or(undefined),
        ],
        responseFormatter: mazzeFormat.accountPendingTransactions,
      },
      {
        method: 'mazze_getCollateralForStorage',
        requestFormatters: [
          formatAddressWithNetworkId,
          format.epochNumberOrUndefined,
        ],
        responseFormatter: format.bigUInt,
      },
      {
        method: 'mazze_checkBalanceAgainstTransaction',
        requestFormatters: [
          formatAddressWithNetworkId,
          formatAddressWithNetworkId,
          format.bigUIntHex,
          format.bigUIntHex,
          format.bigUIntHex,
          format.epochNumberOrUndefined,
        ],
        responseFormatter: format.any,
      },
      /* {
        method: 'mazze_call',
        requestFormatters: [
          this.proxyProvider._formatCallTx,
          format.epochNumberOrUndefined,
        ],
        responseFormatter: format.any, // TODO catch exception and decode error
      },
      {
        method: 'mazze_estimateGasAndCollateral',
        requestFormatters: [
          this.proxyProvider._formatCallTx,
          format.epochNumberOrUndefined,
        ],
        responseFormatter: mazzeFormat.estimate,
      }, */
      {
        method: 'mazze_getLogs',
        beforeHook(options) {
          if (options.blockHashes !== undefined && (options.fromEpoch !== undefined || options.toEpoch !== undefined)) {
            throw new Error('OverrideError, do not use `blockHashes` with `fromEpoch` or `toEpoch`, cause only `blockHashes` will take effect');
          }
        },
        requestFormatters: [
          this.proxyProvider._formatGetLogs.bind(this.proxyProvider),
        ],
        responseFormatter: mazzeFormat.logs,
      },
      {
        method: 'mazze_getParamsFromVote',
        requestFormatters: [
          format.epochNumberOrUndefined,
        ],
        responseFormatter: mazzeFormat.voteParamsInfo,
      },
      {
        method: 'mazze_getCollateralInfo',
        requestFormatters: [
          format.epochNumberOrUndefined,
        ],
        responseFormatter: mazzeFormat.collateralInfo,
      },
      {
        method: 'mazze_newFilter',
        requestFormatters: [
          format.getLogs,
        ],
      },
      {
        method: 'mazze_newBlockFilter',
      },
      {
        method: 'mazze_newPendingTransactionFilter',
      },
      {
        method: 'mazze_getFilterChanges',
        requestFormatters: [
          format.hex32,
        ],
        responseFormatter: mazzeFormat.logs.$or(format([format.hex64])),
      },
      {
        method: 'mazze_getFilterLogs',
        requestFormatters: [
          format.hex32,
        ],
        responseFormatter: mazzeFormat.logs,
      },
      {
        method: 'mazze_uninstallFilter',
        requestFormatters: [
          format.hex32,
        ],
      },
      {
        method: 'mazze_getEpochReceipts',
        debug: true,
        requestFormatters: [
          format.epochNumber,
          format.boolean.$or(undefined),
        ],
        responseFormatter: mazzeFormat.epochReceipts,
      },
      {
        method: 'debug_getTransactionsByEpoch',
        debug: true,
        requestFormatters: [
          format.bigUIntHex,
        ],
        responseFormatter: format([format.wrapTransaction]),
      },
      {
        method: 'debug_getTransactionsByBlock',
        debug: true,
        requestFormatters: [
          format.blockHash,
        ],
        responseFormatter: format([format.wrapTransaction]),
      },
      {
        method: 'debug_getEpochReceiptProofByTransaction',
        debug: true,
        requestFormatters: [
          format.transactionHash,
        ],
      },
    ];
  }

  _decoratePendingTransaction(func) {
    const mazze = this;
    return function (...args) {
      return new PendingTransaction(mazze, func.bind(this), args);
    };
  }

  _addRequestBuilderToCustomMethods() {
    const self = this;

    this.call.request = function (options, epochNumber) {
      return {
        request: {
          method: 'mazze_call',
          params: [
            self.proxyProvider._formatCallTx(options),
            format.epochNumberOrBlockHash(epochNumber),
          ],
        },
      };
    };

    this.estimateGasAndCollateral.request = function (options, epochNumber) {
      return {
        request: {
          method: 'mazze_estimateGasAndCollateral',
          params: [
            self.proxyProvider._formatCallTx(options),
            format.epochNumber.$or(undefined)(epochNumber),
          ],
        },
        decoder: mazzeFormat.estimate,
      };
    };
  }

  /**
   * Auto populate transaction info (chainId, epochNumber, nonce, gas, gasPrice, storageLimit)
   *
   * @param {TransactionMeta} options transaction info
   * @returns {Promise<TransactionMeta>} Polulated complete transaction
   */
  async populateTransaction(options) {
    const {
      defaultGasPrice,
    } = this.proxyProvider;

    options.from = this._formatAddress(options.from);

    if (options.nonce === undefined) {
      options.nonce = await this.proxyProvider.advanced.getNextUsableNonce(options.from);
    }

    if (options.chainId === undefined) {
      options.chainId = this.proxyProvider.networkId;
    }

    if (options.chainId === undefined) {
      const status = await this.getStatus();
      options.chainId = status.chainId;
    }

    if (options.epochHeight === undefined) {
      options.epochHeight = await this.epochNumber();
    }

    if (options.gasPrice && (options.maxFeePerGas || options.maxPriorityFeePerGas)) {
      throw new Error('`gasPrice` should not be set with `maxFeePerGas` or `maxPriorityFeePerGas`');
    }

    // auto detect transaction type
    let baseFeePerGas;
    if (options.type === undefined) {
      const block = await this.getBlockByEpochNumber(options.epochHeight, false);
      baseFeePerGas = block.baseFeePerGas;

      const pre1559Type = options.accessList ? CONST.TRANSACTION_TYPE_EIP2930 : CONST.TRANSACTION_TYPE_LEGACY;
      options.type = baseFeePerGas ? CONST.TRANSACTION_TYPE_EIP1559 : pre1559Type;
    }

    if (options.gas === undefined || options.storageLimit === undefined) {
      let gas;
      let storageLimit;

      const isToUser = options.to && addressUtil.isValidMazzeAddress(options.to) && decodeMazzeAddress(options.to).type === ADDRESS_TYPES.USER;
      if (isToUser && !options.data && !options.accessList) {
        gas = CONST.TRANSACTION_GAS;
        storageLimit = CONST.TRANSACTION_STORAGE_LIMIT;
      } else {
        const { gasUsed, storageCollateralized } = await this.estimateGasAndCollateral(options);
        gas = gasUsed;
        storageLimit = storageCollateralized;
      }

      if (options.gas === undefined) {
        options.gas = gas;
      }

      if (options.storageLimit === undefined) {
        options.storageLimit = storageLimit;
      }
    }

    // auto fill gasPrice
    if (options.type === CONST.TRANSACTION_TYPE_LEGACY || options.type === CONST.TRANSACTION_TYPE_EIP2930) {
      if (options.gasPrice === undefined) {
        if (defaultGasPrice === undefined) {
          const gasPrice = await this.gasPrice();
          options.gasPrice = Number(gasPrice) === 0 ? CONST.MIN_GAS_PRICE : gasPrice;
        } else {
          options.gasPrice = defaultGasPrice;
        }
      }
      options.maxFeePerGas = undefined;
      options.maxPriorityFeePerGas = undefined;
    }
    // auto fill maxPriorityFeePerGas and maxFeePerGas
    if (options.type === CONST.TRANSACTION_TYPE_EIP1559) {
      if (options.gasPrice) {
        options.maxFeePerGas = options.gasPrice;
        options.maxPriorityFeePerGas = options.gasPrice;
        options.gasPrice = undefined;
      }

      if (!options.maxPriorityFeePerGas) {
        options.maxPriorityFeePerGas = await this.maxPriorityFeePerGas();
      }

      if (!options.maxFeePerGas) {
        if (!baseFeePerGas) {
          const block = await this.getBlockByEpochNumber(options.epochHeight, false);
          baseFeePerGas = block.baseFeePerGas;
        }

        options.maxFeePerGas = options.maxPriorityFeePerGas + baseFeePerGas * BigInt(2);
      }

      if (options.maxFeePerGas < options.maxPriorityFeePerGas) {
        throw new Error('`maxFeePerGas` should not be less than `maxPriorityFeePerGas`');
      }
    }

    return options;
  }

  /**
   * Auto populate transaction and sign it with `from` 's privateKey in wallet
   *
   * @param {TransactionMeta} options transaction info
   * @returns {Promise<string>} Hex encoded raw transaction
   */
  async populateAndSignTransaction(options) {
    await this.populateTransaction(options);
    const account = await this.proxyProvider.wallet.get(`${options.from}`);
    const signedTx = await account.signTransaction(options);
    return signedTx.serialize();
  }

  /**
   * Auto populate transaction
   * if from's privateKey is in wallet, directly sign and encode it then send the rawTransaction with `mazze_sendRawTransaction` method
   * if not, sent the transaction with `mazze_sendTransaction` method
   *
   * @param {TransactionMeta} options transaction info
   * @param {string} [password] Optional password to unlock account in fullnode
   * @return {Promise<string>} Transaction hash
   */
  async sendTransaction(options, ...extra) {
    if (this.proxyProvider.wallet.has(`${options.from}`)) {
      const rawTx = await this.populateAndSignTransaction(options);
      return this.sendRawTransaction(rawTx);
    }

    return this.proxyProvider.request({
      method: 'mazze_sendTransaction',
      params: [
        this.proxyProvider._formatCallTx(options),
        ...extra,
      ],
    });
  }

  /**
   * Get epoch's receipt through pivot block's hash
   *
   * @param {string} pivotBlockHash Hash of pivot block
   * @returns {Promise<Array>} All receipts of one epoch
   */
  async getEpochReceiptsByPivotBlockHash(pivotBlockHash) {
    const result = await this.proxyProvider.request({ method: 'mazze_getEpochReceipts', params: [`hash:${pivotBlockHash}`] });
    return mazzeFormat.epochReceipts(result);
  }

  /**
   * Virtually call a contract, return the output data.
   *
   * @param {TransactionMeta} options - See [Transaction](#Transaction.js/Transaction/**constructor**)
   * @param {string|number} [epochNumber='latest_state'] - See [format.epochNumber](#util/format.js/format/(static)epochNumber)
   * @return {Promise<string>} The output data.
   */
  async call(options, epochNumber) {
    try {
      if (options.to && addressUtil.hasNetworkPrefix(options.to) && this.proxyProvider.networkId) {
        const {
          netId,
          // type,
        } = addressUtil.decodeMazzeAddress(options.to);
        // check target address's networkId with current RPC's networkId
        assert(netId === this.proxyProvider.networkId, '`to` address\'s networkId is not match current RPC\'s networkId');
        // check target contract is exist
        /* if (type === ADDRESS_TYPES.CONTRACT) {
          const code = await this.getCode(options.to);
          assert(code !== '0x', 'Contract not exist!');
        } */
      }

      return await this.proxyProvider.request({
        method: 'mazze_call',
        params: [
          this.proxyProvider._formatCallTx(options),
          format.epochNumber.$or(undefined)(epochNumber),
        ],
      });
    } catch (e) {
      throw Contract.decodeError(e);
    }
  }

  /**
   * Virtually call a contract, return the estimate gas used and storage collateralized.
   *
   * @param {TransactionMeta} options - See [Transaction](#Transaction.js/Transaction/**constructor**)
   * @param {string|number} [epochNumber='latest_state'] - See [format.epochNumber](#util/format.js/format/(static)epochNumber)
   * @return {Promise<import('./types/formatter').EstimateResult>} A estimate result object:
   * - `BigInt` gasUsed: The gas used.
   * - `BigInt` gasLimit: The gas limit.
   * - `BigInt` storageCollateralized: The storage collateralized in Byte.
   */
  async estimateGasAndCollateral(options, epochNumber) {
    try {
      const result = await this.proxyProvider.request({
        method: 'mazze_estimateGasAndCollateral',
        params: [
          this.proxyProvider._formatCallTx(options),
          format.epochNumber.$or(undefined)(epochNumber),
        ],
      });
      return mazzeFormat.estimate(result);
    } catch (e) {
      throw Contract.decodeError(e);
    }
  }
}

module.exports = MAZZE;
