import "./globals.css";

export const metadata = {
  title: "Golf Passport",
  description: "Your golf world. Track the courses you've played and the ones you want to play.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}