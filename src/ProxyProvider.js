const CONST = require('./CONST');
const { assert } = require('./util');
const format = require('./util/format');
const mazzeFormat = require('./rpc/types/formatter');
const providerFactory = require('./provider');
const Wallet = require('./wallet');
const Contract = require('./contract');
const INTERNAL_CONTRACTS = require('./contract/internal');
const { MRC20_ABI } = require('./contract/standard');
const PendingTransaction = require('./subscribe/PendingTransaction');
const Subscription = require('./subscribe/Subscription');
const pkg = require('../package.json');
const MAZZE = require('./rpc/mazze');
const Trace = require('./rpc/trace');
const TxPool = require('./rpc/txpool');
const BatchRequester = require('./rpc/BatchRequester');
const AdvancedRPCUtilities = require('./rpc/Advanced');

/**
 * @typedef {Object} ProxyProviderOption
 * @property {string|number} [options.defaultGasPrice] - The default gas price in mazzy to use for transactions.
 * @property {string} [options.url] - Url of ProxyProvider node to connect.
 * @property {number} [options.retry] - Retry times if request error occurs.
 * @property {number} [options.timeout] - Request time out in ms
 * @property {Object} [options.logger] - Logger object with 'info' and 'error' method.
 * @property {number} [options.networkId] - Connected RPC's networkId
 * @property {boolean} [options.useWechatProvider] - Use wechat provider
 * @property {boolean} [options.useHexAddressInParameter] - Use hex address in parameter
 * @property {boolean} [options.useVerboseAddress] - Use verbose address
 */

/**
 * The Client class that provides an interface to the ProxyProvider network.
 */
class ProxyProvider {
  /**
   * Create a ProxyProvider instance with networdId set up
   * @param {ProxyProviderOption} options
   * @return {ProxyProvider}
   */
  static async create(options) {
    const mazze = new ProxyProvider(options);
    if (options.networkId) return mazze;
    await mazze.updateNetworkId();
    return mazze;
  }

  /**
   * @param {ProxyProviderOption} [options] - ProxyProvider and Provider constructor options.
   * @return {ProxyProvider}
   * @example
   * > const { ProxyProvider } = require('mazze-js-sdk');
   * > const proxyProvider = new ProxyProvider({url:'https://devnet.mazze.io', networkId: 1});
   *
   * @example
   * > const proxyProvider = new ProxyProvider({
     url: 'http://localhost:8000',
     defaultGasPrice: 100,
     logger: console,
   });
   */
  constructor({
    defaultGasPrice,
    networkId,
    useHexAddressInParameter = false,
    useVerboseAddress = false,
    ...rest
  } = {}) {
    /** @type {string} */
    this.version = pkg.version;

    /**
     * Provider for rpc call
     *
     * @type {import('./provider/BaseProvider').BaseProvider|import('./provider/WechatProvider').WechatProvider|import('./provider/HttpProvider').HttpProvider|import('./provider/WebsocketProvider').WebsocketProvider}
     */
    this.provider = providerFactory(rest);

    /**
     * Wallet for `sendTransaction` to get `Account` by `from` field
     *
     * @type {import("./wallet/Wallet").Wallet}
     */
    this.wallet = new Wallet();

    /**
     * Default gas price for following methods:
     * - `ProxyProvider.sendTransaction`
     *
     * @deprecated
     * @type {number|string}
     */
    this.defaultGasPrice = defaultGasPrice;

    this.sendRawTransaction = this._decoratePendingTransaction(this.sendRawTransaction);
    this.sendTransaction = this._decoratePendingTransaction(this.sendTransaction);

    if (networkId) {
      this.networkId = networkId;
      this.wallet.setNetworkId(networkId);
    }

    this.useHexAddressInParameter = useHexAddressInParameter;
    this.useVerboseAddress = useVerboseAddress;

  
    /**
     * trace RPC methods
     * @type {import('./rpc/trace').Trace}
     */
    this.trace = new Trace(this);
    /**
     * txpool RPC methods
     * @type {import('./rpc/txpool').TxPool}
     */
    this.txpool = new TxPool(this);
    /**
     * mazze RPC methods
     * @type {import('./rpc/mazze').MAZZE}
     */
    this.mazze = new MAZZE(this);
    /**
     * Advanced RPC compose methods
     * @type {import('./rpc/Advanced').AdvancedRPCUtilities}
     */
    this.advanced = new AdvancedRPCUtilities(this);
  }

  /**
   * Different kind provider API wrapper
   */
  request(req) {
    if (this.provider.request) {
      return this.provider.request(req);
    }
    if (this.provider.call) {
      return this.provider.call(req.method, ...req.params);
    }
    if (this.provider.send) {
      return this.provider.send(req.method, req.params);
    }
    throw new Error('Provider does not support request');
  }

  /**
   * @private
   */
  _decoratePendingTransaction(func) {
    const proxyProvider = this;
    return function (...args) {
      return new PendingTransaction(proxyProvider, func.bind(this), args);
    };
  }

  /**
   * @private
   */
  _formatAddress(address) {
    if (!this.networkId) {
      console.warn('ProxyProvider address: networkId is not set properly, please set it');
    }
    return this.useHexAddressInParameter ? format.hexAddress(address) : format.address(address, this.networkId, this.useVerboseAddress);
  }

  /**
   * @private
   */
  _formatCallTx(options) {
    return mazzeFormat.callTxAdvance(this.networkId, this.useHexAddressInParameter, this.useVerboseAddress)(options);
  }

  /**
   * @private
   */
  _formatGetLogs(options) {
    return mazzeFormat.getLogsAdvance(this.networkId, this.useHexAddressInParameter, this.useVerboseAddress)(options);
  }

  /**
   * A shout cut for `new Contract(options, proxyProvider);`
   *
   * @param {object} options - See [Contract.constructor](Contract.md#Contract.js/constructor)
   * @return {import('./contract/index').Contract}
   */
  Contract(options) {
    return new Contract(options, this);
  }

  /**
   * Create internal contract by default abi and address
   *
   * - [AdminControl](https://github.com/MazzeLabs/mazze-rust/blob/master/internal_contract/contracts/AdminControl.sol)
   * - [SponsorWhitelistControl](https://github.com/MazzeLabs/mazze-rust/blob/master/internal_contract/contracts/SponsorWhitelistControl.sol)

   *
   * @param {"AdminControl"|"SponsorWhitelistControl"|"CrossSpaceCall"} name - Internal contract name
   * @return {import('./contract/index').Contract}
   *
   * @example
   * > proxyProvider.InternalContract('AdminControl')
   {
    constructor: [Function: bound call],
    abi: ContractABI { * },
    address: '0x0888000000000000000000000000000000000000',
    destroy: [Function: bound call],
    getAdmin: [Function: bound call],
    setAdmin: [Function: bound call],
    'destroy(address)': [Function: bound call],
    '0x00f55d9d': [Function: bound call],
    'getAdmin(address)': [Function: bound call],
    '0x64efb22b': [Function: bound call],
    'setAdmin(address,address)': [Function: bound call],
    '0xc55b6bb7': [Function: bound call]
  }
   */
  InternalContract(name) {
    const options = INTERNAL_CONTRACTS[name];
    assert(options, `can not find internal contract named "${name}"`);
    return this.Contract(options);
  }

  /**
   * Create an token MRC20 contract with standard MRC20 abi
   *
   * @param {string} address
   * @returns  {import('./contract/index').Contract} A token contract instance
   */
  MRC20(address) {
    return this.Contract({ address, abi: MRC20_ABI });
  }

