import { assertAdmin } from "@/lib/admin/guard";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	await assertAdmin();
	return (
		<div className="md:flex items-start min-h-[70vh]">
			<AdminNav />
			<main className="flex-1 min-w-0">{children}</main>
		</div>
	);
}
