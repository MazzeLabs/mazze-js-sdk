const { Mazzy } = require('../src');

test('Mazzy.fromMAZZE', () => {
  expect(() => Mazzy.fromMAZZE(null)).toThrow('Invalid number');
  expect(() => Mazzy.fromMAZZE(-1)).toThrow('not match "bigUInt"');
  expect(Mazzy.fromMAZZE(3.14).toString()).toEqual('3140000000000000000');
  expect(Mazzy.fromMAZZE(1e-18).toString()).toEqual('1');
  expect(() => Mazzy.fromMAZZE(1e-19)).toThrow('Cannot');

  expect(() => Mazzy.fromMAZZE('')).toThrow('Invalid number');
  expect(Mazzy.fromMAZZE('0.0').toString()).toEqual('0');
  expect(Mazzy.fromMAZZE('0x0a').toString()).toEqual('10000000000000000000');
  expect(Mazzy.fromMAZZE('1e-18').toString()).toEqual('1');
  expect(() => Mazzy.fromMAZZE('1e-19')).toThrow('Cannot');
});

test('Mazzy.fromGMazzy', () => {
  expect(() => Mazzy.fromGMazzy(null)).toThrow('Invalid number');
  expect(() => Mazzy.fromGMazzy(-1)).toThrow('not match "bigUInt"');
  expect(Mazzy.fromGMazzy(3.14).toString()).toEqual('3140000000');
  expect(Mazzy.fromGMazzy(1e-9).toString()).toEqual('1');
  expect(() => Mazzy.fromGMazzy(1e-10)).toThrow('Cannot');

  expect(() => Mazzy.fromGMazzy('')).toThrow('Invalid number');
  expect(Mazzy.fromGMazzy('0.0').toString()).toEqual('0');
  expect(Mazzy.fromGMazzy('0x0a').toString()).toEqual('10000000000');
  expect(Mazzy.fromGMazzy('1e-9').toString()).toEqual('1');
  expect(() => Mazzy.fromGMazzy('1e-10')).toThrow('Cannot');
});

test('Mazzy', () => {
  expect(Mazzy('').toString()).toEqual('0');
  expect(Mazzy('0.0').toString()).toEqual('0');
  expect(Mazzy('0x0a').toString()).toEqual('10');
  expect(Mazzy(1e2).toString()).toEqual('100');
  expect((new Mazzy(1e2)).toString()).toEqual('100');

  expect(() => Mazzy()).toThrow('Cannot');
  expect(() => Mazzy(null)).toThrow('Cannot');
  expect(() => Mazzy(-1)).toThrow('not match "bigUInt"');
  expect(() => Mazzy(3.14)).toThrow('Cannot');
});

test('Mazzy.toXXX', () => {
  const mazzy = Mazzy.fromGMazzy(3.14);

  expect(mazzy.toString()).toEqual('3140000000');
  expect(mazzy.toGMazzy()).toEqual('3.14');
  expect(mazzy.toMAZZE()).toEqual('0.00000000314');

  expect(JSON.stringify(mazzy)).toEqual('"3140000000"');
});
