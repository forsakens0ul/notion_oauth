import { useEffect, useState } from "react";

export default function Fixed() {
  const [token, setToken] = useState("");

  // 从URL获取参数
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const access_token = params.get("access_token");
    if (access_token) {
      setToken(access_token);
    }
  }, []);

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "800px",
        margin: "0 auto",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ color: "#2e6e4c" }}>✅ 固定的授权成功页面</h1>

      <p style={{ fontSize: "18px" }}>
        这是一个测试固定跳转的页面。如果您看到这个页面，说明路由配置正确。
      </p>

      {token && (
        <div>
          <h2>访问令牌</h2>
          <div
            style={{
              background: "#f5f5f5",
              padding: "15px",
              borderRadius: "5px",
              wordBreak: "break-all",
              fontFamily: "monospace",
            }}
          >
            {token}
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: "30px",
          padding: "15px",
          background: "#fff3cd",
          borderRadius: "5px",
        }}
      >
        <h3 style={{ color: "#856404", margin: "0 0 10px 0" }}>
          ⚠️ 重要步骤：共享页面
        </h3>
        <p>为了让集成能访问您的页面，您需要手动共享页面给它：</p>
        <ol>
          <li>在Notion中打开您想用于同步的页面</li>
          <li>点击右上角的"分享"按钮</li>
          <li>在搜索框中输入您的集成名称（通常以"NetEase"开头）</li>
          <li>点击"邀请"按钮共享页面</li>
        </ol>
      </div>
    </div>
  );
}
