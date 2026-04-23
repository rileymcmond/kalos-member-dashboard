/**
 * Idempotent seed for the Kalos take-home demo.
 * - Removes prior demo users (emails in DEMO_EMAILS) so scans can be reset
 * - Creates 5 members covering 1, 2, 3, 4, and 6 scans (3+ and 5+ trends)
 *
 * Run: pnpm run db:seed
 * Needs: NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')

function loadEnv() {
  const tryPaths = [join(projectRoot, '.env.local'), join(projectRoot, '.env')]
  for (const p of tryPaths) {
    if (!existsSync(p)) continue
    const text = readFileSync(p, 'utf8')
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (m) {
        const key = m[1]
        let v = m[2].replace(/\r$/, '')
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
        if (process.env[key] === undefined) process.env[key] = v
      }
    }
    return
  }
}

loadEnv()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim()
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

if (!url || !serviceKey) {
  console.error(
    'Missing env: set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in .env.local'
  )
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

const DEMO_PASSWORD = 'DemoPass123!'

const DEMO = [
  {
    email: 'first-scan@demo.kalos.local',
    full_name: 'Alex Rivera',
    // 1 scan — “first time” persona
    scans: [
      {
        scanned_at: '2024-10-10',
        total_mass_kg: 84.1,
        body_fat_pct: 24.8,
        lean_mass_kg: 63.2,
        fat_mass_kg: 20.9,
        bmc_g: 3020,
        visceral_fat_area_cm2: 118.0,
        source: 'seed',
      },
    ],
  },
  {
    email: 'second-scan@demo.kalos.local',
    full_name: 'Blake Chen',
    scans: [
      {
        scanned_at: '2024-08-20',
        total_mass_kg: 89.0,
        body_fat_pct: 27.1,
        lean_mass_kg: 64.9,
        fat_mass_kg: 24.1,
        bmc_g: 3100,
        visceral_fat_area_cm2: 132.0,
        source: 'seed',
      },
      {
        scanned_at: '2024-11-05',
        total_mass_kg: 86.2,
        body_fat_pct: 24.9,
        lean_mass_kg: 64.7,
        fat_mass_kg: 21.5,
        bmc_g: 3110,
        visceral_fat_area_cm2: 121.0,
        source: 'seed',
      },
    ],
  },
  {
    email: 'returning-3@demo.kalos.local',
    full_name: 'Casey Morgan',
    scans: [
      { scanned_at: '2024-01-12', total_mass_kg: 80.0, body_fat_pct: 32.0, lean_mass_kg: 54.4, fat_mass_kg: 25.6, bmc_g: 2850, visceral_fat_area_cm2: 140.0, source: 'seed' },
      { scanned_at: '2024-05-20', total_mass_kg: 78.2, body_fat_pct: 30.1, lean_mass_kg: 54.6, fat_mass_kg: 23.5, bmc_g: 2860, visceral_fat_area_cm2: 128.0, source: 'seed' },
      { scanned_at: '2024-10-18', total_mass_kg: 77.0, body_fat_pct: 28.0, lean_mass_kg: 55.4, fat_mass_kg: 21.5, bmc_g: 2870, visceral_fat_area_cm2: 115.0, source: 'seed' },
    ],
  },
  {
    email: 'returning-4@demo.kalos.local',
    full_name: 'Dana Patel',
    scans: [
      { scanned_at: '2023-10-01', total_mass_kg: 75.0, body_fat_pct: 19.0, lean_mass_kg: 60.7, fat_mass_kg: 14.2, bmc_g: 2950, visceral_fat_area_cm2: 72.0, source: 'seed' },
      { scanned_at: '2024-01-15', total_mass_kg: 75.4, body_fat_pct: 19.2, lean_mass_kg: 60.8, fat_mass_kg: 14.4, bmc_g: 2960, visceral_fat_area_cm2: 73.0, source: 'seed' },
      { scanned_at: '2024-04-22', total_mass_kg: 75.8, body_fat_pct: 18.7, lean_mass_kg: 61.5, fat_mass_kg: 14.1, bmc_g: 2970, visceral_fat_area_cm2: 71.0, source: 'seed' },
      { scanned_at: '2024-09-30', total_mass_kg: 76.1, body_fat_pct: 18.0, lean_mass_kg: 62.2, fat_mass_kg: 13.5, bmc_g: 2980, visceral_fat_area_cm2: 68.0, source: 'seed' },
    ],
  },
  {
    email: 'returning-6@demo.kalos.local',
    full_name: 'Evan Brooks',
    // 5+ scans for "meaningful" trends
    scans: [
      { scanned_at: '2023-03-05', total_mass_kg: 95.0, body_fat_pct: 32.0, lean_mass_kg: 64.5, fat_mass_kg: 30.3, bmc_g: 3200, visceral_fat_area_cm2: 155.0, source: 'seed' },
      { scanned_at: '2023-05-10', total_mass_kg: 92.0, body_fat_pct: 30.0, lean_mass_kg: 64.1, fat_mass_kg: 27.3, bmc_g: 3210, visceral_fat_area_cm2: 142.0, source: 'seed' },
      { scanned_at: '2023-08-20', total_mass_kg: 90.0, body_fat_pct: 28.0, lean_mass_kg: 64.0, fat_mass_kg: 25.0, bmc_g: 3220, visceral_fat_area_cm2: 130.0, source: 'seed' },
      { scanned_at: '2023-12-10', total_mass_kg: 88.0, body_fat_pct: 25.0, lean_mass_kg: 64.0, fat_mass_kg: 22.0, bmc_g: 3230, visceral_fat_area_cm2: 118.0, source: 'seed' },
      { scanned_at: '2024-04-02', total_mass_kg: 86.0, body_fat_pct: 22.0, lean_mass_kg: 64.0, fat_mass_kg: 19.0, bmc_g: 3240, visceral_fat_area_cm2: 105.0, source: 'seed' },
      { scanned_at: '2024-10-20', total_mass_kg: 85.0, body_fat_pct: 20.0, lean_mass_kg: 64.0, fat_mass_kg: 16.0, bmc_g: 3250, visceral_fat_area_cm2: 92.0, source: 'seed' },
    ],
  },
]

const demoEmails = new Set(DEMO.map((d) => d.email))

async function removeDemoUsers() {
  let page = 1
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    for (const u of data.users) {
      if (u.email && demoEmails.has(u.email)) {
        const { error: delError } = await supabase.auth.admin.deleteUser(u.id)
        if (delError) throw delError
        console.log('Removed user:', u.email)
      }
    }
    if (data.users.length < 200) break
    page += 1
  }
}

async function main() {
  await removeDemoUsers()

  for (const demo of DEMO) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: demo.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: demo.full_name },
    })
    if (error) throw error
    const userId = data.user.id
    const rows = demo.scans.map((s) => ({
      ...s,
      member_id: userId,
    }))

    const { error: insertError } = await supabase.from('dexa_scans').insert(rows)
    if (insertError) throw insertError
    console.log('Seeded', demo.email, `(${demo.scans.length} scan(s))`)
  }

  console.log('Done. Demo password for all accounts:', DEMO_PASSWORD)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
