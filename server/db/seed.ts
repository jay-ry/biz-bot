/**
 * Seed script — creates an admin user + org from env vars, then seeds the
 * "Bella Vista Restaurant" demo tenant with sample documents.
 * Run with: bun run db:seed
 *
 * Safe to re-run: both the admin section and the demo section are idempotent
 * and will skip gracefully if the relevant records already exist.
 */
import { db } from './connection'
import { users, organizations, documents } from './schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

// ---------------------------------------------------------------------------
// Admin user + org (from env vars)
// ---------------------------------------------------------------------------

const email = process.env.SEED_ADMIN_EMAIL
const password = process.env.SEED_ADMIN_PASSWORD
const orgName = process.env.SEED_ORG_NAME

if (!email || !password || !orgName) {
  console.error('Missing env vars: SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ORG_NAME')
  process.exit(1)
}

const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1)
if (existing) {
  console.log(`Admin already exists: ${email} — skipping admin section.`)
} else {
  const passwordHash = await Bun.password.hash(password, { algorithm: 'bcrypt', cost: 10 })
  let slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const publicToken = nanoid(32)

  let org
  try {
    ;[org] = await db.insert(organizations).values({ name: orgName, slug, publicToken }).returning()
  } catch (err: unknown) {
    const pgCode = (err as { code?: string; cause?: { code?: string } }).cause?.code ?? (err as { code?: string }).code
    if (pgCode !== '23505') throw err
    slug = slug + '-' + nanoid(4)
    ;[org] = await db.insert(organizations).values({ name: orgName, slug, publicToken: nanoid(32) }).returning()
  }
  const [user] = await db.insert(users).values({ email, passwordHash, orgId: org!.id, role: 'owner' }).returning()

  console.log(`Created org:  ${org!.name} (${org!.id})`)
  console.log(`Created user: ${user.email} (${user.id})`)
}

// ---------------------------------------------------------------------------
// Demo tenant — Bella Vista Restaurant
// ---------------------------------------------------------------------------
// Idempotent: skips the entire block if the demo org already exists.
// Documents are inserted with status='pending' so a developer must manually
// run the ingest pipeline after seeding (e.g. bun run ingest).
// ---------------------------------------------------------------------------

const DEMO_TOKEN = 'demo-bella-vista'

const [existingDemo] = await db
  .select()
  .from(organizations)
  .where(eq(organizations.publicToken, DEMO_TOKEN))
  .limit(1)

if (existingDemo) {
  console.log(`Demo org already exists: ${existingDemo.name} (${existingDemo.id}) — skipping.`)
} else {
  const [demoOrg] = await db
    .insert(organizations)
    .values({
      name:         'Bella Vista Restaurant',
      slug:         'bella-vista',
      publicToken:  DEMO_TOKEN,
      botName:      'Bella',
      brandColor:   '#c0392b',
      systemPrompt: 'You are Bella, the friendly assistant for Bella Vista Restaurant. Help guests with menu questions, hours, reservations, and general dining information. Be warm, welcoming, and concise.',
    })
    .returning()

  console.log(`Created demo org: ${demoOrg!.name} (${demoOrg!.id})`)

  /** Raw content for the Menu document */
  const menuContent = `Bella Vista Restaurant Menu

STARTERS
- Bruschetta al Pomodoro — $12
- Burrata with Prosciutto — $16
- Zuppa del Giorno (soup of the day) — $10

PASTA
- Tagliatelle al Ragù Bolognese — $22
- Pappardelle ai Funghi Porcini — $24
- Spaghetti alle Vongole — $26
- Rigatoni all'Amatriciana — $20

MAINS
- Bistecca alla Fiorentina (for 2) — $85
- Branzino al Limone — $32
- Pollo alla Parmigiana — $28

DESSERTS
- Tiramisù — $10
- Panna Cotta — $9
- Gelato (3 scoops) — $8

All dishes prepared fresh daily. Menu subject to seasonal changes.`

  /** Raw content for the Hours & Reservations document */
  const hoursContent = `Bella Vista Restaurant Hours & Reservations

HOURS
Monday – Thursday: 11:30 AM – 10:00 PM
Friday – Saturday: 11:30 AM – 11:00 PM
Sunday: 12:00 PM – 9:00 PM

RESERVATIONS
We accept reservations for parties of 2 or more.
Call us at (555) 867-5309 or book online at bellav.ist/reserve.
Walk-ins welcome for bar seating.
Same-day reservations available by phone only.

PRIVATE DINING
Available for groups of 12 or more. Contact events@bellavista.com.`

  /** Raw content for the FAQ document */
  const faqContent = `Bella Vista Restaurant — Frequently Asked Questions

Do you have vegetarian options?
Yes! Several pasta dishes and starters are vegetarian. Ask your server for today's vegetarian specials.

Is the restaurant wheelchair accessible?
Yes, we have step-free entrance, accessible restrooms, and wide aisles.

Do you have a kids menu?
We offer half-portions of select pasta dishes for children under 12.

Can I bring my own wine?
We have a full bar and wine list. Outside alcohol is not permitted.

Is there parking?
Street parking is available. We also validate at the Oak Street garage (2-hour limit).

Do you accommodate allergies?
Yes. Please inform your server of any allergies. We handle common allergens (gluten, nuts, dairy) with care, though we cannot guarantee a fully allergen-free kitchen.

What is your cancellation policy?
Reservations may be cancelled up to 2 hours before the booking time without charge.`

  await db.insert(documents).values([
    {
      orgId:      demoOrg!.id,
      title:      'Menu',
      sourceType: 'text',
      rawContent: menuContent,
      status:     'pending',
    },
    {
      orgId:      demoOrg!.id,
      title:      'Hours & Reservations',
      sourceType: 'text',
      rawContent: hoursContent,
      status:     'pending',
    },
    {
      orgId:      demoOrg!.id,
      title:      'FAQ',
      sourceType: 'text',
      rawContent: faqContent,
      status:     'pending',
    },
  ])

  console.log(`Created 3 demo documents for ${demoOrg!.name} (status: pending — run ingest to embed).`)
}
