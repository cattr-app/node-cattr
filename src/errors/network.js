/**
 * Extended Error class representing a network error
 * @class
 * @extends Error
 */
class NetworkError extends Error {

  /**
   * Creates new error
   * @param {Object} response Axios response
   * @returns {NetworkError}
   */
  constructor(response) {

    super();
    this.request = response;
    this.isNetworkError = true;

  }

}

module.exports = NetworkError;
