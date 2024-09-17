const { Transaction, format, sign } = require('../src');
const KEY = require('./index').TEST_KEY;

const ADDRESS = 'mazzetest:aasm4c231py7j34fghntcfkdt2nm9xv1tum0f0a8zw';
const networkId = 1;

const txMeta = {
  nonce: 0,
  gasPrice: 1,
  gas: 21000,
  to: '0x0123456789012345678901234567890123456789',
  value: 0,
  storageLimit: 0,
  epochHeight: 0,
  chainId: 1990,
};

const rawTx = '0xf863df8001825208940123456789012345678901234567890123456789808080018001a0ef53e4af065905cb5134f7de4e9434e71656f824e3e268a9babb4f14ff808113a0407f05f44f79c1fd19262665d3efc29368e317fe5e77be27c0c1314b6a242a1e';

const tx2930Meta = {
  type: 1,
  nonce: 100,
  gasPrice: 100,
  gas: 100,
  to: '0x19578cf3c71eab48cf810c78b5175d5c9e6ef441',
  value: 100,
  data: format.hex(Buffer.from('Hello, World')),
  storageLimit: 100,
  epochHeight: 100,
  chainId: 1990,
  accessList: [
    {
      address: '0x19578cf3c71eab48cf810c78b5175d5c9e6ef441',
      storageKeys: [
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      ],
    },
  ],
};

const tx1559Meta = {
  type: 2,
  nonce: 100,
  maxPriorityFeePerGas: 100,
  maxFeePerGas: 100,
  gas: 100,
  to: '0x19578cf3c71eab48cf810c78b5175d5c9e6ef441',
  value: 100,
  data: format.hex(Buffer.from('Hello, World')),
  storageLimit: 100,
  epochHeight: 100,
  chainId: 1990,
  accessList: [
    {
      address: '0x19578cf3c71eab48cf810c78b5175d5c9e6ef441',
      storageKeys: [
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      ],
    },
  ],
};

test('Transaction', () => {
  const transaction = new Transaction(txMeta);

  expect(transaction.nonce).toEqual(0);
  expect(transaction.gasPrice).toEqual(1);
  expect(transaction.gas).toEqual(21000);
  expect(transaction.to).toEqual('0x0123456789012345678901234567890123456789');
  expect(transaction.value).toEqual(0);
  expect(transaction.storageLimit).toEqual(0);
  expect(transaction.epochHeight).toEqual(0);
  expect(transaction.chainId).toEqual(1);
  expect(transaction.data).toEqual(undefined);
  expect(transaction.r).toEqual(undefined);
  expect(transaction.s).toEqual(undefined);
  expect(transaction.v).toEqual(undefined);
  expect(transaction.from).toEqual(undefined); // virtual attribute
  expect(transaction.hash).toEqual(undefined); // virtual attribute

  transaction.sign(KEY, networkId);

  expect(transaction.r).toEqual('0xef53e4af065905cb5134f7de4e9434e71656f824e3e268a9babb4f14ff808113');
  expect(transaction.s).toEqual('0x407f05f44f79c1fd19262665d3efc29368e317fe5e77be27c0c1314b6a242a1e');
  expect(transaction.v).toEqual(1);
  expect(transaction.from).toEqual(ADDRESS);
  expect(transaction.hash).toEqual('0x9e463f32428c7c4026575d132e8c4e5d6fe387322fce5234103e52f4ab39b053');
  expect(transaction.recover()).toEqual('0x4646ae5047316b4230d0086c8acec687f00b1cd9d1dc634f6cb358ac0a9a8ffffe77b4dd0a4bfb95851f3b7355c781dd60f8418fc8a65d14907aff47c903a559');
  expect(transaction.serialize()).toEqual(rawTx);
});

test('2930 tx encode', () => {
  const tx1 = new Transaction(Object.assign(tx2930Meta, {
    r: 1,
    s: 1,
    v: 0,
  }));

  const rlpEncode = tx1.encode(false);

  expect(format.hex(rlpEncode).startsWith('0x63667801')).toEqual(false);
  expect(format.hex(sign.keccak256(rlpEncode))).toEqual('0x54488f978853789817f8b81ccb66178ad4754ad406b654dc63c773ea55e86d72');
  expect(format.hex(tx1.encode(true))).toEqual('0x6d617a7a6501f868f8636464649419578cf3c71eab48cf810c78b5175d5c9e6ef441646464648c48656c6c6f2c20576f726c64f838f79419578cf3c71eab48cf810c78b5175d5c9e6ef441e1a01234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef800101');
});

test('2930 tx sign', () => {
  const tx1 = new Transaction(tx1559Meta);
  tx1.sign(KEY);
  // console.log(tx1.serialize());
});

test('starts with 0x00', () => {
  const transaction = new Transaction({
    nonce: 127,
    gasPrice: 1,
    gas: 21000,
    to: '0x0123456789012345678901234567890123456789',
    value: 0,
    storageLimit: 0,
    epochHeight: 0,
    chainId: 1990,
  });

  transaction.sign(KEY, 1);

  expect(transaction.s).toEqual('0x233f41b647de5846856106a8bc0fb67ba4dc3c184d328e565547928adedc8f3c');
  expect(transaction.serialize()).toEqual('0xf863df7f01825208940123456789012345678901234567890123456789808080018001a0bde07fe87c58cf83c50a4787c637a05a521d5f8372bd8acb207504e8af2daee4a0233f41b647de5846856106a8bc0fb67ba4dc3c184d328e565547928adedc8f3c');
});

test('decodeRawTransaction', () => {
  const transaction = Transaction.decodeRaw(rawTx);
  expect(transaction.chainId).toEqual(1);
  expect(transaction.nonce).toEqual(BigInt(0));
  expect(transaction.to).toEqual(format.address('0x0123456789012345678901234567890123456789', transaction.chainId));

  // empty to address
  const deployTx = new Transaction({
    ...txMeta,
    to: null,
  });
  deployTx.sign(KEY, 1);

  const decodedDeployTx = Transaction.decodeRaw(deployTx.serialize());
  expect(decodedDeployTx.to).toEqual(null);

  // tx with data
  const data = format.hex(Buffer.from('Example data'));
  const dataTx = new Transaction({
    ...txMeta,
    data,
  });

  dataTx.sign(KEY, 1);

  const decodedDataTx = Transaction.decodeRaw(dataTx.serialize());
  expect(decodedDataTx.data).toEqual(data);
});
