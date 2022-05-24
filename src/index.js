const axios = require('axios');
const ApiError = require('./errors/api');
const NetworkError = require('./errors/network');
const CredentialsError = require('./errors/credentials');
const Authentication = require('./authentication');
const Projects = require('./resources/projects');
const Tasks = require('./resources/tasks');
const Time = require('./resources/time');
const Screenshots = require('./resources/screenshots');
const Intervals = require('./resources/intervals');
const Company = require('./resources/company');

/**
 * Some entity (like token or credentials) provider interface
 * @typedef {Object} EntityProvider
 * @property {Function} get Returns this entity value
 * @property {Function} set Sets this entity value
 */

/**
 * Request options
 * @typedef {Object} RequestOptions
 * @property {Object}  [headers]    Additional headers
 * @property {Boolean} [noAuth]     Do not authenticate this request
 * @property {Boolean} [noPaginate] Do not paginate this request
 * @property {Boolean} [isFormData] Send body as formdata
 */

/**
 * Cattr API SDK
 */
class Cattr {

  /**
   * Creates Cattr API instance
   */
  constructor() {

    /**
     * Link to extended Error class
     * @type {ApiError}
     */
    this.ApiError = ApiError;

    /**
     * Link to extended Error class
     * @type {NetworkError}
     */
    this.NetworkError = NetworkError;

    /**
     * Link to extended Error class
     * @type {CredentialsError}
     */
    this.CredentialsError = CredentialsError;

    /**
     * Authentication providers
     * @type {Object<EntityProvider>}
     */
    this.providers = {

      credentials: null,
      token: null

    };

    /**
     * Axios instance
     * @type {Object}
     */
    this.axios = null;

    /**
     * Axios instance configuration
     */
    this.axiosConfiguration = new Proxy({}, {
      set: (obj, prop, value) => {

        obj[prop] = value;
        this.axios = axios.create(obj);
        return true;

      }
    });

    // API modules
    this.authentication = Authentication(this);
    this.projects = new Projects(this);
    this.tasks = new Tasks(this);
    this.time = new Time(this);
    this.screenshots = new Screenshots(this);
    this.intervals = new Intervals(this);
    this.company = new Company(this);

  }

  /**
   * Sets credential provider
   * @param {EntityProvider} provider Credentials provider
   */
  set credentialsProvider(provider) {

    if (typeof provider !== 'object' || typeof provider.get !== 'function' || typeof provider.set !== 'function')
      throw new TypeError('Incorrect credentials provider given');

    this.providers.credentials = provider;

  }

  /**
   * Sets token provider
   * @param {EntityProvider} provider Token provider
   */
  set tokenProvider(provider) {

    if (typeof provider !== 'object' || typeof provider.get !== 'function' || typeof provider.set !== 'function')
      throw new TypeError('Incorrect token provider given');

    this.providers.token = provider;

  }

  /**
   * Returns base URL
   * @returns {String} Base URL
   */
  get baseUrl() {

    return this.axiosConfiguration.baseURL;

  }

  /**
   * Sets base API URL
   * @param {String} url Entrypoint
   * @param {Boolean} [force=false] Set URL forcefully without pinging the remote
   * @returns {Boolean} Is supplied URL successfully applied?
   */
  async setBaseUrl(urlString, force = false) {

    // Perform execution safely
    try {

      /**
       * Verifies status url on a provded base URL
       * @async
       * @param {String} baseUrl Full base URL to be used
       * @returns {Boolean} Is status endpoint verified or not
       */
      const checkStatusUrl = async baseUrl => {

        try {

          const res = await axios.get(`${baseUrl}status`, { timeout: 5000 });
          return (typeof res.data === 'object' && res.data.data.cattr);

        } catch (err) {

          return false;

        }

      };

      // Falling back protocol to HTTPS if it is not strictly defined
      if (urlString.indexOf('://') === -1)
        urlString = `https://${urlString}`;

      // Parse URL
      const url = new URL(urlString);

      // Trying to get URL/status endpoint first
      if (force || await checkStatusUrl(url.href)) {

        this.axiosConfiguration.baseURL = url.href;
        return true;

      }

      // Trying to read URL from the manifest file
      try {

        // Request a manifest file
        const manifest = await axios.get(`${url.href}cattr.manifest`);

        // Ignore manifest unless it has a usable backend_path definition
        if (typeof manifest.data === 'object' && manifest.data.backend_path) {

          // Check supplied backend path
          if (await checkStatusUrl(manifest.data.backend_path)) {

            this.axiosConfiguration.baseURL = manifest.data.backend_path;
            return true;

          }

        }

      } catch (err) {

        // Ignore manifest request, and move forward to /api

      }

      // Trying again with the /api suffix
      if (await checkStatusUrl(`${url.href}api/`)) {

        url.pathname += 'api';
        this.axiosConfiguration.baseURL = url.href;
        return true;

      }

      // Failed to autofix URL
      return false;

    } catch (err) {

      // Just return false in case of error
      return false;

    }

  }

