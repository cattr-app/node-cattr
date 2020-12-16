/**
 * Total time entry
 * @typedef  {Object} TotalTimeEntry
 * @property {Date}   start Start of the selected period
 * @property {Date}   end   End of the selected period
 * @property {Number} time  Amount of tracked time
 */

/**
 * Object representing amount of time spended for a particular task
 * @typedef  {Object} TaskTimeEntry
 * @property {Number} id         Task ID
 * @property {Number} projectId  Project ID
 * @property {Number} assigneeId User ID
 * @property {Date}   start      Start date
 * @property {Date}   end        End date
 * @property {Number} time       Time in seconds
 */

class CattrTime {

  /**
   * Initializes Time resource interface
   * @param {Cattr} ctx Base class context
   */
  constructor(ctx) {

    this.$ = ctx;

  }

  /**
   * Format raw time task entry
   * @param {Object} raw Raw task
   * @returns {TaskTimeEntry}
   */
  static represent(raw) {

    return {

      id: Number(raw.id),
      projectId: Number(raw.project_id),
      assigneeId: Number(raw.user_id),
      start: new Date(raw.start),
      end: new Date(raw.end),
      time: Number(raw.time)

    };

  }

  /**
   * Returns total worked time
   * @async
   * @param {Object} [opts] Filtering options according to API documentation
   * @returns {Promise<TotalTimeEntry>}
   */
  async getTotal(opts) {

    if (opts && typeof opts !== 'object')
      throw new TypeError(`Total time filtering options must be an Object, but ${typeof opts} given`);

    const res = await this.$.post('time/total', opts || {});
    if (!res.success) {

      if (res.isNetworkError)
        throw new this.$.NetworkError(res);

      throw new this.$.ApiError(
        res.error.response.status,
        res.error.response.data.error_type || 'unknown',
        res.error.response.data.message || 'Unknown message',
      );

    }

    return {
      start: new Date(res.response.data.start),
      end: new Date(res.response.data.end),
      time: Number(res.response.data.time)
    };

  }

  /**
   * Returns total worked time
   * @async
   * @param {Object} [opts] Filtering options according to API documentation
   * @returns {Promise<Array<TimeTotalEntity>>}
   */
  async getPerTasks(opts) {

    if (opts && typeof opts !== 'object')
      throw new TypeError(`Total time filtering options must be an Object, but ${typeof opts} given`);

    const res = await this.$.post('time/tasks', opts || {});
    if (!res.success) {

      if (res.isNetworkError)
        throw new this.$.NetworkError(res);

      throw new this.$.ApiError(
        res.error.response.status,
        res.error.response.data.error_type || 'unknown',
        res.error.response.data.message || 'Unknown message',
      );

    }

    // Hotfix until this issue resolved - https://git.amazingcat.net/AmazingTime/core/backend/issues/58
    if (Array.isArray(res.response.data) && res.response.data.length === 0)
      return [];

    return res.response.data.tasks.map(CattrTime.represent);

  }

}

module.exports = CattrTime;
