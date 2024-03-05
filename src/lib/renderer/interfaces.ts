declare global {
	interface Window {
		clearedHash: string;
	}
}

export interface ExtendedHTMLElement extends HTMLElement {
	styleRef?: number;
	classCache?: Record<string, number>;
}
