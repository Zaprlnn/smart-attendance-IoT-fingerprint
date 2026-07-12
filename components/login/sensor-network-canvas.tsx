"use client"

import { useEffect, useRef } from "react"
import type P5 from "p5"

// Palet tetap (panel brand selalu gelap, lepas dari light/dark mode situs).
const COLOR_NAVY_DEEP: [number, number, number] = [10, 23, 31] // ~#0A171F
const COLOR_NAVY: [number, number, number] = [15, 42, 63] // ~#0F2A3F
const COLOR_TEAL: [number, number, number] = [59, 193, 168] // #3BC1A8

const NODE_COUNT = 70
const CONNECT_DISTANCE = 130
const NOISE_SCALE = 0.0025
const SEED = 2026

interface Node {
  x: number
  y: number
  phase: number
}

/**
 * Background generatif "jaringan sensor IoT": node-node yang bergerak halus
 * mengikuti flow field noise, saling terhubung saat berdekatan, warnanya
 * berinterpolasi teal -> navy berdasar kedalaman geraknya. Seeded agar
 * deterministik, berhenti otomatis saat tab tidak aktif atau saat pengguna
 * meminta reduced motion.
 */
export function SensorNetworkCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let p5Instance: P5 | null = null
    let cancelled = false

    import("p5").then(({ default: P5Ctor }) => {
      if (cancelled || !container) return

      const sketch = (p: P5) => {
        let nodes: Node[] = []
        const reduceMotion =
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches

        const buildNodes = (w: number, h: number) => {
          nodes = Array.from({ length: NODE_COUNT }, () => ({
            x: p.random(w),
            y: p.random(h),
            phase: p.random(p.TWO_PI),
          }))
        }

        p.setup = () => {
          const canvas = p.createCanvas(
            container.clientWidth,
            container.clientHeight
          )
          canvas.parent(container)
          p.randomSeed(SEED)
          p.noiseSeed(SEED)
          buildNodes(p.width, p.height)
          p.frameRate(30)
          if (reduceMotion) p.noLoop()
        }

        p.draw = () => {
          const t = p.frameCount * 0.0035

          const bgTop = p.lerpColor(
            p.color(...COLOR_NAVY_DEEP),
            p.color(...COLOR_NAVY),
            0.5 + 0.5 * p.sin(t * 0.6)
          )
          p.background(bgTop)

          for (const node of nodes) {
            const angle =
              p.noise(node.x * NOISE_SCALE, node.y * NOISE_SCALE, t) *
              p.TWO_PI *
              2
            node.x += p.cos(angle) * 0.4
            node.y += p.sin(angle) * 0.4

            if (node.x < 0) node.x += p.width
            if (node.x > p.width) node.x -= p.width
            if (node.y < 0) node.y += p.height
            if (node.y > p.height) node.y -= p.height
          }

          p.noFill()
          for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
              const a = nodes[i]
              const b = nodes[j]
              const d = p.dist(a.x, a.y, b.x, b.y)
              if (d < CONNECT_DISTANCE) {
                const alpha = p.map(d, 0, CONNECT_DISTANCE, 70, 0)
                p.stroke(...COLOR_TEAL, alpha)
                p.strokeWeight(0.6)
                p.line(a.x, a.y, b.x, b.y)
              }
            }
          }

          p.noStroke()
          for (const node of nodes) {
            const pulse = 1.6 + Math.sin(t * 3 + node.phase) * 0.9
            p.fill(...COLOR_TEAL, 200)
            p.circle(node.x, node.y, pulse * 2)
            p.fill(...COLOR_TEAL, 35)
            p.circle(node.x, node.y, pulse * 6)
          }
        }

        let resizeObserver: ResizeObserver | null = null

        const handleVisibility = () => {
          if (document.hidden) p.noLoop()
          else if (!reduceMotion) p.loop()
        }
        document.addEventListener("visibilitychange", handleVisibility)

        resizeObserver = new ResizeObserver(() => {
          p.resizeCanvas(container.clientWidth, container.clientHeight)
        })
        resizeObserver.observe(container)

        const originalRemove = p.remove.bind(p)
        p.remove = () => {
          document.removeEventListener("visibilitychange", handleVisibility)
          resizeObserver?.disconnect()
          originalRemove()
        }
      }

      p5Instance = new P5Ctor(sketch)
    })

    return () => {
      cancelled = true
      p5Instance?.remove()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
    />
  )
}