  /**
   * Return a BatchRequester instance which can used to build batch request and decode response data
   * @returns {import('./rpc/BatchRequester').BatchRequester} - A BatchRequester instance
   */
  BatchRequest() {
    return new BatchRequester(this);
  }

  /**
   * close connection.
   *
   * @example
   * > proxyProvider.close();
   */
  close() {
    this.provider.close();
  }

  // --------------------------------------------------------------------------
  /**
   * Update proxyProvider networkId from RPC
   */
  async updateNetworkId() {
    const { networkId } = await this.getStatus();
    this.networkId = networkId;
    this.wallet.setNetworkId(this.networkId);
  }

  /**
   * Get node client version
   * @return {Promise<string>}
   */
  async getClientVersion() {
    return this.mazze.clientVersion();
  }

  /**
   * Get supply info
   *
   * @param {string|number} [epochNumber='latest_state'] - See [format.epochNumber](utils.md#util/format.js/format/(static)epochNumber)
   * @return {Promise<import('./rpc/types/formatter').SupplyInfo>} Return supply info
   * - totalIssued `BigInt`: Total issued balance in `Mazzy`
   *
   * @example
   * > await proxyProvider.getSupplyInfo()
   {
     totalCirculating: 28953062500000000000000n,
     totalIssued: 5033319899279074765657343554n,

   }
   */
  async getSupplyInfo(epochNumber) {
    return this.mazze.getSupplyInfo(epochNumber);
  }

  /**
   * Get status
   * @return {Promise<import('./rpc/types/formatter').ChainStatus>} Status information object
   * - chainId `number`: Chain id
   * - epochNumber `number`: Epoch number
   * - blockNumber `number`: Block number
   * - pendingTxNumber `number`: Pending transaction number
   * - bestHash `string`: The block hash of best pivot block
   *
   * @example
   * > await proxyProvider.getStatus()
   {
      chainId: 9999,
      networkId: 1990,
      epochNumber: 1117476,
      blockNumber: 2230973,
      pendingTxNumber: 4531,
      bestHash: '0x8d581f13fa0548f2751450a7dabd871777875c9ccdf0d8bd629e07a7a5a7917a'
   }
   */
  async getStatus() {
    return this.mazze.getStatus();
  }

  /**
   * Returns the current price per gas in Mazzy.
   *
   * @return {Promise<BigInt>} Gas price in mazzy.
   *
   * @example
   * > await proxyProvider.getGasPrice();
   1n
   */
  async getGasPrice() {
    return this.mazze.gasPrice();
  }

  /**
   * Returns the interest rate of given parameter.
   *
   * @param {string|number} [epochNumber='latest_state'] - See [format.epochNumber](utils.md#util/format.js/format/(static)epochNumber)
   * @return {Promise<BigInt>} The interest rate of given parameter.
   *
   * @example
   * > await proxyProvider.getInterestRate();
   2522880000000n
   */
  async getInterestRate(epochNumber) {
    return this.mazze.getInterestRate(epochNumber);
  }

  /**
   * Returns the accumulate interest rate of given parameter.
   *
   * @param {string|number} [epochNumber='latest_state'] - See [format.epochNumber](utils.md#util/format.js/format/(static)epochNumber)
   * @return {Promise<BigInt>} The accumulate interest rate of given parameter.
   *
   * @example
   * > await proxyProvider.getAccumulateInterestRate()
   76357297457647044505744908994993n
   */
  async getAccumulateInterestRate(epochNumber) {
    return this.mazze.getAccumulateInterestRate(epochNumber);
  }

  // ------------------------------- address ----------------------------------
  /**
   * Return account related states of the given account
   *
   * @param {string} address - address to get account.
   * @param {string|number} [epochNumber='latest_state'] - See [format.epochNumber](utils.md#util/format.js/format/(static)epochNumber)
   * @return {Promise<import('./rpc/types/Account').Account>} Return the states of the given account:
   * - balance `BigInt`: the balance of the account.
   * - nonce `BigInt`: the nonce of the account's next transaction.
   * - codeHash `string`: the code hash of the account.
   * - collateralForStorage `BigInt`: the collateral storage of the account.
   * - accumulatedInterestReturn `BigInt`: accumulated unterest return of the account.
   * - admin `string`: admin of the account.
   *
   * @example
   > await proxyProvider.getAccount('mazzetest:aasb661u2r60uzn5h0c4h63hj76wtgf552r9ghu7a4');
   {
      accumulatedInterestReturn: 0n,
      balance: 824812401057514588670n,
      collateralForStorage: 174187500000000000000n,
      nonce: 1449n,
      admin: 'MAZZETEST:TYPE.NULL:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA6F0VRCSW',
      codeHash: '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470'
   }
   */
  async getAccount(address, epochNumber) {
    return this.mazze.getAccount(address, epochNumber);
  }

  /**
   * Returns the balance of the account of given address.
   *
   * @param {string} address - The address to get the balance of.
   * @param {string|number} [epochNumber='latest_state'] - See [format.epochNumber](utils.md#util/format.js/format/(static)epochNumber)
   * @return {Promise<BigInt>} The balance in Mazzy.
   *
   * @example
   * > await proxyProvider.getBalance("mazzetest:aasb661u2r60uzn5h0c4h63hj76wtgf552r9ghu7a4");
   824812401057514588670n
   */
  async getBalance(address, epochNumber) {
    return this.mazze.getBalance(address, epochNumber);
  }

  

  /**
   * Returns the next nonce should be used by given address.
   *
   * @param {string} address - The address to get the numbers of transactions from.
   * @param {string|number} [epochNumber] - See [format.epochNumber](utils.md#util/format.js/format/(static)epochNumber)
   * @return {Promise<BigInt>} The next nonce should be used by given address.
   *
   * @example
   * > await proxyProvider.getNextNonce("mazzetest:aasb661u2r60uzn5h0c4h63hj76wtgf552r9ghu7a4");
   1449n
   */
  async getNextNonce(address, epochNumber) {
    return this.mazze.getNextNonce(address, epochNumber);
  }

  /**
   * Returns the admin of given contract.
   *
   * @param {string} address - Address to contract.
   * @param {string|number} [epochNumber='latest_state'] - See [format.epochNumber](utils.md#util/format.js/format/(static)epochNumber)
   * @return {Promise<string>} Address to admin, or `null` if the contract does not exist.
   *
   * @example
   * > proxyProvider.getAdmin('mazzetest:achc8nxj7r451c223m18w2dwjnmhkd6rxa2gc31euw')
   "MAZZETEST:TYPE.USER:AASB661U2R60UZN5H0C4H63HJ76WTGF552R9GHU7A4"
   */
  async getAdmin(address, epochNumber) {
    return this.mazze.getAdmin(address, epochNumber);
  }

  /**
   * Returns vote list of the given account.
   *
   * @param {string} address - Address to contract.
   * @param {string|number} [epochNumber='latest_state'] - See [format.epochNumber](utils.md#util/format.js/format/(static)epochNumber)
   * @return {Promise<import('./rpc/types/formatter').Vote[]>} Vote list
   * - `array`:
   *   - amount `BigInt`: This is the number of tokens should be locked before
   *   - unlockBlockNumber `number`: This is the timestamp when the vote right will be invalid, measured in, the number of past blocks.
   */
  async getVoteList(address, epochNumber) {
    return this.mazze.getVoteList(address, epochNumber);
  }

  /**
   * Returns deposit list of the given account.
   * @param {string} address - Address to contract.
   * @param {string|number} [epochNumber='latest_state'] - See [format.epochNumber](utils.md#util/format.js/format/(static)epochNumber)
   * @return {Promise<import('./rpc/types/formatter').Deposit[]>} Deposit list
   * - `array`:
   *   - amount `BigInt`: the number of tokens deposited
   *   - accumulatedInterestRate: `BigInt`: the accumulated interest rate at the time of the deposit
   *   - depositTime `number`: the time of the deposit
   */
  async getDepositList(address, epochNumber) {
    return this.mazze.getDepositList(address, epochNumber);
  }

