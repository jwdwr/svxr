/* eslint-disable no-prototype-builtins */
import { Embedder } from './Embedder';
import { Listener } from './Listener';
import { Observer } from './Observer';
import type { ExtendedHTMLElement } from './interfaces';

const SCALE = 2;

export class HTMLImage {
	// Image used to draw SVG to the canvas element
	public img = new Image();

	private width = 0;
	private height = 0;

	public innerWidth = 0;
	public innerHeight = 0;

	// Create the canvas to be drawn to
	public canvas = document.createElement('canvas') as HTMLCanvasElement;
	private ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
	private serializer = new XMLSerializer();

	public observer: Observer;
	public listener: Listener;
	public embedder: Embedder;

	constructor(
		private html: HTMLElement,
		private useCanvas: boolean,
		private updateCallback: () => void,
		private eventCallback: (event: string, data?: unknown) => void
	) {
		this.listener = new Listener(html, this.svgToImg.bind(this), this.eventCallback);
		this.observer = new Observer(html, this.svgToImg.bind(this));
		this.embedder = new Embedder(html);

		this.listener.initialize();
		this.observer.initialize();

		this.html.style.display = 'block';
		this.html.style.display = 'none';
		this.html.style.position = 'absolute';
		this.html.style.top = '0';
		this.html.style.left = '0';
		this.html.style.overflow = 'hidden';

		// When image content has changed render it to the canvas
		this.img.addEventListener('load', () => {
			this.render();
		});
	}

	cleanUp() {
		this.observer.cleanUp();
		this.listener.cleanUp();
	}

	// Forces a complete rerender
	forceRender() {
		// Clear any class hash as this may have changed
		Array.from(document.querySelectorAll('*')).map(
			(ele) => ((ele as ExtendedHTMLElement).classCache = {})
		);
		// Load the svg to the image
		this.svgToImg();
	}

	// Get all parents of the embeded html as these can effect the resulting styles
	getParents() {
		const opens = [];
		const closes = [];
		let parent = this.html.parentNode as HTMLElement;
		do {
			let tag = parent.tagName.toLowerCase();
			if (tag.substr(0, 2) == 'a-') tag = 'div'; // We need to replace A-Frame tags with div as they're not valid xhtml so mess up the rendering of images
			const open =
				'<' +
				(tag == 'body' ? 'body xmlns="http://www.w3.org/1999/xhtml"' : tag) +
				' style="transform: none;left: 0;top: 0;position:static;display: block" class="' +
				parent.className +
				'"' +
				(parent.id ? ' id="' + parent.id + '"' : '') +
				'>';
			opens.unshift(open);
			const close = '</' + tag + '>';
			closes.push(close);
			if (tag == 'body') break;
		} while ((parent = parent.parentNode as HTMLElement));
		return [opens.join(''), closes.join('')];
	}

	// Set the src to be rendered to the Image
	svgToImg() {
		this.listener.updateFocusBlur();
		Promise.all([this.embedder.embededSVG(), this.embedder.generatePageCSS()]).then(() => {
			// Make sure the element is visible before processing
			this.html.style.display = 'block';
			// If embeded html elements dimensions have change then update the canvas
			if (this.width != this.html.offsetWidth || this.height != this.html.offsetHeight) {
				this.innerWidth = this.html.offsetWidth;
				this.innerHeight = this.html.offsetHeight;
				this.width = this.html.offsetWidth * SCALE;
				this.height = this.html.offsetHeight * SCALE;
				this.canvas.width = this.width;
				this.canvas.height = this.height;
				if (this.eventCallback) this.eventCallback('resized'); // Notify a resize has happened
			}
			let docString = this.serializer.serializeToString(this.html);
			const parent = this.getParents();
			docString =
				'<svg width="' +
				this.width +
				'" height="' +
				this.height +
				'" xmlns="http://www.w3.org/2000/svg"><defs><style type="text/css"><![CDATA[a[href]{color:#0000EE;text-decoration:underline;}' +
				this.embedder.cssembed.join('') +
				']]></style></defs><foreignObject x="0" y="0" width="' +
				this.width +
				'" height="' +
				this.height +
				`" transform="scale(${SCALE})">` +
				parent[0] +
				docString +
				parent[1] +
				'</foreignObject></svg>';
			this.img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(docString);
			// Hide the html after processing
			this.html.style.display = 'none';
		});
	}

	// Renders the image containing the SVG to the Canvas
	render() {
		if (this.useCanvas) {
			this.canvas.width = this.width;
			this.canvas.height = this.height;
			this.ctx.imageSmoothingEnabled = true;
			this.ctx.imageSmoothingQuality = 'high';
			this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
			this.ctx.drawImage(this.img, 0, 0);
		}
		if (this.updateCallback) this.updateCallback();
		if (this.eventCallback) this.eventCallback('rendered');
	}
}
