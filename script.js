// Variables globales
let creatures = [];
let food = [];
let foodRespawnTime = 50;
let foodRespawnCounter = 0;
let currentMutationColor = null;
let mutationCount = 0;
let season = "spring";
let colorTraits = {};
let seasonCounter = 0;
let seasonDuration = 3600; // 1 minuto en frames (60 FPS)
let totalDays = 0;
let yearDuration = seasonDuration * 4; // 4 estaciones
let history = []; // Historia de las criaturas
let historySaved = false;
let frameRateMultiplier = 1;
let longestLivingCreatures = [];
let longestLivingDuration = 0;
let creatureIDCounter = 0;

function setup() {
  initializeCanvas();
  initializeCreaturesAndFood();
  startHistorySavingInterval();
}

function draw() {
  setSeasonBackground();
  displayDayAndCreatures();
  updateTotalDays();
  handleFoodRespawn();
  handleSeasonChange();
  updateAndDisplayFood();
  updateAndDisplayCreatures();
  checkLongestLivingCreature();
  displaySeason();
  displayDayAndCreatures();
}

// Inicialización
function initializeCanvas() {
  let canvas = createCanvas(1900, 800);
  canvas.parent("canvas-container");
}

function initializeCreaturesAndFood() {
  for (let i = 0; i < 5; i++) {
    creatures.push(new Creature(11, undefined, undefined, 1.0, generateUniqueID())); // Aumentar tamaño inicial en un 10%
  }
  for (let i = 0; i < 50; i++) {
    food.push(new Food());
  }
}

function startHistorySavingInterval() {
  setInterval(() => {
    if (history.length >= 20000 && !historySaved) {
      saveHistoryAsJSON();
      historySaved = true;
    }
    console.log(history.length);
  }, 5000);
}

// Control de comida
function handleFoodRespawn() {
  foodRespawnCounter++;
  if (foodRespawnCounter >= foodRespawnTime) {
    food.push(new Food());
    foodRespawnCounter = 0;
  }
}

function updateAndDisplayFood() {
  for (let i = food.length - 1; i >= 0; i--) {
    let f = food[i];
    f.move();
    f.show();
    if (f.age()) {
      food.splice(i, 1); // Eliminar comida caducada
    }
  }
}

// Control de estaciones
function handleSeasonChange() {
  seasonCounter++;
  if (seasonCounter >= seasonDuration) {
    seasonCounter = 0;
    changeSeason();
  }
}

function changeSeason() {
  const seasons = ["spring", "summer", "autumn", "winter"];
  let currentSeasonIndex = seasons.indexOf(season);
  season = seasons[(currentSeasonIndex + 1) % seasons.length];
  totalDays += 91; // Añadir 91 días por cada cambio de estación
  adjustFoodRespawnTimeBySeason();
}

function adjustFoodRespawnTimeBySeason() {
  switch (season) {
    case "spring":
      foodRespawnTime = 10;
      break;
    case "summer":
      foodRespawnTime = 50;
      break;
    case "autumn":
      foodRespawnTime = 100;
      break;
    case "winter":
      foodRespawnTime = 200;
      break;
  }
}

// Actualización de días
function updateTotalDays() {
  totalDays = Math.floor(frameCount / (yearDuration / 365));
}

// Visualización
function displaySeason() {
  fill(0);
  textSize(16);
  text(`Season: ${season}`, 10, height - 10);
}

function setSeasonBackground() {
  switch (season) {
    case "spring":
      background(144, 238, 144);
      break;
    case "summer":
      background(255, 165, 0);
      break;
    case "autumn":
      background(210, 105, 30);
      break;
    case "winter":
      background(173, 216, 230);
      break;
  }
}

function displayDayAndCreatures() {
  fill(0);
  textSize(16);
  text(`Days: ${totalDays}`, 10, 20);
  text(`Creatures: ${creatures.length}`, 10, 40);
}

// Historia
function saveHistoryAsJSON() {
  const trainingSet = history.map(entry => ({
    input: entry.input,
    output: entry.output
  }));

  const formData = new FormData();
  const historyBlob = new Blob([JSON.stringify(trainingSet)], {
    type: "application/json",
  });
  formData.append("history", historyBlob);

  fetch("http://localhost:3000/saveHistoryAsJSON", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data.message);
    })
    .catch((error) => {
      console.error("Error saving history:", error);
    });
}

// Contador de colores
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

// Actualización y visualización de criaturas
function updateAndDisplayCreatures() {
  let colorCounts = countColors(creatures);

  for (let i = creatures.length - 1; i >= 0; i--) {
    let c = creatures[i];
    c.move(food, creatures);
    c.eat(food);
    c.show();
    c.age();
    c.checkMitosis(colorCounts);

    for (let j = creatures.length - 1; j >= 0; j--) {
      if (i !== j && c.eatCreature(creatures[j])) {
        creatures.splice(j, 1);
        break;
      }
    }
  }
}

