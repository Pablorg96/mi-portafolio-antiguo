const casos = [
    {
        title: "MYHIXEL Ring — Lanzamiento de Producto",
        desc: "Producción integral del vídeo de presentación del MYHIXEL Ring para Kickstarter. La campaña recaudó 327.109 € gracias a 2.898 patrocinadores. Concepto creativo, guión, locución, grabación, edición, color grading, diseño de sonido y postproducción completa.",
        video: "aZXZlhCO45U"
    },
    {
        title: "MYHIXEL Trainer — Campaña Kickstarter Estrella",
        desc: "Vídeo de lanzamiento del MYHIXEL Trainer para Kickstarter. La campaña más exitosa de MYHIXEL: 706.153 € recaudados con 3.276 patrocinadores. Producción integral desde concepto hasta postproducción, optimizada con contenido generado con IA.",
        video: "IbVQD4Ked40"
    },
    {
        title: "Línea de Cuidado Íntimo Masculino — Atresmedia",
        desc: "Vídeo de lanzamiento para la línea de cuidado íntimo masculino de MYHIXEL, producido para campaña en Atresmedia. Producción integral: concepto, guión, locución, grabación profesional, edición, color grading y postproducción con IA.",
        video: "D2Ire_zq_k4"
    },
    {
        type: "image",
        title: "MYHIXEL HUB — Diseño de Aplicación Móvil",
        desc: "Diseño de la app que centraliza los programas de salud sexual masculina de MYHIXEL (Control y ED). Experiencia guiada B2C: fases de entrenamiento, contenido educativo, ejercicios y seguimiento de progreso, integrada con los dispositivos MYHIXEL. UX/UI orientado a consumidor final, pensado para facilitar la adherencia.",
        image: "images/completa_hub.jpg"
    },
    {
        type: "image",
        title: "HORIXON — Diseño de Aplicación Móvil",
        desc: "Diseño de la plataforma digital del ecosistema médico Horixon MedTech. Connected Care Platform B2B2C que conecta el trabajo del paciente en casa con el seguimiento clínico profesional: programas prescritos, ejercicios guiados, informes de evolución y contenido educativo en eyaculación precoz, disfunción eréctil y suelo pélvico. Integrable con Control, Trainer, Ring, VED/Pump y Pelvic.",
        image: "images/completa_horixon.jpg"
    }
];

function abrirModal(index) {
    const caso = casos[index];
    const modal = document.getElementById("modal");
    const modalVideo = document.getElementById("modalVideo");
    const modalImage = document.getElementById("modalImage");
    const modalTitle = document.getElementById("modalTitle");
    const modalDesc = document.getElementById("modalDesc");

    if (caso.type === "image") {
        modalVideo.style.display = "none";
        modalVideo.src = "";
        modalImage.style.display = "block";
        modalImage.src = caso.image;
    } else {
        modalImage.style.display = "none";
        modalImage.src = "";
        modalVideo.style.display = "block";
        modalVideo.src = `https://www.youtube-nocookie.com/embed/${caso.video}?autoplay=1`;
    }

    modalTitle.textContent = caso.title;
    modalDesc.textContent = caso.desc;

    modal.classList.add("active");
    document.body.style.overflow = "hidden";
}

function cerrarModal() {
    const modal = document.getElementById("modal");
    modal.classList.remove("active");
    document.getElementById("modalVideo").src = "";
    document.getElementById("modalImage").src = "";
    document.body.style.overflow = "auto";
}

window.onclick = function(event) {
    const modal = document.getElementById("modal");
    if (event.target == modal) {
        cerrarModal();
    }
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({behavior: 'smooth', block: 'start'});
        }
    });
});



// Necesario para que GSAP reconozca la propiedad "scrollTrigger" en los tweens
gsap.registerPlugin(ScrollTrigger);

// Efecto hero: fondo blanco -> negro y vídeo encogiéndose ligeramente,
// todo sincronizado en el mismo tramo de scroll (termina al 40% del scroll del hero)
// Este efecto (encoger el vídeo + fondo a negro mientras se hace scroll)
// solo se activa en escritorio. En mobile daba problemas de tamaño/recorte,
// así que ahí el vídeo se queda estático, sin animación.
let heroVideoMM = gsap.matchMedia();

