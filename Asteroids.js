/** @type {HTMLCanvasElement} */
const FPS = 120;
const SHIP_SIZE = 30;
const TURN_SPEED = 360; // Turn speed in degrees per second
const SHIP_THRUST = 5;
const SHIP_EXPLODE_DURATION = 0.3;
const FRICTION_COEFFICIENT = 0.5;
const NUMBER_ASTEROIDS = 50;
const ASTEROID_SIZE = 100;
const ASTEROID_SPEED = 50;
const ASTEROID_VERTICES = 10;
const ASTEROID_JAGGEDNESS = 0.3;
const SHOW_CENTRE_DOT = false;
const SHOW_BOUNDING = true; // Collision bounding

let canvas = document.getElementById("gameCanvas");
let context = canvas.getContext("2d");

// Set up ship
let ship = {
	x: canvas.clientWidth / 2,
	y: canvas.clientHeight / 2,
	radius: SHIP_SIZE / 2,
	angle: (90 / 180) * Math.PI,
	rotation: 0,
	thrusting: false,
	thrust: {
		x: 0,
		y: 0,
	},
	explodeTime: 0,
};

function distanceBetweenPoints(x1, y1, x2, y2) {
	return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// --------------------------------------------------------------------------
// Set up asteroids
let asteroids = [];
createAstroidBelt();

function createAstroidBelt() {
	asteroids = [];
	var x, y;
	for (let i = 0; i < NUMBER_ASTEROIDS; ++i) {
		do {
			x = Math.floor(Math.random() * canvas.width);
			y = Math.floor(Math.random() * canvas.height);
		} while (distanceBetweenPoints(ship.x, ship.y, x, y) < ASTEROID_SIZE * 2 + ship.radius);
		asteroids.push(newAsteroid(x, y));
	}
}

function newAsteroid(x, y) {
	let asteroid = {
		x: x,
		y: y,
		xVelocity: ((Math.random() * ASTEROID_SPEED) / FPS) * (Math.random() < 0.5 ? 1 : -1),
		yVelocity: ((Math.random() * ASTEROID_SPEED) / FPS) * (Math.random() < 0.5 ? 1 : -1),
		radius: ASTEROID_SIZE / 2,
		angle: Math.random() * Math.PI * 2,
		vertices: Math.floor(Math.random() * (ASTEROID_VERTICES + 1) + ASTEROID_VERTICES / 2),
		offset: [],
	};

	//Create the vertex offsets
	for (let i = 0; i < asteroid.vertices; ++i) {
		asteroid.offset.push(Math.random() * ASTEROID_JAGGEDNESS * 2 + 1 - ASTEROID_JAGGEDNESS);
	}
	return asteroid;
}
// --------------------------------------------------------------------------
let circles = [];
class createCircle {
	constructor() {
		this.x = canvas.width / 2;
		this.y = canvas.height / 2;

		this.radius = 2 + Math.random() * 3;
		this.vx = -5 + Math.random() * 10;
		this.vy = -5 + Math.random() * 10;
	}
}

for (let i = 0; i < 30; i++) {
	circles.push(new createCircle());
}
// --------------------------------------------------------------------------
// Setup event handlers
document.addEventListener("keydown", keydown);
document.addEventListener("keyup", keyup);

function keydown(event) {
	switch (event.keyCode) {
		case 37: //  Rotate ship left using left arrow key
			ship.rotation = ((TURN_SPEED / 180) * Math.PI) / FPS;
			break;
		case 38: // Engage/Increase thrusters
			ship.thrusting = true;
			break;
		case 39: // Rotate ship right using right arrow key
			ship.rotation = -((TURN_SPEED / 180) * Math.PI) / FPS;
			break;
		case 40: // Decrease thrusters
			//  CANNOT DECREASE FORWARD THRUSTERS
			break;
	}
}

function keyup(event) {
	switch (event.keyCode) {
		case 37: //  Stop left rotation when key is lifted up
			ship.rotation = 0;
			break;
		case 38: // Engage/Increase thrusters
			ship.thrusting = false;
			break;
		case 39: // Stop right rotation when key is lifted up
			ship.rotation = 0;
			break;
		case 40: // Decrease thrusters
			//  CANNOT DECREASE FORWARD THRUSTERS
			break;
	}
}
// --------------------------------------------------------------------------

// Sets the game loop
setInterval(update, 1000 / FPS);

function shipExploded() {
	ship.explodeTime = Math.ceil(SHIP_EXPLODE_DURATION * FPS);
}

// --------------------------------------------------------------------------
function update() {
	let exploding = ship.explodeTime > 0;

	// Draws the space
	context.fillStyle = "black";
	context.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

	// --------------------------------------------------------------------------

	if (!exploding) {
		// Draws the ship
		context.strokeStyle = "white";
		context.lineWidth = SHIP_SIZE / 20;
		context.beginPath();
		context.moveTo(
			// Nose of the ship
			ship.x + (4 / 3) * ship.radius * Math.cos(ship.angle),
			ship.y - (4 / 3) * ship.radius * Math.sin(ship.angle)
		);

		context.lineTo(
			// Rear left
			ship.x - ship.radius * ((2 / 3) * Math.cos(ship.angle) + Math.sin(ship.angle)),
			ship.y + ship.radius * ((2 / 3) * Math.sin(ship.angle) - Math.cos(ship.angle))
		);

		context.lineTo(
			// Rear right
			ship.x - ship.radius * ((2 / 3) * Math.cos(ship.angle) - Math.sin(ship.angle)),
			ship.y + ship.radius * ((2 / 3) * Math.sin(ship.angle) + Math.cos(ship.angle))
		);

		// Rather than lineTo, use closePath;
		// context.lineTo(
		// 	// Reconnect the top
		// 	ship.x - ship.radius * Math.cos(ship.angle),
		// 	ship.y - ship.radius * Math.sin(ship.angle)
		// );
		context.closePath();
		context.stroke();
	} else {
		for (let j = 0; j < circles.length; j++) {
			let c = circles[j];

			//Create the circles
			context.beginPath();
			context.arc(c.x, c.y, c.radius, 0, Math.PI * 2, false);
			context.fillStyle = "rgba(" + 255 + ", " + 255 + ", " + 255 + ", 0.5)";
			context.fill();

			c.x += c.vx;
			c.y += c.vy;
			c.radius -= 0.02;
		}
		ship.explodeTime = 0;
	}

	// --------------------------------------------------------------------------

	if (SHOW_BOUNDING) {
		context.strokeStyle = "lime";
		context.beginPath();
		context.arc(ship.x, ship.y, ship.radius, 0, Math.PI * 2, false);
		context.stroke();
	}
	// --------------------------------------------------------------------------

	// --------------------------------------------------------------------------
	// Rotate ship
	ship.angle += ship.rotation;

	// Thrusters
	if (ship.thrusting) {
		ship.thrust.x += (SHIP_THRUST * Math.cos(ship.angle)) / FPS;
		ship.thrust.y -= (SHIP_THRUST * Math.sin(ship.angle)) / FPS;
	} else {
		ship.thrust.x -= (ship.thrust.x * FRICTION_COEFFICIENT) / FPS;
		ship.thrust.y -= (ship.thrust.y * FRICTION_COEFFICIENT) / FPS;
	}

	// --------------------------------------------------------------------------
	// Move the ship
	ship.x += ship.thrust.x;
	ship.y += ship.thrust.y;

	// Wrap the ship to the screen
	// X Component
	if (ship.x < 0 - ship.radius) {
		ship.x = canvas.width + ship.radius;
	} else if (ship.x > canvas.width + ship.radius) {
		ship.x = 0 - ship.radius;
	}

	// Y Component
	if (ship.y < 0 - ship.radius) {
		ship.y = canvas.height + ship.radius;
	} else if (ship.y > canvas.height + ship.radius) {
		ship.y = 0 - ship.radius;
	}
	// --------------------------------------------------------------------------

	// Draw the asteroids
	context.lineWidth = SHIP_SIZE / 20;
	let x, y, radius, vertices, angle, offset;
	for (let i = 0; i < asteroids.length; ++i) {
		x = asteroids[i].x;
		y = asteroids[i].y;
		vertices = asteroids[i].vertices;
		radius = asteroids[i].radius;
		angle = asteroids[i].angle;
		offset = asteroids[i].offset;

		// Draw the path
		context.strokeStyle = "slategrey";
		context.beginPath();
		context.moveTo(
			x + radius * offset[0] * Math.cos(angle),
			y + radius * offset[0] * Math.sin(angle)
		);

		// Draw the vertices
		for (let vertex = 1; vertex < vertices; ++vertex) {
			context.lineTo(
				x + radius * offset[vertex] * Math.cos(angle + (vertex * Math.PI * 2) / vertices),
				y + radius * offset[vertex] * Math.sin(angle + (vertex * Math.PI * 2) / vertices)
			);
		}

		context.closePath();
		context.stroke();

		// Check for asteroid collisions
		for (let i = 0; i < asteroids.length; ++i) {
			if (
				distanceBetweenPoints(ship.x, ship.y, asteroids[i].x, asteroids[i].y) <
				ship.radius + asteroids[i].radius
			) {
				shipExploded();
			}
		}

		if (SHOW_BOUNDING) {
			context.strokeStyle = "lime";
			context.beginPath();
			context.arc(x, y, radius, 0, Math.PI * 2, false);
			context.stroke();
		}
	}

	// --------------------------------------------------------------------------
	// Move the asteroids
	for (let i = 0; i < asteroids.length; ++i) {
		asteroids[i].x += asteroids[i].xVelocity;
		asteroids[i].y += asteroids[i].yVelocity;

		// Wrap the asteroid to the screen
		// X component
		if (asteroids[i].x < 0 - asteroids[i].radius) {
			asteroids[i].x = canvas.width + asteroids[i].radius;
		} else if (asteroids[i].x > canvas.width + asteroids[i].radius) {
			asteroids[i].x = 0 - asteroids[i].radius;
		}

		// Y Component
		if (asteroids[i].y < 0 - asteroids[i].radius) {
			asteroids[i].y = canvas.height + asteroids[i].radius;
		} else if (asteroids[i].y > canvas.height + asteroids[i].radius) {
			asteroids[i].y = 0 - asteroids[i].radius;
		}
	}
	// --------------------------------------------------------------------------

	// Show centre dot
	if (SHOW_CENTRE_DOT) {
		context.fillStyle = "red";
		context.fillRect(ship.x - 1, ship.y - 1, 2, 2);
	}
}