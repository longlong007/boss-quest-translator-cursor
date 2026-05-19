const { cloudEnv, isValidCloudEnv } = require('../config')

/** 云函数含 LLM 调用；客户端默认约 20s，此处设为 60s（基础库 ≥ 2.10） */
const CALL_FUNCTION_TIMEOUT = 60000

function callTranslate(data) {
  return wx.cloud.callFunction({
    name: 'translate',
    data,
    config: {
      env: cloudEnv,
      timeout: CALL_FUNCTION_TIMEOUT
    }
  })
}

/**
 * 连通性检测：应在 3 秒内返回，用于区分「云环境/部署问题」与「LLM 慢」
 */
function pingCloud() {
  if (!isValidCloudEnv(cloudEnv)) {
    return Promise.reject(new Error('INVALID_CLOUD_ENV'))
  }
  return callTranslate({ action: 'ping' }).then((res) => res.result || {})
}

/**
 * @param {string} text
 * @param {'serious'|'fun'} mode
 */
function translate(text, mode) {
  if (!isValidCloudEnv(cloudEnv)) {
    return Promise.reject(new Error('INVALID_CLOUD_ENV'))
  }
  return callTranslate({ text, mode }).then((res) => res.result || {})
}

module.exports = {
  translate,
  pingCloud,
  isValidCloudEnv
}