heroVideoMM.add("(min-width: 769px)", () => {
    const heroVideoTl = gsap.timeline({
        scrollTrigger: {
            trigger: ".video-sticky-container",
            start: "top top",
            end: "+=40%",
            scrub: 0.6,
        }
    });

    heroVideoTl
        .to(".video-sticky-container", {
            backgroundColor: "#000000",
            ease: "power2.out"
        }, 0)
        .to(".video-wrapper video", {
            scale: 0.9,
            borderRadius: "24px",
            ease: "power2.out"
        }, 0)
        .to(".video-wrapper", {
            paddingLeft: "130px",
            paddingRight: "130px",
            ease: "power2.out"
        }, 0);
});

// Reveal con blur al hacer scroll (mismo efecto que el titular del Hero),
// aplicado a: texto de Overview + link, y título/link/tarjetas de Casos de Estudio.
document.querySelectorAll('.reveal-blur').forEach((el, i) => {
    const esTarjeta = el.classList.contains('caso-card');
    const tieneSubrayado = el.querySelector('.highlight-text') !== null;

    gsap.to(el, {
        opacity: 1,
        filter: "blur(0px)",
        y: 0,
        duration: 1.1,
        ease: "power2.out",
        delay: esTarjeta ? (i % 6) * 0.12 : 0,
        scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none reverse",
            onEnter: () => {
                if (tieneSubrayado) {
                    el._subrayadoTimeout = setTimeout(() => {
                        el.querySelectorAll('.highlight-text').forEach(hl => hl.classList.add("animated"));
                    }, 1100);
                }
            },
            onLeaveBack: () => {
                if (tieneSubrayado) {
                    clearTimeout(el._subrayadoTimeout);
                    el.querySelectorAll('.highlight-text').forEach(hl => hl.classList.remove("animated"));
                }
            }
        }
    });
});


// Servicios Interactive - Mouse Follower
gsap.registerPlugin(ScrollTrigger);

let mouseX = 0;
let mouseY = 0;
let activeImage = null;
const esDesktop = window.matchMedia('(min-width: 769px)').matches;

// Track mouse position globalmente
document.addEventListener('mousemove', (e) => {
    if (!esDesktop) return;
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    if (activeImage) {
        // Easing suave con GSAP
        gsap.to(activeImage, {
            left: mouseX - 140,
            top: mouseY - 200,
            duration: 0.3,
            ease: "power2.out"
        });
    }
});

// Hover en cada fila de servicio
document.querySelectorAll('.servicio-row').forEach((row) => {
    const imageEl = row.querySelector('.servicio-image');
    const imageSrc = row.getAttribute('data-image');
    
    if (imageSrc) {
        imageEl.style.backgroundImage = `url('${imageSrc}')`;
    }
    
    row.addEventListener('mouseenter', () => {
        if (!esDesktop) return;
        activeImage = imageEl;
        gsap.to(imageEl, {
            opacity: 1,
            duration: 0.3,
            ease: "power2.out"
        });
    });
    
    row.addEventListener('mouseleave', () => {
        if (!esDesktop) return;
        activeImage = null;
        gsap.to(imageEl, {
            opacity: 0,
            duration: 0.3,
            ease: "power2.out"
        });
    });
});

// Expandir descripción al hover
document.querySelectorAll('.servicio-row').forEach((row) => {
    row.addEventListener('mouseenter', () => {
        gsap.to(row, {
            minHeight: "auto",
            duration: 0.4,
            ease: "power2.out"
        });
    });
});


