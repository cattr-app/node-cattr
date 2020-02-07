const FormData = require('form-data');

/**
 * DTO representing interval which should be pushed
 * @typedef  {Object} IntervalPushDTO
 * @property {Number} taskId    ID of the related task
 * @property {Number} userId    ID of the related user
 * @property {Date}   start     Date object representing start of the interval
 * @property {Date}   end       Date object representing end of the interval
 * @property {Number} mouse     Amount of mouse events
 * @property {Number} keyboard  Amount of keyboard events
 */

/**
 * Interval
 * @typedef  {Object} IntervalEntry
 * @property {Number} id        ID of interval
 * @property {Number} taskId    ID of the related task
 * @property {Number} userId    ID of the related user
 * @property {Date}   start     Date object representing start of the interval
 * @property {Date}   end       Date object representing end of the interval
 * @property {Number} mouse     Amount of mouse events
 * @property {Number} keyboard  Amount of keyboard events
 * @property {Date}   createdAt Date of creation
 * @property {Date}   updatedAt Date of last update
 */

class CattrIntervals {

  /**
   * Initializes TimeIntervals resource interface
   * @param {Cattr} ctx Base class context
   */
  constructor(ctx) {

    this.$ = ctx;

  }

  /**
   * Format raw interval object into usable form
   * @param {Object} raw Raw interval
   * @returns {IntervalEntry}
   */
  static represent(raw) {

    return {
      id: Number(raw.id),
      taskId: Number(raw.task_id),
      userId: Number(raw.user_id),
      start: new Date(raw.start_at),
      end: new Date(raw.end_at),
      mouse: Number(raw.count_mouse),
      keyboard: Number(raw.count_keyboard),
      createdAt: new Date(raw.created_at),
      updatedAt: new Date(raw.updated_at)
    };

  }

  /**
   * Creates interval with screenshot
   * @async
   * @param {IntervalPushDTO} interval Properties of the interval
   * @param {Buffer} screenshot Screenshot in JPG or PNG
   */
  async createWithScreenshot(interval, screenshot) {

    if (typeof interval !== 'object')
      throw new TypeError(`Interval DTO must be an object, but ${typeof intervalId} is given`);

    if (!Buffer.isBuffer(screenshot))
      throw new TypeError(`Screenshot must be a Buffer, but ${typeof screenshot} is given`);

    const reqData = new FormData();
    reqData.append('task_id', interval.taskId);
    reqData.append('user_id', interval.userId);
    reqData.append('start_at', interval.start.toISOString());
    reqData.append('end_at', interval.end.toISOString());
    reqData.append('count_mouse', interval.mouse);
    reqData.append('count_keyboard', interval.keyboard);
    reqData.append('screenshot', screenshot, { filename: 'screenshot.jpeg' });

    const res = await this.$.post(`api/${this.$.apiVersion}/time-intervals/create`, reqData, { headers: reqData.getHeaders() });
    if (!res.success) {

      if (res.isNetworkError)
        throw new this.$.NetworkError(res);

      throw new this.$.ApiError(
        res.error.response.status,
        res.error.response.data.error_type || 'unknown',
        res.error.response.data.message || 'Unknown message',
      );

    }

    return CattrIntervals.represent(res.response.data.interval);

  }

  /**
   * Removes interval
   * @async
   * @param {Number} intervalId Identifier of interval being removed
   * @returns {Promise<Boolean>}
   */
  async remove(intervalId) {

    if (typeof intervalId !== 'number')
      throw new TypeError(`Interval ID  must be a Number, but ${typeof intervalId} is given`);

    const res = await this.$.post(`api/${this.$.apiVersion}/time-intervals/remove`, { id: intervalId });
    if (!res.success) {

      if (res.isNetworkError)
        throw new this.$.NetworkError(res);

      throw new this.$.ApiError(
        res.error.response.status,
        res.error.response.data.error_type || 'unknown',
        res.error.response.data.message || 'Unknown message',
      );

    }

    return true;

  }

}

module.exports = CattrIntervals;
