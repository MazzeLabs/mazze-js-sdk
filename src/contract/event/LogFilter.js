class LogFilter {
  constructor({ address, topics }, event) {
    this.address = address;
    this.topics = topics;
    Reflect.defineProperty(this, 'event', { value: event }); // XXX: use defineProperty to avoid from JSON.stringify
  }

  async getLogs(options = {}) {
    const logs = await this.event.proxyProvider.mazze.getLogs({ ...this, ...options });

    logs.forEach(log => {
      log.arguments = this.event.decodeLog(log);
    });

    return logs;
  }

  async subscribeLogs(options = {}) {
    const subscription = await this.event.proxyProvider.subscribeLogs({ ...this, ...options });

    subscription.on('data', log => {
      log.arguments = this.event.decodeLog(log);
    });

    return subscription;
  }
}

module.exports = LogFilter;
