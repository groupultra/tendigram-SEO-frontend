import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: {
    incomingRequests: true,        // 请求日志
    fetches: { fullUrl: true },    // data fetch 日志
  },
};

export default nextConfig;
