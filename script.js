let creatures = [];
let food = [];
let foodRespawnTime = 50;
let foodRespawnCounter = 0;
let currentMutationColor = null;
let mutationCount = 0;
let season = "spring";
let seasonCounter = 0;
let seasonDuration = 3600; // 1 minuto en frames (60 FPS)

function setup() {
  let canvas = createCanvas(800, 600);
  canvas.parent('canvas-container');
  for (let i = 0; i < 30; i++) {
    creatures.push(new Creature());
  }
  for (let i = 0; i < 50; i++) {
    food.push(new Food());
  }
}

function draw() {
  setSeasonBackground(); // Establecer el fondo según la estación

  // Controlar el respawn de comida
  foodRespawnCounter++;
  if (foodRespawnCounter >= foodRespawnTime) {
    food.push(new Food());
    foodRespawnCounter = 0;
  }

  // Controlar el cambio de estación
  seasonCounter++;
  if (seasonCounter >= seasonDuration) {
    seasonCounter = 0;
    changeSeason();
  }

  // Mover y mostrar comida
  for (let f of food) {
    f.move();
    f.show();
  }

  // Contar criaturas por color
  let colorCounts = countColors(creatures);

  // Mover y mostrar criaturas
  for (let i = creatures.length - 1; i >= 0; i--) {
    let c = creatures[i];
    c.move(food, creatures);
    c.eat(food);
    c.show();
    c.age();
    c.checkMitosis(colorCounts);

    // Verificar si una criatura se come a otra
    for (let j = creatures.length - 1; j >= 0; j--) {
      if (i !== j && c.eatCreature(creatures[j])) {
        creatures.splice(j, 1);
        break;
      }
    }
  }

  displaySeason();
  displayLegend();
  displaySpeciesLegend();
}

function countColors(creatures) {
  let colorCounts = {};
  for (let creature of creatures) {
    if (!colorCounts[creature.color]) {
      colorCounts[creature.color] = 0;
    }
    colorCounts[creature.color]++;
  }
  return colorCounts;
}

function changeSeason() {
  const seasons = ["spring", "summer", "autumn", "winter"];
  let currentSeasonIndex = seasons.indexOf(season);
  season = seasons[(currentSeasonIndex + 1) % seasons.length];

  // Cambiar comportamiento según la estación
  switch (season) {
    case "spring":
      foodRespawnTime = 10; // Mucha comida en primavera
      break;
    case "summer":
      foodRespawnTime = 50; // Comida normal en verano
      break;
    case "autumn":
      foodRespawnTime = 100; // Menos comida en otoño
      break;
    case "winter":
      foodRespawnTime = 200; // Mucho menos comida en invierno
      break;
  }
}

function displaySeason() {
  fill(0);
  textSize(16);
  text(`Season: ${season}`, 10, height - 10);
}

function setSeasonBackground() {
  switch (season) {
    case "spring":
      background(144, 238, 144); // Verde claro
      break;
    case "summer":
      background(255, 165, 0); // Naranja claro
      break;
    case "autumn":
      background(210, 105, 30); // Marrón claro
      break;
    case "winter":
      background(173, 216, 230); // Azul claro
      break;
  }
}

function displayLegend() {
  // Dibujar la leyenda fuera del canvas, a la derecha
  fill(0);
  textSize(16);
  let startX = width + 10;
  let startY = 20;

  // Leyenda de tipos de comida
  text("Food Types:", startX, startY);
  fill(0, 255, 0);
  ellipse(startX + 50, startY + 20, 10, 10);
  fill(0);
  text("Normal Food", startX + 70, startY + 25);

  fill(255, 0, 0);
  ellipse(startX + 50, startY + 50, 10, 10);
  fill(0);
  text("Growth Food", startX + 70, startY + 55);
}

function displaySpeciesLegend() {
  let speciesCounts = countSpecies(creatures);

  let startX = 10;
  let startY = height + 20; // Below the canvas

  // Dibujar la leyenda de especies
  fill(0);
  textSize(16);
  text("Species:", startX, startY);

  let offsetY = 25;

  for (let species in speciesCounts) {
    text(`${species}: ${speciesCounts[species]} - ${getSpeciesDescription(species)}`, startX, startY + offsetY);
    offsetY += 20;
  }
}

