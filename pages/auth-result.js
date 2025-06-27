import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

export default function AuthResult() {
  const router = useRouter();
  const [authData, setAuthData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [neteaseUID, setNeteaseUID] = useState("");

  useEffect(() => {
    // 等待路由准备就绪
    if (!router.isReady) return;

    // 从URL参数获取授权数据
    const {
      access_token,
      token_type,
      bot_id,
      workspace_id,
      workspace_name,
      workspace_icon,
    } = router.query;

    // 设置授权数据
    if (access_token) {
      const data = {
        access_token,
        token_type: token_type || "bearer",
        bot_id,
        workspace_id,
        workspace_name,
        workspace_icon,
      };
      setAuthData(data);
      setLoading(false);

      // 尝试发送消息到Chrome扩展
      try {
        if (window.chrome && chrome.runtime) {
          chrome.runtime.sendMessage(
            {
              action: "setNotionToken",
              token: access_token,
            },
            function (response) {
              console.log("发送令牌到扩展:", response);
            }
          );
        }
      } catch (e) {
        console.error("发送令牌到扩展时出错:", e);
      }
    } else {
      setError("未找到授权参数");
      setLoading(false);
    }
  }, [router.isReady, router.query]);

  // 测试令牌有效性
  const testToken = async () => {
    try {
      setImportStatus("正在测试令牌...");
      const response = await fetch("https://api.notion.com/v1/users/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authData.access_token}`,
          "Notion-Version": "2022-06-28",
        },
      });

      const data = await response.json();

      if (response.ok) {
        setImportStatus(
          `令牌有效! 用户: ${data.name || data.bot.name || "未知"}`
        );
      } else {
        setImportStatus(`令牌测试失败: ${data.message || response.status}`);
      }
    } catch (e) {
      setImportStatus(`测试出错: ${e.message}`);
    }
  };

  // 获取Notion页面列表
  const getPages = async () => {
    try {
      setImportStatus("正在获取页面列表...");

      const response = await fetch("https://api.notion.com/v1/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authData.access_token}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: {
            value: "page",
            property: "object",
          },
          sort: {
            direction: "descending",
            timestamp: "last_edited_time",
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setImportStatus(`获取页面失败: ${data.message || response.status}`);
        return;
      }

      if (data.results.length === 0) {
        setImportStatus("未找到可访问的页面。请确保您已将页面共享给集成。");
        return;
      }

      // 显示找到的页面
      setImportStatus(
        `找到 ${data.results.length} 个页面。第一个页面: ${
          data.results[0].properties?.title?.title?.[0]?.plain_text ||
          "无标题页面"
        }`
      );

      return data.results[0].id; // 返回第一个页面的ID
    } catch (e) {
      setImportStatus(`获取页面出错: ${e.message}`);
    }
  };

  // 导入网易云数据到Notion
  const importData = async () => {
    if (!neteaseUID) {
      setImportStatus("请输入网易云UID");
      return;
    }

    try {
      // 1. 获取页面ID
      setImportStatus("步骤1: 获取Notion页面...");
      const pageId = await getPages();

      if (!pageId) {
        return; // getPages已经设置了错误状态
      }

      // 2. 获取网易云数据
      setImportStatus("步骤2: 获取网易云数据...");
      const apiUrl = `https://netease-cloud-music-api-tau-one-92.vercel.app/user/record?uid=${neteaseUID}&type=0`;
      const musicDataResponse = await fetch(apiUrl);

      if (!musicDataResponse.ok) {
        setImportStatus(`获取网易云数据失败: ${musicDataResponse.status}`);
        return;
      }

      const musicData = await musicDataResponse.json();

      if (!musicData.allData || musicData.code !== 200) {
        setImportStatus(
          `获取网易云数据出错: ${musicData.message || "未知错误"}`
        );
        return;
      }

      setImportStatus(
        `步骤2完成: 获取到 ${musicData.allData.length} 首歌曲数据`
      );

      // 3. 创建Notion数据库
      setImportStatus("步骤3: 在Notion创建数据库...");
      const createDatabaseResponse = await fetch(
        "https://api.notion.com/v1/databases",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authData.access_token}`,
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28",
          },
          body: JSON.stringify({
            parent: {
              type: "page_id",
              page_id: pageId,
            },
            title: [
              {
                type: "text",
                text: {
                  content: `网易云听歌记录 - ${neteaseUID}`,
                },
              },
            ],
            properties: {
              歌曲名: {
                title: {},
              },
              歌手: {
                rich_text: {},
              },
              专辑: {
                rich_text: {},
              },
              播放次数: {
                number: {},
              },
              评分: {
                number: {},
              },
              发布日期: {
                date: {},
              },
              时长: {
                rich_text: {},
              },
              VIP歌曲: {
                rich_text: {},
              },
              已购买: {
                rich_text: {},
              },
              封面: {
                url: {},
              },
              MV链接: {
                url: {},
              },
              "累计听歌时间(分钟)": {
                number: {},
              },
            },
          }),
        }
      );

      if (!createDatabaseResponse.ok) {
        const errorText = await createDatabaseResponse.text();
        setImportStatus(
          `创建数据库失败: ${createDatabaseResponse.status} - ${errorText}`
        );
        return;
      }

      const dbResult = await createDatabaseResponse.json();
      const databaseId = dbResult.id;
      setImportStatus(`步骤3完成: 数据库创建成功`);

      // 4. 处理数据
      setImportStatus("步骤4: 处理数据...");
      const processedData = processNeteaseData(musicData.allData);

      // 5. 上传数据
      setImportStatus("步骤5: 上传数据到Notion...");
      // 分批处理，每批5条数据
      const batchSize = 5;
      let successCount = 0;

      for (let i = 0; i < processedData.length; i += batchSize) {
        const batch = processedData.slice(i, i + batchSize);
        setImportStatus(`上传中 ${i}/${processedData.length} ...`);

        const promises = batch.map((item) =>
          addRecordToNotion(item, databaseId, authData.access_token)
        );
        const results = await Promise.allSettled(promises);

        const successful = results.filter((r) => r.status === "fulfilled");
        successCount += successful.length;

        // 添加延迟避免API限制
        if (i + batchSize < processedData.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      setImportStatus(
        `✅ 成功! 已导入 ${successCount}/${processedData.length} 条记录到Notion数据库`
      );

      // 添加数据库链接
      const dbLinkContainer = document.createElement("div");
      dbLinkContainer.innerHTML = `<a href="${dbResult.url}" target="_blank" style="color: #2e6e4c; font-weight: bold;">打开Notion数据库</a>`;
      document.getElementById("db-link").appendChild(dbLinkContainer);
    } catch (e) {
      setImportStatus(`导入过程出错: ${e.message}`);
    }
  };

  // 处理网易云数据
  function processNeteaseData(allData) {
    return allData.map((item) => {
      const song = item.song;

      // 处理歌手名（合并多个歌手）
      const artists = song.ar.map((ar) => ar.name);
      const artistNames = artists.join(" / ");

      // 处理时长（ms转分钟:秒）
      const durationMs = song.dt;
      const minutes = Math.floor(durationMs / 60000);
      const seconds = Math.floor((durationMs % 60000) / 1000);
      const duration = `${minutes}:${seconds.toString().padStart(2, "0")}`;

      // 处理发布时间
      let publishTime = "未知日期";
      if (song.publishTime) {
        try {
          const date = new Date(song.publishTime);
          publishTime = date.toISOString().split("T")[0];
        } catch (e) {
          console.error("日期转换错误:", e);
        }
      }

      // 计算累计听歌时间(分钟)
      const totalTimeMin =
        Math.round(((item.playCount * song.dt) / 1000 / 60) * 100) / 100;

      return {
        name: song.name,
        artist: artistNames,
        album: song.al.name,
        cover: song.al.picUrl,
        playCount: item.playCount,
        score: item.score,
        publishTime: publishTime,
        duration: duration,
        isVip: song.fee > 0 ? "是" : "否",
        isPurchased: song.privilege?.payed > 0 ? "是" : "否",
        mv: song.mv ? `https://music.163.com/mv?id=${song.mv}` : "",
        totalTimeMin: totalTimeMin,
      };
    });
  }

  // 添加记录到Notion数据库
  async function addRecordToNotion(item, databaseId, token) {
    return fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        parent: {
          database_id: databaseId,
        },
        properties: {
          歌曲名: {
            title: [{ text: { content: item.name } }],
          },
          歌手: {
            rich_text: [{ text: { content: item.artist } }],
          },
          专辑: {
            rich_text: [{ text: { content: item.album } }],
          },
          播放次数: {
            number: item.playCount,
          },
          评分: {
            number: item.score,
          },
          发布日期: {
            date: {
              start: item.publishTime !== "未知日期" ? item.publishTime : null,
            },
          },
          时长: {
            rich_text: [{ text: { content: item.duration } }],
          },
          VIP歌曲: {
            rich_text: [{ text: { content: item.isVip } }],
          },
          已购买: {
            rich_text: [{ text: { content: item.isPurchased } }],
          },
          封面: {
            url: item.cover,
          },
          MV链接: {
            url: item.mv || null,
          },
          "累计听歌时间(分钟)": {
            number: item.totalTimeMin,
          },
        },
      }),
    });
  }

  // 复制令牌
  const copyToken = () => {
    navigator.clipboard
      .writeText(authData.access_token)
      .then(() => {
        alert("令牌已复制到剪贴板");
      })
      .catch((err) => {
        console.error("复制失败:", err);
        alert("复制失败，请手动选择并复制令牌");
      });
  };

  return (
    <div className="container">
      <Head>
        <title>Notion授权结果</title>
        <meta name="description" content="Notion授权结果页面" />
      </Head>

      <main>
        <div className="auth-card">
          <h1>✅ Notion授权成功</h1>

          {loading ? (
            <p>加载中...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : (
            <>
              <div className="auth-details">
                <div className="parameter">
                  <h3>访问令牌 (access_token)</h3>
                  <div className="token-box">
                    {authData.access_token}
                    <button onClick={copyToken} className="copy-btn">
                      复制
                    </button>
                  </div>
                  <p className="description">
                    最重要的参数，用于所有Notion API调用的身份验证
                  </p>
                </div>

                <div className="parameter">
                  <h3>令牌类型 (token_type)</h3>
                  <div className="value">{authData.token_type || "bearer"}</div>
                  <p className="description">通常为"bearer"，表示令牌类型</p>
                </div>

                <div className="parameter">
                  <h3>机器人ID (bot_id)</h3>
                  <div className="value">{authData.bot_id || "未提供"}</div>
                  <p className="description">集成机器人的ID</p>
                </div>

                <div className="parameter">
                  <h3>工作区ID (workspace_id)</h3>
                  <div className="value">
                    {authData.workspace_id || "未提供"}
                  </div>
                  <p className="description">用户工作区的ID</p>
                </div>

                <div className="parameter">
                  <h3>工作区名称 (workspace_name)</h3>
                  <div className="value">
                    {authData.workspace_name || "未提供"}
                  </div>
                  <p className="description">用户工作区名称</p>
                </div>

                {authData.workspace_icon && (
                  <div className="parameter">
                    <h3>工作区图标 (workspace_icon)</h3>
                    <div className="value">
                      <img
                        src={authData.workspace_icon}
                        alt="工作区图标"
                        width="40"
                        height="40"
                      />
                    </div>
                    <p className="description">工作区图标URL</p>
                  </div>
                )}
              </div>

              <div className="action-section">
                <h2>共享页面与数据导入</h2>

                <div className="share-instruction">
                  <h3>⚠️ 重要步骤：共享页面</h3>
                  <p>为了让集成能访问您的页面，您需要手动共享页面给它：</p>
                  <ol>
                    <li>在Notion中打开您想用于同步的页面</li>
                    <li>点击右上角的"分享"按钮</li>
                    <li>在搜索框中输入您的集成名称（通常以"NetEase"开头）</li>
                    <li>点击"邀请"按钮共享页面</li>
                  </ol>
                </div>

                <div className="action-buttons">
                  <button onClick={testToken} className="test-btn">
                    测试令牌
                  </button>
                </div>

                <div className="import-section">
                  <h3>导入网易云数据到Notion</h3>
                  <div className="input-group">
                    <label htmlFor="netease-uid">网易云音乐 UID：</label>
                    <input
                      type="text"
                      id="netease-uid"
                      value={neteaseUID}
                      onChange={(e) => setNeteaseUID(e.target.value)}
                      placeholder="例如：71968960"
                    />
                  </div>
                  <button onClick={importData} className="import-btn">
                    开始导入
                  </button>
                  <div className="import-status">
                    {importStatus && <p>{importStatus}</p>}
                  </div>
                  <div id="db-link" className="db-link"></div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 20px;
          background-color: #f7f7f7;
        }

        main {
          max-width: 800px;
          margin: 0 auto;
        }

        .auth-card {
          background-color: white;
          border-radius: 10px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        h1 {
          color: #2e6e4c;
          margin-bottom: 20px;
          text-align: center;
        }

        h2 {
          color: #333;
          margin-top: 30px;
          margin-bottom: 15px;
          border-top: 1px solid #eee;
          padding-top: 20px;
        }

        h3 {
          color: #444;
          margin-bottom: 5px;
        }

        .error {
          color: #721c24;
          background-color: #f8d7da;
          padding: 10px;
          border-radius: 4px;
        }

        .auth-details {
          margin-bottom: 30px;
        }

        .parameter {
          margin-bottom: 20px;
        }

        .token-box {
          background-color: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 10px;
          word-break: break-all;
          font-family: monospace;
          position: relative;
        }

        .value {
          background-color: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 10px;
        }

        .description {
          color: #666;
          font-size: 14px;
          margin-top: 5px;
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

        .action-section {
          margin-top: 30px;
        }

        .share-instruction {
          background-color: #fff3cd;
          border: 1px solid #ffeeba;
          border-radius: 4px;
          padding: 15px;
          margin-bottom: 20px;
        }

        .share-instruction h3 {
          color: #856404;
          margin-top: 0;
        }

        .share-instruction ol {
          padding-left: 20px;
        }

        .share-instruction li {
          margin-bottom: 5px;
        }

        .action-buttons {
          margin-bottom: 20px;
        }

        .test-btn {
          background: #17a2b8;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 16px;
        }

        .import-section {
          background-color: #e9f5ee;
          border: 1px solid #c3e6cb;
          border-radius: 4px;
          padding: 20px;
        }

        .input-group {
          margin-bottom: 10px;
        }

        .input-group label {
          display: block;
          margin-bottom: 5px;
        }

        .input-group input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .import-btn {
          background: #2e6e4c;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 10px 20px;
          cursor: pointer;
          font-size: 16px;
          margin-top: 10px;
        }

        .import-status {
          margin-top: 15px;
          padding: 10px;
          background-color: #f8f9fa;
          border-radius: 4px;
          min-height: 20px;
        }

        .db-link {
          margin-top: 15px;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
