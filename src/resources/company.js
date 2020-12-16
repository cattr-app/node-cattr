class Company {

  /**
   * Initializes TimeIntervals resource interface
   * @param {Cattr} ctx Base class context
   */
  constructor(ctx) {

    this.$ = ctx;

  }

  async heartbeatInterval() {

    const res = await this.$.get('/company-settings', {});

    if (!res.success) {

      if (res.isNetworkError)
        throw new this.$.NetworkError(res);

      throw new this.$.ApiError(
        res.error.response.status,
        res.error.response.data.error_type || 'unknown',
        res.error.response.data.message || 'Unknown message',
      );

    }

    // Safely obtain the heartbeat interval
    if (res.response.data && res.response.data.data && res.response.data.data.heartbeat_period)
      return res.response.data.data.heartbeat_period;

    // Return null if response format is unexpected
    return null;

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
