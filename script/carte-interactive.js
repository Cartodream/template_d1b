// Variables globales
let map;
let markers = L.markerClusterGroup({
    showCoverageOnHover: false
});
let allMarkers = {};
let categoryFilters = {};
let rivieresLayer;
let bassinVesgreLayer;
let bassinVaucouleursLayer;

// Initialisation de la carte
function initMap() {
    // Création de la carte
    map = L.map('map', {
        center: [48.81826349423801, 1.6032443265782088],
        zoom: 11,
        zoomControl: false,
        maxZoom: 20,
        scrollWheelZoom: true
    });
    
    // Exposer la variable globalement
    window.map = map;

    // Ajout du fond de carte OpenStreetMap avec HTTPS pour éviter les problèmes de chargement mixte
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Cartographie : <a href="https://informatique-m2i.fr/">M2i informatique </a>,Cartographie : <a href="https://www.linkedin.com/in/alexandreponchon/">Alexandre PONCHON </a> , <a href="https://www.openstreetmap.fr/">OSM</a>, iconographie : <a href="https://www.flaticon.com/fr/">Flaticon</a>'
    }).addTo(map);

    // Ajout des contrôles de zoom
    L.control.zoom({
        position: 'topright'
    }).addTo(map);

    // Ajout de l'échelle
    L.control.scale({
        position: 'bottomright',
        imperial: false
    }).addTo(map);

    // Ajout du périmètre (fond)
    if (typeof afond !== 'undefined') {
        const fondStyle = {
            weight: 2,
            opacity: 1,
            color: '#9f5cc0',
            fillColor: '#9f5cc0',
            fillOpacity: 0.2,
            interactive: false
        };

        L.geoJSON(afond, {
            style: fondStyle
        }).addTo(map);
    }
    
    // Initialisation de la couche du bassin de la Vesgre
    if (typeof json_COMMUNE_0 !== 'undefined') {
        bassinVesgreLayer = L.geoJSON(json_COMMUNE_0, {
            style: {
                fillColor: "#bdc05c",
                weight: 1,
                opacity: 0.5,
                color: "#bdc05c",
                fillOpacity: 0.5
            }
        });
        // Exposer la variable globalement
        window.bassinVesgreLayer = bassinVesgreLayer;
    }
    // Initialisation de la couche du bassin de la Vaucouleurs
    if (typeof json_COMMUNE_1 !== 'undefined') {
        bassinVaucouleursLayer = L.geoJSON(json_COMMUNE_1, {
            style: {
                fillColor: "#306636",
                weight: 1,
                opacity: 0.5,
                color: "#306636",
                fillOpacity: 0.5
            }
        });
        // Exposer la variable globalement
        window.bassinVaucouleursLayer = bassinVaucouleursLayer;
    }
    // Ajout des sentiers/rivières
    if (typeof rivieres_opth !== 'undefined') {
        const sentierStyle = {
            weight: 4,
            opacity: 1,
            color: '#3388ff',
            fillOpacity: 0
        };

        rivieresLayer = L.geoJSON(rivieres_opth, {
            style: sentierStyle,
            onEachFeature: function(feature, layer) {
                if (feature.properties && feature.properties.nom) {
                    // Ajouter un gestionnaire d'événements pour afficher les détails dans le volet droit
                    layer.on('click', function(e) {
                        // Empêcher la propagation de l'événement pour éviter que la carte ne ferme le volet
                        L.DomEvent.stopPropagation(e);
                        // Afficher le panneau latéral
                        const sidePanel = document.getElementById('side-panel');
                        if (sidePanel) {
                            sidePanel.classList.add('active');
                        }
                        
                        // Afficher les détails dans le panneau latéral
                        if (typeof window.showPoiDetails === 'function') {
                            window.showPoiDetails(feature.properties);
                        }
                    });
                }
            }
        });
        
        // Exposer la variable globalement pour le panneau latéral
        window.rivieresLayer = rivieresLayer;
    }

    // Chargement des points d'intérêt
    loadPOIs();
}

// Fonction pour charger les points d'intérêt
function loadPOIs() {
    if (typeof poi === 'undefined') {
        console.error("Les données POI ne sont pas disponibles");
        return;
    }

    // Utiliser la fonction optimisée pour créer les marqueurs
    createOptimizedMarkers();
    
    // Initialisation des filtres
    initFilters();
    
    // Mise à jour des marqueurs pour appliquer les filtres initiaux
    updateMarkers();
}

// Fonction pour créer une icône personnalisée
function createCustomIcon(category) {
    // Normalisation du nom de catégorie pour correspondre au nom de fichier
    const iconName = normalizeString(category);
    
    return L.icon({
        iconUrl: `image/${iconName}.png`,
        iconSize: [25, 25],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
    });
}

// Fonction normalizeString maintenant dans shared-functions.js

