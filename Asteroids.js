/** @type {HTMLCanvasElement} */
const FPS = 120;
const GAME_LIVES = 3; // Starting number of lives.

// TODO: ADD SOUND EFFECTS IF DESIRED

// Ship constants
const SHIP_SIZE = 30;
const TURN_SPEED = 360; // Turn speed in degrees per second.
const SHIP_THRUST = 5; // Thruster speed of the ship.
const SHIP_EXPLODE_DURATION = 0.3; // Duration of ship explosion.
const SHIP_INVINCIBILITY_DURATION = 2; // Duration of invincibility.
const SHIP_BLINK_DURATION = 0.1; // Blinking duration during invincible.
const FRICTION_COEFFICIENT = 0.5; // Coefficient of friction.

// Laser constants
const LASER_MAX = 10; // Maximum number of laser bullets.
const LASER_SPEED = 500; // Speed of lasers in pixels per second.
const LASER_DISTANCE = 0.5; // Max distance laser can travel as screen width fraction.
const LASER_EXPLODE_DURATION = 0.1; // Duration of laser explosion in seconds.

// Asteroid constants
const NUMBER_ASTEROIDS = 100; // Initial number of asteroids.
const ASTEROID_SIZE = 100; // Size of the asteroids.
const ASTEROID_SPEED = 50; // Initial speed of asteroids in pixels per second.
const ASTEROID_VERTICES = 10; // Number of vertices of asteroid.
const ASTEROID_JAGGEDNESS = 0.3; // Distortions of an asteroid.
const LARGE_ASTEROID_POINTS = 20;
const MEDIUM_ASTEROID_POINTS = 50;
const SMALL_ASTEROID_POINTS = 80;

// Development constants
const SHOW_CENTRE_DOT = false;
const SHOW_BOUNDING = false; // Collision bounding.
const TEXT_FADE_TIME = 2.5;
const TEXT_SIZE = 40;
const HIGH_SCORE_KEY = "highestScore";

let canvas = document.getElementById("gameCanvas");
let context = canvas.getContext("2d");
canvasResize();
window.addEventListener("resize", canvasResize, false);

function canvasResize() {
	context.canvas.width = window.innerWidth - 30;
	context.canvas.height = window.innerHeight - 30;
}

