// Original game from:
// http://www.lostdecadegames.com/how-to-make-a-simple-html5-canvas-game/
// Slight modifications by Gregorio Robles <grex@gsyc.urjc.es>
// to meet the criteria of a canvas class for DAT @ Univ. Rey Juan Carlos

// Create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 512;
canvas.height = 480;
document.body.appendChild(canvas);

// Background image
var bgReady = false;
var bgImage = new Image();
bgImage.onload = function () {
	bgReady = true;
};
bgImage.src = "images/background.png";

// Hero image
var heroReady = false;
var heroImage = new Image();
heroImage.onload = function () {
	heroReady = true;
};
heroImage.src = "images/hero.png";

// Princess image
var princessReady = false;
var princessImage = new Image();
princessImage.onload = function () {
	princessReady = true;
};
princessImage.src = "images/princess.png";

// Stone image
var stoneReady = false;
var stoneImage = new Image();
stoneImage.onload = function () {
	stoneReady = true;
};
stoneImage.src = "images/stone.png";

// Monster image
var monsterReady = false;
var monsterImage = new Image();
monsterImage.onload = function () {
	monsterReady = true;
};
monsterImage.src = "images/monster.png";

// Game objects
var hero = {
	speed: 256 // movement in pixels per second
};
var princess = {};
var princessesCaught = 0;
var nStones = 1;
var stones;
var nMonsters = 0;
var monsters;
var level = 1;
var lives = 5;

// Limits
var upLimit = 32;
var downLimit = canvas.height - 64;
var leftLimit = 32;
var rightLimit = canvas.width - 64;

// Handle keyboard controls
var keysDown = {};

addEventListener("keydown", function (e) {
	keysDown[e.keyCode] = true;
}, false);

addEventListener("keyup", function (e) {
	delete keysDown[e.keyCode];
}, false);

addEventListener("close", function( event ) {
  // make the close button ineffective
	event.preventDefault();
  localStorage.setItem("hero", hero);
	localStorage.setItem("princess", princess);
	localStorage.setItem("princessesCaught", princessesCaught);
	localStorage.setItem("nStones", nStones);
	localStorage.setItem("stones", stones);
	localStorage.setItem("nMonsters", nMonsters);
	localStorage.setItem("monsters", monsters);
	localStorage.setItem("level", level);
	localStorage.setItem("lives", lives);
}, false);

// Check if exists overlay
var overlay = function(elem1, elem2, radius) {
	return (Math.abs(elem1.x - elem2.x) < radius) && (Math.abs(elem1.y - elem2.y) < radius);
};

// Check if an element overlays any stone
var overlayStones = function(elem) {
	for (var i = 0; i < stones.length; i++) {
		if (overlay(elem, stones[i], 30)) {
			return true;
		}
	}
	return false;
}

// Check if an element overlays any monster
var overlayMonsters = function(elem) {
	for (var i = 0; i < monsters.length; i++) {
		if (overlay(elem, monsters[i], 30)) {
			return true;
		}
	}
	return false;
}

// Check if there is a stone on top
var stoneUp = function(elem) {
	for (var i = 0; i < nStones; i++) {
		if (elem.y <= (stones[i].y + 32)
				&& (elem.y + 30) >= stones[i].y
			 	&& Math.abs(elem.x - stones[i].x) <= 30) {
			return true;
		}
	}
	return false;
}

// Check if there is a stone underneath
var stoneDown = function(elem) {
	for (var i = 0; i < nStones; i++) {
		if ((elem.y + 32) >= stones[i].y
				&& elem.y <= (stones[i].y + 30)
				&& Math.abs(elem.x - stones[i].x) <= 30) {
			return true;
		}
	}
	return false;
}

// Check if there is a stone on the left
var stoneLeft = function(elem) {
	for (var i = 0; i < nStones; i++) {
		if ((elem.x + 30) >= stones[i].x
				&& elem.x <= (stones[i].x + 32)
				&& Math.abs(elem.y - stones[i].y) <= 30) {
			return true;
		}
	}
	return false;
}

// Check if there is a stone on the right
var stoneRight = function(elem) {
	for (var i = 0; i < nStones; i++) {
		if ((elem.x + 32) >= stones[i].x
				&& elem.x <= (stones[i].x + 30)
				&& Math.abs(elem.y - stones[i].y) <= 30) {
			return true;
		}
	}
	return false;
}

// Sets the movement direction of the monster
var PlusOrMinus = function(monster, hero) {
	var difference = hero - monster;
	if (difference < 0) {
		return -1;
	}
	return 1;
}

// Restore game variables
var restoreGame = function() {
	var tmp;

	if (tmp = localStorage.getItem("hero") != null) {
		hero = tmp;
	}
	if (tmp = localStorage.getItem("princess") != null) {
		princess = tmp;
	}
	if (tmp = localStorage.getItem("princessesCaught") != null) {
		princessesCaught = tmp;
	}
	if (tmp = localStorage.getItem("nStones") != null) {
		nStones = tmp;
	}
	if (tmp = localStorage.getItem("stones") != null) {
		stones = tmp;
	}
	if (tmp = localStorage.getItem("nMonsters") != null) {
		nMonsters = tmp;
	}
	if (tmp = localStorage.getItem("monsters") != null) {
		monsters = tmp;
	}
	if (tmp = localStorage.getItem("level") != null) {
		level = tmp;
	}
	if (tmp = localStorage.getItem("lives") != null) {
		lives = tmp;
	}
}

