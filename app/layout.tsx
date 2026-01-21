import '../styles/globals.css' // ここでデザインの場所を教えてあげます

export const metadata = {
  title: 'Text To JSON',
  description: 'GDevelop Converter',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}