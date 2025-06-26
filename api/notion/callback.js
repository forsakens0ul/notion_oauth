// /api/notion/callback.js
export default async function handler(req, res) {
  // 获取授权码
  const { code, error, error_description } = req.query;

  // 如果有错误，显示错误信息
  if (error) {
    console.error("授权错误:", error, error_description);
    return res.status(400).send(`
      <html>
        <head><title>授权失败</title></head>
        <body>
          <h1>授权失败</h1>
          <p>错误: ${error}</p>
          <p>描述: ${error_description || "无详细信息"}</p>
          <script>
            // 通知扩展程序授权失败
            setTimeout(() => {
              window.close();
            }, 5000);
          </script>
        </body>
      </html>
    `);
  }

  // 检查授权码
  if (!code) {
    return res.status(400).json({ error: "缺少授权码" });
  }

  console.log("收到授权码:", code.substring(0, 10) + "...");

  const client_id = process.env.NOTION_CLIENT_ID;
  const client_secret = process.env.NOTION_CLIENT_SECRET;
  const redirect_uri = process.env.NOTION_REDIRECT_URI;

  if (!client_id || !client_secret) {
    console.error("缺少Notion集成凭据");
    return res.status(500).send(`
      <html>
        <head><title>服务器配置错误</title></head>
        <body>
          <h1>服务器配置错误</h1>
          <p>服务器缺少必要的Notion集成凭据</p>
        </body>
      </html>
    `);
  }

  try {
    console.log("准备交换令牌:", {
      redirect_uri,
    });

    // 交换授权码获取访问令牌
    const response = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic " +
          Buffer.from(`${client_id}:${client_secret}`).toString("base64"),
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri,
      }),
    });

    const data = await response.json();

    if (data.access_token) {
      console.log("令牌交换成功:", {
        access_token: data.access_token.substring(0, 10) + "...",
        workspace_id: data.workspace_id,
        workspace_name: data.workspace_name,
      });

      // 成功获取令牌，重定向到成功页面
      return res.redirect(`/success?access_token=${data.access_token}`);
    } else {
      console.error("令牌交换失败:", data);
      return res.status(400).send(`
        <html>
          <head><title>令牌交换失败</title></head>
          <body>
            <h1>令牌交换失败</h1>
            <p>错误: ${data.error || "未知错误"}</p>
            <p>描述: ${data.error_description || "无详细信息"}</p>
          </body>
        </html>
      `);
    }
  } catch (err) {
    console.error("回调处理错误:", err);
    return res.status(500).send(`
      <html>
        <head><title>服务器错误</title></head>
        <body>
          <h1>服务器错误</h1>
          <p>错误信息: ${err.message}</p>
        </body>
      </html>
    `);
  }
}
