// Mobile navigation
const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');

if (navToggle && siteNav) {
    navToggle.addEventListener('click', () => {
        const isOpen = siteNav.classList.toggle('is-open');
        navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    siteNav.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            siteNav.classList.remove('is-open');
            navToggle.setAttribute('aria-expanded', 'false');
        });
    });
}

// Language gate / initial language selection
(() => {
    const languageGate = document.getElementById('languageGate');
    const languageGateButtons = document.querySelectorAll('[data-lang-select]');
    const languageButtons = document.querySelectorAll('[data-lang]');

    const languageKey = 'siteLanguage';
    const gateKey = 'languageGateAccepted';

    function saveLanguage(lang) {
        localStorage.setItem(languageKey, lang);
    }

    function markGateAccepted() {
        localStorage.setItem(gateKey, 'true');
    }

    function updateActiveLanguageButton(lang) {
        languageButtons.forEach((button) => {
            const isActive = button.dataset.lang === lang;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });

        languageGateButtons.forEach((button) => {
            button.classList.toggle('is-active', button.dataset.langSelect === lang);
        });
    }

    function applyLanguageFromMain(lang) {
        const selectedLanguage = lang || 'pl';

        if (typeof window.setLanguage === 'function') {
            window.setLanguage(selectedLanguage);
        } else if (typeof setLanguage === 'function') {
            setLanguage(selectedLanguage);
        }

        updateActiveLanguageButton(selectedLanguage);
    }

    function openLanguageGate() {
        if (!languageGate) {
            return;
        }

        languageGate.classList.add('is-visible');
        document.body.classList.add('language-gate-open');
    }

    function closeLanguageGate() {
        if (!languageGate) {
            return;
        }

        languageGate.classList.remove('is-visible');
        document.body.classList.remove('language-gate-open');
    }

    const savedLanguage = localStorage.getItem(languageKey) || 'pl';
    const gateAccepted = localStorage.getItem(gateKey) === 'true';

    applyLanguageFromMain(savedLanguage);

    if (!gateAccepted) {
        openLanguageGate();
    }

    languageGateButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const selectedLanguage = button.dataset.langSelect;

            saveLanguage(selectedLanguage);
            markGateAccepted();
            applyLanguageFromMain(selectedLanguage);
            closeLanguageGate();
        });
    });

    languageButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const selectedLanguage = button.dataset.lang;

            saveLanguage(selectedLanguage);
            markGateAccepted();
            applyLanguageFromMain(selectedLanguage);
            closeLanguageGate();
        });
    });
})();

