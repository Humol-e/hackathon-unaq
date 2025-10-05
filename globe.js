/**
 * dat.globe Javascript WebGL Globe Toolkit con Mapa de Calor
 * Modificado para incluir áreas de influencia visuales tipo heatmap
 */

var DAT = DAT || {};

DAT.Globe = function(container, opts) {
  opts = opts || {};

  var colorFn = opts.colorFn || function(x) {
    var c = new THREE.Color();
    c.setHSL( ( 0.6 - ( x * 0.5 ) ), 1.0, 0.5 );
    return c;
  };

  var Shaders = {
    'earth' : {
      uniforms: {
        'texture': { type: 't', value: null }
      },
      vertexShader: [
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
          'vNormal = normalize( normalMatrix * normal );',
          'vUv = uv;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D texture;',
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          'vec3 diffuse = texture2D( texture, vUv ).xyz;',
          'float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
          'vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, 3.0 );',
          'gl_FragColor = vec4( diffuse + atmosphere, 1.0 );',
        '}'
      ].join('\n')
    },
    'atmosphere' : {
      uniforms: {},
      vertexShader: [
        'varying vec3 vNormal;',
        'void main() {',
          'vNormal = normalize( normalMatrix * normal );',
          'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vNormal;',
        'void main() {',
          'float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 12.0 );',
          'gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 ) * intensity;',
        '}'
      ].join('\n')
    }
  };

  var camera, scene, renderer, w, h;
  var mesh, atmosphere, point;

  var overRenderer;

  var curZoomSpeed = 0;
  var zoomSpeed = 50;

  var mouse = { x: 0, y: 0 }, mouseOnDown = { x: 0, y: 0 };
  var rotation = { x: 0, y: 0 },
      target = { x: Math.PI*3/2, y: Math.PI / 6.0 },
      targetOnDown = { x: 0, y: 0 };

  var distance = 100000, distanceTarget = 100000;
  var padding = 40;
  var PI_HALF = Math.PI / 2;

  // Array para almacenar los radios de destrucción (heatmaps)
  var heatmapCircles = [];

  function init() {

    container.style.color = '#822b2bff';
    container.style.font = '13px/20px Arial, sans-serif';

    var shader, uniforms, material;
    w = container.offsetWidth || window.innerWidth;
    h = container.offsetHeight || window.innerHeight;

    camera = new THREE.PerspectiveCamera(30, w / h, 1, 10000);
    camera.position.z = distance;

    scene = new THREE.Scene();

    var geometry = new THREE.SphereGeometry(200, 40, 30);

    shader = Shaders['earth'];
    uniforms = THREE.UniformsUtils.clone(shader.uniforms);

    uniforms['texture'].value = THREE.ImageUtils.loadTexture('mapa.png');

    material = new THREE.ShaderMaterial({

          uniforms: uniforms,
          vertexShader: shader.vertexShader,
          fragmentShader: shader.fragmentShader

        });

    mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.y = Math.PI;
    scene.add(mesh);

    shader = Shaders['atmosphere'];
    uniforms = THREE.UniformsUtils.clone(shader.uniforms);

    material = new THREE.ShaderMaterial({

          uniforms: uniforms,
          vertexShader: shader.vertexShader,
          fragmentShader: shader.fragmentShader,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
          transparent: true

        });

    mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set( 1.1, 1.1, 1.1 );
    scene.add(mesh);

    geometry = new THREE.CubeGeometry(0.75, 0.75, 1);
    geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,0,-0.5));

    point = new THREE.Mesh(geometry);

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(w, h);

    renderer.domElement.style.position = 'absolute';

    container.appendChild(renderer.domElement);

    container.addEventListener('mousedown', onMouseDown, false);

    container.addEventListener('mousewheel', onMouseWheel, false);

    document.addEventListener('keydown', onDocumentKeyDown, false);

    window.addEventListener('resize', onWindowResize, false);

    container.addEventListener('mouseover', function() {
      overRenderer = true;
    }, false);

    container.addEventListener('mouseout', function() {
      overRenderer = false;
    }, false);
  }
  // Función para crear un círculo de mapa de calor (relleno con gradiente)
  function createHeatmapCircle(lat, lng, radius) {


    radius = radius /229000;
    var heatmapGroup = new THREE.Object3D();
    // Crear múltiples anillos concéntricos para simular gradiente suave
    var rings = 15;
    
    for (var ring = rings - 1; ring >= 0; ring--) {
      var normalizedRing = ring / (rings - 1);
      var currentRadius = radius * normalizedRing;
      
      // Calcular color y opacidad basado en la distancia al centro
      // normalizedRing = 0 es el centro, 1 es el borde exterior
      var color, opacity;
      
      if (normalizedRing < 0.33) {
        // Centro: rojo intenso
        color = 0xFF0000;
        opacity = 0.7 - (normalizedRing * 0.2);
      } else if (normalizedRing < 0.66) {
        // Medio: naranja
        var t = (normalizedRing - 0.33) / 0.33;
        var r = 255;
        var g = Math.floor(128 * (1 + t));
        var b = 0;
        color = (r << 16) | (g << 8) | b;
        opacity = 0.6 - (normalizedRing * 0.3);
      } else {
        // Exterior: amarillo
        color = 0xFFFF00;
        opacity = 0.45 - (normalizedRing * 0.35);
      }
      
      if (currentRadius > 0.3 || ring === 0) {
        var circle = createFilledCircleOnSphere(lat, lng, currentRadius, color, opacity);
        heatmapGroup.add(circle);            //son aprox 228km por unidad

      }
    }

    scene.add(heatmapGroup);
    heatmapCircles.push(heatmapGroup);
    
    return heatmapGroup;
  }

  // Función para crear un círculo relleno en la superficie de la esfera
  function createFilledCircleOnSphere(lat, lng, radius, colorHex, opacity) {
    var segments = 48;
    var geometry = new THREE.Geometry();
    
    // Convertir el radio de grados a radianes
    var angularRadius = radius * Math.PI / 180;
    
    // Centro del círculo - usar la misma conversión que addPoint
    var phi = (90 - lat) * Math.PI / 180;
    var theta = (180 - lng) * Math.PI / 180;
    var radiusOffset = 201; // Ligeramente por encima de la superficie
    
    var centerVertex = new THREE.Vector3(
      radiusOffset * Math.sin(phi) * Math.cos(theta),
      radiusOffset * Math.cos(phi),
      radiusOffset * Math.sin(phi) * Math.sin(theta)
    );
    geometry.vertices.push(centerVertex);
    
    // Crear vértices del perímetro
    var perimeterVertices = [];
    for (var i = 0; i <= segments; i++) {
      var angle = (i / segments) * Math.PI * 2;
      
      // Usar fórmula esférica correcta para calcular puntos alrededor
      var latRad = lat * Math.PI / 180;
      
      // Calcular nueva latitud
      var newLat = Math.asin(
        Math.sin(latRad) * Math.cos(angularRadius) +
        Math.cos(latRad) * Math.sin(angularRadius) * Math.cos(angle)
      );
      
      // Calcular nueva longitud
      var y = Math.sin(angle) * Math.sin(angularRadius) * Math.cos(latRad);
      var x = Math.cos(angularRadius) - Math.sin(latRad) * Math.sin(newLat);
      var newLng = ((lng * Math.PI / 180) + Math.atan2(y, x)) * 180 / Math.PI;
      var newLatDeg = newLat * 180 / Math.PI;
      
      // Convertir a 3D usando la misma fórmula que addPoint
      var newPhi = (90 - newLatDeg) * Math.PI / 180;
      var newTheta = (180 - newLng) * Math.PI / 180;
      
      var vertex = new THREE.Vector3(
        radiusOffset * Math.sin(newPhi) * Math.cos(newTheta),
        radiusOffset * Math.cos(newPhi),
        radiusOffset * Math.sin(newPhi) * Math.sin(newTheta)
      );
      
      geometry.vertices.push(vertex);
      perimeterVertices.push(i + 1);
    }
    
    // Crear caras (triángulos desde el centro hacia el perímetro)
    var color = new THREE.Color(colorHex);
    for (var i = 0; i < segments; i++) {
      var face = new THREE.Face3(0, perimeterVertices[i], perimeterVertices[i + 1]);
      face.color = color;
      geometry.faces.push(face);
    }
    
    geometry.computeFaceNormals();
    
    var material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      vertexColors: THREE.FaceColors,
      opacity: opacity,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.NormalBlending
    });
    
    var circle = new THREE.Mesh(geometry, material);
    return circle;
  }

  addData = function(data, opts) {
    var lat, lng, size, color, i, step, colorFnWrapper;

    opts.animated = opts.animated || false;
    this.is_animated = opts.animated;
    opts.format = opts.format || 'magnitude';
    opts.heatmapRadius = opts.heatmapRadius || 8;
    
    console.log(opts.format);
    if (opts.format === 'magnitude') {
      step = 3;
      colorFnWrapper = function(data, i) { return colorFn(data[i+2]); }
    } else if (opts.format === 'legend') {
      step = 4;
      colorFnWrapper = function(data, i) { return colorFn(data[i+3]); }
    } else {
      throw('error: format not supported: '+opts.format);
    }

    if (opts.animated) {
      if (this._baseGeometry === undefined) {
        this._baseGeometry = new THREE.Geometry();
        for (i = 0; i < data.length; i += step) {
          lat = data[i];
          lng = data[i + 1];
          color = colorFnWrapper(data,i);
          size = 0;
          addPoint(lat, lng, size, color, this._baseGeometry);
        }
      }
      if(this._morphTargetId === undefined) {
        this._morphTargetId = 0;
      } else {
        this._morphTargetId += 1;
      }
      opts.name = opts.name || 'morphTarget'+this._morphTargetId;
    }
    var subgeo = new THREE.Geometry();
    for (i = 0; i < data.length; i += step) {
      lat = data[i];
      lng = data[i + 1];
      color = colorFnWrapper(data,i);
      size = data[i + 2];
      size = size*200;
      addPoint(lat, lng, size, color, subgeo);
      
      // Crear mapa de calor para cada punto
      createHeatmapCircle(lat, lng, opts.heatmapRadius);
    }
    if (opts.animated) {
      this._baseGeometry.morphTargets.push({'name': opts.name, vertices: subgeo.vertices});
    } else {
      this._baseGeometry = subgeo;
    }

  };

  function createPoints() {
    if (this._baseGeometry !== undefined) {
      if (this.is_animated === false) {
        this.points = new THREE.Mesh(this._baseGeometry, new THREE.MeshBasicMaterial({
              color: 0xffffff,
              vertexColors: THREE.FaceColors,
              morphTargets: false
            }));
      } else {
        if (this._baseGeometry.morphTargets.length < 8) {
          console.log('t l',this._baseGeometry.morphTargets.length);
          var padding = 8-this._baseGeometry.morphTargets.length;
          console.log('padding', padding);
          for(var i=0; i<=padding; i++) {
            console.log('padding',i);
            this._baseGeometry.morphTargets.push({'name': 'morphPadding'+i, vertices: this._baseGeometry.vertices});
          }
        }
        this.points = new THREE.Mesh(this._baseGeometry, new THREE.MeshBasicMaterial({
              color: 0xffffff,
              vertexColors: THREE.FaceColors,
              morphTargets: true
            }));
      }
      scene.add(this.points);
    }
  }

  function addPoint(lat, lng, size, color, subgeo) {

    var phi = (90 - lat) * Math.PI / 180;
    var theta = (180 - lng) * Math.PI / 180;

    point.position.x = 200 * Math.sin(phi) * Math.cos(theta);
    point.position.y = 200 * Math.cos(phi);
    point.position.z = 200 * Math.sin(phi) * Math.sin(theta);

    point.lookAt(mesh.position);

    point.scale.z = Math.max( size, 0.1 ); // avoid non-invertible matrix
    point.updateMatrix();

    for (var i = 0; i < point.geometry.faces.length; i++) {

      point.geometry.faces[i].color = color;

    }

    THREE.GeometryUtils.merge(subgeo, point);
  }

  $('#calcBtn').click(function () {
    var globeInstance = globe;
   var lat = parseFloat(document.getElementById('lat').value);
    var lng = parseFloat(document.getElementById('lon').value);
 
    var color = new THREE.Color(0,   1, 0);
    var size = 0.5;
    var heatmapRadius = window.ejectaDist ; // Usa el valor global, o 10 si no existe
    globeInstance.reset();
    globeInstance.clearHeatmaps();

    // Si no existe la geometría base, créala
  globeInstance._baseGeometry = new THREE.Geometry();


    // Agrega el nuevo punto a la geometría base
    addPoint(lat, lng, size * 200, color, globeInstance._baseGeometry);

    // Crear mapa de calor
    createHeatmapCircle(lat, lng, heatmapRadius);

    // Si ya existe el mesh de puntos, elimínalo antes de crear uno nuevo
    if (globeInstance.points) {
        globeInstance.scene.remove(globeInstance.points);
    }

    // Crea el mesh con todos los puntos acumulados
    globeInstance.points = new THREE.Mesh(
        globeInstance._baseGeometry,
        new THREE.MeshBasicMaterial({
            color: 0xffffff,
            vertexColors: THREE.FaceColors,
            morphTargets: false
        })
    );
    globeInstance.scene.add(globeInstance.points);
    console.log(lat, lng);
    alert('Punto agregado en Lat: ' + lat.toFixed(2) + ', Lng: ' + lng.toFixed(2) + ' con heatmap de ' + heatmapRadius + '°');
  });


  function onMouseDown(event) {
    event.preventDefault();

    container.addEventListener('mousemove', onMouseMove, false);
    container.addEventListener('mouseup', onMouseUp, false);
    container.addEventListener('mouseout', onMouseOut, false);

    mouseOnDown.x = - event.clientX;
    mouseOnDown.y = event.clientY;

    targetOnDown.x = target.x;
    targetOnDown.y = target.y;

    container.style.cursor = 'move';
  }

  function onMouseMove(event) {
    mouse.x = - event.clientX;
    mouse.y = event.clientY;

    var zoomDamp = distance/1000;

    target.x = targetOnDown.x + (mouse.x - mouseOnDown.x) * 0.005 * zoomDamp;
    target.y = targetOnDown.y + (mouse.y - mouseOnDown.y) * 0.005 * zoomDamp;

    target.y = target.y > PI_HALF ? PI_HALF : target.y;
    target.y = target.y < - PI_HALF ? - PI_HALF : target.y;
  }

  function onMouseUp(event) {
    container.removeEventListener('mousemove', onMouseMove, false);
    container.removeEventListener('mouseup', onMouseUp, false);
    container.removeEventListener('mouseout', onMouseOut, false);
    container.style.cursor = 'auto';
  }

  function onMouseOut(event) {
    container.removeEventListener('mousemove', onMouseMove, false);
    container.removeEventListener('mouseup', onMouseUp, false);
    container.removeEventListener('mouseout', onMouseOut, false);
  }

  function onMouseWheel(event) {
    event.preventDefault();
    if (overRenderer) {
      zoom(event.wheelDeltaY * 0.3);
    }
    return false;
  }

  function onDocumentKeyDown(event) {
    switch (event.keyCode) {
      case 38:
        zoom(100);
        event.preventDefault();
        break;
      case 40:
        zoom(-100);
        event.preventDefault();
        break;
    }
  }

  function onWindowResize( event ) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
  }

  function zoom(delta) {
    distanceTarget -= delta;
    distanceTarget = distanceTarget > 1000 ? 1000 : distanceTarget;
    distanceTarget = distanceTarget < 350 ? 350 : distanceTarget;
  }

  function animate() {
    requestAnimationFrame(animate);
    render();
  }

  function render() {
    zoom(curZoomSpeed);

    rotation.x += (target.x - rotation.x) * 0.1;
    rotation.y += (target.y - rotation.y) * 0.1;
    distance += (distanceTarget - distance) * 0.3;

    camera.position.x = distance * Math.sin(rotation.x) * Math.cos(rotation.y);
    camera.position.y = distance * Math.sin(rotation.y);
    camera.position.z = distance * Math.cos(rotation.x) * Math.cos(rotation.y);

    camera.lookAt(mesh.position);

    renderer.render(scene, camera);
  }

  init();
  this.animate = animate;


  this.__defineGetter__('time', function() {
    return this._time || 0;
  });

  this.__defineSetter__('time', function(t) {
    var validMorphs = [];
    var morphDict = this.points.morphTargetDictionary;
    for(var k in morphDict) {
      if(k.indexOf('morphPadding') < 0) {
        validMorphs.push(morphDict[k]);
      }
    }
    validMorphs.sort();
    var l = validMorphs.length-1;
    var scaledt = t*l+1;
    var index = Math.floor(scaledt);
    for (i=0;i<validMorphs.length;i++) {
      this.points.morphTargetInfluences[validMorphs[i]] = 0;
    }
    var lastIndex = index - 1;
    var leftover = scaledt - index;
    if (lastIndex >= 0) {
      this.points.morphTargetInfluences[lastIndex] = 1 - leftover;
    }
    this.points.morphTargetInfluences[index] = leftover;
    this._time = t;
  });

  function reset() {
    scene.remove(this.points);
    this.points = null;
    
    // Limpiar heatmaps
    for (var i = 0; i < heatmapCircles.length; i++) {
      scene.remove(heatmapCircles[i]);
    }
    heatmapCircles = [];
  }

  // Función para limpiar todos los heatmaps
  this.clearHeatmaps = function() {
    for (var i = 0; i < heatmapCircles.length; i++) {
      scene.remove(heatmapCircles[i]);
    }
    heatmapCircles = [];
  };

  this.addData = addData;
  this.createPoints = createPoints;
  this.renderer = renderer;
  this.scene = scene;
  this.reset = reset;

  return this;

};