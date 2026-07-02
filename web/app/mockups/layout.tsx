// /mockups is an internal scratch page (logo experiments). Keep it out of the
// index — the client-component page can't export metadata itself.
export const metadata = { robots: { index: false, follow: false } };

export default function MockupsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
