const https = require('https')
const { URL } = require('url')

function getEnvConfig() {
  return {
    apiKey: process.env.LLM_API_KEY || '',
    baseUrl: process.env.LLM_BASE_URL || 'https://api.deepseek.com',
    model: process.env.LLM_MODEL || 'deepseek-chat'
  }
}

function requestJson(url, options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (res.statusCode >= 400) {
            const msg =
              parsed.error?.message || parsed.message || `HTTP ${res.statusCode}`
            reject(new Error(msg))
          } else {
            resolve(parsed)
          }
        } catch (e) {
          reject(new Error(`响应解析失败: ${data.slice(0, 200)}`))
        }
      })
    })
    req.on('error', reject)
    req.setTimeout(20000, () => {
      req.destroy()
      reject(new Error('LLM_TIMEOUT'))
    })
    if (body) req.write(body)
    req.end()
  })
}

async function callChatCompletion({ system, userMessage, temperature }) {
  const { apiKey, baseUrl, model } = getEnvConfig()
  if (!apiKey) {
    throw new Error('未配置 LLM_API_KEY，请在云函数环境变量中设置')
  }

  const endpoint = new URL('/v1/chat/completions', baseUrl.replace(/\/$/, ''))
  const payload = JSON.stringify({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userMessage }
    ],
    temperature,
    max_tokens: 1024,
    response_format: { type: 'json_object' }
  })

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      Authorization: `Bearer ${apiKey}`
    }
  }

  try {
    const response = await requestJson(endpoint, options, payload)
    const content = response.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('模型返回为空')
    }
    return content.trim()
  } catch (err) {
    // 仅对瞬时网络错误重试一次，超时不再重试以免拖垮云函数
    const isTimeout = err.message === 'LLM_TIMEOUT'
    const isRetryable =
      !isTimeout &&
      (err.code === 'ECONNRESET' ||
        err.code === 'ETIMEDOUT' ||
        err.code === 'ENOTFOUND')

    if (isRetryable) {
      await new Promise((r) => setTimeout(r, 500))
      const response = await requestJson(endpoint, options, payload)
      const content = response.choices?.[0]?.message?.content
      if (!content) {
        throw new Error('模型返回为空')
      }
      return content.trim()
    }

    if (isTimeout) {
      throw new Error('大模型响应超时，请稍后重试')
    }
    throw err
  }
}

module.exports = {
  callChatCompletion,
  getEnvConfig
}
