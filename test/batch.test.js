const { ProxyProvider, format } = require('../src');
const mazzeFormat = require('../src/rpc/types/formatter');

const proxyProvider = new ProxyProvider({
  url: 'http://localhost:12537',
  // url: 'https://devnet.mazze.io',
  networkId: 1,
});
const account = proxyProvider.wallet.addPrivateKey('0x7d2fb0bafa614aa26c1776b7dc2f79e1d0598aeaf57c6e526c35e9e427ac823f');
const targetAddress = 'mazzetest:aasm4c231py7j34fghntcfkdt2nm9xv1tum0f0a8zw';

/* test('Populate tx', async () => {
  async function populate() {
    const tx = await proxyProvider.mazze.populateTransaction({
      from: account.address,
      to: targetAddress,
      value: 1,
    });
    return tx;
  }

  await expect(populate()).resolves.toEqual({
    from: account.address,
  });
}); */

test('RPC methods request builder', () => {
  /**
   * RPC method request template
    expect(proxyProvider.mazze.epochNumber.request()).toEqual({
      request: {
        method: '',
        params: [],
      },
      decoder: format.any,
    });
  */
  expect(proxyProvider.mazze.getStatus.request()).toEqual({
    request: {
      method: 'mazze_getStatus',
      params: [],
    },
    decoder: mazzeFormat.status,
  });

  expect(proxyProvider.mazze.getBalance.request(format.hexAddress(account.address))).toEqual({
    request: {
      method: 'mazze_getBalance',
      params: [account.address],
    },
    decoder: format.bigUInt,
  });

  expect(proxyProvider.mazze.getBalance.request(account.address)).toEqual({
    request: {
      method: 'mazze_getBalance',
      params: [account.address],
    },
    decoder: format.bigUInt,
  });

  expect(proxyProvider.mazze.epochNumber.request()).toEqual({
    request: {
      method: 'mazze_epochNumber',
      params: [],
    },
    decoder: format.uInt,
  });

  expect(proxyProvider.mazze.epochNumber.request('latest_state')).toEqual({
    request: {
      method: 'mazze_epochNumber',
      params: ['latest_state'],
    },
    decoder: format.uInt,
  });

  expect(proxyProvider.mazze.call.request({
    from: account.address,
    to: targetAddress,
    value: 1,
  })).toEqual({
    request: {
      method: 'mazze_call',
      params: [{
        from: account.address,
        to: targetAddress,
        value: '0x1',
      }, undefined],
    },
  });
});