// Fonction pour mapper les catégories du jeu de données aux catégories de filtres
function mapToFilterCategory(category) {
    const categoryMap = {
        'Patrimoine Architectural': 'patrimoine_architectural',
        'Patrimoine Naturel': 'patrimoine_naturel',
        'Patrimoine Mémoriel': 'patrimoine_memoriel',
        'Autres Points': 'autres_points',
    };
    
    return categoryMap[category] || 'activites';
}

// Fonction pour mapper les sous-catégories du jeu de données aux sous-catégories de filtres
function mapToFilterSubcategory(subcategory) {
    const subcategoryMap = {
        'Patrimoine bâti monumental': 'patrimoine_bâti_monumental',
        'Patrimoine Religieux': 'patrimoine_religieux',
        'Bâti Traditionnel': 'bâti_traditionnel',
        'Etangs et Rivières': 'etangs_et_rivières',
        'Etangs': 'etangs_et_rivières',
        'Rivières': 'etangs_et_rivières',
        'Flore': 'flore',
        'Forêts et Parcs': 'forêts_et_parcs',
        'Rapace': 'rapace',
        'Heron': 'heron',
        'Effraie': 'effraie',
        'Chevêche': 'chevêche',
        'Chauve Souris': 'chauve_souris',
        'Cervidés': 'cervidés',
        'Hirondelle': 'hirondelle',
        'Personnages célèbres': 'personnages_célèbres',
        'Musées': 'musées',
        'Lieux de Mémoire': 'lieux_de_mémoire',
        'Curiosité': 'curiosité',
    };
    
    return subcategoryMap[subcategory] || subcategory.toLowerCase().replace(/ /g, '_');
}

// Initialisation des filtres
function initFilters() {
    // Initialiser les filtres par défaut
    categoryFilters = {
        'patrimoine_architectural': {
            'patrimoine_bâti_monumental': true,
            'patrimoine_religieux': true,
            'bâti_traditionnel': true
        },
        'patrimoine_naturel': {
            'etangs_et_rivières': false,
            'effraie': false,
            'chevêche': false,
            'flore': false,
            'rapace': false,
            'heron': false,
            'forêts_et_parcs': false,
            'chauve_souris': false,
            'cervidés': false,
            'hirondelle': false
        },
        'patrimoine_memoriel': {
            'personnages_célèbres': false,
            'musées': false,
            'lieux_de_mémoire': false
        },
        'autres_points': {
            'curiosité': false
        }
    };

    // Sélection de toutes les cases à cocher de filtre
    const filterCheckboxes = document.querySelectorAll('.filter-options input[type="checkbox"]');
    
    // Vérifier si on vient de liste.html
    if (document.referrer.includes('liste.html')) {
        // Charger les filtres sauvegardés
        const savedFilters = sessionStorage.getItem('sharedFilters');
        if (savedFilters) {
            try {
                const filters = JSON.parse(savedFilters);
                
                // Mettre à jour les cases à cocher et les filtres internes
                filterCheckboxes.forEach(checkbox => {
                    const category = checkbox.dataset.category;
                    const subcategory = checkbox.dataset.subcategory;
                    
                    // Vérifier si ce filtre est dans la liste sauvegardée
                    const isChecked = filters.some(f => f.category === category && f.subcategory === subcategory);
                    
                    // Mettre à jour la case à cocher
                    checkbox.checked = isChecked;
                    
                    // Mettre à jour les filtres internes
                    if (!categoryFilters[category]) {
                        categoryFilters[category] = {};
                    }
                    categoryFilters[category][subcategory] = isChecked;
                });
            } catch (e) {
                console.error("Erreur lors du chargement des filtres:", e);
            }
        }
    } else {
        // Utiliser les valeurs par défaut définies dans le HTML
        filterCheckboxes.forEach(checkbox => {
            const category = checkbox.dataset.category;
            const subcategory = checkbox.dataset.subcategory;
            
            if (!categoryFilters[category]) {
                categoryFilters[category] = {};
            }
            
            categoryFilters[category][subcategory] = checkbox.checked;
        });
    }
    
    // Ajout des écouteurs d'événements pour les cases à cocher
    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const category = this.dataset.category;
            const subcategory = this.dataset.subcategory;
            
            if (!categoryFilters[category]) {
                categoryFilters[category] = {};
            }
            
            categoryFilters[category][subcategory] = this.checked;
            
            updateMarkers();
        });
    });
    
    // Écouteurs pour les boutons "Tout sélectionner" et "Tout désélectionner"
    document.querySelector('.select-all').addEventListener('click', selectAllFilters);
    document.querySelector('.deselect-all').addEventListener('click', deselectAllFilters);
    
    // Écouteurs pour les titres de groupes de filtres (accordéon)
    document.querySelectorAll('.filter-title').forEach(title => {
        title.addEventListener('click', function() {
            this.classList.toggle('active');
            const options = this.nextElementSibling;
            options.style.display = options.style.display === 'none' ? 'block' : 'none';
        });
    });
    
    // Écouteur pour le bouton d'affichage/masquage des filtres (mobile)
    document.querySelector('.toggle-filters-btn').addEventListener('click', function() {
        document.querySelector('.filters-panel').classList.add('active');
    });
    
    // Écouteur pour le bouton de fermeture des filtres (mobile)
    document.querySelector('.close-filters').addEventListener('click', function() {
        document.querySelector('.filters-panel').classList.remove('active');
    });
    
    // Assurer que les filtres sont visibles par défaut sur desktop
    function adjustFiltersVisibility() {
        const filtersPanel = document.querySelector('.filters-panel');
        if (window.innerWidth > 992) {
            filtersPanel.classList.add('active');
        } else {
            filtersPanel.classList.remove('active');
        }
    }
    
    // Appliquer au chargement et au redimensionnement
    adjustFiltersVisibility();
    window.addEventListener('resize', adjustFiltersVisibility);
    
    // Sauvegarder les filtres lors du clic sur le lien vers liste.html
    const link = document.querySelector('a[href="liste.html"]');
    if (link) {
        link.addEventListener('click', function() {
            const filters = [];
            document.querySelectorAll('.filter-options input[type="checkbox"]:checked').forEach(cb => {
                filters.push({
                    category: cb.dataset.category,
                    subcategory: cb.dataset.subcategory
                });
            });
            sessionStorage.setItem('sharedFilters', JSON.stringify(filters));
        });
    }
}

