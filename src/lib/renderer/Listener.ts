/* eslint-disable no-prototype-builtins */
import type { ExtendedHTMLElement } from './interfaces';
import * as AFRAME from 'aframe';
const { THREE } = AFRAME;

interface ElementAtResult {
	zIndex: number;
	ele: HTMLElement | null;
	level: number;
}

export class Listener {
	private focusElement: HTMLElement | null = null;
	private overElements: HTMLElement[] = [];
	private lastEle: HTMLElement | null = null;
	private activeElement: HTMLElement | null = null;
	private mousedownElement: HTMLElement | null = null;
	private moveTimer: NodeJS.Timeout | false = false;
	private moveX = 0;
	private moveY = 0;
	private moveButton = 0;
	private mousemovehtml: (e: MouseEvent) => void;
	private hashChangeEvent: () => void;

	constructor(
		private html: HTMLElement,
		private requestRender: () => void,
		private eventCallback: (event: string, data: unknown) => void
	) {
		this.overElements = []; // Element currently in the hover state
		this.focusElement = null; // The element that currently has focus
		// We have to stop propergation of the mouse at the root of the embed HTML otherwise it may effect other elements of the page
		this.mousemovehtml = (e) => {
			e.stopPropagation();
		};
		// We need to change targethack when windows has location changes
		this.hashChangeEvent = () => {
			this.hashChanged();
		};
	}

	initialize() {
		this.html.addEventListener('mousemove', this.mousemovehtml);

		window.addEventListener('hashchange', this.hashChangeEvent, false);

		// Trigger an initially hash change to set up targethack classes
		this.hashChanged();
	}

	// Updates the targethack class when a Hash is changed
	hashChanged() {
		if (window.clearedHash != window.location.hash) {
			Array.from(document.querySelectorAll('*')).map(
				(ele) => ((ele as ExtendedHTMLElement).classCache = {})
			);
			const currentTarget = document.querySelector('.targethack');
			if (currentTarget) {
				currentTarget.classList.remove('targethack');
			}
			if (window.location.hash) {
				const newTarget = document.querySelector(window.location.hash);
				if (newTarget) {
					newTarget.classList.add('targethack');
				}
			}
		}
		window.clearedHash = window.location.hash;
		this.requestRender();
	}

	// Cleans up all eventlistners, etc when they are no longer needed
	cleanUp() {
		// Remove event listeners
		window.removeEventListener('hashchange', this.hashChangeEvent);
		this.html.addEventListener('mousemove', this.mousemovehtml);
	}

	// Transforms a point into an elements frame of reference
	transformPoint(
		elementStyles: CSSStyleDeclaration,
		x: number,
		y: number,
		offsetX: number,
		offsetY: number
	) {
		// Get the elements tranform matrix
		const transformcss = elementStyles['transform'];
		let transform = new THREE.Matrix4();
		if (transformcss.indexOf('matrix(') == 0) {
			const mat = transformcss
				.substring(7, transformcss.length - 1)
				.split(', ')
				.map(parseFloat);
			transform.elements[0] = mat[0];
			transform.elements[1] = mat[1];
			transform.elements[4] = mat[2];
			transform.elements[5] = mat[3];
			transform.elements[12] = mat[4];
			transform.elements[13] = mat[5];
		} else if (transformcss.indexOf('matrix3d(') == 0) {
			const transform = new THREE.Matrix4();
			const mat = transformcss
				.substring(9, transformcss.length - 1)
				.split(', ')
				.map(parseFloat);
			transform.elements = mat;
		} else {
			const z = 0;
			return [x, y, z];
		}
		// Get the elements tranform origin
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let origincss: any = elementStyles.transformOrigin;
		origincss = origincss.replace(new RegExp('px', 'g'), '').split(' ').map(parseFloat);

		// Apply the transform to the origin
		const ox = offsetX + origincss[0];
		const oy = offsetY + origincss[1];
		let oz = 0;
		if (origincss[2]) oz += origincss[2];

		const T1 = new THREE.Matrix4().makeTranslation(-ox, -oy, -oz);
		const T2 = new THREE.Matrix4().makeTranslation(ox, oy, oz);

		transform = T2.multiply(transform).multiply(T1);

		// return if matrix determinate is not zero
		if (transform.determinant() != 0) return [x, y];

		// Inverse the transform so we can go from page space to element space
		const inverse = transform.invert();

		// Calculate a ray in the direction of the plane
		const v1 = new THREE.Vector3(x, y, 0);
		const v2 = new THREE.Vector3(x, y, -1);
		v1.applyMatrix4(inverse);
		v2.applyMatrix4(inverse);
		const dir = v2.sub(v1).normalize();

		// If ray is parallel to the plane then there is no intersection
		if (dir.z == 0) {
			return false;
		}

		// Get the point of intersection on the element plane
		const result = dir.multiplyScalar(-v1.z / dir.z).add(v1);

		return [result.x, result.y];
	}

