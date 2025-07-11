// Global Variables and Configuration
let currentCanvasIndex = 0;
let canvasData = {};
let cropper = null;
let currentCropImageIndex = 0;
let formState = {}; // For data persistence

// Canvas Size Configuration with EXACT pricing
const canvasSizes = {
    "8x10": { price: 34, label: "8x10\" - $34" },
    "11x14": { price: 43, label: "11x14\" - $43 (Best Seller)" },
    "16x20": { price: 62, label: "16x20\" - $62" },
    "20x30": { price: 82, label: "20x30\" - $82" }
};

// Background images
const canvasImages = {
    single: 'canvas-bg-single.jpg',
    couple: 'canvas-bg-couple.jpg',
    welcomeHome: 'welcome-home-overlay.png'
};

// Progress steps configuration
const progressSteps = [
    { id: 'canvas-type', label: 'Canvas Type', required: true },
    { id: 'size', label: 'Size', required: true },
    { id: 'upload', label: 'Upload', required: true },
    { id: 'details', label: 'Details', required: false },
    { id: 'submit', label: 'Submit', required: false }
];

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    autoFillFacebookName();
    setupEventListeners();
    initializeCanvas(0);
    initializeProgressIndicators();
    updatePreview(0);
    loadFonts();
    detectAndSetLanguage();
});

// Language Detection and Setup
function detectAndSetLanguage() {
    let detectedLang = 'en'; // Default
    
    // Priority 1: URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang') || urlParams.get('language');
    
    if (urlLang === 'es') {
        detectedLang = 'es';
    } else if (urlLang === 'en') {
        detectedLang = 'en';
    } else {
        // Priority 2: Browser language
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang.startsWith('es')) {
            detectedLang = 'es';
        }
        
        // Priority 3: Saved preference
        const savedLang = localStorage.getItem('preferredLanguage');
        if (savedLang && (savedLang === 'es' || savedLang === 'en')) {
            detectedLang = savedLang;
        }
    }
    
    // Set language
    if (window.translations && window.translations.changeLanguage) {
        window.translations.changeLanguage(detectedLang);
    }
}

// Initialize Progress Indicators
function initializeProgressIndicators() {
    const container = document.querySelector('.form-container');
    if (!container) return;
    
    const progressHTML = `
        <div class="progress-container">
            <div class="progress-steps">
                <div class="progress-line">
                    <div class="progress-line-fill"></div>
                </div>
                ${progressSteps.map((step, index) => `
                    <div class="progress-step" data-step="${step.id}">
                        <div class="step-circle" data-step="${step.id}">
                            ${index + 1}
                        </div>
                        <div class="step-label" data-step="${step.id}">
                            ${step.label}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('afterbegin', progressHTML);
    updateProgressIndicators();
}

// Update Progress Indicators
function updateProgressIndicators() {
    const canvasType = document.getElementById('canvasType')?.value;
    const hasSize = canvasData[currentCanvasIndex]?.size;
    const hasImages = canvasData[currentCanvasIndex]?.images?.length > 0;
    const hasCustomerInfo = document.getElementById('fbName')?.value && document.getElementById('email')?.value;
    
    const progress = {
        'canvas-type': !!canvasType,
        'size': !!hasSize,
        'upload': !!hasImages,
        'details': true, // Always true as it's optional
        'submit': hasCustomerInfo && hasSize && hasImages
    };
    
    let completedSteps = 0;
    const totalSteps = progressSteps.length;
    
    progressSteps.forEach((step, index) => {
        const circle = document.querySelector(`.step-circle[data-step="${step.id}"]`);
        const label = document.querySelector(`.step-label[data-step="${step.id}"]`);
        
        if (circle && label) {
            if (progress[step.id]) {
                circle.classList.add('completed');
                circle.classList.remove('active');
                completedSteps++;
            } else {
                circle.classList.remove('completed');
                circle.classList.add('active');
            }
            
            if (progress[step.id]) {
                label.classList.add('active');
            } else {
                label.classList.remove('active');
            }
        }
    });
    
    // Update progress line
    const progressLine = document.querySelector('.progress-line-fill');
    if (progressLine) {
        const percentage = (completedSteps / totalSteps) * 100;
        progressLine.style.width = `${percentage}%`;
    }
}

// Load custom fonts
function loadFonts() {
    if (document.fonts) {
        document.fonts.ready.then(() => {
            console.log('Fonts loaded successfully');
            updatePreview(currentCanvasIndex);
        }).catch(err => {
            console.warn('Font loading failed:', err);
        });
    }
}

// Auto-fill Facebook name from URL parameter
function autoFillFacebookName() {
    const urlParams = new URLSearchParams(window.location.search);
    const fbName = urlParams.get('fbName') || urlParams.get('name');
    
    if (fbName) {
        const fbNameInput = document.getElementById('fbName');
        if (fbNameInput) {
            fbNameInput.value = decodeURIComponent(fbName);
            validateFacebookName();
        }
    }
}

// Initialize form with default values
function initializeForm() {
    // Initialize canvas data for first canvas
    canvasData[0] = {
        canvasType: 'single',
        size: null,
        basePrice: 0,
        twoPersonCanvas: false,
        images: [],
        customText: '',
        date: '',
        welcomeHome: false,
        totalPrice: 0
    };
    
    // Set default canvas type
    const canvasTypeSelect = document.getElementById('canvasType');
    if (canvasTypeSelect) {
        canvasTypeSelect.value = 'single';
    }
    
    // Show appropriate sections
    showCanvasTypeSections('single');
    
    // Initialize preview canvas
    loadBackgroundImage('single');
    
    // Save initial form state
    saveFormState();
}

// Save form state for persistence
function saveFormState() {
    const fbName = document.getElementById('fbName')?.value || '';
    const email = document.getElementById('email')?.value || '';
    const notes = document.getElementById('notes')?.value || '';
    
    formState = {
        customerInfo: { fbName, email, notes },
        canvasData: JSON.parse(JSON.stringify(canvasData))
    };
}

