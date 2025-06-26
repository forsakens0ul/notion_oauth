// /api/notion/exchange.js
export default async function handler(req, res) {
  // 设置CORS头，允许来自Chrome扩展的请求
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 处理OPTIONS请求（预检请求）
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 只允许POST请求
  if (req.method !== "POST") {
    return res.status(405).json({ error: "只支持POST请求" });
  }

  try {
    // 从请求体中获取必要参数
    const { code, redirect_uri, client_id, client_secret } = req.body;

    if (!code || !redirect_uri || !client_id || !client_secret) {
      return res.status(400).json({
        error: "缺少必要参数",
        required: ["code", "redirect_uri", "client_id", "client_secret"],
        received: Object.keys(req.body),
      });
    }

    console.log("收到令牌交换请求:", {
      code: code.substring(0, 10) + "...",
      redirect_uri,
      has_client_id: !!client_id,
      has_client_secret: !!client_secret,
    });

    // 发送请求到Notion API交换令牌
    const response = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(
          `${client_id}:${client_secret}`
        ).toString("base64")}`,
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Notion API错误:", data);
      return res.status(response.status).json({
        error: "Notion令牌交换失败",
        status: response.status,
        details: data,
      });
    }

    console.log("令牌交换成功:", {
      access_token: data.access_token
        ? data.access_token.substring(0, 10) + "..."
        : null,
      workspace_id: data.workspace_id,
      bot_id: data.bot_id,
    });

    return res.status(200).json(data);
  } catch (error) {
    console.error("代理服务器错误:", error);
    return res.status(500).json({
      error: "服务器错误",
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}
