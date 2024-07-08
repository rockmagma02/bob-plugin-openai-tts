/**
 * @param {string} apiKeys
 * @returns {string}
*/
function getApiKey(apiKeys) {
    const trimmedApiKeys = apiKeys.endsWith(",") ? apiKeys.slice(0, -1) : apiKeys;
    const apiKeySelection = trimmedApiKeys.split(",").map(key => key.trim());
    return apiKeySelection[Math.floor(Math.random() * apiKeySelection.length)];
}

/**
 * @param {string}  url
 * @returns {string}
*/
function ensureHttpsAndNoTrailingSlash(url) {
    const hasProtocol = /^[a-z]+:\/\//i.test(url);
    const modifiedUrl = hasProtocol ? url : 'https://' + url;

    return modifiedUrl.endsWith('/') ? modifiedUrl.slice(0, -1) : modifiedUrl;
}

/**
* @param {boolean} isAzureServiceProvider - Indicates if the service provider is Azure.
* @param {string} apiKey - The authentication API key.
* @returns {{
  *   "Content-Type": string;
  *   "api-key"?: string;
  *   "Authorization"?: string;
  * }} The header object.
  */
function buildHeader(isAzureServiceProvider, apiKey) {
    return {
        "Content-Type": "application/json",
        [isAzureServiceProvider ? "api-key" : "Authorization"]: isAzureServiceProvider ? apiKey : `Bearer ${apiKey}`
    };
}

exports.getApiKey = getApiKey;
exports.buildHeader = buildHeader;
exports.ensureHttpsAndNoTrailingSlash = ensureHttpsAndNoTrailingSlash;
