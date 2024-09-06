/* eslint-disable */
const { ProxyProvider } = require('../src'); // require('mazze-js-sdk');

// create proxyProvider sdk instance and connect to remote node
const proxyProvider = new ProxyProvider({
  // url: 'http://localhost:12537',
  url: 'https://devnet.mazze.io',
  networkId: 1990,
  // logger: console, // use console to print log
});

function listProxyProviderPrototypes() {
  console.log(Object.getOwnPropertyNames(proxyProvider.constructor.prototype));
  /*
  [
    'constructor',
    'Contract',
    'InternalContract',
    'close',
    'getClientVersion',
    'getStatus',
    'getGasPrice',
    'getInterestRate',
    'getAccumulateInterestRate',
    'getAccount',
    'getBalance',
    'getNextNonce',
    'getAdmin',
    'getEpochNumber',
    'getBlockByEpochNumber',
    'getBlocksByEpochNumber',
    'getBlockRewardInfo',
    'getBestBlockHash',
    'getBlockByHash',
    'getBlockByHashWithPivotAssumption',
    'getConfirmationRiskByHash',
    'getTransactionByHash',
    'getTransactionReceipt',
    'sendRawTransaction',
    'sendTransaction',
    'getCode',
    'getStorageAt',
    'getStorageRoot',
    'getSponsorInfo',
    'getCollateralForStorage',
    'call',
    'estimateGasAndCollateral',
    'getLogs',
    'subscribe',
    'subscribeEpochs',
    'subscribeNewHeads',
    'subscribeLogs',
    'unsubscribe'
  ]
  */
}

async function getStatus() {
  // call RPC and get connected node status
  console.log(await proxyProvider.getStatus());
  /*
  {
    chainId: 1,
    epochNumber: 779841,
    blockNumber: 1455488,
    pendingTxNumber: 2,
    bestHash: '0x3e5816431723620a40876454f6cccbd8d62188dc07ce9ce2cb38563a22c26cdb'
  }
  */
}

async function getStatusByProvider() {
  // call RPC and get status by provider directly
  console.log(await proxyProvider.provider.call('mazze_getStatus'));
  /*
  {
    bestHash: '0xbec9b9318a5473416b5bdf95d7f378c966ea0356aa98e2d96c8cad48aff32ebe',
    blockNumber: '0x163aaa',
    chainId: '0x1',
    epochNumber: '0xbe939',
    pendingTxNumber: '0x2'
  }
  */
}

// ----------------------------------------------------------------------------
async function main() {
  listProxyProviderPrototypes();

  await getStatus();

  await getStatusByProvider();
}

main().finally(() => proxyProvider.close());
