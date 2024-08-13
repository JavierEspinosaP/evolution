# <div align="center">Virtual Fish Tank - Frontend</div>

Welcome to the Virtual Fish Tank project! This repository contains the frontend of an interactive fish tank simulation that allows users to observe virtual creatures in a dynamic environment. The frontend is designed to provide a visually appealing user interface, complete with background music and real-time updates from the backend server.

## <div align="center">Table of Contents</div>

- Introduction
- Features
- Setup
- Usage
- File Structure
- Technologies Used
- License

## <div align="center">Introduction</div>

The Virtual Fish Tank project is an interactive simulation where users can observe virtual creatures in a simulated environment. The frontend handles the rendering of the simulation, user controls, and audio management. It connects to a backend server to receive real-time updates on the state of the simulation, ensuring that users are always viewing the most current state of the virtual tank.


<strong>You can view the live simulation at the following link:</strong>

[Live Simulation](https://dynamic-chimera-9a3d30.netlify.app/)

## <div align="center">Features</div>

- Interactive Simulation: Observe creatures as they move, grow, and interact with each other and their environment.
- Responsive Design: The UI adapts to various screen sizes and devices, providing a seamless experience across platforms.
- Dynamic Background Music: The simulation includes background music that users can control, enhancing the immersive experience.
- Real-time Updates: The frontend communicates with the backend server to receive and display real-time updates on the simulation’s state.

## <div align="center">Setup</div>

Follow these steps to set up the project locally:

1. Clone the Repository:
    ```git clone https://github.com/yourusername/virtual-fish-tank-frontend.git```
    
2. Navigate to the Project Directory:
    ```cd virtual-fish-tank-frontend```
    
3. Install Dependencies:
    Ensure you have Node.js installed, then run:
    ```npm install```

## <div align="center">Usage</div>

To start the frontend server and view the simulation in your browser:

1. Start the Development Server:
    ```npm start```
    
2. Open the Simulation in a Browser:
    ```Navigate to http://localhost:3000 to view the simulation.```

## <div align="center">File Structure</div>

The repository is structured as follows:

virtual-fish-tank-frontend/
├── index.html          # The main HTML file that includes the structure of the web page
├── style.css           # Styles for the simulation UI
├── music.js            # Handles background music logic and controls
├── script.js           # Main script for managing the simulation, rendering, and user interactions
├── classes.js          # Defines the classes for creatures, food, and other entities
├── logic.js            # Contains the logic for updating the state of the simulation
├── assets/             # Directory containing images, audio files, and other assets
│   ├── imgs/
│   └── music/
└── package.json        # Project metadata and dependencies

## <div align="center">Technologies Used</div>

- HTML5: For the structure of the web page.
- CSS3: For styling and layout.
- JavaScript (ES6+): For dynamic content, state management, and interactivity.
- PIXI.js: For rendering 2D graphics in the simulation.
- WebSockets: For real-time communication with the backend server.
- Node.js & npm: For dependency management and development tooling.

<div align="center">License</div>

This project is licensed under the MIT License. See the LICENSE file for details.
