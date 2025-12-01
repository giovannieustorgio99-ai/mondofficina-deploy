// CONFIGURAZIONE: Inserisci qui il tuo endpoint SheetDB per gli eventi
let eventiDatabaseUrl = "https://sheetdb.io/api/v1/rjc3f8o3vryao";

// CONFIGURAZIONE: Inserisci qui l'URL della pagina di prenotazione
let bookingPageUrl = "https://tuosito.com/prenotazioni";
let eventi = [];
let currentFilter = "tutti";

// Verifica se l'URL è un'immagine valida
function isImageUrl(url) {
    return url.includes('.jpg') || url.includes('.png') ||
        url.includes('.jpeg') || url.includes('.webp') ||
        url.includes('.gif');
}

// Genera l'HTML per l'immagine
function generateImageHtml(img, name, size) {
    if (isImageUrl(img)) {
        let style = size === 'card'
            ? 'width: 100%; height: 100%; object-fit: cover;'
            : 'width: 100%; max-height: 400px; object-fit: contain; border-radius: 8px; margin-bottom: 1.5rem;';
        return '<img src="' + img + '" alt="' + name + '" style="' + style + '">';
    }
    let fontSize = size === 'card' ? '5rem' : '8rem';
    let padding = size === 'card' ? '' : 'padding: 2rem;';
    return '<div style="font-size: ' + fontSize + '; display: flex; align-items: center; justify-content: center; height: 100%; ' + padding + '">' + img + '</div>';
}

function showLoadingError() {
    let grid = document.getElementById("eventiGrid");
    if (grid) {
        grid.innerHTML = '<p style="text-align: center; color: #666; width: 100%; padding: 2rem;">Errore nel caricamento degli eventi. Riprova più tardi.</p>';
    }
}

async function loadEventi() {
    try {
        console.log("Caricamento eventi...");

        let res = await fetch(eventiDatabaseUrl);

        if (!res.ok) {
            console.error("Errore HTTP: " + res.status);
            showLoadingError();
            return;
        }

        let data = await res.json();

        // Filtra solo gli eventi con tutti i campi richiesti
        data = data.filter(row => row.id && row.name && row.desc && row.img);

        eventi = data.map(row => {
            // Gestisce sia singole immagini che array di immagini (separate da virgola o a capo)
            let images = row.img
                ? row.img.split(/[,\n]/).map(img => img.trim()).filter(img => img.length > 0)
                : ['📅'];

            return {
                id: Number(row.id),
                name: row.name,
                desc: row.desc,
                img: images[0],
                images: images,
                category: row.category || "Formazione"
            };
        });

        console.log("Caricati " + eventi.length + " eventi");
        renderEventi();

    } catch (err) {
        console.error("Errore caricamento eventi:", err);
        showLoadingError();
    }
}

function renderEventi() {
    let grid = document.getElementById("eventiGrid");
    if (!grid) return;

    let filtered = currentFilter === "tutti"
        ? eventi
        : eventi.filter(evento => evento.category === currentFilter);

    if (filtered.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: #666; width: 100%; padding: 2rem;">Nessun evento disponibile per questa categoria.</p>';
        return;
    }

    grid.innerHTML = filtered.map(evento => {
        let imgHTML = generateImageHtml(evento.img, evento.name, 'card');

        return '<div class="evento-card" onclick="showEventoDetails(' + evento.id + ')">' +
            '<div class="evento-image">' + imgHTML + '</div>' +
            '<div class="evento-info">' +
            '<h3>' + evento.name + '</h3>' +
            '<p>' + evento.desc + '</p>' +
            '<button class="btn btn-primary" style="width: 100%; margin-top: auto;">📅 Prendi un Appuntamento</button>' +
            '</div>' +
            '</div>';
    }).join("");
}

// Funzioni globali chiamate dagli attributi onclick dell'HTML

function filterEventi(category) {
    currentFilter = category;
    renderEventi();
    let buttons = document.querySelectorAll(".filter-btn");
    for (let i = 0; i < buttons.length; i++) {
        if (buttons[i].dataset.category === category) {
            buttons[i].classList.add("active");
        } else {
            buttons[i].classList.remove("active");
        }
    }
    let section = document.getElementById("eventiGrid");
    if (section) {
        section.scrollIntoView({ behavior: "smooth" });
    }
}

// Rende la funzione accessibile globalmente
window.filterEventi = filterEventi;

