"use client";

import { useCallback, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
import { cn } from "@/lib/cn";

type ConfirmOptions = {
	title: string;
	description?: string;
	confirmText?: string;
	cancelText?: string;
	destructive?: boolean;
};

// Promise-based confirm on a shadcn AlertDialog, so imperative call sites read
// almost like the old window.confirm:
//   if (!(await confirm({ title: "Delete this photo?", destructive: true })) return;
// Render the returned `confirmDialog` once in the component tree.
export function useConfirm() {
	const [opts, setOpts] = useState<ConfirmOptions | null>(null);
	const [resolver, setResolver] = useState<{ fn: (v: boolean) => void } | null>(
		null,
	);

	const confirm = useCallback(
		(o: ConfirmOptions) =>
			new Promise<boolean>((resolve) => {
				setOpts(o);
				setResolver({ fn: resolve });
			}),
		[],
	);

	const settle = (value: boolean) => {
		resolver?.fn(value);
		setResolver(null);
		setOpts(null);
	};

	const confirmDialog = (
		<AlertDialog
			open={!!opts}
			onOpenChange={(open) => {
				if (!open) settle(false);
			}}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{opts?.title}</AlertDialogTitle>
					{opts?.description && (
						<AlertDialogDescription>{opts.description}</AlertDialogDescription>
					)}
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={() => settle(false)}>
						{opts?.cancelText ?? "Cancel"}
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => settle(true)}
						className={cn(
							opts?.destructive &&
								"bg-destructive text-destructive-foreground hover:bg-destructive/90",
						)}
					>
						{opts?.confirmText ?? "Confirm"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);

	return { confirm, confirmDialog };
}