// Pill Navigation: indicador rojo deslizante + scrollspy + clic con feedback inmediato
(function () {
    const indicator = document.querySelector('.pill-indicator');
    const navLinks = document.querySelectorAll('.nav-links a');
    if (!indicator || !navLinks.length) return;

    function moveIndicatorTo(link) {
        const li = link.parentElement;
        indicator.style.width = li.offsetWidth + 'px';
        indicator.style.transform = `translateX(${li.offsetLeft}px)`;
    }

    function setActive(link) {
        navLinks.forEach(a => a.classList.remove('active'));
        link.classList.add('active');
        moveIndicatorTo(link);
    }

    // Posición inicial sin animación (para que no "vuele" desde 0 al cargar la página)
    const initialLink = document.querySelector('.nav-links a.active') || navLinks[0];
    indicator.style.transition = 'none';
    moveIndicatorTo(initialLink);
    requestAnimationFrame(() => {
        indicator.style.transition = '';
    });

    // Recalcular posición si cambia el tamaño de la ventana
    window.addEventListener('resize', () => {
        const current = document.querySelector('.nav-links a.active') || navLinks[0];
        moveIndicatorTo(current);
    });

    // Clic: feedback inmediato (el scroll suave ya lo gestiona el listener general de anchors)
    navLinks.forEach(link => {
        link.addEventListener('click', () => setActive(link));
    });

    // ScrollSpy: detecta qué sección está en pantalla y mueve la píldora
    const sections = Array.from(navLinks)
        .map(link => document.getElementById(link.getAttribute('data-section')))
        .filter(Boolean);

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                const link = document.querySelector(`.nav-links a[data-section="${id}"]`);
                if (link) setActive(link);
            }
        });
    }, {
        rootMargin: '-45% 0px -45% 0px',
        threshold: 0
    });

    sections.forEach(section => observer.observe(section));
})();


// About - Efecto Tilt 3D en la foto (sigue el ratón)
(function () {
    const tiltEl = document.querySelector('.about-photo-tilt');
    const card = document.querySelector('.about-photo-card');
    if (!tiltEl || !card) return;

    const maxTilt = 12; // grados máximos de inclinación

    const setRotateX = gsap.quickTo(card, "rotateX", { duration: 0.5, ease: "power3.out" });
    const setRotateY = gsap.quickTo(card, "rotateY", { duration: 0.5, ease: "power3.out" });
    const setScale = gsap.quickTo(card, "scale", { duration: 0.5, ease: "power3.out" });

    tiltEl.addEventListener('mousemove', (e) => {
        const rect = tiltEl.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const percentX = (x / rect.width) - 0.5;
        const percentY = (y / rect.height) - 0.5;

        setRotateY(percentX * maxTilt * 2);
        setRotateX(percentY * -maxTilt * 2);
        setScale(1.03);
    });

    tiltEl.addEventListener('mouseleave', () => {
        setRotateX(0);
        setRotateY(0);
        setScale(1);
    });
})();


// Scroll Reveal 3D - IntersectionObserver (tarjeta de la foto en About)
document.addEventListener('DOMContentLoaded', () => {
    const tarjeta = document.querySelector('.about-photo-tilt');
    if (!tarjeta) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.2
    });

    observer.observe(tarjeta);
});


// Servicios en móvil: carrusel horizontal. La tarjeta que queda más centrada
// se activa (foto de fondo + texto blanco); al tocar una tarjeta se centra.
(function () {
    const lista = document.querySelector('.servicios-list');
    const filas = document.querySelectorAll('.servicio-row');
    if (!lista || !filas.length) return;

    const movil = window.matchMedia('(max-width: 768px)');
    let activa = null;
    let ticking = false;

    // Indicadores (puntos) bajo el carrusel; solo se ven en móvil (ver CSS)
    const puntos = document.createElement('div');
    puntos.className = 'servicios-dots';
    puntos.setAttribute('aria-hidden', 'true');
    filas.forEach((f, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.tabIndex = -1;
        b.addEventListener('click', () => f.click());
        puntos.appendChild(b);
    });
    lista.insertAdjacentElement('afterend', puntos);

    function activar(fila) {
        if (fila === activa) return;
        if (activa) activa.classList.remove('is-active');
        if (fila) fila.classList.add('is-active');
        activa = fila;
        const idx = fila ? Array.prototype.indexOf.call(filas, fila) : -1;
        Array.prototype.forEach.call(puntos.children, (b, i) => b.classList.toggle('is-on', i === idx));
    }

    function actualizar() {
        ticking = false;
        if (!movil.matches) { activar(null); return; }
        const r = lista.getBoundingClientRect();
        const centro = r.left + r.width / 2;
        let mejor = null, dist = Infinity;
        filas.forEach((f) => {
            const fr = f.getBoundingClientRect();
            const d = Math.abs(fr.left + fr.width / 2 - centro);
            if (d < dist) { dist = d; mejor = f; }
        });
        // Al inicio del scroll gana la primera; al final, la última
        if (lista.scrollLeft <= 4) mejor = filas[0];
        else if (lista.scrollLeft + lista.clientWidth >= lista.scrollWidth - 4) mejor = filas[filas.length - 1];
        activar(mejor);
    }

    function pedirActualizar() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(actualizar);
    }

    lista.addEventListener('scroll', pedirActualizar, { passive: true });
    window.addEventListener('resize', pedirActualizar);
    movil.addEventListener('change', pedirActualizar);

    filas.forEach((f) => {
        f.addEventListener('click', () => {
            if (!movil.matches) return;
            const x = f.offsetLeft - (lista.clientWidth - f.offsetWidth) / 2;
            lista.scrollTo({ left: x, behavior: 'smooth' });
        });
    });

    actualizar();
})();

