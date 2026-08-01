import 'dotenv/config'
import bcrypt from 'bcryptjs'
import prismaClientModule from '../src/generated/prisma/client.ts'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const { PrismaClient } = prismaClientModule
const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN })
const prisma = new PrismaClient({ adapter })

const ACTOR = { id: 'usr-1', name: 'Leandro' }

const WORK_LOGS = [
  { date: '2026-06-15', hours: 6, description: 'Lugano' },
  { date: '2026-06-16', hours: 7.5, description: 'Lugano' },
  { date: '2026-06-17', hours: 8, description: 'Lugano' },
  { date: '2026-07-13', hours: 9, description: null },
  { date: '2026-07-14', hours: 7, description: null },
  { date: '2026-07-15', hours: 8, description: 'Massagno e Maserin' },
  { date: '2026-07-16', hours: 5.5, description: 'Grancia' },
  { date: '2026-07-20', hours: 11, description: 'Grancia' },
  { date: '2026-07-17', hours: 9, description: null },
]

async function main() {
  const settings = await prisma.companySettings.findFirst({ select: { defaultWorkerHourlyRate: true } })
  const hourlyRate = settings?.defaultWorkerHourlyRate ?? 25

  const existing = await prisma.user.findUnique({ where: { email: 'angelo@angelo.com' } })
  if (existing) throw new Error('User with this email already exists: ' + existing.id)

  const passwordHash = await bcrypt.hash('angelo1234', 12)

  const result = await prisma.$transaction(async (tx) => {
    const worker = await tx.user.create({
      data: {
        name: 'Angelo Edilson Alessi',
        email: 'angelo@angelo.com',
        passwordHash,
        role: 'WORKER',
        phone: '+39 333 636 9404',
        hourlyRate,
      },
    })

    const now = new Date()
    const logs = []
    for (const entry of WORK_LOGS) {
      const workDate = new Date(`${entry.date}T12:00:00`)
      const log = await tx.workLog.create({
        data: {
          userId: worker.id,
          userName: worker.name,
          workDate,
          hours: entry.hours,
          hourlyRate,
          description: entry.description,
          status: 'APPROVED',
          submittedAt: now,
          approvedAt: now,
          createdById: ACTOR.id,
          createdByName: ACTOR.name,
        },
      })
      logs.push(log)
    }

    await tx.activityLog.createMany({
      data: [
        {
          action: 'CREATE', entityType: 'Utente', entityId: worker.id,
          entityLabel: `${worker.name} (${worker.email})`,
          userId: ACTOR.id, userName: ACTOR.name, success: true, createdAt: now,
        },
        ...logs.map((log) => ({
          action: 'APPROVE', entityType: 'Rapportino', entityId: log.id,
          entityLabel: `${worker.name} — ${entry_date(log)}`,
          userId: ACTOR.id, userName: ACTOR.name, success: true, createdAt: now,
          details: JSON.stringify({ hours: log.hours, source: 'bulk-import-storico' }),
        })),
      ],
    })

    return { worker, logs }
  })

  function entry_date(log) { return log.workDate.toISOString().slice(0, 10) }

  console.log('✓ Utente creato:', result.worker.id, result.worker.name, result.worker.email)
  console.log('✓ Tariffa oraria:', hourlyRate, 'CHF/h')
  console.log('✓ Rapportini creati:', result.logs.length)
  const totalHours = result.logs.reduce((s, l) => s + l.hours, 0)
  console.log('✓ Totale ore:', totalHours, '| Totale maturato: CHF', (totalHours * hourlyRate).toFixed(2))
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
