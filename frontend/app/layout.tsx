import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WorkflowAI - Visual Workflow Automation',
  description: 'Build AI-powered workflows with a visual editor',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white">
        {children}
      </body>
    </html>
  );
}
