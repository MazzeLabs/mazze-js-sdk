#!/usr/bin/env node
/* eslint-disable no-console */
const { program } = require('commander');
const { ProxyProvider, Mazzy } = require('../src');

const mainnetMeta = {
  url: 'https://main.mazze.io',
  networkId: 9999,
};

const devnetMeta = {
  url: 'https://devnet.mazze.io',
  networkId: 1990,
};

program
  .version('0.0.1')
  .name('sponsor')
  .option('-t, --devnet', 'Use ProxyProvider devnet network');

program
  .command('info')
  .description('Get contract sponsor info')
  .argument('<contractAddr>', 'Contract address')
  .action(info);

program
  .command('setGasSponsor')
  .description('Set gas sponsor')
  .argument('<contractAddr>', 'Contract address')
  .argument('<upperBound>', 'Sponsor upper bound in GMazzy')
  .argument('<value>', 'Value in MAZZE')
  .action(setGasSponsor);

program
  .command('setCollateralSponsor')
  .description('Set collateral sponsor')
  .argument('<contractAddr>', 'Contract address')
  .argument('<value>', 'Value in MAZZE')
  .action(setCollateralSponsor);

program
  .command('addToWhiteList')
  .description('Add address to whitelist')
  .argument('<contractAddr>', 'Contract address')
  .argument('<targetAddr>', '')
  .action(addToWhiteList);

program
  .command('removeFromWhiteList')
  .description('Remove address from whitelist')
  .argument('<contractAddr>', 'Contract address')
  .argument('<targetAddr>', '')
  .action(removeFromWhiteList);

async function info(contractAddr) {
  const { proxyProvider, SponsorWhitelistControl } = _getClient();
  const sponsorInfo = await proxyProvider.getSponsorInfo(contractAddr);
  console.log('Gas Sponsor: ', sponsorInfo.sponsorForGas);
  console.log('Gas Sponsor Balance: ', new Mazzy(sponsorInfo.sponsorBalanceForGas).toMAZZE(), 'MAZZE');
  console.log('Gas Sponsor upperBound: ', new Mazzy(sponsorInfo.sponsorGasBound).toGMazzy(), 'GMazzy');
  console.log('Collateral Sponsor: ', sponsorInfo.sponsorForCollateral);
  console.log('Collateral Sponsor Balance: ', new Mazzy(sponsorInfo.sponsorBalanceForCollateral).toMAZZE(), 'MAZZE');
  const isAllWhiteList = await SponsorWhitelistControl.isAllWhitelisted(contractAddr);
  console.log('IsAllWhitelisted: ', isAllWhiteList);
  const admin = await _getAdmin(proxyProvider, contractAddr);
  console.log('Contract Admin: ', admin);
  console.log('');
}

async function setGasSponsor(contractAddr, upperBound, value) {
  const { proxyProvider, SponsorWhitelistControl } = _getClient();
  const account = _getAccount(proxyProvider);
  /* const admin = await _getAdmin(proxyProvider, contractAddr);
  if (account.address !== admin) {
    console.log('You are not admin');
    return;
  } */
  // TODO add more check: value > upperBound * 1000; new sponsor balance > old sponsor balance; sponsor have enough balance for value
  const receipt = await SponsorWhitelistControl
    .setSponsorForGas(contractAddr, Mazzy.fromGMazzy(upperBound))
    .sendTransaction({
      from: account.address,
      value: Mazzy.fromMAZZE(value),
    })
    .executed();
  console.log(`Set gas sponsor success: ${receipt.outcomeStatus === 0}, tx hash ${receipt.transactionHash}`);
}

async function setCollateralSponsor(contractAddr, value) {
  const { proxyProvider, SponsorWhitelistControl } = _getClient();
  const account = _getAccount(proxyProvider);
  /* const admin = await _getAdmin(proxyProvider, contractAddr);
  if (account.address !== admin) {
    console.log('You are not admin');
    return;
  } */
  // TODO add more check: sponsor for collateral must bigger than current if want replace a old sponsor
  const receipt = await SponsorWhitelistControl
    .setSponsorForCollateral(contractAddr)
    .sendTransaction({
      from: account.address,
      value: Mazzy.fromMAZZE(value),
    })
    .executed();
  console.log(`Set collateral sponsor success: ${receipt.outcomeStatus === 0}, tx hash ${receipt.transactionHash}`);
}

async function removeFromWhiteList(contractAddr, targetAddr) {
  const { proxyProvider, SponsorWhitelistControl } = _getClient();
  const account = _getAccount(proxyProvider);
  const admin = await _getAdmin(proxyProvider, contractAddr);
  if (account.address !== admin) {
    console.log('You are not admin');
    return;
  }
  const receipt = await SponsorWhitelistControl
    .removePrivilegeByAdmin(contractAddr, [targetAddr])
    .sendTransaction({
      from: account.address,
    })
    .executed();
  console.log(`Remove from whitelist success: ${receipt.outcomeStatus === 0}, tx hash ${receipt.transactionHash}`);
}

async function addToWhiteList(contractAddr, targetAddr) {
  const { proxyProvider, SponsorWhitelistControl } = _getClient();
  const account = _getAccount(proxyProvider);
  const admin = await _getAdmin(proxyProvider, contractAddr);
  if (account.address !== admin) {
    console.log('You are not admin');
    return;
  }
  const receipt = await SponsorWhitelistControl
    .addPrivilegeByAdmin(contractAddr, [targetAddr])
    .sendTransaction({
      from: account.address,
    })
    .executed();
  console.log(`Add to whitelist success: ${receipt.outcomeStatus === 0}, tx hash ${receipt.transactionHash}`);
}

function _getClient() {
  const options = program.opts();
  const proxyProvider = options.devnet ? new ProxyProvider(devnetMeta) : new ProxyProvider(mainnetMeta);
  const SponsorWhitelistControl = proxyProvider.InternalContract('SponsorWhitelistControl');
  return {
    proxyProvider,
    SponsorWhitelistControl,
  };
}

async function _getAdmin(proxyProvider, contractAddr) {
  const AdminControl = proxyProvider.InternalContract('AdminControl');
  const admin = await AdminControl.getAdmin(contractAddr);
  return admin;
}

function _getAccount(proxyProvider) {
  if (!process.env.PRIVATE_KEY) {
    console.log('Please set PRIVATE_KEY environment variable to update sponsor');
    process.exit();
  }
  return proxyProvider.wallet.addPrivateKey(process.env.PRIVATE_KEY);
}

program.parse(process.argv);
