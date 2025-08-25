// Fonction optimisée pour créer les marqueurs
function createOptimizedMarkers() {
    // Créer un cache pour les icônes
    const iconCache = {};
    
    // Fonction pour obtenir une icône du cache ou en créer une nouvelle
    function getIcon(category) {
        const iconName = normalizeString(category);
        if (!iconCache[iconName]) {
            iconCache[iconName] = L.icon({
                iconUrl: `image/${iconName}.png`,
                iconSize: [25, 25],
                iconAnchor: [12, 12],
                popupAnchor: [0, -12]
            });
        }
        return iconCache[iconName];
    }
    
    // Créer les marqueurs par lots
    const markersToAdd = [];
    
    // Parcourir tous les POIs
    poi.features.forEach(feature => {
        // Création de l'icône personnalisée depuis le cache
        const icon = getIcon(feature.properties.sous_cat);
        
        // Création du marqueur
        const marker = L.marker(
            [feature.geometry.coordinates[1], feature.geometry.coordinates[0]], 
            { icon: icon }
        );
        
        // Stockage des données pour la popup sans la créer immédiatement
        marker.poiData = feature.properties;
        

        
        // Gestion spéciale pour les bassins
        if (feature.properties.nom === "Orchidées sauvages - Bassin de la Vaucouleurs") {
            setupBassinHandler(marker, bassinVaucouleursLayer);
        } else if (feature.properties.nom === "Orchidées sauvages - Bassin de la Vesgre") {
            setupBassinHandler(marker, bassinVesgreLayer);
        } else {
            // Ajouter un gestionnaire d'événements pour afficher les détails dans le volet droit
            marker.on('click', function(e) {
                // Empêcher la propagation de l'événement pour éviter que la carte ne ferme le volet
                L.DomEvent.stopPropagation(e);
                // Afficher le panneau latéral
                const sidePanel = document.getElementById('side-panel');
                if (sidePanel) {
                    sidePanel.classList.add('active');
                }
                
                // Afficher les détails dans le panneau latéral
                if (typeof window.showPoiDetails === 'function') {
                    window.showPoiDetails(this.poiData);
                }
            });
        }
        
        // Stockage du marqueur avec ses catégories pour le filtrage
        const category = mapToFilterCategory(feature.properties.categorie);
        const subcategory = mapToFilterSubcategory(feature.properties.sous_cat);
        
        if (!allMarkers[category]) {
            allMarkers[category] = {};
        }
        
        if (!allMarkers[category][subcategory]) {
            allMarkers[category][subcategory] = [];
        }
        
        allMarkers[category][subcategory].push(marker);
        
        // Ajouter à la liste des marqueurs à ajouter
        markersToAdd.push(marker);
    });
    
    // Ajouter tous les marqueurs au cluster en une seule opération
    markers.addLayers(markersToAdd);
    
    // Ajouter le cluster à la carte
    map.addLayer(markers);
}

// Fonction pour créer le contenu de la popup à la demande
function createPopupContent(properties) {
    let popupContent = `<h3>${properties.nom}</h3>`;
    
    // Conteneur pour la mise en page à deux colonnes
    popupContent += `<div class="popup-container">`;
    
    // Colonne de gauche pour le descriptif
    popupContent += `<div class="popup-text">`;
    if (properties.descriptif) {
        popupContent += `<p>${properties.descriptif}</p>`;
    }
    popupContent += `</div>`;
    
    // Colonne de droite pour l'image
    if (properties.photo) {
        popupContent += `
            <div class="popup-image">
                <img src="${properties.photo}" alt="${properties.nom}" class="popup-thumbnail" 
                     data-full-img="${properties.photo}" 
                     data-photo2="${properties.photo2 || ''}"
                     data-photo3="${properties.photo3 || ''}"
                     data-photo4="${properties.photo4 || ''}"
                     data-photo5="${properties.photo5 || ''}"
                     data-photo6="${properties.photo6 || ''}"
                     data-photo7="${properties.photo7 || ''}"
                     data-photo8="${properties.photo8 || ''}"
                     data-photo9="${properties.photo9 || ''}"
                     data-photo10="${properties.photo10 || ''}"
                     data-photo11="${properties.photo11 || ''}"
                     data-photo12="${properties.photo12 || ''}"
                     data-photo13="${properties.photo13 || ''}">
            </div>
        `;
    } else {
        // Si pas d'image, ajuster l'espace pour le texte
        popupContent = popupContent.replace('<div class="popup-text">', '<div class="popup-text" style="width:100%">');
    }
    
    popupContent += `</div>`; // Fin du conteneur à deux colonnes
    
    // Section pour les liens et informations supplémentaires
    popupContent += `<div class="popup-links">`;
    
    if (properties.tel) {
        popupContent += `<p><strong>Tél :</strong> ${properties.tel}</p>`;
    }
    
    if (properties.mail) {
        popupContent += `<p><strong>Email :</strong> ${properties.mail}</p>`;
    }
    
    if (properties.site_web) {
        popupContent += `<p><a href="${properties.site_web}" target="_blank">Plus d'informations</a></p>`;
    }
    
    if (properties.accessibilité) {
        popupContent += `<p><strong>Accessible :</strong> ${properties.accessibilité}</p>`;
    }
    
    if (properties.Latitude && properties.Longitude) {
        popupContent += `<p><a href="https://www.google.com/maps/dir//${properties.Latitude},${properties.Longitude}" target="_blank">Itinéraire</a></p>`;
    }
    
    popupContent += `</div>`; // Fin de la section des liens
    
    return popupContent;
}

