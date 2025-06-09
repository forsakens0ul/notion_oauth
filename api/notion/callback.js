// /api/notion/callback.js
export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: "Missing authorization code" });
  }

  const client_id = process.env.NOTION_CLIENT_ID;
  const client_secret = process.env.NOTION_CLIENT_SECRET;
  const redirect_uri = process.env.NOTION_REDIRECT_URI;

  try {
    const response = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(`${client_id}:${client_secret}`).toString("base64")
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri
      })
    });

    const data = await response.json();

    if (data.access_token) {
      // ✅ 成功，保存 token 或重定向
      return res.redirect(`/success?access_token=${data.access_token}`);
    } else {
      return res.status(400).json({ error: "Token exchange failed", details: data });
    }

  } catch (err) {
    return res.status(500).json({ error: "Callback error", message: err.message });
  }
}