	// Get the absolute border radii for each corner
	getBorderRadii(element: HTMLElement, style: CSSStyleDeclaration) {
		const properties = [
			'border-top-left-radius',
			'border-top-right-radius',
			'border-bottom-right-radius',
			'border-bottom-left-radius'
		];
		let result: RegExpExecArray | null;
		// Parse the css results
		const corners: { value: number; unit: 'px' | '%' }[][] = [];
		for (let i = 0; i < properties.length; i++) {
			const borderRadiusString = (style as unknown as Record<string, string>)[properties[i]];
			const reExp = /(\d*)([a-z%]{1,3})/gi;
			const rec = [];
			while ((result = reExp.exec(borderRadiusString))) {
				rec.push({
					value: Number(result[1]),
					unit: result[2] as 'px' | '%'
				});
			}
			if (rec.length == 1) rec.push(rec[0]);
			corners.push(rec);
		}

		// Convertion values
		const unitConv = {
			px: 1,
			'%': element.offsetWidth / 100
		};

		// Convert all corners into pixels
		const pixelCorners = [];
		for (let i = 0; i < corners.length; i++) {
			const corner = corners[i];
			const rec = [];
			for (let j = 0; j < corner.length; j++) {
				rec.push(corner[j].value * unitConv[corner[j].unit]);
			}
			pixelCorners.push(rec);
		}

		// Initial corner point scales
		let c1scale = 1;
		let c2scale = 1;
		let c3scale = 1;
		let c4scale = 1;
		let f: number;

		// Change scales of top left and top right corners based on offsetWidth
		const borderTop = pixelCorners[0][0] + pixelCorners[1][0];
		if (borderTop > element.offsetWidth) {
			const f = (1 / borderTop) * element.offsetWidth;
			c1scale = Math.min(c1scale, f);
			c2scale = Math.min(c2scale, f);
		}

		// Change scales of bottom right and top right corners based on offsetHeight
		const borderLeft = pixelCorners[1][1] + pixelCorners[2][1];
		if (borderLeft > element.offsetHeight) {
			f = (1 / borderLeft) * element.offsetHeight;
			c3scale = Math.min(c3scale, f);
			c2scale = Math.min(c2scale, f);
		}

		// Change scales of bottom left and bottom right corners based on offsetWidth
		const borderBottom = pixelCorners[2][0] + pixelCorners[3][0];
		if (borderBottom > element.offsetWidth) {
			f = (1 / borderBottom) * element.offsetWidth;
			c3scale = Math.min(c3scale, f);
			c4scale = Math.min(c4scale, f);
		}

		// Change scales of bottom left and top right corners based on offsetHeight
		const borderRight = pixelCorners[0][1] + pixelCorners[3][1];
		if (borderRight > element.offsetHeight) {
			f = (1 / borderRight) * element.offsetHeight;
			c1scale = Math.min(c1scale, f);
			c4scale = Math.min(c4scale, f);
		}

		// Scale the corners to fix within the confines of the element
		pixelCorners[0][0] = pixelCorners[0][0] * c1scale;
		pixelCorners[0][1] = pixelCorners[0][1] * c1scale;
		pixelCorners[1][0] = pixelCorners[1][0] * c2scale;
		pixelCorners[1][1] = pixelCorners[1][1] * c2scale;
		pixelCorners[2][0] = pixelCorners[2][0] * c3scale;
		pixelCorners[2][1] = pixelCorners[2][1] * c3scale;
		pixelCorners[3][0] = pixelCorners[3][0] * c4scale;
		pixelCorners[3][1] = pixelCorners[3][1] * c4scale;

		return pixelCorners;
	}