  // -------------------------------- epoch -----------------------------------
  /**
   * Returns the epoch number of given parameter.
   *
   * @param {string|number} [epochNumber='latest_state'] - See [format.epochNumber](utils.md#util/format.js/format/(static)epochNumber)
   * @return {Promise<number>} integer of the current epoch number of given parameter.
   *
   * @example
   * > await proxyProvider.getEpochNumber();
   443
   */
  async getEpochNumber(epochNumber) {
    return this.mazze.epochNumber(epochNumber);
  }

  /**
   * Returns information about a block by epoch number.
   *
   * @param {string|number} epochNumber - See [format.epochNumber](utils.md#util/format.js/format/(static)epochNumber)
   * @param {boolean} [detail=false] - If `true` it returns the full transaction objects, if `false` only the hashes of the transactions.
   * @return {Promise<import('./rpc/types/formatter').Block|null>} See `getBlockByHash`
   *
   * @example
   * > await proxyProvider.getBlockByEpochNumber('latest_mined', true);
   {...}
   */
  async getBlockByEpochNumber(epochNumber, detail = false) {
    return this.mazze.getBlockByEpochNumber(epochNumber, detail);
  }

  /**
   * Returns information about a block by block number.
   *
   * @param {string|number} blockNumber
   * @param {boolean} [detail=false] - If `true` it returns the full transaction objects, if `false` only the hashes of the transactions.
   * @return {Promise<import('./rpc/types/formatter').Block|null>} See `getBlockByHash`
   *
   * @example
   * > await proxyProvider.getBlockByBlockNumber('0x123', true);
   {...}
   */
  async getBlockByBlockNumber(blockNumber, detail = false) {
    return this.mazze.getBlockByBlockNumber(blockNumber, detail);
  }

  /**
   * Returns hashes of blocks located in some epoch.
   *
   * @param {string|number} epochNumber - See [format.epochNumber](utils.md#util/format.js/format/(static)epochNumber)
   * @return {Promise<string[]>} Array of block hashes, sorted by execution(topological) order.
   *
   * @example
   * > await proxyProvider.getBlocksByEpochNumber(0);
   ['0xe677ae5206a5d67d9efa183d867b4b986ed82a3e62174a1488cf8364d58534ec']
   */
  async getBlocksByEpochNumber(epochNumber) {
    return this.mazze.getBlocksByEpoch(epochNumber);
  }

  /**
   * Get epoch blocks reward info
   *
   * @param {string|number} epochNumber - See [format.epochNumber](utils.md#util/format.js/format/(static)epochNumber)
   * @return {Promise<import('./rpc/types/formatter').RewardInfo[]>} List of block reward info
   * - blockHash `string`: Hash of the block.
   * - author `string`: The address of the beneficiary to whom the mining rewards were given.
   * - baseReward `BigInt`: Block base reward in `Mazzy`
   * - totalReward `BigInt`: Block total reward in `Mazzy`
   * - txFee `BigInt`: Total gas fee of block transaction
   *
   * @example
   * > await proxyProvider.getBlockRewardInfo(6);
   [
   {
      baseReward: 6993700000000000000n,
      totalReward: 6993700031741486703n,
      txFee: 0n,
      author: 'MAZZETEST:TYPE.USER:AATXETSP0KDARPDB5STDYEX11DR3X6SB0J2XZETSG6',
      blockHash: '0x73cd891aea310e2c0b8644de91746c7353cebfffb780126bc06101b20689c893'
    },
   {
      baseReward: 6997200000000000000n,
      totalReward: 6997200031760371742n,
      txFee: 3000000n,
      author: 'MAZZETEST:TYPE.USER:AATXETSP0KDARPDB5STDYEX11DR3X6SB0J2XZETSG6',
      blockHash: '0xaf4136d04e9e2cc470703251ec46f5913ab7955d526feed43771705e89c77390'
    }
   ]
   */
  async getBlockRewardInfo(epochNumber) {
    return this.mazze.getBlockRewardInfo(epochNumber);
  }

  // -------------------------------- block -----------------------------------
  /**
   * Returns the hash of best block.
   *
   * @return {Promise<string>} hash of the best block.
   *
   * @example
   * > await proxyProvider.getBestBlockHash();
   "0xb8bb355bfeaf055a032d5b7df719917c090ee4fb6fee42383004dfe8911d7daf"
   */
  async getBestBlockHash() {
    return this.mazze.getBestBlockHash();
  }

  /**
   * Returns information about a block by hash.
   *
   * @param {string} blockHash - hash of a block.
   * @param {boolean} [detail=false] - If `true` it returns the full transaction objects, if `false` only the hashes of the transactions.
   * @return {Promise<import('./rpc/types/formatter').Block|null>} A block object, or null when no block was found:
   * - adaptive `boolean`: If `true` the weight of the block is adaptive under GHAST rule, if `false` otherwise.
   * - blame `number`: If 0, then no blocks are blamed on its parent path, If greater than 0, then the nearest blamed block on the parent path is blame steps away.
   * - deferredLogsBloomHash `string`: The bloom hash of deferred logs.
   * - deferredReceiptsRoot `string`: The hash of the receipts of the block after deferred execution.
   * - deferredStateRoot `string`: The root of the final state trie of the block after deferred execution.
   * - difficulty `string`: Integer string of the difficulty for this block.
   * - epochNumber `number|null`: The current block epoch number in the client's view. null when it's not in best block's past set and the epoch number is not determined.
   * - gasLimit `BigInt`: The maximum gas allowed in this block.
   * - hash `string|null`: Hash of the block. `null` when its pending block.
   * - height `number`: The block heights. `null` when its pending block.
   * - miner `string`: The address of the beneficiary to whom the mining rewards were given.
   * - nonce `string`: Hash of the generated proof-of-work. `null` when its pending block.
   * - parentHash `string`: Hash of the parent block.
   * - powQuality `string`:Hash of the generated proof-of-work. `null` when its pending block.
   * - refereeHashes `string[]`: Array of referee hashes.
   * - size `number`: Integer the size of this block in bytes.
   * - timestamp `number`: The unix timestamp for when the block was collated.
   * - transactions `string[]|object[]`: Array of transaction objects, or 32 Bytes transaction hashes depending on the last given parameter.
   * - transactionsRoot `string`: The hash of the transactions of the block.
   *
   * @example
   * > await proxyProvider.getBlockByHash('0xaf4136d04e9e2cc470703251ec46f5913ab7955d526feed43771705e89c77390');
   {
      epochNumber: 6,
      blame: 0,
      height: 6,
      size: 352,
      timestamp: 1603901780,
      gasLimit: 30000000n,
      gasUsed: 61118n,
      difficulty: 20000000000n,
      transactions: [
        '0xaad69c8c814aec3e418b68f60917c607920a531e7082dd2c642323b43ecadb94',
        '0xbf7110474779ba2404433ef39a24cb5b277186ef1e6cb199b0b60907b029a1ce'
      ],
      adaptive: false,
      deferredLogsBloomHash: '0xd397b3b043d87fcd6fad1291ff0bfd16401c274896d8c63a923727f077b8e0b5',
      deferredReceiptsRoot: '0x09f8709ea9f344a810811a373b30861568f5686e649d6177fd92ea2db7477508',
      deferredStateRoot: '0x50c0fcbc5bafa7d1dba7b19c87629830106a6be8d0adf505cdc656bb43535d69',
      hash: '0xaf4136d04e9e2cc470703251ec46f5913ab7955d526feed43771705e89c77390',
      miner: 'MAZZETEST:TYPE.USER:AATXETSP0KDARPDB5STDYEX11DR3X6SB0J2XZETSG6',
      nonce: '0x17d86f2f6',
      parentHash: '0xc8a412b4b77b48d61f694975f032d109f26bb0f9fc02e4b221d67a382fab386b',
      powQuality: '0x5a0f86a6f4',
      refereeHashes: [
        '0x73cd891aea310e2c0b8644de91746c7353cebfffb780126bc06101b20689c893'
      ],
      transactionsRoot: '0xd2f08676484ba2a3738194f44542eb29fb290b8ed74bf007f132fe51d89b2e7c'
    }
   */
  async getBlockByHash(blockHash, detail = false) {
    return this.mazze.getBlockByHash(blockHash, detail);
  }

