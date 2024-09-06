const { PersonalMessage, sign, format } = require('../src');

const KEY = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const PUBLIC = '0x4646ae5047316b4230d0086c8acec687f00b1cd9d1dc634f6cb358ac0a9a8ffffe77b4dd0a4bfb95851f3b7355c781dd60f8418fc8a65d14907aff47c903a559';
const ADDRESS = 'mazzetest:aasm4c231py7j34fghntcfkdt2nm9xv1tum0f0a8zw';
const NET_ID = 1;
const message = 'Hello World';

test('new PersonalMessage(string)', () => {
  const messageBuf = Buffer.from(message);
  const msg = new PersonalMessage(message);
  const personalMsg = msg._prefix + messageBuf.length + message;
  expect(msg.hash).toEqual(format.hex(sign.keccak256(personalMsg)));
  expect(msg._originMsg).toEqual(message);
  expect(msg._personalMsg).toEqual(personalMsg);
  msg.sign(KEY, NET_ID);
  expect(msg.signature).toEqual(PersonalMessage.sign(KEY, message));
  expect(msg.from).toEqual(ADDRESS);
});

test('PersonalMessage.sign/recover', () => {
  const sig = '0xfa2f47c53c4df20314da305231f7f590f2d044d9ec92a74631e9f7a0b1703be9396e6ab94f7c03cd89a59121b52d27eda4e45379b5ebc1bd7c7d6be8814e40a901';
  expect(PersonalMessage.sign(KEY, message)).toEqual(sig);
  expect(PersonalMessage.recover(sig, message)).toEqual(PUBLIC);
});
