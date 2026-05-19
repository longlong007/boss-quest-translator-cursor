const { cloudEnv } = require('./config')

App({
  globalData: {
    cloudEnv
  },

  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }
    wx.cloud.init({
      env: cloudEnv,
      traceUser: true
    })
  },

  showError(title, duration = 2500) {
    wx.showToast({
      title: title || '出错了，请稍后重试',
      icon: 'none',
      duration
    })
  }
})
