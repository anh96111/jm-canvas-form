// Global Variables and Configuration
let currentCanvasIndex = 0;
let canvasData = {};
let cropper = null;
let currentCropImageIndex = 0;
let isPreviewSticky = false;

// Canvas Size Configuration with EXACT pricing as required
const canvasSizes = {
    "8x10": { price: 34, label: "8x10\" - $34" },
    "11x14": { price: 43, label: "11x14\" - $43 (Best Seller)" },
    "16x20": { price: 62, label: "16x20\" - $62" },
    "20x30": { price: 82, label: "20x30\" - $82" }
};

// Background images (adjust paths if using different folder structure)
const canvasImages = {
    single: 'canvas-bg-single.jpg',
    couple: 'canvas-bg-couple.jpg',
    welcomeHome: 'welcome-home-overlay.png'
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    autoFillFacebookName();
    setupEventListeners();
    initializeCanvas(0);
    updatePreview(0);
    loadFonts();
});

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
            // Clear validation error if exists
            const errorElement = document.getElementById('fbName-error');
            if (errorElement) {
                errorElement.classList.remove('show');
            }
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
}

// Setup event listeners
function setupEventListeners() {
    // Real-time validation
    const fbNameInput = document.getElementById('fbName');
    const emailInput = document.getElementById('email');
    
    if (fbNameInput) fbNameInput.addEventListener('input', validateFacebookName);
    if (emailInput) emailInput.addEventListener('input', validateEmail);
    
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
    
    // Scroll event for sticky preview
    window.addEventListener('scroll', handleStickyPreview);
    
    // Focus events for text inputs to trigger sticky behavior
    document.addEventListener('focusin', function(e) {
        if (e.target.id && (e.target.id.includes('customText') || e.target.id.includes('date'))) {
            enableStickyPreview();
        }
    });
}

