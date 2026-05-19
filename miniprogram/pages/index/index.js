const { translate, isValidCloudEnv } = require('../../utils/cloud')
const config = require('../../config')
const examples = require('../../data/examples')

Page({
  data: {
    mode: 'serious',
    inputText: '',
    loading: false,
    canSubmit: false,
    maxLength: config.maxInputLength,
    examples
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

  onExampleTap(e) {
    const { text } = e.currentTarget.dataset
    if (!text) return
    this.setData({
      inputText: text,
      canSubmit: true
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

    if (!isValidCloudEnv(config.cloudEnv)) {
      getApp().showError('请先在 config.js 配置完整云环境 ID')
      return
    }

    this.setData({ loading: true })
    wx.showLoading({ title: 'AI 翻译中…', mask: true })

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
      if (msg === 'INVALID_CLOUD_ENV') {
        getApp().showError('云环境 ID 未配置或格式错误')
      } else if (/timeout/i.test(msg)) {
        wx.showModal({
          title: '调用超时',
          content:
            '1. 确认 config.js 中 cloudEnv 为完整 ID（cloud1-xxx）\n2. 右键 translate 云函数 → 上传并部署\n3. 云函数环境变量已配置 LLM_API_KEY\n4. 在云开发控制台用「测试」直接调 translate 排查',
          showCancel: false
        })
      } else {
        getApp().showError('网络异常，请稍后重试')
      }
    } finally {
      wx.hideLoading()
      setTimeout(() => {
        this.setData({ loading: false })
      }, config.translateCooldownMs)
    }
  }
})
