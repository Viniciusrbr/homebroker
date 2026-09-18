import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    // Next 16 bloqueia otimização de imagens vindas de IP local por padrão (SSRF);
    // necessário apenas em dev, pois o MinIO roda em localhost:9000
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
      },
    ],
  },
};

export default nextConfig;
