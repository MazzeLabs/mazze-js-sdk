const RPCError = require('../provider/RPCError');
const Transaction = require('../Transaction');
const format = require('../util/format');

const SEND_TX_METHOD = 'mazze_sendTransaction';
const SEND_RAW_TX_METHOD = 'mazze_sendRawTransaction';

class BatchRequester {
  /**
   * BatchRequester constructor.
   *
   * @param {import('../ProxyProvider').ProxyProvider} proxyProvider - A ProxyProvider instance
   */
  constructor(proxyProvider) {
    this.proxyProvider = proxyProvider;
    this.requests = [];
    this.decoders = [];
    this.accountNextNonces = {};
    this.accountUsedNonces = {};
  }

  /**
   * Add RPC method request to batch builder
   * @param {object} A - request meta info object, include 'request' and 'decoder'
   * @param {object} A.request - JSON-RPC request object, include `method` and `params` array
   * @param {function} A.decoder - Response decoder
   * @example
   * Low level example:
   * batchRequester.add({
   *  "request": {
   *    "method": "mazze_getStatus",
   *    "params": []
   *  },
   *  "decoder": decoderFunction
   * });
   *
   * Use RPC method's request method to build request:
   * batchRequester.add(proxyProvider.mazze.getBalance.request('mazzetest:aasm4c231py7j34fghntcfkdt2nm9xv1tu6jd3r1s7'));
   */
  add({ request, decoder = any => any }) {
    this.requests.push(request);
    this.decoders.push(decoder);
  }

  addTransaction(txOption) {
    this.add({
      request: {
        method: SEND_TX_METHOD,
        params: [txOption],
      },
    });
  }

  /**
   * Clear Batch requester's requests and decoders
   */
  clear() {
    this.requests = [];
    this.decoders = [];
    this.accountNextNonces = {};
    this.accountUsedNonces = {};
  }

  /**
   * Batch send the RPC requests, retrive the responses and decode
   * @returns {Array}
   * @example await batchRequester.execute();
   */
  async execute() {
    // prepare transaction nonce and sign it
    const _requests = [];
    await this._prepareTxCommonInfo();
    await this._prepareTxNonce();
    await this._prepareGasAndStorage();
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < this.requests.length; i++) {
      const req = this.requests[i];

      if (
        req.method === SEND_TX_METHOD
        && req.params[0]
        && req.params[0].from
        && this.proxyProvider.wallet.has(req.params[0].from)
      ) {
        // sign transaction
        const from = req.params[0].from;
        const account = await this.proxyProvider.wallet.get(`${from}`);
        const signedTx = await account.signTransaction(req.params[0]);
        // change method to mazze_sendRawTransaction
        req.method = SEND_RAW_TX_METHOD;
        req.params[0] = signedTx.serialize();
      }

      _requests[i] = req;
    }

    // decode response
    const results = await this.proxyProvider.provider.batch(_requests);
    return results.map((data, i) => {
      if (data instanceof RPCError) { // If is error direct return
        return data;
      }
      return this.decoders[i](data);
    });
  }

  async _prepareTxNonce() {
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < this.requests.length; i++) {
      const req = this.requests[i];

      if (req.method === SEND_RAW_TX_METHOD) {
        const _tx = Transaction.decodeRaw(req.params[0]);
        this._markNonceUsed(_tx.from, _tx.nonce);
      }

      if (
        req.method === SEND_TX_METHOD
        && req.params[0]
        && req.params[0].from
        && this.proxyProvider.wallet.has(req.params[0].from)
      ) {
        // prepare nonce
        const from = req.params[0].from;
        let _nonce = req.params[0].nonce;
        if (!_nonce || this._isNonceUsed(from, _nonce)) {
          _nonce = await this._getNextNonce(from);
          req.params[0].nonce = _nonce;
        }
        this._markNonceUsed(from, _nonce);
      }
    }
  }

  async _prepareTxCommonInfo() {
    const txCommon = await this._getTxCommonInfo();
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < this.requests.length; i++) {
      const req = this.requests[i];

      if (req.method === SEND_TX_METHOD && req.params[0]) {
        if (!req.params[0].gasPrice) {
          req.params[0].gasPrice = txCommon.gasPrice;
        }

        if (!req.params[0].chainId) {
          req.params[0].chainId = txCommon.chainId;
        }

        if (!req.params[0].epochHeight) {
          req.params[0].epochHeight = txCommon.epochHeight;
        }
      }
    }
  }

  async _prepareGasAndStorage() {
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < this.requests.length; i++) {
      const req = this.requests[i];

      if (req.method === SEND_TX_METHOD && req.params[0]) {
        if (!req.params[0].gas || !req.params[0].storageLimit) {
          const {
            gasLimit,
            storageCollateralized,
          } = await this.proxyProvider.mazze.estimateGasAndCollateral(req.params[0]);
          req.params[0].gas = gasLimit;
          req.params[0].storageLimit = storageCollateralized;
        }
      }
    }
  }

  _markNonceUsed(from, nonce) {
    from = format.address(from, this.proxyProvider.networkId);
    nonce = format.bigUInt(nonce);

    if (!this.accountUsedNonces[from]) {
      this.accountUsedNonces[from] = {};
    }
    this.accountUsedNonces[from][nonce] = true;
  }

  _isNonceUsed(from, nonce) {
    from = format.address(from, this.proxyProvider.networkId);
    nonce = format.bigUInt(nonce);

    return this.accountUsedNonces[from] && this.accountUsedNonces[from][nonce];
  }

  async _getTxCommonInfo() {
    const epochHeight = await this.proxyProvider.mazze.epochNumber();
    const gasPrice = await this.proxyProvider.mazze.gasPrice();
    return {
      epochHeight,
      gasPrice,
      chainId: this.proxyProvider.networkId,
    };
  }

  async _getNextNonce(from) {
    let _nonce = this.accountNextNonces[from];
    if (!_nonce) {
      _nonce = await this.proxyProvider.advanced.getNextUsableNonce(from);
    }
    //
    while (this.accountUsedNonces[from] && this.accountUsedNonces[from][_nonce]) {
      _nonce += BigInt(1);
    }

    this.accountNextNonces[from] = _nonce + BigInt(1); // update next nonce

    return _nonce;
  }
}

module.exports = BatchRequester;
