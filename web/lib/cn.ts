import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Class-name helper. clsx resolves conditionals/arrays/objects; tailwind-merge
// dedupes conflicting Tailwind utilities (last wins) so `cn("p-2", "p-4")` → "p-4".
// shadcn primitives assume this behaviour; brand components that passed plain
// strings keep working unchanged.
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}
