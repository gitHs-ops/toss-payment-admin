/** @type {import('next').NextConfig} */
const nextConfig = {
  // ngrok 등 외부 터널링 도구로 접속 허용
  allowedDevHosts: [".ngrok-free.app", ".ngrok-free.dev", ".ngrok.io"],
};

module.exports = nextConfig;
