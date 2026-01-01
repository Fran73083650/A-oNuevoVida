// ============================================
// VARIABLES GLOBALES
// ============================================

let currentSection = 0;
let isPlaying = false;
let fireworksAnimation;

// Referencias a los audios
const audios = [
    document.getElementById('music1'),
    document.getElementById('music2'),
    document.getElementById('music3')
];

// Verificar que los audios se cargaron correctamente
console.log('Audios disponibles:', audios);
audios.forEach((audio, index) => {
    if (audio) {
        console.log(`Audio ${index + 1}:`, audio.src);
        // Precargar los audios
        audio.load();
        
        // Eventos de debug
        audio.addEventListener('canplaythrough', () => {
            console.log(`Audio ${index + 1} listo para reproducir`);
        });
        
        audio.addEventListener('error', (e) => {
            console.error(`Error cargando audio ${index + 1}:`, e);
        });
    } else {
        console.error(`Audio ${index + 1} no encontrado en el DOM`);
    }
});

// ============================================
// GESTIÓN DE MÚSICA POR SECCIÓN
// ============================================

function playMusicForSection(sectionIndex) {
    console.log(`Cambiando a sección ${sectionIndex}`);
    
    // Detener todas las canciones
    audios.forEach((audio, index) => {
        if (audio && index !== sectionIndex) {
            audio.pause();
            audio.currentTime = 0;
            console.log(`Audio ${index + 1} detenido`);
        }
    });
    
    // Reproducir la canción de la sección actual
    const currentAudio = audios[sectionIndex];
    if (currentAudio) {
        // Asegurarse de que el volumen está correcto
        currentAudio.volume = 0.7;
        
        const playPromise = currentAudio.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log(`Audio ${sectionIndex + 1} reproduciéndose correctamente`);
                    isPlaying = true;
                })
                .catch(e => {
                    console.error(`Error al reproducir audio ${sectionIndex + 1}:`, e);
                    // Intentar reproducir nuevamente después de un pequeño delay
                    setTimeout(() => {
                        currentAudio.play().catch(err => {
                            console.error(`Segundo intento fallido para audio ${sectionIndex + 1}:`, err);
                        });
                    }, 500);
                });
        }
    } else {
        console.error(`Audio ${sectionIndex + 1} no está disponible`);
    }
}

// Detectar cambio de sección con Intersection Observer
function setupSectionObserver() {
    const observerOptions = {
        threshold: [0, 0.1, 0.3, 0.5], // Múltiples umbrales para mejor detección
        rootMargin: '-10% 0px -10% 0px' // Margen para activar antes
    };
    
    let lastTriggeredSection = -1;
    
    const observer = new IntersectionObserver((entries) => {
        // Ordenar las entradas por ratio de intersección (mayor primero)
        const sortedEntries = entries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        
        sortedEntries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio > 0.1) {
                const sectionIndex = parseInt(entry.target.dataset.section);
                console.log(`Sección ${sectionIndex} visible (${Math.round(entry.intersectionRatio * 100)}% visible)`);
                
                // Evitar cambios repetidos
                if (sectionIndex !== currentSection && sectionIndex !== lastTriggeredSection) {
                    currentSection = sectionIndex;
                    lastTriggeredSection = sectionIndex;
                    playMusicForSection(sectionIndex);
                }
            }
        });
    }, observerOptions);
    
    // Observar todas las secciones
    const sections = document.querySelectorAll('.section[data-section]');
    console.log(`Observando ${sections.length} secciones`);
    sections.forEach(section => {
        const sectionNum = section.dataset.section;
        console.log(`Sección registrada: ${sectionNum}`);
        observer.observe(section);
    });
    
    // SOLUCIÓN ADICIONAL: Detectar scroll manual
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            detectCurrentSection();
        }, 150);
    });
}

