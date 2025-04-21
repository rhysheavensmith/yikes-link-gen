import "./globals.css";

export const metadata = {
  title: "Business Link Generator",
  description: "Generate business links",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
