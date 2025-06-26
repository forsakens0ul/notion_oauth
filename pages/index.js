import { useEffect } from "react";
import Head from "next/head";

export default function Home() {
  useEffect(() => {
    // 检查URL参数，可能是从Notion重定向回来的
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get("access_token");

    if (accessToken) {
      // 如果有access_token参数，显示已授权状态
      document.getElementById("auth-status").textContent = "✅ 已授权";
      document.getElementById("token-display").textContent = accessToken;
      document.getElementById("token-section").style.display = "block";
    }
  }, []);

  const handleAuthorize = () => {
    // 使用环境变量或安全配置获取客户端ID
    const clientId = process.env.NEXT_PUBLIC_NOTION_CLIENT_ID;
    const redirectUri =
      process.env.NEXT_PUBLIC_NOTION_REDIRECT_URI ||
      "https://v0-new-project-s6hp1wgs2wz.vercel.app/api/notion/callback";

    if (!clientId) {
      alert("服务器配置错误：缺少Notion客户端ID");
      return;
    }

    const notionAuthUrl =
      `https://api.notion.com/v1/oauth/authorize` +
      `?owner=user` +
      `&client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code`;

    window.open(notionAuthUrl, "_blank");
  };

  return (
    <div className="container">
      <Head>
        <title>Notion OAuth授权服务</title>
        <meta
          name="description"
          content="Notion OAuth授权服务，用于Chrome扩展"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className="title">Notion OAuth授权服务</h1>

        <p className="description">
          此服务用于NetEase to Notion扩展程序的OAuth授权流程
        </p>

        <div className="card">
          <h2>授权状态</h2>
          <p id="auth-status">❓ 未授权</p>

          <button onClick={handleAuthorize} className="button">
            授权Notion
          </button>

          <div
            id="token-section"
            style={{ display: "none", marginTop: "20px" }}
          >
            <h3>访问令牌</h3>
            <div id="token-display" className="token-box"></div>
            <p className="note">此令牌已发送回扩展程序，您可以关闭此页面。</p>
          </div>
        </div>

        <div className="card">
          <h2>API端点</h2>
          <ul>
            <li>
              <code>/api/notion/callback</code> - Notion授权回调
            </li>
            <li>
              <code>/api/notion/exchange</code> - 令牌交换API
            </li>
          </ul>
        </div>
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          max-width: 800px;
          margin: 0 auto;
        }

        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 100%;
        }

        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 4rem;
          text-align: center;
        }

        .description {
          text-align: center;
          line-height: 1.5;
          font-size: 1.5rem;
          margin: 1rem 0 2rem;
        }

        .card {
          margin: 1rem;
          padding: 1.5rem;
          text-align: left;
          color: inherit;
          text-decoration: none;
          border: 1px solid #eaeaea;
          border-radius: 10px;
          transition: color 0.15s ease, border-color 0.15s ease;
          width: 100%;
        }

        .card h2 {
          margin: 0 0 1rem 0;
          font-size: 1.5rem;
        }

        .card p {
          margin: 0;
          font-size: 1.25rem;
          line-height: 1.5;
        }

        .button {
          background-color: #2e6e4c;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          font-size: 1rem;
          cursor: pointer;
          margin-top: 1rem;
        }

        .button:hover {
          background-color: #1e5c3c;
        }

        .token-box {
          background-color: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 10px;
          font-family: monospace;
          word-break: break-all;
          margin: 10px 0;
        }

        .note {
          font-size: 0.9rem;
          color: #666;
        }

        code {
          background: #f0f0f0;
          border-radius: 5px;
          padding: 0.2rem 0.4rem;
          font-size: 0.9rem;
          font-family: Menlo, Monaco, Lucida Console, Liberation Mono,
            DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace;
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}