function showEventoDetails(eventoId) {
    let evento = eventi.find(e => e.id === eventoId);
    if (!evento) return;
    let modal = document.getElementById("eventoModal");
    let modalTitle = document.getElementById("eventoModalTitle");
    let modalBody = document.getElementById("eventoModalBody");
    if (!modal || !modalTitle || !modalBody) return;
    modalTitle.textContent = evento.name;

    // Costruisce lo slider se ci sono multiple immagini
    let sliderHTML = '';
    if (evento.images && evento.images.length > 0) {
        sliderHTML = '<div class="product-slider"><div class="slider-container">';
        evento.images.forEach(function(img, index) {
            let isImage = isImageUrl(img);
            let imgContent = isImage
                ? '<img src="' + img + '" alt="' + evento.name + '" class="slider-image" onclick="zoomImage(this, ' + eventoId + ', ' + index + ')" title="Clicca per ingrandire">'
                : '<div style="font-size: 5rem; display: flex; align-items: center; justify-content: center; height: 300px;">' + img + '</div>';
            sliderHTML += '<div class="slider-slide' + (index === 0 ? ' active' : '') + '" data-slide="' + index + '">' + imgContent + '</div>';
        });

        if (evento.images.length > 1) {
            sliderHTML += '<button class="slider-arrow slider-arrow-left" onclick="changeSlide(' + eventoId + ', -1)">‹</button>';
            sliderHTML += '<button class="slider-arrow slider-arrow-right" onclick="changeSlide(' + eventoId + ', 1)">›</button>';
        }

        sliderHTML += '</div>';

        if (evento.images.length > 1) {
            sliderHTML += '<div class="slider-dots">';
            evento.images.forEach(function(_, index) {
                sliderHTML += '<span class="slider-dot' + (index === 0 ? ' active' : '') + '" onclick="goToSlide(' + eventoId + ', ' + index + ')"></span>';
            });
            sliderHTML += '</div>';
        }
        sliderHTML += '</div>';
    }

    // Converti gli a capo in <br>
    let descriptionHTML = evento.desc.replace(/\n/g, '<br>')
    modalBody.innerHTML = sliderHTML +
        '<p style="margin-bottom: 2rem; font-size: 1.2rem; line-height: 1.8; color: #333;">' + descriptionHTML + '</p>' +
        '<button class="btn btn-primary" style="width: 100%; font-size: 1.2rem; padding: 1.2rem;" onclick="goToBooking()">📅 Prendi un Appuntamento</button>';
    modal.classList.add("active");

    // Inizializza lo stato dello slider
    if (!window.sliderStates) window.sliderStates = {};
    window.sliderStates[eventoId] = 0;
}

// Rende la funzione accessibile globalmente
window.showEventoDetails = showEventoDetails;

function changeSlide(eventoId, direction) {
    let evento = eventi.find(e => e.id === eventoId);
    if (!evento || !evento.images) return;

    let currentIndex = window.sliderStates[eventoId] || 0;
    let newIndex = currentIndex + direction;

    // Loop circolare
    if (newIndex < 0) newIndex = evento.images.length - 1;
    if (newIndex >= evento.images.length) newIndex = 0;

    window.sliderStates[eventoId] = newIndex;
    updateSliderDisplay(eventoId, newIndex);
}

// Rende la funzione accessibile globalmente
window.changeSlide = changeSlide;

function goToSlide(eventoId, index) {
    window.sliderStates[eventoId] = index;
    updateSliderDisplay(eventoId, index);
}

// Rende la funzione accessibile globalmente
window.goToSlide = goToSlide;

