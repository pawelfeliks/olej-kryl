// Mobile navigation and small UX improvements for the static landing page.
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

// Image lightbox: opens every content image in full view.
const pageImages = document.querySelectorAll('main img');

if (pageImages.length > 0) {
    const lightbox = document.createElement('div');
    lightbox.className = 'image-lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Powiększony podgląd grafiki');

    lightbox.innerHTML = `
        <div class="image-lightbox__content">
            <button class="image-lightbox__close" type="button" aria-label="Zamknij podgląd">&times;</button>
            <img class="image-lightbox__image" src="" alt="" />
            <div class="image-lightbox__caption"></div>
        </div>
    `;

    document.body.appendChild(lightbox);

    const lightboxImage = lightbox.querySelector('.image-lightbox__image');
    const lightboxCaption = lightbox.querySelector('.image-lightbox__caption');
    const closeButton = lightbox.querySelector('.image-lightbox__close');

    const closeLightbox = () => {
        lightbox.classList.remove('is-open');
        document.body.style.overflow = '';
        lightboxImage.src = '';
        lightboxImage.alt = '';
        lightboxCaption.textContent = '';
    };

    pageImages.forEach((image) => {
        image.setAttribute('tabindex', '0');

        const openImage = () => {
            const figureCaption = image.closest('figure')?.querySelector('figcaption')?.textContent?.trim();
            const altText = image.getAttribute('alt') || 'Powiększona grafika';

            lightboxImage.src = image.currentSrc || image.src;
            lightboxImage.alt = altText;
            lightboxCaption.textContent = figureCaption || altText;

            lightbox.classList.add('is-open');
            document.body.style.overflow = 'hidden';
            closeButton.focus();
        };

        image.addEventListener('click', openImage);

        image.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openImage();
            }
        });
    });

    closeButton.addEventListener('click', closeLightbox);

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
}