function distanceBetweenPoints(x1, y1, x2, y2) {
	return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// --------------------------------------------------------------------------

class createCircle {
	constructor() {
		this.x = canvas.width / 2;
		this.y = canvas.height / 2;

		this.radius = 2 + Math.random() * 3;
		this.vx = -5 + Math.random() * 10;
		this.vy = -5 + Math.random() * 10;
	}
}

// --------------------------------------------------------------------------

class createShip {
	constructor() {
		this.x = canvas.clientWidth / 2;
		this.y = canvas.clientHeight / 2;
		this.radius = SHIP_SIZE / 2;
		this.angle = (90 / 180) * Math.PI;
		this.blinkTime = Math.ceil((SHIP_BLINK_DURATION * FPS) / 3);
		this.blinkNumber = Math.ceil(SHIP_INVINCIBILITY_DURATION / SHIP_BLINK_DURATION);
		this.rotation = 0;
		this.thrusting = false;
		this.thrust = {
			x: 0,
			y: 0,
		};
		this.canShoot = true;
		this.lasers = [];
		this.explodeTime = 0;
		this.dead = false;
	}
	score = 0;
}

// --------------------------------------------------------------------------

function createAstroidBelt() {
	asteroids = [];
	var x, y;
	for (let i = 0; i < NUMBER_ASTEROIDS + level * 2; ++i) {
		do {
			x = Math.floor(Math.random() * canvas.width);
			y = Math.floor(Math.random() * canvas.height);
		} while (distanceBetweenPoints(ship.x, ship.y, x, y) < ASTEROID_SIZE * 2 + ship.radius);
		asteroids.push(newAsteroid(x, y, Math.ceil(ASTEROID_SIZE / 2)));
	}
}

function newAsteroid(x, y, radius) {
	let levelMultiplier = 1 + 0.1 * level;
	let asteroid = {
		x: x,
		y: y,
		xVelocity:
			((Math.random() * levelMultiplier * ASTEROID_SPEED) / FPS) *
			(Math.random() < 0.5 ? 1 : -1),
		yVelocity:
			((Math.random() * levelMultiplier * ASTEROID_SPEED) / FPS) *
			(Math.random() < 0.5 ? 1 : -1),
		radius: radius,
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
// INITIALIZE THE GAME VARIABLES ~~
let circles = [],
	asteroids,
	ship,
	level,
	text,
	textAlpha,
	lives,
	lifeColour,
	score,
	highestScore;
createGame();

// --------------------------------------------------------------------------

function createGame() {
	// Create ship
	ship = new createShip();

	// Push new explosive circles
	for (let i = 0; i < 30; i++) {
		circles.push(new createCircle());
	}

	// Level number
	level = 0;
	score = 0;
	lives = GAME_LIVES;

	// Get the highest score
	let scoreString = localStorage.getItem(HIGH_SCORE_KEY);
	if (scoreString === null) {
		highestScore = 0;
	} else {
		highestScore = parseInt(scoreString);
	}

	newLevel();
}

function newLevel() {
	// Set up asteroids
	asteroids = [];
	score = 0;
	text = `Level ${level + 1}`;
	textAlpha = 1.0;
	createAstroidBelt();
}

// --------------------------------------------------------------------------

// Setup event handlers
document.addEventListener("keydown", keydown);
document.addEventListener("keyup", keyup);

function keydown(event) {
	if (ship.dead) {
		return;
	}

	switch (event.keyCode) {
		case 32: // Shoot lasers by space bar.
			shootLaser();
			break;
		case 37: //  Rotate ship left using left arrow key
			ship.rotation = ((TURN_SPEED / 180) * Math.PI) / FPS;
			break;
		case 38: // Engage/Increase thrusters
			ship.thrusting = true;
			break;
		case 39: // Rotate ship right using right arrow key
			ship.rotation = -((TURN_SPEED / 180) * Math.PI) / FPS;
			break;
	}
}

function keyup(event) {
	if (ship.dead) {
		return;
	}

	switch (event.keyCode) {
		case 32: // Shoot lasers again.
			ship.canShoot = true;
			break;
		case 37: //  Stop left rotation when key is lifted up
			ship.rotation = 0;
			break;
		case 38: // Engage/Increase thrusters
			ship.thrusting = false;
			break;
		case 39: // Stop right rotation when key is lifted up
			ship.rotation = 0;
			break;
	}
}

// --------------------------------------------------------------------------

// Sets the game loop
setInterval(update, 1000 / FPS);

function shipExploded() {
	ship.explodeTime = Math.ceil(SHIP_EXPLODE_DURATION * FPS);
}

function drawShip(x, y, angle, colour = "white") {
	// Draws the ship
	context.strokeStyle = colour;
	context.lineWidth = SHIP_SIZE / 20;
	context.beginPath();
	context.moveTo(
		// Nose of the ship
		x + (4 / 3) * ship.radius * Math.cos(angle),
		y - (4 / 3) * ship.radius * Math.sin(angle)
	);

	context.lineTo(
		// Rear left
		x - ship.radius * ((2 / 3) * Math.cos(angle) + Math.sin(angle)),
		y + ship.radius * ((2 / 3) * Math.sin(angle) - Math.cos(angle))
	);

	context.lineTo(
		// Rear right
		x - ship.radius * ((2 / 3) * Math.cos(angle) - Math.sin(angle)),
		y + ship.radius * ((2 / 3) * Math.sin(angle) + Math.cos(angle))
	);

	// Rather than lineTo, use closePath;
	// context.lineTo(
	// 	// Reconnect the top
	// 	ship.x - ship.radius * Math.cos(ship.angle),
	// 	ship.y - ship.radius * Math.sin(ship.angle)
	// );
	context.closePath();
	context.stroke();
}

function shootLaser() {
	// Create the laser
	if (ship.canShoot && ship.lasers.length < LASER_MAX) {
		ship.lasers.push({
			x: ship.x + (4 / 3) * ship.radius * Math.cos(ship.angle),
			y: ship.y - (4 / 3) * ship.radius * Math.sin(ship.angle),
			xVelocity: (LASER_SPEED * Math.cos(ship.angle)) / FPS,
			yVelocity: -(LASER_SPEED * Math.sin(ship.angle)) / FPS,
			distanceTravelled: 0,
			explodeTime: 0,
		});
	}

	// Prevent further shooting
	ship.canShoot = false;
}

function destroyAsteroid(index) {
	let x = asteroids[index].x;
	let y = asteroids[index].y;
	let radius = asteroids[index].radius;

	// Split the asteroid into smaller parts
	if (radius === Math.ceil(ASTEROID_SIZE / 2)) {
		asteroids.push(newAsteroid(x, y, Math.ceil(ASTEROID_SIZE / 4)));
		asteroids.push(newAsteroid(x, y, Math.ceil(ASTEROID_SIZE / 4)));
		score += LARGE_ASTEROID_POINTS;
	} else if (radius === Math.ceil(ASTEROID_SIZE / 4)) {
		asteroids.push(newAsteroid(x, y, Math.ceil(ASTEROID_SIZE / 8)));
		asteroids.push(newAsteroid(x, y, Math.ceil(ASTEROID_SIZE / 8)));
		score += MEDIUM_ASTEROID_POINTS;
	} else {
		score += SMALL_ASTEROID_POINTS;
	}

	// Check and store high score
	highestScore = Math.max(highestScore, score);
	localStorage.setItem(HIGH_SCORE_KEY, highestScore);

	// Destroy the initial asteroids
	asteroids.splice(index, 1);

	// Increment level if none left
	if (asteroids.length === 0) {
		++level;
		newLevel();
	}
}

function gameOver() {
	ship.dead = true;
	text = "Game Over!";
	textAlpha = 1.0;
}

// --------------------------------------------------------------------------

function update() {
	let blinkOn = ship.blinkNumber % 2 == 0;
	let exploding = ship.explodeTime > 0;

	// Draws the space
	context.fillStyle = "black";
	context.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

	// Draw the game text
	if (textAlpha >= 0) {
		context.fillStyle = `rgba(255,255,255,${textAlpha})`;
		context.textAlign = "center";
		context.textBaseLine = "middle";
		context.font = `40px bahnschrift`;
		context.fillText(text, canvas.width / 2, (canvas.height / 4) * 3);
		textAlpha -= 1.0 / TEXT_FADE_TIME / FPS;
	} else if (ship.dead) {
		createGame();
	}

	// Draw the lives
	for (let i = 0; i < lives; ++i) {
		lifeColour = exploding && i === lives - 1 ? "red" : "green";
		drawShip(SHIP_SIZE + i * SHIP_SIZE * 1.2, SHIP_SIZE, 0.5 * Math.PI, lifeColour);
	}

	// Draw the highest score
	context.fillStyle = `rgba(255,255,255)`;
	context.textAlign = "center";
	context.textBaseLine = "middle";
	context.font = `25px bahnschrift`;
	context.fillText(`Highest Score: ${highestScore}`, canvas.width / 2, SHIP_SIZE);

	// Draw the current score
	context.fillStyle = `rgba(255,255,255)`;
	context.textAlign = "center";
	context.textBaseLine = "middle";
	context.font = `25px bahnschrift`;
	context.fillText(score, canvas.width - SHIP_SIZE, SHIP_SIZE);

	// --------------------------------------------------------------------------
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ SHIP ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	if (!exploding) {
		if (blinkOn && !ship.dead) {
			drawShip(ship.x, ship.y, ship.angle);
		}

		// Handle blinking
		if (ship.blinkNumber > 0) {
			ship.blinkTime--;

			if (ship.blinkTime == 0) {
				ship.blinkTime = Math.ceil(SHIP_BLINK_DURATION * FPS);
				ship.blinkNumber--;
			}
		}
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

			if (c.radius < 0) circles[j] = new createCircle();
		}
	}

	// --------------------------------------------------------------------------
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ LASERS ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// Draw the lasers
	for (let i = 0; i < ship.lasers.length; ++i) {
		if (ship.lasers[i].explodeTime == 0) {
			context.fillStyle = "salmon";
			context.beginPath();
			context.arc(ship.lasers[i].x, ship.lasers[i].y, SHIP_SIZE / 15, 0, Math.PI * 2, false);
			context.fill();
		} else {
			context.fillStyle = "orangered";
			context.beginPath();
			context.arc(
				ship.lasers[i].x,
				ship.lasers[i].y,
				ship.radius * 0.75,
				0,
				Math.PI * 2,
				false
			);
			context.fill();
			context.fillStyle = "salmon";
			context.beginPath();
			context.arc(
				ship.lasers[i].x,
				ship.lasers[i].y,
				ship.radius * 0.5,
				0,
				Math.PI * 2,
				false
			);
			context.fill();
			context.fillStyle = "pink";
			context.beginPath();
			context.arc(
				ship.lasers[i].x,
				ship.lasers[i].y,
				ship.radius * 0.25,
				0,
				Math.PI * 2,
				false
			);
			context.fill();
		}
	}

	for (let i = ship.lasers.length - 1; i >= 0; --i) {
		// Check distance travelled
		if (ship.lasers[i].distanceTravelled > LASER_DISTANCE * canvas.width) {
			ship.lasers.splice(i, 1);
			continue;
		}

		// Handle the  explosions
		if (ship.lasers[i].explodeTime > 0) {
			ship.lasers[i].explodeTime--;

			if (ship.lasers[i].explodeTime == 0) {
				ship.lasers.splice(i, 1);
				continue;
			}
		} else {
			// Move the lasers
			ship.lasers[i].x += ship.lasers[i].xVelocity;
			ship.lasers[i].y += ship.lasers[i].yVelocity;

			// Calculate the distance travelled by the laser.
			ship.lasers[i].distanceTravelled += Math.sqrt(
				Math.pow(ship.lasers[i].xVelocity, 2) + Math.pow(ship.lasers[i].yVelocity, 2)
			);

			// Wrap the lasers to the screen
			// X Component
			if (ship.lasers[i].x < 0) {
				ship.lasers[i].x = canvas.width;
			} else if (ship.lasers[i].x > canvas.width) {
				ship.lasers[i].x = 0;
			}

			// Y Component
			if (ship.lasers[i].y < 0) {
				ship.lasers[i].y = canvas.height;
			} else if (ship.y > canvas.height) {
				ship.lasers[i].y = 0;
			}
		}
	}

	// Check for asteroid collision with laser.
	var asteroidX, asteroidY, asteroidRadius, laserX, laserY;
	for (let i = asteroids.length - 1; i >= 0; --i) {
		// Get them properties
		asteroidX = asteroids[i].x;
		asteroidY = asteroids[i].y;
		asteroidRadius = asteroids[i].radius;

		// Loop over the lasers
		for (let j = ship.lasers.length - 1; j >= 0; --j) {
			laserX = ship.lasers[j].x;
			laserY = ship.lasers[j].y;

			// Detect hits
			if (
				ship.lasers[j].explodeTime == 0 &&
				distanceBetweenPoints(asteroidX, asteroidY, laserX, laserY) < asteroidRadius
			) {
				// Remove the asteroid and initiate laser explosion
				destroyAsteroid(i);

				ship.lasers[j].explodeTime = Math.ceil(LASER_EXPLODE_DURATION * FPS);

				break;
			}
		}
	}

	// --------------------------------------------------------------------------

	if (SHOW_BOUNDING) {
		context.strokeStyle = "lime";
		context.beginPath();
		context.arc(ship.x, ship.y, ship.radius, 0, Math.PI * 2, false);
		context.stroke();
	}

	// --------------------------------------------------------------------------

	if (!exploding) {
		// Check for asteroid collision with ship
		if (ship.blinkNumber == 0 && !ship.dead) {
			for (let i = 0; i < asteroids.length; ++i) {
				if (
					distanceBetweenPoints(ship.x, ship.y, asteroids[i].x, asteroids[i].y) <
					ship.radius + asteroids[i].radius
				) {
					destroyAsteroid(i);
					shipExploded();
					break;
				}
			}
		}
		// --------------------------------------------------------------------------

		// Rotate ship
		ship.angle += ship.rotation;

		// Thrusters
		if (ship.thrusting && !ship.dead) {
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
	} else {
		ship.explodeTime--;

		if (ship.explodeTime == 0) {
			--lives;
			if (lives == 0) {
				gameOver();
			} else {
				ship = new createShip();
			}
		}
	}
	// --------------------------------------------------------------------------
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ASTEROIDS ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// Draw the asteroids
	context.lineWidth = SHIP_SIZE / 20;
	let x, y, radius, vertices, angle, offset;
	for (let i = asteroids.length - 1; i >= 0; --i) {
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
