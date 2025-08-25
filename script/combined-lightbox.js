/**
 * Script combiné pour la gestion de la lightbox et du diaporama
 */

// Fonction globale pour ouvrir la lightbox (utilisée par le panneau de détails)
window.openLightbox = function(imgElement) {
    const modal = document.querySelector('.image-modal');
    const modalImg = document.getElementById('modal-img');
    const slideshowControls = document.querySelector('.slideshow-controls');
    const slideCounter = document.querySelector('.slide-counter');
    
    // Récupérer les images
    const img1 = imgElement.getAttribute('data-full-img');
    let slideImages = [img1];
    
    // Ajouter toutes les photos supplémentaires si elles existent
    for (let i = 2; i <= 13; i++) {
        const img = imgElement.getAttribute(`data-photo${i}`);
        if (img && img !== '' && img !== 'null') {
            slideImages.push(img);
        }
    }
    
    // Afficher la première image
    window.currentSlideIndex = 0;
    modalImg.src = slideImages[0];
    modal.style.display = 'flex';
    
    // Stocker les images pour la navigation
    window.slideImages = slideImages;
    
    // Afficher les contrôles du diaporama uniquement s'il y a plus d'une image
    if (slideImages.length > 1) {
        slideshowControls.style.display = 'flex';
        slideCounter.textContent = `1/${slideImages.length}`;
    } else {
        slideshowControls.style.display = 'none';
    }
};

document.addEventListener('DOMContentLoaded', function() {
    // Variables pour le diaporama (définies globalement dans openLightbox)
    if (!window.currentSlideIndex) window.currentSlideIndex = 0;
    if (!window.slideImages) window.slideImages = [];

    // Éléments du DOM
    const modal = document.querySelector('.image-modal');
    const modalImg = document.getElementById('modal-img');
    const closeModal = document.querySelector('.close-modal');
    const imageCaption = document.querySelector('.image-caption');
    const slideshowControls = document.querySelector('.slideshow-controls');
    const prevButton = document.querySelector('.prev-slide');
    const nextButton = document.querySelector('.next-slide');
    const slideCounter = document.querySelector('.slide-counter');
    
    // Fermer le modal
    closeModal.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // Fermer le modal en cliquant en dehors de l'image
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Navigation dans le diaporama
    prevButton.addEventListener('click', function(e) {
        e.stopPropagation();
        if (window.slideImages.length <= 1) return;
        
        // Basculer entre les images
        window.currentSlideIndex = (window.currentSlideIndex === 0) ? (window.slideImages.length - 1) : (window.currentSlideIndex - 1);
        modalImg.src = window.slideImages[window.currentSlideIndex];
        slideCounter.textContent = `${window.currentSlideIndex + 1}/${window.slideImages.length}`;
    });
    
    nextButton.addEventListener('click', function(e) {
        e.stopPropagation();
        if (window.slideImages.length <= 1) return;
        
        // Basculer entre les images
        window.currentSlideIndex = (window.currentSlideIndex === window.slideImages.length - 1) ? 0 : (window.currentSlideIndex + 1);
        modalImg.src = window.slideImages[window.currentSlideIndex];
        slideCounter.textContent = `${window.currentSlideIndex + 1}/${window.slideImages.length}`;
    });
    
    // Délégation d'événements pour les images dans les popups
    document.addEventListener('click', function(event) {
        if (event.target && event.target.classList.contains('popup-thumbnail')) {
            // Utiliser la fonction openLightbox pour ouvrir la lightbox
            window.openLightbox(event.target);
        }
    });
    
    // Ajouter la navigation par clavier
    document.addEventListener('keydown', function(e) {
        if (modal.style.display === 'flex') {
            if (e.key === 'ArrowLeft') {
                prevButton.click();
            } else if (e.key === 'ArrowRight') {
                nextButton.click();
            } else if (e.key === 'Escape') {
                modal.style.display = 'none';
            }
        }
    });
});