import path from "node:path";
/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    transpilePackages: ["@repo/api-client"],
    turbopack: {
        root: path.join(__dirname, '../../'),
    },
    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination: process.env.BACKEND_URL 
                    ? `${process.env.BACKEND_URL}/api/:path*`
                    : "http://localhost:8081/api/:path*",
            },
        ];
    },
};

export default nextConfig;
