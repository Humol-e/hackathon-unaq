# Delta's madness NEO-SIM #

Desarrollado por Delta's Madness, equipo del club de robótica de la Universidad Anáhuac Queretaro
Conformado por: 
-Luis Emiliano Castro Reza
-Diana Gabriela García Ríos
-Aaron Fernandez Lizarraga
-Alejandra Tort Gastelum
-Karla Yelitza Figueroa García
-Diego Gael Mata Granados

## Funcionamiento ##
1. index.html
Archivo principal de la interfaz web.

Define la estructura visual: el globo 3D, el buscador de artistas, los filtros de eventos, los resultados y la información adicional.
Incluye los scripts y estilos necesarios para que funcione la aplicación.
2. main.js
Controla la lógica de la aplicación y la interacción con el usuario.

Maneja los eventos de búsqueda, selección de artista y filtros.
Realiza peticiones a las APIs externas (MusicBrainz y Bandsintown) para obtener datos de artistas y eventos.
Procesa los datos y actualiza la interfaz y el globo 3D con los resultados.
3. globe.js
Implementa el globo 3D usando Three.js.

Dibuja el globo y las barras que representan los eventos en diferentes ciudades.
Permite la interacción con el globo (rotar, hacer zoom).
Recibe los datos procesados y los muestra visualmente.
4. README.md
Archivo de documentación.



## CHALLENGE ##
Summary
A newly identified near-Earth asteroid, "Impactor-2025," poses a potential threat to Earth, but do we have the tools to enable the public and decision makers to understand and mitigate its risks? NASA datasets include information about known asteroids and the United States Geological Survey provides critical information that could enable modeling the effects of asteroid impacts, but this data needs to be integrated to enable effective visualization and decision making. Your challenge is to develop an interactive visualization and simulation tool that uses real data to help users model asteroid impact scenarios, predict consequences, and evaluate potential mitigation strategies.

## Background ##
The discovery of near-Earth asteroids like "Impactor-2025" highlights the ongoing risk of celestial objects colliding with our planet, potentially causing catastrophic damage. Asteroid impacts, though rare, could cause widespread devastation, including tsunamis, seismic events, and atmospheric changes. NASA’s Near-Earth Object (NEO) program tracks thousands of asteroids and data from NASA’s NEO Application Programming Interface (API) provides asteroid characteristics (e.g., size, velocity, orbit). The U.S. Geological Survey (USGS) offers environmental and geological datasets (e.g., topography, seismic activity, tsunami zones) critical for modeling impact effects. However, these datasets are often siloed; the ability to predict and mitigate specific impact scenarios remains limited by the complexity of integrating these diverse datasets and communicating risks to stakeholders.

Existing tools lack user-friendly interfaces to simulate and visualize impacts for scientists, policymakers, and the public. In addition, current tools often focus on detection and orbital tracking but fall short in simulating impact consequences or evaluating mitigation strategies like deflection (e.g., kinetic impactors or gravity tractors). These tools are also often either too technical for public use or overly simplistic, missing key environmental impacts. Such gaps hinder preparedness efforts and public understanding of potential impacts if an asteroid were to collide with Earth. A tool that combines accurate data integration, realistic physics-based simulations, and intuitive visualizations could bridge the gap between complex science and actionable insights.