// Mise à jour des marqueurs selon les filtres
function updateMarkers() {
    // Supprimer tous les marqueurs
    markers.clearLayers();
    
    // Parcourir toutes les catégories et sous-catégories
    for (const category in allMarkers) {
        for (const subcategory in allMarkers[category]) {
            // Vérifier si cette catégorie/sous-catégorie est activée
            if (categoryFilters[category] && categoryFilters[category][subcategory]) {
                // Ajouter tous les marqueurs de cette sous-catégorie
                allMarkers[category][subcategory].forEach(marker => {
                    markers.addLayer(marker);
                });
            }
        }
    }
    
    // Gérer l'affichage des rivières
    if (rivieresLayer) {
        if (categoryFilters['patrimoine_naturel'] && categoryFilters['patrimoine_naturel']['etangs_et_rivières']) {
            if (!map.hasLayer(rivieresLayer)) {
                map.addLayer(rivieresLayer);
            }
        } else {
            if (map.hasLayer(rivieresLayer)) {
                map.removeLayer(rivieresLayer);
            }
        }
    }
}

// Sélectionner tous les filtres
function selectAllFilters() {
    document.querySelectorAll('.filter-options input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = true;
        
        const category = checkbox.dataset.category;
        const subcategory = checkbox.dataset.subcategory;
        
        if (!categoryFilters[category]) {
            categoryFilters[category] = {};
        }
        
        categoryFilters[category][subcategory] = true;
    });
    
    updateMarkers();
    
    // Mettre à jour le panneau latéral s'il est ouvert
    const sidePanel = document.getElementById('side-panel');
    if (sidePanel && sidePanel.classList.contains('active')) {
        // Déclencher l'événement de mise à jour du panneau latéral
        const event = new CustomEvent('filtersChanged');
        document.dispatchEvent(event);
    }
}

// Désélectionner tous les filtres
function deselectAllFilters() {
    document.querySelectorAll('.filter-options input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
        
        const category = checkbox.dataset.category;
        const subcategory = checkbox.dataset.subcategory;
        
        if (!categoryFilters[category]) {
            categoryFilters[category] = {};
        }
        
        categoryFilters[category][subcategory] = false;
    });
    
    // Déclencher l'événement de fermeture des bassins pour masquer les couches et remettre les marqueurs dans le cluster
    document.dispatchEvent(new Event('closeBassin'));
    
    updateMarkers();
    
    // Mettre à jour le panneau latéral s'il est ouvert
    const sidePanel = document.getElementById('side-panel');
    if (sidePanel && sidePanel.classList.contains('active')) {
        // Déclencher l'événement de mise à jour du panneau latéral
        const event = new CustomEvent('filtersChanged');
        document.dispatchEvent(event);
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Initialisation de la carte
    initMap();
    
    // Ajouter un gestionnaire d'événements pour fermer le volet droit et masquer les couches lorsqu'on clique ailleurs sur la carte
    map.on('click', function(e) {
        // Vérifier si le clic n'est pas sur un marqueur ou une rivière
        if (!e.originalEvent.defaultPrevented) {
            // Fermer le volet droit
            const sidePanel = document.getElementById('side-panel');
            if (sidePanel && sidePanel.classList.contains('active')) {
                sidePanel.classList.remove('active');
            }
            
            // Masquer les couches des bassins
            if (window.bassinVaucouleursLayer && map.hasLayer(window.bassinVaucouleursLayer)) {
                map.removeLayer(window.bassinVaucouleursLayer);
            }
            if (window.bassinVesgreLayer && map.hasLayer(window.bassinVesgreLayer)) {
                map.removeLayer(window.bassinVesgreLayer);
            }
            
            // Déclencher l'événement de fermeture des bassins pour remettre les marqueurs dans le cluster
            document.dispatchEvent(new Event('closeBassin'));
        }
    });
});