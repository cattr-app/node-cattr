/**
 * Extended Error class representing a network error
 * @class
 * @extends Error
 */
class NetworkError extends Error {

  /**
   * Creates new error
   * @param {Object} response Axios response
   * @property {Object} context Request context: Url, ?Payload, Method
   * @returns {NetworkError}
   */
  constructor(response) {

    super();
    this.request = response;
    this.context = response.context;
    this.isNetworkError = true;

  }

}

module.exports = NetworkError;
