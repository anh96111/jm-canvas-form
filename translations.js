// Language Configuration
const defaultLanguage = 'en';
let currentLanguage = defaultLanguage;

// Complete Translation Dictionary
const translations = {
    en: {
        // Promotional Banner
        promoText: "🎁 Special Offer: Order 3+ canvas and get 5% OFF! Order 5+ canvas and get 12% OFF! 🎁",
        
        // Canvas Type Selection
        canvasType: "Select Canvas Type",
        singleCanvas: "Single Canvas",
        multiCanvas: "Multiple Different Canvas",
        collageCanvas: "Collage Multiple Images",
        
        // Canvas Configuration
        selectQuantity: "How many different canvas?",
        selectSize: "Select Size *",
        bestSeller: "Best Seller",
        twoPersonLabel: "2 people on 1 canvas (+$10)",
        
        // Upload Section
        uploadImages: "Upload Images *",
        uploadText: "Click to upload images (Max 6)",
        uploadSubtext: "Supports JPG, PNG - Will be cropped to 8:10 ratio",
        
        // Form Fields
        customText: "Enter your text",
        customTextPlaceholder: "e.g., Forever Together",
        date: "Date",
        datePlaceholder: "e.g., Dec 25, 2024",
        welcomeHome: "Welcome Home",
        notes: "Additional Notes",
        notesPlaceholder: "Special instructions...",
        
        // Customer Information
        customerInfo: "Customer Information",
        fbName: "Your Facebook name *",
        fbNamePlaceholder: "Enter your Facebook name",
        email: "Email *",
        emailPlaceholder: "your@email.com",
        
        // Preview & Pricing
        preview: "Canvas Preview",
        previewNotice: "This is only a preview for your custom text. The final canvas preview will be sent to your email and Messenger.",
        estimatedTotal: "Estimated Total",
        
        // Buttons & Actions
        submit: "Submit Order",
        confirmOrder: "Review Your Order",
        confirmSubmit: "Confirm Order",
        goBack: "Go Back",
        cancel: "Cancel",
        apply: "Apply Crop",
        cropImage: "Crop Your Image",
        
        // FAQ System
        faqButton: "❓ FAQ",
        faqTitle: "Frequently Asked Questions",
        backToForm: "Back to Form",
        
        // FAQ Content
        shippingTitle: "🚚 Shipping",
        deliveryTime: "Delivery Time:",
        usDelivery: "US: 5–10 business days",
        intlDelivery: "International: 7–15 business days",
        orderTracking: "Order Tracking: Sent via email automatically after purchase",
        securePackaging: "Secure Packaging: Shock-resistant, moisture-proof, and gift-ready",
        
        paymentTitle: "💳 Payment",
        acceptedMethods: "Accepted Methods:",
        creditCards: "Credit / Debit Cards",
        paypal: "PayPal",
        applePay: "Apple Pay",
        secureCheckout: "Secure Checkout: All payments are encrypted and processed safely",
        fastEasy: "Fast & Easy: No account needed — just a few quick steps",
        
        howItWorksTitle: "🧑‍🎨 How It Works",
        noLivePreview: "This canvas doesn't support live previews — but don't worry!",
        designerEnhance: "✅ Our designers will enhance your photo to look its very best.",
        completeDetails: "📝 Once you've completed the canvas details,",
        emailPreview: "📩 You'll receive a preview via email within 1–2 business days.",
        requestEdits: "🖼️ You can request edits until you're completely satisfied.",
        finalizeOrder: "✅ Finalize your order and we'll take care of the rest.",
        
        // Thank You Page
        thankYouTitle: "Thank You!",
        thankYouMessage: "Your order has been received successfully. We'll send your canvas preview to your email and Messenger within 2-3 business days.",
        newOrder: "Place Another Order",
        
        // Validation Messages
        fbNameRequired: "Facebook name is required",
        fbNameTooShort: "Facebook name must be at least 2 characters",
        emailRequired: "Email is required",
        emailInvalid: "Please enter a valid email address",
        sizeRequired: "Please select a canvas size",
        imagesRequired: "Please upload at least 1 image",
        allFieldsRequired: "Please fill in all required customer information",
        canvasIncomplete: "Please complete all canvas requirements (size and at least 1 image)",
        maxImagesError: "Maximum 6 images allowed per canvas",
        
        // Discount Messages
        discountText3: "Great! You get 5% OFF for ordering 3+ canvas!",
        discountText5: "Amazing! You get 12% OFF for ordering 5+ canvas!",
        
        // Status Messages
        submitting: "Submitting...",
        submitError: "There was an error submitting your order. Please try again.",
        
        // Progress Steps
        progressCanvasType: "Canvas Type",
        progressSize: "Size",
        progressUpload: "Upload",
        progressDetails: "Details",
        progressSubmit: "Submit",
        
        // Accessibility Labels
        selectSizeAriaLabel: "Select {size} inch canvas for ${price}",
        selectSizeBestSellerAriaLabel: "Select {size} inch canvas for ${price}, Best Seller",
        switchCanvasAriaLabel: "Switch to Canvas {number}",
        deleteImageAriaLabel: "Delete image {number}",
        uploadImagesAriaLabel: "Click to upload images",
        customTextHelp: "Enter custom text to display on your canvas",
        dateHelp: "Enter a date to display on your canvas"
    },
    
    es: {
        // Promotional Banner
        promoText: "🎁 Oferta Especial: ¡Ordena 3+ lienzos y obtén 5% DE DESCUENTO! ¡Ordena 5+ lienzos y obtén 12% DE DESCUENTO! 🎁",
        
        // Canvas Type Selection
        canvasType: "Seleccionar Tipo de Lienzo",
        singleCanvas: "Lienzo Individual",
        multiCanvas: "Múltiples Lienzos Diferentes",
        collageCanvas: "Collage de Múltiples Imágenes",
        
        // Canvas Configuration
        selectQuantity: "¿Cuántos lienzos diferentes?",
        selectSize: "Seleccionar Tamaño *",
        bestSeller: "Más Vendido",
        twoPersonLabel: "2 personas en 1 lienzo (+$10)",
        
        // Upload Section
        uploadImages: "Subir Imágenes *",
        uploadText: "Haz clic para subir imágenes (Máx 6)",
        uploadSubtext: "Soporta JPG, PNG - Se recortará en proporción 8:10",
        
        // Form Fields
        customText: "Ingresa tu texto",
        customTextPlaceholder: "ej., Para Siempre Juntos",
        date: "Fecha",
        datePlaceholder: "ej., 25 de Dic, 2024",
        welcomeHome: "Bienvenido a Casa",
        notes: "Notas Adicionales",
        notesPlaceholder: "Instrucciones especiales...",
        
        // Customer Information
        customerInfo: "Información del Cliente",
        fbName: "Tu nombre de Facebook *",
        fbNamePlaceholder: "Ingresa tu nombre de Facebook",
        email: "Correo Electrónico *",
        emailPlaceholder: "tu@correo.com",
        
        // Preview & Pricing
        preview: "Vista Previa del Lienzo",
        previewNotice: "Esta es solo una vista previa de tu texto personalizado. La vista previa final del lienzo se enviará a tu correo electrónico y Messenger.",
        estimatedTotal: "Total Estimado",
        
        // Buttons & Actions
        submit: "Enviar Pedido",
        confirmOrder: "Revisar Tu Pedido",
        confirmSubmit: "Confirmar Pedido",
        goBack: "Regresar",
        cancel: "Cancelar",
        apply: "Aplicar Recorte",
        cropImage: "Recortar Tu Imagen",
        
        // FAQ System
        faqButton: "❓ FAQ",
        faqTitle: "Preguntas Frecuentes",
        backToForm: "Volver al Formulario",
        
        // FAQ Content
        shippingTitle: "🚚 Envío",
        deliveryTime: "Tiempo de Entrega:",
        usDelivery: "EE.UU.: 5–10 días hábiles",
        intlDelivery: "Internacional: 7–15 días hábiles",
        orderTracking: "Seguimiento del Pedido: Enviado por correo automáticamente después de la compra",
        securePackaging: "Empaque Seguro: Resistente a golpes, a prueba de humedad y listo para regalo",
        
        paymentTitle: "💳 Pago",
        acceptedMethods: "Métodos Aceptados:",
        creditCards: "Tarjetas de Crédito / Débito",
        paypal: "PayPal",
        applePay: "Apple Pay",
        secureCheckout: "Pago Seguro: Todos los pagos están encriptados y procesados de forma segura",
        fastEasy: "Rápido y Fácil: No se necesita cuenta — solo unos pocos pasos rápidos",
        
        howItWorksTitle: "🧑‍🎨 Cómo Funciona",
        noLivePreview: "Este lienzo no soporta vistas previas en vivo — ¡pero no te preocupes!",
        designerEnhance: "✅ Nuestros diseñadores mejorarán tu foto para que se vea increíble.",
        completeDetails: "📝 Una vez que hayas completado los detalles del lienzo,",
        emailPreview: "📩 Recibirás una vista previa por correo en 1–2 días hábiles.",
        requestEdits: "🖼️ Puedes solicitar ediciones hasta estar completamente satisfecho.",
        finalizeOrder: "✅ Finaliza tu pedido y nosotros nos encargamos del resto.",
        
        // Thank You Page
        thankYouTitle: "¡Gracias!",
        thankYouMessage: "Tu pedido ha sido recibido exitosamente. Te enviaremos la vista previa de tu lienzo a tu correo electrónico y Messenger en 2-3 días hábiles.",
        newOrder: "Hacer Otro Pedido",
        
        // Validation Messages
        fbNameRequired: "El nombre de Facebook es requerido",
        fbNameTooShort: "El nombre de Facebook debe tener al menos 2 caracteres",
        emailRequired: "El correo electrónico es requerido",
        emailInvalid: "Por favor ingresa una dirección de correo válida",
        sizeRequired: "Por favor selecciona un tamaño de lienzo",
        imagesRequired: "Por favor sube al menos 1 imagen",
        allFieldsRequired: "Por favor completa toda la información requerida del cliente",
        canvasIncomplete: "Por favor completa todos los requisitos del lienzo (tamaño y al menos 1 imagen)",
        maxImagesError: "Máximo 6 imágenes permitidas por lienzo",
        
        // Discount Messages
        discountText3: "¡Genial! ¡Obtienes 5% DE DESCUENTO por ordenar 3+ lienzos!",
        discountText5: "¡Increíble! ¡Obtienes 12% DE DESCUENTO por ordenar 5+ lienzos!",
        
        // Status Messages
        submitting: "Enviando...",
        submitError: "Hubo un error al enviar tu pedido. Por favor intenta de nuevo.",
        
        // Progress Steps
        progressCanvasType: "Tipo de Lienzo",
        progressSize: "Tamaño",
        progressUpload: "Subir",
        progressDetails: "Detalles",
        progressSubmit: "Enviar",
        
        // Accessibility Labels
        selectSizeAriaLabel: "Seleccionar lienzo de {size} pulgadas por ${price}",
        selectSizeBestSellerAriaLabel: "Seleccionar lienzo de {size} pulgadas por ${price}, Más Vendido",
        switchCanvasAriaLabel: "Cambiar al Lienzo {number}",
        deleteImageAriaLabel: "Eliminar imagen {number}",
        uploadImagesAriaLabel: "Haz clic para subir imágenes",
        customTextHelp: "Ingresa texto personalizado para mostrar en tu lienzo",
        dateHelp: "Ingresa una fecha para mostrar en tu lienzo"
    }
};

