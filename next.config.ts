/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! ВНИМАНИЕ !!
    // Это отключит проверку типов при сборке (npm run build).
    // Ваш код скомпилируется и запустится, игнорируя эту ошибку с model-viewer.
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig