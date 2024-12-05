/**
 * Token entity
 * @typedef  {Object} TokenEntity
 * @property {String} token       Access token
 * @property {String} tokenType   Access token type
 * @property {Date}   tokenExpire Access token expiration date
 */

/**
 * User entity
 * @typedef  {Object} UserEntity
 * @property {Number} id ID
 * @property {String} fullName Full name
 * @property {String} email Email
 * @property {String|null} avatar Profile picture URL
 * @property {Boolean} screenshotsEnabled Is screenshot capture enabled?
 * @property {Boolean} manualTimeEnabled Is manual time available?
 * @property {Number} inactivityTimeout Inactivity detection period in seconds
 * @property {Number} screenshotsInterval Maximum interval between screenshot capture
 * @property {Boolean} isActive Is this user active?
 * @property {Boolean} isAdmin  Is this user have administration privileges?
 * @property {Boolean} important Is this user marked as important?
 * @property {Boolean} forcePasswordReset Is this user enforced to change their password?
 * @property {String} timezone User's timezone (like 'Europe/Moscow')
 * @property {RoleEntity} role Default role
 * @property {Array<ProjectRole>} projectsRoles Project-specific roles
 * @property {Date} createdAt Date of creation
 * @property {Date} updatedAt Last update timestamp
 * @property {Date|null} deletedAt Date of removal
 */

/**
 * Authentication data response
 * @typedef  {Object} UserLoginDTO
 * @property {TokenEntity} token Access token
 * @property {UserEntity}  user  User properties
 */

/**
 * Authentication operations
 */
