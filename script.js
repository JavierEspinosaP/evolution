let creatures = [];
let food = [];
let season = "spring";
let totalDays = 0;

let tempData = {
  creatures: [],
  food: [],
  season: "spring",
  totalDays: 0,
};

document.addEventListener("DOMContentLoaded", function() {
  // Crear un elemento de texto temporal para medir el tamaño del título
  const tempText = document.createElement('span');
  tempText.style.fontFamily = 'Arial';
  tempText.style.fontSize = '48px';
  tempText.style.visibility = 'hidden';
  tempText.innerText = "Virtual Fish Tank";
  document.body.appendChild(tempText);

  // Obtener las dimensiones del título
  const titleWidth = tempText.offsetWidth;
  const titleHeight = tempText.offsetHeight;
  document.body.removeChild(tempText);

  // Margen de 10px alrededor del canvas
  const margin = 10;

  // Crear una aplicación PIXI con el tamaño del título más el margen
  const app = new PIXI.Application({ 
      width: titleWidth + margin * 2, 
      height: titleHeight + margin * 2, 
      transparent: true ,
      backgroundColor: 0x222222

  });
  
  // Añadir el canvas de PIXI al DOM, detrás del título
  const titleSection = document.querySelector('.titleSection');
  titleSection.appendChild(app.view);
  
  // Crear un contenedor para el título
  const container = new PIXI.Container();
  app.stage.addChild(container);

  // Crear el texto con PIXI
  const text = new PIXI.Text("Virtual Fish Tank", {
      fontFamily: 'Arial',
      fontSize: 48,
      fill: ['#f8b195', '#c06c84', '#355c7d'],
      align: 'center',
      stroke: '#ffffff',
      // strokeThickness: 5
  });
  
  // Posicionar el texto en el centro del canvas, respetando el margen
  text.x = margin;  // Ajustar la posición horizontal con el margen
  text.y = margin;  // Ajustar la posición vertical con el margen
  container.addChild(text);

  // Crear el filtro de desplazamiento (wave filter)
  const displacementSprite = PIXI.Sprite.from('https://pixijs.io/examples/examples/assets/pixi-filters/displacement_map_repeat.jpg');
  const displacementFilter = new PIXI.filters.DisplacementFilter(displacementSprite);

  displacementSprite.texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
  app.stage.addChild(displacementSprite);

  container.filters = [displacementFilter];

  // Animar el filtro para crear el efecto de agua
  app.ticker.add((delta) => {
      displacementSprite.x += 1 * delta;
      displacementSprite.y += 0.5 * delta;
  });
});