function countSpecies(creatures) {
  let speciesCounts = {};
  for (let creature of creatures) {
    if (!speciesCounts[creature.species.name]) {
      speciesCounts[creature.species.name] = 0;
    }
    speciesCounts[creature.species.name]++;
  }
  return speciesCounts;
}

function getSpeciesDescription(speciesName) {
  const speciesDescriptions = {
    'fast': 'High speed, low endurance',
    'strong': 'Low speed, high endurance',
    'balanced': 'Moderate speed and endurance'
  };
  return speciesDescriptions[speciesName];
}

class Food {
  constructor() {
    this.pos = createVector(random(width), random(height));
    this.type = random(["normal", "growth"]);
    this.vel = createVector(random(-0.125, 0.125), random(-0.125, 0.125));
  }

  move() {
    this.pos.add(this.vel);
    this.vel.add(p5.Vector.random2D().mult(0.0125));
    this.vel.limit(0.125);
    this.pos.x = constrain(this.pos.x, 0, width);
    this.pos.y = constrain(this.pos.y, 0, height);
  }

  show() {
    stroke(0);
    strokeWeight(1);
    if (this.type === "normal") fill(0, 255, 0);
    if (this.type === "growth") fill(255, 0, 0);
    ellipse(this.pos.x, this.pos.y, 5, 5);
  }
}

class Creature {
  constructor(size = 10, pos = createVector(random(width), random(height)), color = getInitialColor(), speedMultiplier = 1.0, species = getRandomSpecies()) {
    this.pos = pos;
    this.vel = p5.Vector.random2D();
    this.size = size;
    this.color = color;
    this.maxSize = 30;
    this.minSize = 5;
    this.lifeSpan = 10000;
    this.timeSinceLastMeal = 0;
    this.sprintCounter = 0;
    this.speedMultiplier = speedMultiplier;
    this.species = species;
  }

  move(food, creatures) {
    let closestFood = null;
    let closestFoodDist = Infinity;
    let closestPrey = null;
    let closestPreyDist = Infinity;
    let closestPredator = null;
    let closestPredatorDist = Infinity;
    let olfatoRange = map(this.size, this.minSize, this.maxSize, 50, 200);

    // Buscar la comida más cercana dentro del rango de olfato
    for (let f of food) {
      let d = dist(this.pos.x, this.pos.y, f.pos.x, f.pos.y);
      if (d < closestFoodDist && d < olfatoRange) {
        closestFoodDist = d;
        closestFood = f;
      }
    }

    // Buscar el ser más cercano dentro del rango de olfato
    for (let other of creatures) {
      if (other !== this) {
        let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
        if (d < olfatoRange) {
          if (other.size < this.size && d < closestPreyDist && other.color !== this.color) {
            closestPreyDist = d;
            closestPrey = other;
          } else if (other.size > this.size && d < closestPredatorDist) {
            closestPredatorDist = d;
            closestPredator = other;
          }
        }
      }
    }

    let baseSpeed = this.species.baseSpeed * this.speedMultiplier;
    let speed = baseSpeed;
    if (season === "winter") {
      speed *= 0.5; // Reducir la velocidad en invierno
    } else if (season === "summer") {
      speed *= 1.2; // Aumentar la velocidad en verano
    }

    if (closestPredator) {
      speed *= 1.5;
      let flee = p5.Vector.sub(this.pos, closestPredator.pos);
      flee.setMag(speed);
      flee.rotate(random(-QUARTER_PI, QUARTER_PI));
      let avoidEdge = createVector(0, 0);
      if (this.pos.x < 50) avoidEdge.add(createVector(1, 0));
      if (this.pos.x > width - 50) avoidEdge.add(createVector(-1, 0));
      if (this.pos.y < 50) avoidEdge.add(createVector(0, 1));
      if (this.pos.y > height - 50) avoidEdge.add(createVector(0, -1));
      if (avoidEdge.mag() > 0) {
        avoidEdge.setMag(speed);
        flee.add(avoidEdge);
        flee.setMag(speed);
      }
      this.vel = p5.Vector.lerp(this.vel, flee, 0.15);
      if (this.pos.x < 50 || this.pos.x > width - 50 || this.pos.y < 50 || this.pos.y > height - 50) {
        if (this.sprintCounter === 0) {
          speed *= 1.5;
          this.sprintCounter = 60;
        }
      }
    } else if (closestPrey) {
      let pursue = p5.Vector.sub(closestPrey.pos, this.pos);
      pursue.setMag(speed);
      this.vel = p5.Vector.lerp(this.vel, pursue, 0.15);
    } else if (closestFood) {
      let desired = p5.Vector.sub(closestFood.pos, this.pos);
      desired.setMag(speed);
      this.vel = p5.Vector.lerp(this.vel, desired, 0.15);
    } else {
      this.vel.add(p5.Vector.random2D().mult(0.375));
      this.vel.limit(baseSpeed);
    }

    if (this.sprintCounter > 0) {
      this.sprintCounter--;
    }

    this.pos.add(this.vel);
    this.pos.x = constrain(this.pos.x, 0, width);
    this.pos.y = constrain(this.pos.y, 0, height);
  }