// Restore form state
function restoreFormState() {
    if (formState.customerInfo) {
        const fbNameInput = document.getElementById('fbName');
        const emailInput = document.getElementById('email');
        const notesInput = document.getElementById('notes');
        
        if (fbNameInput) fbNameInput.value = formState.customerInfo.fbName || '';
        if (emailInput) emailInput.value = formState.customerInfo.email || '';
        if (notesInput) notesInput.value = formState.customerInfo.notes || '';
    }
    
    // Restore canvas data for first canvas if switching back to single
    if (formState.canvasData && formState.canvasData[0]) {
        const firstCanvas = formState.canvasData[0];
        if (firstCanvas.size) {
            selectSize(firstCanvas.size, 0);
        }
        if (firstCanvas.images && firstCanvas.images.length > 0) {
            canvasData[0].images = [...firstCanvas.images];
            updateImageThumbnails(0);
        }
        if (firstCanvas.customText) {
            const textInput = document.getElementById('customText-0');
            if (textInput) textInput.value = firstCanvas.customText;
        }
        if (firstCanvas.date) {
            const dateInput = document.getElementById('date-0');
            if (dateInput) dateInput.value = firstCanvas.date;
        }
        if (firstCanvas.welcomeHome) {
            const welcomeInput = document.getElementById('welcomeHome-0');
            if (welcomeInput) welcomeInput.checked = firstCanvas.welcomeHome;
        }
        if (firstCanvas.twoPersonCanvas) {
            const twoPersonInput = document.getElementById('twoPersonCanvas-0');
            if (twoPersonInput) twoPersonInput.checked = firstCanvas.twoPersonCanvas;
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    // Real-time validation
    const fbNameInput = document.getElementById('fbName');
    const emailInput = document.getElementById('email');
    
    if (fbNameInput) fbNameInput.addEventListener('input', validateFacebookName);
    if (emailInput) emailInput.addEventListener('input', validateEmail);
    
    // Save state on input changes
    document.addEventListener('input', function(e) {
        if (e.target.id === 'fbName' || e.target.id === 'email' || e.target.id === 'notes') {
            saveFormState();
        }
    });
    
    // Close modals when clicking outside
    const faqModal = document.getElementById('faqModal');
    const cropModal = document.getElementById('cropModal');
    const confirmModal = document.getElementById('confirmModal');
    
    if (faqModal) {
        faqModal.addEventListener('click', function(e) {
            if (e.target === this) closeFAQ();
        });
    }
    
    if (cropModal) {
        cropModal.addEventListener('click', function(e) {
            if (e.target === this) cancelCrop();
        });
    }
    
    if (confirmModal) {
        confirmModal.addEventListener('click', function(e) {
            if (e.target === this) closeConfirmModal();
        });
    }
    
    // Prevent zoom on input focus for mobile
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], textarea, select');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            if (window.innerWidth <= 768) {
                document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
            }
        });
        
        input.addEventListener('blur', function() {
            if (window.innerWidth <= 768) {
                document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1');
            }
        });
    });
}

// Handle canvas type change
function handleCanvasTypeChange() {
    const canvasType = document.getElementById('canvasType').value;
    
    // Save current form state before switching
    saveFormState();
    
    // Clear current canvas data except for first canvas if switching back to single
    if (canvasType === 'single') {
        // Keep only first canvas data
        const firstCanvas = canvasData[0];
        canvasData = { 0: firstCanvas || {} };
        currentCanvasIndex = 0;
        
        // Restore form state
        restoreFormState();
    } else {
        // Reset for multi/collage
        canvasData[currentCanvasIndex] = {
            canvasType: canvasType,
            size: null,
            basePrice: 0,
            twoPersonCanvas: false,
            images: [],
            customText: '',
            date: '',
            welcomeHome: false,
            totalPrice: 0
        };
    }
    
    // Update canvas type in data
    if (canvasData[currentCanvasIndex]) {
        canvasData[currentCanvasIndex].canvasType = canvasType;
    }
    
    // Show appropriate sections
    showCanvasTypeSections(canvasType);
    
    // Update preview
    loadBackgroundImage(canvasType === 'single' ? 'single' : 'single');
    updatePreview(currentCanvasIndex);
    updatePricing();
    updateProgressIndicators();
}

// Show/hide sections based on canvas type
function showCanvasTypeSections(canvasType) {
    const multiCanvasSection = document.getElementById('multiCanvasSection');
    const canvasTabs = document.getElementById('canvasTabs');
    const welcomeHomeSections = document.querySelectorAll('[id^="welcomeHomeSection-"]');
    const twoPersonSections = document.querySelectorAll('[id^="twoPersonSection-"]');
    const previewSection = document.getElementById('previewSection');
    
    if (canvasType === 'multi') {
        if (multiCanvasSection) multiCanvasSection.style.display = 'block';
        if (canvasTabs) canvasTabs.style.display = 'flex';
        welcomeHomeSections.forEach(section => section.style.display = 'block');
        twoPersonSections.forEach(section => section.style.display = 'block');
        if (previewSection) previewSection.classList.remove('collage-mode');
    } else if (canvasType === 'collage') {
        if (multiCanvasSection) multiCanvasSection.style.display = 'none';
        if (canvasTabs) canvasTabs.style.display = 'none';
        welcomeHomeSections.forEach(section => section.style.display = 'none');
        twoPersonSections.forEach(section => section.style.display = 'none');
        if (previewSection) previewSection.classList.add('collage-mode');
    } else {
        if (multiCanvasSection) multiCanvasSection.style.display = 'none';
        if (canvasTabs) canvasTabs.style.display = 'none';
        welcomeHomeSections.forEach(section => section.style.display = 'block');
        twoPersonSections.forEach(section => section.style.display = 'block');
        if (previewSection) previewSection.classList.remove('collage-mode');
    }
}

// Update canvas count for multi-canvas
function updateCanvasCount() {
    const quantity = parseInt(document.getElementById('canvasQuantity').value);
    const tabsContainer = document.getElementById('canvasTabs');
    const itemsContainer = document.getElementById('canvasItemsContainer');
    
    // Clear existing tabs
    if (tabsContainer) tabsContainer.innerHTML = '';
    
    // Hide all existing canvas items
    document.querySelectorAll('.canvas-item').forEach(item => {
        item.style.display = 'none';
    });
    
    // Create new tabs and ensure canvas items exist
    for (let i = 0; i < quantity; i++) {
        createCanvasTab(i);
        
        // Check if canvas item exists, if not create it
        const existingItem = document.querySelector(`[data-canvas="${i}"]`);
        if (!existingItem) {
            createCanvasItem(i);
        }
        
        // Initialize canvas data if not exists
        if (!canvasData[i]) {
            canvasData[i] = {
                canvasType: 'multi',
                size: null,
                basePrice: 0,
                twoPersonCanvas: false,
                images: [],
                customText: '',
                date: '',
                welcomeHome: false,
                totalPrice: 0
            };
        }
    }
    
    // Show first canvas
    switchCanvas(0);
    
    // Show discount notification
    showDiscountNotification(quantity);
    updateProgressIndicators();
}