function checkLongestLivingCreature() {
  let maxAge = Math.max(...creatures.map(creature => creature.ageCounter));
  if (maxAge > longestLivingDuration) {
    longestLivingDuration = maxAge;
    longestLivingCreatures = creatures.filter(creature => creature.ageCounter === maxAge);
    console.log(`Nuevo récord de longevidad: ${longestLivingDuration} ticks`);
  }
}

// Clase Food
class Food {
  constructor() {
    this.pos = createVector(random(width), random(height));
    this.type = random(["normal", "growth"]);
    this.vel = createVector(random(-0.125, 0.125), random(-0.125, 0.125));
    this.lifeTime = 3600; // Vida de 1 minuto (60 FPS * 60 segundos)
  }

  move() {
    this.pos.add(this.vel);
    this.vel.add(p5.Vector.random2D().mult(0.0125));
    this.vel.limit(0.125);
    this.checkBorders();
  }

  checkBorders() {
    if (this.pos.x < 0 || this.pos.x > width) this.vel.x *= -1;
    if (this.pos.y < 0 || this.pos.y > height) this.vel.y *= -1;
  }

  age() {
    this.lifeTime--;
    return this.lifeTime <= 0;
  }

  show() {
    stroke(0);
    strokeWeight(1);
    fill(this.type === "normal" ? color(0, 255, 0) : color(255, 0, 0));
    ellipse(this.pos.x, this.pos.y, 5, 5);
  }
}

// Clase Creature
class Creature {
  constructor(
    size = 11,
    pos = createVector(random(width), random(height)),
    color = getInitialColor(),
    speedMultiplier = 1.0,
    id = generateUniqueID()
  ) {
    this.pos = pos;
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.size = size;
    this.color = color;
    this.minSize = 5;
    this.lifeSpan = 10000; // Se puede eliminar o comentar si no se usa
    this.timeSinceLastMeal = 0;
    this.speedMultiplier = speedMultiplier;
    this.energy = 100;
    this.olfatoRange = map(this.size, this.minSize, 100, 75, 250);
    this.lastDirection = createVector(0, 0);
    this.actionHistory = [];
    this.foodEaten = 0;
    this.preyEaten = 0;
    this.reproduced = false;
    this.ageCounter = 0;
    this.borderRepulsionAccum = createVector(0, 0);
    this.inputHistory = [];
    this.outputHistory = [];
    this.id = id;
  }

  applyForce(force) {
    this.acc.add(force);
  }

  move(food, creatures) {
    this.ageCounter++;
    let { closestNormalFood, closestGrowthFood, closestPrey, closestPredator } = this.findClosestEntities(food, creatures);
    let { speed, action } = this.determineAction(closestNormalFood, closestGrowthFood, closestPrey, closestPredator);

    // Guardar entradas y acción
    this.saveInputOutput(closestNormalFood, closestGrowthFood, closestPrey, closestPredator, speed, action);

    this.performAction(action, closestNormalFood, closestGrowthFood, closestPrey, closestPredator, speed);
    this.updateVelocityAndPosition();
    this.handleBorders();
    this.reduceEnergy();
    this.checkEnergy();
  }

  saveInputOutput(closestNormalFood, closestGrowthFood, closestPrey, closestPredator, speed, action) {
    let distanceToBorder = Math.min(this.pos.x, width - this.pos.x, this.pos.y, height - this.pos.y);
  
    let input = {
      distanceToNormalFood: closestNormalFood ? dist(this.pos.x, this.pos.y, closestNormalFood.pos.x, closestNormalFood.pos.y) : Infinity,
      distanceToGrowthFood: closestGrowthFood ? dist(this.pos.x, this.pos.y, closestGrowthFood.pos.x, closestGrowthFood.pos.y) : Infinity,
      distanceToPrey: closestPrey ? dist(this.pos.x, this.pos.y, closestPrey.pos.x, closestPrey.pos.y) : Infinity,
      distanceToPredator: closestPredator ? dist(this.pos.x, this.pos.y, closestPredator.pos.x, closestPredator.pos.y) : Infinity,
      energy: this.energy,
      size: this.size,
      distanceToBorder: distanceToBorder,
      season: ["spring", "summer", "autumn", "winter"].indexOf(season)
    };

    this.inputHistory.push(input);
    this.outputHistory.push(action);
    this.actionHistory.push({ input, output: action }); // Guardar en actionHistory también
  }

