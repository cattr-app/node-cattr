class OfflineSync {

  /**
   * Initializes TimeIntervals resource interface
   * @param {Cattr} ctx Base class context
   */
  constructor(ctx) {

    this.$ = ctx;

  }

  /**
   * Fetch public key to encrypt intervals digest
   * @async
   * @returns {String} RSA public key sha-256
   */
  async getPublicKey() {

    const res = await this.$.get('/offline-sync/public-key', {});

    if (!res.success) {

      if (res.isNetworkError)
        throw new this.$.NetworkError(res);

      throw new this.$.ApiError(res);

    }

    return res.response.data.key;

  }

}

module.exports = OfflineSync;
