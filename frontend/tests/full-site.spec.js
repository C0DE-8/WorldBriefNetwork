import { test, expect } from '@playwright/test'

const password = '12345678'

async function signOut(page) {
  const button = page.getByRole('button', { name: /sign out/i })
  if (await button.count()) await button.first().click()
}

test('reader and administrator critical journeys', async ({ page }) => {
  const temporaryTitle = `Temporary end-to-end editorial test ${Date.now()}`
  const browserErrors = []
  page.on('pageerror', (error) => browserErrors.push(error.message))

  await page.goto('/signup')
  const cookieDialog = page.getByRole('dialog', { name: 'Cookie preferences' })
  if (await cookieDialog.isVisible().catch(() => false)) await cookieDialog.getByRole('button', { name: 'Essential only' }).click()
  await page.getByLabel('Display name').fill('habibi')
  await page.getByLabel('Email address').fill('8amhabibi@gmail.com')
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: /create account/i }).click()
  const duplicate = page.getByRole('alert')
  if (await duplicate.isVisible({ timeout: 1500 }).catch(() => false)) {
    await page.goto('/login')
    await page.getByLabel('Email address').fill('8amhabibi@gmail.com')
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: /^sign in/i }).click()
  }
  await expect(page).toHaveURL(/\/$/)

  await page.goto('/article/dangote-refinery-africa-biggest-ipo')
  await expect(page.getByRole('heading', { name: /Dangote opens Africa’s biggest IPO/i })).toBeVisible()
  await page.getByRole('button', { name: /save/i }).first().click()
  await page.getByRole('button', { name: /open discussion/i }).click()
  await page.getByPlaceholder('What’s your perspective?').fill('This is a major moment for African capital markets. Clear investor protections will matter as much as the size of the offer.')
  await page.getByRole('button', { name: /join the conversation/i }).click()
  await expect(page.getByRole('paragraph').filter({ hasText: 'This is a major moment for African capital markets.' }).first()).toBeVisible()

  await page.goto('/author/maya-okafor')
  await expect(page.getByRole('heading', { name: 'Maya Okafor', exact: true })).toBeVisible()
  const likeAuthor = page.getByRole('button', { name: 'Like author' })
  if (await likeAuthor.count()) await likeAuthor.click()
  const followAuthor = page.getByRole('button', { name: 'Follow author' })
  if (await followAuthor.count()) await followAuthor.click()
  await page.goto('/following')
  await expect(page.getByText('Dangote opens Africa’s biggest IPO')).toBeVisible()

  await page.goto('/contact')
  await page.getByLabel('Your name').fill('habibi')
  await page.getByLabel('Email address').fill('8amhabibi@gmail.com')
  await page.getByLabel('What’s on your mind?').selectOption({ label: 'Corrections and feedback' })
  await page.getByLabel('Your message').fill('End-to-end test message for the editorial inbox and administrator workflow.')
  await page.getByRole('button', { name: /send message/i }).click()
  await expect(page.getByText(/message has been received/i)).toBeVisible()

  await page.goto('/admin/login')
  await signOut(page)
  await page.goto('/admin/login')
  await page.getByLabel('Email address').fill('8amlight@gmail.com')
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: /sign in to admin/i }).click()
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  await page.getByRole('link', { name: 'Stories' }).click()
  await expect(page.getByText('Dangote opens Africa’s biggest IPO')).toBeVisible()

  await page.getByRole('link', { name: 'New story' }).click()
  await page.getByLabel('Headline').fill(temporaryTitle)
  await page.getByLabel('Summary').fill('A temporary story used to prove the full administrator create and delete workflow.')
  await page.getByLabel('Status').selectOption('draft')
  await page.getByLabel('Upload story image').setInputFiles('public/logo.png')
  await expect(page.getByAltText('Story image preview')).toBeVisible()
  await expect(page.getByLabel('Image URL')).toHaveValue(/\/uploads\/.*\.png$/)
  await page.getByLabel(/Article body/).fill('This draft verifies that authorized staff can create editorial content.\n\nIt is removed at the end of the same test.')
  await page.getByRole('button', { name: 'Create story' }).click()
  await expect(page.getByText(temporaryTitle)).toBeVisible()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('row', { name: temporaryTitle }).getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText(temporaryTitle)).toHaveCount(0)

  await page.getByRole('link', { name: 'Authors', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Authors' })).toBeVisible()
  await expect(page.getByText('Maya Okafor')).toBeVisible()
  const adminAuthorName=`Test Author ${Date.now()}`
  await page.getByLabel('Author name').fill(adminAuthorName)
  await page.getByLabel('Author biography').fill('Temporary public author profile for the administrator test.')
  await page.getByLabel('Additional likes').fill('12')
  await page.getByLabel('Additional followers').fill('34')
  await page.getByRole('button', { name: 'Add author' }).click()
  const adminAuthorRow=page.getByRole('row', { name:new RegExp(adminAuthorName) })
  await expect(adminAuthorRow).toContainText('12')
  await expect(adminAuthorRow).toContainText('34')
  page.once('dialog',dialog=>dialog.accept())
  await adminAuthorRow.getByRole('button',{name:'Delete'}).click()

  await page.getByRole('link', { name: 'Moderation' }).click()
  await expect(page.getByText('This is a major moment for African capital markets.').first()).toBeVisible()
  await page.getByRole('link', { name: 'Contacts' }).click()
  await expect(page.getByText('End-to-end test message for the editorial inbox').first()).toBeVisible()
  await page.getByRole('link', { name: 'Users' }).click()
  await expect(page.getByText('8amhabibi@gmail.com')).toBeVisible()
  expect(browserErrors).toEqual([])
})