  /**
   * Attempt to fetch new token using saved credentials
   * @async
   * @returns {Boolean} Status (relogined or not)
   */
  async reloginAutomatically() {

    if (
      !this.providers.credentials ||
      typeof this.providers.credentials !== 'object' ||
      typeof this.providers.credentials.get !== 'function'
    )
      return false;

    const credentials = await this.providers.credentials.get();

    if (!credentials)
      return false;

    try {

      const authRes = await this.authentication.login(credentials.email, credentials.password);
      await this.providers.token.set(authRes.token.token, authRes.token.tokenType, authRes.token.tokenExpire);
      return true;

    } catch (err) {

      return false;

    }

  }

  /**
   * Pinging backend application
   * @async
   * @returns {Promise<Boolean>} Is application available?
   */
  async ping() {

    return this.isCattrInstance();

  }

  /**
   * Checks is this a Cattr instance
   * @async
   * @returns {Promise<Boolean>} True if Cattr detected
   */
  async isCattrInstance() {

    const res = await this.get('/status', { noAuth: true });
    return res.success && (res.response.data.amazingtime || res.response.data.cattr);

  }

  /**
   * Perform GET request
   * @param {String}         url  Endpoint location relative to baseURL
   * @param {RequestOptions} opts Additional options for this request
   */
  async get(url, opts) {

    if (typeof url !== 'string')
      throw new TypeError(`URL parameter must be a string, but ${typeof url} given`);

    const headers = {};

    if (opts && typeof opts.headers === 'object')
      Object.assign(headers, opts.headers);

    if (!opts || !opts.noAuth) {

      const token = await this.providers.token.get();

      // Renewing token if it isn't available in provider
      if (!token) {

        if (opts && opts.noRelogin) {

          return {
            success: false,
            isNetworkError: false,
            error: new this.CredentialsError(401, 'authorization.unauthorized', 'Token provider returned nothing, but relogin is disabled')
          };

        }

        if (!await this.reloginAutomatically()) {

          return {
            success: false,
            isNetworkError: false,
            error: new this.CredentialsError(401, 'authorization.unauthorized', 'Token proivder returned nothing, and relogin is failed')
          };

        }

      }

      headers.Authorization = `Bearer ${(await this.providers.token.get()).token}`;

    }

    if (opts && opts.noPaginate === true)
      headers['X-Paginate'] = 'false';

    // Making request
    try {

      const res = await this.axios({ method: 'get', url, headers });
      return { success: true, response: res.data };

    } catch (err) {

      // Pass error if autentication disabled
      if (opts && opts.noAuth)
        return { success: false, isNetworkError: err.response ? !Number.isNaN(err.response.status) : true, error: err };

      // Catch network error
      if (!err.response)
        return { success: false, isNetworkError: true, error: err };

      // Pass error if it isn't related to the authentication token
      if (
        err.response.status !== 401 ||
        (err.response.data.error_type !== 'authorization.unauthorized' && err.response.data.error_type !== 'authorization.token_expired')
      )
        return { success: false, isNetworkError: false, error: err };

      // Pass error if automatical relogin is disabled
      if (opts && opts.noRelogin)
        return { success: false, isNetworkError: false, error: err };

      // Try to relogin automatically, pass error if failed
      if (!await this.reloginAutomatically())
        return { success: false, isNetworkError: false, error: err };

      // Say hi to recursion!
      return this.get(url, Object.assign(opts || {}, { noRelogin: true }));

    }

  }

