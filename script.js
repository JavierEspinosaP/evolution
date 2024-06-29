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

function setup() {
  let canvas = createCanvas(1200, 600);
  canvas.parent('canvas-container');
  for (let i = 0; i < 30; i++) {
    creatures.push(new Creature(11)); // Aumentar tamaño inicial en un 10%
  }
  for (let i = 0; i < 50; i++) {
    food.push(new Food());
  }
}

function draw() {
  setSeasonBackground(); // Establecer el fondo según la estación

  // Mostrar días totales y número de criaturas
  displayDayAndCreatures();

  // Actualizar el contador de días
  updateTotalDays();

  // Controlar el respawn de comida
  if (++foodRespawnCounter >= foodRespawnTime) {
    food.push(new Food());
    foodRespawnCounter = 0;
  }

  // Controlar el cambio de estación
  if (++seasonCounter >= seasonDuration) {
    seasonCounter = 0;
    changeSeason();
  }

  // Mover y mostrar comida
  food.forEach(f => {
    f.move();
    f.show();
  });

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
        if (j < i) i--; // Ajustar el índice si se elimina un elemento antes de la posición actual
        break;
      }
    }
  }
  
  

  displaySeason();
  displayDayAndCreatures();
}

function countColors(creatures) {
  let colorCounts = {};
  for (let creature of creatures) {
    colorCounts[creature.color] = (colorCounts[creature.color] || 0) + 1;
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

let frameRateMultiplier = 0.5; // Para ralentizar el sistema a la mitad

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
    this.sprintCounter = 0;
    this.speedMultiplier = speedMultiplier;
    this.species = species;
    this.energy = 100; // Energía inicial
    this.olfatoRange = olfatoRange || map(this.size, this.minSize, 100, 50, 200); // Inicializar el rango del olfato
    this.lastDirection = createVector(0, 0); // Última dirección de movimiento

    if (brain) {
      this.brain = brain.clone();
    } else {
      this.brain = new synaptic.Architect.Perceptron(20, 80, 2); // Ajustar la estructura de la red neuronal
    }

    this.fitness = 0; // Recompensa inicial
  }

  // Método para aplicar fuerza
  applyForce(force) {
    this.acc.add(force);
  }

  // Método de movimiento (ajustado para el olfato)
  move(food, creatures) {
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
      if (f.type === "normal" && d < closestNormalFoodDist && d < this.olfatoRange) {
        closestNormalFoodDist = d;
        closestNormalFood = f;
      } else if (f.type === "growth" && d < closestGrowthFoodDist && d < this.olfatoRange) {
        closestGrowthFoodDist = d;
        closestGrowthFood = f;
      }

      if (d < this.olfatoRange) {
        totalFoodCount++;
      }
    }

    // Buscar el ser más cercano dentro del rango de olfato
    for (let other of creatures) {
      if (other !== this) {
        let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
        if (d < this.olfatoRange) {
          totalCreatureCount++;
          averageSpeed.add(other.vel);
          averageDirection.add(p5.Vector.sub(other.pos, this.pos));
          averageEnergy += other.energy;

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

    if (totalCreatureCount > 0) {
      averageSpeed.div(totalCreatureCount);
      averageDirection.div(totalCreatureCount).normalize();
      averageEnergy /= totalCreatureCount;
    }

    let baseSpeed = this.species.baseSpeed * this.speedMultiplier * frameRateMultiplier;
    let speed = baseSpeed;
    if (season === "winter") {
      speed *= 0.5; // Reducir la velocidad en invierno
    } else if (season === "summer") {
      speed *= 1.2; // Aumentar la velocidad en verano
    }

    // Indicar proximidad al borde
    let edgeProximity = 0;
    if (this.pos.x < 50 || this.pos.x > width - 50 || this.pos.y < 50 || this.pos.y > height - 50) {
      edgeProximity = 1;
      this.fitness -= 0.01; // Penalización por tocar el borde
    }

    // Calcular distancia al borde más cercano
    let distanceToEdge = min(this.pos.x, width - this.pos.x, this.pos.y, height - this.pos.y);

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
      averageEnergy / 100 // Energía promedio de las criaturas cercanas
    ];

    let output = this.brain.activate(inputs);
    let adjustment = p5.Vector.random2D().mult(map(output[0], 0, 1, -1, 1)); // Ajusta el movimiento basado en la red neuronal

    if (closestPredator) {
      // Si hay un depredador cerca, huir de él
      let flee = p5.Vector.sub(this.pos, closestPredator.pos).setMag(speed);

      // Desviarse hacia la comida si está dentro del rango de atracción durante la huida
      if (closestNormalFood && dist(this.pos.x, this.pos.y, closestNormalFood.pos.x, closestNormalFood.pos.y) < foodAttractionRange) {
        let towardsFood = p5.Vector.sub(closestNormalFood.pos, this.pos).setMag(speed * 0.5); // Movimiento hacia la comida, pero con prioridad menor que huir
        flee.add(towardsFood);
      } else if (closestGrowthFood && dist(this.pos.x, this.pos.y, closestGrowthFood.pos.x, closestGrowthFood.pos.y) < foodAttractionRange) {
        let towardsFood = p5.Vector.sub(closestGrowthFood.pos, this.pos).setMag(speed * 0.5);
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
    } else if (closestPrey) {
      // Si hay una presa cerca, perseguirla
      let pursue = p5.Vector.sub(closestPrey.pos, this.pos).setMag(speed);

      // Desviarse hacia la comida si está dentro del rango de atracción durante la persecución
      if (closestNormalFood && dist(this.pos.x, this.pos.y, closestNormalFood.pos.x, closestNormalFood.pos.y) < foodAttractionRange) {
        let towardsFood = p5.Vector.sub(closestNormalFood.pos, this.pos).setMag(speed * 0.5); // Movimiento hacia la comida, pero con prioridad menor que perseguir
        pursue.add(towardsFood);
      } else if (closestGrowthFood && dist(this.pos.x, this.pos.y, closestGrowthFood.pos.x, closestGrowthFood.pos.y) < foodAttractionRange) {
        let towardsFood = p5.Vector.sub(closestGrowthFood.pos, this.pos).setMag(speed * 0.5);
        pursue.add(towardsFood);
      }

      this.applyForce(pursue.add(adjustment).sub(this.vel).mult(0.1));
    } else if (closestNormalFood || closestGrowthFood) {
      // Si no hay ni depredador ni presa, moverse hacia la comida
      let closestFood = closestNormalFood || closestGrowthFood;
      let desired = p5.Vector.sub(closestFood.pos, this.pos).setMag(speed);
      this.applyForce(desired.add(adjustment).sub(this.vel).mult(0.1));
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
    this.energy -= distance * 0.07; // Reducir gasto energético en un 30%

    // Penalización por tener baja energía para incentivar el ahorro
    if (this.energy < 50) {
      this.fitness -= 0.1;
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
  }

  eat(food) {
    for (let i = food.length - 1; i >= 0; i--) {
      if (dist(this.pos.x, this.pos.y, food[i].pos.x, food[i].pos.y) < this.size) {
        if (food[i].type === "growth") {
          this.size += 4;
          this.energy += 50; // Ganancia de energía por comer "growth" food
        } else {
          this.size += 2;
          this.energy += 25; // Ganancia de energía por comer "normal" food
        }
        food.splice(i, 1);
        this.timeSinceLastMeal = 0;
        this.fitness += 1; // Recompensa por comer
      }
    }
  }

  eatCreature(other) {
    if (dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y) < this.size) {
      if (this.size > other.size) {
        this.size += other.size / 2;
        this.timeSinceLastMeal = 0;
        this.fitness += 5; // Recompensa mayor por comer una criatura
        this.energy += other.size * 10; // Incremento de energía basado en el tamaño de la criatura comida
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
    // Tamaño para hacer mitosis es 1.25 veces el tamaño actual
    if (this.size < 37.5) return; // Salir temprano si no cumple el tamaño mínimo
  
    const numOffspringMap = {
      "spring": 5,
      "summer": 4,
      "autumn": Math.random() < 0.5 ? 4 : 3,
      "winter": 3
    };
  
    const numOffspring = numOffspringMap[season] || 3;
    const childSize = this.size * 0.90 / numOffspring;
    const distance = this.size / 2; // Distancia para separar a los hijos
  
    for (let i = 0; i < numOffspring; i++) {
      let childColor = this.color;
      const mutationProbability = Math.min(0.1 * (colorCounts[this.color] || 0), 0.9);
  
      if (Math.random() < mutationProbability) {
        if (currentMutationColor === null || mutationCount >= 10) {
          currentMutationColor = getRandomColor();
          mutationCount = 0;
        }
        childColor = currentMutationColor;
        mutationCount++;
      }
  
      const childBrain = this.brain.clone();
      childBrain.mutate(); // Aplicar una mutación a la red neuronal del hijo
  
      const childOlfatoRange = this.olfatoRange * Math.random() * 0.2 + 0.9; // Mutar el rango del olfato
  
      // Generar una posición para el hijo
      const angle = Math.random() * TWO_PI;
      const childPos = createVector(this.pos.x + Math.cos(angle) * distance, this.pos.y + Math.sin(angle) * distance);
      childPos.x = constrain(childPos.x, 0, width);
      childPos.y = constrain(childPos.y, 0, height);
  
      creatures.push(new Creature(childSize, childPos, childColor, this.speedMultiplier, this.species, childBrain, childOlfatoRange));
    }
  
    const index = creatures.indexOf(this);
    if (index > -1) {
      creatures.splice(index, 1); // Eliminar el progenitor
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
  const initialColors = ['red', 'blue', 'yellow', 'green'];
  return initialColors[Math.floor(Math.random() * initialColors.length)];
}

// Función para obtener una especie aleatoria
function getRandomSpecies() {
  const speciesList = [
    { name: 'fast', baseSpeed: 2.0 },
    { name: 'strong', baseSpeed: 1.0 },
    { name: 'balanced', baseSpeed: 1.5 }
  ];
  return speciesList[Math.floor(Math.random() * speciesList.length)];
}

// Función para obtener un color aleatorio
function getRandomColor() {
  return color(random(255), random(255), random(255));
}

// Agregar métodos de mutación a la red neuronal
synaptic.Neuron.prototype.mutate = function() {
  const mutationRate = 0.1;
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