	// Check that the element is with the confines of rounded corners
	checkInBorder(
		element: HTMLElement,
		style: CSSStyleDeclaration,
		x: number,
		y: number,
		left: number,
		top: number
	) {
		if (style.borderRadius == '0px') return true;
		const width = element.offsetWidth;
		const height = element.offsetHeight;
		const corners = this.getBorderRadii(element, style);

		// Check top left corner
		if (x < corners[0][0] + left && y < corners[0][1] + top) {
			const x1 = (corners[0][0] + left - x) / corners[0][0];
			const y1 = (corners[0][1] + top - y) / corners[0][1];
			if (x1 * x1 + y1 * y1 > 1) {
				return false;
			}
		}
		// Check top right corner
		if (x > left + width - corners[1][0] && y < corners[1][1] + top) {
			const x1 = (x - (left + width - corners[1][0])) / corners[1][0];
			const y1 = (corners[1][1] + top - y) / corners[1][1];
			if (x1 * x1 + y1 * y1 > 1) {
				return false;
			}
		}
		// Check bottom right corner
		if (x > left + width - corners[2][0] && y > top + height - corners[2][1]) {
			const x1 = (x - (left + width - corners[2][0])) / corners[2][0];
			const y1 = (y - (top + height - corners[2][1])) / corners[2][1];
			if (x1 * x1 + y1 * y1 > 1) {
				return false;
			}
		}
		// Check bottom left corner
		if (x < corners[3][0] + left && y > top + height - corners[3][1]) {
			const x1 = (corners[3][0] + left - x) / corners[3][0];
			const y1 = (y - (top + height - corners[3][1])) / corners[3][1];
			if (x1 * x1 + y1 * y1 > 1) {
				return false;
			}
		}
		return true;
	}

	// Check if element it under the current position
	// x,y - the position to check
	// offsetx, offsety - the current left and top offsets
	// offsetz - the current z offset on the current z-index
	// level - the current z-index
	// element - element being tested
	// result - the final result of the hover target
	checkElement(
		x: number,
		y: number,
		offsetx: number,
		offsety: number,
		offsetz: number,
		level: number,
		element: HTMLElement,
		result: ElementAtResult
	) {
		// Return if this element isn't visible
		if (!element.offsetParent) return;

		const style = window.getComputedStyle(element);

		// Calculate absolute position and dimensions
		const left = element.offsetLeft + offsetx;
		const top = element.offsetTop + offsety;
		const width = element.offsetWidth;
		const height = element.offsetHeight;

		const zIndex = style.zIndex;
		if (zIndex != 'auto') {
			offsetz = 0;
			level = parseInt(zIndex);
		}

		// If the element isn't static the increment the offsetz
		if (style['position'] != 'static' && element != this.html) {
			if (zIndex == 'auto') offsetz += 1;
		}
		// If there is a transform then transform point
		if (
			(style['display'] == 'block' || style['display'] == 'inline-block') &&
			style['transform'] != 'none'
		) {
			// Apply css transforms to click point
			const newcoord = this.transformPoint(style, x, y, left, top);
			if (!newcoord) return;
			x = newcoord[0];
			y = newcoord[1];
			if (zIndex == 'auto') offsetz += 1;
		}
		// Check if in confines of bounding box
		if (x > left && x < left + width && y > top && y < top + height) {
			// Check if in confines of rounded corders
			if (this.checkInBorder(element, style, x, y, left, top)) {
				//check if above other elements
				if (
					(offsetz >= result.zIndex || level > result.level) &&
					level >= result.level &&
					style.pointerEvents != 'none'
				) {
					result.zIndex = offsetz;
					result.ele = element;
					result.level = level;
				}
			}
		} else if (style['overflow'] != 'visible') {
			// If the element has no overflow and the point is outsize then skip it's children
			return;
		}
		// Check each of the child elements for intersection of the point
		let child = element.firstChild as HTMLElement | null;
		if (child)
			do {
				if (child.nodeType == 1) {
					if (child.offsetParent == element) {
						this.checkElement(x, y, offsetx + left, offsety + top, offsetz, level, child, result);
					} else {
						this.checkElement(x, y, offsetx, offsety, offsetz, level, child, result);
					}
				}
			} while ((child = child.nextSibling as HTMLElement | null));
	}

