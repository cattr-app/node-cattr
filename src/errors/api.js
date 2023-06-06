/**
 * Extended Error class representing an API error
 * @class
 * @extends Error
 */
class ApiError extends Error {

  /**
   * Creates new error
   * @property {Number} statusCode  HTTP status code
   * @property {String} code    Machine-readable error code / reason
   * @property {String} message Human-readable error message
   * @property {String|null} trace_id Backend trace id
   * @property {Object} context Request context Url, ?Payload, Method
   * @param {Object} res Axios response
   */
  constructor(res) {
    super();
    this.statusCode = res.error.response?.data?.status ?? res.error.response.status;
    this.code = res.error.response?.data?.error?.code ?? 'unknown error code';
    this.message = res.error.response?.data?.error?.message ?? res.error.response.statusText;
    this.trace_id = res.error.response?.data?.error?.trace_id ?? null;

    this.context = res.context;
    this.isApiError = true;

  }

}

module.exports = ApiError;
