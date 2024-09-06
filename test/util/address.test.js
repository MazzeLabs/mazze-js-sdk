const { address } = require('../../src');

const MAINNET_ADDRESS = 'mazze:aak2rra2njvd77ezwjvx04kkds9fzagfe6ku8scz91';
const DEVNET_ADDRESS = 'mazzetest:aak2rra2njvd77ezwjvx04kkds9fzagfe6d5r8e957';

test('shorten', () => {
  expect(address.shortenMazzeAddress(MAINNET_ADDRESS)).toEqual('mazze:aak...ku8scz91');
  expect(address.shortenMazzeAddress(MAINNET_ADDRESS, true)).toEqual('mazze:aak...cz91');
  expect(address.shortenMazzeAddress(DEVNET_ADDRESS)).toEqual('mazzetest:aak...e957');
  expect(address.shortenMazzeAddress(DEVNET_ADDRESS, true)).toEqual('mazzetest:aak...e957');
});