// Language Detection and Initialization
function initializeLanguage() {
    let detectedLang = defaultLanguage;
    
    // Priority 1: URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang') || urlParams.get('language');
    
    if (urlLang && translations[urlLang]) {
        detectedLang = urlLang;
    } else {
        // Priority 2: Saved preference
        const savedLang = localStorage.getItem('preferredLanguage');
        if (savedLang && translations[savedLang]) {
            detectedLang = savedLang;
        } else {
            // Priority 3: Browser language detection
            const browserLang = navigator.language || navigator.userLanguage;
            
            // Check for Spanish variants
            if (browserLang.startsWith('es')) {
                detectedLang = 'es';
            } else if (browserLang.startsWith('en')) {
                detectedLang = 'en';
            }
            
            // Priority 4: Geo-location based (optional - can be enhanced with IP detection)
            // This would require an external service for IP geolocation
            // For now, we'll rely on browser language
        }
    }
    
    // Set current language
    currentLanguage = detectedLang;
    
    // Apply translations
    translatePage();
    
    // Save preference
    localStorage.setItem('preferredLanguage', currentLanguage);
    
    // Update URL parameter without reload
    updateURLLanguage(currentLanguage);
    
    console.log('Language initialized:', currentLanguage);
}

// Update URL parameter
function updateURLLanguage(langCode) {
    const url = new URL(window.location);
    url.searchParams.set('lang', langCode);
    window.history.replaceState({}, '', url);
}