  /**
   * Perform POST request
   * @param {String}         url  Endpoint location relative to baseURL
   * @param {Object}         body Object / Formdata to be sent
   * @param {RequestOptions} opts Additional options for this request
   */
  async post(url, body, opts) {

    if (typeof url !== 'string')
      throw new TypeError(`URL parameter must be a string, but ${typeof url} given`);

    if (typeof body !== 'object')
      throw new TypeError(`Body must be an object (for JSON or FormData), but ${typeof body} given`);

    const headers = {};

    if (opts && typeof opts.headers === 'object')
      Object.assign(headers, opts.headers);

    if (opts && opts.isFormData === true)
      headers['Content-type'] = 'multipart/form-data';

    if (opts && opts.noPaginate === true)
      headers['X-Paginate'] = 'false';

    headers['X-Requested-With'] = `Cattr-Node/v${process.env.npm_package_version}`;

    if (opts && opts.method && [ 'post', 'put', 'patch' ].indexOf(opts.method) === -1)
      throw new TypeError(`Unsupported request method: ${opts.method}`);

    if (!opts || !opts.noAuth) {

      const token = await this.providers.token.get();

      // Renewing token if it isn't available in provider
      if (!token) {

        if (opts && opts.noRelogin) {

          return {
            success: false,
            isNetworkError: false,
            error: new this.CredentialsError(401, 'authorization.unauthorized', 'Token provider returned nothing, but relogin is disabled')
          };

        }

        if (!await this.reloginAutomatically()) {

          return {
            success: false,
            isNetworkError: false,
            error: new this.CredentialsError(401, 'authorization.unauthorized', 'Token provider returned nothing, and relogin is failed')
          };

        }

      }

      headers.Authorization = `Bearer ${(await this.providers.token.get()).token}`;

    }

    // Making request
    try {

      const res = await this.axios({
        url,
        headers,
        data: body,
        method: (opts && opts.method) ? opts.method : 'post',
      });

      return {
        success: true,
        response: res.data,
      };

    } catch (err) {

      // Pass error if autentication disabled
      if (opts && opts.noAuth)
        return { success: false, isNetworkError: err.response ? !Number.isNaN(err.response.status) : true, error: err };

      // Return networking error
      if (!err.response)
        return { success: false, isNetworkError: true, error: err };

      // Pass error if it isn't related to the authentication token
      if (
        err.response.status !== 401 ||
        (err.response.data.error_type !== 'authorization.unauthorized' && err.response.data.error_type !== 'authorization.token_expired')
      )
        return { success: false, isNetworkError: false, error: err };

      // Pass error if automatical relogin is disabled
      if (opts && opts.noRelogin)
        return { success: false, isNetworkError: false, error: err };

      // Try to relogin automatically, pass error if failed
      if (!await this.reloginAutomatically())
        return { success: false, isNetworkError: false, error: err };

      // Say hi to recursion!
      return this.post(url, body, Object.assign(opts || {}, { noRelogin: true }));

    }

  }

  /**
   * Perform PATCH request
   * @param {String}         url  Endpoint location relative to baseURL
   * @param {Object}         body Object / Formdata to be sent
   * @param {RequestOptions} opts Additional options for this request
   */
  async patch(url, body, opts) {

    return this.post(url, body, { method: 'patch', ...opts });

  }

  /**
   * Perform PUT request
   * @param {String}         url  Endpoint location relative to baseURL
   * @param {Object}         body Object / Formdata to be sent
   * @param {RequestOptions} opts Additional options for this request
   */
  async put(url, body, opts) {

    return this.post(url, body, { method: 'put', ...opts });

  }

}

module.exports = Cattr;
