# Kalos Member Dashboard

Next.js app for members to sign in and view DEXA body-composition data (take-home assessment).

## Local setup

1. Install dependencies: `pnpm install`
2. Copy `.env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Apply the SQL in `supabase/migrations/` in the Supabase SQL editor (or use the Supabase CLI with a linked project).
4. Optional: seed demo users and scans (requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`—server/seed only, never commit or expose): `pnpm run db:seed`
5. Run the app: `pnpm dev`

## Auth

- **Sign in:** `/login` — email and password (Supabase Auth).
- **Register:** `/register` — collects full name (stored in `user_metadata.full_name`), which the database trigger uses for the `public.members` row.
- **Protected routes:** `/` requires a session. Unauthenticated requests are redirected to `/login?next=…` when appropriate.
- **Sign out:** use the avatar menu on the dashboard.

## Demo accounts (after `pnpm run db:seed`)

All accounts share the password **`DemoPass123!`**.

| Persona        | Email                            |
|----------------|----------------------------------|
| First scan     | `first-scan@demo.kalos.local`    |
| Second scan    | `second-scan@demo.kalos.local`   |
| Returning (3)  | `returning-3@demo.kalos.local`   |
| Returning (4)  | `returning-4@demo.kalos.local`   |
| Returning (6+) | `returning-6@demo.kalos.local`   |

Re-seed anytime to reset demo data: `pnpm run db:seed` (removes these users and recreates them).

## DEXA read path (Phase 3)

The home page loads `dexa_scans` for the signed-in member (RLS) in `getMemberScanSnapshot` (`lib/dexa/member-scans.server.ts`). Pure helpers in `lib/dexa/domain.ts` resolve **persona** (no scans / first / second / returning from scan count), **last-two metric deltas** (favorable direction for body fat, lean, fat, visceral; total mass is neutral), and **trend points** for charts. The `MemberDexaSection` on the main dashboard shows latest metrics, a comparison for two scans, a body-fat % line for three or more, and a full history table when there is more than one scan.

## Persona UI (Phase 4)

The same snapshot drives **persona-specific layouts** (not generic empty charts for first-time members): **first scan** uses education-first copy and per-metric definitions (no “trend” line); **second scan** uses a comparison hero plus full table; **3+** uses first-to-latest narrative, body fat % and lean mass trends, a quick delta for the last two visits, and the full table.

## PDF upload (Phase 5)

1. Apply the storage migration as well (creates the private `dexa-reports` bucket and RLS for `storage.objects` so each user can only read/write `/{auth.uid()}/...`).
2. **Upload scan** in the app: choose a text-based PDF; the server uses `pdf-parse` to extract text, then `lib/dexa/parse-dexa-text.ts` runs:
   - **Layout A** — common clinical labels (body fat %, total mass, lean, fat, BMC, visceral).
   - **Layout B** — alternate labels (PBF, TBM, FFM, FM) and looser token order.
   - **Heuristic** — keyword + unit patterns when table order breaks in the text layer.
   - **Derived** — if needed, fat/lean from total × body fat %, etc. (noted in the success toast / notes when used).
3. A new `dexa_scans` row is inserted with `source = 'upload'`, the home page revalidates, and **My scans** shows the new point. The PDF is also uploaded to `dexa-reports` for your account when the bucket exists; if storage fails, the row still saves and a note is added.
4. **Limitations:** image-only (scanned) PDFs with no text will fail. Use an export with selectable text from your DEXA vendor for best results.