// Create canvas tab
function createCanvasTab(index) {
    const tabsContainer = document.getElementById('canvasTabs');
    if (!tabsContainer) return;
    
    const tab = document.createElement('div');
    tab.className = index === 0 ? 'tab active' : 'tab';
    tab.textContent = `Canvas ${index + 1}`;
    tab.onclick = () => switchCanvas(index);
    tab.setAttribute('tabindex', '0');
    tab.setAttribute('role', 'button');
    tab.setAttribute('aria-label', `Switch to Canvas ${index + 1}`);
    
    // Keyboard navigation
    tab.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            switchCanvas(index);
        }
    });
    
    tabsContainer.appendChild(tab);
}

// Create canvas item
function createCanvasItem(index) {
    const itemsContainer = document.getElementById('canvasItemsContainer');
    if (!itemsContainer) return;
    
    const canvasItem = document.createElement('div');
    canvasItem.className = 'canvas-item';
    canvasItem.setAttribute('data-canvas', index);
    canvasItem.style.display = index === 0 ? 'block' : 'none';
    
    canvasItem.innerHTML = `
        <!-- Size Selection -->
        <div class="form-section">
            <h2 data-translate="selectSize">Select Size *</h2>
            <div class="size-grid">
                <div class="size-option" data-size="8x10" onclick="selectSize('8x10', ${index})" tabindex="0" role="button" aria-label="Select 8x10 inch canvas for $34">
                    <div class="size-label">8x10"</div>
                    <div class="size-price" data-base-price="34">$34</div>
                </div>
                <div class="size-option" data-size="11x14" onclick="selectSize('11x14', ${index})" tabindex="0" role="button" aria-label="Select 11x14 inch canvas for $43, Best Seller">
                    <div class="size-label">11x14"</div>
                    <div class="size-price" data-base-price="43">$43</div>
                    <div class="best-seller" data-translate="bestSeller">Best Seller</div>
                </div>
                <div class="size-option" data-size="16x20" onclick="selectSize('16x20', ${index})" tabindex="0" role="button" aria-label="Select 16x20 inch canvas for $62">
                    <div class="size-label">16x20"</div>
                    <div class="size-price" data-base-price="62">$62</div>
                </div>
                <div class="size-option" data-size="20x30" onclick="selectSize('20x30', ${index})" tabindex="0" role="button" aria-label="Select 20x30 inch canvas for $82">
                    <div class="size-label">20x30"</div>
                    <div class="size-price" data-base-price="82">$82</div>
                </div>
            </div>
            <div class="validation-error" id="size-error-${index}"></div>
        </div>

        <!-- Two Person Canvas Checkbox -->
        <div class="form-section" id="twoPersonSection-${index}">
            <div class="checkbox-wrapper">
                <input type="checkbox" id="twoPersonCanvas-${index}" onchange="handleTwoPersonChange(${index})" aria-describedby="twoPersonLabel-${index}">
                <label for="twoPersonCanvas-${index}" id="twoPersonLabel-${index}" data-translate="twoPersonLabel">2 people on 1 canvas (+$10)</label>
            </div>
        </div>

        <!-- Image Upload -->
        <div class="form-section">
            <h2 data-translate="uploadImages">Upload Images *</h2>
            <div class="upload-container">
                <div class="upload-area" onclick="triggerFileInput(${index})" tabindex="0" role="button" aria-label="Click to upload images">
                    <div class="upload-icon">📷</div>
                    <div class="upload-text" data-translate="uploadText">Click to upload images (Max 6)</div>
                    <div class="upload-subtext" data-translate="uploadSubtext">Supports JPG, PNG - Will be cropped to 8:10 ratio</div>
                </div>
                <input type="file" id="imageInput-${index}" multiple accept="image/*" style="display: none;" onchange="handleImageUpload(event, ${index})" aria-label="Select image files">
                <div class="image-thumbnails" id="imageThumbnails-${index}" role="list" aria-label="Uploaded images"></div>
            </div>
            <div class="validation-error" id="image-error-${index}"></div>
        </div>

        <!-- Custom Text -->
        <div class="form-section">
            <div class="form-group">
                <label for="customText-${index}" data-translate="customText">Enter your text</label>
                <input type="text" id="customText-${index}" placeholder="e.g., Forever Together" onkeyup="updatePreview(${index})" data-translate-placeholder="customTextPlaceholder" aria-describedby="customTextHelp-${index}">
                <div id="customTextHelp-${index}" class="sr-only">Enter custom text to display on your canvas</div>
            </div>
        </div>

        <!-- Date -->
        <div class="form-section">
            <div class="form-group">
                <label for="date-${index}" data-translate="date">Date</label>
                <input type="text" id="date-${index}" placeholder="e.g., Dec 25, 2024" onkeyup="updatePreview(${index})" data-translate-placeholder="datePlaceholder" aria-describedby="dateHelp-${index}">
                <div id="dateHelp-${index}" class="sr-only">Enter a date to display on your canvas</div>
            </div>
        </div>

        <!-- Welcome Home -->
        <div class="form-section" id="welcomeHomeSection-${index}">
            <div class="checkbox-wrapper">
                <input type="checkbox" id="welcomeHome-${index}" onchange="handleWelcomeHomeChange(${index})" aria-describedby="welcomeHomeLabel-${index}">
                <label for="welcomeHome-${index}" id="welcomeHomeLabel-${index}" data-translate="welcomeHome">Welcome Home</label>
            </div>
        </div>
    `;
    
    // Add keyboard navigation for size options
    const sizeOptions = canvasItem.querySelectorAll('.size-option');
    sizeOptions.forEach(option => {
        option.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const size = this.getAttribute('data-size');
                selectSize(size, index);
            }
        });
    });
    
    // Add keyboard navigation for upload area
    const uploadArea = canvasItem.querySelector('.upload-area');
    if (uploadArea) {
        uploadArea.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                triggerFileInput(index);
            }
        });
    }
    
    itemsContainer.appendChild(canvasItem);
    
    // Translate new content
    if (window.translations && window.translations.translatePage) {
        window.translations.translatePage();
    }
}

