const format = require('../../util/format');
const { validAddressPrefix } = require('../../util');
const parser = require('../../util/parser');

const mazzeFormat = new Proxy(() => undefined, {
  apply(target, thisArg, argArray) {
    return parser(...argArray);
  },
});

/**
 * @typedef {Object} LogFilter
 * @property {string|number} [fromEpoch] Search will be applied from this epoch number.
 * @property {string|number} [toEpoch] Search will be applied up until (and including) this epoch number.
 * @property {string[]} [blockHashes] Array of up to 128 block hashes that the search will be applied to. This will override from/to epoch fields if it's not null
 * @property {string[]|string} [address] Search contract addresses. If null, match all. If specified, log must be produced by one of these addresses.
 * @property {string[]} [topics] Search topics. Logs can have 4 topics: the function signature and up to 3 indexed event arguments. The elements of topics match the corresponding log topics. Example: ["0xA", null, ["0xB", "0xC"], null] matches logs with "0xA" as the 1st topic AND ("0xB" OR "0xC") as the 3rd topic. If null, match all.
 */
mazzeFormat.getLogs = format({
  fromEpoch: format.epochNumber,
  toEpoch: format.epochNumber,
  blockHashes: format([format.blockHash]).$or(null),
  address: format.address.$or([format.address]).$or(null),
  topics: format([format.hex64.$or([format.hex64]).$or(null)]),
}, {
  pick: true,
  name: 'format.getLogs',
});

// configure getLogs formatter with networkId and toHexAddress
mazzeFormat.getLogsAdvance = function (networkId, toHexAddress = false, useVerboseAddress = false) {
  const formatAddress = toHexAddress ? format.hexAddress : format.netAddress(networkId, useVerboseAddress);
  return format({
    fromEpoch: format.epochNumber,
    toEpoch: format.epochNumber,
    blockHashes: format([format.blockHash]).$or(null),
    address: format([formatAddress]).$or(formatAddress).$or(null),
    topics: format([format.hex64.$or([format.hex64]).$or(null)]),
  }, {
    pick: true,
    name: 'format.getLogsAdvance',
  });
};

mazzeFormat.AccessListEntry = format({
  address: format.address,
  storageKeys: [format.hex64],
});

mazzeFormat.transactionToAddress = format(format.hexAddress.$or(null).$default(null))
  .$after(format.hexBuffer)
  .$validate(hBuf => hBuf.length === 0 || validAddressPrefix(hBuf), 'transactionToAddress');

mazzeFormat.signTx = format({
  nonce: format.bigUInt.$after(format.hexBuffer),
  gasPrice: format.bigUInt.$after(format.hexBuffer),
  gas: format.bigUInt.$after(format.hexBuffer),
  to: mazzeFormat.transactionToAddress,
  value: format.bigUInt.$default(0).$after(format.hexBuffer),
  storageLimit: format.bigUInt.$after(format.hexBuffer),
  epochHeight: format.bigUInt.$after(format.hexBuffer),
  chainId: format.uInt.$default(0).$after(format.hexBuffer),
  data: format.hex.$default('0x').$after(format.hexBuffer),
  r: (format.bigUInt.$after(format.hexBuffer)).$or(undefined),
  s: (format.bigUInt.$after(format.hexBuffer)).$or(undefined),
  v: (format.uInt.$after(format.hexBuffer)).$or(undefined),
}, {
  strict: true,
  pick: true,
  name: 'format.signTx',
});

mazzeFormat.sign1559Tx = format({
  nonce: format.bigUInt.$after(format.hexBuffer),
  maxPriorityFeePerGas: format.bigUInt.$after(format.hexBuffer),
  maxFeePerGas: format.bigUInt.$after(format.hexBuffer),
  gas: format.bigUInt.$after(format.hexBuffer),
  to: mazzeFormat.transactionToAddress,
  value: format.bigUInt.$default(0).$after(format.hexBuffer),
  storageLimit: format.bigUInt.$after(format.hexBuffer),
  epochHeight: format.bigUInt.$after(format.hexBuffer),
  chainId: format.uInt.$default(0).$after(format.hexBuffer),
  data: format.hex.$default('0x').$after(format.hexBuffer),
  // accessList: format.any.$default([]),
  r: (format.bigUInt.$after(format.hexBuffer)).$or(undefined),
  s: (format.bigUInt.$after(format.hexBuffer)).$or(undefined),
  v: (format.uInt.$after(format.hexBuffer)).$or(undefined),
}, {
  strict: true,
  pick: true,
  name: 'format.sign1559Tx',
});

