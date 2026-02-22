import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'

function dashboardAssetsPlugin(): Plugin {
  return {
    name: 'dashboard-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || ''

        // GET /api/dashboards — scan dashboards/ dirs, return metadata array
        if (url === '/api/dashboards') {
          try {
            const dashboardsRoot = path.resolve('dashboards')
            const entries: Array<{
              slug: string
              title: string
              description: string
              chart_count: number
              sections_count: number
              updated_at: string | null
            }> = []

            if (fs.existsSync(dashboardsRoot)) {
              const dirs = fs.readdirSync(dashboardsRoot, { withFileTypes: true })
                .filter(d => d.isDirectory())
                .map(d => d.name)
                .sort()

              for (const slug of dirs) {
                const djPath = path.join(dashboardsRoot, slug, 'dashboard.json')
                if (!fs.existsSync(djPath)) continue
                try {
                  const dj = JSON.parse(fs.readFileSync(djPath, 'utf8'))
                  const charts = dj.charts ?? {}
                  const sections = dj.sections ?? []
                  entries.push({
                    slug,
                    title: dj.title ?? slug,
                    description: dj.description ?? '',
                    chart_count: Object.keys(charts).length,
                    sections_count: sections.length,
                    updated_at: dj.updated_at ?? null,
                  })
                } catch {
                  // skip malformed dashboard.json
                }
              }
            }

            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Cache-Control', 'no-cache')
            res.end(JSON.stringify(entries))
          } catch {
            res.setHeader('Content-Type', 'application/json')
            res.end('[]')
          }
          return
        }

        // GET /d/:slug/dashboard.json
        const djMatch = url.match(/^\/d\/([^/]+)\/dashboard\.json$/)
        if (djMatch) {
          const slug = djMatch[1]
          const filePath = path.resolve('dashboards', slug, 'dashboard.json')
          try {
            const content = fs.readFileSync(filePath, 'utf8')
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Cache-Control', 'no-cache')
            res.end(content)
          } catch {
            res.statusCode = 404
            res.end('{}')
          }
          return
        }

        // GET /d/:slug/data/*.json
        const dataMatch = url.match(/^\/d\/([^/]+)\/(data\/[^?]+\.json)$/)
        if (dataMatch) {
          const slug = dataMatch[1]
          const relativePath = dataMatch[2]
          const filePath = path.resolve('dashboards', slug, relativePath)
          try {
            const content = fs.readFileSync(filePath, 'utf8')
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Cache-Control', 'no-cache')
            res.end(content)
          } catch {
            res.statusCode = 404
            res.end('{}')
          }
          return
        }

        // GET /api/session/context
        if (url === '/api/session/context') {
          try {
            const contextPath = path.resolve('.session', 'context.json')
            const content = fs.existsSync(contextPath)
              ? fs.readFileSync(contextPath, 'utf8')
              : 'null'
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Cache-Control', 'no-cache')
            res.end(content)
          } catch {
            res.setHeader('Content-Type', 'application/json')
            res.end('null')
          }
          return
        }

        // GET /api/session/charts
        if (url === '/api/session/charts') {
          try {
            const chartsPath = path.resolve('.session', 'charts.json')
            const content = fs.existsSync(chartsPath)
              ? fs.readFileSync(chartsPath, 'utf8')
              : '[]'
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Cache-Control', 'no-cache')
            res.end(content)
          } catch {
            res.setHeader('Content-Type', 'application/json')
            res.end('[]')
          }
          return
        }

        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), dashboardAssetsPlugin()],
  server: {
    port: 5173,
    open: false,
  },
})
