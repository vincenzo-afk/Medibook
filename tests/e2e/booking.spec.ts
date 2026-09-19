import { expect, test } from '@playwright/test'

// Patient books an appointment: search → doctor → slot → confirm → list.
test('patient searches and books an appointment', async ({ page }) => {
  await page.context().addCookies([
    { name: 'mb-role', value: 'patient', domain: 'localhost', path: '/' },
  ])
  await page.goto('/patient/doctors')
  await expect(page.getByRole('heading', { name: 'Find a doctor' })).toBeVisible()

  // Filter by specialty to narrow results.
  await page.getByRole('combobox').selectOption('Dermatology')
  await expect(page.getByText('Dr. Daniel Reyes')).toBeVisible()

  // Open the doctor profile.
  await page.getByRole('link', { name: /Dr\. Daniel Reyes/ }).click()
  await page.waitForURL(/\/patient\/doctors\/doctor-2/)
  await expect(page.getByRole('heading', { name: 'Select a time slot' })).toBeVisible()

  // Pick the first available (non-disabled) slot.
  const openSlot = page.locator('button.slot-open').first()
  await expect(openSlot).toBeVisible()
  await openSlot.click()
  await expect(page.getByText('Confirm Appointment')).toBeEnabled()

  await page.getByPlaceholder('Briefly describe your symptoms').fill('Annual skin check')
  await page.getByRole('button', { name: 'Confirm Appointment' }).click()

  // Lands on the appointments list with the new booking.
  await expect(page).toHaveURL(/\/patient\/appointments/, { timeout: 30_000 })
  await expect(page.getByText('Dr. Daniel Reyes').first()).toBeVisible()
})