/**
 * @typedef {Object} CallRequest
 * @property {string} [from]
 * @property {string} [to]
 * @property {string} [data]
 * @property {number} [value]
 * @property {number} [gas]
 * @property {number} [gasPrice]
 * @property {number} [nonce]
 * @property {number} [storageLimit]
 * @property {number} [epochHeight]
 * @property {number} [chainId]
 */
mazzeFormat.callTx = format({
  type: format.bigUIntHex.$or(null),
  from: format.address,
  nonce: format.bigUIntHex,
  gasPrice: format.bigUIntHex.$or(null),
  maxPriorityFeePerGas: format.bigUIntHex.$or(null),
  maxFeePerGas: format.bigUIntHex.$or(null),
  gas: format.bigUIntHex,
  to: format.address.$or(null),
  value: format.bigUIntHex,
  storageLimit: format.bigUIntHex,
  epochHeight: format.bigUIntHex,
  chainId: format.bigUIntHex,
  data: format.hex,
  accessList: format([mazzeFormat.AccessListEntry]).$or(null),
}, {
  pick: true,
  name: 'format.callTx',
});

// configure callTx formatter with networkId and toHexAddress
mazzeFormat.callTxAdvance = function (networkId, toHexAddress = false, useVerboseAddress = false) {
  const fromatAddress = toHexAddress ? format.hexAddress : format.netAddress(networkId, useVerboseAddress);
  return format({
    type: format.bigUIntHex.$or(null),
    from: fromatAddress,
    nonce: format.bigUIntHex,
    gasPrice: format.bigUIntHex.$or(null),
    maxPriorityFeePerGas: format.bigUIntHex.$or(null),
    maxFeePerGas: format.bigUIntHex.$or(null),
    gas: format.bigUIntHex,
    to: fromatAddress.$or(null),
    value: format.bigUIntHex,
    storageLimit: format.bigUIntHex,
    epochHeight: format.bigUIntHex,
    chainId: format.bigUIntHex,
    data: format.hex,
    accessList: format([mazzeFormat.AccessListEntry.$or(null)]).$or(null),
  }, {
    pick: true,
    name: 'format.callTxAdvance',
  });
};

// ----------------------------- parse rpc returned ---------------------------
/**
 * @typedef {Object} ChainStatus
 * @property {string} bestHash
 * @property {number} networkId
 * @property {number} chainId
 * @property {number} epochNumber
 * @property {number} blockNumber
 * @property {number} pendingTxNumber
 * @property {number} latestCheckpoint
 * @property {number} latestConfirmed
 * @property {number} latestFinalized
 * @property {number} latestState
 * @property {number} ethereumSpaceChainId
 */
mazzeFormat.status = format({
  networkId: format.uInt,
  chainId: format.uInt,
  epochNumber: format.uInt,
  blockNumber: format.uInt,
  pendingTxNumber: format.uInt,
  latestCheckpoint: format.uInt.$or(null),
  latestConfirmed: format.uInt.$or(null),
  latestFinalized: format.uInt.$or(null),
  latestState: format.uInt.$or(null),
  ethereumSpaceChainId: format.uInt.$or(null),
}, {
  name: 'format.status',
});

/**
 * @typedef {Object} EstimateResult
 * @property {number} gasUsed
 * @property {number} gasLimit
 * @property {number} storageCollateralized
 */
mazzeFormat.estimate = format({
  gasUsed: format.bigUInt,
  gasLimit: format.bigUInt,
  storageCollateralized: format.bigUInt,
}, {
  name: 'format.estimate',
});

