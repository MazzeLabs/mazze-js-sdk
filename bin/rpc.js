#!/usr/bin/env node
/* eslint-disable no-console */
const { program } = require('commander');
const { ProxyProvider, Mazzy } = require('../src');

const mainnetMeta = {
  url: 'https://rpc-mainnet.mazze.io',
  networkId: 9999,
  /* For change later */
};

const devnetMeta = {
  url: 'https://rpc-devnet.mazze.io',
  networkId: 1990,
};

program
  .version('0.0.1')
  .name('sponsor')
  .option('-t, --devnet', 'Use ProxyProvider devnet network');

program
  .command('mazze')
  .description('call methods in mazze namespace')
  .argument('<method>', 'RPC method name to call')
  .argument('[args...]', 'args')
  .action(mazze);

program
  .command('call')
  .description('call methods in mazze namespace')
  .argument('<namespace>', 'RPC namespace: mazze, txpool, trace')
  .argument('<method>', 'RPC method name to call')
  .argument('[args...]', 'args')
  .action(call);

function _getClient() {
  const options = program.opts();
  const proxyProvider = options.devnet ? new ProxyProvider(devnetMeta) : new ProxyProvider(mainnetMeta);
  return proxyProvider;
}

/* function _getAccount(proxyProvider) {
  if (!process.env.PRIVATE_KEY) {
    console.log('Please set PRIVATE_KEY environment variable to update sponsor');
    process.exit();
  }
  return proxyProvider.wallet.addPrivateKey(process.env.PRIVATE_KEY);
} */

async function mazze(method, args) {
  const proxyProvider = _getClient();
  if (!proxyProvider.mazze[method]) {
    console.log(`${method} is not a valid mazze method`);
    return;
  }
  const result = await proxyProvider.mazze[method](...args);
  console.log(`mazze_${method}: `, result);
}

async function call(namespace, method, args) {
  const proxyProvider = _getClient();

  if (!proxyProvider[namespace]) {
    console.log(`${namespace} is not a valid namespace`);
    return;
  }
  const methods = proxyProvider[namespace];

  if (!methods[method]) {
    console.log(`${method} is not a valid ${namespace} method`);
    return;
  }
  const result = await methods[method](...args);
  console.log(`${namespace}_${method}: `, result);
}

program.parse(process.argv);
