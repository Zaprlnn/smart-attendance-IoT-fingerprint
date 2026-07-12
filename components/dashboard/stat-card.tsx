import type { LucideIcon } from "lucide-react"
import { Minus, TrendingDown, TrendingUp } from "lucide-react"
import { Line, LineChart, ResponsiveContainer } from "recharts"

import { Card, CardContent } from "@/components/ui/card"
import { useCountUp } from "@/hooks/use-count-up"
import { cn } from "@/lib/utils"

/** Splits "87%" into { prefix: "", number: 87, suffix: "%" } so only the
 * numeric part animates while units/labels stay put. */
function parseValue(value: string): { prefix: string; number: number | null; suffix: string } {
  const match = value.match(/-?\d+(\.\d+)?/)
  if (!match) return { prefix: value, number: null, suffix: "" }
  return {
    prefix: value.slice(0, match.index),
    number: Number(match[0]),
    suffix: value.slice((match.index ?? 0) + match[0].length),
  }
}

function AnimatedValue({ value }: { value: string }) {
  const { prefix, number, suffix } = parseValue(value)
  const animated = useCountUp(number ?? 0, 700)

  if (number === null) return <>{value}</>

  const isInteger = Number.isInteger(number)
  const display = isInteger ? Math.round(animated) : animated.toFixed(1)

  return (
    <>
      {prefix}
      {display}
      {suffix}
    </>
  )
}

export interface StatCardDelta {
  value: number
  trend: "up" | "down" | "neutral"
}

type StatCardTone = "default" | "success" | "warning" | "destructive"

interface StatCardProps {
  title: string
  value: string
  icon: LucideIcon
  delta?: StatCardDelta
  sparklineData?: number[]
  tone?: StatCardTone
  className?: string
}

const TREND_STYLES: Record<
  StatCardDelta["trend"],
  { icon: LucideIcon; className: string }
> = {
  up: { icon: TrendingUp, className: "text-success" },
  down: { icon: TrendingDown, className: "text-destructive" },
  neutral: { icon: Minus, className: "text-muted-foreground" },
}

const TONE_STYLES: Record<StatCardTone, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
}

export function StatCard({
  title,
  value,
  icon: Icon,
  delta,
  sparklineData,
  tone = "default",
  className,
}: StatCardProps) {
  const trend = delta ? TREND_STYLES[delta.trend] : null
  const sparklinePoints = sparklineData?.map((v, i) => ({ i, v }))

  return (
    <Card className={cn("shadow-soft hover-lift", className)}>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-full transition-colors",
              TONE_STYLES[tone]
            )}
          >
            <Icon className="size-4" />
          </span>
        </div>

        <div className="flex items-end justify-between gap-2">
          <div className="flex flex-col gap-1">
            <p className="font-display text-3xl font-semibold tracking-tight tabular-nums">
              <AnimatedValue value={value} />
            </p>
            {trend && delta && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-medium",
                  trend.className
                )}
              >
                <trend.icon className="size-3.5" />
                {delta.value > 0 ? "+" : ""}
                {delta.value}%
              </span>
            )}
          </div>

          {sparklinePoints && sparklinePoints.length > 1 && (
            <div className="h-8 w-20">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklinePoints}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
