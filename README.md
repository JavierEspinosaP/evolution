# Ecosistema de Criaturas con Redes Neuronales

## Descripción General

Este proyecto simula un ecosistema de criaturas utilizando redes neuronales. Las criaturas interactúan entre sí y con el entorno de manera autónoma, tomando decisiones basadas en su percepción del entorno. La simulación incluye características como reproducción, alimentación, mutación y adaptación a diferentes estaciones del año.

## Características del Ecosistema

### 1. Criaturas
- **Movimiento Autónomo**: Las criaturas se mueven de manera autónoma en el canvas.
- **Percepción del Entorno**: Utilizan un rango de olfato para detectar alimentos y otras criaturas.
- **Red Neuronal**: Cada criatura tiene una red neuronal que les permite tomar decisiones complejas basadas en múltiples parámetros.
- **Energía y Metabolismo**: Las criaturas tienen una reserva de energía que se consume con el movimiento y se recarga al comer.
- **Reproducción por Mitosis**: Las criaturas se dividen en nuevas criaturas cuando alcanzan un tamaño suficiente.
- **Mutación**: Durante la reproducción, las criaturas pueden experimentar mutaciones en color, rango de olfato y parámetros de la red neuronal.

### 2. Alimentación
- **Tipos de Alimentos**: Existen dos tipos de alimentos, "normal" y "growth".
  - **Normal Food**: Incrementa el tamaño y la energía de la criatura en menor medida.
  - **Growth Food**: Incrementa el tamaño y la energía de la criatura en mayor medida.
- **Interacción con la Comida**: Las criaturas pueden desviarse para comer alimentos cercanos mientras huyen de depredadores o persiguen presas.

### 3. Reproducción y Mitosis
- **Condiciones para la Mitosis**: Una criatura puede dividirse cuando su tamaño alcanza 37.5 unidades.
- **Número de Crías**: El número de crías varía según la estación:
  - **Primavera**: 5 crías.
  - **Verano**: 4 crías.
  - **Otoño**: 3 o 4 crías (probabilidad del 50%).
  - **Invierno**: 3 crías.
- **Distribución de Tamaño**: El tamaño total resultante de las crías es el 90% del tamaño del progenitor.
- **Mutaciones**: Las crías pueden experimentar mutaciones en color y rango de olfato.

### 4. Interacción con el Entorno
- **Estaciones del Año**: La simulación incluye cuatro estaciones que afectan la disponibilidad de alimentos y la velocidad de las criaturas:
  - **Primavera**: Mucha comida disponible, velocidad normal.
  - **Verano**: Comida normal, velocidad aumentada.
  - **Otoño**: Menos comida, velocidad normal.
  - **Invierno**: Muy poca comida, velocidad reducida a la mitad.
- **Penalización por Borde**: Las criaturas son penalizadas si tocan el borde del canvas, incentivando el movimiento hacia el centro.

### 5. Redes Neuronales
- **Entradas de la Red Neuronal**: La red neuronal de cada criatura tiene 15 entradas que incluyen:
  - Distancia al alimento "normal" más cercano.
  - Distancia al alimento "growth" más cercano.
  - Distancia a la presa más cercana.
  - Distancia al depredador más cercano.
  - Tamaño de la criatura.
  - Vida útil restante.
  - Proximidad al borde del canvas.
  - Energía restante.
  - Temporada actual.
  - Velocidad actual.
  - Dirección actual de movimiento.
  - Tiempo desde la última comida.
  - Edad normalizada.
  - Distancia al borde más cercano.
- **Capas y Neuronas**: La red neuronal tiene 30 neuronas en la capa oculta.
- **Mutación de la Red Neuronal**: Durante la reproducción, las conexiones y pesos de las redes neuronales de las crías pueden mutar.

## Funcionamiento de la Simulación

### Configuración Inicial
- El ecosistema se inicializa con 30 criaturas y 50 alimentos.
- Las criaturas tienen un tamaño inicial aumentado en un 10%.

### Ciclo de Vida
1. **Movimiento y Alimentación**: Las criaturas se mueven en el canvas, buscan comida y evitan depredadores.
2. **Reproducción**: Al alcanzar el tamaño requerido, las criaturas se dividen en crías.
3. **Envejecimiento**: Las criaturas envejecen y pueden morir de inanición si no encuentran comida a tiempo.

### Penalizaciones y Recompensas
- **Penalización por Tocar el Borde**: Las criaturas pierden fitness si tocan el borde del canvas.
- **Recompensa por Comer**: Las criaturas aumentan su fitness al comer alimentos o devorar otras criaturas.
- **Penalización por Baja Energía**: Las criaturas pierden fitness si su energía cae por debajo de un umbral.

## Tecnologías Utilizadas
- **p5.js**: Para la visualización y manipulación del canvas.
- **Synaptic.js**: Para la implementación de las redes neuronales.

## Posibles Mejoras Futuras
- **Diversificación de Especies**: Introducir más tipos de especies con características únicas.
- **Comportamientos Sociales**: Implementar comportamientos de manada o cooperación entre criaturas.
- **Adición de Predadores Naturales**: Introducir predadores controlados por el sistema para aumentar la complejidad del ecosistema.
- **Mejora en la Reproducción**: Implementar mecanismos de reproducción más complejos como la reproducción sexual con mezcla genética.
