import { useEffect, useState } from "react";
import Head from "next/head";

export default function Success() {
  const [token, setToken] = useState("");
  const [countdown, setCountdown] = useState(15);
  const [tokenSent, setTokenSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // 从URL获取access_token
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get("access_token");

    if (accessToken) {
      setToken(accessToken);
      console.log("成功页面获取到令牌:", accessToken.substring(0, 10) + "...");

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
              if (response && response.success) {
                setTokenSent(true);
              }
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
        setError(e.message);
      }

      // 启动倒计时
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // 不自动关闭窗口，让用户控制
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setError("URL中没有找到access_token参数");
    }
  }, []);

  // 手动复制令牌
  const copyToken = () => {
    navigator.clipboard
      .writeText(token)
      .then(() => {
        alert("令牌已复制到剪贴板");
      })
      .catch((err) => {
        console.error("复制失败:", err);
        alert("复制失败，请手动选择并复制令牌");
      });
  };

  // 手动关闭窗口
  const closeWindow = () => {
    window.close();
  };

  // 测试令牌的有效性
  const testToken = async () => {
    try {
      const response = await fetch("https://api.notion.com/v1/users/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Notion-Version": "2022-06-28",
        },
      });

      const data = await response.json();

      if (response.ok) {
        alert(`令牌有效! 用户名: ${data.name || data.bot.name || "未知"}`);
      } else {
        alert(`令牌测试失败: ${data.message || response.status}`);
      }
    } catch (e) {
      alert(`测试时出错: ${e.message}`);
    }
  };

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

          {token ? (
            <>
              <h3>访问令牌</h3>
              <div className="token-box">
                <code>{token}</code>
                <button className="copy-btn" onClick={copyToken}>
                  复制令牌
                </button>
              </div>

              <div className="action-buttons">
                <button className="test-btn" onClick={testToken}>
                  测试令牌
                </button>
                <button className="close-btn" onClick={closeWindow}>
                  关闭窗口
                </button>
              </div>

              <div className="integration-help">
                <h3>⚠️ 重要步骤：共享页面</h3>
                <p>为了让集成能访问您的页面，您需要手动共享页面给它：</p>
                <ol>
                  <li>在Notion中打开您想用于同步的页面</li>
                  <li>点击右上角的"分享"按钮</li>
                  <li>在搜索框中输入您的集成名称（通常以"NetEase"开头）</li>
                  <li>点击"邀请"按钮共享页面</li>
                </ol>
                <p>
                  <strong>这一步非常重要！</strong>
                  如果不共享页面，集成将无法访问您的Notion内容。
                </p>
              </div>
            </>
          ) : (
            <p className="error-message">未找到令牌。错误: {error}</p>
          )}

          {countdown > 0 ? (
            <p className="message">
              您可以在{countdown}秒内复制令牌，或点击"关闭窗口"按钮。
            </p>
          ) : (
            <p className="message">请复制令牌并手动关闭此窗口。</p>
          )}

          {tokenSent && (
            <p className="success-message">✓ 令牌已成功发送至扩展程序</p>
          )}

          <p className="note">关闭此窗口后，请返回扩展程序继续操作。</p>
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
          position: relative;
        }

        .note {
          margin-top: 1.5rem;
          color: #666;
          font-size: 0.9rem;
        }

        .copy-btn {
          position: absolute;
          top: 5px;
          right: 5px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 3px;
          padding: 3px 8px;
          font-size: 12px;
          cursor: pointer;
        }

        .action-buttons {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 15px;
        }

        .test-btn {
          background: #17a2b8;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          cursor: pointer;
        }

        .close-btn {
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          cursor: pointer;
        }

        .error-message {
          color: #721c24;
          background-color: #f8d7da;
          padding: 10px;
          border-radius: 4px;
          margin: 10px 0;
        }

        .success-message {
          color: #155724;
          background-color: #d4edda;
          padding: 10px;
          border-radius: 4px;
          margin: 10px 0;
        }

        .integration-help {
          margin-top: 20px;
          text-align: left;
          padding: 15px;
          background-color: #fff3cd;
          border: 1px solid #ffeeba;
          border-radius: 4px;
        }

        .integration-help h3 {
          color: #856404;
          margin-top: 0;
        }

        .integration-help ol {
          padding-left: 20px;
        }

        .integration-help li {
          margin-bottom: 5px;
        }
      `}</style>
    </div>
  );
}