/**
 * @typedef {Object} Transaction - Transaction
 * @prop {number} type - the type of the transaction. 0 for legacy transaction, 1 for 2930 transaction, 2 for EIP-1559 transaction.
 * @prop {string} [blockHash=null] - hash of the block where this transaction was in and got executed. null when the transaction is pending.
 * @prop {number} chainId - the chain ID specified by the sender.
 * @prop {string} [contractCreated=null] - address of the contract created. null when it is not a contract deployment transaction.
 * @prop {string} data - the data sent along with the transaction.
 * @prop {number} epochHeight - the epoch proposed by the sender. Note that this is NOT the epoch of the block containing this transaction.
 * @prop {string} from - address of the sender.
 * @prop {number} gas - the gas limit specified by the sender.
 * @prop {number} gasPrice - the gas price specified by the sender.
 * @prop {number} maxPriorityFeePerGas - the maxPriorityFeePerGas specified by the sender.
 * @prop {number} maxFeePerGas - the maxFeePerGas specified by the sender.
 * @prop {string} hash - hash of the transaction.
 * @prop {number} nonce - the nonce specified by the sender.
 * @prop {string} [to=null] - address of the receiver. null when it is a contract creation transaction.
 * @prop {number} value - the value sent along with the transaction.
 * @prop {number} storageLimit - the storage limit specified by the sender.
 * @prop {string} r - ECDSA signature r
 * @prop {string} s - ECDSA signature s
 * @prop {number} v - ECDSA recovery v
 * @prop {number} yParity - The parity (0 for even, 1 for odd) of the y-value of a secp256k1 signature.
 * @prop {number} [transactionIndex=null] - the transaction's position in the block. null when the transaction is pending.
 * @prop {number} [status=null] - 0 for success, 1 if an error occurred, 2 for skiped, null when the transaction is skipped or not packed.
 * @prop {array} [accessList]
 */
mazzeFormat.transaction = format({
  type: format.uInt.$or(null),
  nonce: format.bigUInt,
  gasPrice: format.bigUInt.$or(null),
  maxPriorityFeePerGas: format.bigUInt.$or(null),
  maxFeePerGas: format.bigUInt.$or(null),
  gas: format.bigUInt,
  value: format.bigUInt,
  storageLimit: format.bigUInt,
  epochHeight: format.bigUInt,
  chainId: format.uInt,
  v: format.uInt,
  yParity: format.uInt.$or(null),
  status: format.uInt.$or(null),
  transactionIndex: format.uInt.$or(null),
  accessList: format([mazzeFormat.AccessListEntry]).$or(null),
}, {
  name: 'format.transaction',
});

/**
 * @typedef {Object} Block - Block
 * @prop {boolean} adaptive - true if the weight of the block is adaptive under the GHAST rule.
 * @prop {number} blame - if 0, then this block does not blame any blocks on its parent path. If it is n > 0, then this block blames its n predecessors on its parent path, e.g. when n = 1, then the block blames its parent but not its parent's parent.
 * @prop {number} baseFeePerGas - the base fee per gas for this block.
 * @prop {string} deferredLogsBloomHash - the hash of the logs bloom after deferred execution at the block's epoch (assuming it is the pivot block).
 * @prop {string} deferredReceiptsRoot - the Merkle root of the receipts after deferred execution at the block's epoch (assuming it is the pivot block).
 * @prop {string} deferredStateRoot - the hash of the state trie root triplet after deferred execution at the block's epoch (assuming it is the pivot block).
 * @prop {number} difficulty - the PoW difficulty of this block.
 * @prop {number} [epochNumber] - the number of the epoch containing this block in the node's view of the ledger. null when the epoch number is not determined (e.g. the block is not in the best block's past set).
 * @prop {number} gasLimit - the maximum gas allowed in this block.
 * @prop {number} [gasUsed=null] - the total gas used in this block. null when the block is pending.
 * @prop {string} hash - hash of the block.
 * @prop {number} height - the height of the block.
 * @prop {string} miner - the address of the beneficiary to whom the mining rewards were given.
 * @prop {number} nonce - the nonce of the block.
 * @prop {string} parentHash - hash of the parent block.
 * @prop {string} [powQuality] - the PoW quality. null when the block is pending.
 * @prop {string[]} refereeHashes - array of referee block hashes.
 * @prop {number} size - the size of this block in bytes, excluding the block header.
 * @prop {number} timestamp - the timestamp of the block.
 * @prop {string|Transaction[]} transactions - array of transaction objects, or 32-byte transaction hashes, depending on the second parameter.
 * @prop {string} transactionsRoot - the Merkle root of the transactions in this block.
 * @prop {string[]} custom - customized information. Note from v2.0 custom's type has changed from array of number array to array of hex string.
 * @prop {number} blockNumber - the number of this block's total order in the tree-graph. null when the order is not determined. Added from ProxyProvider-rust v1.1.5
  */
