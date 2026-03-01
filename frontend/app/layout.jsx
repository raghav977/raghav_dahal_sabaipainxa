import './globals.css'
import Providers from './providers/ReduxProvider'
import HeaderNavbar from './landingpagecomponents/components/HeaderNavbar'
import { DM_Sans, IBM_Plex_Sans, Playfair_Display } from "next/font/google";
import localFont from 'next/font/local';
import LoadingIndicator from './loading_indicator';

const dmSans = DM_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-dm-sans'
})

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-ibm-plex-sans'
})

const playfairDisplay = Playfair_Display({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-playfair-display'
})

const feixenSans = localFont({
  src: '../public/fonts/FeixenSans-Regular.otf',
  variable: '--font-feixen-sans'
})

export const metadata = {
  title: 'KAAM CHAA',
  description: 'Created BY DIGITALPATHSALA',
  generator: 'DIGITAL PATHSALA',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${ibmPlexSans.variable} ${playfairDisplay.variable} ${feixenSans.variable} font-feixen`}>
        <nav>
          {/* <HeaderNavbar /> */}
        </nav>
        <Providers>
          <LoadingIndicator />
          {children}
        </Providers>
      </body>
    </html>
  )
}
