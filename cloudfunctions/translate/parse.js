/**
 * 解析模型返回的 JSON，并映射为前端 sections
 */
function extractJsonString(raw) {
  let text = raw.trim()
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenceMatch) {
    text = fenceMatch[1].trim()
  }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1)
  }
  return text
}

function parseModelResponse(raw, mode) {
  const result = {
    sections: {},
    raw
  }

  try {
    const jsonText = extractJsonString(raw)
    const parsed = JSON.parse(jsonText)

    if (mode === 'fun') {
      result.sections = {
        humanTalk: pickField(parsed, ['humanTalk', 'human_talk', '翻译版人话']),
        innerOS: pickField(parsed, ['innerOS', 'inner_os', '内心OS', '内心os']),
        survivalTip: pickField(parsed, ['survivalTip', 'survival_tip', '生存建议'])
      }
    } else {
      result.sections = {
        intent: pickField(parsed, ['intent', '真实意图']),
        priority: pickField(parsed, ['priority', '隐含优先级']),
        risks: pickField(parsed, ['risks', '风险点']),
        suggestion: pickField(parsed, ['suggestion', '建议回应'])
      }
    }
  } catch (e) {
    console.warn('JSON parse failed, using raw', e.message)
  }

  return result
}

function pickField(obj, keys) {
  for (const key of keys) {
    const val = obj[key]
    if (val !== undefined && val !== null && String(val).trim()) {
      return String(val).trim()
    }
  }
  return ''
}

module.exports = {
  parseModelResponse
}
