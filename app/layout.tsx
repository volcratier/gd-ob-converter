import '../styles/globals.css' // ここでデザインの場所を教えてあげます


export const metadata = {
  title: "GD↔OB Converter | GDevelop × Obsidian",
  description: "GDevelopの構造体・配列変数とObsidianを繋ぐ、シナリオ制作に最適なデータ変換ツール",
  openGraph: {
    title: "GD↔OB Converter",
    description: "Obsidianのリスト形式をGDevelop用JSONに一瞬で変換！",
    url: "https://gd-ob-converter.vercel.app/",
    siteName: "GD↔OB Converter",
    type: "website",
  },
};

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