document.addEventListener("DOMContentLoaded", function () {
  let audioContext;
  let gainNode;
  let bufferSource;
  const fadeInDuration = 2; // Duración del fade in en segundos
  const fadeOutDuration = 2; // Duración del fade out en segundos
  const volumeMax = 0.5; // Volumen máximo (50%)
  let isPlaying = false;

  // Elemento de control de volumen
  const volumeControl = document.getElementById("volumeControl");

  // Elemento del botón
  const startButton = document.getElementById("startButton");

  // Actualizar el volumen en tiempo real
  volumeControl.addEventListener("input", function () {
    if (gainNode) {
      gainNode.gain.value = this.value;
    }
  });

  // Lista de archivos adicionales para reproducción aleatoria
  const randomKeys = ["key1.wav", "key2.wav", "key3.wav", "key4.wav"];
  let lastPlayedKey = null; // Variable para almacenar el último key reproducido

  // Lista de pads para reproducción continua aleatoria
  const randomPads = [
    "pad1.wav",
    "pad2.wav",
    "pad3.wav",
    "pad4.wav",
    "pad5.wav",
    "pad6.wav",
  ];
  let lastPlayedPad = null; // Variable para almacenar el último pad reproducido

  // Función para cargar y reproducir el audio principal (drone.wav)
  async function loadAndPlayAudio(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    playLoopingAudio(audioBuffer);
  }

 // Función para gestionar la reproducción continua del audio con fade in/out
 function playLoopingAudio(buffer) {
    bufferSource = audioContext.createBufferSource();
    bufferSource.buffer = buffer;
    bufferSource.connect(gainNode);
    bufferSource.loop = true;
    bufferSource.start(0);

    // Fade in al inicio
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(
      volumeMax,
      audioContext.currentTime + fadeInDuration
    );

    isPlaying = true;
    startButton.textContent = "Stop music"; // Cambiar el texto del botón a "Stop music"

    // Iniciar la reproducción aleatoria de los elementos adicionales
    playRandomKey();
    playRandomPad(); // Iniciar la reproducción continua de pads
    playRandomSub(); // Iniciar la reproducción aleatoria de sub
  }

  // Función para reproducir un sonido aleatorio en un intervalo aleatorio (keys)
  function playRandomKey() {
    if (!isPlaying) return;

    let randomKey;
    do {
      randomKey = randomKeys[Math.floor(Math.random() * randomKeys.length)];
    } while (randomKey === lastPlayedKey); // Asegurar que no se repita el último key

    lastPlayedKey = randomKey; // Actualizar el último key reproducido

    // Elegir un intervalo aleatorio entre 5 y 12 segundos
    const randomInterval = Math.random() * (12000 - 5000) + 5000;

    setTimeout(async () => {
      const keyBuffer = await loadAudioBuffer(randomKey);
      playKeySound(keyBuffer);
      playRandomKey(); // Volver a llamar para continuar el ciclo
    }, randomInterval);
  }

  // Función para cargar un buffer de audio
  async function loadAudioBuffer(url) {
    const response = await fetch(`assets/music/${url}`);
    const arrayBuffer = await response.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer);
  }

  // Función para reproducir el sonido de la tecla (key)
  function playKeySound(buffer) {
    const keySource = audioContext.createBufferSource();
    keySource.buffer = buffer;
    keySource.connect(gainNode);
    keySource.start(0);
  }

  // Función para reproducir un pad aleatorio continuamente
  async function playRandomPad() {
    let randomPad;
    do {
      randomPad = randomPads[Math.floor(Math.random() * randomPads.length)];
    } while (randomPad === lastPlayedPad); // Asegurar que no se repita el último pad

    lastPlayedPad = randomPad; // Actualizar el último pad reproducido

    const padBuffer = await loadAudioBuffer(randomPad);
    const padSource = audioContext.createBufferSource();
    padSource.buffer = padBuffer;
    padSource.connect(gainNode);
    padSource.start(0);

    // Cuando termine, reproducir otro pad aleatorio
    padSource.onended = () => {
      if (isPlaying) {
        playRandomPad(); // Volver a llamar para continuar el ciclo
      }
    };
  }

  // Función para reproducir el sub.wav aleatoriamente cada 60 a 90 segundos
  async function playRandomSub() {
    if (!isPlaying) return;

    const randomInterval = Math.random() * (90000 - 60000) + 60000; // Intervalo aleatorio entre 60s y 90s

    setTimeout(async () => {
      const subBuffer = await loadAudioBuffer("sub.wav");
      const subSource = audioContext.createBufferSource();
      subSource.buffer = subBuffer;
      subSource.connect(gainNode);
      subSource.start(0);

      // Cuando termine, volver a llamar para continuar el ciclo
      subSource.onended = () => {
        if (isPlaying) {
          playRandomSub();
        }
      };
    }, randomInterval);
  }

  // Función para inicializar el AudioContext y GainNode
  function initAudio() {
    if (!audioContext) {
      audioContext = new AudioContext();
      gainNode = audioContext.createGain();
      gainNode.connect(audioContext.destination);
      // Configurar el volumen inicial desde el control de volumen
      gainNode.gain.value = volumeControl.value;
    }

    loadAndPlayAudio("assets/music/drone.wav");
  }

  // Asociar la inicialización del audio al botón
  startButton.addEventListener("click", function () {
    if (!isPlaying) {
      initAudio();
    } else {
      // Detener el audio con fade out
      gainNode.gain.linearRampToValueAtTime(
        0,
        audioContext.currentTime + fadeOutDuration
      );
      setTimeout(() => {
        bufferSource.stop();
        isPlaying = false;
        startButton.textContent = "Play music"; // Cambiar el texto del botón a "Play music"
      }, fadeOutDuration * 1000);
    }
  });
});
