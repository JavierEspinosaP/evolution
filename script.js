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
  if (history.length >= 20000 && !historySaved) {
    saveHistoryAsJSON();
    historySaved = true; // Indicar que la historia ya se ha guardado
  }
  console.log(history.length);
}, 5000);
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

function normalize(value) {
  // Convierte de [-1, 1] a [0, 1]
  return (value + 1) / 2;
}

function denormalize(value) {
  // Convierte de [0, 1] a [-1, 1]
  return (value * 2) - 1;
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

    // Evitar salir de los bordes
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
    this.borderRepulsionAccum = createVector(0, 0); // Fuerza de repulsión acumulativa

    if (brain) {
      this.brain = brain.clone();
    } else {
      // Ajustado para agregar el nuevo input y configurar 3 salidas
      this.brain = new synaptic.Architect.Perceptron(17, 4, 4, 4, 3); 
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
    let foodAttractionRange = 100; // Rango en el cual la comida es considerada atractiva durante una persecución o huida (doble del valor original)

    let totalNormalFoodCount = 0; // Contador de comida normal cercana
    let totalGrowthFoodCount = 0; // Contador de comida growth cercana
    let totalCreatureCount = 0; // Contador de criaturas cercanas
    let averageSpeed = createVector(0, 0); // Velocidad promedio de las criaturas cercanas
    let averageDirection = createVector(0, 0); // Dirección promedio de las criaturas cercanas
    let averageEnergy = 0; // Energía promedio de las criaturas cercanas

    let distanceToBorder = min(
      this.pos.x,
      width - this.pos.x,
      this.pos.y,
      height - this.pos.y
    );

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
        totalNormalFoodCount++;
      } else if (
        f.type === "growth" &&
        d < closestGrowthFoodDist &&
        d < this.olfatoRange
      ) {
        closestGrowthFoodDist = d;
        closestGrowthFood = f;
        totalGrowthFoodCount++;
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

    // Inicializar el valor de desviación hacia la comida
    let deviationToFood = 0;

    // Agregar más parámetros a los inputs de la red neuronal
    let inputs = [
      closestNormalFood ? closestNormalFoodDist / this.olfatoRange : 1,
      closestGrowthFood ? closestGrowthFoodDist / this.olfatoRange : 1,
      closestPrey ? closestPreyDist / this.olfatoRange : 1,
      closestPredator ? closestPredatorDist / this.olfatoRange : 1,
      this.size / 100,
      this.energy / 100, // Normalizar la energía
      map(["spring", "summer", "autumn", "winter"].indexOf(season), 0, 3, 0, 1), // Normalizar la temporada
      this.vel.mag() / baseSpeed, // Velocidad actual
      this.lastDirection.heading() / TWO_PI, // Dirección actual
      this.timeSinceLastMeal / 2000, // Tiempo desde la última comida
      totalNormalFoodCount / 10, // Cantidad de comida normal cercana
      totalGrowthFoodCount / 10, // Cantidad de comida growth cercana
      totalCreatureCount / 10, // Cantidad de criaturas cercanas
      averageSpeed.mag() / baseSpeed, // Velocidad promedio de las criaturas cercanas
      averageDirection.heading() / TWO_PI, // Dirección promedio de las criaturas cercanas
      distanceToBorder / max(width, height), // Distancia al borde normalizada
      deviationToFood // Placeholder para la desviación hacia la comida
    ];

    let output = this.brain.activate(inputs);
    // Normalizar los valores de output antes de guardarlos en el historial
    let normalizedOutput = output.map(value => normalize(value));
// Cuando corra la simulacion, desnormalizar



    // Salidas de la red neuronal: x, y, velocidad
    let outputX = map(output[0], 0, 1, -1, 1);
    let outputY = map(output[1], 0, 1, -1, 1);
    let outputSpeed = map(output[2], 0, 1, 0, baseSpeed);

    // Vector de ajuste de la red neuronal
    let adjustment = createVector(outputX, outputY).setMag(outputSpeed);

    let action = "wander"; // Acción por defecto

    // Penalización adicional por acercarse al borde
    let borderRepulsion = createVector(0, 0);
    let borderThreshold = 50; // Distancia mínima para empezar a evitar el borde reducida a la mitad
    let borderRepulsionStrength = 0.001; // Factor de repulsión inicial suave
    let repulsionAcceleration = 0.00001; // Aceleración de la repulsión reducida a la mitad

    if (this.pos.x < borderThreshold) {
      borderRepulsion.x =
        (borderRepulsionStrength * (borderThreshold - this.pos.x)) /
        borderThreshold;
    } else if (this.pos.x > width - borderThreshold) {
      borderRepulsion.x =
        (-borderRepulsionStrength * (this.pos.x - (width - borderThreshold))) /
        borderThreshold;
    }

    if (this.pos.y < borderThreshold) {
      borderRepulsion.y =
        (borderRepulsionStrength * (borderThreshold - this.pos.y)) /
        borderThreshold;
    } else if (this.pos.y > height - borderThreshold) {
      borderRepulsion.y =
        (-borderRepulsionStrength * (this.pos.y - (height - borderThreshold))) /
        borderThreshold;
    }

    this.borderRepulsionAccum.add(borderRepulsion);
    this.borderRepulsionAccum.mult(1 + repulsionAcceleration); // Aumentar la fuerza de repulsión acumulativa con aceleración

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
          speed * 1.2 // Movimiento hacia la comida con alta prioridad durante la huida
        );
        let fleeTowardsFood = flee.copy().add(towardsFood);

        // Solo desviarse si no acorta la distancia al depredador
        if (
          p5.Vector.sub(fleeTowardsFood, this.pos).mag() >
          p5.Vector.sub(flee, this.pos).mag()
        ) {
          flee = fleeTowardsFood;
          deviationToFood = p5.Vector.sub(towardsFood, this.pos).mag() / speed; // Normalizar la desviación
        }
      } else if (
        closestGrowthFood &&
        dist(this.pos.x, this.pos.y, closestGrowthFood.pos.x, this.pos.y) <
          foodAttractionRange
      ) {
        let towardsFood = p5.Vector.sub(closestGrowthFood.pos, this.pos).setMag(
          speed * 1.5 // Movimiento hacia la comida con alta prioridad durante la huida
        );
        let fleeTowardsFood = flee.copy().add(towardsFood);

        // Solo desviarse si no acorta la distancia al depredador
        if (
          p5.Vector.sub(fleeTowardsFood, this.pos).mag() >
          p5.Vector.sub(flee, this.pos).mag()
        ) {
          flee = fleeTowardsFood;
          deviationToFood = p5.Vector.sub(towardsFood, this.pos).mag() / speed; // Normalizar la desviación
        }
      }

      // Aplicar la repulsión del borde acumulativa si no acorta la distancia al depredador
      let fleeWithRepulsion = flee.copy().add(this.borderRepulsionAccum);
      if (
        p5.Vector.sub(fleeWithRepulsion, this.pos).mag() >
        p5.Vector.sub(flee, this.pos).mag()
      ) {
        this.applyForce(
          fleeWithRepulsion.add(adjustment).sub(this.vel).mult(0.1)
        );
      } else {
        this.applyForce(flee.add(adjustment).sub(this.vel).mult(0.1));
      }
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
          speed * 1.2 // Movimiento hacia la comida con alta prioridad durante la persecución
        );
        pursue.add(towardsFood);
        deviationToFood = p5.Vector.sub(towardsFood, this.pos).mag() / speed; // Normalizar la desviación
      } else if (
        closestGrowthFood &&
        dist(this.pos.x, this.pos.y, closestGrowthFood.pos.x, this.pos.y) <
          foodAttractionRange
      ) {
        let towardsFood = p5.Vector.sub(closestGrowthFood.pos, this.pos).setMag(
          speed * 1.5 // Movimiento hacia la comida con alta prioridad durante la persecución
        );
        pursue.add(towardsFood);
        deviationToFood = p5.Vector.sub(towardsFood, this.pos).mag() / speed; // Normalizar la desviación
      }

      this.applyForce(pursue.add(adjustment).sub(this.vel).mult(0.1));
      action = "pursue";
    } else if (closestGrowthFood) {
      // Si hay comida growth, priorizarla
      let desired = p5.Vector.sub(closestGrowthFood.pos, this.pos).setMag(
        speed
      );
      this.applyForce(desired.add(adjustment).sub(this.vel).mult(0.1));
      action = "seekGrowthFood";
    } else if (closestNormalFood) {
      // Si no hay comida growth, buscar comida normal
      let desired = p5.Vector.sub(closestNormalFood.pos, this.pos).setMag(
        speed
      );
      this.applyForce(desired.add(adjustment).sub(this.vel).mult(0.1));
      action = "seekNormalFood";
    } else {
      // Si no hay nada cerca, moverse aleatoriamente
      this.applyForce(p5.Vector.random2D().mult(0.05));
    }

    // Aplicar la repulsión del borde acumulativa
    this.applyForce(this.borderRepulsionAccum);

    this.vel.add(this.acc);
    this.vel.limit(speed);
    this.pos.add(this.vel);
    this.acc.mult(0);

    // Evitar salir de los bordes
    if (this.pos.x < 0) this.pos.x = 0;
    if (this.pos.x > width) this.pos.x = width;
    if (this.pos.y < 0) this.pos.y = 0;
    if (this.pos.y > height) this.pos.y = height;

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

    // Actualizar el input de desviación hacia la comida
    inputs[inputs.length - 1] = deviationToFood;

    // Registrar el input y output en el historial
    if (this.ageCounter % 60 === 0) {
      this.actionHistory.push({
        input: inputs,
        output: normalizedOutput
      });
    }
  }

  eat(food) {
    for (let i = food.length - 1; i >= 0; i--) {
      let d = dist(this.pos.x, this.pos.y, food[i].pos.x, food[i].pos.y);
      if (d < this.size) {
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
        this.borderRepulsionAccum.mult(0); // Reiniciar la repulsión acumulativa al comer
        break;
      }
    }
  }

  eatCreature(other) {
    let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
    if (d < this.size) {
      if (this.size > other.size && this.color !== other.color) {
        // Evitar comer criaturas del mismo color
        this.size += other.size / 2;
        this.timeSinceLastMeal = 0;
        this.fitness += 50; // Aumentar significativamente la recompensa por comer una criatura
        this.energy += other.size * 50; // Incrementar significativamente la ganancia de energía por comer una criatura
        this.preyEaten++; // Incrementar el contador de presas consumidas
        if (other.actionHistory.length > 0) {
          history.push(...other.actionHistory); // Guardar la historia de la criatura comida
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
          history.push(...this.actionHistory); // Guardar la historia de la criatura en el array global de historia
        }
        creatures.splice(index, 1);
      }
    }
  }

  checkMitosis(colorCounts) {
    if (this.size >= 37.5) {
      let numOffspring;
      switch (season) {
        case "spring":
          numOffspring = 5;
          break;
        case "summer":
          numOffspring = 4;
          break;
        case "autumn":
          numOffspring = random(1) < 0.5 ? 4 : 3;
          break;
        case "winter":
          numOffspring = 3;
          break;
        default:
          numOffspring = 3;
      }

      // Tamaño total resultante es 0.90 veces el tamaño del progenitor
      let childSize = (this.size * 0.9) / numOffspring;
      let distance = this.size; // Separar a los hijos al doble de la distancia actual (size/2 -> size)

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
        childBrain.mutate();

        // Generar una posición para el hijo
        let angle = random(TWO_PI);
        let childPos = createVector(
          this.pos.x + cos(angle) * distance,
          this.pos.y + sin(angle) * distance
        );

        let child = new Creature(
          childSize,
          childPos,
          childColor,
          childSpeedMultiplier,
          this.species,
          childBrain
        );
        creatures.push(child);
      }

      this.size /= 3;
      if (this.size < this.minSize) {
        this.size = this.minSize;
      }
    }
  }

  show() {
    stroke(0);
    strokeWeight(1);
    fill(this.color);
    ellipse(this.pos.x, this.pos.y, this.size, this.size);

    // Dibujar el radio de percepción con 50% de transparencia
    fill(0, 0, 255, 20); // Color azul con 50% de transparencia
    noStroke();
    ellipse(this.pos.x, this.pos.y, this.olfatoRange * 2, this.olfatoRange * 2);
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
    speedMultiplier: random(0.9, 1.1), // Velocidad entre 0.8x y 1.5x
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
