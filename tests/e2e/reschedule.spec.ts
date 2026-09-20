import { expect, test } from '@playwright/test'

// Patient moves an existing booking to a new slot and frees the old one.
test('patient reschedules an appointment', async ({ page }) => {
  await page.context().addCookies([
    { name: 'mb-role', value: 'patient', domain: 'localhost', path: '/' },
  ])
  await page.goto('/patient/appointments')
  await expect(page.getByRole('heading', { name: 'My appointments' })).toBeVisible()

  await page.getByRole('link', { name: 'Reschedule' }).first().click()
  await expect(page).toHaveURL(/\/reschedule/, { timeout: 30_000 })
  await expect(page.getByRole('button', { name: 'Confirm new time' })).toBeDisabled()

  const openSlot = page.locator('button.slot-open').first()
  await expect(openSlot).toBeVisible()
  await openSlot.click()
  await page.getByRole('button', { name: 'Confirm new time' }).click()

  await expect(page).toHaveURL(/\/patient\/appointments$/, { timeout: 30_000 })
})
