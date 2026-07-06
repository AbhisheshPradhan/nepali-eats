import type { ComponentType } from "react";
import type { FilterBarMockupProps } from "./filter-bar/shared";
import { DropdownBar } from "./filter-bar/DropdownBar";
import { GroupedFiltersBar } from "./filter-bar/GroupedFiltersBar";
import { TwoRowBar } from "./filter-bar/TwoRowBar";

// Registry of Explore filter-bar mockups for the UI Playground. Each design is
// a self-contained interactive bar (own chip/panel state) framed by the shared
// BarShell. Add a candidate under ./filter-bar/ (props = FilterBarMockupProps)
// and list it here. When one wins, port the pattern into ExploreClient's top
// bar and remove it from this list.
export type FilterBarMockup = {
	id: string;
	label: string;
	Component: ComponentType<FilterBarMockupProps>;
};

export const FILTER_BAR_MOCKUPS: FilterBarMockup[] = [
	{ id: "dropdown", label: "Dropdown bar", Component: DropdownBar },
	{ id: "grouped", label: "Grouped panel", Component: GroupedFiltersBar },
	{ id: "two-row", label: "Two-row budget", Component: TwoRowBar },
];