function updateSliderDisplay(eventoId, activeIndex) {
    let slides = document.querySelectorAll('.slider-slide');
    let dots = document.querySelectorAll('.slider-dot');

    slides.forEach(function(slide, index) {
        if (index === activeIndex) {
            slide.classList.add('active');
        } else {
            slide.classList.remove('active');
        }
    });

    dots.forEach(function(dot, index) {
        if (index === activeIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// Variabili globali per lo zoom
let currentZoomEventoId = null;
let currentZoomImageIndex = 0;

function zoomImage(imgElement, eventoId, imageIndex) {
    currentZoomEventoId = eventoId;
    currentZoomImageIndex = imageIndex;

    let zoomOverlay = document.getElementById('imageZoomOverlay');

    if (!zoomOverlay) {
        zoomOverlay = document.createElement('div');
        zoomOverlay.id = 'imageZoomOverlay';
        zoomOverlay.className = 'image-zoom-overlay';
        zoomOverlay.innerHTML =
            '<button class="zoom-close-btn" onclick="closeZoom()" title="Chiudi (Esc)">&times;</button>' +
            '<button class="zoom-arrow zoom-arrow-left" onclick="changeZoomImage(-1)" title="Immagine precedente">‹</button>' +
            '<button class="zoom-arrow zoom-arrow-right" onclick="changeZoomImage(1)" title="Immagine successiva">›</button>' +
            '<div class="zoom-counter" id="zoomCounter"></div>' +
            '<img id="zoomedImage" src="" alt="Immagine ingrandita">';

        document.body.appendChild(zoomOverlay);

        zoomOverlay.addEventListener('click', function(e) {
            if (e.target === zoomOverlay) {
                closeZoom();
            }
        });
    }

    updateZoomImage();
    zoomOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    updateZoomArrows();
}

// Rende la funzione accessibile globalmente
window.zoomImage = zoomImage;

function updateZoomImage() {
    let evento = eventi.find(e => e.id === currentZoomEventoId);
    if (!evento) return;
    let zoomedImg = document.getElementById('zoomedImage');
    let zoomCounter = document.getElementById('zoomCounter');
    zoomedImg.src = evento.images[currentZoomImageIndex];
    zoomedImg.alt = evento.name;
    if (evento.images.length > 1) {
        zoomCounter.textContent = (currentZoomImageIndex + 1) + ' / ' + evento.images.length;
        zoomCounter.style.display = 'block';
    } else {
        zoomCounter.style.display = 'none';
    }
}

function updateZoomArrows() {
    let evento = eventi.find(e => e.id === currentZoomEventoId);
    if (!evento) return;
    let leftArrow = document.querySelector('.zoom-arrow-left');
    let rightArrow = document.querySelector('.zoom-arrow-right');
    if (leftArrow && rightArrow) {
        if (evento.images.length > 1) {
            leftArrow.style.display = 'flex';
            rightArrow.style.display = 'flex';
        } else {
            leftArrow.style.display = 'none';
            rightArrow.style.display = 'none';
        }
    }
}

function changeZoomImage(direction) {
    let evento = eventi.find(e => e.id === currentZoomEventoId);
    if (!evento) return;
    currentZoomImageIndex += direction;
    if (currentZoomImageIndex < 0) {
        currentZoomImageIndex = evento.images.length - 1;
    }
    if (currentZoomImageIndex >= evento.images.length) {
        currentZoomImageIndex = 0;
    }

    window.sliderStates[currentZoomEventoId] = currentZoomImageIndex;
    updateSliderDisplay(currentZoomEventoId, currentZoomImageIndex);
    updateZoomImage();
}

// Rende la funzione accessibile globalmente
window.changeZoomImage = changeZoomImage;

function closeZoom() {
    let zoomOverlay = document.getElementById('imageZoomOverlay');
    if (zoomOverlay) {
        zoomOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    currentZoomEventoId = null;
    currentZoomImageIndex = 0;
}

// Rende la funzione accessibile globalmente
window.closeZoom = closeZoom;

function goToBooking() {
    window.open(bookingPageUrl, "_blank");
    closeEventoModal();
}

// Rende la funzione accessibile globalmente
window.goToBooking = goToBooking;

function closeEventoModal() {
    let modal = document.getElementById("eventoModal");
    if (modal) {
        modal.classList.remove("active");
    }
}

// Rende la funzione accessibile globalmente
window.closeEventoModal = closeEventoModal;

function closeNavMenu() {
    let navLinks = document.querySelector(".nav-links");
    if (navLinks) {
        navLinks.classList.remove("active");
    }
}

function initMenuMobile() {
    let menuToggle = document.querySelector(".menu-toggle");
    let navLinks = document.querySelector(".nav-links");

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", function () {
            navLinks.classList.toggle("active");
        });

        let links = navLinks.querySelectorAll("a");
        for (let i = 0; i < links.length; i++) {
            links[i].addEventListener("click", closeNavMenu);
        }
    }
}

function handleModalOutsideClick(e) {
    let modalEl = document.getElementById("eventoModal");
    if (e.target === modalEl) {
        closeEventoModal();
    }
}

function handleEscapeKey(e) {
    if (e.key === "Escape") {
        closeZoom();
        closeEventoModal();
    }

    // Navigazione con frecce quando lo zoom è attivo
    let zoomOverlay = document.getElementById('imageZoomOverlay');
    if (zoomOverlay && zoomOverlay.classList.contains('active')) {
        if (e.key === "ArrowLeft") {
            changeZoomImage(-1);
        } else if (e.key === "ArrowRight") {
            changeZoomImage(1);
        }
    }
}

function initModalHandlers() {
    let modalEl = document.getElementById("eventoModal");
    if (modalEl) {
        modalEl.addEventListener("click", handleModalOutsideClick);
    }
    document.addEventListener("keydown", handleEscapeKey);
}

function init() {
    loadEventi().catch(function(err) {
        console.error("Errore inizializzazione:", err);
    });
    initMenuMobile();
    initModalHandlers();
}

// Page initialization
document.addEventListener("DOMContentLoaded", init);