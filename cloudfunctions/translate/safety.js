const MAX_TEXT_LENGTH = 500
const RATE_LIMIT_WINDOW_MS = 60 * 1000
const RATE_LIMIT_MAX = 5

/** 基础敏感词（可扩展） */
const SENSITIVE_WORDS = [
  '习近平',
  '共产党',
  '六四',
  '法轮功',
  '台独',
  '藏独',
  '疆独',
  '色情',
  '裸体',
  '强奸'
]

function validateInput(text) {
  if (!text || typeof text !== 'string') {
    return { ok: false, code: 'EMPTY_TEXT', message: '请输入老板说的话' }
  }
  const trimmed = text.trim()
  if (!trimmed) {
    return { ok: false, code: 'EMPTY_TEXT', message: '请输入老板说的话' }
  }
  if (trimmed.length > MAX_TEXT_LENGTH) {
    return {
      ok: false,
      code: 'TEXT_TOO_LONG',
      message: `内容不能超过 ${MAX_TEXT_LENGTH} 字`
    }
  }
  return { ok: true, text: trimmed }
}

function checkSensitive(text) {
  const lower = text.toLowerCase()
  for (const word of SENSITIVE_WORDS) {
    if (text.includes(word) || lower.includes(word.toLowerCase())) {
      return {
        ok: false,
        code: 'SENSITIVE_CONTENT',
        message: '内容包含不适宜词汇，请修改后重试'
      }
    }
  }
  return { ok: true }
}

/**
 * 基于云数据库的频率限制
 * @param {object} db
 * @param {string} openid
 */
async function checkRateLimit(db, openid) {
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW_MS
  const coll = db.collection('rate_limit')

  try {
    const countResult = await coll
      .where({
        openid,
        createdAt: db.command.gte(windowStart)
      })
      .count()

    const count = countResult.total || 0
    if (count >= RATE_LIMIT_MAX) {
      return {
        ok: false,
        code: 'RATE_LIMIT',
        message: '操作太频繁啦，请稍后再试（每分钟最多 5 次）'
      }
    }

    await coll.add({
      data: {
        openid,
        createdAt: now
      }
    })

    return { ok: true }
  } catch (err) {
    // 集合未创建时降级：仅记录日志，不阻断（首次部署友好）
    console.warn('rate_limit check skipped', err.message)
    return { ok: true }
  }
}

module.exports = {
  MAX_TEXT_LENGTH,
  validateInput,
  checkSensitive,
  checkRateLimit
}