mazzeFormat.block = format({
  baseFeePerGas: format.bigUInt.$or(null),
  epochNumber: format.uInt.$or(null),
  blockNumber: format.uInt.$or(null),
  blame: format.uInt,
  height: format.uInt,
  size: format.uInt,
  timestamp: format.uInt,
  gasLimit: format.bigUInt,
  gasUsed: format.bigUInt.$or(null).$or(undefined), // XXX: undefined before main net upgrade
  difficulty: format.bigUInt,
  transactions: [(mazzeFormat.transaction).$or(format.transactionHash)],
}, {
  name: 'format.block',
});

/**
 * @typedef {Object} TransactionReceipt - TransactionReceipt
 * @prop {number} type - the type of the transaction. 0 for legacy transaction, 1 for 2930 transaction, 2 for EIP-1559 transaction.
 * @prop {string} blockHash - hash of the block where this transaction was in and got executed.
 * @prop {string} transactionHash - hash of the transaction.
 * @prop {number} index - transaction index within the block.
 * @prop {number} effectiveGasPrice - the effective gas price of the transaction.
 * @prop {number} burntGasFee - the burnt gas fee of the transaction.
 * @prop {number} epochNumber - the number of the epoch containing this transaction in the node's view of the ledger.
 * @prop {string} from
 * @prop {string} [to=null] - address of the receiver. null when it is a contract deployment transaction.
 * @prop {number} gasUsed - gas used for executing the transaction.
 * @prop {number} gasFee - gas charged to the sender's account. If the provided gas (gas limit) is larger than the gas used, at most 1/4 of it is refunded.
 * @prop {boolean} gasCoveredBySponsor - true if this transaction's gas fee was covered by the sponsor.
 * @prop {number} storageCollateralized - the amount of storage collateral this transaction required.
 * @prop {boolean} storageCoveredBySponsor - true if this transaction's storage collateral was covered by the sponsor.
 * @prop {object[]} storageReleased - array of storage change objects, each specifying an address and the corresponding amount of storage collateral released, e.g., [{ 'address': 'MAZZE:TYPE.USER:AARC9ABYCUE0HHZGYRR53M6CXEDGCCRMMYYBJGH4XG', 'collaterals': '0x280' }]
 * @prop {string} [contractCreated=null] - address of the contract created. null when it is not a contract deployment transaction.
 * @prop {string} stateRoot - hash of the state root after the execution of the corresponding block. 0 if the state root is not available.
 * @prop {number} outcomeStatus - the outcome status code. 0x0 means success. 0x1 means failed. 0x2 means skipped
 * @prop {string} logsBloom - bloom filter for light clients to quickly retrieve related logs.
 * @prop {Log[]} logs - array of log objects that this transaction generated
 * @prop {string} [txExecErrorMsg] - the error message of transaction execution. null when the transaction is succeeded.
 */
mazzeFormat.receipt = format({
  type: format.uInt.$or(null),
  index: format.uInt,
  epochNumber: format.uInt,
  outcomeStatus: format.uInt.$or(null),
  gasUsed: format.bigUInt,
  effectiveGasPrice: format.bigUInt.$or(null),
  burntGasFee: format.bigUInt.$or(null),
  gasFee: format.bigUInt,
  storageCollateralized: format.bigUInt,
  storageReleased: [{
    collaterals: format.bigUInt,
  }],
}, {
  name: 'format.receipt',
});

