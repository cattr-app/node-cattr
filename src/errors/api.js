/**
 * Extended Error class representing an API error
 * @class
 * @extends Error
 */
class ApiError extends Error {

  /**
   * Creates new error
   * @param {Number} status  HTTP status code
   * @param {String} type    Machine-readable error code / reason
   * @param {String} message Human-readable error message
   */
  constructor(status, type, message) {

    super();
    this.type = type;
    this.statusCode = status;
    this.message = message;
    this.isApiError = true;

  }

}

module.exports = ApiError;
