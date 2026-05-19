/**
 * 调用 translate 云函数
 * @param {string} text
 * @param {'serious'|'fun'} mode
 * @returns {Promise<{success: boolean, data?: object, code?: string, message?: string}>}
 */
/** 云函数含 LLM 调用，需大于默认 20s，最大 60000ms */
const CALL_FUNCTION_TIMEOUT = 60000

function translate(text, mode) {
  return new Promise((resolve, reject) => {
    wx.cloud
      .callFunction({
        name: 'translate',
        data: { text, mode },
        config: {
          timeout: CALL_FUNCTION_TIMEOUT
        }
      })
      .then((res) => {
        const result = res.result || {}
        resolve(result)
      })
      .catch((err) => {
        reject(err)
      })
  })
}

module.exports = {
  translate
}