// Función adicional para detectar la sección actual manualmente
function detectCurrentSection() {
    const sections = document.querySelectorAll('.section[data-section]');
    const windowHeight = window.innerHeight;
    const scrollTop = window.scrollY;
    
    sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        const sectionTop = rect.top + scrollTop;
        const sectionHeight = rect.height;
        const sectionIndex = parseInt(section.dataset.section);
        
        // Si el centro de la pantalla está dentro de esta sección
        const screenCenter = scrollTop + (windowHeight / 2);
        
        if (screenCenter >= sectionTop && screenCenter <= sectionTop + sectionHeight) {
            if (sectionIndex !== currentSection) {
                console.log(`Detección manual: Sección ${sectionIndex} activa`);
                currentSection = sectionIndex;
                playMusicForSection(sectionIndex);
            }
        }
    });
}

// ============================================
// PANTALLA DE INICIO
// ============================================

document.getElementById('startBtn').addEventListener('click', function() {
    const startScreen = document.getElementById('startScreen');
    const mainContent = document.getElementById('mainContent');
    const impactScreen = document.getElementById('newYearImpact');
    
    console.log('Botón presionado - Iniciando secuencia');
    
    // Ocultar pantalla de inicio
    startScreen.style.opacity = '0';
    startScreen.style.transition = 'opacity 1s ease';
    
    setTimeout(() => {
        startScreen.style.display = 'none';
        
        // Mostrar contenido principal
        mainContent.classList.remove('hidden');
        console.log('Contenido principal mostrado');
        
        // Iniciar fuegos artificiales
        initFireworks();
        console.log('Fuegos artificiales iniciados');
        
        // Ocultar todas las secciones durante la introducción
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.style.display = 'none';
        });
        
        // Después de 8 segundos, hacer transición suave al contenido
        setTimeout(() => {
            console.log('Ocultando pantalla de impacto');
            impactScreen.style.transition = 'opacity 2s ease';
            impactScreen.style.opacity = '0';
            
            // Después de la transición, mostrar las secciones
            setTimeout(() => {
                impactScreen.style.display = 'none';
                
                // Mostrar secciones con fade in
                sections.forEach(section => {
                    section.style.display = 'flex';
                    section.style.opacity = '0';
                    section.style.transition = 'opacity 1.5s ease';
                });
                
                // Activar fade in después de un pequeño delay
                setTimeout(() => {
                    sections.forEach(section => {
                        section.style.opacity = '1';
                    });
                }, 100);
                
                // Scroll automático a la primera sección
                const firstSection = document.querySelector('.memories-section');
                if (firstSection) {
                    firstSection.scrollIntoView({ behavior: 'smooth' });
                }
                
                // Iniciar música de la primera sección
                playMusicForSection(0);
                
                // Configurar observer para cambio de música
                setupSectionObserver();
                
                // Iniciar carruseles automáticos
                startMemoriesAutoSlide();
                startPhotosAutoSlide();
                
                console.log('Secuencia completada - Mostrando contenido');
            }, 2000);
            
        }, 8000); // 8 segundos de introducción impactante
        
    }, 1000);
});

// ============================================
// CARRUSEL DE RECUERDOS (Automático)
// ============================================

let currentMemory = 0;
const memoryItems = document.querySelectorAll('.memory-item');
const totalMemories = memoryItems.length;
let memoriesAutoInterval;

// Crear dots para recuerdos
function createMemoryDots() {
    const dotsContainer = document.getElementById('memoryDots');
    dotsContainer.innerHTML = '';
    
    for (let i = 0; i < totalMemories; i++) {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => {
            goToMemory(i);
            resetMemoriesAutoSlide();
        });
        dotsContainer.appendChild(dot);
    }
}

function goToMemory(index) {
    if (index < 0) index = totalMemories - 1;
    if (index >= totalMemories) index = 0;
    
    memoryItems.forEach(item => item.classList.remove('active'));
    document.querySelectorAll('#memoryDots .dot').forEach(dot => 
        dot.classList.remove('active')
    );
    
    currentMemory = index;
    memoryItems[currentMemory].classList.add('active');
    document.querySelectorAll('#memoryDots .dot')[currentMemory].classList.add('active');
}

// Carrusel automático de recuerdos
function startMemoriesAutoSlide() {
    memoriesAutoInterval = setInterval(() => {
        goToMemory(currentMemory + 1);
    }, 4000); // Cambia cada 4 segundos
}

