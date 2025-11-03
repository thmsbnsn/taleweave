import type { Metadata } from 'next'
import { Fredoka, Nunito } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'

const fredoka = localFont({
  src: '../Fonts/Fredoka-VariableFont_wdth,wght.woff2',
  variable: '--font-fredoka',
  display: 'swap',
})

const nunito = localFont({
  src: '../Fonts/Nunito-VariableFont_wght.woff2',
  variable: '--font-nunito',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Tale Weave - AI-Generated Children\'s Stories',
  description: 'Create custom children\'s stories with AI-generated text, images, and audio narration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${fredoka.variable} ${nunito.variable} font-nunito`}>
        {children}
      </body>
    </html>
  )
}

