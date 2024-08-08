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

(function () {
    var canvas = document.getElementById("canvas"),
      ctx = canvas.getContext("2d"),
      width = 1280,
      height = 720;
  
    canvas.width = width;
    canvas.height = height;
  
    // Cargar y dibujar la imagen de fondo
    var backgroundImage = new Image();
    backgroundImage.src = "bg.webp"; // Cambia esta ruta a la ruta de tu imagen
  
    // Cargar la imagen de sprites
    var fishSprites = new Image();
    fishSprites.src = "fish_sprites.png";
  
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
        const ws = new WebSocket("ws://localhost:3000");
  
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
  
        // Mostrar la estación y el total de días
        ctx.fillStyle = "black";
        ctx.font = "16px Arial";
        ctx.fillText(`Season: ${season}`, 10, height - 30);
        ctx.fillText(`Days: ${totalDays}`, 10, 30);
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
        const spriteX = (colorIndex + frame) * SPRITE_WIDTH;
        const spriteY = rowIndex * SPRITE_HEIGHT;
  
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
  
  
  
  