// Switch between canvas tabs
function switchCanvas(index) {
    currentCanvasIndex = index;
    
    // Update tab active state
    document.querySelectorAll('.tab').forEach((tab, i) => {
        tab.classList.toggle('active', i === index);
        tab.setAttribute('aria-selected', i === index);
    });
    
    // Show/hide canvas items
    document.querySelectorAll('.canvas-item').forEach((item, i) => {
        item.style.display = i === index ? 'block' : 'none';
    });
    
    // Update preview
    updatePreview(index);
    updatePricing();
    updateProgressIndicators();
}

// Select canvas size
function selectSize(size, canvasIndex) {
    // Remove previous selection
    document.querySelectorAll(`[data-canvas="${canvasIndex}"] .size-option`).forEach(option => {
        option.classList.remove('selected');
        option.setAttribute('aria-selected', 'false');
    });
    
    // Add selection to clicked option
    const selectedOption = document.querySelector(`[data-canvas="${canvasIndex}"] .size-option[data-size="${size}"]`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
        selectedOption.setAttribute('aria-selected', 'true');
    }
    
    // Update canvas data
    if (!canvasData[canvasIndex]) {
        canvasData[canvasIndex] = {};
    }
    canvasData[canvasIndex].size = size;
    canvasData[canvasIndex].basePrice = canvasSizes[size].price;
    
    // Clear size validation error
    const errorElement = document.getElementById(`size-error-${canvasIndex}`);
    if (errorElement) {
        errorElement.classList.remove('show');
    }
    
    // Update pricing
    updatePricing();
    updateProgressIndicators();
}

// Handle two person canvas change
function handleTwoPersonChange(canvasIndex) {
    const checkbox = document.getElementById(`twoPersonCanvas-${canvasIndex}`);
    const isChecked = checkbox ? checkbox.checked : false;
    
    // Update canvas data
    if (!canvasData[canvasIndex]) {
        canvasData[canvasIndex] = {};
    }
    canvasData[canvasIndex].twoPersonCanvas = isChecked;
    
    // Update size prices display
    updateSizePrices(canvasIndex, isChecked);
    
    // Update background image
    const canvasType = document.getElementById('canvasType').value;
    if (canvasType === 'single' || canvasType === 'multi') {
        loadBackgroundImage(isChecked ? 'couple' : 'single');
    }
    
    // Update pricing
    updatePricing();
}

// Update size prices display
function updateSizePrices(canvasIndex, addTenDollars) {
    const sizeOptions = document.querySelectorAll(`[data-canvas="${canvasIndex}"] .size-option`);
    
    sizeOptions.forEach(option => {
        const priceElement = option.querySelector('.size-price');
        const basePrice = parseInt(priceElement.getAttribute('data-base-price'));
        const newPrice = addTenDollars ? basePrice + 10 : basePrice;
        priceElement.textContent = `$${newPrice}`;
        
        // Update aria-label
        const size = option.getAttribute('data-size');
        const isBestSeller = option.querySelector('.best-seller') ? ', Best Seller' : '';
        option.setAttribute('aria-label', `Select ${size} inch canvas for $${newPrice}${isBestSeller}`);
    });
}

// Trigger file input
function triggerFileInput(canvasIndex) {
    const fileInput = document.getElementById(`imageInput-${canvasIndex}`);
    if (fileInput) {
        fileInput.click();
    }
}

// Handle image upload
function handleImageUpload(event, canvasIndex) {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;
    
    // Check max limit
    const currentImages = canvasData[canvasIndex]?.images || [];
    const totalImages = currentImages.length + files.length;
    
    if (totalImages > 6) {
        const message = window.translations?.t ? window.translations.t('maxImagesError') : 'Maximum 6 images allowed per canvas';
        alert(message);
        return;
    }
    
    // Process each file
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            processImageFile(file, canvasIndex);
        }
    });
    
    // Clear file input
    event.target.value = '';
}

// Process image file
function processImageFile(file, canvasIndex) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        // Show crop modal
        const cropModal = document.getElementById('cropModal');
        const cropImage = document.getElementById('cropImage');
        
        if (cropImage) {
            cropImage.src = e.target.result;
        }
        if (cropModal) {
            cropModal.style.display = 'block';
            // Add aria-hidden to main content
            document.querySelector('.container').setAttribute('aria-hidden', 'true');
        }
        
        // Initialize cropper with 8:10 ratio
        setTimeout(() => {
            if (cropper) {
                cropper.destroy();
            }
            
            if (cropImage) {
                cropper = new Cropper(cropImage, {
                    aspectRatio: 8 / 10,
                    viewMode: 1,
                    autoCropArea: 1,
                    responsive: true,
                    background: false,
                    checkOrientation: false
                });
            }
            
            // Store current context
            currentCropImageIndex = canvasIndex;
        }, 100);
    };
    
    reader.readAsDataURL(file);
}

// Apply crop
function applyCrop() {
    if (!cropper) return;
    
    const canvas = cropper.getCroppedCanvas({
        width: 400,
        height: 500,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
    });
    
    const croppedImageData = canvas.toDataURL('image/jpeg', 0.9);
    
    // Add to canvas data
    if (!canvasData[currentCropImageIndex]) {
        canvasData[currentCropImageIndex] = { images: [] };
    }
    if (!canvasData[currentCropImageIndex].images) {
        canvasData[currentCropImageIndex].images = [];
    }
    
    canvasData[currentCropImageIndex].images.push({
        data: croppedImageData,
        id: Date.now() + Math.random()
    });
    
    // Update thumbnails
    updateImageThumbnails(currentCropImageIndex);
    
    // Clear image validation error
    const errorElement = document.getElementById(`image-error-${currentCropImageIndex}`);
    if (errorElement) {
        errorElement.classList.remove('show');
    }
    
    // Update preview
    updatePreview(currentCropImageIndex);
    updateProgressIndicators();
    
    // Close crop modal
    cancelCrop();
}

// Cancel crop
function cancelCrop() {
    const cropModal = document.getElementById('cropModal');
    if (cropModal) {
        cropModal.style.display = 'none';
        // Remove aria-hidden from main content
        document.querySelector('.container').removeAttribute('aria-hidden');
    }
    
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
}

