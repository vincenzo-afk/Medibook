import type { Metadata } from 'next'

import '@/app/globals.css'

export const metadata: Metadata = {
  title: 'MediBook — Hospital Appointment Booking',
  description:
    'Find doctors, book appointments in seconds, and manage e-prescriptions. Dark, fast, Linear-grade UX.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-canvas text-ink antialiased">{children}</body>
    </html>
  )
}
