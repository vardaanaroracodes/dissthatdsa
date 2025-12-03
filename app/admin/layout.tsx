export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Admin subtree gets its own layout (no RetroGrid from root)
  return <>{children}</>;
}