// Update image thumbnails
function updateImageThumbnails(canvasIndex) {
    const container = document.getElementById(`imageThumbnails-${canvasIndex}`);
    if (!container) return;
    
    const images = canvasData[canvasIndex]?.images || [];
    
    container.innerHTML = '';
    
    images.forEach((image, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'image-thumbnail';
        thumbnail.setAttribute('role', 'listitem');
        thumbnail.innerHTML = `
            <img src="${image.data}" alt="Uploaded image ${index + 1}" loading="lazy">
            <button class="delete-btn" onclick="deleteImage(${canvasIndex}, ${index})" aria-label="Delete image ${index + 1}" title="Delete image">×</button>
        `;
        container.appendChild(thumbnail);
    });
}

// Delete image
function deleteImage(canvasIndex, imageIndex) {
    if (canvasData[canvasIndex] && canvasData[canvasIndex].images) {
        canvasData[canvasIndex].images.splice(imageIndex, 1);
        updateImageThumbnails(canvasIndex);
        updatePreview(canvasIndex);
        updateProgressIndicators();
    }
}

// Load background image
function loadBackgroundImage(type) {
    const canvas = document.getElementById('previewCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Update preview with current text
        updatePreview(currentCanvasIndex);
    };
    
    img.onerror = function() {
        console.error('Failed to load background image:', type);
        // Fallback to solid color
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        updatePreview(currentCanvasIndex);
    };
    
    // Set image source
    if (type === 'couple') {
        img.src = canvasImages.couple;
    } else if (type === 'single') {
        img.src = canvasImages.single;
    } else {
        // Collage mode - white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        updatePreview(currentCanvasIndex);
        return;
    }
}

// Update preview canvas
function updatePreview(canvasIndex) {
    const canvas = document.getElementById('previewCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const canvasType = document.getElementById('canvasType').value;
    
    // Set canvas size based on type and screen size
    if (canvasType === 'collage') {
        canvas.width = 500;
        canvas.height = 400;
    } else {
        // Mobile optimization
        if (window.innerWidth <= 768) {
            canvas.width = 300;
            canvas.height = 375;
        } else {
            canvas.width = 400;
            canvas.height = 500;
        }
    }
    
    if (canvasType === 'collage') {
        updateCollagePreview(canvasIndex);
        return;
    }
    
    // Get current canvas data
    const currentData = canvasData[canvasIndex] || {};
    const customTextInput = document.getElementById(`customText-${canvasIndex}`);
    const dateInput = document.getElementById(`date-${canvasIndex}`);
    const welcomeHomeInput = document.getElementById(`welcomeHome-${canvasIndex}`);
    
    const customText = customTextInput ? customTextInput.value : '';
    const date = dateInput ? dateInput.value : '';
    const welcomeHome = welcomeHomeInput ? welcomeHomeInput.checked : false;
    
    // Update canvas data
    if (canvasData[canvasIndex]) {
        canvasData[canvasIndex].customText = customText;
        canvasData[canvasIndex].date = date;
        canvasData[canvasIndex].welcomeHome = welcomeHome;
    }
    
    // Reload background first
    const bgType = currentData.twoPersonCanvas ? 'couple' : 'single';
    const bgImg = new Image();
    bgImg.crossOrigin = 'anonymous';
    
    bgImg.onload = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
        
        // Draw custom text (left-bottom position)
        if (customText) {
            drawCustomText(ctx, customText, canvas.width, canvas.height);
        }
        
        // Draw date (left-bottom position, smaller)
        if (date) {
            drawDate(ctx, date, canvas.width, canvas.height);
        }
        
        // Draw Welcome Home overlay
        if (welcomeHome) {
            drawWelcomeHomeOverlay(ctx, canvas.width, canvas.height);
        }
    };
    
    bgImg.src = bgType === 'couple' ? canvasImages.couple : canvasImages.single;
}

