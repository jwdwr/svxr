import { THREE } from 'aframe';

export function RoundedBoxFlat(
	width: number,
	height: number,
	depth: number,
	radius: number,
	smoothness: number,
	startQuadrant?: number
): THREE.BufferGeometry {
	let currentQuadrant = startQuadrant || 1;
	const pi = Math.PI;
	const indices: number[] = [];
	const positions: number[] = [];
	const uvs: number[] = [];

	createFronts(smoothness, 1, 0); // front side
	createFronts(smoothness, -1, 4 * (smoothness + 3) + 1); // back side
	createFrame(smoothness, 2 * (4 * (smoothness + 3) + 1), 1, 4 * (smoothness + 3) + 2); // frame

	const geometry = new THREE.BufferGeometry();
	geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
	geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
	geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));

	// add multimaterial groups for front, back, framing
	const vertexCount = 4 * (smoothness + 2) * 3;
	geometry.addGroup(0, vertexCount, 0);
	geometry.addGroup(vertexCount, vertexCount, 1);
	geometry.addGroup(2 * vertexCount, 2 * vertexCount + 3, 2);

	geometry.computeVertexNormals();

	return geometry;

	function createFronts(smoothness: number, side: number, startIndex: number): void {
		const d0 = side === 1 ? 0 : 1;
		const d1 = side === 1 ? 1 : 0;

		let currentIndex = 0;

		for (let quadrant = 1; quadrant < 5; quadrant++) {
			currentIndex++;

			for (let segment = 0; segment < smoothness + 2; segment++) {
				indices.push(startIndex, startIndex + d0 + currentIndex, startIndex + d1 + currentIndex);
				currentIndex++;
			}
		}

		positions.push(0, 0, (side * depth) / 2); // center
		uvs.push(0.5, 0.5);

		let x: number, y: number, z: number, signX: number, signY: number;
		let angle = 0;
		const u0 = side === 1 ? 0 : 1;

		for (let quadrant = 1; quadrant < 5; quadrant++) {
			signX = quadrant === 1 || quadrant === 4 ? 1 : -1;
			signY = quadrant < 3 ? 1 : -1;

			x = (Math.cos(angle) * width) / 2;
			y = (Math.sin(angle) * height) / 2;
			z = (side * depth) / 2;

			positions.push(x, y, z);
			uvs.push(u0 + side * (0.5 + x / width), 0.5 + y / height);

			for (let segment = 0; segment < smoothness + 1; segment++) {
				const centerX = signX * (width / 2 - radius);
				const centerY = signY * (height / 2 - radius);
				const centerZ = (side * depth) / 2;

				const deltaAngle = ((pi / 2) * segment) / smoothness;

				x = centerX + radius * Math.cos(angle + deltaAngle);
				y = centerY + radius * Math.sin(angle + deltaAngle);
				z = centerZ;
				positions.push(x, y, z);
				uvs.push(u0 + side * (0.5 + x / width), 0.5 + y / height);
			}

			angle = angle + pi / 2;

			x = (Math.cos(angle) * width) / 2;
			y = (Math.sin(angle) * height) / 2;
			z = (side * depth) / 2;

			positions.push(x, y, z);
			uvs.push(u0 + side * (0.5 + x / width), 0.5 + y / height);
		}
	}

	function createFrame(
		smoothness: number,
		startIndexFrame: number,
		startIndexFront: number,
		startIndexBack: number
	): void {
		let a: number,
			b: number,
			c: number,
			d: number,
			xFront: number,
			yFront: number,
			zFront: number,
			xBack: number,
			yBack: number,
			zBack: number;
		const positionIndexFront = startIndexFront * 3;
		const positionIndexBack = startIndexBack * 3;

		let currentIndex = startIndexFrame;

		for (let quadrant = 1; quadrant < 5; quadrant++) {
			for (let segment = 0; segment < smoothness + 2; segment++) {
				a = currentIndex;
				b = currentIndex + 1;
				c = currentIndex + 2;
				d = currentIndex + 3;

				indices.push(a, b, d, a, d, c);

				currentIndex += 2;
			}

			currentIndex += 2;
		}

		const segmentLength = 2 * radius * Math.sin(pi / (smoothness * 4));
		const width2Radius = width / 2 - radius;
		const height2Radius = height / 2 - radius;
		const perimeter = 4 * width2Radius + 4 * height2Radius + 4 * smoothness * segmentLength;

		let u: number;
		currentIndex = 0; // reset

		for (let quadrant = 1; quadrant < 5; quadrant++) {
			u = currentQuadrant / 4;

			for (let segment = 0; segment < smoothness + 3; segment++) {
				xFront = positions[positionIndexFront + currentIndex];
				yFront = positions[positionIndexFront + currentIndex + 1];
				zFront = positions[positionIndexFront + currentIndex + 2];

				xBack = positions[positionIndexBack + currentIndex];
				yBack = positions[positionIndexBack + currentIndex + 1];
				zBack = positions[positionIndexBack + currentIndex + 2];

				positions.push(xFront, yFront, zFront, xBack, yBack, zBack);

				currentIndex += 3;

				uvs.push(u, 0, u, 1);

				if (segment === 0) {
					u -=
						quadrant === 1 || quadrant === 3 ? height2Radius / perimeter : width2Radius / perimeter;
				}
				if (segment === smoothness + 1) {
					u -=
						quadrant === 1 || quadrant === 3 ? width2Radius / perimeter : height2Radius / perimeter;
				}
				if (segment > 0 && segment < smoothness + 1) {
					u -= segmentLength / perimeter;
				}
			}

			currentQuadrant = 4 - ((5 - currentQuadrant) % 4); // cyclic next quadrant with respect to u
		}
	}
}