// Fonction pour configurer les gestionnaires d'événements pour les bassins
function setupBassinHandler(marker, bassinLayer) {
    marker.on('click', function(e) {
        L.DomEvent.stopPropagation(e);
        if (bassinLayer) {
            // Masquer d'abord les deux couches de bassins
            if (window.bassinVaucouleursLayer && map.hasLayer(window.bassinVaucouleursLayer)) {
                map.removeLayer(window.bassinVaucouleursLayer);
            }
            if (window.bassinVesgreLayer && map.hasLayer(window.bassinVesgreLayer)) {
                map.removeLayer(window.bassinVesgreLayer);
            }
            
            // Retirer temporairement le marqueur du cluster
            markers.removeLayer(marker);
            // Ajouter le marqueur directement à la carte
            marker.addTo(map);
            // Ajouter la couche du bassin
            map.addLayer(bassinLayer);
            // Afficher le panneau latéral
            const sidePanel = document.getElementById('side-panel');
            if (sidePanel) {
                sidePanel.classList.add('active');
            }
            
            // Afficher les détails dans le panneau latéral
            if (typeof window.showPoiDetails === 'function') {
                // Utiliser une fonction spéciale pour éviter que showPoiDetails ne supprime la couche
                showBassinDetails(marker.poiData);
            }
            // Puis ajuster la vue avec un délai pour éviter les conflits
            setTimeout(function() {
                map.fitBounds(bassinLayer.getBounds(), {animate: false});
            }, 100);
        }
    });
    
    // Fonction spéciale pour afficher les détails sans supprimer les couches
    function showBassinDetails(properties) {
        // Récupérer le conteneur de la liste des POIs
        const poiListContainer = document.getElementById('poi-list');
        if (!poiListContainer) return;
        
        // Vider le contenu actuel sans supprimer les couches
        poiListContainer.innerHTML = '';
        
        // Créer le contenu détaillé (même code que dans showPoiDetails)
        let detailContent = `<div class="poi-detail">`;
        
        // Titre
        detailContent += `<h2 class="poi-detail-title">${properties.nom}</h2>`;
        detailContent += `<span class="poi-category">${properties.sous_cat}</span>`;
        
        // Image (au-dessus du texte)
        if (properties.photo) {
            detailContent += `
                <div class="poi-detail-image">
                    <img src="${properties.photo}" alt="${properties.nom}" class="detail-thumbnail" 
                         data-full-img="${properties.photo}" 
                         data-photo2="${properties.photo2 || ''}"
                         data-photo3="${properties.photo3 || ''}"
                         data-photo4="${properties.photo4 || ''}"
                         data-photo5="${properties.photo5 || ''}"
                         data-photo6="${properties.photo6 || ''}"
                         data-photo7="${properties.photo7 || ''}"
                         data-photo8="${properties.photo8 || ''}"
                         data-photo9="${properties.photo9 || ''}"
                         data-photo10="${properties.photo10 || ''}"
                         data-photo11="${properties.photo11 || ''}"
                         data-photo12="${properties.photo12 || ''}"
                         data-photo13="${properties.photo13 || ''}">
                </div>
            `;
        }
        
        // Description (en dessous de l'image)
        detailContent += `<div class="poi-detail-text">`;
        if (properties.descriptif) {
            detailContent += `<p>${properties.descriptif}</p>`;
        } else {
            detailContent += `<p>Aucune description disponible.</p>`;
        }
        detailContent += `</div>`;
        
        // Informations supplémentaires
        detailContent += `<div class="poi-detail-info">`;
        
        if (properties.commune) {
            detailContent += `<p><i class="fas fa-map-marker-alt"></i> ${properties.commune}`;
            if (properties.adresse) {
                detailContent += ` - ${properties.adresse}`;
            }
            detailContent += `</p>`;
        }
        
        if (properties.tel) {
            detailContent += `<p><i class="fas fa-phone"></i> ${properties.tel}</p>`;
        }
        
        if (properties.mail) {
            detailContent += `<p><i class="fas fa-envelope"></i> ${properties.mail}</p>`;
        }
        
        if (properties.site_web) {
            detailContent += `<p><a href="${properties.site_web}" target="_blank" class="detail-link"><i class="fas fa-external-link-alt"></i> Plus d'informations</a></p>`;
        }
        
        if (properties.accessibilité) {
            detailContent += `<p><i class="fas fa-wheelchair"></i> Accessible : ${properties.accessibilité}</p>`;
        }
        
        if (properties.Latitude && properties.Longitude) {
            detailContent += `<p><a href="https://www.google.com/maps/dir//${properties.Latitude},${properties.Longitude}" target="_blank" class="detail-link"><i class="fas fa-directions"></i> Itinéraire</a></p>`;
        }
        
        detailContent += `</div>`; // Fin des informations
        
        detailContent += `</div>`; // Fin du détail
        
        // Ajouter le contenu au panneau
        poiListContainer.innerHTML = detailContent;
        
        // Ajouter des gestionnaires pour les images (pour la lightbox)
        const detailImage = poiListContainer.querySelector('.detail-thumbnail');
        if (detailImage) {
            detailImage.addEventListener('click', function() {
                // Utiliser la fonction existante pour ouvrir la lightbox
                if (typeof openLightbox === 'function') {
                    openLightbox(this);
                }
            });
        }
    }
    
    // Créer un événement personnalisé pour fermer le bassin
    document.addEventListener('closeBassin', function() {
        if (bassinLayer && map.hasLayer(bassinLayer)) {
            map.removeLayer(bassinLayer);
        }
        // Remettre le marqueur dans le cluster
        if (map.hasLayer(marker)) {
            map.removeLayer(marker);
            markers.addLayer(marker);
        }
    });
}