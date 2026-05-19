const MODE_LABELS = {
  serious: '正经版',
  fun: '娱乐版'
}

function buildCopyText(text, mode, sections, raw) {
  const lines = [`【老板原话】${text}`, `【${MODE_LABELS[mode]}】`, '']

  if (mode === 'serious') {
    if (sections.intent) lines.push(`真实意图：${sections.intent}`)
    if (sections.priority) lines.push(`隐含优先级：${sections.priority}`)
    if (sections.risks) lines.push(`风险点：${sections.risks}`)
    if (sections.suggestion) lines.push(`建议回应：${sections.suggestion}`)
  } else {
    if (sections.humanTalk) lines.push(`翻译版人话：${sections.humanTalk}`)
    if (sections.innerOS) lines.push(`内心 OS：${sections.innerOS}`)
    if (sections.survivalTip) lines.push(`生存建议：${sections.survivalTip}`)
  }

  if (lines.length <= 3 && raw) {
    lines.push(raw)
  }

  return lines.join('\n')
}

function hasStructuredSections(sections, mode) {
  if (mode === 'serious') {
    return !!(sections.intent || sections.priority || sections.risks || sections.suggestion)
  }
  return !!(sections.humanTalk || sections.innerOS || sections.survivalTip)
}

Page({
  data: {
    ready: false,
    text: '',
    mode: 'serious',
    modeLabel: '',
    sections: {},
    raw: '',
    showRaw: false,
    copyText: ''
  },

  onLoad() {
    const parsed = wx.getStorageSync('translate_result')
    if (!parsed || !parsed.text) {
      wx.showToast({ title: '数据异常', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    try {
      const { text, mode, data } = parsed
      const sections = data.sections || {}
      const raw = data.raw || ''
      const showRaw = !hasStructuredSections(sections, mode) && !!raw

      this.setData({
        ready: true,
        text,
        mode,
        modeLabel: MODE_LABELS[mode] || '翻译',
        sections,
        raw,
        showRaw,
        copyText: buildCopyText(text, mode, sections, raw)
      })
    } catch (e) {
      console.error('parse result payload', e)
      getApp().showError('结果解析失败')
      setTimeout(() => wx.navigateBack(), 1500)
    }
  },

  onCopy() {
    wx.setClipboardData({
      data: this.data.copyText,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' })
      }
    })
  },

  onAgain() {
    const { text, mode } = this.data
    wx.redirectTo({
      url: `/pages/index/index?text=${encodeURIComponent(text)}&mode=${mode}`
    })
  },

  onShareAppMessage() {
    const { mode, modeLabel, text } = this.data
    const preview =
      text.length > 20 ? `${text.slice(0, 20)}…` : text
    return {
      title: `老板说：「${preview}」— ${modeLabel}翻译来了`,
      path: '/pages/index/index'
    }
  }
})