// Footer: animación de scroll reveal para la marca de agua "GRACIAS"
// (se activa y desactiva cada vez que entra/sale del viewport)
(function () {
    const watermark = document.querySelector('.footer-watermark');
    if (!watermark) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                watermark.classList.add('visible');
            } else {
                watermark.classList.remove('visible');
            }
        });
    }, {
        threshold: 0.6
    });

    // Se observa la franja inferior del footer (siempre visible dentro del footer) y no la propia
    // marca de agua: en móvil la marca queda recortada por el overflow del footer mientras
    // está desplazada, así que el observador nunca la veía como "visible".
    observer.observe(document.querySelector('.footer-bottom') || watermark);
})();

// Testimonios: Scroll Reveal en cascada con GSAP (título primero, luego cada tarjeta con 0.15s de diferencia)
gsap.to(".testimonios .reveal-up", {
    opacity: 1,
    y: 0,
    duration: 0.6,
    ease: "power2.out",
    stagger: 0.15,
    scrollTrigger: {
        trigger: ".testimonios",
        start: "top 80%",
        toggleActions: "play none none reverse"
    }
});

// Testimonios: rotación automática con crossfade entre las opiniones
(function () {
    const slides = document.querySelectorAll('.testimonio-slide');
    const dotsContainer = document.querySelector('.testimonio-dots');
    if (!slides.length || !dotsContainer) return;

    let current = 0;
    let autoplay;

    // Crea un punto por cada testimonio
    slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'testimonio-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Ver testimonio ${i + 1}`);
        dot.addEventListener('click', () => {
            goTo(i);
            resetAutoplay();
        });
        dotsContainer.appendChild(dot);
    });

    const dots = document.querySelectorAll('.testimonio-dot');

    function goTo(index) {
        slides[current].classList.remove('active');
        dots[current].classList.remove('active');
        current = index;
        slides[current].classList.add('active');
        dots[current].classList.add('active');
    }

    function next() {
        goTo((current + 1) % slides.length);
    }

    function resetAutoplay() {
        clearInterval(autoplay);
        autoplay = setInterval(next, 5000);
    }

    resetAutoplay();
})();


// Accesibilidad: si el sistema pide "reducir movimiento", el vídeo del hero no se reproduce solo
(function () {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const video = document.getElementById('heroVideo');
    if (!video) return;
    function aplicar() {
        if (reduce.matches) { video.removeAttribute('autoplay'); video.pause(); }
    }
    aplicar();
    reduce.addEventListener('change', aplicar);
})();


// Modo noche / luz: recuerda la elección y, si no hay, sigue la del sistema
(function () {
    const root = document.documentElement;
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const meta = document.querySelector('meta[name="theme-color"]');
    function aplicar(t) {
        root.setAttribute('data-theme', t);
        btn.setAttribute('aria-label', t === 'dark' ? 'Cambiar a modo luz' : 'Cambiar a modo noche');
        if (meta) meta.content = t === 'dark' ? '#0e0e0e' : '#ffffff';
    }
    aplicar(root.getAttribute('data-theme') || 'light');
    btn.addEventListener('click', () => {
        const t = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        aplicar(t);
        try { localStorage.setItem('theme', t); } catch (e) {}
    });
})();
