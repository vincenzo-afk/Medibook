// Deterministic demo fixtures. IDs below are the contract for tests/E2E:
// patient-1, doctor-1..8, admin-1. Never use real patient data.
export const SEED_IDS = {
  hospital: 'hospital-1',
  patient: 'patient-1',
  doctor: 'doctor-1',
  admin: 'admin-1',
}

async function main(): Promise<void> {
  console.log('Seeding MediBook demo data…', SEED_IDS)
}

void main()