	// Gets the element under the given x,y coordinates
	elementAt(x: number, y: number) {
		this.html.style.display = 'block';
		const result: ElementAtResult = {
			zIndex: 0,
			ele: null,
			level: 0
		};
		this.checkElement(x, y, 0, 0, 0, 0, this.html, result);
		this.html.style.display = 'none';
		return result.ele;
	}

	// Process a movment of the mouse
	moveMouse() {
		console.log('moved');
		const x = this.moveX;
		const y = this.moveY;
		const button = this.moveButton;
		const mouseState = {
			screenX: x,
			screenY: y,
			clientX: x,
			clientY: y,
			button: button ? button : 0,
			bubbles: true,
			cancelable: true
		};
		const mouseStateHover = {
			clientX: x,
			clientY: y,
			button: button ? button : 0,
			bubbles: false
		};

		const ele = this.elementAt(x, y);
		// If the element under cusor isn't the same as lasttime then update hoverstates and fire off events
		if (ele != this.lastEle) {
			if (ele) {
				// If the element has a tabIndex then notify of a focusable enter
				if (ele.tabIndex > -1) {
					if (this.eventCallback)
						this.eventCallback('focusableenter', {
							target: ele
						});
				}
				// If the element has a tabIndex then notify of a focusable leave
				if (this.lastEle && this.lastEle.tabIndex > -1) {
					if (this.eventCallback)
						this.eventCallback('focusableleave', {
							target: this.lastEle
						});
				}
				const parents = [];
				let current: HTMLElement | null = ele;
				if (this.lastEle) this.lastEle.dispatchEvent(new MouseEvent('mouseout', mouseState));
				ele.dispatchEvent(new MouseEvent('mouseover', mouseState));
				// Update overElements and fire corresponding events
				do {
					if (current == this.html) break;
					if (this.overElements.indexOf(current) == -1) {
						if (current.classList) current.classList.add('hoverhack');
						current.dispatchEvent(new MouseEvent('mouseenter', mouseStateHover));
						this.overElements.push(current);
					}
					parents.push(current);
				} while ((current = current.parentNode as HTMLElement | null));

				for (let i = 0; i < this.overElements.length; i++) {
					const element = this.overElements[i];
					console.log('maybe clear', this.overElements, parents, parents.indexOf(element));
					if (parents.indexOf(element) == -1) {
						if (element.classList) element.classList.remove('hoverhack');
						element.dispatchEvent(new MouseEvent('mouseleave', mouseStateHover));
						this.overElements.splice(i, 1);
						i--;
					}
				}
			} else {
				let element: HTMLElement | undefined;
				while ((element = this.overElements.pop())) {
					if (element.classList) element.classList.remove('hoverhack');
					element.dispatchEvent(new MouseEvent('mouseout', mouseState));
				}
			}
		}
		if (ele && this.overElements.indexOf(ele) == -1) this.overElements.push(ele);
		this.lastEle = ele;
		if (ele) ele.dispatchEvent(new MouseEvent('mousemove', mouseState));
		this.moveTimer = false;
	}

	// Move the mouse on the html element
	mousemove(x: number, y: number, button: number) {
		this.moveX = x;
		this.moveY = y;
		this.moveButton = button;
		// Limit frames rate of mouse move for performance
		if (this.moveTimer) return;
		this.moveTimer = setTimeout(this.moveMouse.bind(this), 20);
	}

	// Mouse down on the HTML Element
	mousedown(x: number, y: number, button: number) {
		const mouseState = {
			screenX: x,
			screenY: y,
			clientX: x,
			clientY: y,
			button: button ? button : 0,
			bubbles: true,
			cancelable: true
		};
		const ele = this.elementAt(x, y);
		if (ele) {
			this.activeElement = ele;
			ele.classList.add('activehack');
			ele.classList.remove('hoverhack');
			ele.dispatchEvent(new MouseEvent('mousedown', mouseState));
		}
		this.mousedownElement = ele;
	}