function resetMemoriesAutoSlide() {
    clearInterval(memoriesAutoInterval);
    startMemoriesAutoSlide();
}

// Botones de navegación
document.querySelector('.prev-memory').addEventListener('click', () => {
    goToMemory(currentMemory - 1);
    resetMemoriesAutoSlide();
});

document.querySelector('.next-memory').addEventListener('click', () => {
    goToMemory(currentMemory + 1);
    resetMemoriesAutoSlide();
});

// Swipe para recuerdos
let memoryTouchStartX = 0;
let memoryTouchEndX = 0;

const memoriesGallery = document.getElementById('memoriesGallery');

memoriesGallery.addEventListener('touchstart', (e) => {
    memoryTouchStartX = e.changedTouches[0].screenX;
}, { passive: true });

memoriesGallery.addEventListener('touchend', (e) => {
    memoryTouchEndX = e.changedTouches[0].screenX;
    handleMemorySwipe();
}, { passive: true });

function handleMemorySwipe() {
    const swipeThreshold = 50;
    const diff = memoryTouchStartX - memoryTouchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            goToMemory(currentMemory + 1);
        } else {
            goToMemory(currentMemory - 1);
        }
        resetMemoriesAutoSlide();
    }
}

createMemoryDots();

// ============================================
// GALERÍA DE FOTOS (Automática)
// ============================================

let currentPhoto = 0;
const photoItems = document.querySelectorAll('.photo-item');
const totalPhotos = photoItems.length;
let photosAutoInterval;

// Crear dots para fotos
function createPhotoDots() {
    const dotsContainer = document.getElementById('photoDots');
    dotsContainer.innerHTML = '';
    
    for (let i = 0; i < totalPhotos; i++) {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => {
            goToPhoto(i);
            resetPhotosAutoSlide();
        });
        dotsContainer.appendChild(dot);
    }
}

function goToPhoto(index) {
    if (index < 0) index = totalPhotos - 1;
    if (index >= totalPhotos) index = 0;
    
    photoItems.forEach(item => item.classList.remove('active'));
    document.querySelectorAll('#photoDots .dot').forEach(dot => 
        dot.classList.remove('active')
    );
    
    currentPhoto = index;
    photoItems[currentPhoto].classList.add('active');
    document.querySelectorAll('#photoDots .dot')[currentPhoto].classList.add('active');
}

// Carrusel automático de fotos
function startPhotosAutoSlide() {
    photosAutoInterval = setInterval(() => {
        goToPhoto(currentPhoto + 1);
    }, 5000); // Cambia cada 5 segundos
}

function resetPhotosAutoSlide() {
    clearInterval(photosAutoInterval);
    startPhotosAutoSlide();
}

// Botones de navegación
document.querySelector('.prev-photo').addEventListener('click', () => {
    goToPhoto(currentPhoto - 1);
    resetPhotosAutoSlide();
});

document.querySelector('.next-photo').addEventListener('click', () => {
    goToPhoto(currentPhoto + 1);
    resetPhotosAutoSlide();
});

// Swipe para fotos
let photoTouchStartX = 0;
let photoTouchEndX = 0;

const photoGallery = document.getElementById('photoGallery');

photoGallery.addEventListener('touchstart', (e) => {
    photoTouchStartX = e.changedTouches[0].screenX;
}, { passive: true });

photoGallery.addEventListener('touchend', (e) => {
    photoTouchEndX = e.changedTouches[0].screenX;
    handlePhotoSwipe();
}, { passive: true });

function handlePhotoSwipe() {
    const swipeThreshold = 50;
    const diff = photoTouchStartX - photoTouchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            goToPhoto(currentPhoto + 1);
        } else {
            goToPhoto(currentPhoto - 1);
        }
        resetPhotosAutoSlide();
    }
}

createPhotoDots();

// ============================================
// FUEGOS ARTIFICIALES
// ============================================