// Update collage preview
function updateCollagePreview(canvasIndex) {
    const canvas = document.getElementById('previewCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const currentData = canvasData[canvasIndex] || {};
    const images = currentData.images || [];
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw images side by side
    if (images.length > 0) {
        const imageWidth = canvas.width / images.length;
        
        images.forEach((imageData, index) => {
            const img = new Image();
            img.onload = function() {
                const x = index * imageWidth;
                const y = 0;
                ctx.drawImage(img, x, y, imageWidth, canvas.height);
                
                // Draw text overlay after all images
                if (index === images.length - 1) {
                    const customTextInput = document.getElementById(`customText-${canvasIndex}`);
                    const dateInput = document.getElementById(`date-${canvasIndex}`);
                    
                    const customText = customTextInput ? customTextInput.value : '';
                    const date = dateInput ? dateInput.value : '';
                    
                    if (customText) {
                        drawCustomText(ctx, customText, canvas.width, canvas.height);
                    }
                    
                    if (date) {
                        drawDate(ctx, date, canvas.width, canvas.height);
                    }
                }
            };
            img.src = imageData.data;
        });
    }
    
    // If no images, just draw text
    if (images.length === 0) {
        const customTextInput = document.getElementById(`customText-${canvasIndex}`);
        const dateInput = document.getElementById(`date-${canvasIndex}`);
        
        const customText = customTextInput ? customTextInput.value : '';
        const date = dateInput ? dateInput.value : '';
        
        if (customText) {
            drawCustomText(ctx, customText, canvas.width, canvas.height);
        }
        
        if (date) {
            drawDate(ctx, date, canvas.width, canvas.height);
        }
    }
}

// Draw custom text - Left-bottom position, black text with white border
function drawCustomText(ctx, text, canvasWidth, canvasHeight) {
    // Responsive font size
    const fontSize = window.innerWidth <= 768 ? 24 : 32;
    
    ctx.font = `${fontSize}px "TextFont", serif`;
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    
    const x = 20; // Left margin
    const y = canvasHeight - 60; // Bottom margin
    
    // Draw text with white border
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
}

// Draw date - Left-bottom position, smaller font, black text with white border
function drawDate(ctx, date, canvasWidth, canvasHeight) {
    // Responsive font size
    const fontSize = window.innerWidth <= 768 ? 16 : 20;
    
    ctx.font = `${fontSize}px "DateFont", serif`;
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    
    const x = 20; // Left margin
    const y = canvasHeight - 20; // Bottom margin, below text
    
    // Draw date with white border
    ctx.strokeText(date, x, y);
    ctx.fillText(date, x, y);
}

// Draw Welcome Home overlay
function drawWelcomeHomeOverlay(ctx, canvasWidth, canvasHeight) {
    const welcomeImg = new Image();
    welcomeImg.crossOrigin = 'anonymous';
    
    welcomeImg.onload = function() {
        // Draw Welcome Home overlay (positioned like in example)
        const overlayWidth = canvasWidth * 0.4;
        const overlayHeight = canvasHeight * 0.6;
        const x = canvasWidth - overlayWidth - 20;
        const y = 20;
        
        ctx.drawImage(welcomeImg, x, y, overlayWidth, overlayHeight);
    };
    
    welcomeImg.onerror = function() {
        console.error('Failed to load Welcome Home overlay');
    };
    
    welcomeImg.src = canvasImages.welcomeHome;
}

// Handle Welcome Home change
function handleWelcomeHomeChange(canvasIndex) {
    const checkbox = document.getElementById(`welcomeHome-${canvasIndex}`);
    const isChecked = checkbox ? checkbox.checked : false;
    
    // Update canvas data
    if (!canvasData[canvasIndex]) {
        canvasData[canvasIndex] = {};
    }
    canvasData[canvasIndex].welcomeHome = isChecked;
    
    // Update preview
    updatePreview(canvasIndex);
}

// Initialize canvas
function initializeCanvas(canvasIndex) {
    const canvas = document.getElementById('previewCanvas');
    if (!canvas) return;
    
    // Set canvas size
    canvas.width = 400;
    canvas.height = 500;
    
    // Load initial background
    loadBackgroundImage('single');
}

// Show discount notification
function showDiscountNotification(quantity) {
    const notification = document.getElementById('discountNotification');
    if (!notification) return;
    
    if (window.translations && window.translations.updateDiscountNotification) {
        window.translations.updateDiscountNotification(quantity);
    } else {
        const textElement = notification.querySelector('.discount-text');
        if (!textElement) return;
        
        if (quantity >= 5) {
            textElement.textContent = 'Amazing! You get 12% OFF for ordering 5+ canvas!';
            notification.style.display = 'block';
        } else if (quantity >= 3) {
            textElement.textContent = 'Great! You get 5% OFF for ordering 3+ canvas!';
            notification.style.display = 'block';
        } else {
            notification.style.display = 'none';
        }
    }
}

// Update pricing
function updatePricing() {
    let totalPrice = 0;
    let totalCanvases = 0;
    
    const canvasType = document.getElementById('canvasType').value;
    
    if (canvasType === 'multi') {
        const quantitySelect = document.getElementById('canvasQuantity');
        const quantity = quantitySelect ? parseInt(quantitySelect.value) : 1;
        
        for (let i = 0; i < quantity; i++) {
            const canvas = canvasData[i];
            if (canvas && canvas.size) {
                let price = canvas.basePrice;
                if (canvas.twoPersonCanvas) {
                    price += 10;
                }
                canvas.totalPrice = price;
                totalPrice += price;
                totalCanvases++;
            }
        }
    } else {
        const canvas = canvasData[0];
        if (canvas && canvas.size) {
            let price = canvas.basePrice;
            if (canvas.twoPersonCanvas) {
                price += 10;
            }
            canvas.totalPrice = price;
            totalPrice += price;
            totalCanvases = 1;
        }
    }
    
    // Apply discount
    let discount = 0;
    if (totalCanvases >= 5) {
        discount = 0.12; // 12%
    } else if (totalCanvases >= 3) {
        discount = 0.05; // 5%
    }
    
    const discountAmount = totalPrice * discount;
    const finalPrice = totalPrice - discountAmount;
    
    // Update display
    const totalPriceElement = document.getElementById('totalPrice');
    if (totalPriceElement) {
        if (window.translations && window.translations.formatCurrency) {
            totalPriceElement.textContent = window.translations.formatCurrency(finalPrice);
        } else {
            totalPriceElement.textContent = `$${finalPrice.toFixed(2)}`;
        }
    }
    
    return { totalPrice, discount, finalPrice, totalCanvases };
}

// Validation functions
function validateFacebookName() {
    const input = document.getElementById('fbName');
    const errorId = 'fbName-error';
    
    if (!input) return false;
    
    if (input.value.trim().length < 2) {
        if (window.translations && window.translations.showValidationError) {
            window.translations.showValidationError(errorId, 'fbNameTooShort');
        } else {
            const errorElement = document.getElementById(errorId);
            if (errorElement) {
                errorElement.textContent = 'Facebook name must be at least 2 characters';
                errorElement.classList.add('show');
            }
        }
        return false;
    } else {
        if (window.translations && window.translations.hideValidationError) {
            window.translations.hideValidationError(errorId);
        } else {
            const errorElement = document.getElementById(errorId);
            if (errorElement) {
                errorElement.classList.remove('show');
            }
        }
        return true;
    }
}

function validateEmail() {
    const input = document.getElementById('email');
    const errorId = 'email-error';
    
    if (!input) return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(input.value)) {
        if (window.translations && window.translations.showValidationError) {
            window.translations.showValidationError(errorId, 'emailInvalid');
        } else {
            const errorElement = document.getElementById(errorId);
            if (errorElement) {
                errorElement.textContent = 'Please enter a valid email address';
                errorElement.classList.add('show');
            }
        }
        return false;
    } else {
        if (window.translations && window.translations.hideValidationError) {
            window.translations.hideValidationError(errorId);
        } else {
            const errorElement = document.getElementById(errorId);
            if (errorElement) {
                errorElement.classList.remove('show');
            }
        }
        return true;
    }
}

