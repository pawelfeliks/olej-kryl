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

// Single image lightbox for desktop and mobile
(() => {
    const images = document.querySelectorAll('main img:not(.language-button img)');

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
    });
})();