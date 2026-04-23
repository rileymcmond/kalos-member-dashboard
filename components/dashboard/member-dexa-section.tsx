"use client"

import { format, parseISO } from "date-fns"
import { ArrowDownRight, ArrowUpRight, Minus, Sparkles, TrendingUp } from "lucide-react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { HealthDirection, MemberScanSnapshot, MetricChange } from "@/lib/dexa/types"
import type { DexaScan } from "@/lib/database/types"
import { cn } from "@/lib/utils"

function formatScanDate(iso: string) {
  try {
    return format(parseISO(iso), "MMM d, yyyy")
  } catch {
    return iso
  }
}

const personaTitle: Record<MemberScanSnapshot["persona"], string> = {
  no_scans: "Welcome to your DEXA home",
  first: "Your first DEXA baseline",
  second: "This is your moment: first vs second scan",
  returning: "Your journey over time",
}

function directionText(d: HealthDirection) {
  if (d === "improved") return "Improved for common goals"
  if (d === "regressed") return "Worth attention"
  if (d === "unchanged") return "About the same"
  return "For context (not good/bad on its own)"
}

function directionClass(d: string) {
  if (d === "improved") return "text-emerald-700 dark:text-emerald-400"
  if (d === "regressed") return "text-red-700 dark:text-red-400"
  if (d === "unchanged") return "text-muted-foreground"
  return "text-muted-foreground"
}

const EDUCATION = {
  body_fat_pct: {
    title: "Body fat %",
    body: "The share of your weight that is fat. Lower is not always the goal, but it is a common way to track fat loss in coaching.",
  },
  lean_mass_kg: {
    title: "Lean mass",
    body: "Everything that is not body fat, including muscle and other lean tissue. Often a priority when you want a stronger, leaner look without losing much scale weight.",
  },
  fat_mass_kg: {
    title: "Fat mass",
    body: "Kilograms of body fat. Useful alongside body fat % and total weight to see where changes come from.",
  },
  total_mass_kg: {
    title: "Total mass",
    body: "Your full body weight in kilograms. The scale is one data point, not a scorecard — lean and fat can move at the same time.",
  },
  visceral_fat_area_cm2: {
    title: "Visceral fat (abdominal) area",
    body: "An estimate of fat in the deep abdominal area. It is a useful marker in health and performance conversations.",
  },
} as const

type Props = {
  snapshot: MemberScanSnapshot
}

function DeltaArrow({ d }: { d: HealthDirection }) {
  if (d === "improved") {
    return <ArrowDownRight className="h-5 w-5 text-emerald-600" aria-hidden />
  }
  if (d === "regressed") {
    return <ArrowUpRight className="h-5 w-5 text-red-600" aria-hidden />
  }
  if (d === "unchanged" || d === "neutral") {
    return <Minus className="h-5 w-5 text-muted-foreground" aria-hidden />
  }
  return null
}

function formatDeltaValue(c: MetricChange) {
  if (c.id === "body_fat_pct" || c.id === "visceral_fat_area_cm2") {
    return c.absoluteDelta.toFixed(1)
  }
  if (c.id === "total_mass_kg") {
    return c.absoluteDelta.toFixed(2)
  }
  return c.absoluteDelta.toFixed(2)
}

function NoScansMessage() {
  return (
    <Card className="border-dashed border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="font-heading text-lg">We don&apos;t have a scan for you yet</CardTitle>
        <CardDescription className="text-base text-foreground/80">
          DEXA measures body fat %, lean mass, fat mass, and more, so you and your coach can track
          real change — not just the scale. When a scan is added to your account
          (for example, after you upload a report or your clinic syncs a visit), it will show up
          here with a clear, personalized readout.
        </CardDescription>
      </CardHeader>
    </Card>
  )
}