// Main Translation Function
function translatePage() {
    // Translate text content
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        const translation = getTranslation(key);
        
        if (translation) {
            if (element.tagName === 'INPUT' && (element.type === 'submit' || element.type === 'button')) {
                element.value = translation;
            } else if (element.innerHTML.includes('<')) {
                // Handle HTML content carefully
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = element.innerHTML;
                const textNode = tempDiv.childNodes[0];
                if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                    textNode.textContent = translation;
                    element.innerHTML = tempDiv.innerHTML;
                } else {
                    element.textContent = translation;
                }
            } else {
                element.textContent = translation;
            }
        }
    });
    
    // Translate placeholders
    document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        const translation = getTranslation(key);
        
        if (translation) {
            element.placeholder = translation;
        }
    });
    
    // Translate aria-labels
    document.querySelectorAll('[data-translate-aria]').forEach(element => {
        const key = element.getAttribute('data-translate-aria');
        const translation = getTranslation(key);
        
        if (translation) {
            element.setAttribute('aria-label', translation);
        }
    });
    
    // Update progress step labels
    updateProgressStepLabels();
    
    // Update size option aria-labels
    updateSizeOptionLabels();
}

// Update progress step labels
function updateProgressStepLabels() {
    const stepLabels = document.querySelectorAll('.step-label');
    const stepKeys = ['progressCanvasType', 'progressSize', 'progressUpload', 'progressDetails', 'progressSubmit'];
    
    stepLabels.forEach((label, index) => {
        if (stepKeys[index]) {
            const translation = getTranslation(stepKeys[index]);
            if (translation) {
                label.textContent = translation;
            }
        }
    });
}

