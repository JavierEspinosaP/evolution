let creatures = [];
let food = [];
let foodRespawnTime = 50;
let foodRespawnCounter = 0;
let totalDays = 0;

function setup() {
  let canvas = createCanvas(1900, 800);
  canvas.parent('canvas-container');

  // Entrenar a las criaturas antes de agregarlas al entorno
  let trainingData = generateTrainingData(1000); // Generar datos de entrenamiento
  let preTrainedBrain = preTrainNetwork(trainingData);

  for (let i = 0; i < 30; i++) {
    creatures.push(new Creature(11, undefined, undefined, undefined, undefined, preTrainedBrain.clone()));
  }
  for (let i = 0; i < 50; i++) {
    food.push(new Food());
  }
}

function draw() {
  background(220);

  displayDayAndCreatures();
  updateTotalDays();

  foodRespawnCounter++;
  if (foodRespawnCounter >= foodRespawnTime) {
    food.push(new Food());
    foodRespawnCounter = 0;
  }

  for (let i = food.length - 1; i >= 0; i--) {
    let f = food[i];
    f.move();
    f.show();
    if (f.age()) {
      food.splice(i, 1);
    }
  }

  for (let i = creatures.length - 1; i >= 0; i--) {
    let c = creatures[i];
    c.move(food, creatures);
    c.eat(food);
    c.show();
    c.age();
    c.checkMitosis();

    for (let j = creatures.length - 1; j >= 0; j--) {
      if (i !== j && c.eatCreature(creatures[j])) {
        creatures.splice(j, 1);
        break;
      }
    }
  }

  displayDayAndCreatures();
}

function generateTrainingData(samples) {
  let data = [];
  for (let i = 0; i < samples; i++) {
    let size = random(5, 30);
    let lifeSpan = random(0, 10000);
    let energy = random(0, 100);
    let velocity = random(0, 5);
    let direction = random(-PI, PI);
    let timeSinceLastMeal = random(0, 2000);
    let posX = random(0, width);
    let posY = random(0, height);

    let input = [
      size / 100,
      lifeSpan / 10000,
      energy / 100,
      velocity / 5,
      direction / TWO_PI,
      timeSinceLastMeal / 2000,
      posX / width,
      posY / height
    ];

    let output = [
      map(noise(i), 0, 1, 0, 1), // Salida simulada para la dirección
      map(noise(i + samples), 0, 1, 0, 1) // Salida simulada para la velocidad
    ];

    data.push({ input, output });
  }
  return data;
}

function preTrainNetwork(trainingData) {
  let network = new synaptic.Architect.Perceptron(8, 20, 20, 2);
  let trainer = new synaptic.Trainer(network);
  trainer.train(trainingData, {
    rate: 0.1,
    iterations: 20000,
    error: 0.005,
    shuffle: true,
    log: 1000
  });
  return network;
}

function displayDayAndCreatures() {
  fill(0);
  textSize(16);
  text(`Days: ${totalDays}`, 10, 20);
  text(`Creatures: ${creatures.length}`, 10, 40);
}

function updateTotalDays() {
  totalDays = Math.floor(frameCount / (3600 / 365));
}

class Food {
  constructor() {
    this.pos = createVector(random(width), random(height));
    this.type = random(["normal", "growth"]);
    this.vel = createVector(random(-0.125, 0.125), random(-0.125, 0.125));
    this.lifeTime = 3600;
  }

  move() {
    this.pos.add(this.vel);
    this.vel.add(p5.Vector.random2D().mult(0.0125));
    this.vel.limit(0.125);
    this.pos.x = constrain(this.pos.x, 0, width);
    this.pos.y = constrain(this.pos.y, 0, height);
  }

