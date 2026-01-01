// ============================================
// VARIABLES GLOBALES
// ============================================

let currentSection = 0;
let isPlaying = false;
let fireworksAnimation;
let audioUnlocked = false;

// Referencias a los audios
const audios = [
    document.getElementById('music1'),
    document.getElementById('music2'),
    document.getElementById('music3')
];

// Configurar audios
audios.forEach((audio, index) => {
    if (audio) {
        audio.preload = 'auto';
        audio.volume = 0.5;
        audio.load();
        
        // Listeners para debug
        audio.addEventListener('play', () => console.log(`Audio ${index + 1} started playing`));
        audio.addEventListener('pause', () => console.log(`Audio ${index + 1} paused`));
        audio.addEventListener('error', (e) => console.error(`Audio ${index + 1} error:`, e));
    }
});

// ============================================
// DESBLOQUEAR AUDIO (ESENCIAL PARA MESSENGER)
// ============================================

function unlockAudio() {
    if (audioUnlocked) return;
    
    console.log('Desbloqueando audio...');
    
    // Intentar reproducir y pausar inmediatamente cada audio
    const promises = audios.map((audio, index) => {
        if (audio) {
            return audio.play()
                .then(() => {
                    audio.pause();
                    audio.currentTime = 0;
                    console.log(`Audio ${index + 1} desbloqueado`);
                    return true;
                })
                .catch(e => {
                    console.log(`Audio ${index + 1} necesita más interacción`, e);
                    return false;
                });
        }
        return Promise.resolve(false);
    });
    
    Promise.all(promises).then(() => {
        audioUnlocked = true;
        console.log('Todos los audios desbloqueados');
    });
}

// ============================================
// GESTIÓN DE MÚSICA POR SECCIÓN
// ============================================

function playMusicForSection(sectionIndex) {
    console.log(`Intentando cambiar a sección ${sectionIndex}`);
    
    // Detener todas las canciones
    audios.forEach((audio, index) => {
        if (audio && index !== sectionIndex) {
            console.log(`Deteniendo audio ${index + 1}`);
            audio.pause();
            audio.currentTime = 0;
        }
    });
    
    // Reproducir la canción de la sección actual
    const currentAudio = audios[sectionIndex];
    if (currentAudio) {
        console.log(`Reproduciendo audio ${sectionIndex + 1}`);
        const playPromise = currentAudio.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log(`Audio ${sectionIndex + 1} reproduciéndose exitosamente`);
                    isPlaying = true;
                })
                .catch(e => {
                    console.error(`Audio ${sectionIndex + 1} bloqueado:`, e);
                    // Agregar listener para siguiente interacción
                    const tryAgain = () => {
                        console.log(`Reintentando audio ${sectionIndex + 1}`);
                        currentAudio.play()
                            .then(() => {
                                console.log(`Audio ${sectionIndex + 1} desbloqueado tras interacción`);
                                document.removeEventListener('touchstart', tryAgain);
                                document.removeEventListener('click', tryAgain);
                            })
                            .catch(err => console.error('Reintento fallido:', err));
                    };
                    
                    document.addEventListener('touchstart', tryAgain, { once: true });
                    document.addEventListener('click', tryAgain, { once: true });
                });
        }
    } else {
        console.error(`Audio ${sectionIndex + 1} no existe`);
    }
}

// ============================================
// DETECCIÓN MEJORADA DE SECCIONES
// ============================================

function setupSectionObserver() {
    const observerOptions = {
        threshold: [0.3, 0.5, 0.7],
        rootMargin: '0px'
    };
    
    let lastSection = -1;
    
    const observer = new IntersectionObserver((entries) => {
        // Encontrar la sección más visible
        let mostVisible = null;
        let maxRatio = 0;
        
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
                maxRatio = entry.intersectionRatio;
                mostVisible = entry;
            }
        });
        
        if (mostVisible && maxRatio > 0.3) {
            const sectionIndex = parseInt(mostVisible.target.dataset.section);
            console.log(`Sección detectada: ${sectionIndex}, ratio: ${maxRatio}`);
            
            if (sectionIndex !== lastSection && !isNaN(sectionIndex)) {
                currentSection = sectionIndex;
                lastSection = sectionIndex;
                playMusicForSection(sectionIndex);
            }
        }
    }, observerOptions);
    
    const sections = document.querySelectorAll('.section[data-section]');
    console.log(`Observando ${sections.length} secciones`);
    sections.forEach(section => {
        console.log(`Sección encontrada: ${section.dataset.section}`);
        observer.observe(section);
    });
}