// Update size option aria-labels
function updateSizeOptionLabels() {
    document.querySelectorAll('.size-option').forEach(option => {
        const size = option.getAttribute('data-size');
        const priceElement = option.querySelector('.size-price');
        const isBestSeller = option.querySelector('.best-seller');
        
        if (size && priceElement) {
            const price = priceElement.textContent.replace('$', '');
            const templateKey = isBestSeller ? 'selectSizeBestSellerAriaLabel' : 'selectSizeAriaLabel';
            const template = getTranslation(templateKey);
            
            if (template) {
                const ariaLabel = template
                    .replace('{size}', size)
                    .replace('{price}', price);
                option.setAttribute('aria-label', ariaLabel);
            }
        }
    });
}

// Get Translation with Fallback
function getTranslation(key) {
    // Try current language
    if (translations[currentLanguage] && translations[currentLanguage][key]) {
        return translations[currentLanguage][key];
    }
    
    // Fallback to English
    if (translations[defaultLanguage] && translations[defaultLanguage][key]) {
        return translations[defaultLanguage][key];
    }
    
    // Return key if no translation found
    console.warn(`Translation not found for key: ${key} in language: ${currentLanguage}`);
    return key;
}

// Translation Function for JavaScript with parameter replacement
function t(key, params = {}) {
    let translation = getTranslation(key);
    
    // Handle parameter replacement
    Object.keys(params).forEach(param => {
        const placeholder = `{${param}}`;
        translation = translation.replace(new RegExp(placeholder, 'g'), params[param]);
    });
    
    return translation;
}

// Change Language Function
function changeLanguage(langCode) {
    if (translations[langCode]) {
        currentLanguage = langCode;
        translatePage();
        localStorage.setItem('preferredLanguage', langCode);
        updateURLLanguage(langCode);
        
        // Dispatch event for other components
        document.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { language: langCode } 
        }));
        
        console.log('Language changed to:', langCode);
    } else {
        console.warn('Language not supported:', langCode);
    }
}

