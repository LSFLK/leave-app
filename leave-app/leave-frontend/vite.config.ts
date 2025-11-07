import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const useRemote = env.VITE_PROXY_REMOTE === 'true'
  // For remote gateway, set VITE_REMOTE_API to base like:
  // https://<choreo-domain>/lsf-leave-app/backend-ck/v1.0
  const target = useRemote
    ? (env.VITE_REMOTE_API || 'http://localhost:9090')
    : 'http://localhost:9090'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          secure: false,
          configure: (proxy: any) => {
            proxy.on('proxyReq', (proxyReq: any, req: any) => {
              const authHeader = req.headers['authorization'] as string | string[] | undefined
              const headerVal = Array.isArray(authHeader) ? authHeader[0] : authHeader
              if (headerVal) {
                const token = headerVal.startsWith('Bearer ') ? headerVal.slice(7) : headerVal
                // Inject the invoker header expected by backend
                proxyReq.setHeader('x-jwt-assertion', token)
              }
            })
          },
        },
        '/leaves': {
          target,
          changeOrigin: true,
          secure: false,
          rewrite: (path: string) => path.replace(/^\/leaves/, '/api/leaves'),
          configure: (proxy: any) => {
            proxy.on('proxyReq', (proxyReq: any, req: any) => {
              const authHeader = req.headers['authorization'] as string | string[] | undefined
              const headerVal = Array.isArray(authHeader) ? authHeader[0] : authHeader
              if (headerVal) {
                const token = headerVal.startsWith('Bearer ') ? headerVal.slice(7) : headerVal
                proxyReq.setHeader('x-jwt-assertion', token)
              }
            })
          },
        },
      },
    },
  }
})
