class Company {

  /**
   * Initializes TimeIntervals resource interface
   * @param {Cattr} ctx Base class context
   */
  constructor(ctx) {

    this.$ = ctx;

  }

  /**
   * Fetch heartbeat interval
   * @async
   * @returns {Promise.<Number|null>} Heartbeat interval in seconds
   */
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

  /**
   * Sends a heartbeat ping
   * @async
   * @returns {Promise.<Object>} Response
   */
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

  /**
   * Fetch information about backend instance
   * @async
   * @returns {Promise.<Object>} Company details
   */
  async about() {

    const res = await this.$.get('/about', {});

    if (!res.success) {

      if (res.isNetworkError)
        throw new this.$.NetworkError(res);

      throw new this.$.ApiError(
        res.error.response.status,
        res.error.response.data.error_type || 'unknown',
        res.error.response.data.message || 'Unknown message',
      );

    }

    // Return response if structure
    if (res.response.data.app && res.response.data.app.version && res.response.data.app.instance_id)
      return res.response.data;

    // Return null if response format is unexpected
    return null;

  }

}

module.exports = Company;
