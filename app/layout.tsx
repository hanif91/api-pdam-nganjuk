export const metadata = {
  title: 'Api PDAM NGANJUK',
  description: 'Api PDAM NGANJUK',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