function validateCanvas(canvasIndex) {
    let isValid = true;
    
    // Check size selection
    const sizeErrorId = `size-error-${canvasIndex}`;
    if (!canvasData[canvasIndex]?.size) {
        if (window.translations && window.translations.showValidationError) {
            window.translations.showValidationError(sizeErrorId, 'sizeRequired');
        } else {
            const errorElement = document.getElementById(sizeErrorId);
            if (errorElement) {
                errorElement.textContent = 'Please select a canvas size';
                errorElement.classList.add('show');
            }
        }
        isValid = false;
    } else {
        if (window.translations && window.translations.hideValidationError) {
            window.translations.hideValidationError(sizeErrorId);
        } else {
            const errorElement = document.getElementById(sizeErrorId);
            if (errorElement) {
                errorElement.classList.remove('show');
            }
        }
    }
    
    // Check images
    const imageErrorId = `image-error-${canvasIndex}`;
    if (!canvasData[canvasIndex]?.images || canvasData[canvasIndex].images.length === 0) {
        if (window.translations && window.translations.showValidationError) {
            window.translations.showValidationError(imageErrorId, 'imagesRequired');
        } else {
            const errorElement = document.getElementById(imageErrorId);
            if (errorElement) {
                errorElement.textContent = 'Please upload at least 1 image';
                errorElement.classList.add('show');
            }
        }
        isValid = false;
    } else {
        if (window.translations && window.translations.hideValidationError) {
            window.translations.hideValidationError(imageErrorId);
        } else {
            const errorElement = document.getElementById(imageErrorId);
            if (errorElement) {
                errorElement.classList.remove('show');
            }
        }
    }
    
    return isValid;
}

// FAQ functions
function openFAQ() {
    const faqModal = document.getElementById('faqModal');
    if (faqModal) {
        faqModal.style.display = 'block';
        document.querySelector('.container').setAttribute('aria-hidden', 'true');
        
        // Focus first focusable element
        const firstFocusable = faqModal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
            firstFocusable.focus();
        }
    }
}

function closeFAQ() {
    const faqModal = document.getElementById('faqModal');
    if (faqModal) {
        faqModal.style.display = 'none';
        document.querySelector('.container').removeAttribute('aria-hidden');
        
        // Return focus to FAQ button
        const faqButton = document.querySelector('.faq-button');
        if (faqButton) {
            faqButton.focus();
        }
    }
}

function toggleFAQ(element) {
    const answer = element.nextElementSibling;
    const toggle = element.querySelector('.faq-toggle');
    
    if (answer && toggle) {
        if (answer.classList.contains('show')) {
            answer.classList.remove('show');
            toggle.textContent = '+';
            element.classList.remove('active');
            element.setAttribute('aria-expanded', 'false');
        } else {
            // Close all other FAQs
            document.querySelectorAll('.faq-answer').forEach(ans => ans.classList.remove('show'));
            document.querySelectorAll('.faq-toggle').forEach(tog => tog.textContent = '+');
            document.querySelectorAll('.faq-question').forEach(q => {
                q.classList.remove('active');
                q.setAttribute('aria-expanded', 'false');
            });
            
            // Open clicked FAQ
            answer.classList.add('show');
            toggle.textContent = '×';
            element.classList.add('active');
            element.setAttribute('aria-expanded', 'true');
        }
    }
}

// Order confirmation
function confirmOrder() {
    // Validate required fields
    const fbNameValid = validateFacebookName();
    const emailValid = validateEmail();
    
    if (!fbNameValid || !emailValid) {
        const message = window.translations?.t ? window.translations.t('allFieldsRequired') : 'Please fill in all required customer information';
        alert(message);
        return;
    }
    
    // Validate canvas data
    const canvasType = document.getElementById('canvasType').value;
    let canvasCount = 1;
    
    if (canvasType === 'multi') {
        const quantitySelect = document.getElementById('canvasQuantity');
        canvasCount = quantitySelect ? parseInt(quantitySelect.value) : 1;
    }
    
    let allCanvasValid = true;
    for (let i = 0; i < canvasCount; i++) {
        if (!validateCanvas(i)) {
            allCanvasValid = false;
        }
    }
    
    if (!allCanvasValid) {
        const message = window.translations?.t ? window.translations.t('canvasIncomplete') : 'Please complete all canvas requirements (size and at least 1 image)';
        alert(message);
        return;
    }
    
    // Show order summary
    showOrderSummary();
}

function showOrderSummary() {
    const modal = document.getElementById('confirmModal');
    const summaryContainer = document.getElementById('orderSummary');
    
    if (!modal || !summaryContainer) return;
    
    // Build order summary
    const pricing = updatePricing();
    const canvasType = document.getElementById('canvasType').value;
    const fbNameInput = document.getElementById('fbName');
    const emailInput = document.getElementById('email');
    const notesInput = document.getElementById('notes');
    
    const fbName = fbNameInput ? fbNameInput.value : '';
    const email = emailInput ? emailInput.value : '';
    const notes = notesInput ? notesInput.value : '';
    
    let summaryHTML = `
        <div class="order-summary">
            <h4>Customer Information:</h4>
            <p><strong>Facebook Name:</strong> ${fbName}</p>
            <p><strong>Email:</strong> ${email}</p>
            
            <h4>Canvas Details:</h4>
    `;
    
    if (canvasType === 'multi') {
        const quantitySelect = document.getElementById('canvasQuantity');
        const quantity = quantitySelect ? parseInt(quantitySelect.value) : 1;
        summaryHTML += `<p><strong>Type:</strong> Multiple Different Canvas (${quantity} canvas)</p>`;
        
        for (let i = 0; i < quantity; i++) {
            const canvas = canvasData[i];
            if (canvas && canvas.size) {
                summaryHTML += `
                    <div class="canvas-summary">
                        <h5>Canvas ${i + 1}:</h5>
                        <p>Size: ${canvas.size} - $${canvas.basePrice}</p>
                        ${canvas.twoPersonCanvas ? '<p>2 people on 1 canvas: +$10</p>' : ''}
                        <p>Images: ${canvas.images?.length || 0} uploaded</p>
                        ${canvas.customText ? `<p>Text: "${canvas.customText}"</p>` : ''}
                        ${canvas.date ? `<p>Date: "${canvas.date}"</p>` : ''}
                        ${canvas.welcomeHome ? '<p>Welcome Home: Yes</p>' : ''}
                        <p><strong>Subtotal: $${canvas.totalPrice}</strong></p>
                    </div>
                `;
            }
        }
    } else {
        const canvas = canvasData[0];
        const typeText = canvasType === 'collage' ? 'Collage Multiple Images' : 'Single Canvas';
        summaryHTML += `<p><strong>Type:</strong> ${typeText}</p>`;
        
        if (canvas && canvas.size) {
            summaryHTML += `
                <p>Size: ${canvas.size} - $${canvas.basePrice}</p>
                ${canvas.twoPersonCanvas ? '<p>2 people on 1 canvas: +$10</p>' : ''}
                <p>Images: ${canvas.images?.length || 0} uploaded</p>
                ${canvas.customText ? `<p>Text: "${canvas.customText}"</p>` : ''}
                ${canvas.date ? `<p>Date: "${canvas.date}"</p>` : ''}
                ${canvas.welcomeHome && canvasType !== 'collage' ? '<p>Welcome Home: Yes</p>' : ''}
                <p><strong>Subtotal: $${canvas.totalPrice}</strong></p>
            `;
        }
    }
    
    if (notes) {
        summaryHTML += `<p><strong>Notes:</strong> ${notes}</p>`;
    }
    
    summaryHTML += `
            <div class="pricing-summary">
                <p>Total Canvas: ${pricing.totalCanvases}</p>
                ${pricing.discount > 0 ? `<p>Discount (${Math.round(pricing.discount * 100)}%): -$${(pricing.totalPrice * pricing.discount).toFixed(2)}</p>` : ''}
                <h4>Final Total: $${pricing.finalPrice.toFixed(2)}</h4>
            </div>
        </div>
    `;
    
    summaryContainer.innerHTML = summaryHTML;
    modal.style.display = 'block';
    document.querySelector('.container').setAttribute('aria-hidden', 'true');
}

function closeConfirmModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) {
        modal.style.display = 'none';
        document.querySelector('.container').removeAttribute('aria-hidden');
    }
}

// Submit order - Show Thank You immediately
function submitOrder() {
    // Close confirm modal first
    closeConfirmModal();
    
    // Show thank you page immediately
    showThankYouPage();
    
    // Build order data for background submission
    const orderData = buildOrderData();
    
    // TODO: Replace with your n8n webhook URL
    const webhookURL = 'YOUR_N8N_WEBHOOK_URL_HERE';
    
    // Send to n8n in background (non-blocking)
    if (webhookURL !== 'YOUR_N8N_WEBHOOK_URL_HERE') {
        fetch(webhookURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Order submitted successfully:', data);
        })
        .catch(error => {
            console.error('Error submitting order:', error);
            // Don't show error to user since they already see thank you page
        });
    }
}

// Build order data for n8n
function buildOrderData() {
    const pricing = updatePricing();
    const canvasType = document.getElementById('canvasType').value;
    const fbNameInput = document.getElementById('fbName');
    const emailInput = document.getElementById('email');
    const notesInput = document.getElementById('notes');
    
    const orderData = {
        customerInfo: {
            fbName: fbNameInput ? fbNameInput.value : '',
            email: emailInput ? emailInput.value : ''
        },
        canvasType: canvasType,
        canvasOrders: [],
        notes: notesInput ? notesInput.value : '',
        estimatedTotal: pricing.finalPrice,
        discount: pricing.discount,
        totalCanvases: pricing.totalCanvases,
        orderTimestamp: new Date().toISOString(),
        language: window.translations?.getCurrentLanguage ? window.translations.getCurrentLanguage() : 'en'
    };
    
    // Add canvas data
    if (canvasType === 'multi') {
        const quantitySelect = document.getElementById('canvasQuantity');
        const quantity = quantitySelect ? parseInt(quantitySelect.value) : 1;
        for (let i = 0; i < quantity; i++) {
            const canvas = canvasData[i];
            if (canvas && canvas.size) {
                orderData.canvasOrders.push({
                    canvasId: i + 1,
                    size: canvas.size,
                    basePrice: canvas.basePrice,
                    twoPersonCanvas: canvas.twoPersonCanvas,
                    additionalFee: canvas.twoPersonCanvas ? 10 : 0,
                    totalPrice: canvas.totalPrice,
                    images: canvas.images || [],
                    customText: canvas.customText || '',
                    date: canvas.date || '',
                    welcomeHome: canvas.welcomeHome || false
                });
            }
        }
    } else {
        const canvas = canvasData[0];
        if (canvas && canvas.size) {
            orderData.canvasOrders.push({
                canvasId: 1,
                size: canvas.size,
                basePrice: canvas.basePrice,
                twoPersonCanvas: canvas.twoPersonCanvas,
                additionalFee: canvas.twoPersonCanvas ? 10 : 0,
                totalPrice: canvas.totalPrice,
                images: canvas.images || [],
                customText: canvas.customText || '',
                date: canvas.date || '',
                welcomeHome: canvasType !== 'collage' ? (canvas.welcomeHome || false) : false
            });
        }
    }
    
    return orderData;
}

// Show thank you page
function showThankYouPage() {
    const thankYouPage = document.getElementById('thankYouPage');
    if (thankYouPage) {
        thankYouPage.style.display = 'flex';
        document.querySelector('.container').setAttribute('aria-hidden', 'true');
        
        // Focus the new order button
        const newOrderBtn = thankYouPage.querySelector('button');
        if (newOrderBtn) {
            setTimeout(() => newOrderBtn.focus(), 100);
        }
    }
}

// Start new order
function startNewOrder() {
    location.reload();
}

// Window resize handler for responsive canvas
window.addEventListener('resize', function() {
    updatePreview(currentCanvasIndex);
});

// Keyboard navigation for modals
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        // Close any open modals
        if (document.getElementById('faqModal').style.display === 'block') {
            closeFAQ();
        } else if (document.getElementById('cropModal').style.display === 'block') {
            cancelCrop();
        } else if (document.getElementById('confirmModal').style.display === 'block') {
            closeConfirmModal();
        }
    }
});

// Add screen reader only class for accessibility
const srOnlyCSS = `
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}
`;

const style = document.createElement('style');
style.textContent = srOnlyCSS;
document.head.appendChild(style);

// Export functions for global use
window.canvasOrderForm = {
    selectSize,
    handleTwoPersonChange,
    handleWelcomeHomeChange,
    triggerFileInput,
    handleImageUpload,
    deleteImage,
    updateCanvasCount,
    switchCanvas,
    handleCanvasTypeChange,
    confirmOrder,
    submitOrder,
    startNewOrder,
    openFAQ,
    closeFAQ,
    toggleFAQ,
    applyCrop,
    cancelCrop,
    closeConfirmModal,
    updatePreview
};