module.exports = $ => {

  const ops = {};

  /**
   * Format UserEntity
   * @param {Object} user Raw object representing user
   * @returns {UserEntity}
   */
  const userFormatter = user => {

    const formattedOut = {

      id: Number(user.id),
      fullName: String(user.full_name),
      email: String(user.email),
      avatar: user.avatar ? String(user.avatar) : null,
      manualTimeEnabled: Boolean(user.manual_time),
      inactivityTimeout: Number(user.computer_time_popup),
      screenshotsEnabled: Boolean(user.screenshots_active),
      screenshotsInterval: Number(user.screenshots_interval),
      appMonitoringEnabled: Boolean(user.web_and_app_monitoring),
      isActive: Boolean(user.active),
      isAdmin: Boolean(user.is_admin),
      isImportant: Boolean(user.important),
      forcePasswordReset: Boolean(user.change_password),
      timezone: String(user.timezone),
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at),
      deletedAt: user.deleted_at ? new Date(user.deleted_at) : null,
    };

    return formattedOut;

  };

  /**
   * Perform login
   * @async
   * @param {String} email Email
   * @param {String} password Password
   * @returns {Promise<UserLoginDTO>} User's properties with token data if succeed
   */
  ops.login = async (email, password) => {

    if (typeof email !== 'string' || email.length === 0)
      throw new TypeError('Incorrect email parameter given');

    if (typeof password !== 'string' || password.length === 0)
      throw new TypeError('Incorrect password parameter given');

    const res = await $.post('auth/login', { email, password }, { noAuth: true });
    if (!res.success) {

      if (res.isNetworkError)
        throw new $.NetworkError(res);

      if (res.error && res.error instanceof $.ApiError)
        throw res.error;

      throw new $.ApiError(res);

    }

    // Double-check that response is successfull
    /* if (res.response.data.success !== true)
      throw new $.ApiError(0, 'unexpected_structure', `${JSON.stringify(res.response.data)}`); */

    return {
      token: {
        token: res.response.data.access_token,
        tokenType: res.response.data.token_type,
        tokenExpire: new Date(res.response.data.expires_in),
      },
      user: userFormatter(res.response.data.user)
    };

  };

  /**
   * Get user properties
   * @async
   * @returns {Promise<Object>} User's properties
   */
  ops.me = async () => {

    const res = await $.get('auth/me', {});
    if (!res.success) {

      if (res.isNetworkError)
        throw new $.NetworkError(res);

      if (res.error && res.error instanceof $.ApiError)
        throw res.error;

      throw new $.ApiError(res);

    }

    /* if (!res.response.data.success || typeof res.response.data.user !== 'object')
      throw new $.ApiError(0, 'unexpected_structure', 'Incorrect response structure');  */

    return userFormatter(res.response.data);

  };

  /**
   * Logout
   * @async
   * @param {Boolean} [fromAll=false] Logout from all
   * @returns {Promise<Boolean>} Returns true if succeed
   */
  ops.logout = async (fromAll = false) => {

    const endpoint = (fromAll === true) ? 'auth/logout-from-all' : 'auth/logout';
    const res = await $.post(endpoint, {}, { noRelogin: true });
    if (!res.success) {

      if (res.isNetworkError)
        throw new $.NetworkError(res);

      if (res.error && res.error instanceof $.ApiError)
        throw res.error;

      throw new $.ApiError(res);

    }

    return true;

  };

  /**
   * Refresh token
   * @async
   * @param {Boolean} [relogin=false] Should we try to relogin on failure
   * @returns {Promise<TokenDTO>} New token
   */
  ops.refresh = async (relogin = false) => {

    const res = await $.post('auth/refresh', {}, { noRelogin: !relogin });
    if (!res.success) {

      if (res.isNetworkError)
        throw new $.NetworkError(res);

      if (res.error && res.error instanceof $.ApiError)
        throw res.error;

      throw new $.ApiError(res);

    }

    if (
      typeof res.response.data.access_token !== 'string' ||
      typeof res.response.data.token_type !== 'string' ||
      typeof res.response.data.expires_in !== 'string'
    )
      throw new $.ApiError(0, 'unexpected_structure', 'Incorrect response structure');

    return {
      token: res.response.data.access_token,
      tokenType: res.response.data.token_type,
      tokenExpire: new Date(res.response.data.expires_in),
    };

  };

  /**
   * Obtains a redirection URL for a "app to web" single-click authentication
   * @async
   * @returns {Promise.<Error|String>} Redirection URL if succeed, error otherwise
   */
  ops.getSingleClickRedirection = async () => {

    const res = await $.get('auth/desktop-key', {});

    if (!res.success) {

      if (res.isNetworkError)
        throw new $.NetworkError(res);

      if (res.error && res.error instanceof $.ApiError)
        throw res.error;

      throw new $.ApiError(res);

    }

    // Extract token properties
    const { access_token: token, token_type: type } = res.response.data;
    const { frontend_uri: origin } = res.response;

    // Verify token type
    if (type !== 'desktop')
      throw new Error(`Unexpected token type for a single-click auth: ${type}`);

    // Allow only relatively secure (to be opened in shell) protocols (http, https)
    const originParsed = new URL(origin);
    if (![ 'http:', 'https:' ].includes(originParsed.protocol))
      throw new Error(`Rejecting received SSO redirection URL due to restricted protocol: ${originParsed.protocol}`);

    // Return redirection URL
    return `${origin}/auth/desktop/login?token=${token}`;

  };

  /**
   * Authenticates in backend by SSO token
   * @async
   * @param {String} token Desktop-token, issued by core application
   * @returns {Promise.<UserLoginDTO>}
   */
  ops.authenticateViaSSO = async token => {

    if (typeof token !== 'string' || token.length === 0)
      throw new TypeError('Incorrect token parameter given');

    const res = await $.put('auth/desktop-key', {}, {
      noAuth: true,
      headers: { Authorization: `desktop ${token}` }
    });

    if (!res.success) {

      if (res.isNetworkError)
        throw new $.NetworkError(res);

      if (res.error && res.error instanceof $.ApiError)
        throw res.error;

      throw new $.ApiError(res);

    }

    return {
      token: {
        token: res.response.data.access_token,
        tokenType: res.response.data.token_type,
        tokenExpire: new Date(res.response.data.expires_in),
      },
      user: userFormatter(res.response.data.user)
    };

  };

  return ops;

};
