import { GeistSans } from "geist/font/sans";

export const metadata = {
  title: "Query Builder",
  description: "",
};

export default function Example({ children }) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body>{children}</body>
    </html>
  );
}