function FirstScanView({ scan }: { scan: DexaScan }) {
  const rows: { key: keyof typeof EDUCATION; value: string; unit: string }[] = [
    { key: "body_fat_pct", value: scan.body_fat_pct.toFixed(1), unit: "%" },
    { key: "lean_mass_kg", value: scan.lean_mass_kg.toFixed(1), unit: "kg" },
    { key: "fat_mass_kg", value: scan.fat_mass_kg.toFixed(1), unit: "kg" },
    { key: "total_mass_kg", value: scan.total_mass_kg.toFixed(1), unit: "kg" },
    ...(scan.visceral_fat_area_cm2 != null
      ? [
          {
            key: "visceral_fat_area_cm2" as const,
            value: scan.visceral_fat_area_cm2.toFixed(1),
            unit: "cm²",
          },
        ]
      : []),
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardDescription className="text-xs font-medium uppercase tracking-wide text-primary">
            Baseline
          </CardDescription>
          <CardTitle className="font-heading text-2xl font-semibold">Your first snapshot</CardTitle>
          <CardDescription className="text-base text-foreground/80">
            Scan on <span className="font-medium text-foreground">{formatScanDate(scan.scanned_at)}</span>
            {scan.source ? ` · source: ${scan.source}` : ""}. These numbers are your{" "}
            <span className="font-medium">starting line</span>, not a final grade. When you have a
            follow-up, we will highlight what moved and in which direction.
          </CardDescription>
        </CardHeader>
      </Card>

      <div>
        <h3 className="mb-2 text-sm font-medium text-foreground">What the numbers mean</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((row) => {
            const ex = EDUCATION[row.key]
            return (
              <Card key={row.key} className="bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium leading-tight">{ex.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-3xl font-semibold tabular-nums text-foreground">
                    {row.value}
                    <span className="ml-1.5 text-lg font-normal text-muted-foreground">{row.unit}</span>
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{ex.body}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <Card className="bg-muted/40">
        <CardContent className="pt-5">
          <p className="text-sm text-foreground/90">
            <span className="font-medium">Next up:</span> a second DEXA is where comparison gets
            exciting. You will see side-by-side and change-for-change — not empty charts, just
            a clear read on what shifted.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function priorityChanges(changes: MetricChange[]): MetricChange[] {
  const order: MetricChange["id"][] = [
    "body_fat_pct",
    "lean_mass_kg",
    "fat_mass_kg",
    "visceral_fat_area_cm2",
    "total_mass_kg",
  ]
  const m = new Map(changes.map((c) => [c.id, c] as const))
  return order.map((id) => m.get(id)).filter((c): c is MetricChange => c != null)
}

function SecondScanView({ comp }: { comp: NonNullable<MemberScanSnapshot["lastTwoComparison"]> }) {
  const priority = priorityChanges(comp.changes).slice(0, 3)

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-primary/25 bg-gradient-to-b from-primary/5 to-card">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wide">First comparison</span>
          </div>
          <CardTitle className="font-heading text-2xl font-semibold">Here&apos;s what changed</CardTitle>
          <CardDescription className="text-base text-foreground/80">
            From {formatScanDate(comp.olderScan.scanned_at)} to{" "}
            {formatScanDate(comp.newerScan.scanned_at)} — the scan right after your baseline. Use the
            directions below to see which moves match common training and nutrition goals; your coach
            can put this in full context.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {priority.map((c) => (
              <div
                key={c.id}
                className="flex flex-col rounded-lg border border-border/80 bg-card p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">{c.label}</span>
                  <DeltaArrow d={c.direction} />
                </div>
                <div className="mt-2 flex items-baseline gap-2 text-sm text-muted-foreground">
                  <span className="tabular-nums line-through opacity-80">{c.olderValue.toFixed(1)}</span>
                  <span>→</span>
                  <span className="text-base font-semibold text-foreground tabular-nums">
                    {c.newerValue.toFixed(1)}
                  </span>
                </div>
                <p
                  className={cn(
                    "mt-1 text-sm font-medium tabular-nums",
                    directionClass(c.direction)
                  )}
                >
                  {c.absoluteDelta >= 0 ? "+" : ""}
                  {formatDeltaValue(c)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground leading-snug">
                  {directionText(c.direction)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Full comparison</CardTitle>
          <CardDescription>All tracked metrics for these two dates.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">First scan</TableHead>
                <TableHead className="text-right">Second scan</TableHead>
                <TableHead className="text-right">Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comp.changes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.label}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.olderValue.toFixed(1)}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.newerValue.toFixed(1)}</TableCell>
                  <TableCell
                    className={cn("text-right tabular-nums font-medium", directionClass(c.direction))}
                  >
                    {c.absoluteDelta >= 0 ? "+" : ""}
                    {formatDeltaValue(c)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-3 text-xs text-muted-foreground">
            “Improved / regressed” follows common body-composition goals (e.g. lower body fat, lower
            visceral area, more lean). Total weight is not labeled as better or worse by itself.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function ReturningJourneyView({
  scans,
  trend,
  lastTwo,
}: {
  scans: DexaScan[]
  trend: MemberScanSnapshot["trend"]
  lastTwo: NonNullable<MemberScanSnapshot["lastTwoComparison"]>
}) {
  const first = scans[0]!
  const last = scans[scans.length - 1]!
  const bfFrom = first.body_fat_pct
  const bfTo = last.body_fat_pct
  const bfChange = bfTo - bfFrom
  const leanFrom = first.lean_mass_kg
  const leanTo = last.lean_mass_kg
  const leanChange = leanTo - leanFrom

  const bodyFatChart = trend.map((p) => ({
    label: formatScanDate(p.scannedAt),
    bodyFat: p.bodyFatPct,
  }))
  const leanChart = trend.map((p) => ({
    label: formatScanDate(p.scannedAt),
    lean: p.leanMassKg,
  }))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <TrendingUp className="h-5 w-5" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wide">Big picture</span>
          </div>
          <CardTitle className="font-heading text-2xl font-semibold">From first scan to today</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-base text-foreground/90">
          <p>
            You have <span className="font-medium text-foreground">{scans.length} DEXA scans</span> on
            file from <span className="font-medium">{formatScanDate(first.scanned_at)}</span> through{" "}
            <span className="font-medium">{formatScanDate(last.scanned_at)}</span>. The charts show how
            your body fat % and lean mass evolved — use them with your goals in mind, not a
            single &quot;good&quot; number in isolation.
          </p>
          <p>
            <span className="font-medium text-foreground">Body fat %</span> started at {bfFrom.toFixed(1)}%
            and is {bfTo.toFixed(1)}% on your most recent visit
            {Math.abs(bfChange) < 0.05 ? (
              " (essentially flat overall)."
            ) : (
              <>
                {" "}
                (
                {bfChange <= 0 ? "down" : "up"} {Math.abs(bfChange).toFixed(1)} points overall from first to
                last).
              </>
            )}{" "}
            <span className="font-medium text-foreground">Lean mass</span> started at {leanFrom.toFixed(1)} kg
            and is now {leanTo.toFixed(1)} kg
            {Math.abs(leanChange) < 0.02
              ? " — roughly steady."
              : ` (change of ${leanChange >= 0 ? "+" : ""}${leanChange.toFixed(1)} kg from first to last).`}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Body fat % over time</CardTitle>
            <CardDescription>Each point is a scan date. Hover for exact values.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bodyFatChart} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} height={50} tickMargin={4} />
                  <YAxis domain={["auto", "auto"]} width={40} tick={{ fontSize: 10 }} tickFormatter={(v) => String(v)} />
                  <Tooltip
                    formatter={(value) => {
                      const n = typeof value === "number" ? value : Number(value)
                      return [
                        Number.isFinite(n) ? `${n.toFixed(1)}%` : "—",
                        "Body fat",
                      ]
                    }}
                    labelClassName="text-xs"
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="bodyFat"
                    name="Body fat"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Lean mass (kg) over time</CardTitle>
            <CardDescription>
              Complements body fat: useful when body weight is stable but composition shifts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={leanChart} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} height={50} tickMargin={4} />
                  <YAxis domain={["auto", "auto"]} width={40} tick={{ fontSize: 10 }} tickFormatter={(v) => String(v)} />
                  <Tooltip
                    formatter={(value) => {
                      const n = typeof value === "number" ? value : Number(value)
                      return [Number.isFinite(n) ? `${n.toFixed(1)} kg` : "—", "Lean mass"]
                    }}
                    labelClassName="text-xs"
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="lean"
                    name="Lean"
                    stroke="#0d9488"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Most recent two scans (quick delta)</CardTitle>
          <CardDescription>
            Latest change vs the scan just before it — in addition to the first-to-now view above.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">Previous</TableHead>
                <TableHead className="text-right">Latest</TableHead>
                <TableHead className="text-right">Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lastTwo.changes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.label}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.olderValue.toFixed(1)}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.newerValue.toFixed(1)}</TableCell>
                  <TableCell
                    className={cn("text-right tabular-nums font-medium", directionClass(c.direction))}
                  >
                    {c.absoluteDelta >= 0 ? "+" : ""}
                    {formatDeltaValue(c)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">All scans</CardTitle>
          <CardDescription>Chronological history, oldest to newest.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Body fat %</TableHead>
                <TableHead className="text-right">Total kg</TableHead>
                <TableHead className="text-right">Lean kg</TableHead>
                <TableHead className="text-right">Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scans.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-muted-foreground">{formatScanDate(s.scanned_at)}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.body_fat_pct.toFixed(1)}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.total_mass_kg.toFixed(1)}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.lean_mass_kg.toFixed(1)}</TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm">{s.source}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export function MemberDexaSection({ snapshot }: Props) {
  const { scans, persona, lastTwoComparison, trend } = snapshot
  const latest = scans.length > 0 ? scans[scans.length - 1] : null

  return (
    <section className="mb-8 space-y-4" aria-label="Your DEXA data">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <h2 className="text-lg font-semibold text-foreground">{personaTitle[persona]}</h2>
        <Badge variant="secondary" className="w-fit shrink-0">
          {persona === "no_scans" && "No data"}
          {persona === "first" && "1 scan · learn your numbers"}
          {persona === "second" && "2 scans · first comparison"}
          {persona === "returning" && "3+ scans · trends & history"}
        </Badge>
      </div>

      {persona === "no_scans" && <NoScansMessage />}

      {persona === "first" && latest && <FirstScanView scan={latest} />}

      {persona === "second" && lastTwoComparison && (
        <>
          <SecondScanView comp={lastTwoComparison} />
          {scans.length > 1 && <TwoScanHistoryTable scans={scans} />}
        </>
      )}

      {persona === "returning" && lastTwoComparison && (
        <ReturningJourneyView
          scans={scans}
          trend={trend}
          lastTwo={lastTwoComparison}
        />
      )}
    </section>
  )
}

function TwoScanHistoryTable({ scans }: { scans: DexaScan[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Both of your scans</CardTitle>
        <CardDescription>Chronological order, oldest to newest.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Body fat %</TableHead>
              <TableHead className="text-right">Total kg</TableHead>
              <TableHead className="text-right">Lean kg</TableHead>
              <TableHead className="text-right">Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scans.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="text-muted-foreground">{formatScanDate(s.scanned_at)}</TableCell>
                <TableCell className="text-right tabular-nums">{s.body_fat_pct.toFixed(1)}</TableCell>
                <TableCell className="text-right tabular-nums">{s.total_mass_kg.toFixed(1)}</TableCell>
                <TableCell className="text-right tabular-nums">{s.lean_mass_kg.toFixed(1)}</TableCell>
                <TableCell className="text-right text-muted-foreground text-sm">{s.source}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
