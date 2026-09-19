import { expect, test } from '@playwright/test'

// Doctor manages schedule and issues a prescription.
test('doctor views schedule and issues a prescription', async ({ page }) => {
  await page.context().addCookies([
    { name: 'mb-role', value: 'doctor', domain: 'localhost', path: '/' },
  ])
  await page.goto('/doctor')
  await expect(page.getByText("Today's schedule").first()).toBeVisible()

  // Create a new availability slot.
  await page.goto('/doctor/schedule')
  await page.getByRole('button', { name: 'Add slot' }).click()
  await expect(page.getByText('Slot created.')).toBeVisible()

  // Issue a prescription for the first listed appointment.
  await page.goto('/doctor/prescriptions')
  await page.getByPlaceholder('e.g. Acute bronchitis').fill('Acute bronchitis')
  await page.getByPlaceholder('Amoxicillin').fill('Amoxicillin')
  await page.getByPlaceholder('500mg').fill('500mg')
  await page.getByRole('button', { name: 'Issue prescription' }).click()
  await expect(page.getByText('Prescription issued.')).toBeVisible()
})
