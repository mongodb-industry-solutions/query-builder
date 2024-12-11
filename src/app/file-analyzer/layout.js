import { GeistSans } from "geist/font/sans";

export const metadata = {
  title: "Table View",
  description: "",
};

export default function Example({ children }) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body>{children}</body>
    </html>
  );
}
