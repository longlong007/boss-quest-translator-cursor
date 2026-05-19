const { cloudEnv, isValidCloudEnv } = require('./config')

App({
  globalData: {
    cloudEnv
  },

  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }
    if (!isValidCloudEnv(cloudEnv)) {
      console.error(
        '[老板需求翻译器] cloudEnv 无效，请在 miniprogram/config.js 填入完整云环境 ID（如 cloud1-9gxxxx）'
      )
      wx.showModal({
        title: '云环境未配置',
        content:
          '请在 miniprogram/config.js 中将 cloudEnv 改为云开发控制台里的完整环境 ID（形如 cloud1-9gxxxxxxxx），并重新编译。',
        showCancel: false
      })
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
