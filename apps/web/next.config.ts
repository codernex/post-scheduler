import path from "node:path";
/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@repo/api-client"],
    turbopack: {
        root: path.join(__dirname, '../../'),
    },
};

export default nextConfig;
