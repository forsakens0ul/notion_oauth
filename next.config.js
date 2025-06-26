/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 静态资源在public目录下
  // API路由在api目录下
  // 使Vercel正确识别API路由
  api: {
    bodyParser: true,
  },
  // 允许从Chrome扩展进行CORS请求
  async headers() {
    return [
      {
        // 匹配所有API路由
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT,OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
