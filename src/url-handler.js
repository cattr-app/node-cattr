const axios = require('axios');

/**
 * Checks the base API URL
 * @param {String} testUrl Entrypoint (the service's simple address)
 * @returns {String} Final entrypoint URL
 */
const checkUrl = async (testUrl) => {

  const headers = { noAuth: true };
  
  if (await checkInstance(`${testUrl}/api/status`))
    return `${testUrl}/api/`;
  
  const manifestUrl = `${testUrl}/cattr.manifest`;
  const res = await axios({ method: 'get', manifestUrl, headers });
  const backendUrl = res.response.data.backend_path;
  
  if (backendUrl) {

    if (await this.checkInstance(backendUrl))
      return backendUrl;
 
  }
  
  return null;

}

const checkInstance = async (url) => {
    
  const headers = { noAuth: true };

  const res = await axios({ method: 'get', url, headers });

  if (res.success && (res.response.data.amazingtime || res.response.data.cattr))
    return true;

  return false;

}

module.exports = {
    checkUrl
}
