        let scene, camera, renderer, globe, impactGroup;
        let impacts = [];
        const EARTH_RADIUS = 5;

        function init() {
            // Escena
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x000011);

            // Cámara
            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.z = 15;

            // Renderer
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            document.getElementById('canvas-container').appendChild(renderer.domElement);

            // Luz
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(5, 3, 5);
            scene.add(directionalLight);

            // Crear globo terráqueo
            const geometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
            
            // Textura de la Tierra (usando un color base y detalles)
            const textureLoader = new THREE.TextureLoader();
            const earthTexture = createEarthTexture();
            
            const material = new THREE.MeshPhongMaterial({
                map: earthTexture,
                bumpScale: 0.05,
                specular: new THREE.Color(0x333333),
                shininess: 5
            });
            
            globe = new THREE.Mesh(geometry, material);
            scene.add(globe);

            // Grupo para impactos
            impactGroup = new THREE.Group();
            scene.add(impactGroup);

            // Agregar estrellas
            addStars();

            // Controles de mouse
            setupControls();

            // Actualizar valores de sliders
            updateSliderValues();

            // Animación
            animate();
        }

        function createEarthTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 2048;
            canvas.height = 1024;
            const ctx = canvas.getContext('2d');

            // Océanos
            ctx.fillStyle = '#1a5f7a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Continentes simplificados (puedes reemplazar esto con tu imagen JPG)
            ctx.fillStyle = '#2d5016';
            
            // América
            ctx.fillRect(300, 200, 400, 600);
            ctx.fillRect(400, 600, 200, 200);
            
            // Europa y África
            ctx.fillRect(900, 150, 300, 300);
            ctx.fillRect(950, 400, 250, 400);
            
            // Asia
            ctx.fillRect(1200, 100, 600, 500);
            
            // Australia
            ctx.fillRect(1500, 600, 200, 150);

            // Grid de coordenadas
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            
            // Líneas de latitud
            for (let i = 0; i <= 8; i++) {
                ctx.beginPath();
                ctx.moveTo(0, i * canvas.height / 8);
                ctx.lineTo(canvas.width, i * canvas.height / 8);
                ctx.stroke();
            }
            
            // Líneas de longitud
            for (let i = 0; i <= 16; i++) {
                ctx.beginPath();
                ctx.moveTo(i * canvas.width / 16, 0);
                ctx.lineTo(i * canvas.width / 16, canvas.height);
                ctx.stroke();
            }

            const texture = new THREE.CanvasTexture(canvas);
            return texture;
        }

        function addStars() {
            const starsGeometry = new THREE.BufferGeometry();
            const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
            
            const starsVertices = [];
            for (let i = 0; i < 10000; i++) {
                const x = (Math.random() - 0.5) * 2000;
                const y = (Math.random() - 0.5) * 2000;
                const z = (Math.random() - 0.5) * 2000;
                starsVertices.push(x, y, z);
            }
            
            starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
            const stars = new THREE.Points(starsGeometry, starsMaterial);
            scene.add(stars);
        }

        function setupControls() {
            let isDragging = false;
            let previousMousePosition = { x: 0, y: 0 };

            renderer.domElement.addEventListener('mousedown', (e) => {
                isDragging = true;
            });

            renderer.domElement.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    const deltaMove = {
                        x: e.offsetX - previousMousePosition.x,
                        y: e.offsetY - previousMousePosition.y
                    };

                    globe.rotation.y += deltaMove.x * 0.01;
                    globe.rotation.x += deltaMove.y * 0.01;
                    
                    impactGroup.rotation.y += deltaMove.x * 0.01;
                    impactGroup.rotation.x += deltaMove.y * 0.01;
                }

                previousMousePosition = {
                    x: e.offsetX,
                    y: e.offsetY
                };
            });

            renderer.domElement.addEventListener('mouseup', () => {
                isDragging = false;
            });

            renderer.domElement.addEventListener('wheel', (e) => {
                e.preventDefault();
                camera.position.z += e.deltaY * 0.01;
                camera.position.z = Math.max(8, Math.min(30, camera.position.z));
            });

            window.addEventListener('resize', () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            });
        }

        function updateSliderValues() {
            document.getElementById('radius').addEventListener('input', (e) => {
                document.getElementById('radius-value').textContent = e.target.value + ' km';
            });

            document.getElementById('intensity').addEventListener('input', (e) => {
                document.getElementById('intensity-value').textContent = (e.target.value * 100) + '%';
            });
        }

        // Convertir coordenadas geográficas (lat, lon) a posición 3D en la esfera
        function latLonToVector3(lat, lon, radius) {
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lon + 180) * (Math.PI / 180);

            const x = -(radius * Math.sin(phi) * Math.cos(theta));
            const y = radius * Math.cos(phi);
            const z = radius * Math.sin(phi) * Math.sin(theta);

            return new THREE.Vector3(x, y, z);
        }

        function addImpact() {
            const lat = parseFloat(document.getElementById('latitude').value);
            const lon = parseFloat(document.getElementById('longitude').value);
            const radiusKm = parseFloat(document.getElementById('radius').value);
            const intensity = parseFloat(document.getElementById('intensity').value);

            if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
                alert('Por favor ingresa coordenadas válidas');
                return;
            }

            // Calcular radio en unidades del globo (proporcional al radio de la Tierra)
            const radiusScale = radiusKm / 6371; // Radio de la Tierra en km
            const impactRadius = radiusScale * EARTH_RADIUS;

            // Posición del impacto
            const position = latLonToVector3(lat, lon, EARTH_RADIUS);

            // Crear círculo de impacto principal
            const mainCircle = createImpactCircle(position, impactRadius, 0xff0000, intensity);
            impactGroup.add(mainCircle);

            // Crear anillos de daño
            const ring1 = createImpactCircle(position, impactRadius * 1.5, 0xff8800, intensity * 0.6);
            impactGroup.add(ring1);

            const ring2 = createImpactCircle(position, impactRadius * 2, 0xffff00, intensity * 0.3);
            impactGroup.add(ring2);

            // Crear marcador de punto
            const markerGeometry = new THREE.SphereGeometry(0.1, 16, 16);
            const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.position.copy(position.multiplyScalar(1.01));
            impactGroup.add(marker);

            impacts.push({ mainCircle, ring1, ring2, marker });

            console.log(`Impacto agregado en: Lat ${lat}, Lon ${lon}, Radio ${radiusKm} km`);
        }

        function createImpactCircle(centerPos, radius, color, opacity) {
            const segments = 64;
            const geometry = new THREE.BufferGeometry();
            const vertices = [];

            // Crear puntos del círculo en la superficie de la esfera
            for (let i = 0; i <= segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                
                // Crear punto en un plano local
                const localX = Math.cos(angle) * radius;
                const localY = Math.sin(angle) * radius;
                
                // Vector de dirección desde el centro de la Tierra al punto de impacto
                const direction = centerPos.clone().normalize();
                
                // Crear dos vectores perpendiculares a la dirección
                const perpendicular1 = new THREE.Vector3();
                if (Math.abs(direction.y) < 0.99) {
                    perpendicular1.crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();
                } else {
                    perpendicular1.crossVectors(direction, new THREE.Vector3(1, 0, 0)).normalize();
                }
                
                const perpendicular2 = new THREE.Vector3().crossVectors(direction, perpendicular1).normalize();
                
                // Calcular posición del punto en el círculo
                const point = centerPos.clone()
                    .add(perpendicular1.clone().multiplyScalar(localX))
                    .add(perpendicular2.clone().multiplyScalar(localY));
                
                // Proyectar de vuelta a la superficie de la esfera
                point.normalize().multiplyScalar(EARTH_RADIUS + 0.01);
                
                vertices.push(point.x, point.y, point.z);
            }

            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

            const material = new THREE.LineBasicMaterial({
                color: color,
                transparent: true,
                opacity: opacity,
                linewidth: 2
            });

            const circle = new THREE.LineLoop(geometry, material);
            
            // Agregar un disco relleno semi-transparente
            const discGeometry = new THREE.CircleGeometry(radius, segments);
            const discMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: opacity * 0.3,
                side: THREE.DoubleSide
            });
            const disc = new THREE.Mesh(discGeometry, discMaterial);
            
            // Orientar el disco hacia la posición de impacto
            disc.position.copy(centerPos.clone().normalize().multiplyScalar(EARTH_RADIUS + 0.005));
            disc.lookAt(0, 0, 0);
            
            circle.add(disc);

            return circle;
        }

        function clearImpacts() {
            impacts.forEach(impact => {
                impactGroup.remove(impact.mainCircle);
                impactGroup.remove(impact.ring1);
                impactGroup.remove(impact.ring2);
                impactGroup.remove(impact.marker);
            });
            impacts = [];
        }

        function animate() {
            requestAnimationFrame(animate);
            
            // Rotación automática lenta del globo
            globe.rotation.y += 0.001;
            impactGroup.rotation.y += 0.001;
            
            renderer.ren
            der(scene, camera);
        }