(function () {

  
    var canvas = document.getElementById("canvas"),
      ctx = canvas.getContext("2d"),
      width = 1280,
      height = 720;
  
    canvas.width = width;
    canvas.height = height;
  
    // Cargar y dibujar la imagen de fondo
    var backgroundImage = new Image();
    backgroundImage.src = "/assets/imgs/bg.webp"; // Cambia esta ruta a la ruta de tu imagen
  
    // Cargar la imagen de sprites
    var fishSprites = new Image();
    fishSprites.src = "/assets/imgs/fish_sprites.png";
  
    backgroundImage.onload = function () {
      ctx.drawImage(backgroundImage, 0, 0, width, height);
      startSimulation();
    };
  
    function startSimulation() {
      var half_width = width >> 1,
        half_height = height >> 1,
        size = width * (height + 2) * 2,
        oldind = width,
        newind = width * (height + 3),
        riprad = 3,
        ripplemap = new Array(size).fill(0),
        last_map = new Array(size).fill(0),
        line_width = 20,
        step = line_width * 2,
        count = height / line_width,
        disturbanceAmount = 16,
        delay = 30;
  
      var texture = ctx.getImageData(0, 0, width, height);
      var ripple = ctx.getImageData(0, 0, width, height);
  
      function run() {
        newframe();
        ctx.putImageData(ripple, 0, 0);
        displayState(ctx);
        requestAnimationFrame(run);
      }
  
      function disturb(dx, dy) {
        dx <<= 0;
        dy <<= 0;
  
        for (var j = dy - riprad; j < dy + riprad; j++) {
          for (var k = dx - riprad; k < dx + riprad; k++) {
            ripplemap[oldind + j * width + k] += disturbanceAmount;
          }
        }
      }
  
      function newframe() {
        var a, b, data, cur_pixel, new_pixel, old_data;
  
        var t = oldind;
        oldind = newind;
        newind = t;
        var i = 0;
  
        var _width = width,
          _height = height,
          _ripplemap = ripplemap,
          _last_map = last_map,
          _rd = ripple.data,
          _td = texture.data,
          _half_width = half_width,
          _half_height = half_height;
  
        for (var y = 0; y < _height; y++) {
          for (var x = 0; x < _width; x++) {
            var _newind = newind + i,
              _mapind = oldind + i;
            data =
              (_ripplemap[_mapind - _width] +
                _ripplemap[_mapind + _width] +
                _ripplemap[_mapind - 1] +
                _ripplemap[_mapind + 1]) >>
              1;
  
            data -= _ripplemap[_newind];
            data -= data >> 5;
  
            _ripplemap[_newind] = data;
  
            data = 1024 - data;
  
            old_data = _last_map[i];
            _last_map[i] = data;
  
            if (old_data != data) {
              a = ((((x - _half_width) * data) / 1024) << 0) + _half_width;
              b = ((((y - _half_height) * data) / 1024) << 0) + _half_height;
  
              if (a >= _width) a = _width - 1;
              if (a < 0) a = 0;
              if (b >= _height) b = _height - 1;
              if (b < 0) b = 0;
  
              new_pixel = (a + b * _width) * 4;
              cur_pixel = i * 4;
  
              _rd[cur_pixel] = _td[new_pixel];
              _rd[cur_pixel + 1] = _td[new_pixel + 1];
              _rd[cur_pixel + 2] = _td[new_pixel + 2];
            }
  
            ++i;
          }
        }
      }
  
      setupWebSocket();
  
      function setupWebSocket() {
        // const ws = new WebSocket("ws://localhost:3000");
        const ws = new WebSocket("wss://evolution-backend-0r4z.onrender.com");

  
        ws.onmessage = (event) => {
          try {
            if (event.data instanceof Blob) {
              const reader = new FileReader();
              reader.onload = () => {
                const data = new Uint8Array(reader.result);
                try {
                  const decompressedData = pako.inflate(data, { to: "string" });
                  const parsedData = JSON.parse(decompressedData);
                  creatures = parsedData.creatures || [];
                  food = parsedData.food || [];
                  season = parsedData.season || "spring";
                  totalDays = parsedData.totalDays || 0;
  
                  // Almacenar los datos recibidos temporalmente
                  tempData.creatures = parsedData.creatures || [];
                  tempData.food = parsedData.food || [];
                  tempData.season = parsedData.season || "spring";
                  tempData.totalDays = parsedData.totalDays || 0;
                } catch (inflateError) {
                  console.error("Error inflating or parsing data:", inflateError);
                }
              };
              reader.readAsArrayBuffer(event.data);
            } else {
              console.error("Received unexpected data type");
            }
          } catch (error) {
            console.error("Error processing WebSocket message:", error);
          }
        };
  
        ws.onopen = () => {
          console.log("WebSocket connection opened");
        };
  
        ws.onclose = () => {
          console.log("WebSocket connection closed");
        };
  
        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
        };
      }
  
      function displayState(ctx) {
        // Redibujar la imagen de fondo antes de mostrar el estado
        ctx.drawImage(backgroundImage, 0, 0, width, height);
        ctx.putImageData(ripple, 0, 0);
  
        // Mostrar la comida
        food.forEach((f) => {
          ctx.fillStyle = f.type === "normal" ? "green" : "red";
          ctx.beginPath();
          ctx.arc(f.pos.x, f.pos.y, 3, 0, 2 * Math.PI);
          ctx.fill();
          ctx.strokeStyle = "black";
          ctx.lineWidth = 1;
          ctx.stroke();
        });
  
        // Mostrar las criaturas y sus estelas
        creatures.forEach((c) => {
          // Aplicar efecto de agua en la posición de la criatura
          disturb(c.pos.x, c.pos.y);
  
          // Dibujar el sprite correspondiente basado en la dirección
          drawCreatureSprite(ctx, c);
  
          if (!c.trail) {
            c.trail = [];
          }
          c.trail.push({ x: c.pos.x, y: c.pos.y });
          if (c.trail.length > 10) {
            c.trail.shift();
          }

        });
  
        // // Mostrar la estación y el total de días
        // ctx.fillStyle = "black";
        // ctx.font = "16px Arial";
        // ctx.fillText(`Season: ${season}`, 10, height - 30);
        // ctx.fillText(`Days: ${totalDays}`, 10, 30);
      }
  
      function drawCreatureSprite(ctx, creature) {
        const SPRITE_WIDTH = 48;  // Ancho original del sprite
        const SPRITE_HEIGHT = 48; // Alto original del sprite
    
        // Mapeo de colores a las columnas de sprites
        const COLOR_MAP = {
            red: 0,
            blue: 1,
            yellow: 2,
            green: 3,
        };
    
        // Determinar la columna inicial para el color de la criatura
        const colorIndex = COLOR_MAP[creature.color] * 3;
    
        // Determinar el índice de la fila según la dirección
        let rowIndex;
    
        switch (creature.direction) {
            case 'down':
                rowIndex = 4;
                break;
            case 'left':
                rowIndex = 5;
                break;
            case 'right':
                rowIndex = 6;
                break;
            case 'up':
                rowIndex = 7;
                break;
        }
    
        // Ciclo de animación
        const frame = Math.floor(Date.now() / 100) % 3;  // 3 frames por dirección
        let spriteX = (colorIndex + frame) * SPRITE_WIDTH;
        let spriteY = rowIndex * SPRITE_HEIGHT;
    
        // Ajustar la posición Y del sprite para los frames 2 y 3
        if (frame === 1 && (creature.direction === 'down' || creature.direction === 'left' || creature.direction === 'right')) {
            spriteY -=1;  // Desplazar 5px hacia abajo el sprite 2
        } else if (frame === 2 && (creature.direction === 'down' || creature.direction === 'left' || creature.direction === 'right')) {
            spriteY -=2; // Desplazar 10px hacia abajo el sprite 3
        }
    
        // Ajustar el tamaño del sprite según la cualidad 'size' de la criatura
        const scaledWidth = ((creature.size / SPRITE_WIDTH) * SPRITE_WIDTH) * 2;
        const scaledHeight = ((creature.size / SPRITE_HEIGHT) * SPRITE_HEIGHT) *2;
    
        ctx.drawImage(
            fishSprites,
            spriteX,
            spriteY,
            SPRITE_WIDTH,
            SPRITE_HEIGHT,
            creature.pos.x - scaledWidth / 2,
            creature.pos.y - scaledHeight / 2,
            scaledWidth,
            scaledHeight
        );
    }
    
  
      function convertColorToRgba(color, alpha = 1) {
        if (color.startsWith("rgb")) {
          return color.replace("rgb", "rgba").replace(")", `, ${alpha})`);
        } else {
          const ctx = document.createElement("canvas").getContext("2d");
          ctx.fillStyle = color;
          const rgba = ctx.fillStyle.match(/\d+/g).map(Number);
          return `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${alpha})`;
        }
      }

      
  
      run();
    }
  })();

  document.addEventListener("DOMContentLoaded", function() {
    const favicon = document.getElementById('favicon');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 32;  // Tamaño estándar del favicon
    canvas.height = 32;

    const SPRITE_WIDTH = 48;  // Ancho original del sprite
    const SPRITE_HEIGHT = 48; // Alto original del sprite
    const SPRITE_SCALE = (32 / SPRITE_WIDTH) * 1.2; // Escala para que se vea un 50% más grande

    const fishSprites = new Image();
    fishSprites.src = "/assets/imgs/fish_sprites.png";  // Asegúrate de que la ruta sea correcta

    fishSprites.onload = function() {
        let frame = 0;
        const frameSpeed = 100; // Cambia este valor para controlar la velocidad de la animación (en milisegundos)

        function animateFavicon() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Determinar el índice del frame actual basado en la animación (3 frames por dirección)
            const spriteX = (frame % 3) * SPRITE_WIDTH;
            const spriteY = 0; // Aquí asume que el primer sprite está en la fila superior

            // Calcular la posición para centrar el sprite dentro del canvas
            const offsetX = (canvas.width - SPRITE_WIDTH * SPRITE_SCALE) / 2;
            const offsetY = (canvas.height - SPRITE_HEIGHT * SPRITE_SCALE) / 2;

            // Dibujar el sprite actual en el canvas del favicon con escalado y centrado
            ctx.drawImage(
                fishSprites,
                spriteX, spriteY,  // Posición x, y en la hoja de sprites
                SPRITE_WIDTH, SPRITE_HEIGHT,  // Tamaño original del sprite
                offsetX, offsetY,  // Posición ajustada en el canvas de destino
                SPRITE_WIDTH * SPRITE_SCALE, SPRITE_HEIGHT * SPRITE_SCALE  // Tamaño escalado en el canvas de destino
            );

            // Actualizar el favicon con el canvas
            favicon.href = canvas.toDataURL('image/png');

            // Avanzar al siguiente frame
            frame = (frame + 1) % 3;  // Hay 3 frames en la animación
        }

        // Iniciar la animación del favicon con setInterval
        setInterval(animateFavicon, frameSpeed);  // Cambia la velocidad ajustando el valor de frameSpeed
    };
});






  
  
  
  