  findClosestEntities(food, creatures) {
    let closestNormalFood = null, closestGrowthFood = null, closestPrey = null, closestPredator = null;
    let closestNormalFoodDist = Infinity, closestGrowthFoodDist = Infinity, closestPreyDist = Infinity, closestPredatorDist = Infinity;

    for (let f of food) {
      let d = dist(this.pos.x, this.pos.y, f.pos.x, f.pos.y);
      if (f.type === "normal" && d < closestNormalFoodDist && d < this.olfatoRange) {
        closestNormalFoodDist = d;
        closestNormalFood = f;
      } else if (f.type === "growth" && d < closestGrowthFoodDist && d < this.olfatoRange) {
        closestGrowthFoodDist = d;
        closestGrowthFood = f;
      }
    }

    for (let other of creatures) {
      if (other !== this && other.color !== this.color) {
        let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
        if (d < this.olfatoRange) {
          if (other.size < this.size && d < closestPreyDist) {
            closestPreyDist = d;
            closestPrey = other;
          } else if (other.size > this.size && d < closestPredatorDist) {
            closestPredatorDist = d;
            closestPredator = other;
          }
        }
      }
    }

    return { closestNormalFood, closestGrowthFood, closestPrey, closestPredator };
  }

  determineAction(closestNormalFood, closestGrowthFood, closestPrey, closestPredator) {
    let baseSpeed = 1.5 * this.speedMultiplier * frameRateMultiplier;
    let speed = baseSpeed;
    if (season === "winter") speed *= 0.5;
    else if (season === "summer") speed *= 1.2;

    let action = "wander";
    if (closestPredator) action = "flee";
    else if (closestPrey) action = "pursue";
    else if (closestGrowthFood) action = "seekGrowthFood";
    else if (closestNormalFood) action = "seekNormalFood";

    return { speed, action };
  }

  performAction(action, closestNormalFood, closestGrowthFood, closestPrey, closestPredator, speed) {
    switch (action) {
      case "flee":
        this.flee(closestPredator, speed, closestNormalFood, closestGrowthFood);
        break;
      case "pursue":
        this.pursue(closestPrey, speed, closestNormalFood, closestGrowthFood);
        break;
      case "seekGrowthFood":
        this.seekFood(closestGrowthFood, speed);
        break;
      case "seekNormalFood":
        this.seekFood(closestNormalFood, speed);
        break;
      default:
        this.applyForce(p5.Vector.random2D().mult(0.05));
    }

    this.applyForce(this.borderRepulsionAccum);
  }

  flee(predator, speed, closestNormalFood, closestGrowthFood) {
    let flee = p5.Vector.sub(this.pos, predator.pos).setMag(speed);
    let fleeWithFoodAttraction = this.addFoodAttraction(flee, speed, closestNormalFood, closestGrowthFood);
    this.applyForce(fleeWithFoodAttraction.sub(this.vel).mult(0.1));
  }

  pursue(prey, speed, closestNormalFood, closestGrowthFood) {
    let pursue = p5.Vector.sub(prey.pos, this.pos).setMag(speed);
    let pursueWithFoodAttraction = this.addFoodAttraction(pursue, speed, closestNormalFood, closestGrowthFood);
    this.applyForce(pursueWithFoodAttraction.sub(this.vel).mult(0.1));
  }

  seekFood(food, speed) {
    let desired = p5.Vector.sub(food.pos, this.pos).setMag(speed);
    this.applyForce(desired.sub(this.vel).mult(0.1));
  }

  addFoodAttraction(direction, speed, closestNormalFood, closestGrowthFood) {
    let foodAttractionRange = 100;
    if (closestNormalFood && dist(this.pos.x, this.pos.y, closestNormalFood.pos.x, closestNormalFood.pos.y) < foodAttractionRange) {
      let towardsFood = p5.Vector.sub(closestNormalFood.pos, this.pos).setMag(speed * 1.2);
      direction.add(towardsFood);
    } else if (closestGrowthFood && dist(this.pos.x, this.pos.y, closestGrowthFood.pos.x, closestGrowthFood.pos.y) < foodAttractionRange) {
      let towardsFood = p5.Vector.sub(closestGrowthFood.pos, this.pos).setMag(speed * 1.5);
      direction.add(towardsFood);
    }
    return direction;
  }

  updateVelocityAndPosition() {
    this.vel.add(this.acc);
    this.vel.limit(this.speedMultiplier * frameRateMultiplier);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }

  handleBorders() {
    if (this.pos.x < 0) this.pos.x = 0;
    if (this.pos.x > width) this.pos.x = width;
    if (this.pos.y < 0) this.pos.y = 0;
    if (this.pos.y > height) this.pos.y = height;

    // Lógica de repulsión de los bordes
    let borderThreshold = 10;
    let borderRepulsionStrength = 0.1;

    if (this.pos.x < borderThreshold) {
      this.applyForce(createVector(borderRepulsionStrength, 0));
    }
    if (this.pos.x > width - borderThreshold) {
      this.applyForce(createVector(-borderRepulsionStrength, 0));
    }
    if (this.pos.y < borderThreshold) {
      this.applyForce(createVector(0, borderRepulsionStrength));
    }
    if (this.pos.y > height - borderThreshold) {
      this.applyForce(createVector(0, -borderRepulsionStrength));
    }
  }

