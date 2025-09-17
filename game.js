import * as THREE from 'three';

class BearCatchGame {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.bear = null;
        this.fish = [];
        this.score = 0;
        this.streak = 0;
        this.gameState = 'menu'; // menu, playing, gameOver
        this.bearPosition = 0; // -1, 0, 1 (left, center, right)
        this.fishSpawnTimer = 0;
        this.fishSpawnInterval = 2000; // milliseconds
        this.lastTime = 0;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        this.init();
        this.setupEventListeners();
        this.animate();
    }
    
    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        
        // Camera setup (isometric view)
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.OrthographicCamera(-8 * aspect, 8 * aspect, 8, -8, 0.1, 1000);
        this.camera.position.set(10, 10, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.getElementById('gameContainer').appendChild(this.renderer.domElement);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        this.scene.add(directionalLight);
        
        this.createEnvironment();
        this.createBear();
    }
    
    createEnvironment() {
        // Log platform (cylindrical and wood-like)
        const logGeometry = new THREE.CylinderGeometry(6, 6, 2, 16);
        const logMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const log = new THREE.Mesh(logGeometry, logMaterial);
        log.position.set(0, -1, 0);
        log.rotation.z = Math.PI / 2; // Rotate to make it lie horizontally
        this.scene.add(log);
        
        // Log rings/texture details
        for (let i = 0; i < 8; i++) {
            const ringGeometry = new THREE.TorusGeometry(5.8 - i * 0.2, 0.1, 8, 16);
            const ringMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.set(0, -1, 0);
            ring.rotation.x = Math.PI / 2;
            this.scene.add(ring);
        }
        
        // Log end caps
        const endCapGeometry = new THREE.CircleGeometry(6, 16);
        const endCapMaterial = new THREE.MeshLambertMaterial({ color: 0xDEB887 });
        
        const leftCap = new THREE.Mesh(endCapGeometry, endCapMaterial);
        leftCap.position.set(-6, -1, 0);
        leftCap.rotation.y = Math.PI / 2;
        this.scene.add(leftCap);
        
        const rightCap = new THREE.Mesh(endCapGeometry, endCapMaterial);
        rightCap.position.set(6, -1, 0);
        rightCap.rotation.y = -Math.PI / 2;
        this.scene.add(rightCap);
        
        // Waterfall effect (simple animated strips)
        for (let i = 0; i < 20; i++) {
            const waterGeometry = new THREE.PlaneGeometry(0.2, 8);
            const waterMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x4FC3F7, 
                transparent: true, 
                opacity: 0.6 
            });
            const waterStrip = new THREE.Mesh(waterGeometry, waterMaterial);
            waterStrip.position.set(
                (Math.random() - 0.5) * 8,
                0,
                -3 + Math.random() * 0.5
            );
            waterStrip.userData = { 
                speed: 0.1 + Math.random() * 0.05,
                originalY: waterStrip.position.y
            };
            this.scene.add(waterStrip);
        }
        
        // Rocks for decoration
        for (let i = 0; i < 5; i++) {
            const rockGeometry = new THREE.BoxGeometry(
                0.5 + Math.random() * 0.5,
                0.3 + Math.random() * 0.3,
                0.4 + Math.random() * 0.3
            );
            const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            rock.position.set(
                (Math.random() - 0.5) * 10,
                Math.random() * 0.5,
                2 + Math.random() * 2
            );
            this.scene.add(rock);
        }
    }
    
    createBear() {
        const bearGroup = new THREE.Group();
        
        // Bear body (brown)
        const bodyGeometry = new THREE.BoxGeometry(1.2, 1.5, 0.8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.75;
        bearGroup.add(body);
        
        // Bear belly (tan/beige)
        const bellyGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.6);
        const bellyMaterial = new THREE.MeshLambertMaterial({ color: 0xDEB887 });
        const belly = new THREE.Mesh(bellyGeometry, bellyMaterial);
        belly.position.set(0, 0.75, 0.1);
        bearGroup.add(belly);
        
        // Bear head (brown)
        const headGeometry = new THREE.BoxGeometry(1, 1, 0.8);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.8;
        bearGroup.add(head);
        
        // Bear snout (tan)
        const snoutGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.4);
        const snoutMaterial = new THREE.MeshLambertMaterial({ color: 0xDEB887 });
        const snout = new THREE.Mesh(snoutGeometry, snoutMaterial);
        snout.position.set(0, 1.6, 0.4);
        bearGroup.add(snout);
        
        // Bear nose (black)
        const noseGeometry = new THREE.BoxGeometry(0.2, 0.15, 0.15);
        const noseMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const nose = new THREE.Mesh(noseGeometry, noseMaterial);
        nose.position.set(0, 1.65, 0.65);
        bearGroup.add(nose);
        
        // Bear eyes (blue)
        const eyeGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.1);
        const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.2, 1.85, 0.45);
        bearGroup.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.2, 1.85, 0.45);
        bearGroup.add(rightEye);
        
        // Bear ears (brown with tan inner)
        const earGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.2);
        const earMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        
        const leftEar = new THREE.Mesh(earGeometry, earMaterial);
        leftEar.position.set(-0.3, 2.1, 0.2);
        bearGroup.add(leftEar);
        
        const rightEar = new THREE.Mesh(earGeometry, earMaterial);
        rightEar.position.set(0.3, 2.1, 0.2);
        bearGroup.add(rightEar);
        
        // Inner ears (tan)
        const innerEarGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.1);
        const innerEarMaterial = new THREE.MeshLambertMaterial({ color: 0xDEB887 });
        
        const leftInnerEar = new THREE.Mesh(innerEarGeometry, innerEarMaterial);
        leftInnerEar.position.set(-0.3, 2.1, 0.25);
        bearGroup.add(leftInnerEar);
        
        const rightInnerEar = new THREE.Mesh(innerEarGeometry, innerEarMaterial);
        rightInnerEar.position.set(0.3, 2.1, 0.25);
        bearGroup.add(rightInnerEar);
        
        // Bear arms (brown)
        const armGeometry = new THREE.BoxGeometry(0.4, 1, 0.4);
        const armMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.8, 0.8, 0);
        bearGroup.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.8, 0.8, 0);
        bearGroup.add(rightArm);
        
        // Bear legs (brown)
        const legGeometry = new THREE.BoxGeometry(0.4, 0.8, 0.4);
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.3, -0.1, 0);
        bearGroup.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.3, -0.1, 0);
        bearGroup.add(rightLeg);
        
        bearGroup.position.set(0, 0, 2);
        this.bear = bearGroup;
        this.scene.add(bearGroup);
    }
    
    createFish() {
        const fishGroup = new THREE.Group();
        
        // Fish body
        const bodyGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.3);
        const fishColors = [0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0x96CEB4, 0xF7DC6F];
        const bodyMaterial = new THREE.MeshLambertMaterial({ 
            color: fishColors[Math.floor(Math.random() * fishColors.length)]
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        fishGroup.add(body);
        
        // Fish tail
        const tailGeometry = new THREE.BoxGeometry(0.3, 0.6, 0.1);
        const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
        tail.position.set(-0.5, 0, 0);
        fishGroup.add(tail);
        
        // Fish fin
        const finGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.2);
        const fin = new THREE.Mesh(finGeometry, bodyMaterial);
        fin.position.set(0, 0.3, 0);
        fishGroup.add(fin);
        
        // Set initial position and trajectory
        const startX = (Math.random() - 0.5) * 16;
        const startY = -8;
        fishGroup.position.set(startX, startY, 0);
        
        // Fish movement properties
        fishGroup.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                0.15 + Math.random() * 0.1,
                0
            ),
            gravity: -0.003,
            rotation: Math.random() * 0.1,
            size: 0.8 + Math.random() * 0.4,
            caught: false
        };
        
        fishGroup.scale.setScalar(fishGroup.userData.size);
        
        this.fish.push(fishGroup);
        this.scene.add(fishGroup);
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            if (this.gameState !== 'playing') return;
            
            switch(event.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveBear(-1);
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveBear(1);
                    break;
            }
        });
        
        // Mobile touch controls
        document.getElementById('leftButton').addEventListener('click', () => {
            if (this.gameState === 'playing') this.moveBear(-1);
        });
        
        document.getElementById('rightButton').addEventListener('click', () => {
            if (this.gameState === 'playing') this.moveBear(1);
        });
        
        // Start button
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });
        
        // Touch/click anywhere to move (alternative mobile control)
        this.renderer.domElement.addEventListener('click', (event) => {
            if (this.gameState !== 'playing') return;
            
            const rect = this.renderer.domElement.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const centerX = rect.width / 2;
            
            if (x < centerX - 50) {
                this.moveBear(-1);
            } else if (x > centerX + 50) {
                this.moveBear(1);
            }
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            const aspect = window.innerWidth / window.innerHeight;
            this.camera.left = -8 * aspect;
            this.camera.right = 8 * aspect;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    moveBear(direction) {
        this.bearPosition = Math.max(-1, Math.min(1, this.bearPosition + direction));
        
        // Animate bear movement
        const targetX = this.bearPosition * 3;
        const duration = 200;
        const startX = this.bear.position.x;
        const startTime = performance.now();
        
        const animateBear = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Smooth easing
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            this.bear.position.x = startX + (targetX - startX) * easeProgress;
            
            if (progress < 1) {
                requestAnimationFrame(animateBear);
            }
        };
        
        requestAnimationFrame(animateBear);
        
        // Check for fish catching
        this.checkFishCatch();
    }
    
    checkFishCatch() {
        const bearX = this.bearPosition * 3;
        
        this.fish.forEach((fish, index) => {
            if (fish.userData.caught) return;
            
            const distance = Math.abs(fish.position.x - bearX);
            if (distance < 1.5 && fish.position.y > -1 && fish.position.y < 3) {
                this.catchFish(fish, index);
            }
        });
    }
    
    catchFish(fish, index) {
        fish.userData.caught = true;
        this.score += 10 * (this.streak + 1);
        this.streak++;
        
        // Animate caught fish
        const startY = fish.position.y;
        const duration = 500;
        const startTime = performance.now();
        
        const animateCatch = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            fish.position.y = startY + progress * 5;
            fish.rotation.y += 0.2;
            fish.scale.multiplyScalar(1.02);
            
            if (progress >= 1) {
                this.scene.remove(fish);
                this.fish.splice(index, 1);
            } else {
                requestAnimationFrame(animateCatch);
            }
        };
        
        requestAnimationFrame(animateCatch);
        this.updateUI();
    }
    
    updateUI() {
        document.getElementById('score').textContent = `Score: ${this.score}`;
        
        if (this.streak > 0) {
            document.getElementById('streak').textContent = `Streak: ${this.streak}`;
            document.getElementById('streak').classList.remove('hidden');
        } else {
            document.getElementById('streak').classList.add('hidden');
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.streak = 0;
        this.bearPosition = 0;
        this.bear.position.x = 0;
        this.fishSpawnTimer = 0;
        
        // Clear existing fish
        this.fish.forEach(fish => this.scene.remove(fish));
        this.fish = [];
        
        document.getElementById('gameOverlay').classList.add('hidden');
        this.updateUI();
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.streak = 0;
        
        // Bear fall animation
        const duration = 1000;
        const startY = this.bear.position.y;
        const startTime = performance.now();
        
        const animateFall = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            this.bear.position.y = startY - progress * 8;
            this.bear.rotation.z = progress * Math.PI;
            
            if (progress >= 1) {
                this.showGameOver();
            } else {
                requestAnimationFrame(animateFall);
            }
        };
        
        requestAnimationFrame(animateFall);
    }
    
    showGameOver() {
        document.getElementById('gameOverTitle').textContent = 'Game Over!';
        document.getElementById('gameOverText').textContent = 'The bear fell into the water!';
        document.getElementById('finalScore').textContent = `Final Score: ${this.score}`;
        document.getElementById('finalScore').classList.remove('hidden');
        document.getElementById('startButton').textContent = 'Play Again';
        document.getElementById('gameOverlay').classList.remove('hidden');
        
        // Reset bear position
        this.bear.position.y = 0;
        this.bear.rotation.z = 0;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (this.gameState === 'playing') {
            // Spawn fish
            this.fishSpawnTimer += deltaTime;
            if (this.fishSpawnTimer >= this.fishSpawnInterval) {
                this.createFish();
                this.fishSpawnTimer = 0;
                
                // Increase difficulty over time
                this.fishSpawnInterval = Math.max(800, this.fishSpawnInterval - 20);
            }
            
            // Update fish
            this.fish.forEach((fish, index) => {
                if (fish.userData.caught) return;
                
                // Apply physics
                fish.userData.velocity.y += fish.userData.gravity;
                fish.position.add(fish.userData.velocity);
                fish.rotation.y += fish.userData.rotation;
                
                // Check if fish missed (too low)
                if (fish.position.y < -10) {
                    this.scene.remove(fish);
                    this.fish.splice(index, 1);
                    this.gameOver();
                }
            });
        }
        
        // Animate waterfall
        this.scene.children.forEach(child => {
            if (child.userData.speed) {
                child.position.y -= child.userData.speed;
                if (child.position.y < -10) {
                    child.position.y = child.userData.originalY + 10;
                }
            }
        });
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Start the game
new BearCatchGame();