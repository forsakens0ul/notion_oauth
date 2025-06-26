import { useEffect, useState } from "react";
import Head from "next/head";

export default function Success() {
  const [token, setToken] = useState("");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // 从URL获取access_token
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get("access_token");

    if (accessToken) {
      setToken(accessToken);

      // 尝试发送消息到Chrome扩展
      try {
        // 方法1: 尝试使用chrome.runtime.sendMessage
        if (window.chrome && chrome.runtime) {
          chrome.runtime.sendMessage(
            {
              action: "setNotionToken",
              token: accessToken,
            },
            function (response) {
              console.log("发送令牌到扩展:", response);
            }
          );
        }
        // 方法2: 尝试使用localStorage（扩展可能会检查）
        else if (window.localStorage) {
          localStorage.setItem("notion_access_token", accessToken);
          console.log("已保存令牌到localStorage");
        }
      } catch (e) {
        console.error("发送令牌到扩展时出错:", e);
      }

      // 启动倒计时
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // 尝试关闭窗口
            window.close();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, []);

  return (
    <div className="container">
      <Head>
        <title>授权成功 - Notion OAuth</title>
        <meta name="description" content="Notion授权成功页面" />
      </Head>

      <main>
        <div className="success-card">
          <h1>✅ Notion授权成功！</h1>

          <p className="message">您的Notion账户已成功授权。</p>

          {token && (
            <>
              <h3>访问令牌</h3>
              <div className="token-box">{token}</div>
            </>
          )}

          <p className="message">
            该页面将在{countdown}秒内自动关闭，并将令牌发送回扩展程序。
          </p>

          <p className="note">
            如果页面没有自动关闭，请手动关闭此窗口并返回扩展程序。
          </p>
        </div>
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 0 1rem;
        }

        main {
          max-width: 600px;
          width: 100%;
        }

        .success-card {
          background-color: #f7f7f7;
          border-radius: 8px;
          padding: 2rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        h1 {
          color: #2e6e4c;
          margin-bottom: 1.5rem;
        }

        .message {
          font-size: 1.2rem;
          margin: 1rem 0;
        }

        .token-box {
          background-color: #e9f5ee;
          border: 1px solid #c3e6cb;
          border-radius: 4px;
          padding: 1rem;
          margin: 1rem 0;
          word-break: break-all;
          text-align: left;
          font-family: monospace;
          font-size: 0.9rem;
          color: #155724;
        }

        .note {
          margin-top: 1.5rem;
          color: #666;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}
