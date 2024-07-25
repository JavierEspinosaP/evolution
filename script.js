let creatures = [];
let food = [];
let season = "spring";
let totalDays = 0;

function setup() {
    createCanvas(1900, 800).parent('canvas-container');
    setupWebSocket();
}

function draw() {
    background(255); // Limpiar el canvas
    setSeasonBackground();
    displayState();
}

function setupWebSocket() {
    // const ws = new WebSocket('wss://evolution-backend-0r4z.onrender.com');
    const ws = new WebSocket('ws://localhost:3000');

    ws.onmessage = event => {
        try {
            if (event.data instanceof Blob) {
                const reader = new FileReader();
                reader.onload = () => {
                    const data = new Uint8Array(reader.result);
                    try {
                        const decompressedData = pako.inflate(data, { to: 'string' });
                        const parsedData = Flatted.parse(decompressedData);

                        // Reconstruir las instancias de Creature correctamente
                        creatures = (parsedData.creatures || []).map(creatureData => {
                            return Object.assign(new Creature(), creatureData);
                        });
                        food = parsedData.food || [];
                        season = parsedData.season || "spring";
                        totalDays = parsedData.totalDays || 0;
                    } catch (inflateError) {
                        console.error('Error inflating or parsing data:', inflateError);
                    }
                };
                reader.readAsArrayBuffer(event.data);
            } else {
                console.error('Received unexpected data type');
            }
        } catch (error) {
            console.error('Error processing WebSocket message:', error);
        }
    };

    ws.onopen = () => {
        console.log('WebSocket connection opened');
    };

    ws.onclose = () => {
        console.log('WebSocket connection closed');
    };

    ws.onerror = error => {
        console.error('WebSocket error:', error);
    };
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

function displayState() {
    // Mostrar la comida
    for (let f of food) {
        fill(f.type === 'normal' ? 'green' : 'red');
        ellipse(f.pos.x, f.pos.y, 5, 5);
    }

    // Mostrar las criaturas
    for (let c of creatures) {
        fill(c.color);
        ellipse(c.pos.x, c.pos.y, c.size, c.size);
    }

    // Mostrar la estación y el total de días
    fill(0);
    textSize(16);
    text(`Season: ${season}`, 10, height - 10);
    text(`Days: ${totalDays}`, 10, 20);
}
