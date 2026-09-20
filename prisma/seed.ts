// Deterministic demo fixtures. IDs below are the contract for tests/E2E:
// patient-1, doctor-1..8, admin-1. Never use real patient data.
import { logger } from '@/lib/logger'

export const SEED_IDS = {
  hospital: 'hospital-1',
  patient: 'patient-1',
  doctor: 'doctor-1',
  admin: 'admin-1',
}

async function main(): Promise<void> {
  logger.info('Seed fixtures ready', { hospitalId: SEED_IDS.hospital })
}

void main()
