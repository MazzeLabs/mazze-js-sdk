const format = require('./util/format');

/**
 * Positive decimal integer string in `Mazzy`
 */
class Mazzy extends String {
  /**
   * Get `Mazzy` string from `MAZZE`
   *
   * @param {string|number|BigInt} value
   * @return {Mazzy}
   *
   * @example
   * > Mazzy.fromMAZZE(3.14)
   [String (Mazzy): '3140000000000000000']
   * > Mazzy.fromMAZZE('0xab')
   [String (Mazzy): '171000000000000000000']
   */
  static fromMAZZE(value) {
    return new this(format.big(value).times(1e18).toFixed());
  }

  /**
   * Get `Mazzy` string from `GMazzy`
   *
   * @param {string|number|BigInt} value
   * @return {Mazzy}
   *
   * @example
   * > Mazzy.fromGMazzy(3.14)
   [String (Mazzy): '3140000000']
   * > Mazzy.fromGMazzy('0xab')
   [String (Mazzy): '171000000000']
   */
  static fromGMazzy(value) {
    return new this(format.big(value).times(1e9).toFixed());
  }

  /**
   * @param {number|string|BigInt} value
   * @return {Mazzy}
   *
   * @example
   * > new Mazzy(1.00)
   [String (Mazzy): '1']
   * > new Mazzy('0xab')
   [String (Mazzy): '171']
   */
  constructor(value) {
    super(format.bigUInt(value).toString(10));
  }

  /**
   * Get `MAZZE` number string
   * @return {string}
   *
   * @example
   * > Mazzy(1e9).toMAZZE()
   "0.000000001"
   */
  toMAZZE() {
    return format.big(this).div(1e18).toFixed();
  }

  /**
   * Get `GMazzy` number string
   * @return {string}
   *
   * @example
   * > Mazzy(1e9).toGMazzy()
   "1"
   */
  toGMazzy() {
    return format.big(this).div(1e9).toFixed();
  }
}

module.exports = new Proxy(Mazzy, {
  apply(target, thisArg, argArray) {
    return new Mazzy(...argArray);
  },
});
