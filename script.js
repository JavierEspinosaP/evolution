let creatures = [];
let food = [];
let foodRespawnTime = 50;
let foodRespawnCounter = 0;
let currentMutationColor = null;
let mutationCount = 0;
let season = "spring";
let seasonCounter = 0;
let seasonDuration = 3600; // 1 minuto en frames (60 FPS)
let totalDays = 0;
let yearDuration = seasonDuration * 4; // 4 estaciones
let history = []; // Historia de las criaturas

function setup() {
  let canvas = createCanvas(1900, 800);
  canvas.parent("canvas-container");
  for (let i = 0; i < 5; i++) {
    creatures.push(new Creature(11)); // Aumentar tamaño inicial en un 10%
  }
  for (let i = 0; i < 50; i++) {
    food.push(new Food());
  }

  // Guardar el historial de las criaturas cada 15 frames (4 veces por segundo)
setInterval(() => {
  console.log(history.length);
}, 5000);

  // Guardar el archivo JSON después de 4 minutos (240 segundos)
  setTimeout(() => {
    // saveHistory(creatures);
    saveHistoryAsJSON();
  }, 21600000);
}

function draw() {
  setSeasonBackground(); // Establecer el fondo según la estación

  // Mostrar días totales y número de criaturas
  displayDayAndCreatures();

  // Actualizar el contador de días
  updateTotalDays();

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

  // Mover y mostrar comida, y eliminar comida caducada
  for (let i = food.length - 1; i >= 0; i--) {
    let f = food[i];
    f.move();
    f.show();
    if (f.age()) {
      food.splice(i, 1); // Eliminar comida caducada
    }
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
  displayDayAndCreatures();
}

// function saveHistory(creatures) {
//   for (let creature of creatures) {
//     if (creature.actionHistory.length > 0) {
//       history.push(creature.actionHistory);
//     }
//   }
// }

function saveHistoryAsJSON() {
  const formData = new FormData();
  const historyBlob = new Blob([JSON.stringify(history)], {
    type: "application/json",
  });
  formData.append("history", historyBlob, "history.json");

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
  totalDays += 91; // Añadir 91 días por cada cambio de estación

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

function updateTotalDays() {
  // Calcula los días totales basados en el frameCount y la duración de un año
  totalDays = Math.floor(frameCount / (yearDuration / 365));
}

function displayDayAndCreatures() {
  fill(0);
  textSize(16);
  text(`Days: ${totalDays}`, 10, 20);
  text(`Creatures: ${creatures.length}`, 10, 40);
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
    fast: "High speed, low endurance",
    strong: "Low speed, high endurance",
    balanced: "Moderate speed and endurance",
  };
  return speciesDescriptions[speciesName];
}

function saveAs(blob, fileName) {
  let url = window.URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
}

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

let frameRateMultiplier = 0.5; // Para ralentizar el sistema a la mitad

class Creature {
  constructor(
    size = 11,
    pos = createVector(random(width), random(height)),
    color = getInitialColor(),
    speedMultiplier = 1.0,
    species = getRandomSpecies(),
    brain = null,
    olfatoRange = null
  ) {
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
    this.energy = 100; // Energía inicial
    this.olfatoRange =
      olfatoRange || map(this.size, this.minSize, 100, 75, 250); // Aumentar ligeramente el rango del olfato
    this.lastDirection = createVector(0, 0); // Última dirección de movimiento
    this.actionHistory = []; // Registro de acciones
    this.foodEaten = 0; // Comida consumida
    this.preyEaten = 0; // Presas consumidas
    this.reproduced = false; // Si se ha reproducido
    this.ageCounter = 0; // Tiempo de existencia

    if (brain) {
      this.brain = brain.clone();
    } else {
      // Aumentar la complejidad de la red neuronal
      this.brain = new synaptic.Architect.Perceptron(20, 40, 40, 2);
    }

    this.fitness = 0; // Recompensa inicial
  }

  // Método para aplicar fuerza
  applyForce(force) {
    this.acc.add(force);
  }

  // Método de movimiento (ajustado para el olfato)
  move(food, creatures) {
    this.ageCounter++; // Incrementar el tiempo de existencia
    let closestNormalFood = null;
    let closestNormalFoodDist = Infinity;
    let closestGrowthFood = null;
    let closestGrowthFoodDist = Infinity;
    let closestPrey = null;
    let closestPreyDist = Infinity;
    let closestPredator = null;
    let closestPredatorDist = Infinity;
    let foodAttractionRange = 50; // Rango en el cual la comida es considerada atractiva durante una persecución

    let totalFoodCount = 0; // Contador de comida cercana
    let totalCreatureCount = 0; // Contador de criaturas cercanas
    let averageSpeed = createVector(0, 0); // Velocidad promedio de las criaturas cercanas
    let averageDirection = createVector(0, 0); // Dirección promedio de las criaturas cercanas
    let averageEnergy = 0; // Energía promedio de las criaturas cercanas

    // Buscar la comida más cercana dentro del rango de olfato
    for (let f of food) {
      let d = dist(this.pos.x, this.pos.y, f.pos.x, f.pos.y);
      if (
        f.type === "normal" &&
        d < closestNormalFoodDist &&
        d < this.olfatoRange
      ) {
        closestNormalFoodDist = d;
        closestNormalFood = f;
      } else if (
        f.type === "growth" &&
        d < closestGrowthFoodDist &&
        d < this.olfatoRange
      ) {
        closestGrowthFoodDist = d;
        closestGrowthFood = f;
      }

      if (d < this.olfatoRange) {
        totalFoodCount++;
      }
    }

    // Buscar el ser más cercano dentro del rango de olfato
    for (let other of creatures) {
      if (other !== this && other.color !== this.color) {
        // Evitar detectar criaturas del mismo color
        let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
        if (d < this.olfatoRange) {
          totalCreatureCount++;
          averageSpeed.add(other.vel);
          averageDirection.add(p5.Vector.sub(other.pos, this.pos));
          averageEnergy += other.energy;

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

    if (totalCreatureCount > 0) {
      averageSpeed.div(totalCreatureCount);
      averageDirection.div(totalCreatureCount).normalize();
      averageEnergy /= totalCreatureCount;
    }

    let baseSpeed =
      this.species.baseSpeed * this.speedMultiplier * frameRateMultiplier;
    let speed = baseSpeed;
    if (season === "winter") {
      speed *= 0.5; // Reducir la velocidad en invierno
    } else if (season === "summer") {
      speed *= 1.2; // Aumentar la velocidad en verano
    }

    // Indicar proximidad al borde
    let edgeProximity = 0;
    if (
      this.pos.x < 50 ||
      this.pos.x > width - 50 ||
      this.pos.y < 50 ||
      this.pos.y > height - 50
    ) {
      edgeProximity = 1;
      this.fitness -= 0.01; // Penalización por tocar el borde
    }

    // Calcular distancia al borde más cercano
    let distanceToEdge = min(
      this.pos.x,
      width - this.pos.x,
      this.pos.y,
      height - this.pos.y
    );

    // Agregar más parámetros a los inputs de la red neuronal
    let inputs = [
      closestNormalFood ? closestNormalFoodDist / this.olfatoRange : 1,
      closestGrowthFood ? closestGrowthFoodDist / this.olfatoRange : 1,
      closestPrey ? closestPreyDist / this.olfatoRange : 1,
      closestPredator ? closestPredatorDist / this.olfatoRange : 1,
      this.size / 100,
      this.lifeSpan / 10000,
      edgeProximity,
      this.energy / 100, // Normalizar la energía
      map(["spring", "summer", "autumn", "winter"].indexOf(season), 0, 3, 0, 1), // Normalizar la temporada
      this.vel.mag() / baseSpeed, // Velocidad actual
      this.lastDirection.heading() / TWO_PI, // Dirección actual
      this.timeSinceLastMeal / 2000, // Tiempo desde la última comida
      this.lifeSpan / 10000, // Edad normalizada
      distanceToEdge / width, // Distancia al borde más cercano
      totalFoodCount / 10, // Cantidad de comida cercana
      totalCreatureCount / 10, // Cantidad de criaturas cercanas
      averageSpeed.mag() / baseSpeed, // Velocidad promedio de las criaturas cercanas
      averageDirection.heading() / TWO_PI, // Dirección promedio de las criaturas cercanas
      averageEnergy / 100, // Energía promedio de las criaturas cercanas
    ];

    let output = this.brain.activate(inputs);
    let adjustment = p5.Vector.random2D().mult(map(output[0], 0, 1, -1, 1)); // Ajusta el movimiento basado en la red neuronal

    let action = "wander"; // Acción por defecto

    if (closestPredator) {
      // Si hay un depredador cerca, huir de él
      let flee = p5.Vector.sub(this.pos, closestPredator.pos).setMag(speed);

      // Desviarse hacia la comida si está dentro del rango de atracción durante la huida
      if (
        closestNormalFood &&
        dist(this.pos.x, this.pos.y, closestNormalFood.pos.x, this.pos.y) <
          foodAttractionRange
      ) {
        let towardsFood = p5.Vector.sub(closestNormalFood.pos, this.pos).setMag(
          speed * 0.5
        ); // Movimiento hacia la comida, pero con prioridad menor que huir
        flee.add(towardsFood);
      } else if (
        closestGrowthFood &&
        dist(this.pos.x, this.pos.y, closestGrowthFood.pos.x, this.pos.y) <
          foodAttractionRange
      ) {
        let towardsFood = p5.Vector.sub(closestGrowthFood.pos, this.pos).setMag(
          speed * 0.5
        );
        flee.add(towardsFood);
      }

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
      this.applyForce(flee.add(adjustment).sub(this.vel).mult(0.1));
      action = "flee";
    } else if (closestPrey) {
      // Si hay una presa cerca, perseguirla
      let pursue = p5.Vector.sub(closestPrey.pos, this.pos).setMag(speed);

      // Desviarse hacia la comida si está dentro del rango de atracción durante la persecución
      if (
        closestNormalFood &&
        dist(this.pos.x, this.pos.y, closestNormalFood.pos.x, this.pos.y) <
          foodAttractionRange
      ) {
        let towardsFood = p5.Vector.sub(closestNormalFood.pos, this.pos).setMag(
          speed * 0.5
        ); // Movimiento hacia la comida, pero con prioridad menor que perseguir
        pursue.add(towardsFood);
      } else if (
        closestGrowthFood &&
        dist(this.pos.x, this.pos.y, closestGrowthFood.pos.x, this.pos.y) <
          foodAttractionRange
      ) {
        let towardsFood = p5.Vector.sub(closestGrowthFood.pos, this.pos).setMag(
          speed * 0.5
        );
        pursue.add(towardsFood);
      }

      this.applyForce(pursue.add(adjustment).sub(this.vel).mult(0.1));
      action = "pursue";
    } else if (closestNormalFood || closestGrowthFood) {
      // Si no hay ni depredador ni presa, moverse hacia la comida
      let closestFood = closestNormalFood || closestGrowthFood;
      let desired = p5.Vector.sub(closestFood.pos, this.pos).setMag(speed);
      this.applyForce(desired.add(adjustment).sub(this.vel).mult(0.1));
      action = "seekFood";
    } else {
      // Si no hay nada cerca, moverse aleatoriamente
      this.applyForce(p5.Vector.random2D().mult(0.05));
    }

    this.vel.add(this.acc);
    this.vel.limit(speed);
    this.pos.add(this.vel);
    this.acc.mult(0);

    this.pos.x = constrain(this.pos.x, 0, width);
    this.pos.y = constrain(this.pos.y, 0, height);

    // Reducir energía basada en la distancia recorrida
    let distance = this.vel.mag();
    this.energy -= distance * 0.08; // Reducir el gasto energético en un 30%

    // Penalización por tener baja energía para incentivar el ahorro
    if (this.energy < 70) {
      this.fitness -= 0.5; // Incrementar la penalización por baja energía
    } else if (this.energy < 30) {
      this.fitness -= 1.0; // Penalización aún más severa si la energía es muy baja
    }

    // Verificar si la energía es menor o igual a cero
    if (this.energy <= 0) {
      let index = creatures.indexOf(this);
      if (index > -1) {
        creatures.splice(index, 1); // Eliminar criatura si se queda sin energía
      }
    }

    // Actualizar la última dirección de movimiento
    this.lastDirection = this.vel.copy();

    // Registrar la acción y su contexto
    if (this.ageCounter % 30 === 0) {
      this.actionHistory.push({
        inputs: inputs,
        action: action
      });
    }

  }

  eat(food) {
    for (let i = food.length - 1; i >= 0; i--) {
      if (
        dist(this.pos.x, this.pos.y, food[i].pos.x, food[i].pos.y) < this.size
      ) {
        if (food[i].type === "growth") {
          this.size += 4;
          this.energy += 200; // Aumentar significativamente la ganancia de energía por comer "growth" food
        } else {
          this.size += 2;
          this.energy += 100; // Aumentar significativamente la ganancia de energía por comer "normal" food
        }
        food.splice(i, 1);
        this.timeSinceLastMeal = 0;
        this.fitness += 10; // Aumentar significativamente la recompensa por comer
        this.foodEaten++; // Incrementar el contador de comida consumida
      }
    }
  }

  eatCreature(other) {
    if (dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y) < this.size) {
      if (this.size > other.size && this.color !== other.color) {
        // Evitar comer criaturas del mismo color
        this.size += other.size / 2;
        this.timeSinceLastMeal = 0;
        this.fitness += 50; // Aumentar significativamente la recompensa por comer una criatura
        this.energy += other.size * 50; // Incrementar significativamente la ganancia de energía por comer una criatura
        this.preyEaten++; // Incrementar el contador de presas consumidas
        if (other.actionHistory.length > 0) {
          history.push(other.actionHistory); // Guardar la historia de la criatura comida
        }
        return true;
      }
    }
    return false;
  }

  age() {
    this.lifeSpan -= 1;
    this.timeSinceLastMeal += 1;

    if (this.timeSinceLastMeal > 1000) {
      // Reducir el tiempo para disminuir el tamaño si no comen
      this.size -= 1; // Aumentar la reducción de tamaño
      this.timeSinceLastMeal = 0;
      if (this.size < this.minSize) {
        this.size = this.minSize;
      }
    }

    if (this.lifeSpan <= 0 || this.size <= this.minSize) {
      let index = creatures.indexOf(this);
      if (index > -1) {
        if (this.actionHistory.length > 0) {
          history.push(this.actionHistory); // Guardar la historia de la criatura en el array global de historia
        }
        creatures.splice(index, 1);
      }
    }
  }

  checkMitosis(colorCounts) {
    // Tamaño para hacer mitosis es 1.25 veces el tamaño actual
    if (this.size >= 37.5) {
      // Incrementar el tamaño mínimo necesario para la mitosis
      let numOffspring;
      switch (season) {
        case "spring":
          numOffspring = 5; // En primavera nacen 5 individuos
          break;
        case "summer":
          numOffspring = 4; // En verano nacen 4 individuos
          break;
        case "autumn":
          numOffspring = random(1) < 0.5 ? 4 : 3; // En otoño 50% de probabilidades de 3 o 4 individuos
          break;
        case "winter":
          numOffspring = 3; // En invierno nacen 3 individuos
          break;
        default:
          numOffspring = 3;
      }

      // Tamaño total resultante es 0.90 veces el tamaño del progenitor
      let childSize = (this.size * 0.9) / numOffspring;
      let distance = this.size / 2; // Distancia para separar a los hijos

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

        let childBrain = this.brain.clone();
        childBrain.mutate(); // Aplicar una mutación a la red neuronal del hijo

        // Mutar el rango del olfato
        let childOlfatoRange = this.olfatoRange * random(0.95, 1.2); // Aumentar ligeramente el rango de mutación

        // Generar una posición para el hijo
        let angle = random(TWO_PI);
        let childPos = createVector(
          this.pos.x + cos(angle) * distance,
          this.pos.y + sin(angle) * distance
        );
        childPos.x = constrain(childPos.x, 0, width);
        childPos.y = constrain(childPos.y, 0, height);

        let child = new Creature(
          childSize,
          childPos,
          childColor,
          childSpeedMultiplier,
          this.species,
          childBrain,
          childOlfatoRange
        );
        creatures.push(child);
      }

      let index = creatures.indexOf(this);
      if (index > -1) {
        creatures.splice(index, 1); // Eliminar el progenitor
        this.reproduced = true; // Marcar que la criatura se ha reproducido
        if (this.actionHistory.length > 0) {
          history.push(this.actionHistory); // Guardar la historia de la criatura en el array global de historia

        }
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

// Función para obtener el color inicial
function getInitialColor() {
  const initialColors = ["red", "blue", "yellow", "green"];
  return initialColors[Math.floor(Math.random() * initialColors.length)];
}

// Función para obtener una especie aleatoria
function getRandomSpecies() {
  const speciesList = [
    { name: "fast", baseSpeed: 2.0 },
    { name: "strong", baseSpeed: 1.0 },
    { name: "balanced", baseSpeed: 1.5 },
  ];
  return speciesList[Math.floor(Math.random() * speciesList.length)];
}

// Función para obtener un color aleatorio
function getRandomColor() {
  let newColor = color(random(255), random(255), random(255));
  let newColorStr = newColor.toString();

  // Si el color ya existe, generar otro
  while (colorTraits[newColorStr]) {
    newColor = color(random(255), random(255), random(255));
    newColorStr = newColor.toString();
  }

  // Asignar características aleatorias al nuevo color
  colorTraits[newColorStr] = createRandomTraits();

  return newColorStr;
}

// Función para crear características aleatorias
function createRandomTraits() {
  return {
    speedMultiplier: random(0.8, 1.5), // Velocidad entre 0.8x y 1.5x
    energyConsumption: random(0.06, 0.15), // Consumo de energía entre 0.06 y 0.15
    preyPreference: random(0.4, 0.7), // Preferencia por presas entre 0.4 y 0.7
    foodPreference: random(0.3, 0.6), // Preferencia por comida entre 0.3 y 0.6
  };
}

// Agregar métodos de mutación a la red neuronal
synaptic.Neuron.prototype.mutate = function () {
  const mutationRate = 0.2; // Aumentar la tasa de mutación
  for (let i = 0; i < this.connections.projected.length; i++) {
    if (Math.random() < mutationRate) {
      this.connections.projected[i].weight += (Math.random() - 0.6) * 0.1; //tasa de mutacion
    }
  }
};

synaptic.Layer.prototype.mutate = function () {
  for (let i = 0; i < this.list.length; i++) {
    this.list[i].mutate();
  }
};

synaptic.Network.prototype.mutate = function () {
  for (let i = 0; i < this.layers.hidden.length; i++) {
    this.layers.hidden[i].mutate();
  }
  this.layers.output.mutate();
};

// Función para obtener el color inicial
function getInitialColor() {
  const initialColors = ["red", "blue", "yellow", "green"];
  return initialColors[Math.floor(Math.random() * initialColors.length)];
}

// Función para obtener una especie aleatoria
function getRandomSpecies() {
  const speciesList = [
    { name: "fast", baseSpeed: 2.0 },
    { name: "strong", baseSpeed: 1.0 },
    { name: "balanced", baseSpeed: 1.5 },
  ];
  return speciesList[Math.floor(Math.random() * speciesList.length)];
}

// Función para obtener un color aleatorio
function getRandomColor() {
  return color(random(255), random(255), random(255));
}

// Agregar métodos de mutación a la red neuronal
synaptic.Neuron.prototype.mutate = function () {
  const mutationRate = 0.2; // Aumentar la tasa de mutación
  for (let i = 0; i < this.connections.projected.length; i++) {
    if (Math.random() < mutationRate) {
      this.connections.projected[i].weight += (Math.random() - 0.5) * 0.1;
    }
  }
};

synaptic.Layer.prototype.mutate = function () {
  for (let i = 0; i < this.list.length; i++) {
    this.list[i].mutate();
  }
};

synaptic.Network.prototype.mutate = function () {
  for (let i = 0; i < this.layers.hidden.length; i++) {
    this.layers.hidden[i].mutate();
  }
  this.layers.output.mutate();
};
