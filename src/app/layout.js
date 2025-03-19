import './globals.css'

export const metadata = {
  title: 'Query Builder',
  description: 'Query Builder Application',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}