mazzeFormat.epochReceipts = format([[mazzeFormat.receipt]]).$or(null);

/**
 * @typedef {Object} Log - Log
 * @prop {string} address
 * @prop {string[]} topics
 * @prop {string} data
 * @prop {string} blockHash
 * @prop {number} epochNumber
 * @prop {string} transactionHash
 * @prop {number} transactionIndex
 * @prop {number} logIndex
 * @prop {number} transactionLogIndex
 */
mazzeFormat.log = format({
  epochNumber: format.uInt,
  logIndex: format.uInt,
  transactionIndex: format.uInt,
  transactionLogIndex: format.uInt,
}, {
  name: 'format.log',
});

mazzeFormat.logs = format([mazzeFormat.log]);

/**
 * @typedef {Object} SupplyInfo
 * @property {BigInt} totalCirculating
 * @property {BigInt} totalIssued
 * @property {BigInt} [totalEspaceTokens]
 */
mazzeFormat.supplyInfo = format({
  totalCirculating: format.bigUInt,
  totalIssued: format.bigUInt,
  totalEspaceTokens: format.bigUInt.$or(null),
}, {
  name: 'format.supplyInfo',
});

/**
 * @typedef {Object} SponsorInfo
 * @property {BigInt} sponsorBalanceForCollateral
 * @property {BigInt} sponsorBalanceForGas
 * @property {BigInt} sponsorGasBound
 * @property {BigInt} usedStoragePoints
 * @property {BigInt} availableStoragePoints
 * @property {string} sponsorForCollateral
 * @property {string} sponsorForGas
 */
mazzeFormat.sponsorInfo = format({
  sponsorBalanceForCollateral: format.bigUInt,
  sponsorBalanceForGas: format.bigUInt,
  sponsorGasBound: format.bigUInt,
  usedStoragePoints: format.bigUInt.$or(null),
  availableStoragePoints: format.bigUInt.$or(null),
}, {
  name: 'format.sponsorInfo',
});

/**
 * @typedef {Object} RewardInfo
 * @property {BigInt} baseReward
 * @property {BigInt} totalReward
 * @property {BigInt} txFee
 */
mazzeFormat.rewardInfo = format([
  {
    baseReward: format.bigUInt,
    totalReward: format.bigUInt,
    txFee: format.bigUInt,
  },
]);

/**
 * @typedef {Object} Vote
 * @prop {BigInt} amount
 * @prop {BigInt} unlockBlockNumber
 */
mazzeFormat.voteList = format([
  {
    amount: format.bigUInt,
    unlockBlockNumber: format.bigUInt,
  },
]);

/**
 * @typedef {Object} Deposit
 * @prop {BigInt} accumulatedInterestRate
 * @prop {BigInt} amount
 * @prop {BigInt} depositTime
 */
mazzeFormat.depositList = format([
  {
    amount: format.bigUInt,
    accumulatedInterestRate: format.bigUInt,
  },
]);

