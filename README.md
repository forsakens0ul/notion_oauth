# Notion OAuth 代理服务

这个项目提供了用于 Notion OAuth 授权流程的代理服务，主要用于 Chrome 扩展程序与 Notion API 的集成。

## 功能

1. **OAuth 授权回调** - 处理 Notion 授权后的回调
2. **令牌交换 API** - 安全地交换授权码获取访问令牌
3. **成功页面** - 显示授权成功并将令牌发送回扩展程序

## 部署步骤

### 1. 准备工作

确保你有以下信息：

- Notion 集成的客户端 ID
- Notion 集成的客户端密钥
- 注册在 Notion 开发者平台上的重定向 URI (通常是`https://你的域名/api/notion/callback`)

### 2. 设置环境变量

创建`.env`文件：

```
NOTION_CLIENT_ID=你的客户端ID
NOTION_CLIENT_SECRET=你的客户端密钥
NOTION_REDIRECT_URI=https://你的域名/api/notion/callback
```

### 3. 部署到 Vercel

最简单的部署方式是使用 Vercel：

```bash
npm i -g vercel
vercel
```

或者直接连接 GitHub 仓库到 Vercel 进行自动部署。

### 4. 更新 Notion 集成设置

在[Notion 开发者平台](https://www.notion.so/my-integrations)中：

1. 选择你的集成
2. 更新重定向 URI 为`https://你的域名/api/notion/callback`
3. 确保已启用正确的权限范围

### 5. 更新 Chrome 扩展

在 Chrome 扩展中：

1. 修改授权 URL 为`https://api.notion.com/v1/oauth/authorize?owner=user&client_id=你的客户端ID&redirect_uri=你的重定向URI&response_type=code`
2. 修改令牌交换端点为`https://你的域名/api/notion/exchange`

## API 端点

### `/api/notion/callback`

处理 Notion 授权后的回调，交换临时授权码获取访问令牌。

### `/api/notion/exchange`

接收客户端提供的授权码、客户端 ID 和密钥，与 Notion API 交换获取访问令牌。



1. 客户端密钥应保密，不应暴露在前端代码中
2. 在生产环境中，建议使用更安全的方式处理令牌
3. 确保重定向 URI 在所有地方保持一致
