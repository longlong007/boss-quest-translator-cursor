const cloud = require('wx-server-sdk')
const { buildUserMessage, getPromptConfig } = require('./prompts')
const { validateInput, checkSensitive, checkRateLimit } = require('./safety')
const { callChatCompletion } = require('./llm')
const { parseModelResponse } = require('./parse')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event) => {
  const mode = event.mode === 'fun' ? 'fun' : 'serious'

  const inputCheck = validateInput(event.text)
  if (!inputCheck.ok) {
    return fail(inputCheck.code, inputCheck.message)
  }

  const text = inputCheck.text

  const sensitiveCheck = checkSensitive(text)
  if (!sensitiveCheck.ok) {
    return fail(sensitiveCheck.code, sensitiveCheck.message)
  }

  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  if (!openid) {
    return fail('NO_OPENID', '无法识别用户，请重新打开小程序')
  }

  const rateCheck = await checkRateLimit(db, openid)
  if (!rateCheck.ok) {
    return fail(rateCheck.code, rateCheck.message)
  }

  const promptConfig = getPromptConfig(mode)
  const userMessage = buildUserMessage(text)

  try {
    const rawContent = await callChatCompletion({
      system: promptConfig.system,
      userMessage,
      temperature: promptConfig.temperature
    })

    const parsed = parseModelResponse(rawContent, mode)

    return {
      success: true,
      data: {
        mode,
        sections: parsed.sections,
        raw: rawContent
      }
    }
  } catch (err) {
    console.error('translate failed', err)
    return fail('LLM_ERROR', err.message || '翻译服务暂时不可用，请稍后重试')
  }
}

function fail(code, message) {
  return {
    success: false,
    code,
    message
  }
}
