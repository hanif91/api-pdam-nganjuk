export const metadata = {
  title: 'Api Perumdam Trunojoyo',
  description: 'Api Perumdam Trunojoyo',
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