// Helper Functions for Integration with script.js
function updateDiscountNotification(quantity) {
    const notification = document.getElementById('discountNotification');
    if (!notification) return;
    
    const textElement = notification.querySelector('.discount-text');
    if (!textElement) return;
    
    if (quantity >= 5) {
        textElement.textContent = t('discountText5');
        notification.style.display = 'block';
    } else if (quantity >= 3) {
        textElement.textContent = t('discountText3');
        notification.style.display = 'block';
    } else {
        notification.style.display = 'none';
    }
}

function showValidationError(elementId, messageKey) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = t(messageKey);
        errorElement.classList.add('show');
        
        // Add ARIA live region for screen readers
        errorElement.setAttribute('aria-live', 'polite');
        errorElement.setAttribute('role', 'alert');
    }
}

function hideValidationError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.classList.remove('show');
        errorElement.removeAttribute('aria-live');
        errorElement.removeAttribute('role');
    }
}

// Format Currency based on language
function formatCurrency(amount) {
    const locale = currentLanguage === 'es' ? 'es-MX' : 'en-US';
    return new Intl.NumberFormat(locale, { 
        style: 'currency', 
        currency: 'USD' 
    }).format(amount);
}

// Get Current Language
function getCurrentLanguage() {
    return currentLanguage;
}

// Detect language from various sources
function detectLanguageFromSources() {
    // This function can be enhanced with additional detection methods
    
    // IP-based geolocation (would require external service)
    // Example: MaxMind, IPInfo, etc.
    
    // For now, return browser-based detection
    const browserLang = navigator.language || navigator.userLanguage;
    
    if (browserLang.startsWith('es')) {
        return 'es';
    } else {
        return 'en';
    }
}

// Language switcher utility (can be used to add language selector UI)
function createLanguageSwitcher() {
    const switcher = document.createElement('div');
    switcher.className = 'language-switcher';
    switcher.innerHTML = `
        <select onchange="changeLanguage(this.value)" aria-label="Select Language">
            <option value="en" ${currentLanguage === 'en' ? 'selected' : ''}>English</option>
            <option value="es" ${currentLanguage === 'es' ? 'selected' : ''}>Español</option>
        </select>
    `;
    
    return switcher;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeLanguage();
    
    // Watch for dynamic content changes
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Translate newly added elements
                        const elementsToTranslate = node.querySelectorAll('[data-translate]');
                        elementsToTranslate.forEach(element => {
                            const key = element.getAttribute('data-translate');
                            const translation = getTranslation(key);
                            if (translation) {
                                element.textContent = translation;
                            }
                        });
                        
                        // Translate placeholders in new elements
                        const placeholderElements = node.querySelectorAll('[data-translate-placeholder]');
                        placeholderElements.forEach(element => {
                            const key = element.getAttribute('data-translate-placeholder');
                            const translation = getTranslation(key);
                            if (translation) {
                                element.placeholder = translation;
                            }
                        });
                        
                        // Translate aria-labels in new elements
                        const ariaElements = node.querySelectorAll('[data-translate-aria]');
                        ariaElements.forEach(element => {
                            const key = element.getAttribute('data-translate-aria');
                            const translation = getTranslation(key);
                            if (translation) {
                                element.setAttribute('aria-label', translation);
                            }
                        });
                    }
                });
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

// Handle language change events
document.addEventListener('languageChanged', function(e) {
    console.log('Language changed event received:', e.detail.language);
    
    // Update any language-dependent components
    updateDiscountNotification(getCurrentCanvasQuantity());
    
    // Update size option labels
    updateSizeOptionLabels();
    
    // Update progress indicators
    updateProgressStepLabels();
});

// Utility function to get current canvas quantity
function getCurrentCanvasQuantity() {
    const quantitySelect = document.getElementById('canvasQuantity');
    if (quantitySelect && quantitySelect.style.display !== 'none') {
        return parseInt(quantitySelect.value) || 1;
    }
    return 1;
}

// Export functions for global use
window.translations = {
    t,
    changeLanguage,
    getCurrentLanguage,
    updateDiscountNotification,
    showValidationError,
    hideValidationError,
    formatCurrency,
    translatePage,
    initializeLanguage,
    createLanguageSwitcher,
    detectLanguageFromSources
};

// Auto-detect and set language on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLanguage);
} else {
    initializeLanguage();
}
