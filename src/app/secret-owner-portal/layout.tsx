import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Portal | Bee Vibe",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noimageindex: true,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