  /**
   * Get block by `blockHash` if pivot block of `epochNumber` is `pivotBlockHash`.
   *
   * @param {string} blockHash - Block hash which epochNumber expect to be `epochNumber`.
   * @param {string} pivotBlockHash - Block hash which expect to be the pivot block of `epochNumber`.
   * @param {number} epochNumber - Epoch number
   * @return {Promise<import('./rpc/types/formatter').Block|null>} See `getBlockByHash`
   */
  async getBlockByHashWithPivotAssumption(blockHash, pivotBlockHash, epochNumber) {
    return this.mazze.getBlockByHashWithPivotAssumption(blockHash, pivotBlockHash, epochNumber);
  }

  /**
   * Get the risk of the block could be reverted.
   * All block in one same epoch returned same risk number
   *
   * @param {string} blockHash - Hash of a block
   * @return {Promise<number|null>} Number >0 and <1
   *
   * @example
   * > await proxyProvider.getConfirmationRiskByHash('0xaf4136d04e9e2cc470703251ec46f5913ab7955d526feed43771705e89c77390')
   1e-8
   */
  async getConfirmationRiskByHash(blockHash) {
    return this.mazze.getConfirmationRiskByHash(blockHash);
  }

  // ----------------------------- transaction --------------------------------
  /**
   * Returns the information about a transaction requested by transaction hash.
   *
   * @param {string} transactionHash - hash of a transaction
   * @return {Promise<import('./rpc/types/formatter').Transaction|null>} transaction object, or `null` when no transaction was found:
   * - blockHash `string`: hash of the block where this transaction was in and got executed. `null` when its pending.
   * - contractCreated `string|null`: address of created contract. `null` when it's not a contract creating transaction
   * - data `string`: the data send along with the transaction.
   * - epochHeight `number`: epoch height
   * - from `string`: address of the sender.
   * - gas `BigInt`: gas provided by the sender.
   * - gasPrice `number`: gas price provided by the sender in Mazzy.
   * - hash `string`: hash of the transaction.
   * - nonce `BigInt`: the number of transactions made by the sender prior to this one.
   * - r `string`: ECDSA signature r
   * - s `string`: ECDSA signature s
   * - status `number`: 0 for success, 1 for error occured, `null` when the transaction is skipped or not packed.
   * - storageLimit `BigInt`: storage limit in bytes
   * - chainId `number`: chain id
   * - to `string`: address of the receiver. null when its a contract creation transaction.
   * - transactionIndex `number`: integer of the transactions's index position in the block. `null` when its pending.
   * - v `string`: ECDSA recovery id
   * - value `BigInt`: value transferred in Mazzy.
   *
   * @example
   * > await proxyProvider.getTransactionByHash('0xbf7110474779ba2404433ef39a24cb5b277186ef1e6cb199b0b60907b029a1ce');
   {
      nonce: 0n,
      gasPrice: 10n,
      gas: 200000n,
      value: 0n,
      storageLimit: 1024n,
      epochHeight: 0,
      chainId: 9999,
      v: 1,
      status: 0,
      transactionIndex: 1,
      blockHash: '0xaf4136d04e9e2cc470703251ec46f5913ab7955d526feed43771705e89c77390',
      contractCreated: null,
      data: '0xfebe49090000000000000000000000000000000000000000000000000000000000000000000000000000000000000000162788589c8e386863f217faef78840919fb2854',
      from: 'MAZZETEST:TYPE.USER:AATXETSP0KDARPDB5STDYEX11DR3X6SB0J2XZETSG6',
      hash: '0xbf7110474779ba2404433ef39a24cb5b277186ef1e6cb199b0b60907b029a1ce',
      r: '0x495da01ae9f445847022a8bc7df0198577ba75f88b26699f61afb435bb9c50bc',
      s: '0x2291051b1c53db1d6bfe2fb29be1bf512d063e726dc6b98aaf0f2259b7456be0',
      to: 'MAZZETEST:TYPE.USER:AATXETSP0KDARPDB5STDYEX11DR3X6SB0J2XZETSG6'
    }
   */
  async getTransactionByHash(transactionHash) {
    return this.mazze.getTransactionByHash(transactionHash);
  }

  /**
   * Returns the information about a transaction receipt requested by transaction hash.
   *
   * @param {string} transactionHash - Hash of a transaction
   * @return {Promise<import('./rpc/types/formatter').TransactionReceipt|null>} A transaction receipt object, or null when no transaction was found or the transaction was not executed yet:
   * - transactionHash `string`: Hash of the given transaction.
   * - index `number`: Transaction index within the block.
   * - blockHash `string`: Hash of the block where this transaction was in and got executed.
   * - epochNumber `number`: Epoch number of the block where this transaction was in and got executed.
   * - from `string`: Address of the sender.
   * - to `string`: Address of the receiver. `null` when its a contract creation transaction.
   * - gasUsed `number`: Gas used the transaction.
   * - contractCreated `string|null`: Address of created contract. `null` when it's not a contract creating transaction.
   * - stateRoot `string`: Hash of the state root.
   * - outcomeStatus `number`:  the outcome status code, 0 was successful, 1 for an error occurred in the execution.
   * - logsBloom `string`: Bloom filter for light clients to quickly retrieve related logs.
   * - logs `object[]`: Array of log objects, which this transaction generated.
   * - gasCoveredBySponsor `boolean`: `true` if this transaction's gas fee was covered by the sponsor.
   * - storageCoveredBySponsor `boolean`: `true` if this transaction's storage collateral was covered by the sponsor.
   * - storageCollateralized `BigInt`: the amount of storage collateral this transaction required.
   * - storageReleased `array`: array of storage change objects, each specifying an address and the corresponding amount of storage collateral released
   *   - address `string`: address released
   *   - collaterals `BigInt`: corresponding amount of storage collateral released
   *
   * @example
   * > await proxyProvider.getTransactionReceipt('0xbf7110474779ba2404433ef39a24cb5b277186ef1e6cb199b0b60907b029a1ce');
   {
      index: 1,
      epochNumber: 6,
      outcomeStatus: 0,
      gasUsed: 30559n,
      gasFee: 1500000n,
      blockHash: '0xaf4136d04e9e2cc470703251ec46f5913ab7955d526feed43771705e89c77390',
      contractCreated: null,
      from: 'MAZZETEST:TYPE.USER:AAJJ1C2XGRKDY8RPG2828UPAN4A5BBSZNYB28K0PHS',
      logs: [],
      logsBloom: '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
      stateRoot: '0xd6a7c2c14cb0d1233010acca98e114db5a10e0b94803d23b01a6777b7fd3b2fd',
      to: 'MAZZETEST:TYPE.CONTRACT:ACB59FK6VRYH8DJ5VYVEHJ9APZHPD72RDP2FVP77R9',
      transactionHash: '0xbf7110474779ba2404433ef39a24cb5b277186ef1e6cb199b0b60907b029a1ce',
      txExecErrorMsg: null,
      gasCoveredBySponsor: false,
      storageCoveredBySponsor: false,
      storageCollateralized: 0n,
      storageReleased: [
        address: '0x0000000000000000000000000000000000000001',
        collaterals: 640n,
      ],
    }
   */
  async getTransactionReceipt(transactionHash) {
    return this.mazze.getTransactionReceipt(transactionHash);
  }

