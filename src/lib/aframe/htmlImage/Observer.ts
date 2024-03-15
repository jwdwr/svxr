import type { ExtendedHTMLElement } from './interfaces';

export class Observer {
	private observer: MutationObserver;
	private nowatch = false;
	private config = {
		attributes: true,
		childList: true,
		subtree: true
	};

	constructor(
		private html: HTMLElement,
		private requestRender: () => void
	) {
		// Timer used to limit the re-renders due to DOM updates
		let timer: NodeJS.Timeout | false = false;

		// Setup the mutation observer
		const observer = new MutationObserver((mutationsList) => {
			// Don't update if we are manipulating DOM for render
			if (this.nowatch) return;

			for (let i = 0; i < mutationsList.length; i++) {
				const target = mutationsList[i].target as ExtendedHTMLElement;
				// Skip the emebed html element if attributes change
				if (target == this.html && mutationsList[i].type == 'attributes') continue;

				// If a class changes has no style change then there is no need to rerender
				if (!target.styleRef || mutationsList[i].attributeName == 'class') {
					const styleRef = this.csssig(target);
					if (target.styleRef == styleRef) {
						continue;
					}
					target.styleRef = styleRef;
				}

				// Limit render rate so if we get multiple updates per frame we only do once.
				if (!timer) {
					timer = setTimeout(() => {
						this.requestRender();
						timer = false;
					});
				}
			}
		});
		this.observer = observer;
	}

	initialize() {
		this.observer.observe(this.html, this.config);
	}

	// Cleans up all eventlistners, etc when they are no longer needed
	cleanUp() {
		// Stop observing for changes
		this.observer.disconnect();
	}

	// Simple hash function used for style signature
	dbj2(text: string) {
		let hash = 5381,
			c;
		for (let i = 0; i < text.length; i++) {
			c = text.charCodeAt(i);
			hash = (hash << 5) + hash + c;
		}
		return hash;
	}

	// Generate a singature for the current styles so we know if updated
	csssig(el: ExtendedHTMLElement) {
		if (!el.classCache) el.classCache = {};
		if (!el.classCache[el.className]) {
			const styles = getComputedStyle(el);
			let style = '';
			for (let i = 0; i < styles.length; i++) {
				style += styles[styles[i]];
			}
			el.classCache[el.className] = this.dbj2(style);
		}
		return el.classCache[el.className];
	}
}
