import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'VERDICT | The Digital Colosseum',
  description: 'High-stakes competitive discourse validated by unbiased AI judging.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
