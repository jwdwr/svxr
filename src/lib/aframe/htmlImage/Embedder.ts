export class Embedder {
	private cssgenerated: Element[]; // Remeber what css sheets have already been passed
	public cssembed: string[]; // The text of the css to included in the SVG to render
	constructor(private html: HTMLElement) {
		// Add css hacks to current styles to ensure that the styles can be rendered to canvas
		this.csshack();
		this.cssgenerated = [];
		this.cssembed = [];
	}

	// Add hack css rules to the page so they will update the css styles of the embed html
	csshack() {
		const sheets = document.styleSheets;
		for (let i = 0; i < sheets.length; i++) {
			try {
				const rules = sheets[i].cssRules;
				const toadd = [];
				for (let j = 0; j < rules.length; j++) {
					if (rules[j].cssText.indexOf(':hover') > -1) {
						toadd.push(rules[j].cssText.replace(new RegExp(':hover', 'g'), '.hoverhack'));
					}
					if (rules[j].cssText.indexOf(':active') > -1) {
						toadd.push(rules[j].cssText.replace(new RegExp(':active', 'g'), '.activehack'));
					}
					if (rules[j].cssText.indexOf(':focus') > -1) {
						toadd.push(rules[j].cssText.replace(new RegExp(':focus', 'g'), '.focushack'));
					}
					if (rules[j].cssText.indexOf(':target') > -1) {
						toadd.push(rules[j].cssText.replace(new RegExp(':target', 'g'), '.targethack'));
					}
					const idx = toadd.indexOf(rules[j].cssText);
					if (idx > -1) {
						toadd.splice(idx, 1);
					}
				}
				for (let j = 0; j < toadd.length; j++) {
					sheets[i].insertRule(toadd[j]);
				}
			} catch (e) {
				console.error('Error applying css hack', e);
			}
		}
	}

	// Does what it says on the tin
	arrayBufferToBase64(bytes: ArrayBuffer) {
		let binary = '';
		const len = bytes.byteLength;
		for (let i = 0; i < len; i++) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			binary += String.fromCharCode((bytes as any)[i]);
		}
		return window.btoa(binary);
	}

	// Get an embeded version of the css for use in img svg
	// url - baseref of css so we know where to look up resourses
	// css - string content of the css
	embedCss(url: string | URL, css: string): Promise<string> {
		return new Promise((resolve) => {
			let found;
			const promises = [];

			// Add hacks to get selectors working on img
			css = css.replace(new RegExp(':hover', 'g'), '.hoverhack');
			css = css.replace(new RegExp(':active', 'g'), '.activehack');
			css = css.replace(new RegExp(':focus', 'g'), '.focushack');
			css = css.replace(new RegExp(':target', 'g'), '.targethack');

			// Replace all urls in the css
			const regEx = RegExp(/url\((?!['"]?(?:data):)['"]?([^'")]*)['"]?\)/gi);
			while ((found = regEx.exec(css))) {
				promises.push(
					this.getDataURL(new URL(found[1], url)).then(
						((found) => {
							return (url) => {
								css = css.replace(found[1], url);
							};
						})(found)
					)
				);
			}
			Promise.all(promises).then(() => {
				resolve(css);
			});
		});
	}

	// Does what is says on the tin
	getURL(url: string | URL): Promise<XMLHttpRequest> {
		url = new URL(url, window.location.href).href;
		return new Promise((resolve) => {
			const xhr = new XMLHttpRequest();

			xhr.open('GET', url, true);

			xhr.responseType = 'arraybuffer';

			xhr.onload = () => {
				resolve(xhr);
			};

			xhr.send();
		});
	}

	// Generate the embed page CSS from all the page styles
	generatePageCSS() {
		// Fine all elements we are intrested in
		const elements = Array.from(
			document.querySelectorAll("style, link[type='text/css'],link[rel='stylesheet']")
		);
		const promises = [];
		for (let i = 0; i < elements.length; i++) {
			const element = elements[i];
			if (this.cssgenerated.indexOf(element) == -1) {
				// Make sure all css hacks have been applied to the page
				this.csshack();
				// Get embed version of style elements
				const idx = this.cssgenerated.length;
				this.cssgenerated.push(element);
				if (element.tagName == 'STYLE') {
					promises.push(
						this.embedCss(window.location.href, element.innerHTML).then(
							((element, idx) => {
								return (css) => {
									this.cssembed[idx] = css;
								};
							})(element, idx)
						)
					);
				} else {
					// Get embeded version of externally link stylesheets
					promises.push(
						this.getURL(element.getAttribute('href') ?? '').then(
							((idx) => {
								return (xhr) => {
									const css = new TextDecoder('utf-8').decode(xhr.response);
									return this.embedCss(window.location.href, css).then(
										((element, idx) => {
											return (css) => {
												this.cssembed[idx] = css;
											};
										})(element, idx)
									);
								};
							})(idx)
						)
					);
				}
			}
		}
		return Promise.all(promises);
	}

	// Generate and returns a dataurl for the given url
	getDataURL(url: string | URL): Promise<string> {
		return new Promise((resolve) => {
			this.getURL(url).then((xhr) => {
				const arr = new Uint8Array(xhr.response);
				const contentType = xhr.getResponseHeader('Content-Type')?.split(';')[0];
				if (contentType == 'text/css') {
					const css = new TextDecoder('utf-8').decode(arr);
					this.embedCss(url, css).then((css) => {
						const base64 = window.btoa(css);
						if (base64.length > 0) {
							const dataURL = 'data:' + contentType + ';base64,' + base64;
							resolve(dataURL);
						} else {
							resolve('');
						}
					});
				} else {
					const b64 = this.arrayBufferToBase64(arr);
					const dataURL = 'data:' + contentType + ';base64,' + b64;
					resolve(dataURL);
				}
			});
		});
	}

	// Embeds and externally linked elements for rendering to img
	embededSVG() {
		const promises = [];
		const elements = this.html.querySelectorAll('*');
		for (let i = 0; i < elements.length; i++) {
			// convert and xlink:href to standard href
			const link = elements[i].getAttributeNS('http://www.w3.org/1999/xlink', 'href');
			if (link) {
				promises.push(
					this.getDataURL(link).then(
						((element) => {
							return (dataURL) => {
								element.removeAttributeNS('http://www.w3.org/1999/xlink', 'href');
								element.setAttribute('href', dataURL);
							};
						})(elements[i])
					)
				);
			}

			// Convert and images to data url
			if (
				elements[i].tagName == 'IMG' &&
				(elements[i] as HTMLImageElement).src.substr(0, 4) != 'data'
			) {
				promises.push(
					this.getDataURL((elements[i] as HTMLImageElement).src).then(
						((element) => {
							return (dataURL) => {
								element.setAttribute('src', dataURL);
							};
						})(elements[i])
					)
				);
			}

			// If there is a style attribute make sure external references are converted to dataurl
			if (
				elements[i].namespaceURI == 'http://www.w3.org/1999/xhtml' &&
				elements[i].hasAttribute('style')
			) {
				const style = elements[i].getAttribute('style');
				promises.push(
					this.embedCss(window.location.href, style ?? '').then(
						((style, element) => {
							return (css) => {
								if (style != css) element.setAttribute('style', css);
							};
						})(style, elements[i])
					)
				);
			}
		}
		// If there are any inline style within the embeded html make sure they have the selector hacks
		const styles = this.html.querySelectorAll('style');
		for (let i = 0; i < styles.length; i++) {
			promises.push(
				this.embedCss(window.location.href, styles[i].innerHTML).then(
					((style) => {
						return (css) => {
							if (style.innerHTML != css) style.innerHTML = css;
						};
					})(styles[i])
				)
			);
		}
		return Promise.all(promises);
	}
}