// ---------------------------- parse subscribe event -------------------------
/**
 * @typedef {Object} BlockHead - BlockHead
 * @prop {boolean} adaptive - true if the weight of the block is adaptive under the GHAST rule.
 * @prop {number} blame - if 0, then this block does not blame any blocks on its parent path. If it is n > 0, then this block blames its n predecessors on its parent path, e.g. when n = 1, then the block blames its parent but not its parent's parent.
 * @prop {string} deferredLogsBloomHash - the hash of the logs bloom after deferred execution at the block's epoch (assuming it is the pivot block).
 * @prop {string} deferredReceiptsRoot - the Merkle root of the receipts after deferred execution at the block's epoch (assuming it is the pivot block).
 * @prop {string} deferredStateRoot - the hash of the state trie root triplet after deferred execution at the block's epoch (assuming it is the pivot block).
 * @prop {number} difficulty - the PoW difficulty of this block.
 * @prop {number} [epochNumber] - the number of the epoch containing this block in the node's view of the ledger. null when the epoch number is not determined (e.g. the block is not in the best block's past set).
 * @prop {number} gasLimit - the maximum gas allowed in this block.
 * @prop {string} hash - hash of the block.
 * @prop {number} height - the height of the block.
 * @prop {string} miner - the address of the beneficiary to whom the mining rewards were given.
 * @prop {number} nonce - the nonce of the block.
 * @prop {string} parentHash - hash of the parent block.
 * @prop {string} [powQuality] - the PoW quality. null when the block is pending.
 * @prop {string[]} refereeHashes - array of referee block hashes.
 * @prop {number} timestamp - the timestamp of the block.
 * @prop {string} transactionsRoot - the Merkle root of the transactions in this block.
 * @prop {number} blockNumber - the number of this block's total order in the tree-graph. null when the order is not determined. Added from ProxyProvider-rust v1.1.5
  */
mazzeFormat.head = format({
  baseFeePerGas: format.bigUInt.$or(null),
  difficulty: format.bigUInt,
  epochNumber: format.uInt.$or(null),
  gasLimit: format.bigUInt,
  height: format.uInt,
  timestamp: format.uInt,
}, {
  name: 'format.head',
});

/**
 * @typedef {object} RevertNotification
 * @prop {number} revertTo
 */
mazzeFormat.revert = format({
  revertTo: format.uInt,
}, {
  name: 'format.revert',
});

/**
 * @typedef {string|number} epochNumber
 */
mazzeFormat.epoch = format({
  epochNumber: format.uInt,
}, {
  name: 'format.epoch',
});

// --------------------------- accountPendingInfo & transactions --------------
/**
 * @typedef {Object} AccountPendingInfo
 * @prop {number} localNonce
 * @prop {number} pendingCount
 * @prop {number} pendingNonce
 */
mazzeFormat.accountPendingInfo = format({
  localNonce: format.uInt,
  pendingCount: format.uInt,
  pendingNonce: format.uInt,
}, {
  name: 'format.accountPendingInfo',
});

/**
 * @typedef {Object} AccountPendingTransactions
 * @prop {number} pendingCount
 * @prop {Transaction[]} pendingTransactions
 * @prop {string|object} firstTxstatus
 */
mazzeFormat.accountPendingTransactions = format({
  pendingCount: format.bigUInt,
  pendingTransactions: [mazzeFormat.transaction],
}, {
  name: 'format.accountPendingTransactions',
});


/**
 * @typedef {Object} CollateralInfo
 * @property {BigInt} convertedStoragePoints Total converted storage points
 * @property {BigInt} totalStorageTokens Total collateral MAZZE
 * @property {BigInt} usedStoragePoints Current using storage points
 */
mazzeFormat.collateralInfo = format({
  convertedStoragePoints: format.bigUInt,
  totalStorageTokens: format.bigUInt,
  usedStoragePoints: format.bigUInt,
});

mazzeFormat.wrapTransaction = format({
  nativeTransaction: mazzeFormat.transaction,
  ethTransaction: format.any,
});

/**
 * @typedef {Object} FeeHistory
 * @property {BigInt} oldestEpoch Lowest epoch number of returned range.
 * @property {number[]} gasUsedRatio An array of block gas used ratios. These are calculated as the ratio of tx gasLimit sum and block gasLimit.
 * @property {BigInt[]} baseFeePerGas An array of block base fees per gas. This includes the next block after the newest of the returned range, because this value can be derived from the newest block. Zeroes are returned for pre-EIP-1559 blocks.
 * @property {BigInt[][]} reward A two-dimensional array of effective priority fees per gas at the requested block percentiles.
 */
mazzeFormat.feeHistory = format({
  oldestEpoch: format.bigUInt,
  baseFeePerGas: [format.bigUInt],
  reward: [[format.bigUInt]],
  gasUsedRatio: format.any,
});

module.exports = mazzeFormat;
