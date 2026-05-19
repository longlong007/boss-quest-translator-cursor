const { translate } = require('../../utils/cloud')
const config = require('../../config')

Page({
  data: {
    mode: 'serious',
    inputText: '',
    loading: false,
    canSubmit: false,
    maxLength: config.maxInputLength
  },

  onLoad(options) {
    if (options.text) {
      this.setData({
        inputText: decodeURIComponent(options.text),
        canSubmit: options.text.trim().length > 0
      })
    }
    if (options.mode === 'fun' || options.mode === 'serious') {
      this.setData({ mode: options.mode })
    }
  },

  onModeChange(e) {
    const mode = e.detail.mode
    this.setData({ mode })
  },

  onInput(e) {
    const text = e.detail.value || ''
    this.setData({
      inputText: text,
      canSubmit: text.trim().length > 0
    })
  },

  async onTranslate() {
    const text = this.data.inputText.trim()
    if (!text) {
      getApp().showError('请输入老板说的话')
      return
    }
    if (text.length > config.maxInputLength) {
      getApp().showError(`内容不能超过 ${config.maxInputLength} 字`)
      return
    }

    this.setData({ loading: true })

    try {
      const result = await translate(text, this.data.mode)

      if (!result.success) {
        getApp().showError(result.message || '翻译失败')
        return
      }

      wx.setStorageSync('translate_result', {
        text,
        mode: this.data.mode,
        data: result.data
      })

      wx.navigateTo({
        url: '/pages/result/result'
      })
    } catch (err) {
      console.error('translate error', err)
      const msg = (err && (err.errMsg || err.message)) || ''
      if (/timeout/i.test(msg)) {
        getApp().showError('翻译超时，请检查云函数已部署且 API 可访问')
      } else {
        getApp().showError('网络异常，请稍后重试')
      }
    } finally {
      setTimeout(() => {
        this.setData({ loading: false })
      }, config.translateCooldownMs)
    }
  }
})