  /**
   * Creates new message call transaction or a contract creation for signed transactions.
   *
   * @param {string|Buffer} hex - The signed transaction data.
   * @return {Promise<import('./subscribe/PendingTransaction').PendingTransaction>} The transaction hash, or the zero hash if the transaction is not yet available.
   *
   * @example
   * > await proxyProvider.sendRawTransaction('0xf85f800382520894bbd9e9b...');
   "0xbe007c3eca92d01f3917f33ae983f40681182cf618defe75f490a65aac016914"
   */
  async sendRawTransaction(hex) {
    return this.request({
      method: 'mazze_sendRawTransaction',
      params: [format.hex(hex)],
    });
  }

  /**
  * @typedef { import('../Transaction').TransactionMeta } TransactionMeta
  */

  /**
   * Sign and send transaction
   * if `from` field in `proxyProvider.wallet`, sign by local account and send raw transaction,
   * else call `mazze_sendTransaction` and sign by remote wallet
   *
   * @param {TransactionMeta} options - See [Transaction](Transaction.md#Transaction.js/Transaction/**constructor**)
   * @param {string} [password] - Password for remote node.
   * @return {Promise<import('./subscribe/PendingTransaction').PendingTransaction>} The PendingTransaction object.
   *
   * @example
   * > txHash = await proxyProvider.sendTransaction({from:account, to:address, value:0}); // send and get transaction hash
   "0xb2ba6cca35f0af99a9601d09ee19c1949d8130312550e3f5413c520c6d828f88"

   * @example
   * > packedTx = await proxyProvider.sendTransaction({from:account, to:address, value:0}).get(); // await till transaction packed
   {
    "nonce": 8n,
    "value": 0n,
    "gasPrice": 1000000000n,
    "gas": 21000n,
    "v": 0,
    "transactionIndex": null,
    "status": null,
    "storageLimit": 0n,
    "chainId": 1,
    "epochHeight": 791394,
    "blockHash": null,
    "contractCreated": null,
    "data": "0x",
    "from": "MAZZETEST:TYPE.USER:AAR7X4R8MKRNW39GGS8RZ40J1ZNWH5MRRPUFPR2U76",
    "hash": "0xb2ba6cca35f0af99a9601d09ee19c1949d8130312550e3f5413c520c6d828f88",
    "r": "0x245a1a86ae405eb72c1eaf98f5e22baa326fcf8262abad2c4a3e5bdcf2e912b5",
    "s": "0x4df8058887a4dd8aaf60208accb3e57292a50ff06a117df6e54f7f56176248c0",
    "to": "MAZZETEST:TYPE.USER:AAR7X4R8MKRNW39GGS8RZ40J1ZNWH5MRRPUFPR2U76"
   }

   * @example
   * > minedTx = await proxyProvider.sendTransaction({from:account, to:address, value:0}).mined(); // await till transaction mined
   {
    "nonce": 8n,
    "value": 0n,
    "gasPrice": 1000000000n,
    "gas": 21000n,
    "v": 0,
    "transactionIndex": 0,
    "status": 0,
    "storageLimit": 0n,
    "chainId": 1,
    "epochHeight": 791394,
    "blockHash": "0xdb2d2d438dcdee8d61c6f495bd363b1afb68cb0fdff16582c08450a9ca487852",
    "contractCreated": null,
    "data": "0x",
    "from": "MAZZETEST:TYPE.USER:AAR7X4R8MKRNW39GGS8RZ40J1ZNWH5MRRPUFPR2U76",
    "hash": "0xb2ba6cca35f0af99a9601d09ee19c1949d8130312550e3f5413c520c6d828f88",
    "r": "0x245a1a86ae405eb72c1eaf98f5e22baa326fcf8262abad2c4a3e5bdcf2e912b5",
    "s": "0x4df8058887a4dd8aaf60208accb3e57292a50ff06a117df6e54f7f56176248c0",
    "to": "MAZZETEST:TYPE.USER:AAR7X4R8MKRNW39GGS8RZ40J1ZNWH5MRRPUFPR2U76"
   }

   * @example
   * > executedReceipt = await proxyProvider.sendTransaction({from:account, to:address, value:0}).executed(); // await till transaction executed
   {
    "index": 0,
    "epochNumber": 791402,
    "outcomeStatus": 0,
    "gasUsed": 21000n,
    "gasFee": 21000000000000n,
    "blockHash": "0xdb2d2d438dcdee8d61c6f495bd363b1afb68cb0fdff16582c08450a9ca487852",
    "contractCreated": null,
    "from": "MAZZETEST:TYPE.USER:AAR7X4R8MKRNW39GGS8RZ40J1ZNWH5MRRPUFPR2U76",
    "logs": [],
    "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "stateRoot": "0x510d680cdbf60d34bcd987b3bf9925449c0839a7381dc8fd8222d2c7ee96122d",
    "to": "MAZZETEST:TYPE.USER:AAR7X4R8MKRNW39GGS8RZ40J1ZNWH5MRRPUFPR2U76",
    "transactionHash": "0xb2ba6cca35f0af99a9601d09ee19c1949d8130312550e3f5413c520c6d828f88"
   }

   * @example
   * > confirmedReceipt = await proxyProvider.sendTransaction({from:account, to:address, value:0}).confirmed(); // await till risk coefficient < threshold (default 1e-8)
   {
    "index": 0,
    "epochNumber": 791402,
    "outcomeStatus": 0,
    "gasUsed": 21000n,
    "gasFee": 21000000000000n,
    "blockHash": "0xdb2d2d438dcdee8d61c6f495bd363b1afb68cb0fdff16582c08450a9ca487852",
    "contractCreated": null,
    "from": "MAZZETEST:TYPE.USER:AAR7X4R8MKRNW39GGS8RZ40J1ZNWH5MRRPUFPR2U76",
    "logs": [],
    "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "stateRoot": "0x510d680cdbf60d34bcd987b3bf9925449c0839a7381dc8fd8222d2c7ee96122d",
    "to": "MAZZETEST:TYPE.USER:AAR7X4R8MKRNW39GGS8RZ40J1ZNWH5MRRPUFPR2U76",
    "transactionHash": "0xb2ba6cca35f0af99a9601d09ee19c1949d8130312550e3f5413c520c6d828f88"
   }
   */
  async sendTransaction(options, password) {
    if (this.wallet.has(`${options.from}`)) {
      const rawTx = await this.mazze.populateAndSignTransaction(options);
      return this.sendRawTransaction(rawTx);
    }

    const params = [this._formatCallTx(options)];
    if (password) params.push(password);
    return this.request({
      method: 'mazze_sendTransaction',
      params,
    });
  }

  // ------------------------------ contract ----------------------------------
  /**
   * Returns the code of given contract.
   *
   * @param {string} address - Address to contract.
   * @param {string|number} [epochNumber='latest_state'] - See [format.epochNumber](utils.md#util/format.js/format/(static)epochNumber)
   * @return {Promise<string>} Byte code of contract, or 0x if the contract does not exist.
   *
   * @example
   * > await proxyProvider.getCode('mazzetest:acb2nsctbanb9ezbw0mx1gapve60thyurjmxkage0f');
   "0x6080604052348015600f57600080fd5b506004361060325760003560e01c806306661abd1460375780638..."
   */
  async getCode(address, epochNumber) {
    return this.mazze.getCode(address, epochNumber);
  }

