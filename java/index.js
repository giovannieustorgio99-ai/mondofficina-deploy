let dataBaseDb = "https://sheetdb.io/api/v1/e427kzhcnp5x3";
let whatsAppNumber = "3270949208";
let products = [];
let currentFilter = "tutti";

async function loadProducts() {
    try {
        console.log("Caricamento prodotti...");
        let res = await fetch(dataBaseDb);
        let data = await res.json();
        data = data.filter(row =>
            row.id && row.name && row.desc && row.price && row.category
        );
        products = data.map(row => {
            // Gestisce sia singole immagini che array di immagini (separate da virgola o a capo)
            let images = row.img
                ? row.img.split(/[,\n]/).map(img => img.trim()).filter(img => img.length > 0)
                : ['🔧'];

            return {
                id: Number(row.id),
                name: row.name,
                desc: row.desc,
                price: row.price,
                category: row.category,
                img: images[0], // Prima immagine per l'anteprima
                images: images, // Array di tutte le immagini
                garanzia: row.garanzia,
                spedizione: row.spedizione,
                supporto: row.supporto,
            };
        });
        renderProducts();
    } catch (err) {
        console.error("Errore caricamento:", err);
        document.getElementById("productGrid").innerHTML =
            '<p style="text-align: center; color: #666; width: 100%;">Errore nel caricamento dei prodotti. Riprova più tardi.</p>';
    }
}