	// Sets the element that currently has focus
	setFocus(ele: HTMLElement) {
		ele.dispatchEvent(new FocusEvent('focus'));
		ele.dispatchEvent(
			new CustomEvent('focusin', {
				bubbles: true,
				cancelable: false
			})
		);
		ele.classList.add('focushack');
		this.focusElement = ele;
	}

	// Blurs the element that currently has focus
	setBlur() {
		console.log('blur');
		if (this.focusElement) {
			this.focusElement.classList.remove('focushack');
			this.focusElement.dispatchEvent(new FocusEvent('blur'));
			this.focusElement.dispatchEvent(
				new CustomEvent('focusout', {
					bubbles: true,
					cancelable: false
				})
			);
		}
	}

	// Override elements focus and blur functions as these do not perform as expected when embeded html is not being directly displayed
	updateFocusBlur() {
		const allElements = this.html.querySelectorAll('*') as NodeListOf<HTMLElement>;
		for (let i = 0; i < allElements.length; i++) {
			const element = allElements[i];
			if (element.tabIndex > -1) {
				if (!element.hasOwnProperty('focus')) {
					element.focus = ((element) => {
						return () => this.setFocus(element);
					})(element);
				}
				if (!element.hasOwnProperty('blur')) {
					element.blur = ((element) => {
						return () => (this.focusElement == element ? this.setBlur() : false);
					})(element);
				}
			} else {
				element.focus = () => {};
				element.blur = () => {};
			}
		}
	}

	// Clear all hover states
	clearHover() {
		console.log('clear');
		if (this.moveTimer) {
			clearTimeout(this.moveTimer);
			this.moveTimer = false;
		}
		let element: HTMLElement | undefined;
		while ((element = this.overElements.pop())) {
			if (element.classList) element.classList.remove('hoverhack');
			element.dispatchEvent(
				new MouseEvent('mouseout', {
					bubbles: true,
					cancelable: true
				})
			);
		}
		if (this.lastEle)
			this.lastEle.dispatchEvent(
				new MouseEvent('mouseleave', {
					bubbles: true,
					cancelable: true
				})
			);
		this.lastEle = null;
		const activeElement = document.querySelector('.activeElement');
		if (activeElement) {
			activeElement.classList.remove('activehack');
			this.activeElement = null;
		}
	}

	// Mouse up on the HTML Element
	mouseup(x: number, y: number, button: number) {
		const mouseState = {
			screenX: x,
			screenY: y,
			clientX: x,
			clientY: y,
			button: button ? button : 0,
			bubbles: true,
			cancelable: true
		};
		const ele = this.elementAt(x, y);
		if (this.activeElement) {
			this.activeElement.classList.remove('activehack');
			if (ele) {
				ele.classList.add('hoverhack');
				if (this.overElements.indexOf(ele) == -1) this.overElements.push(ele);
			}
			this.activeElement = null;
		}
		if (ele) {
			ele.dispatchEvent(new MouseEvent('mouseup', mouseState));
			if (ele != this.focusElement) {
				this.setBlur();
				if (ele.tabIndex > -1) {
					this.setFocus(ele);
				} else {
					this.focusElement = null;
				}
			}

			if (ele == this.mousedownElement) {
				ele.dispatchEvent(new MouseEvent('click', mouseState));
				if (ele.tagName == 'INPUT') this.updateCheckedAttributes();
				// If the element requires some sort of keyboard interaction then notify of an input requirment
				if (ele.tagName == 'INPUT' || ele.tagName == 'TEXTAREA' || ele.tagName == 'SELECT') {
					if (this.eventCallback)
						this.eventCallback('inputrequired', {
							target: ele
						});
				}
			}
		} else {
			if (this.focusElement) this.focusElement.dispatchEvent(new FocusEvent('blur'));
			this.focusElement = null;
		}
	}

	// If an element is checked make sure it has a checked attribute so it renders to the canvas
	updateCheckedAttributes() {
		const inputElements = this.html.getElementsByTagName('input');
		for (let i = 0; i < inputElements.length; i++) {
			const element = inputElements[i];
			if (element.hasAttribute('checked')) {
				if (!element.checked) element.removeAttribute('checked');
			} else {
				if (element.checked) element.setAttribute('checked', '');
			}
		}
	}
}