  /**
   * Returns storage entries from a given contract.
   *
   * @param {string} address - Address to contract.
   * @param {string} position - The given position.
   * @param {string|number} [epochNumber='latest_state'] - See [format.epochNumber](utils.md#util/format.js/format/(static)epochNumber)
   * @return {Promise<string|null>} Storage entry of given query, or null if the it does not exist.
   *
   * @example
   * > await proxyProvider.getStorageAt('mazzetest:acdgzwyh9634bnuf4jne0tp3xmae80bwej1w4hr66c', '0x6661e9d6d8b923d5bbaab1b96e1dd51ff6ea2a93520fdc9eb75d059238b8c5e9')
   "0x000000000000000000000000000000000000000000000000000000000000162e"
   */
  async getStorageAt(address, position, epochNumber) {
    return this.mazze.getStorageAt(address, position, epochNumber);
  }

  /**
   * Returns the storage root of a given contract.
   *
   * @param {string} address - Address to contract.
   * @param {string|number} [epochNumber='latest_state'] - See [format.epochNumber](utils.md#util/format.js/format/(static)epochNumber)
   * @return {Promise<object>} A storage root object, or `null` if the contract does not exist
   * - delta `string`: storage root in the delta trie.
   * - intermediate `string`: storage root in the intermediate trie.
   * - snapshot `string`: storage root in the snapshot.
   *
   * @example
   * > await proxyProvider.getStorageRoot('mazzetest:acdgzwyh9634bnuf4jne0tp3xmae80bwej1w4hr66c')
   {
      "delta": "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
      "intermediate": "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
      "snapshot": "0x7bb7d43152e56f529fbef709aab7371b0672f2332ae0fb4786da350f664df5b4"
   }
   */
  async getStorageRoot(address, epochNumber) {
    return this.mazze.getStorageRoot(address, epochNumber);
  }

  /**
   * Returns the sponsor info of given contract.
   *
   * @param {string} address - Address to contract.
   * @param {string|number} [epochNumber='latest_state'] - See [format.epochNumber](utils.md#util/format.js/format/(static)epochNumber)
   * @return {Promise<import('./rpc/types/formatter').SponsorInfo>} A sponsor info object, if the contract doesn't have a sponsor, then the all fields in returned object will be 0:
   * - sponsorBalanceForCollateral `BigInt`: the sponsored balance for storage.
   * - sponsorBalanceForGas `BigInt`: the sponsored balance for gas.
   * - sponsorGasBound `BigInt`: the max gas could be sponsored for one transaction.
   * - sponsorForCollateral `string`: the address of the storage sponsor.
   * - sponsorForGas `string`: the address of the gas sponsor.
   *
   * @example
   * > await proxyProvider.getSponsorInfo('mazzetest:achc8nxj7r451c223m18w2dwjnmhkd6rxa2gc31euw')
   {
      sponsorBalanceForCollateral: 410625000000000000000n,
      sponsorBalanceForGas: 9999999993626232440n,
      sponsorGasBound: 10000000000n,
      sponsorForCollateral: 'MAZZETEST:TYPE.CONTRACT:ACGZZ08M8Z2YWKEDA0JZU52FGAZ9U95Y1YV785YANX',
      sponsorForGas: 'MAZZETEST:TYPE.CONTRACT:ACGZZ08M8Z2YWKEDA0JZU52FGAZ9U95Y1YV785YANX'
   }
   */
  async getSponsorInfo(address, epochNumber) {
    return this.mazze.getSponsorInfo(address, epochNumber);
  }

  /**
   * Return pending info of an account
   *
   * @param {string} address - Address to account
   * @returns {Promise<import('./rpc/types/formatter').AccountPendingInfo>} An account pending info object.
   * - localNonce `BigInt`: then next nonce can use in the transaction pool
   * - nextPendingTx `string`: the hash of next pending transaction
   * - pendingCount `BigInt`: the count of pending transactions
   * - pendingNonce `BigInt`: the nonce of pending transaction
   *
   */
  async getAccountPendingInfo(address) {
    return this.mazze.getAccountPendingInfo(address);
  }

  /**
   * Return pending transactions of one account
   *
   * @param {string} address - base32 address
   * @returns {Promise<import('./rpc/types/formatter').AccountPendingTransactions>} An account's pending transactions and info.
   * - pendingTransactions `Array`: pending transactions
   * - firstTxStatus `Object`: the status of first pending tx
   * - pendingCount `BigInt`: the count of pending transactions
   */
  async getAccountPendingTransactions(address, startNonce, limit) {
    return this.mazze.getAccountPendingTransactions(address, startNonce, limit);
  }

  /**
   * Returns the size of the collateral storage of given address, in Byte.
   *
   * @param {string} address - Address to check for collateral storage.
   * @param [epochNumber='latest_state'] - See [format.epochNumber](utils.md#util/format.js/format/(static)epochNumber)
   * @return {Promise<BigInt>} - The collateral storage in Byte.
   *
   * @example
   * > await proxyProvider.getCollateralForStorage('mazzetest:achc8nxj7r451c223m18w2dwjnmhkd6rxa2gc31euw')
   89375000000000000000n
   */
  async getCollateralForStorage(address, epochNumber) {
    return this.mazze.getCollateralForStorage(address, epochNumber);
  }

