/**
 * In-process async mutex for serializing Google Sheets writes and preventing race conditions
 */
class AsyncLock {
  constructor() {
    this.queue = Promise.resolve();
  }

  acquire() {
    let release;
    const ticket = new Promise((resolve) => {
      release = resolve;
    });
    const current = this.queue;
    this.queue = current.then(() => ticket);
    return () => release();
  }

  async runExclusive(fn) {
    const release = await this.acquire();
    try {
      return await fn();
    } finally {
      release();
    }
  }
}

const globalLock = new AsyncLock();

module.exports = {
  AsyncLock,
  globalLock,
};
