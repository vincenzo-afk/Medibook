import { expect, test } from '@playwright/test'

// Admin oversees the hospital: metrics, doctors, audit trail.
test('admin views dashboard and audit log', async ({ page }) => {
  await page.context().addCookies([
    { name: 'mb-role', value: 'admin', domain: 'localhost', path: '/' },
  ])
  await page.goto('/admin')
  await expect(page.getByText('Appointments').first()).toBeVisible()
  await expect(page.getByText('Revenue').first()).toBeVisible()

  await page.goto('/admin/doctors')
  await expect(page.getByText('Dr. Amara Okafor')).toBeVisible()

  // Onboard a new doctor.
  await page.getByRole('button', { name: 'Onboard doctor' }).click()
  await page.getByPlaceholder('Dr. Jane Doe').fill('Dr. Test Owens')
  await page.getByPlaceholder('English, French').fill('English')
  await page.getByRole('button', { name: 'Save doctor' }).click()
  await expect(page.getByText('Dr. Test Owens')).toBeVisible()

  await page.goto('/admin/audit')
  await expect(page.getByText('Recent events')).toBeVisible()
})
