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

// Single image lightbox for desktop and mobile
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
        <img class="image-lightbox__image" src="" alt="">
    `;

    document.body.appendChild(lightbox);

    const lightboxImage = lightbox.querySelector('.image-lightbox__image');
    const closeButton = lightbox.querySelector('.image-lightbox__close');

    function openLightbox(image) {
        lightboxImage.src = image.currentSrc || image.src;
        lightboxImage.alt = image.alt || 'Powiększone zdjęcie';
        lightbox.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('is-open');
        lightboxImage.removeAttribute('src');
        lightboxImage.alt = '';
        document.body.style.overflow = '';
    }

    images.forEach((image) => {
        image.style.cursor = 'zoom-in';

        image.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            openLightbox(image);
        });
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

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && lightbox.classList.contains('is-open')) {
            closeLightbox();
        }

        if (event.key === 'Escape') {
            const languageGate = document.getElementById('languageGate');

            if (languageGate && languageGate.classList.contains('is-visible')) {
                languageGate.classList.remove('is-visible');
                document.body.classList.remove('language-gate-open');
            }
        }
    });
})();