function renderProducts(filter = "tutti") {
    let grid = document.getElementById("productGrid");
    if (!grid) return;

    let filtered = filter === "tutti"
        ? products
        : products.filter(p => p.category === filter);

    if (filtered.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: #666; width: 100%;">Nessun prodotto trovato in questa categoria.</p>';
        return;
    }

    grid.innerHTML = filtered.map(product => {
        let isImage = product.img.includes('.jpg') || product.img.includes('.png') ||
            product.img.includes('.jpeg') || product.img.includes('.webp') ||
            product.img.includes('.gif');

        let imgHTML = isImage
            ? `<img src="${product.img}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">`
            : product.img;

        // Aggiungi indicatore pallini se ci sono più immagini
        let imageIndicator = product.images.length > 1
            ? `<div style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); display: flex; gap: 5px; z-index: 5;">
                ${product.images.map((_, i) =>
                `<span style="width: 8px; height: 8px; border-radius: 50%; background: ${i === 0 ? '#fff' : 'rgba(255,255,255,0.6)'}; display: block; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></span>`
            ).join('')}
            </div>`
            : '';

        return `
            <div class="product-card" onclick="showProductDetails(${product.id})">
                <div class="product-image" style="position: relative;">
                    ${imgHTML}
                    ${imageIndicator}
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p>${product.desc}</p>
                    <div class="product-price">€${product.price}</div>
                    <button class="btn btn-primary" style="width: 100%; margin-top: auto;">
                        Richiedi Info
                    </button>
                </div>
            </div>
        `;
    }).join("");

    // Centra sempre le card
    grid.style.justifyContent = 'center';
}

function filterProducts(category) {
    currentFilter = category;
    renderProducts(category);
    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.category === category);
    });
    scrollToSection("prodotti");
}

function showProductDetails(productId) {
    let product = products.find(p => p.id === productId);
    if (!product) return;

    let modal = document.getElementById("modal");
    let modalTitle = document.getElementById("modalTitle");
    let modalBody = document.getElementById("modalBody");

    modalTitle.textContent = product.name;

    // Costruisce lo slider se ci sono multiple immagini
    let sliderHTML = '';
    if (product.images && product.images.length > 0) {
        sliderHTML = `
            <div class="product-slider">
                <div class="slider-container">
                    ${product.images.map((img, index) => {
            let isImage = img.includes('.jpg') || img.includes('.png') ||
                img.includes('.jpeg') || img.includes('.webp') ||
                img.includes('.gif');

            let imgContent = isImage
                ? `<img src="${img}" alt="${product.name}" class="slider-image" onclick="zoomImage(this)" title="Clicca per ingrandire">`
                : `<div style="font-size: 5rem; display: flex; align-items: center; justify-content: center; height: 300px;">${img}</div>`;

            return `<div class="slider-slide" data-slide="${index}" style="display: ${index === 0 ? 'block' : 'none'};">${imgContent}</div>`;
        }).join('')}
                    
                    ${product.images.length > 1 ? `
                        <button class="slider-arrow slider-arrow-left" onclick="changeSlide(${productId}, -1)">‹</button>
                        <button class="slider-arrow slider-arrow-right" onclick="changeSlide(${productId}, 1)">›</button>
                    ` : ''}
                </div>
                
                ${product.images.length > 1 ? `
                    <div class="slider-dots">
                        ${product.images.map((_, index) =>
            `<span class="slider-dot ${index === 0 ? 'active' : ''}" onclick="goToSlide(${productId}, ${index})"></span>`
        ).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    modalBody.innerHTML = `
        ${sliderHTML}
        <p style="margin-bottom: 1rem;"><strong>Descrizione:</strong> ${product.desc}</p>
        <p style="margin-bottom: 1rem;">
            <strong>Categoria:</strong>
            ${product.category}
        </p>
        <div style="font-size: 2rem; color: #0698d8; font-weight: bold; margin: 1.5rem 0;">
            €${product.price}
        </div>
        <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
            <p><strong>✓</strong> ${product.garanzia || 'Garanzia standard'}</p>
            <p><strong>✓</strong> ${product.spedizione || 'Spedizione veloce'}</p>
            <p><strong>✓</strong> ${product.supporto || 'Supporto tecnico'}</p>
        </div>
        <button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" onclick="requestQuote('${product.name}')">
            Richiedi Preventivo
        </button>
    `;

    modal.classList.add("active");

    // Inizializza lo stato dello slider
    if (!window.sliderStates) window.sliderStates = {};
    window.sliderStates[productId] = 0;
}

function changeSlide(productId, direction) {
    let product = products.find(p => p.id === productId);
    if (!product || !product.images) return;

    let currentIndex = window.sliderStates[productId] || 0;
    let newIndex = currentIndex + direction;

    // Loop circolare
    if (newIndex < 0) newIndex = product.images.length - 1;
    if (newIndex >= product.images.length) newIndex = 0;

    window.sliderStates[productId] = newIndex;
    updateSliderDisplay(productId, newIndex);
}

function goToSlide(productId, index) {
    window.sliderStates[productId] = index;
    updateSliderDisplay(productId, index);
}

function updateSliderDisplay(productId, activeIndex) {
    let slides = document.querySelectorAll('.slider-slide');
    let dots = document.querySelectorAll('.slider-dot');

    slides.forEach((slide, index) => {
        slide.style.display = index === activeIndex ? 'block' : 'none';
    });

    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === activeIndex);
    });
}

// Variabili globali per lo zoom
let currentZoomProductId = null;
let currentZoomImageIndex = 0;

// Funzione per lo zoom delle immagini
function zoomImage(imgElement) {
    console.log(imgElement)
    // Trova il prodotto corrente dall'immagine
    let allSlides = document.querySelectorAll('.slider-slide');
    let currentSlideIndex = 0;

    allSlides.forEach((slide, index) => {
        if (slide.style.display !== 'none') {
            currentSlideIndex = index;
        }
    });

    // Trova il productId dallo stato dello slider
    for (let productId in window.sliderStates) {
        if (window.sliderStates[productId] === currentSlideIndex) {
            currentZoomProductId = parseInt(productId);
            currentZoomImageIndex = currentSlideIndex;
            break;
        }
    }

    // Se non troviamo il prodotto dallo stato, usiamo il primo prodotto visualizzato nel modal
    if (!currentZoomProductId) {
        let modalTitle = document.getElementById('modalTitle').textContent;
        let product = products.find(p => p.name === modalTitle);
        if (product) {
            currentZoomProductId = product.id;
            currentZoomImageIndex = 0;
        }
    }

    // Crea l'overlay per lo zoom se non esiste già
    let zoomOverlay = document.getElementById('imageZoomOverlay');

    if (!zoomOverlay) {
        zoomOverlay = document.createElement('div');
        zoomOverlay.id = 'imageZoomOverlay';
        zoomOverlay.className = 'image-zoom-overlay';
        zoomOverlay.innerHTML = `
            <button class="zoom-close-btn" onclick="closeZoom()" title="Chiudi (Esc)">&times;</button>
            <button class="zoom-arrow zoom-arrow-left" onclick="changeZoomImage(-1)" title="Immagine precedente">‹</button>
            <button class="zoom-arrow zoom-arrow-right" onclick="changeZoomImage(1)" title="Immagine successiva">›</button>
            <div class="zoom-counter" id="zoomCounter"></div>
            <img id="zoomedImage" src="" alt="Immagine ingrandita">
        `;
        document.body.appendChild(zoomOverlay);

        // Chiudi cliccando sull'overlay
        zoomOverlay.addEventListener('click', function(e) {
            if (e.target === zoomOverlay) {
                closeZoom();
            }
        });
    }

    // Aggiorna l'immagine e mostra l'overlay
    updateZoomImage();
    zoomOverlay.classList.add('active');

    // Previeni lo scroll del body
    document.body.style.overflow = 'hidden';

    // Aggiorna la visibilità delle frecce
    updateZoomArrows();
}

function updateZoomImage() {
    let product = products.find(p => p.id === currentZoomProductId);
    if (!product) return;

    let zoomedImg = document.getElementById('zoomedImage');
    let zoomCounter = document.getElementById('zoomCounter');

    zoomedImg.src = product.images[currentZoomImageIndex];
    zoomedImg.alt = product.name;

    // Aggiorna il contatore
    if (product.images.length > 1) {
        zoomCounter.textContent = `${currentZoomImageIndex + 1} / ${product.images.length}`;
        zoomCounter.style.display = 'block';
    } else {
        zoomCounter.style.display = 'none';
    }
}

function updateZoomArrows() {
    let product = products.find(p => p.id === currentZoomProductId);
    if (!product) return;

    let leftArrow = document.querySelector('.zoom-arrow-left');
    let rightArrow = document.querySelector('.zoom-arrow-right');

    // Mostra le frecce solo se ci sono più immagini
    if (product.images.length > 1) {
        leftArrow.style.display = 'flex';
        rightArrow.style.display = 'flex';
    } else {
        leftArrow.style.display = 'none';
        rightArrow.style.display = 'none';
    }
}

function changeZoomImage(direction) {
    let product = products.find(p => p.id === currentZoomProductId);
    if (!product) return;

    currentZoomImageIndex += direction;

    // Loop circolare
    if (currentZoomImageIndex < 0) {
        currentZoomImageIndex = product.images.length - 1;
    }
    if (currentZoomImageIndex >= product.images.length) {
        currentZoomImageIndex = 0;
    }

    // Aggiorna anche lo slider nel modal
    window.sliderStates[currentZoomProductId] = currentZoomImageIndex;
    updateSliderDisplay(currentZoomProductId, currentZoomImageIndex);

    // Aggiorna l'immagine zoomata
    updateZoomImage();
}

function closeZoom() {
    let zoomOverlay = document.getElementById('imageZoomOverlay');
    if (zoomOverlay) {
        zoomOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    currentZoomProductId = null;
    currentZoomImageIndex = 0;
}

function closeModal() {
    let modal = document.getElementById("modal");
    if (modal) {
        modal.classList.remove("active");
    }
}

function requestQuote(productName) {
    let message = encodeURIComponent(`Ciao, vorrei richiedere un preventivo per: ${productName}`);
    let whatsappURL = `https://wa.me/${whatsAppNumber}?text=${message}`;
    window.open(whatsappURL, "_blank");
    closeModal();
}

function scrollToSection(sectionId) {
    let section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: "smooth" });
    }
}