// Single image lightbox with zoom, pan, mouse wheel and pinch support
(() => {
    const images = document.querySelectorAll('main img:not(.language-button img):not(.language-gate img)');

    if (!images.length) {
        return;
    }

    const oldLightboxes = document.querySelectorAll('.image-lightbox');
    oldLightboxes.forEach((item) => item.remove());

    const lightbox = document.createElement('div');
    lightbox.className = 'image-lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Powiększony podgląd zdjęcia');

    lightbox.innerHTML = `
        <button class="image-lightbox__close" type="button" aria-label="Zamknij podgląd">&times;</button>

        <div class="image-lightbox__hint">
            Użyj + / −, rolki myszy, podwójnego kliknięcia albo gestu przybliżenia na telefonie
        </div>

        <div class="image-lightbox__viewport">
            <img class="image-lightbox__image" src="" alt="">
        </div>

        <div class="image-lightbox__controls" aria-label="Sterowanie powiększeniem">
            <button class="image-lightbox__zoom-out" type="button" aria-label="Pomniejsz">−</button>
            <button class="image-lightbox__reset" type="button" aria-label="Resetuj powiększenie">100%</button>
            <button class="image-lightbox__zoom-in" type="button" aria-label="Powiększ">+</button>
        </div>
    `;

    document.body.appendChild(lightbox);

    const viewport = lightbox.querySelector('.image-lightbox__viewport');
    const lightboxImage = lightbox.querySelector('.image-lightbox__image');
    const closeButton = lightbox.querySelector('.image-lightbox__close');
    const zoomInButton = lightbox.querySelector('.image-lightbox__zoom-in');
    const zoomOutButton = lightbox.querySelector('.image-lightbox__zoom-out');
    const resetButton = lightbox.querySelector('.image-lightbox__reset');

    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let initialTranslateX = 0;
    let initialTranslateY = 0;

    let activePointers = new Map();
    let initialPinchDistance = 0;
    let initialPinchScale = 1;

    const minScale = 1;
    const maxScale = 5;
    const zoomStep = 0.35;

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function updateImageTransform() {
        if (scale === 1) {
            translateX = 0;
            translateY = 0;
        }

        lightboxImage.style.transform =
            `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) scale(${scale})`;

        resetButton.textContent = `${Math.round(scale * 100)}%`;
    }

    function setScale(newScale) {
        scale = clamp(newScale, minScale, maxScale);
        updateImageTransform();
    }

    function resetZoom() {
        scale = 1;
        translateX = 0;
        translateY = 0;
        updateImageTransform();
    }

    function openLightbox(image) {
        lightboxImage.src = image.currentSrc || image.src;
        lightboxImage.alt = image.alt || 'Powiększone zdjęcie';

        resetZoom();

        lightbox.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('is-open');

        lightboxImage.removeAttribute('src');
        lightboxImage.alt = '';

        document.body.style.overflow = '';

        activePointers.clear();
        isDragging = false;
        viewport.classList.remove('is-dragging');

        resetZoom();
    }

    function getPointerDistance(pointerA, pointerB) {
        const dx = pointerA.clientX - pointerB.clientX;
        const dy = pointerA.clientY - pointerB.clientY;

        return Math.sqrt(dx * dx + dy * dy);
    }

    images.forEach((image) => {
        image.style.cursor = 'zoom-in';

        image.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            openLightbox(image);
        });
    });

    zoomInButton.addEventListener('click', (event) => {
        event.stopPropagation();
        setScale(scale + zoomStep);
    });

    zoomOutButton.addEventListener('click', (event) => {
        event.stopPropagation();
        setScale(scale - zoomStep);
    });

    resetButton.addEventListener('click', (event) => {
        event.stopPropagation();
        resetZoom();
    });

    closeButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        closeLightbox();
    });

    lightbox.addEventListener('click', (event) => {
        if (event.target === lightbox) {
            closeLightbox();
        }
    });

    viewport.addEventListener('dblclick', (event) => {
        event.preventDefault();

        if (scale === 1) {
            setScale(2.4);
        } else {
            resetZoom();
        }
    });

    viewport.addEventListener('wheel', (event) => {
        event.preventDefault();

        const direction = event.deltaY < 0 ? 1 : -1;
        setScale(scale + direction * 0.2);
    }, { passive: false });

    viewport.addEventListener('pointerdown', (event) => {
        if (!lightbox.classList.contains('is-open')) {
            return;
        }

        viewport.setPointerCapture(event.pointerId);
        activePointers.set(event.pointerId, event);

        if (activePointers.size === 1) {
            isDragging = true;
            dragStartX = event.clientX;
            dragStartY = event.clientY;
            initialTranslateX = translateX;
            initialTranslateY = translateY;
            viewport.classList.add('is-dragging');
        }

        if (activePointers.size === 2) {
            const pointers = Array.from(activePointers.values());
            initialPinchDistance = getPointerDistance(pointers[0], pointers[1]);
            initialPinchScale = scale;
            isDragging = false;
            viewport.classList.remove('is-dragging');
        }
    });

    viewport.addEventListener('pointermove', (event) => {
        if (!activePointers.has(event.pointerId)) {
            return;
        }

        activePointers.set(event.pointerId, event);

        if (activePointers.size === 2) {
            const pointers = Array.from(activePointers.values());
            const currentDistance = getPointerDistance(pointers[0], pointers[1]);

            if (initialPinchDistance > 0) {
                const pinchRatio = currentDistance / initialPinchDistance;
                setScale(initialPinchScale * pinchRatio);
            }

            return;
        }

        if (isDragging && scale > 1) {
            translateX = initialTranslateX + (event.clientX - dragStartX);
            translateY = initialTranslateY + (event.clientY - dragStartY);
            updateImageTransform();
        }
    });

    function endPointer(event) {
        activePointers.delete(event.pointerId);

        if (activePointers.size === 0) {
            isDragging = false;
            viewport.classList.remove('is-dragging');
        }

        if (activePointers.size < 2) {
            initialPinchDistance = 0;
        }
    }

    viewport.addEventListener('pointerup', endPointer);
    viewport.addEventListener('pointercancel', endPointer);
    viewport.addEventListener('pointerleave', endPointer);

    document.addEventListener('keydown', (event) => {
        if (!lightbox.classList.contains('is-open')) {
            return;
        }

        if (event.key === 'Escape') {
            closeLightbox();
        }

        if (event.key === '+' || event.key === '=') {
            setScale(scale + zoomStep);
        }

        if (event.key === '-') {
            setScale(scale - zoomStep);
        }

        if (event.key === '0') {
            resetZoom();
        }
    });
})();