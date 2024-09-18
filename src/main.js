//@ts-check

var lang = require('./lang.js');
var HttpErrorCodes = require("./const.js").HttpErrorCodes;
var {
    getApiKey,
    buildHeader,
    ensureHttpsAndNoTrailingSlash
} = require("./utils.js");

function supportLanguages() {
    return lang.supportLanguages.map(([standardLang]) => standardLang);
}

/**
 *
 * @param {Bob.TTSQuery} query
 * @param {Bob.Completion} completion
 * @returns {void}
 */
function tts(query, completion) {
    if (!lang.langMap.get(query.lang)) {
        completion(
            {
                error: {
                    type: 'unsupportLanguage',
                    message: 'unsupport language',
                }
            }
        );
        return;
    }


    const {
        apiKeys,
        apiUrl,
        apiVersion,
        deploymentName,
        model,
        voice,
        speed
    } = $option;

    if (!apiKeys) {
        completion(
            {
                error: {
                    type: 'secretKey',
                    message: '配置错误 - 请确保您在插件配置中填入了正确的 API Keys'
                }
            }
        );
        return;
    }

    const apiKey = getApiKey(apiKeys);
    const baseUrl = ensureHttpsAndNoTrailingSlash(apiUrl || "https://api.openai.com");
    let apiUrlPath = baseUrl.includes("gateway.ai.cloudflare.com") ? "/audio/speech" : "/v1/audio/speech";
    const apiVersionQuery = apiVersion ? `?api-version=${apiVersion}` : "?api-version=2023-03-15-preview";
    const isAzureServiceProvider = baseUrl.includes("openai.azure.com");
    if (isAzureServiceProvider) {
        if (deploymentName) {
            apiUrlPath = `/openai/deployments/${deploymentName}/chat/completions${apiVersionQuery}`;
        } else {
            completion(
                {
                    error: {
                        type: 'secretKey',
                        message: '配置错误 - 未填写 Deployment Name'
                    }
                }
            );
            return;
        }
    }

    const header = buildHeader(isAzureServiceProvider, apiKey);

    if (!parseFloat(speed) || parseFloat(speed) < 0.25 || parseFloat(speed) > 4.0) {
        completion(
            {
                error: {
                    type: 'param',
                    message: '语速参数错误 - 请输入一个有效的数字'
                }
            }
        )
        return;
    }

    const body = {
        model: model || "tts-1",
        input: query.text,
        voice: voice || "alloy",
        speed: parseFloat(speed) || 1.0
    };

    (async () => {
        const response = await $http.request(
            {
                method: "POST",
                url: baseUrl + apiUrlPath,
                header: header,
                body: body,
            }
        );

        if (response.error) {
            const { statusCode } = response.response;
            const reason = (statusCode >= 400 && statusCode < 500) ? "param" : "api";
            completion(
                {
                    error: {
                        type: reason,
                        message: `接口响应错误 - ${HttpErrorCodes[statusCode]}`,
                        addition: `${JSON.stringify(response)}`,
                    },
                }
            )
        } else {
            completion(
                {
                    result: {
                        type: "base64",
                        value: response.rawData.toBase64()
                    }
                }
            )
        }
    })().catch((err) => {
        if ('response' in err) {
            const { statusCode } = err.response;
            const reason = (statusCode >= 400 && statusCode < 500) ? "param" : "api";
            completion(
                {
                    error: {
                        type: reason,
                        message: `接口响应错误 - ${HttpErrorCodes[statusCode]}`,
                        addition: `${JSON.stringify(err)}`,
                    },
                }
            )
        } else {
            completion(
                {
                    error: {
                        ...err,
                        type: err.type || "unknown",
                        message: err.message || "Unknown error",
                    },
                }
            )
        }
    });
}

function pluginTimeoutInterval() {
    return parseInt($option.timeout) || 60;
}

exports.supportLanguages = supportLanguages;
exports.tts = tts;
