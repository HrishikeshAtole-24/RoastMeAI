import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800', '900'],
  subsets: ["latin"],
  variable: "--font-poppins",
});

const inter = Inter({
  weight: ['400', '500', '600'],
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "RoastMe AI 🔥 | Get Roasted by Artificial Intelligence",
  description: "Think you can handle it? Let AI roast your existence with savage, personalized burns. Choose your pain level: Soft, Medium, or BRUTAL.",
  keywords: ["AI roast", "roast me", "funny AI", "comedy AI", "Groq AI", "roast generator"],
  authors: [{ name: "Hrishikesh" }],
  openGraph: {
    title: "RoastMe AI 🔥 | Get Roasted by Artificial Intelligence",
    description: "Think you can handle it? Let AI roast your existence with savage, personalized burns.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" 
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer" 
        />
      </head>
      <body className={`${poppins.variable} ${inter.variable}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
