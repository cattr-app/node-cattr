/**
 * Extended Error class representing an credentials error
 * @class
 * @extends Error
 */
class CredentialsError extends Error {

  /**
   * Creates new error
   * @param {Number} status  HTTP status code
   * @param {String} type    Machine-readable error code / reason
   * @param {String} message Human-readable error message
   */
  constructor(status, type, message) {

    super();
    this.isCredentialError = true;
    this.response = {
      status,
      data: {
        error_type: type,
        message
      }
    };

  }

}

module.exports = CredentialsError;
