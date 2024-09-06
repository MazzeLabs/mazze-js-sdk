const { ProxyProvider, format } = require('../../src');

const proxyProvider = new ProxyProvider({
  networkId: 1,
});

test('AdminControl', () => {
  const contract = proxyProvider.InternalContract('AdminControl');

  expect(format.hexAddress(contract.address)).toEqual('0x0888000000000000000000000000000000000000');
  expect(contract.constructor).toBeDefined();
});

test('SponsorWhitelistControl', () => {
  const contract = proxyProvider.InternalContract('SponsorWhitelistControl');

  expect(format.hexAddress(contract.address)).toEqual('0x0888000000000000000000000000000000000001');
  expect(contract.constructor).toBeDefined();
});


test('NOT EXIST', () => {
  expect(() => proxyProvider.InternalContract('NOT EXIST')).toThrow('can not find internal contract');
});