// Detector adicional manual por scroll
function detectCurrentSection() {
    const sections = document.querySelectorAll('.section[data-section]');
    const windowHeight = window.innerHeight;
    const scrollTop = window.scrollY || window.pageYOffset;
    
    let detectedSection = -1;
    let maxVisibleArea = 0;
    
    sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        const sectionIndex = parseInt(section.dataset.section);
        
        // Calcular área visible de la sección
        const visibleTop = Math.max(0, rect.top);
        const visibleBottom = Math.min(windowHeight, rect.bottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        
        if (visibleHeight > maxVisibleArea) {
            maxVisibleArea = visibleHeight;
            detectedSection = sectionIndex;
        }
    });
    
    if (detectedSection !== -1 && detectedSection !== currentSection) {
        console.log(`Scroll detectó sección ${detectedSection}`);
        currentSection = detectedSection;
        playMusicForSection(detectedSection);
    }
}

// ============================================
// PANTALLA DE INICIO
// ============================================

document.getElementById('startBtn').addEventListener('click', function() {
    console.log('Botón de inicio presionado');
    
    // Desbloquear audio primero
    unlockAudio();
    
    const startScreen = document.getElementById('startScreen');
    const mainContent = document.getElementById('mainContent');
    const impactScreen = document.getElementById('newYearImpact');
    
    // Ocultar pantalla de inicio
    startScreen.style.opacity = '0';
    
    setTimeout(() => {
        startScreen.style.display = 'none';
        mainContent.classList.remove('hidden');
        
        // Iniciar fuegos artificiales optimizados
        initFireworks();
        
        // Ocultar secciones durante intro
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.style.display = 'none';
        });
        
        setTimeout(() => {
            impactScreen.style.opacity = '0';
            
            setTimeout(() => {
                impactScreen.style.display = 'none';
                
                // Mostrar secciones
                sections.forEach(section => {
                    section.style.display = 'flex';
                    section.style.opacity = '1';
                });
                
                // Scroll a primera sección
                const firstSection = document.querySelector('.memories-section');
                if (firstSection) {
                    firstSection.scrollIntoView({ behavior: 'smooth' });
                }
                
                // Iniciar música y observadores
                console.log('Iniciando sistema de música');
                playMusicForSection(0);
                setupSectionObserver();
                
                // Agregar listener de scroll como respaldo
                let scrollTimeout;
                window.addEventListener('scroll', () => {
                    clearTimeout(scrollTimeout);
                    scrollTimeout = setTimeout(() => {
                        detectCurrentSection();
                    }, 150);
                }, { passive: true });
                
                // Iniciar carruseles
                startMemoriesAutoSlide();
                startPhotosAutoSlide();
            }, 1500);
            
        }, 6000);
        
    }, 800);
});

// ============================================
// CARRUSEL DE RECUERDOS
// ============================================

let currentMemory = 0;
const memoryItems = document.querySelectorAll('.memory-item');
const totalMemories = memoryItems.length;
let memoriesAutoInterval;

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

function startMemoriesAutoSlide() {
    memoriesAutoInterval = setInterval(() => {
        goToMemory(currentMemory + 1);
    }, 5000);
}

function resetMemoriesAutoSlide() {
    clearInterval(memoriesAutoInterval);
    startMemoriesAutoSlide();
}

document.querySelector('.prev-memory').addEventListener('click', () => {
    goToMemory(currentMemory - 1);
    resetMemoriesAutoSlide();
});

document.querySelector('.next-memory').addEventListener('click', () => {
    goToMemory(currentMemory + 1);
    resetMemoriesAutoSlide();
});

// Swipe optimizado
let memoryTouchStartX = 0;
const memoriesGallery = document.getElementById('memoriesGallery');

memoriesGallery.addEventListener('touchstart', (e) => {
    memoryTouchStartX = e.changedTouches[0].screenX;
}, { passive: true });