  eat(food) {
    for (let i = food.length - 1; i >= 0; i--) {
      if (dist(this.pos.x, this.pos.y, food[i].pos.x, food[i].pos.y) < this.size) {
        if (food[i].type === "growth") {
          this.size += 4;
        } else {
          this.size += 2;
        }
        food.splice(i, 1);
        this.timeSinceLastMeal = 0;
        if (this.size > this.maxSize) {
          this.size = this.maxSize;
        }
      }
    }
  }

  eatCreature(other) {
    if (dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y) < this.size) {
      if (this.size > other.size) {
        if (this.color === other.color) {
          if (random(1) > 0.25) {
            return false;
          }
        }
        this.size += other.size / 2;
        this.timeSinceLastMeal = 0;
        if (this.size > this.maxSize) {
          this.size = this.maxSize;
        }
        return true;
      }
    }
    return false;
  }

  age() {
    this.lifeSpan -= 1;
    this.timeSinceLastMeal += 1;

    if (this.timeSinceLastMeal > 2000) {
      this.size -= 0.5;
      this.timeSinceLastMeal = 0;
      if (this.size < this.minSize) {
        this.size = this.minSize;
      }
    }

    if (this.lifeSpan <= 0 || this.size <= this.minSize) {
      let index = creatures.indexOf(this);
      if (index > -1) {
        creatures.splice(index, 1);
      }
    }
  }

  checkMitosis(colorCounts) {
    if (this.size >= this.maxSize) {
      if (season !== "winter") {
        let numOffspring = 2;
        let childSize = this.size / numOffspring;
        for (let i = 0; i < numOffspring; i++) {
          let childColor = this.color;
          let childSpeedMultiplier = this.speedMultiplier;
          let mutationProbability = min(0.1 * colorCounts[this.color], 0.9);

          if (random(1) < mutationProbability) {
            if (currentMutationColor === null || mutationCount >= 10) {
              currentMutationColor = getRandomColor();
              mutationCount = 0;
            }
            childColor = currentMutationColor;
            mutationCount++;
          }

          let child = new Creature(childSize, this.pos.copy(), childColor, childSpeedMultiplier, this.species);
          creatures.push(child);
        }
      }
      this.size /= 2;
    }
  }

  show() {
    stroke(0);
    strokeWeight(1);
    fill(this.color);
    ellipse(this.pos.x, this.pos.y, this.size, this.size);
  }
}

function getInitialColor() {
  const initialColors = ['red', 'blue', 'yellow', 'green'];
  return initialColors[Math.floor(Math.random() * initialColors.length)];
}

function getRandomSpecies() {
  const speciesList = [
    { name: 'fast', baseSpeed: 2.0 },
    { name: 'strong', baseSpeed: 1.0 },
    { name: 'balanced', baseSpeed: 1.5 }
  ];
  return speciesList[Math.floor(Math.random() * speciesList.length)];
}

function getRandomColor() {
  return color(random(255), random(255), random(255));
}
