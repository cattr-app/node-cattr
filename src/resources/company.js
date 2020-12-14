class Company {

  /**
   * Initializes TimeIntervals resource interface
   * @param {Cattr} ctx Base class context
   */
  constructor(ctx) {

    this.$ = ctx;

  }

  async heartbeatInterval() {

    try {
      const res = await this.$.get('/company-settings', {});
    } catch (error) {

      throw new this.$.ApiError(
        res.error.response.status,
        res.error.response.data.error_type || 'unknown',
        res.error.response.data.message || 'Unknown message',
      );

    }

    if (!res.success) {
      if (res.isNetworkError)
      throw new this.$.NetworkError(res);

  }
    return res.response.data.data.heartbeat_period;
}

  async heartBeat() {

    const res = await this.$.patch('users/activity', {});

    if (!res.success) {

      if (res.isNetworkError)
        throw new this.$.NetworkError(res);

      throw new this.$.ApiError(
        res.error.response.status,
        res.error.response.data.error_type || 'unknown',
        res.error.response.data.message || 'Unknown message',
      );

    }
    
    return res;

  }

}

module.exports = Company;
