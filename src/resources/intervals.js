const FormData = require('form-data');

/**
 * DTO representing interval which should be pushed
 * @typedef  {Object} IntervalPushDTO
 * @property {Number} taskId    ID of the related task
 * @property {Number} userId    ID of the related user
 * @property {Date}   start     Date object representing start of the interval
 * @property {Date}   end       Date object representing end of the interval
 * @property {Number|null} mouseActivity    Percent of time of mouse activity
 * @property {Number|null} keyboardActivity Percent of time of keyboard activity
 * @property {Number} systemActivity  Percent of time of system reported activity
 */

/**
 * Interval
 * @typedef  {Object} IntervalEntry
 * @property {Number} id        ID of interval
 * @property {Number} taskId    ID of the related task
 * @property {Number} userId    ID of the related user
 * @property {Date}   start     Date object representing start of the interval
 * @property {Date}   end       Date object representing end of the interval
 * @property {Number|null} mouseActivity    Percent of time of mouse activity
 * @property {Number|null} keyboardActivity Percent of time of keyboard activity
 * @property {Number} systemActivity  Percent of time of system reported activity
 * @property {Date}   createdAt Date of creation
 * @property {Date}   updatedAt Date of last update
 */

/**
 * Active window properties (used within the Web/App Monitoring)
 * @typedef {Object} ActiveApplicationParams
 * @property {String} [executable] Path to the executable file
 * @property {String} [title] Window's title
 * @property {String} [url] Browser window's URL
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
      systemActivity: Number(raw.activity_fill),
      mouseActivity: Number(raw.mouse_fill) || null,
      keyboardActivity: Number(raw.keyboard_fill) || null,
      createdAt: new Date(raw.created_at),
      updatedAt: new Date(raw.updated_at)
    };

  }

  /**
   * Creates interval
   * @async
   * @param {IntervalPushDTO} interval Properties of the interval
   */
  async create(interval) {

    if (typeof interval !== 'object')
      throw new TypeError(`Interval DTO must be an object, but ${typeof intervalId} is given`);

    const reqData = new FormData();
    reqData.append('task_id', interval.taskId);
    reqData.append('user_id', interval.userId);
    reqData.append('start_at', interval.start.toISOString());
    reqData.append('end_at', interval.end.toISOString());
    reqData.append('activity_fill', interval.systemActivity);

    if (interval.keyboardActivity)
      reqData.append('keyboard_fill', interval.keyboardActivity);

    if (interval.mouseActivity)
      reqData.append('mouse_fill', interval.mouseActivity);

    const res = await this.$.post('time-intervals/create', reqData, { headers: reqData.getHeaders() });
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
    reqData.append('activity_fill', interval.systemActivity);
    reqData.append('screenshot', screenshot, { filename: 'screenshot.jpeg' });

    if (interval.keyboardActivity)
      reqData.append('keyboard_fill', interval.keyboardActivity);

    if (interval.mouseActivity)
      reqData.append('mouse_fill', interval.mouseActivity);

    const res = await this.$.post('time-intervals/create', reqData, { headers: reqData.getHeaders() });

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
   * Removes interval
   * @async
   * @param {Number} intervalId Identifier of interval being removed
   * @returns {Promise<Boolean>}
   */
  async remove(intervalId) {

    if (typeof intervalId !== 'number')
      throw new TypeError(`Interval ID  must be a Number, but ${typeof intervalId} is given`);

    const res = await this.$.post('time-intervals/remove', { id: intervalId });
    if (!res.success) {

      if (res.isNetworkError)
        throw new this.$.NetworkError(res);

      throw new this.$.ApiError(
        res.error.response.status,
        res.error.response.data.error.code || 'unknown',
        res.error.response.data.error.message || 'Unknown message',
      );

    }

    return true;

  }

  /**
   * Notify server about active window change
   * @async
   * @param {ActiveApplicationParams} application Properties of the active application
   */
  async pushActiveApplicationUpdate(application) {

    if (typeof application !== 'object')
      throw new this.$.ApiError(`Active Application DTO must be an object, but ${typeof application} is given`);

    if (typeof application.title !== 'string')
      throw new TypeError('Active window\'s title isn\'t string!');

    if (typeof application.executable !== 'string')
      throw new TypeError('Active window\'s executable isn\'t string!');
    if (application.executable === '')
      throw new TypeError('Active window\'s executable shouldn\'t be empty!');

    const res = await this.$.put('time-intervals/app', application);

    if (!res.success) {

      if (res.isNetworkError)
        throw new this.$.NetworkError(res);

      throw new this.$.ApiError(
        res.error.response.status,
        res.error.response.data.error_type || 'unknown',
        res.error.response.data.message || 'Unknown message',
      );

    }

  }

}

module.exports = CattrIntervals;
