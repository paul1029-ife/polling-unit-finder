import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Unit Finder · Nigeria’s polling-unit directory",
  description:
    "Find INEC polling units by state, local government, ward, name or code. An independent civic utility.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