  reduceEnergy() {
    let distance = this.vel.mag();
    this.energy -= distance * 0.08;
  }

  checkEnergy() {
    if (this.energy <= 0) this.die();
  }

  die() {
    let index = creatures.indexOf(this);
    if (index > -1) {
      creatures.splice(index, 1);
    }
  }

  eat(food) {
    for (let i = food.length - 1; i >= 0; i--) {
      let d = dist(this.pos.x, this.pos.y, food[i].pos.x, food[i].pos.y);
      if (d < this.size) {
        this.consumeFood(food[i]);
        food.splice(i, 1);
        this.borderRepulsionAccum.mult(0);
        break;
      }
    }
  }

  consumeFood(food) {
    if (food.type === "growth") {
      this.size += 4;
      this.energy += 200;
    } else {
      this.size += 2;
      this.energy += 100;
    }
    this.timeSinceLastMeal = 0;
    this.fitness += 10;
    this.foodEaten++;
  }

  eatCreature(other) {
    let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
    if (d < this.size && this.size > other.size && this.color !== other.color) {
      this.consumeCreature(other);
      return true;
    }
    return false;
  }

  consumeCreature(other) {
    this.size += other.size / 2;
    this.timeSinceLastMeal = 0;
    this.fitness += 50;
    this.energy += other.size * 50;
    this.preyEaten++;
    if (other.actionHistory.length > 0) history.push(...other.actionHistory);
  }

  age() {
    this.timeSinceLastMeal++;

    if (this.timeSinceLastMeal > 1000) {
      this.size -= 1;
      this.timeSinceLastMeal = 0;
      if (this.size < this.minSize) this.size = this.minSize;
    }

    if (this.size <= this.minSize) this.die();
  }

  checkMitosis(colorCounts) {
    if (this.size >= 37.5) this.reproduce(colorCounts);
  }

  reproduce(colorCounts) {
    let numOffspring = this.calculateNumOffspring();
    let childSize = (this.size * 0.9) / numOffspring;
    let distance = this.size;

    for (let i = 0; i < numOffspring; i++) {
      let childColor = this.calculateChildColor(colorCounts);
      let childPos = this.generateChildPosition(distance);
      let child = new Creature(childSize, childPos, childColor, 1.0, generateUniqueID());
      creatures.push(child);
    }

    this.size /= 3;
    if (this.size < this.minSize) this.size = this.minSize;
  }

  calculateNumOffspring() {
    switch (season) {
      case "spring": return 5;
      case "summer": return 4;
      case "autumn": return random(1) < 0.5 ? 4 : 3;
      case "winter": return 3;
      default: return 3;
    }
  }

  calculateChildColor(colorCounts) {
    let childColor = this.color;
    let mutationProbability = min(0.1 * colorCounts[this.color], 0.9);

    if (random(1) < mutationProbability) {
      if (currentMutationColor === null || mutationCount >= 10) {
        currentMutationColor = getRandomColor();
        mutationCount = 0;
      }
      childColor = currentMutationColor;
      mutationCount++;
    }
    return childColor;
  }

  generateChildPosition(distance) {
    let angle = random(TWO_PI);
    return createVector(this.pos.x + cos(angle) * distance, this.pos.y + sin(angle) * distance);
  }

  show() {
    stroke(0);
    strokeWeight(1);
    fill(this.color);
    ellipse(this.pos.x, this.pos.y, this.size, this.size);

    // Cambiar color del área del olfato si está en el array de criaturas más longevas
    if (longestLivingCreatures.map(creature => creature.id).includes(this.id)) {
        fill(255, 215, 0, 50); // Color dorado
    } else {
        fill(0, 0, 255, 20); // Color azul
    }
    noStroke();
    ellipse(this.pos.x, this.pos.y, this.olfatoRange * 2, this.olfatoRange * 2);
  }

  drawOlfatoRange() {
    fill(0, 0, 255, 20);
    noStroke();
    ellipse(this.pos.x, this.pos.y, this.olfatoRange * 2, this.olfatoRange * 2);
  }
}

// Funciones para colores
function getInitialColor() {
  const initialColors = ["red", "blue", "yellow", "green"];
  return initialColors[Math.floor(Math.random() * initialColors.length)];
}

function getRandomColor() {
  let newColor = color(random(255), random(255), random(255));
  let newColorStr = newColor.toString();

  while (colorTraits[newColorStr]) {
    newColor = color(random(255, random(255, 255)));
    newColorStr = newColor.toString();
  }

  return newColorStr;
}

// Generar ID único para cada criatura
function generateUniqueID() {
  return ++creatureIDCounter;
}
