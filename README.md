# 老板需求翻译器

微信小程序：输入老板的话，输出翻译后的真实意图。支持 **正经版**（专业拆解）与 **娱乐版**（幽默吐槽）。

## 技术栈

- 微信小程序原生
- 微信云开发（云函数 + 云数据库限流）
- 大模型 API（OpenAI 兼容，默认 DeepSeek）

## 目录结构

```
├── miniprogram/          # 小程序前端
├── cloudfunctions/
│   └── translate/        # 翻译云函数
├── project.config.json
└── README.md
```

## 快速开始

### 1. 注册小程序

1. 登录 [微信公众平台](https://mp.weixin.qq.com/) 注册小程序
2. 获取 **AppID**，在 `project.config.json` 中将 `appid` 改为你的 AppID（或使用 `project.private.config.json` 覆盖）

### 2. 开通云开发

1. 用 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) 打开本项目
2. 点击「云开发」→ 开通并创建环境
3. 复制环境 ID，填入 [`miniprogram/config.js`](miniprogram/config.js) 的 `cloudEnv`

```js
module.exports = {
  cloudEnv: 'cloud1-xxxx',  // 替换为你的环境 ID
  maxInputLength: 500,
  translateCooldownMs: 3000
}
```

### 3. 创建云数据库集合（限流）

在云开发控制台 → 数据库 → 新建集合：

| 集合名 | 说明 |
|--------|------|
| `rate_limit` | 字段：`openid`(string)、`createdAt`(number)；用于每分钟 5 次限流。权限建议：所有用户不可读写（仅云函数可写） |

> 若未创建集合，限流会降级跳过，不影响翻译功能。

### 4. 配置云函数环境变量

云开发控制台 → 云函数 → `translate` → 配置 → 环境变量：

| 变量名 | 示例值 | 说明 |
|--------|--------|------|
| `LLM_API_KEY` | `sk-xxx` | 大模型 API Key |
| `LLM_BASE_URL` | `https://api.deepseek.com` | API 根地址（勿末尾斜杠） |
| `LLM_MODEL` | `deepseek-chat` | 模型名称 |

**DeepSeek** 示例：`BASE_URL=https://api.deepseek.com`，`MODEL=deepseek-chat`

**通义千问** 示例：`BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1`，`MODEL=qwen-turbo`

### 5. 部署云函数

在微信开发者工具中：

1. 展开 `cloudfunctions/translate`
2. 右键 → **上传并部署：云端安装依赖**
3. 等待部署完成

### 6. 本地调试

1. 编译运行模拟器
2. 在首页输入老板原话，切换正经版/娱乐版，点击「开始翻译」
3. 真机预览需使用体验者账号

## 云函数接口

**名称**：`translate`

**入参**：

```json
{
  "text": "这个需求很简单，周末加一下",
  "mode": "serious"
}
```

`mode` 可选：`serious`（正经版）| `fun`（娱乐版）

**成功返回**：

```json
{
  "success": true,
  "data": {
    "mode": "serious",
    "sections": {
      "intent": "...",
      "priority": "...",
      "risks": "...",
      "suggestion": "..."
    },
    "raw": "..."
  }
}
```

**失败返回**：

```json
{
  "success": false,
  "code": "RATE_LIMIT",
  "message": "操作太频繁啦..."
}
```

## 发布体验版

1. 开发者工具 → 上传（填写版本号与备注）
2. 公众平台 → 版本管理 → 选为体验版
3. 成员管理中添加体验者

### 审核注意

- 服务类目选择 **工具** 类
- 配置 [用户隐私保护指引](https://developers.weixin.qq.com/miniprogram/dev/framework/user-privacy/)（会收集用户输入文本用于翻译）
- 娱乐版在审核说明中注明：内容为虚构幽默吐槽，无攻击性

## 成本参考

单次翻译约 500～1500 tokens，DeepSeek 级别约 0.001～0.01 元/次。云开发个人免费额度通常足够内测。

## 二期规划

- 翻译历史（云库存储）
- 分享海报（canvas）
- 多模型切换

## License

MIT