  age() {
    this.lifeTime--;
    return this.lifeTime <= 0;
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
  constructor(size = 11, pos = createVector(random(width), random(height)), color = getInitialColor(), speedMultiplier = 1.0, species = getRandomSpecies(), brain = null, olfatoRange = null) {
    this.pos = pos;
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.size = size;
    this.color = color;
    this.minSize = 5;
    this.lifeSpan = 10000;
    this.timeSinceLastMeal = 0;
    this.speedMultiplier = speedMultiplier;
    this.species = species;
    this.energy = 100;
    this.olfatoRange = olfatoRange || map(this.size, this.minSize, 100, 75, 250);
    this.lastDirection = p5.Vector.random2D();
    this.ageCounter = 0;

    if (brain) {
      this.brain = brain;
    } else {
      this.brain = new synaptic.Architect.Perceptron(8, 20, 20, 2);
    }

    this.fitness = 0;
  }

  applyForce(force) {
    this.acc.add(force);
  }

  move(food, creatures) {
    let inputs = [
      this.size / 100,
      this.lifeSpan / 10000,
      this.energy / 100,
      this.vel.mag() / 5,
      this.lastDirection.heading() / TWO_PI,
      this.timeSinceLastMeal / 2000,
      this.pos.x / width,
      this.pos.y / height
    ];

    let output = this.brain.activate(inputs);
    let angle = map(output[0], 0, 1, -PI, PI);
    let speed = map(output[1], 0, 1, 0, this.species.baseSpeed * this.speedMultiplier);

    let adjustment = p5.Vector.fromAngle(angle).mult(speed);
    this.applyForce(adjustment);

    this.vel.add(this.acc);
    this.vel.limit(this.species.baseSpeed * this.speedMultiplier);
    this.pos.add(this.vel);
    this.acc.mult(0);

    this.pos.x = constrain(this.pos.x, 0, width);
    this.pos.y = constrain(this.pos.y, 0, height);

    let distance = this.vel.mag();
    this.energy -= distance * 0.02;

    if (this.energy <= 0) {
      let index = creatures.indexOf(this);
      if (index > -1) {
        creatures.splice(index, 1);
      }
    }

    this.lastDirection = this.vel.copy();
    this.ageCounter++;
  }

  eat(food) {
    for (let i = food.length - 1; i >= 0; i--) {
      if (dist(this.pos.x, this.pos.y, food[i].pos.x, food[i].pos.y) < this.size) {
        if (food[i].type === "growth") {
          this.size += 4;
          this.energy += 200;
        } else {
          this.size += 2;
          this.energy += 100;
        }
        food.splice(i, 1);
        this.timeSinceLastMeal = 0;
        this.fitness += 10;
      }
    }
  }

  eatCreature(other) {
    if (dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y) < this.size) {
      if (this.size > other.size && this.color !== other.color) {
        this.size += other.size / 2;
        this.timeSinceLastMeal = 0;
        this.fitness += 50;
        this.energy += other.size * 50;
        return true;
      }
    }
    return false;
  }

  age() {
    this.lifeSpan -= 1;
    this.timeSinceLastMeal += 1;

    if (this.timeSinceLastMeal > 1000) {
      this.size -= 1;
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

  checkMitosis() {
    if (this.size >= 37.5) {
      let numOffspring = 3;
      let childSize = this.size * 0.90 / numOffspring;
      let distance = this.size / 2;

      for (let i = 0; i < numOffspring; i++) {
        let childColor = this.color;
        let childSpeedMultiplier = this.speedMultiplier;
        let mutationProbability = 0.1;

        if (random(1) < mutationProbability) {
          childColor = getRandomColor();
        }

        let childBrain = this.brain.clone();
        childBrain.mutate();

        let childOlfatoRange = this.olfatoRange * random(0.95, 1.2);

        let angle = random(TWO_PI);
        let childPos = createVector(this.pos.x + cos(angle) * distance, this.pos.y + sin(angle) * distance);
        childPos.x = constrain(childPos.x, 0, width);
        childPos.y = constrain(childPos.y, 0, height);

        let child = new Creature(childSize, childPos, childColor, childSpeedMultiplier, this.species, childBrain, childOlfatoRange);
        creatures.push(child);
      }

      let index = creatures.indexOf(this);
      if (index > -1) {
        creatures.splice(index, 1);
      }
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
  let newColor = color(random(255), random(255), random(255));
  return newColor.toString();
}

synaptic.Neuron.prototype.mutate = function() {
  const mutationRate = 0.2;
  for (let i = 0; i < this.connections.projected.length; i++) {
    if (Math.random() < mutationRate) {
      this.connections.projected[i].weight += (Math.random() - 0.5) * 0.1;
    }
  }
};

synaptic.Layer.prototype.mutate = function() {
  for (let i = 0; i < this.list.length; i++) {
    this.list[i].mutate();
  }
};

synaptic.Network.prototype.mutate = function() {
  for (let i = 0; i < this.layers.hidden.length; i++) {
    this.layers.hidden[i].mutate();
  }
  this.layers.output.mutate();
};
