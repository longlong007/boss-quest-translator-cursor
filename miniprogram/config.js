/** 云环境 ID，须为完整 ID，形如 cloud1-9gxxxxxxxx（在云开发控制台 → 设置 中复制） */
module.exports = {
  cloudEnv: 'cloud1-0gxm09652ddd3d4c',
  maxInputLength: 500,
  translateCooldownMs: 3000
}

/** 完整环境 ID 通常含 cloud 前缀与短横线，长度大于 10 */
function isValidCloudEnv(env) {
  return typeof env === 'string' && env.length > 10 && env.includes('-')
}

module.exports.isValidCloudEnv = isValidCloudEnv