memoriesGallery.addEventListener('touchend', (e) => {
    const memoryTouchEndX = e.changedTouches[0].screenX;
    const diff = memoryTouchStartX - memoryTouchEndX;
    
    if (Math.abs(diff) > 50) {
        goToMemory(currentMemory + (diff > 0 ? 1 : -1));
        resetMemoriesAutoSlide();
    }
}, { passive: true });

createMemoryDots();

// ============================================
// GALERÍA DE FOTOS
// ============================================

let currentPhoto = 0;
const photoItems = document.querySelectorAll('.photo-item');
const totalPhotos = photoItems.length;
let photosAutoInterval;

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

function startPhotosAutoSlide() {
    photosAutoInterval = setInterval(() => {
        goToPhoto(currentPhoto + 1);
    }, 6000);
}

function resetPhotosAutoSlide() {
    clearInterval(photosAutoInterval);
    startPhotosAutoSlide();
}

document.querySelector('.prev-photo').addEventListener('click', () => {
    goToPhoto(currentPhoto - 1);
    resetPhotosAutoSlide();
});

document.querySelector('.next-photo').addEventListener('click', () => {
    goToPhoto(currentPhoto + 1);
    resetPhotosAutoSlide();
});

// Swipe optimizado
let photoTouchStartX = 0;
const photoGallery = document.getElementById('photoGallery');

photoGallery.addEventListener('touchstart', (e) => {
    photoTouchStartX = e.changedTouches[0].screenX;
}, { passive: true });

photoGallery.addEventListener('touchend', (e) => {
    const photoTouchEndX = e.changedTouches[0].screenX;
    const diff = photoTouchStartX - photoTouchEndX;
    
    if (Math.abs(diff) > 50) {
        goToPhoto(currentPhoto + (diff > 0 ? 1 : -1));
        resetPhotosAutoSlide();
    }
}, { passive: true });

createPhotoDots();

// ============================================
// FUEGOS ARTIFICIALES OPTIMIZADOS
// ============================================

function initFireworks() {
    const canvas = document.getElementById('fireworks');
    const ctx = canvas.getContext('2d', { alpha: true });
    
    let fireworksIntensity = 0.08;
    let w, h;
    
    function resizeCanvas() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    const fireworks = [];
    const particles = [];
    const colors = ['#ff6b9d', '#667eea', '#f093fb', '#4facfe', '#43e97b', '#ffd700'];
    
    class Firework {
        constructor() {
            this.x = Math.random() * w;
            this.y = h;
            this.targetY = Math.random() * (h * 0.4);
            this.speed = 6;
            this.color = colors[Math.floor(Math.random() * colors.length)];
        }
        
        update() {
            this.y -= this.speed;
            return this.y <= this.targetY;
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }
    
    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.color = color;
            
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.alpha = 1;
            this.decay = 0.015;
            this.gravity = 0.15;
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
            ctx.globalAlpha = this.alpha;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }
    
    function createExplosion(x, y, color) {
        const count = 60;
        for (let i = 0; i < count; i++) {
            particles.push(new Particle(x, y, color));
        }
    }
    
    let lastTime = 0;
    const fps = 30;
    const fpsInterval = 1000 / fps;
    
    function animate(currentTime) {
        fireworksAnimation = requestAnimationFrame(animate);
        
        const elapsed = currentTime - lastTime;
        if (elapsed < fpsInterval) return;
        lastTime = currentTime - (elapsed % fpsInterval);
        
        ctx.fillStyle = 'rgba(15, 12, 41, 0.15)';
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
        
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
        fireworksIntensity = 0.02;
        canvas.style.opacity = '0.5';
    }, 7000);
    
    animate(0);
}

// ============================================
// MANTENER AUDIO ACTIVO
// ============================================

document.addEventListener('visibilitychange', function() {
    if (!document.hidden && isPlaying) {
        const currentAudio = audios[currentSection];
        if (currentAudio && currentAudio.paused) {
            console.log('Reactivando audio tras visibilitychange');
            currentAudio.play().catch(e => console.error('Error reactivando:', e));
        }
    }
});

// Prevenir doble tap zoom
let lastTouchEnd = 0;
document.addEventListener('touchend', function(e) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, { passive: false });

console.log('Script optimizado cargado v2');