function initFireworks() {
    const canvas = document.getElementById('fireworks');
    const ctx = canvas.getContext('2d');
    
    console.log('Iniciando fuegos artificiales...');
    
    let fireworksIntensity = 0.15;
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    const fireworks = [];
    const particles = [];
    
    class Firework {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = canvas.height;
            this.targetY = Math.random() * (canvas.height * 0.5);
            this.speed = Math.random() * 4 + 4;
            this.acceleration = 1.03;
            this.colors = [
                '#ff6b9d', '#c06c84', '#667eea', '#764ba2',
                '#f093fb', '#4facfe', '#00f2fe', '#43e97b',
                '#fa709a', '#fee140', '#30cfd0', '#a8edea',
                '#ffd700', '#ff1493', '#00ffff', '#ff69b4'
            ];
            this.color = this.colors[Math.floor(Math.random() * this.colors.length)];
            this.trail = [];
        }
        
        update() {
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > 15) this.trail.shift();
            
            this.speed *= this.acceleration;
            this.y -= this.speed;
            
            return this.y <= this.targetY;
        }
        
        draw() {
            ctx.globalAlpha = 0.5;
            this.trail.forEach((pos, index) => {
                const alpha = index / this.trail.length;
                ctx.globalAlpha = alpha * 0.5;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
            });
            
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
    
    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.color = color;
            
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 8 + 3;
            
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            
            this.alpha = 1;
            this.decay = Math.random() * 0.015 + 0.008;
            this.size = Math.random() * 4 + 2;
            this.gravity = 0.12;
        }
        
        update() {
            this.vx *= 0.98;
            this.vy *= 0.98;
            this.vy += this.gravity;
            
            this.x += this.vx;
            this.y += this.vy;
            
            this.alpha -= this.decay;
        }
        
        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = this.color;
            ctx.fill();
            ctx.restore();
            ctx.shadowBlur = 0;
        }
    }
    
    function createExplosion(x, y, color) {
        const particleCount = 120;
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle(x, y, color));
        }
    }
    
    function animate() {
        fireworksAnimation = requestAnimationFrame(animate);
        
        ctx.fillStyle = 'rgba(15, 12, 41, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (Math.random() < fireworksIntensity) {
            fireworks.push(new Firework());
        }
        
        for (let i = fireworks.length - 1; i >= 0; i--) {
            fireworks[i].draw();
            
            if (fireworks[i].update()) {
                createExplosion(fireworks[i].x, fireworks[i].y, fireworks[i].color);
                fireworks.splice(i, 1);
            }
        }
        
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].draw();
            
            if (particles[i].alpha <= 0) {
                particles.splice(i, 1);
            }
        }
    }
    
    setTimeout(() => {
        console.log('Reduciendo intensidad de fuegos artificiales');
        fireworksIntensity = 0.04;
        canvas.style.opacity = '0.7';
    }, 9000);
    
    animate();
    console.log('Fuegos artificiales animándose...');
}

// ============================================
// MANTENER MÚSICA ACTIVA
// ============================================

document.addEventListener('visibilitychange', function() {
    if (!document.hidden && isPlaying) {
        const currentAudio = audios[currentSection];
        if (currentAudio && currentAudio.paused) {
            console.log('Página visible de nuevo, reanudando audio');
            currentAudio.play().catch(e => console.log('Error al reanudar música:', e));
        }
    }
});

// ============================================
// CONTROL MANUAL DE AUDIO (para debug)
// ============================================

// Agregar listeners a todas las interacciones del usuario para asegurar reproducción
document.addEventListener('click', function ensureAudioContext() {
    if (!isPlaying) return;
    
    const currentAudio = audios[currentSection];
    if (currentAudio && currentAudio.paused) {
        console.log('Intentando reproducir audio después de interacción del usuario');
        currentAudio.play().catch(e => console.log('Error:', e));
    }
}, { once: false });

// ============================================
// OPTIMIZACIONES MÓVIL
// ============================================

let lastTap = 0;
document.addEventListener('touchend', function(e) {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    
    if (tapLength < 500 && tapLength > 0) {
        e.preventDefault();
    }
    
    lastTap = currentTime;
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

console.log('Script cargado correctamente');