// Reset the game when the player catches a princess
var reset = function () {
	hero.x = (canvas.width / 2) - 16;
	hero.y = (canvas.height / 2) - 16;

	// Throw the princess somewhere on the screen randomly
	do {
		princess.x = 32 + (Math.random() * (canvas.width - 96));
		princess.y = 32 + (Math.random() * (canvas.height - 96));
	} while(overlay(hero, princess, 128));

	// Increase level
	if (princessesCaught >= 10) {
		if (level%2 == 0) {
			lives++;
		}
		level++;
		princessesCaught = 0;
	}

	// Set level specs
	nStones = level;
	nMonsters = Math.floor(level / 2);

	// Generate stones
	stones = [];
	for (var i = 0; i < nStones; i++) {
		var stone = {};
		do {
			stone.x = 32 + (Math.random() * (canvas.width - 96));
			stone.y = 32 + (Math.random() * (canvas.height - 96));
		} while(overlay(stone, hero, 64) || overlay(stone, princess, 64) || overlayStones(stone));
		stones.push(stone);
	}

	// Generate monsters
	monsters = [];
	for (var i = 0; i < nMonsters; i++) {
		var monster = {
			speed: (i + 1) * hero.speed / 25
		};
		do {
			monster.x = 32 + (Math.random() * (canvas.width - 96));
			monster.y = 32 + (Math.random() * (canvas.height - 96));
		} while(overlay(monster, hero, 64) || overlay(monster, princess, 64) || overlayStones(monster) || overlayMonsters(monster));
		monsters.push(monster);
	}
};

// Update game objects
var update = function (modifier) {
	if (38 in keysDown && hero.y >= upLimit && !stoneUp(hero)) { // Player holding up
		hero.y -= hero.speed * modifier;
	}
	if (40 in keysDown && hero.y <= downLimit && !stoneDown(hero)) { // Player holding down
		hero.y += hero.speed * modifier;
	}
	if (37 in keysDown && hero.x >= leftLimit && !stoneLeft(hero)) { // Player holding left
		hero.x -= hero.speed * modifier;
	}
	if (39 in keysDown && hero.x <= rightLimit && !stoneRight(hero)) { // Player holding right
		hero.x += hero.speed * modifier;
	}

	// Monsters movement
	for (var i = 0; i < nMonsters; i++) {
		m_x = PlusOrMinus(monsters[i].x, hero.x);
		m_y = PlusOrMinus(monsters[i].y, hero.y);

		if (m_x < 0 && !stoneLeft(monsters[i])) {
			monsters[i].x -= monsters[i].speed * modifier;
		}

		if (m_x > 0 && !stoneRight(monsters[i])) {
			monsters[i].x += monsters[i].speed * modifier;
		}

		if (m_y < 0 && !stoneUp(monsters[i])) {
			monsters[i].y -= monsters[i].speed * modifier;
		}

		if (m_y > 0 && !stoneDown(monsters[i])) {
			monsters[i].y += monsters[i].speed * modifier;
		}
	}

	// Are they touching?
	if (overlay(hero, princess, 20)) {
		++princessesCaught;
		reset();
	}

	// Are any monster touching the hero?
	for (var i = 0; i < nMonsters; i++) {
		if (overlay(hero, monsters[i], 20)) {
			lives--;
			reset();
		}
	}
};

// Draw everything
var render = function () {
	if (bgReady) {
		ctx.drawImage(bgImage, 0, 0);
	}

	if (heroReady) {
		ctx.drawImage(heroImage, hero.x, hero.y);
	}

	if (princessReady) {
		ctx.drawImage(princessImage, princess.x, princess.y);
	}

	if (stoneReady) {
		for (var i = 0; i < nStones; i++) {
			ctx.drawImage(stoneImage, stones[i].x, stones[i].y);
		}
	}

	if (monsterReady) {
		for (var i = 0; i < nMonsters; i++) {
			ctx.drawImage(monsterImage, monsters[i].x, monsters[i].y);
		}
	}

	// Score
	ctx.fillStyle = "rgb(250, 250, 250)";
	ctx.font = "24px Helvetica";
	ctx.textAlign = "left";
	ctx.textBaseline = "top";
	ctx.fillText("Level: " + level + " Lives: " + lives, 32, 32);
	ctx.fillText("Princesses Caught: " + princessesCaught, 32, 54);

	// Set Game Over
	if (lives <= 0) {
		ctx.fillText("GAME OVER", (canvas.width / 2) - 70, (canvas.height / 2) + 30);
	}
};

// The main game loop
var main = function () {
	if (lives > 0) {
		var now = Date.now();
		var delta = now - then;

		update(delta / 1000);
		render();

		then = now;
	}
};

// Let's play this game!
reset();
var then = Date.now();
restoreGame();
//The setInterval() method will wait a specified number of milliseconds, and then execute a specified function, and it will continue to execute the function, once at every given time-interval.
//Syntax: setInterval("javascript function",milliseconds);
setInterval(main, 1); // Execute as fast as possible