  /**
   * Virtually call a contract, return the output data.
   *
   * @param {TransactionMeta} options - See [Transaction](Transaction.md#Transaction.js/Transaction/**constructor**)
   * @param {string|number} [epochNumber='latest_state'] - See [format.epochNumber](utils.md#util/format.js/format/(static)epochNumber)
   * @return {Promise<string>} The output data.
   */
  async call(options, epochNumber) {
    try {
      return await this.request({
        method: 'mazze_call',
        params: [
          this._formatCallTx(options),
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
   * @param {TransactionMeta} options - See [Transaction](Transaction.md#Transaction.js/Transaction/**constructor**)
   * @param {string|number} [epochNumber='latest_state'] - See [format.epochNumber](utils.md#util/format.js/format/(static)epochNumber)
   * @return {Promise<import('./rpc/types/formatter').EstimateResult>} A estimate result object:
   * - `BigInt` gasUsed: The gas used.
   * - `BigInt` gasLimit: The gas limit.
   * - `BigInt` storageCollateralized: The storage collateralized in Byte.
   */
  async estimateGasAndCollateral(options, epochNumber) {
    try {
      const result = await this.request({
        method: 'mazze_estimateGasAndCollateral',
        params: [
          this._formatCallTx(options),
          format.epochNumber.$or(undefined)(epochNumber),
        ],
      });
      return mazzeFormat.estimate(result);
    } catch (e) {
      throw Contract.decodeError(e);
    }
  }

  /**
   * Estimate a transaction's gas and storageCollateralize, check whether user's balance is enough for fee and value
   * @param {TransactionMeta} options - See [estimateGasAndCollateral](#ProxyProvider.js/ProxyProvider/estimateGasAndCollateral)
   * @param {string|number} [epochNumber='latest_state'] - See [estimateGasAndCollateral](#ProxyProvider.js/ProxyProvider/estimateGasAndCollateral)
   * @return {Promise<object>} A estimate result with advance info object:
   * - `BigInt` gasUsed: The gas used.
   * - `BigInt` gasLimit: The gas limit.
   * - `BigInt` storageCollateralized: The storage collateralized in Byte.
   * - `BigInt` balance: The balance of the options.from.
   * - `Boolean` isBalanceEnough: indicate balance is enough for gas and storage fee
   * - `Boolean` isBalanceEnoughForValueAndFee: indicate balance is enough for gas and storage fee plus value
   * - `Boolean` willPayCollateral: false if the transaction is eligible for storage collateral sponsorship, true otherwise
   * - `Boolean` willPayTxFee: false if the transaction is eligible for gas sponsorship, true otherwise
   */
  async estimateGasAndCollateralAdvance(options, epochNumber) {
    return this.mazze.estimateGasAndCollateralAdvance(options, epochNumber);
  }

  /**
   * Check whether transaction sender's balance is enough for gas and storage fee
   * @param {string} from - sender address
   * @param {string} to - target address
   * @param {string|number} gas - gas limit (in mazzy)
   * @param {string|number} gasPrice - gas price (in mazzy)
   * @param {string|number} storageLimit - storage limit (in byte)
   * @param {string|number} [epochNumber] - optional epoch number
   * @return {Promise<object>} A check result object:
   * - `Boolean` isBalanceEnough: indicate balance is enough for gas and storage fee
   * - `Boolean` willPayCollateral: false if the transaction is eligible for storage collateral sponsorship, true otherwise
   * - `Boolean` willPayTxFee: false if the transaction is eligible for gas sponsorship, true otherwise
   */
  async checkBalanceAgainstTransaction(from, to, gas, gasPrice, storageLimit, epochNumber) {
    return this.mazze.checkBalanceAgainstTransaction(from, to, gas, gasPrice, storageLimit, epochNumber);
  }

  /**
   * Returns logs matching the filter provided.
   *
   * @param {import('./rpc/types/formatter').LogFilter} [options]
   * @return {Promise<import('./rpc/types/formatter').Log[]>} Array of log, that the logs matching the filter provided:
   * - address `string`: Address this event originated from.
   * - topics `string[]`: Array of topics.
   * - data `string`: The data containing non-indexed log parameter.
   * - blockHash `string`: Hash of the block where the log in.
   * - epochNumber `number`: Epoch number of the block where the log in.
   * - transactionHash `string`: Hash of the transaction where the log in.
   * - transactionIndex `string`: Transaction index in the block.
   * - logIndex `number`: Log index in block.
   * - transactionLogIndex `number`: Log index in transaction.
   *
   * @example
   * > await proxyProvider.getLogs({
      address: 'mazzetest:achc8nxj7r451c223m18w2dwjnmhkd6rxa2gc31euw',
      fromEpoch: 39802,
      toEpoch: 39802,
      limit: 1,
      topics: ['0x2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d'],
    });
   [
   {
      epochNumber: 39802,
      logIndex: 2,
      transactionIndex: 0,
      transactionLogIndex: 2,
      address: 'MAZZETEST:TYPE.CONTRACT:ACHC8NXJ7R451C223M18W2DWJNMHKD6RXA2GC31EUW',
      blockHash: '0xca00158a2a508170278d5bdc5ca258b6698306dd8c30fdba32266222c79e57e6',
      data: '0x',
      topics: [
        '0x2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d',
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        '0x0000000000000000000000001c1e72f0c37968557b3d85a3f32747792798bbde',
        '0x0000000000000000000000001c1e72f0c37968557b3d85a3f32747792798bbde'
      ],
      transactionHash: '0xeb75f47002720311f1709e36d7f7e9a91ee4aaa469a1de892839cb1ef66a9939'
    }
   ]
   */
  async getLogs(options) {
    if (options.blockHashes !== undefined && (options.fromEpoch !== undefined || options.toEpoch !== undefined)) {
      throw new Error('OverrideError, do not use `blockHashes` with `fromEpoch` or `toEpoch`, cause only `blockHashes` will take effect');
    }

    const result = await this.request({ method: 'mazze_getLogs', params: [this._formatGetLogs(options)] });

    return mazzeFormat.logs(result);
  }

  /**
   * Return block's execution trace.
   *
   * > Note: need RPC server open trace_block method
   *
   * @param {string} blockHash - block hash
   * @return {Promise<object[]>} Array of transaction traces.
   *
   * @example
   * > await proxyProvider.traceBlock('0xaf0e1d773dee28c95bcfa5480ed663fcc695b32c8c1dd81f57ff61ff09f55f88')
   {
        "transactionTraces": [
            {
                "traces": [
                    {
                        "action": {
                            "callType": "call",
                            "from": "MAZZETEST:TYPE.USER:AAP6SU0S2UZ36X19HSCP55SR6N42YR1YK6HX8D8SD1",
                            "gas": "311592",
                            "input": "0x",
                            "to": "MAZZETEST:TYPE.CONTRACT:ACCKUCYY5FHZKNBXMEEXWTAJ3BXMEG25B2NUF6KM25",
                            "value": "0"
                        },
                        "type": "call"
                    }
                ]
            },
            {
                "traces": [
                    {
                        "action": {
                            "from": "MAZZETEST:TYPE.USER:AAR75DU3V36MG4U2DHAG44B40H6K4M2ARY46G0ECMB",
                            "gas": "83962",
                            "init": "0x",
                            "value": "0"
                        },
                        "type": "create"
                    }
                ]
            }
        ]
    }
   *
   */
  async traceBlock(blockHash) {
    return this.trace.block(format.blockHash(blockHash));
  }

  /**
   * Return transaction's trace
   * @param {string} txHash - transaction hash
   * @returns {Promise<import('./rpc/trace').Trace[]>} Array of traces.
   *
   * @example
   * > await proxyProvider.traceTransaction('0xaf0e1d773dee28c95bcfa5480ed663fcc695b32c8c1dd81f57ff61ff09f55f88')
   */
  async traceTransaction(txHash) {
    return this.trace.transaction(format.transactionHash(txHash));
  }

  /**
   * Return traces that satisfy an filter
   * @param {import('./rpc/trace').TraceFilter} filter - trace filters
   * @returns {Promise<import('./rpc/trace').Trace[]>} Array of traces.
   *
   * @example
   * > await proxyProvider.traceFilter({
      fromEpoch: 1,
      toEpoch: 100,
      count: 100,
      after: 100,
      blockHashes: ['0xaf0e1d773dee28c95bcfa5480ed663fcc695b32c8c1dd81f57ff61ff09f55f88'],
      actionTypes: ['call_result']
    })
   */
  async traceFilter(filter) {
    return this.trace.filter(format.traceFilter(filter));
  }

  /**
   * Return one epoch's all receipts
   * @param {number|string} epochNumber - epoch number
   * @returns {Promise<import('./rpc/types/formatter').TransactionReceipt[][]>} Array of array receipts.
   *
   * @example
   * > await proxyProvider.getEpochReceipts('0x6')
   */
  async getEpochReceipts(epochNumber) {
    return this.mazze.getEpochReceipts(epochNumber);
  }

  /**
   * Return one epoch's all receipts by pivot block hash
   * @param {string} pivotBlockHash - epoch pivot block hash
   * @returns {Promise<import('./rpc/types/formatter').TransactionReceipt[][]>} Array of array receipts.
   *
   * @example
   * > await proxyProvider.getEpochReceiptsByPivotBlockHash('0x12291776d632d966896b6c580f3201cd2e2a3fd672378fc7965aa7f7058282b2')
   */
  async getEpochReceiptsByPivotBlockHash(pivotBlockHash) {
    return this.mazze.getEpochReceiptsByPivotBlockHash(pivotBlockHash);
  }

 

  // ----------------------------- subscription -------------------------------
  /**
   * Subscribe event by name and got id, and provider will emit event by id
   *
   * > Note: suggest use `proxyProvider.subscribeXXX` to subscribe
   *
   * @param {string} name - Subscription name
   * @param {array} args - Subscription arguments
   * @return {Promise<string>} Id of subscription
   *
   * @example
   * > proxyProvider = new ProxyProvider({url:'ws://127.0.0.1:12535'})
   * > id = await proxyProvider.subscribe('epochs');
   "0x8fe7879a1681e9b9"
   * > proxyProvider.provider.on(id, data=>console.log(data));
   {
     epochHashesOrdered: [
       '0x0eff33578346b8e8347af3bae948eb7f4f5c27add9dbcfeb55eaf7cb3640088f',
       '0xb0cedac34a06ebcb42c3446a6bb2df1f0dcd9d83061f550460e387d19a4d8e91'
     ],
     epochNumber: '0x8cb32'
   }
   */
  async subscribe(name, ...args) {
    return this.request({ method: 'mazze_subscribe', params: [name, ...args] });
  }

  /**
   * The epochs topic streams consensus results: the total order of blocks, as expressed by a sequence of epochs.
   * The returned series of epoch numbers is monotonically increasing with an increment of one.
   * If you see the same epoch twice, this suggests a pivot chain reorg has happened (this might happen for recent epochs).
   * For each epoch, the last hash in epochHashesOrdered is the hash of the pivot block.
   *
   * @param {string} [sub_epoch] - Available values are latest_mined(default value) and latest_state
   *
   * @return {Promise<Subscription>} EventEmitter instance with the follow events:
   * - 'data':
   *   - epochNumber `number`: epoch number
   *   - epochHashesOrdered `array`: epoch block hash in order
   *     - `string`: block hash
   *
   * @example
   * > subscription = await proxyProvider.subscribeEpochs()
   * > subscription.on('data', data=>console.log(data))
   {
     epochNumber: 566031,
     epochHashesOrdered: [
       '0x2820dbb5c4126455ad37bc88c635ae1f35e0d4f85c74300c01828f57ea1e5969',
       '0xd66b801335ba01e2448df52e59da584b54fc7ee7c2f8160943c097e1ebd23038'
     ]
    }
   {
     epochNumber: 566032,
     epochHashesOrdered: [
       '0x899606b462f0141d672aaea8497c82aebbd7b16d266fad71e9d5093b5c6d392e',
       '0xf6093d19c4df3645cd972e9f791fe0db3a1ab70881023a8aee63f64e0c3ca152'
     ]
   }
   */
  async subscribeEpochs(sub_epoch = CONST.EPOCH_NUMBER.LATEST_MINED) {
    const id = await this.subscribe('epochs', sub_epoch);
    const subscription = new Subscription(id);

    this.provider.on(id, data => {
      subscription.emit('data', mazzeFormat.epoch(data));
    });

    return subscription;
  }

  /**
   * The newHeads topic streams all new block headers participating in the consensus.
   *
   * @return {Promise<Subscription>} EventEmitter instance with the follow events:
   * - 'data': see `getBlockByHash`
   *
   * @example
   * > subscription = await proxyProvider.subscribeNewHeads()
   * > subscription.on('data', data=>console.log(data))
   {
      difficulty: 368178587115n,
      epochNumber: null,
      gasLimit: 30000000n,
      height: 1118247,
      timestamp: 1605005752,
      adaptive: false,
      blame: 0,
      deferredLogsBloomHash: '0xd397b3b043d87fcd6fad1291ff0bfd16401c274896d8c63a923727f077b8e0b5',
      deferredReceiptsRoot: '0x7ae0d5716513206755b6f7c95272b79dbc225759b6e17727e19c2f15c3166bda',
      deferredStateRoot: '0x3cf5deba77c8aa9072f1e972d6a97db487a0ce88455f371eb8ac8fa77321cb9d',
      hash: '0x194675173abbc5aab50326136008774eea1a289e6722c973dfed12b703ee5f2a',
      miner: 'MAZZETEST:TYPE.USER:AAPKCJR28DG976FZR43C5HF1RWN5XV8T1U8V8JW8A4',
      nonce: '0x799d35f695950fd6',
      parentHash: '0x4af3cf8cb358e75acad282ffa4b578b6211ea9eeb7cf87c282f120d8a1c809df',
      powQuality: '0xe7ac17feab',
      refereeHashes: [],
      transactionsRoot: '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470'
    }
   */
  async subscribeNewHeads() {
    const id = await this.subscribe('newHeads');
    const subscription = new Subscription(id);

    this.provider.on(id, data => {
      subscription.emit('data', mazzeFormat.head(data));
    });

    return subscription;
  }

  /**
   * The logs topic streams all logs matching a certain filter, in order.
   * In case of a pivot chain reorg (which might affect recent logs), a special revert message is sent.
   * All logs received previously that belong to epochs larger than the one in this message should be considered invalid.
   *
   * @param {object} [options]
   * @param {string|string[]} [options.address] - Search contract addresses. If null, match all. If specified, log must be produced by one of these addresses.
   * @param {array} [options.topics] - Search topics. Logs can have 4 topics: the function signature and up to 3 indexed event arguments. The elements of topics match the corresponding log topics. Example: ["0xA", null, ["0xB", "0xC"], null] matches logs with "0xA" as the 1st topic AND ("0xB" OR "0xC") as the 3rd topic. If null, match all.
   * @return {Promise<Subscription>} EventEmitter instance with the follow events:
   * - 'data': see `getLogs`
   * - 'revert':
   *   - revertTo 'number': epoch number
   *
   * @example
   * > subscription = await proxyProvider.subscribeLogs()
   * > subscription.on('data', data=>console.log(data))
   {
     epochNumber: 568224,
     logIndex: 0,
     transactionIndex: 0,
     transactionLogIndex: 0,
     address: 'MAZZETEST:TYPE.CONTRACT:ACCS4PG151C99AZPE6RSK37R40YNEMYRSE9P475E82',
     blockHash: '0xc02689eea6a507250838463c13e6b633479e2757dfb7e9b2593d5c31b54adb63',
     data: '0x0000000000000000000000000000000000000000000000000000000000000001',
     topics: [
       '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
       '0x0000000000000000000000001bd9e9be525ab967e633bcdaeac8bd5723ed4d6b',
       '0x0000000000000000000000001bd9e9be525ab967e633bcdaeac8bd5723ed4d6b'
     ],
     transactionHash: '0x950ddec9ce3b42c4d8ca120722fa318ae64dc2e24553201f55f68c00bfd9cc4c'
   }
   * @example
   * > subscription.on('revert', data=>console.log(data))
   { revertTo: 568230 }
   { revertTo: 568231 }
   */
  async subscribeLogs({ address, topics } = {}) {
    const id = await this.subscribe('logs', this._formatGetLogs({ address, topics }));

    const subscription = new Subscription(id);
    this.provider.on(id, data => {
      if (data.revertTo) {
        subscription.emit('revert', mazzeFormat.revert(data));
      } else {
        subscription.emit('data', mazzeFormat.log(data));
      }
    });

    return subscription;
  }

  /**
   * Unsubscribe subscription.
   *
   * @param {string|Subscription} id - Subscription id
   * @return {Promise<boolean>} Is success
   *
   * @example
   * > id = await proxyProvider.subscribe('epochs');
   * > await proxyProvider.unsubscribe(id);
   true
   * > await proxyProvider.unsubscribe(id);
   false

   * @example
   * > subscription = await proxyProvider.subscribeLogs();
   * > await proxyProvider.unsubscribe(subscription);
   true
   */
  async unsubscribe(id) {
    return this.request({ method: 'mazze_unsubscribe', params: [`${id}`] });
  }
}

module.exports = ProxyProvider;