// Handle canvas type change
function handleCanvasTypeChange() {
    const canvasType = document.getElementById('canvasType').value;
    
    // Reset current canvas data
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
    
    // Clear form inputs
    clearFormInputs();
    
    // Show appropriate sections
    showCanvasTypeSections(canvasType);
    
    // Update preview
    loadBackgroundImage(canvasType === 'single' ? 'single' : 'single');
    updatePreview(currentCanvasIndex);
    updatePricing();
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
    
    // Clear existing tabs and items
    if (tabsContainer) tabsContainer.innerHTML = '';
    if (itemsContainer) itemsContainer.innerHTML = '';
    
    // Create new tabs and canvas items
    for (let i = 0; i < quantity; i++) {
        createCanvasTab(i);
        createCanvasItem(i);
        
        // Initialize canvas data
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
    
    // Show first canvas
    switchCanvas(0);
    
    // Show discount notification
    showDiscountNotification(quantity);
}

// Create canvas tab
function createCanvasTab(index) {
    const tabsContainer = document.getElementById('canvasTabs');
    if (!tabsContainer) return;
    
    const tab = document.createElement('div');
    tab.className = index === 0 ? 'tab active' : 'tab';
    tab.textContent = `Canvas ${index + 1}`;
    tab.onclick = () => switchCanvas(index);
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
                <div class="size-option" data-size="8x10" onclick="selectSize('8x10', ${index})">
                    <div class="size-label">8x10"</div>
                    <div class="size-price" data-base-price="34">$34</div>
                </div>
                <div class="size-option" data-size="11x14" onclick="selectSize('11x14', ${index})">
                    <div class="size-label">11x14"</div>
                    <div class="size-price" data-base-price="43">$43</div>
                    <div class="best-seller" data-translate="bestSeller">Best Seller</div>
                </div>
                <div class="size-option" data-size="16x20" onclick="selectSize('16x20', ${index})">
                    <div class="size-label">16x20"</div>
                    <div class="size-price" data-base-price="62">$62</div>
                </div>
                <div class="size-option" data-size="20x30" onclick="selectSize('20x30', ${index})">
                    <div class="size-label">20x30"</div>
                    <div class="size-price" data-base-price="82">$82</div>
                </div>
            </div>
            <div class="validation-error" id="size-error-${index}"></div>
        </div>

        <!-- Two Person Canvas Checkbox -->
        <div class="form-section" id="twoPersonSection-${index}">
            <div class="checkbox-wrapper">
                <input type="checkbox" id="twoPersonCanvas-${index}" onchange="handleTwoPersonChange(${index})">
                <label for="twoPersonCanvas-${index}" data-translate="twoPersonLabel">2 people on 1 canvas (+$10)</label>
            </div>
        </div>

        <!-- Image Upload -->
        <div class="form-section">
            <h2 data-translate="uploadImages">Upload Images *</h2>
            <div class="upload-container">
                <div class="upload-area" onclick="triggerFileInput(${index})">
                    <div class="upload-icon">📷</div>
                    <div class="upload-text" data-translate="uploadText">Click to upload images (Max 6)</div>
                    <div class="upload-subtext" data-translate="uploadSubtext">Supports JPG, PNG - Will be cropped to 8:10 ratio</div>
                </div>
                <input type="file" id="imageInput-${index}" multiple accept="image/*" style="display: none;" onchange="handleImageUpload(event, ${index})">
                <div class="image-thumbnails" id="imageThumbnails-${index}"></div>
            </div>
            <div class="validation-error" id="image-error-${index}"></div>
        </div>

        <!-- Custom Text -->
        <div class="form-section">
            <div class="form-group">
                <label data-translate="customText">Enter your text</label>
                <input type="text" id="customText-${index}" placeholder="e.g., Forever Together" onkeyup="updatePreview(${index})" data-translate-placeholder="customTextPlaceholder">
            </div>
        </div>

        <!-- Date -->
        <div class="form-section">
            <div class="form-group">
                <label data-translate="date">Date</label>
                <input type="text" id="date-${index}" placeholder="e.g., Dec 25, 2024" onkeyup="updatePreview(${index})" data-translate-placeholder="datePlaceholder">
            </div>
        </div>

        <!-- Welcome Home -->
        <div class="form-section" id="welcomeHomeSection-${index}">
            <div class="checkbox-wrapper">
                <input type="checkbox" id="welcomeHome-${index}" onchange="handleWelcomeHomeChange(${index})">
                <label for="welcomeHome-${index}" data-translate="welcomeHome">Welcome Home</label>
            </div>
        </div>
    `;
    
    itemsContainer.appendChild(canvasItem);
}

// Switch between canvas tabs
function switchCanvas(index) {
    currentCanvasIndex = index;
    
    // Update tab active state
    document.querySelectorAll('.tab').forEach((tab, i) => {
        tab.classList.toggle('active', i === index);
    });
    
    // Show/hide canvas items
    document.querySelectorAll('.canvas-item').forEach((item, i) => {
        item.style.display = i === index ? 'block' : 'none';
    });
    
    // Update preview
    updatePreview(index);
    updatePricing();
}

// Select canvas size
function selectSize(size, canvasIndex) {
    // Remove previous selection
    document.querySelectorAll(`[data-canvas="${canvasIndex}"] .size-option`).forEach(option => {
        option.classList.remove('selected');
    });
    
    // Add selection to clicked option
    const selectedOption = document.querySelector(`[data-canvas="${canvasIndex}"] .size-option[data-size="${size}"]`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
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
        alert('Maximum 6 images allowed per canvas');
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
    
    // Close crop modal
    cancelCrop();
}

// Cancel crop
function cancelCrop() {
    const cropModal = document.getElementById('cropModal');
    if (cropModal) {
        cropModal.style.display = 'none';
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
        thumbnail.innerHTML = `
            <img src="${image.data}" alt="Uploaded image">
            <button class="delete-btn" onclick="deleteImage(${canvasIndex}, ${index})">×</button>
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
        
        // Draw custom text
        if (customText) {
            drawCustomText(ctx, customText, canvas.width, canvas.height);
        }
        
        // Draw date
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
    
    // Set canvas size for collage mode
    canvas.width = 500;
    canvas.height = 400;
    
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

// Draw custom text with TextFont
function drawCustomText(ctx, text, canvasWidth, canvasHeight) {
    ctx.font = '32px "TextFont", serif';
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 1;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const x = canvasWidth / 2;
    const y = canvasHeight * 0.75; // 75% down from top
    
    // Draw text with stroke (border)
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
}

// Draw date with DateFont
function drawDate(ctx, date, canvasWidth, canvasHeight) {
    ctx.font = '18px "DateFont", serif';
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 0.5;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const x = canvasWidth / 2;
    const y = canvasHeight * 0.85; // 85% down from top
    
    // Draw date with stroke (border)
    ctx.strokeText(date, x, y);
    ctx.fillText(date, x, y);
}

// Draw Welcome Home overlay
function drawWelcomeHomeOverlay(ctx, canvasWidth, canvasHeight) {
    const welcomeImg = new Image();
    welcomeImg.crossOrigin = 'anonymous';
    
    welcomeImg.onload = function() {
        // Draw Welcome Home overlay (positioned like in your example)
        const overlayWidth = canvasWidth * 0.4;
        const overlayHeight = canvasHeight * 0.6;
        const x = canvasWidth - overlayWidth - 20;
        const y = 20;
        
        ctx.drawImage(welcomeImg, x, y, overlayWidth, overlayHeight);
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
    
    // Handle sticky behavior
    if (isChecked) {
        // Remove sticky when Welcome Home is selected
        disableStickyPreview();
    }
}

// Enable sticky preview
function enableStickyPreview() {
    const previewSection = document.getElementById('previewSection');
    const welcomeHomeCheckbox = document.getElementById(`welcomeHome-${currentCanvasIndex}`);
    
    if (previewSection && (!welcomeHomeCheckbox || !welcomeHomeCheckbox.checked)) {
        previewSection.classList.add('sticky');
        previewSection.classList.remove('unsticky');
        isPreviewSticky = true;
    }
}

// Disable sticky preview
function disableStickyPreview() {
    const previewSection = document.getElementById('previewSection');
    if (previewSection) {
        previewSection.classList.remove('sticky');
        previewSection.classList.add('unsticky');
        isPreviewSticky = false;
    }
}

// Handle sticky preview behavior
function handleStickyPreview() {
    // This function is called on scroll events
    // The sticky behavior is primarily handled by CSS and focus events
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
        totalPriceElement.textContent = `$${finalPrice.toFixed(2)}`;
    }
    
    return { totalPrice, discount, finalPrice, totalCanvases };
}

// Clear form inputs
function clearFormInputs() {
    // Clear text inputs (except customer info)
    document.querySelectorAll('input[type="text"]').forEach(input => {
        if (input.id !== 'fbName' && input.id !== 'email' && input.id !== 'notes') {
            input.value = '';
        }
    });
    
    // Clear checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Clear size selections
    document.querySelectorAll('.size-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Clear image thumbnails
    document.querySelectorAll('.image-thumbnails').forEach(container => {
        container.innerHTML = '';
    });
    
    // Clear validation errors
    document.querySelectorAll('.validation-error').forEach(error => {
        error.classList.remove('show');
    });
}

// Validation functions
function validateFacebookName() {
    const input = document.getElementById('fbName');
    const error = document.getElementById('fbName-error');
    
    if (!input || !error) return false;
    
    if (input.value.trim().length < 2) {
        error.textContent = 'Facebook name must be at least 2 characters';
        error.classList.add('show');
        return false;
    } else {
        error.classList.remove('show');
        return true;
    }
}

function validateEmail() {
    const input = document.getElementById('email');
    const error = document.getElementById('email-error');
    
    if (!input || !error) return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(input.value)) {
        error.textContent = 'Please enter a valid email address';
        error.classList.add('show');
        return false;
    } else {
        error.classList.remove('show');
        return true;
    }
}

function validateCanvas(canvasIndex) {
    let isValid = true;
    
    // Check size selection
    const sizeError = document.getElementById(`size-error-${canvasIndex}`);
    if (sizeError) {
        if (!canvasData[canvasIndex]?.size) {
            sizeError.textContent = 'Please select a canvas size';
            sizeError.classList.add('show');
            isValid = false;
        } else {
            sizeError.classList.remove('show');
        }
    }
    
    // Check images
    const imageError = document.getElementById(`image-error-${canvasIndex}`);
    if (imageError) {
        if (!canvasData[canvasIndex]?.images || canvasData[canvasIndex].images.length === 0) {
            imageError.textContent = 'Please upload at least 1 image';
            imageError.classList.add('show');
            isValid = false;
        } else {
            imageError.classList.remove('show');
        }
    }
    
    return isValid;
}

// FAQ functions
function openFAQ() {
    const faqModal = document.getElementById('faqModal');
    if (faqModal) {
        faqModal.style.display = 'block';
    }
}

function closeFAQ() {
    const faqModal = document.getElementById('faqModal');
    if (faqModal) {
        faqModal.style.display = 'none';
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
        } else {
            // Close all other FAQs
            document.querySelectorAll('.faq-answer').forEach(ans => ans.classList.remove('show'));
            document.querySelectorAll('.faq-toggle').forEach(tog => tog.textContent = '+');
            document.querySelectorAll('.faq-question').forEach(q => q.classList.remove('active'));
            
            // Open clicked FAQ
            answer.classList.add('show');
            toggle.textContent = '×';
            element.classList.add('active');
        }
    }
}

// Order confirmation
function confirmOrder() {
    // Validate required fields
    const fbNameValid = validateFacebookName();
    const emailValid = validateEmail();
    
    if (!fbNameValid || !emailValid) {
        alert('Please fill in all required customer information');
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
        alert('Please complete all canvas requirements (size and at least 1 image)');
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
}

function closeConfirmModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Submit order (ready for n8n integration)
function submitOrder() {
    const orderData = buildOrderData();
    
    // Show loading state
    const submitBtn = document.querySelector('#confirmModal .primary-btn');
    if (submitBtn) {
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;
        
        // TODO: Replace with your n8n webhook URL
        const webhookURL = 'YOUR_N8N_WEBHOOK_URL_HERE';
        
        // Send to n8n
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
            closeConfirmModal();
            showThankYouPage();
        })
        .catch(error => {
            console.error('Error submitting order:', error);
            alert('There was an error submitting your order. Please try again.');
            
            // Restore button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
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
        orderTimestamp: new Date().toISOString()
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
    }
}

// Start new order
function startNewOrder() {
    location.reload();
}
