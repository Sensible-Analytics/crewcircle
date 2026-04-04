import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://crewcircle.co'),
  title: {
    default: 'CrewCircle - Australian Workforce Management for SMBs',
    template: '%s | CrewCircle',
  },
  description: 'Roster scheduling, time tracking, and team management for Australian cafes, retail shops, and service businesses. GPS-verified time clock, Fair Work Act compliant.',
  keywords: [
    'workforce management',
    'employee scheduling',
    'rostering software',
    'time tracking',
    'GPS time clock',
    'Australian business',
    'cafe roster',
    'retail scheduling',
    'small business tools',
    'Fair Work Act compliance',
    'employee management',
    'shift planning',
  ],
  authors: [{ name: 'CrewCircle', url: 'https://crewcircle.co' }],
  creator: 'CrewCircle',
  publisher: 'CrewCircle',
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: 'https://crewcircle.co',
    siteName: 'CrewCircle',
    title: 'CrewCircle - Australian Workforce Management for SMBs',
    description: 'Roster scheduling, time tracking, and team management for Australian cafes, retail shops, and service businesses.',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'CrewCircle - Australian Workforce Management',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CrewCircle - Australian Workforce Management for SMBs',
    description: 'Roster scheduling, time tracking, and team management for Australian cafes, retail shops, and service businesses.',
    images: ['/og-image.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://crewcircle.co',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en-AU"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    </ClerkProvider>
  );
}
