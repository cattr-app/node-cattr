const FormData = require('form-data');

/**
 * Screenshot data object
 * @typedef  {Object} ScreenshotEntry
 * @property {Number} id            Screenshot's ID
 * @property {Number} intervalId    ID of related time interval
 * @property {String} path          URL to the image file
 * @property {String} thumbnailPath URL to the thumbnail file
 * @property {Date}   createdAt     Date of creation
 * @property {Date}   updatedAt     Date of last edit
 */

class CattrScreenshots {

  /**
   * Initializes Screenshots resource interface
   * @param {Cattr} ctx Base class context
   */
  constructor(ctx) {

    this.$ = ctx;

  }

  /**
   * Format raw screenshot entry
   * @param {Object} raw Raw screenshot entry
   * @returns {ScreenshotEntry}
   */
  static represent(raw) {

    return {
      id: Number(raw.id),
      intervalId: Number(raw.time_interval_id),
      path: String(raw.path),
      thumbnailPath: String(raw.thumbnail_path),
      createdAt: new Date(raw.created_at),
      updatedAt: new Date(raw.updated_at)
    };

  }

  /**
   * Uploads a screenshot
   * @async
   * @param {Number} intervalId Identifier of the pushed interval
   * @param {Object} screenshot Buffer with the screenshot
   */
  async upload(intervalId, screenshot) {

    if (typeof intervalId !== 'number')
      throw new TypeError(`Identifier of interval in screenshot upload method must be a number, but ${typeof intervalId} is given`);

    if (!Buffer.isBuffer(screenshot))
      throw new TypeError(`Screenshot must be a Buffer, but ${typeof screenshot} is given`);

    const reqData = new FormData();
    reqData.append('time_interval_id', intervalId);
    reqData.append('screenshot', screenshot, { filename: 'screenshot.jpeg' });

    const res = await this.$.post('screenshots/create', reqData, { headers: reqData.getHeaders() });
    if (!res.success) {

      if (res.isNetworkError)
        throw new this.$.NetworkError(res);

      throw new this.$.ApiError(
        res.error.response.status,
        res.error.response.data.error_type || 'unknown',
        res.error.response.data.message || 'Unknown message',
      );

    }

    return CattrScreenshots.represent(res.response.data.screenshot);

  }

}

module.exports = CattrScreenshots;