document.addEventListener("DOMContentLoaded", function () {
    // Gestisce correttamente la Promise di loadProducts
    loadProducts().catch(err => {
        console.error("Errore inizializzazione prodotti:", err);
    });

    let form = document.getElementById("contactForm");
    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();

            let nome = document.getElementById("nome-cognome").value;
            let email = document.getElementById("email").value;
            let telefono = document.getElementById("telefono").value;
            let messaggio = document.getElementById("messaggio").value;

            let whatsappMessage = `*NUOVA RICHIESTA CONTATTO*\n\n`;
            whatsappMessage += `👤 *Nome:* ${nome}\n`;
            whatsappMessage += `📧 *Email:* ${email}\n`;
            if (telefono) {
                whatsappMessage += `📱 *Telefono:* ${telefono}\n`;
            }
            whatsappMessage += `\n💬 *Messaggio:*\n${messaggio}`;

            let encodedMessage = encodeURIComponent(whatsappMessage);
            let whatsappURL = `https://wa.me/${whatsAppNumber}?text=${encodedMessage}`;

            window.open(whatsappURL, "_blank");
            alert("Grazie per averci contattato! Sarai reindirizzato a WhatsApp.");
            form.reset();
        });
    }

    let modalEl = document.getElementById("modal");
    if (modalEl) {
        modalEl.addEventListener("click", function (e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }

    // Gestione tastiera per modal e zoom
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            closeZoom();
            closeModal();
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
    });

    let menuToggle = document.querySelector(".menu-toggle");
    let navLinks = document.querySelector(".nav-links");

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", function () {
            navLinks.classList.toggle("active");
        });

        navLinks.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                navLinks.classList.remove("active");
            });
        });
    }
});