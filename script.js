// Global variables
let selectedSizes = {};
let uploadedImages = {};
let canvasFormData = {};
let cropper = null;
let currentCropIndex = null;
let currentCanvasIndex = null;
let pendingFiles = [];
let currentRotation = 0; // Already exists in your file

// Price configuration
const prices = {
    '8x10': 34,
    '11x14': 43,
    '16x20': 62,
    '20x30': 82
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    
    // Pre-fill FB name if available
    const fbName = urlParams.get('fb_name');
    if (fbName) {
        document.getElementById('fbName').value = decodeURIComponent(fbName);
    }
    
    // Initialize character counter
    const customTextInput = document.getElementById('customText-0');
    if (customTextInput) {
        customTextInput.addEventListener('input', function() {
            updateCharCount(0);
        });
    }
    
    // Initialize with single canvas
    uploadedImages[0] = [];
    canvasFormData[0] = {};
});

// Character counter
function updateCharCount(canvasIndex) {
    const input = document.getElementById(`customText-${canvasIndex}`);
    const counter = document.getElementById(`charCount-${canvasIndex}`);
    if (input && counter) {
        counter.textContent = input.value.length;
    }
}

// Canvas type change handler - UPDATED
function handleCanvasTypeChange() {
    const canvasType = document.getElementById('canvasType').value;
    const multiCanvasSection = document.getElementById('multiCanvasSection');
    const canvasQuantitySelect = document.getElementById('canvasQuantity');
    const canvasTabs = document.getElementById('canvasTabs');
    const miniCanvasNav = document.getElementById('miniCanvasNav');
    
    // Update collage price display
    updateCollagePriceDisplay();
    
    if (canvasType === 'multi' || canvasType === 'collage') {
        multiCanvasSection.style.display = 'block';
        
        // Clear and rebuild options
        const currentValue = canvasQuantitySelect.value;
        canvasQuantitySelect.innerHTML = '';
        
        if (canvasType === 'collage') {
            // For collage: 1-10 canvas
            for (let i = 1; i <= 10; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i + ' Canvas';
                canvasQuantitySelect.appendChild(option);
            }
            
            const label = multiCanvasSection.querySelector('label');
            label.textContent = 'How many canvas for collage?';
            label.setAttribute('data-translate', 'collageQuantity');
        } else {
            // For multi: 2-10 canvas
            for (let i = 2; i <= 10; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i + ' Canvas';
                canvasQuantitySelect.appendChild(option);
            }
            
            const label = multiCanvasSection.querySelector('label');
            label.textContent = 'How many different canvas?';
            label.setAttribute('data-translate', 'selectQuantity');
        }
        
        // Set default value
        canvasQuantitySelect.value = canvasType === 'collage' ? '1' : '2';
        
        canvasTabs.style.display = 'flex';
        miniCanvasNav.style.display = 'block';
        updateCanvasCount();
    } else {
        multiCanvasSection.style.display = 'none';
        canvasTabs.style.display = 'none';
        miniCanvasNav.style.display = 'none';
        resetToSingleCanvas();
    }
    
    // Update field visibility for collage
    updateCollageFields();
}

// Update fields for collage
function updateCollageFields() {
    const canvasType = document.getElementById('canvasType').value;
    const isCollage = canvasType === 'collage';
    
    // Hide/show fields based on canvas type - INCLUDING canvas 0
    document.querySelectorAll('[id^="dateSection-"]').forEach(section => {
        section.style.display = isCollage ? 'none' : 'block';
    });
    
    document.querySelectorAll('[id^="welcomeHomeSection-"]').forEach(section => {
        section.style.display = isCollage ? 'none' : 'block';
    });
    
    document.querySelectorAll('[id^="twoPersonSection-"]').forEach(section => {
        section.style.display = isCollage ? 'none' : 'block';
    });
}

// Update collage price display
function updateCollagePriceDisplay() {
    const canvasType = document.getElementById('canvasType').value;
    const collagePrices = document.querySelectorAll('.collage-price');
    
    collagePrices.forEach(price => {
        price.style.display = canvasType === 'collage' ? 'block' : 'none';
    });
}

// Reset to single canvas
function resetToSingleCanvas() {
    // Clear all data except first canvas
    selectedSizes = { 0: selectedSizes[0] };
    uploadedImages = { 0: uploadedImages[0] || [] };
    canvasFormData = { 0: canvasFormData[0] || {} };
    
    // Reset UI
    const container = document.getElementById('canvasItemsContainer');
    const firstCanvasItems = container.querySelectorAll('[data-canvas="0"]');
    
    // Remove all canvas items except first
    container.querySelectorAll('.canvas-item').forEach(item => {
        if (item.getAttribute('data-canvas') !== '0') {
            item.remove();
        }
    });
    
    // Show first canvas items
    firstCanvasItems.forEach(item => {
        item.style.display = 'block';
    });
    
    calculateTotalPrice();
}

// Update canvas count - UPDATED
function updateCanvasCount() {
    const quantity = parseInt(document.getElementById('canvasQuantity').value);
    const canvasType = document.getElementById('canvasType').value;
    const canvasTabs = document.getElementById('canvasTabs');
    const miniTabs = document.getElementById('miniTabs');
    const miniCanvasNav = document.getElementById('miniCanvasNav');
    const container = document.getElementById('canvasItemsContainer');
    
    // Clear existing tabs
    canvasTabs.innerHTML = '';
    miniTabs.innerHTML = '';
    
    // Special handling for collage with 1 canvas
    if (canvasType === 'collage' && quantity === 1) {
        canvasTabs.style.display = 'none';
        miniCanvasNav.style.display = 'none';
    } else {
        canvasTabs.style.display = 'flex';
        miniCanvasNav.style.display = 'block';
    }
    
    // Update discount notification
    updateDiscountNotification(quantity);
    
    // Generate tabs and canvas items
    for (let i = 0; i < quantity; i++) {
        // Only create tabs if more than 1 canvas or not collage
        if (!(canvasType === 'collage' && quantity === 1)) {
            // Create tab
            const tab = document.createElement('div');
            tab.className = 'tab' + (i === 0 ? ' active' : '');
            tab.textContent = `Canvas ${i + 1}`;
            tab.onclick = () => switchCanvas(i);
            canvasTabs.appendChild(tab);
            
            // Create mini tab
            const miniTab = document.createElement('div');
            miniTab.className = 'mini-tab' + (i === 0 ? ' active' : '');
            miniTab.textContent = i + 1;
            miniTab.onclick = () => switchCanvas(i);
            miniTabs.appendChild(miniTab);
        }
        
        // Initialize data structures
        if (!uploadedImages[i]) uploadedImages[i] = [];
        if (!canvasFormData[i]) canvasFormData[i] = {};
        
        // Create canvas items if they don't exist
        if (!container.querySelector(`[data-canvas="${i}"]`)) {
            createCanvasItems(i);
        }
    }
    
    // Remove excess canvas items
    container.querySelectorAll('.canvas-item').forEach(item => {
        const canvasIndex = parseInt(item.getAttribute('data-canvas'));
        if (canvasIndex >= quantity) {
            item.remove();
            delete selectedSizes[canvasIndex];
            delete uploadedImages[canvasIndex];
            delete canvasFormData[canvasIndex];
        }
    });
    
    // Update totals
    document.getElementById('totalCanvasNum').textContent = quantity;
    
    // Show first canvas
    switchCanvas(0);
    calculateTotalPrice();
    
    // Update collage fields after creating canvas
    updateCollageFields();
}

// Create canvas items for a specific index
function createCanvasItems(canvasIndex) {
    if (canvasIndex === 0) return; // Don't recreate first canvas
    
    const container = document.getElementById('canvasItemsContainer');
    const canvasType = document.getElementById('canvasType').value;
    const isCollage = canvasType === 'collage';
    
    let html = generateCanvasHTML(canvasIndex, isCollage);
    
    // Insert HTML
    container.insertAdjacentHTML('beforeend', html);
    
    // Initialize character counter for new canvas
    const customTextInput = document.getElementById(`customText-${canvasIndex}`);
    if (customTextInput) {
        customTextInput.addEventListener('input', function() {
            updateCharCount(canvasIndex);
        });
    }
}

// Generate HTML for canvas items
function generateCanvasHTML(canvasIndex, isCollage = false) {
    let html = '';
    
    // Size Selection
    html += `
        <div class="form-section canvas-item" data-canvas="${canvasIndex}" style="display: none;">
            <h2 data-translate="selectSize">Select Size *</h2>
            <div class="size-grid">
                <div class="size-option" data-size="8x10" onclick="selectSize('8x10', ${canvasIndex})">
                    <div class="size-display">8x10 inches</div>
                    <div class="collage-price" style="display: ${isCollage ? 'block' : 'none'};">+$5 for collage</div>
                </div>
                <div class="size-option" data-size="11x14" onclick="selectSize('11x14', ${canvasIndex})">
                    <div class="size-display">11x14 inches</div>
                    <div class="best-seller" data-translate="bestSeller">Best Seller</div>
                    <div class="collage-price" style="display: ${isCollage ? 'block' : 'none'};">+$5 for collage</div>
                </div>
                <div class="size-option" data-size="16x20" onclick="selectSize('16x20', ${canvasIndex})">
                    <div class="size-display">16x20 inches</div>
                    <div class="collage-price" style="display: ${isCollage ? 'block' : 'none'};">+$5 for collage</div>
                </div>
                <div class="size-option" data-size="20x30" onclick="selectSize('20x30', ${canvasIndex})">
                    <div class="size-display">20x30 inches</div>
                    <div class="collage-price" style="display: ${isCollage ? 'block' : 'none'};">+$5 for collage</div>
                </div>
            </div>
            <div class="selected-price" id="selectedPrice-${canvasIndex}" style="display: none;"></div>
            <div class="validation-error" id="size-error-${canvasIndex}"></div>
        </div>
    `;
    
    // Two Person Canvas (not for collage)
    if (!isCollage) {
        html += `
            <div class="form-section canvas-item" data-canvas="${canvasIndex}" id="twoPersonSection-${canvasIndex}" style="display: none;">
                <div class="checkbox-wrapper">
                    <input type="checkbox" id="twoPersonCanvas-${canvasIndex}" onchange="handleTwoPersonChange(${canvasIndex})">
                    <label for="twoPersonCanvas-${canvasIndex}" data-translate="twoPersonLabel">2 people on 1 canvas (+$10)</label>
                </div>
            </div>
        `;
    }
    
    // Image Upload
    html += `
        <div class="form-section canvas-item" data-canvas="${canvasIndex}" style="display: none;">
            <h2 data-translate="uploadImages">Upload Images *</h2>
            <div class="upload-container">
                <div class="upload-area" onclick="triggerFileInput(${canvasIndex})">
                    <div class="upload-icon">📷</div>
                    <div class="upload-text" data-translate="uploadText">Click to upload images (Max 6)</div>
                    <div class="upload-subtext" data-translate="uploadSubtext">Supports JPG, PNG - Will be cropped to 8:10 ratio</div>
                </div>
                <input type="file" id="imageInput-${canvasIndex}" multiple accept="image/jpeg,image/jpg,image/png" style="display: none;" onchange="handleImageUpload(event, ${canvasIndex})">
                <div class="image-thumbnails" id="imageThumbnails-${canvasIndex}"></div>
            </div>
            <div class="validation-error" id="image-error-${canvasIndex}"></div>
        </div>
    `;
    
    // Custom Text
    html += `
        <div class="form-section canvas-item" data-canvas="${canvasIndex}" style="display: none;">
            <div class="form-group">
                <label data-translate="customText">Enter your text</label>
                <input type="text" id="customText-${canvasIndex}" maxlength="50" placeholder="e.g., Forever Together" data-translate-placeholder="customTextPlaceholder">
                <div class="char-counter">
                    <span id="charCount-${canvasIndex}">0</span>/50
                </div>
            </div>
        </div>
    `;
    
    // Date (not for collage)
    if (!isCollage) {
        html += `
            <div class="form-section canvas-item" data-canvas="${canvasIndex}" id="dateSection-${canvasIndex}" style="display: none;">
                <div class="form-group">
                    <label data-translate="date">Date</label>
                    <input type="text" id="date-${canvasIndex}" placeholder="e.g., Dec 25, 2024" data-translate-placeholder="datePlaceholder">
                </div>
            </div>
        `;
    }
    
    // Welcome Home (not for collage)
    if (!isCollage) {
        html += `
            <div class="form-section canvas-item" data-canvas="${canvasIndex}" id="welcomeHomeSection-${canvasIndex}" style="display: none;">
                <div class="checkbox-wrapper">
                    <input type="checkbox" id="welcomeHome-${canvasIndex}">
                    <label for="welcomeHome-${canvasIndex}" data-translate="welcomeHome">Welcome Home</label>
                </div>
            </div>
        `;
    }
    
    // Preview Button
    html += `
        <div class="form-section canvas-item preview-button-section" data-canvas="${canvasIndex}" style="display: none;">
            <button class="preview-btn" onclick="openPreviewModal(${canvasIndex})" data-translate="previewButton">
                Preview Your Customize
            </button>
        </div>
    `;
    
    return html;
}

// Switch between canvases
function switchCanvas(index) {
    // Update active tab
    document.querySelectorAll('.tab').forEach((tab, i) => {
        tab.classList.toggle('active', i === index);
    });
    
    document.querySelectorAll('.mini-tab').forEach((tab, i) => {
        tab.classList.toggle('active', i === index);
    });
    
    // Hide all canvas items
    document.querySelectorAll('.canvas-item').forEach(item => {
        item.style.display = 'none';
    });
    
    // Show selected canvas items
    document.querySelectorAll(`[data-canvas="${index}"]`).forEach(item => {
        item.style.display = 'block';
    });
    
    // Update current canvas number
    document.getElementById('currentCanvasNum').textContent = index + 1;
    
    // Store form data for current canvas
    storeCanvasData(currentCanvasIndex);
    currentCanvasIndex = index;
    
    // Restore form data for new canvas
    restoreCanvasData(index);
}

// Store canvas data
function storeCanvasData(canvasIndex) {
    if (canvasIndex === null || canvasIndex === undefined) return;
    
    canvasFormData[canvasIndex] = {
        size: selectedSizes[canvasIndex],
        twoPersonCanvas: document.getElementById(`twoPersonCanvas-${canvasIndex}`)?.checked,
        customText: document.getElementById(`customText-${canvasIndex}`)?.value,
        date: document.getElementById(`date-${canvasIndex}`)?.value,
        welcomeHome: document.getElementById(`welcomeHome-${canvasIndex}`)?.checked,
        images: uploadedImages[canvasIndex]
    };
}

// Restore canvas data
function restoreCanvasData(canvasIndex) {
    const data = canvasFormData[canvasIndex];
    if (!data) return;
    
    if (data.size) {
        selectSize(data.size, canvasIndex);
    }
    
    const twoPersonCheckbox = document.getElementById(`twoPersonCanvas-${canvasIndex}`);
    if (twoPersonCheckbox && data.twoPersonCanvas !== undefined) {
        twoPersonCheckbox.checked = data.twoPersonCanvas;
    }
    
    const customTextInput = document.getElementById(`customText-${canvasIndex}`);
    if (customTextInput && data.customText !== undefined) {
        customTextInput.value = data.customText;
        updateCharCount(canvasIndex);
    }
    
    const dateInput = document.getElementById(`date-${canvasIndex}`);
    if (dateInput && data.date !== undefined) {
        dateInput.value = data.date;
    }
    
    const welcomeHomeCheckbox = document.getElementById(`welcomeHome-${canvasIndex}`);
    if (welcomeHomeCheckbox && data.welcomeHome !== undefined) {
        welcomeHomeCheckbox.checked = data.welcomeHome;
    }
}

// Size selection
function selectSize(size, canvasIndex) {
    // Remove active class from all sizes in this canvas
    document.querySelectorAll(`[data-canvas="${canvasIndex}"] .size-option`).forEach(option => {
        option.classList.remove('active');
    });
    
    // Add active class to selected size
    document.querySelector(`[data-canvas="${canvasIndex}"] .size-option[data-size="${size}"]`).classList.add('active');
    
    // Store selected size
    selectedSizes[canvasIndex] = size;
    
    // Clear error
    const errorElement = document.getElementById(`size-error-${canvasIndex}`);
    if (errorElement) {
        errorElement.style.display = 'none';
    }
    
    // Update price display
    updatePriceDisplay(canvasIndex);
}

// Handle two person change
function handleTwoPersonChange(canvasIndex) {
    updatePriceDisplay(canvasIndex);
}

// Update price display
function updatePriceDisplay(canvasIndex) {
    const size = selectedSizes[canvasIndex];
    const priceElement = document.getElementById(`selectedPrice-${canvasIndex}`);
    
    if (!size || !priceElement) return;
    
    const basePrice = prices[size];
    const isTwoPerson = document.getElementById(`twoPersonCanvas-${canvasIndex}`)?.checked;
    const canvasType = document.getElementById('canvasType').value;
    
    let priceHTML = `Price: $${basePrice}`;
    
    if (canvasType === 'collage') {
        priceHTML += ` + $5 (collage) = $${basePrice + 5}`;
    } else if (isTwoPerson) {
        priceHTML += ` + $10 (2 people) = $${basePrice + 10}`;
    }
    
    priceElement.innerHTML = priceHTML;
    priceElement.style.display = 'block';
    
    calculateTotalPrice();
}

// Calculate total price
function calculateTotalPrice() {
    let total = 0;
    const canvasType = document.getElementById('canvasType').value;
    const canvasCount = canvasType === 'single' ? 1 : parseInt(document.getElementById('canvasQuantity').value);
    
    for (let i = 0; i < canvasCount; i++) {
        if (selectedSizes[i]) {
            let canvasPrice = prices[selectedSizes[i]];
            
            // Add collage fee
            if (canvasType === 'collage') {
                canvasPrice += 5;
            }
            
            // Add two person fee
            const isTwoPerson = document.getElementById(`twoPersonCanvas-${i}`)?.checked;
            if (isTwoPerson) {
                canvasPrice += 10;
            }
            
            total += canvasPrice;
        }
    }
    
    // Apply discount for multi canvas
    if (canvasCount >= 5) {
        total = total * 0.88; // 12% off
    } else if (canvasCount >= 3) {
        total = total * 0.95; // 5% off
    }
    
    document.getElementById('totalPrice').textContent = `$${Math.round(total)}`;
}

// Update discount notification
function updateDiscountNotification(quantity) {
    const notification = document.getElementById('discountNotification');
    const discountText = document.querySelector('.discount-text');
    
    if (quantity >= 5) {
        notification.style.display = 'flex';
        discountText.textContent = 'You get 12% OFF for ordering 5+ canvas!';
    } else if (quantity >= 3) {
        notification.style.display = 'flex';
        discountText.textContent = 'You get 5% OFF for ordering 3+ canvas!';
    } else {
        notification.style.display = 'none';
    }
}

// Trigger file input
function triggerFileInput(canvasIndex) {
    document.getElementById(`imageInput-${canvasIndex}`).click();
}

// Handle image upload
function handleImageUpload(event, canvasIndex) {
    const files = Array.from(event.target.files);
    const currentImages = uploadedImages[canvasIndex] || [];
    
    if (currentImages.length + files.length > 6) {
        alert('Maximum 6 images allowed per canvas');
        return;
    }
    
    currentCropIndex = 0;
    currentCanvasIndex = canvasIndex;
    pendingFiles = files;
    
    processNextImage();
}

// Process next image for cropping
function processNextImage() {
    if (currentCropIndex >= pendingFiles.length) {
        // All images processed
        pendingFiles = [];
        currentCropIndex = null;
        
        // Clear error
        const errorElement = document.getElementById(`image-error-${currentCanvasIndex}`);
        if (errorElement) {
            errorElement.style.display = 'none';
        }
        
        return;
    }
    
    const file = pendingFiles[currentCropIndex];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        initCropper(e.target.result);
    };
    
    reader.readAsDataURL(file);
}

// Initialize cropper
function initCropper(imageUrl) {
    currentRotation = 0; // Reset rotation for new image
    const cropImage = document.getElementById('cropImage');
    cropImage.src = imageUrl;
    
    // Destroy existing cropper
    if (cropper) {
        cropper.destroy();
    }
    
    // Show crop modal
    document.getElementById('cropModal').style.display = 'block';
    
    // Initialize cropper with 8:10 aspect ratio
    cropper = new Cropper(cropImage, {
        aspectRatio: 8 / 10,
        viewMode: 1,
        guides: true,
        center: true,
        highlight: true,
        background: true,
        autoCrop: true,
        autoCropArea: 0.8,
        movable: true,
        rotatable: true,
        scalable: true,
        zoomable: true
    });
}

// Rotate crop
function rotateCrop(degrees) {
    if (cropper) {
        currentRotation += degrees;
        cropper.rotateTo(currentRotation);
    }
}

// Reset crop
function resetCrop() {
    if (cropper) {
        currentRotation = 0;
        cropper.reset();
    }
}

// Apply crop
function applyCrop() {
    if (!cropper) return;
    
    // Get cropped canvas
    const croppedCanvas = cropper.getCroppedCanvas({
        width: 800,
        height: 1000,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
    });
    
    croppedCanvas.toBlob(function(blob) {
        // Create file from blob
        const fileName = `cropped_${Date.now()}_${currentCropIndex}.jpg`;
        const file = new File([blob], fileName, { type: 'image/jpeg' });
        
        // Store the file
        if (!uploadedImages[currentCanvasIndex]) {
            uploadedImages[currentCanvasIndex] = [];
        }
        uploadedImages[currentCanvasIndex].push(file);
        
        // Update thumbnails
        updateThumbnails(currentCanvasIndex);
        
        // Close modal
        closeCropModal();
        
        // Process next image
        currentCropIndex++;
        processNextImage();
    }, 'image/jpeg', 0.9);
}

// Cancel crop
function cancelCrop() {
    closeCropModal();
    
    // Skip this image and process next
    currentCropIndex++;
    processNextImage();
}

// Close crop modal
function closeCropModal() {
    document.getElementById('cropModal').style.display = 'none';
    
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
}

// Update thumbnails
function updateThumbnails(canvasIndex) {
    const container = document.getElementById(`imageThumbnails-${canvasIndex}`);
    container.innerHTML = '';
    
    const images = uploadedImages[canvasIndex] || [];
    
    images.forEach((file, index) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'thumbnail';
            thumbnail.innerHTML = `
                <img src="${e.target.result}" alt="Uploaded image">
                <button class="remove-btn" onclick="removeImage(${canvasIndex}, ${index})">×</button>
            `;
            container.appendChild(thumbnail);
        };
        
        reader.readAsDataURL(file);
    });
}

// Remove image
function removeImage(canvasIndex, imageIndex) {
    uploadedImages[canvasIndex].splice(imageIndex, 1);
    updateThumbnails(canvasIndex);
}

// Open preview modal - UPDATED
function openPreviewModal(canvasIndex) {
    const modal = document.getElementById('previewModal');
    const canvas = document.getElementById('previewCanvas');
    const canvasType = document.getElementById('canvasType').value;
    
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Set canvas size based on type
    if (canvasType === 'collage') {
        canvas.width = 300;
        canvas.height = 250;
    } else {
        canvas.width = 250;
        canvas.height = 300;
    }
    
    // Show loading
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#666';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Loading preview...', canvas.width/2, canvas.height/2);
    
    // Show modal
    modal.style.display = 'block';
    
    // Load background
    const isTwoPerson = document.getElementById(`twoPersonCanvas-${canvasIndex}`)?.checked;
    const bgImage = new Image();
    
    // Determine background image
    if (canvasType === 'single' || canvasType === 'multi') {
        bgImage.src = isTwoPerson ? './assets/canvas-bg-couple.jpg' : './assets/canvas-bg-single.jpg';
    } else {
        bgImage.src = './assets/canvas-bg-collage.jpg';
    }
    
    bgImage.onload = function() {
        // Clear and draw background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        
        // Get text values
        const customText = document.getElementById(`customText-${canvasIndex}`)?.value || '';
        const date = document.getElementById(`date-${canvasIndex}`)?.value || '';
        const welcomeHome = document.getElementById(`welcomeHome-${canvasIndex}`)?.checked;
        
        // Load custom fonts
        const textFont = new FontFace('CustomText', 'url(./assets/text-font.ttf)');
        const dateFont = new FontFace('CustomDate', 'url(./assets/date-font.ttf)');
        
        Promise.all([textFont.load(), dateFont.load()]).then(fonts => {
            fonts.forEach(font => document.fonts.add(font));
            
            // Draw text in bottom left corner
            ctx.fillStyle = '#000000';
            ctx.textAlign = 'left';
            
            let yPosition = canvas.height - 20;
            
            // Draw date if exists (not for collage)
            if (date && canvasType !== 'collage') {
                ctx.font = '14px CustomDate';
                ctx.fillText(date, 20, yPosition);
                yPosition -= 25;
            }
            
            // Draw custom text
            if (customText) {
                ctx.font = '18px CustomText';
                ctx.fillText(customText, 20, yPosition);
                yPosition -= 25;
            }
            
            // Draw welcome home if checked (not for collage)
            if (welcomeHome && canvasType !== 'collage') {
                ctx.font = '16px CustomText';
                ctx.fillText('Welcome Home', 20, yPosition);
            }
        }).catch(() => {
            // Fallback if fonts fail to load
            ctx.fillStyle = '#000000';
            ctx.textAlign = 'left';
            ctx.font = '18px Arial';
            
            let yPosition = canvas.height - 20;
            
            if (date && canvasType !== 'collage') {
                ctx.font = '14px Arial';
                ctx.fillText(date, 20, yPosition);
                yPosition -= 25;
            }
            
            if (customText) {
                ctx.font = '18px Arial';
                ctx.fillText(customText, 20, yPosition);
                yPosition -= 25;
            }
            
            if (welcomeHome && canvasType !== 'collage') {
                ctx.font = '16px Arial';
                ctx.fillText('Welcome Home', 20, yPosition);
            }
        });
    };
    
    bgImage.onerror = function() {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#999';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Preview unavailable', canvas.width/2, canvas.height/2);
    };
}

// Close preview modal
function closePreviewModal() {
    document.getElementById('previewModal').style.display = 'none';
}

// Validate form with error modal
function validateForm() {
    let isValid = true;
    const errors = [];
    const canvasType = document.getElementById('canvasType').value;
    const canvasCount = canvasType === 'single' ? 1 : parseInt(document.getElementById('canvasQuantity').value);

    // Clear all previous errors
    document.querySelectorAll('.validation-error').forEach(error => {
        error.style.display = 'none';
        error.textContent = '';
    });
    document.querySelectorAll('.error-highlight').forEach(elem => {
        elem.classList.remove('error-highlight');
    });

    // Validate each canvas
    for (let i = 0; i < canvasCount; i++) {
        const canvasNum = i + 1;
        
        // Check size selection
        if (!selectedSizes[i] || selectedSizes[i] === '') {
            isValid = false;
            errors.push({
                canvas: i,
                field: 'size',
                message: `Canvas ${canvasNum}: Please select a size`
            });
        }

        // Check image upload
        if (!uploadedImages[i] || uploadedImages[i].length === 0) {
            isValid = false;
            errors.push({
                canvas: i,
                field: 'images',
                message: `Canvas ${canvasNum}: Please upload at least one image`
            });
        }
    }

    // Validate customer info
    const fbName = document.getElementById('fbName').value.trim();
    const email = document.getElementById('email').value.trim();

    if (!fbName) {
        isValid = false;
        errors.push({
            canvas: -1,
            field: 'fbName',
            message: 'Please enter your Facebook name'
        });
    }

    if (!email || !isValidEmail(email)) {
        isValid = false;
        errors.push({
            canvas: -1,
            field: 'email',
            message: 'Please enter a valid email address'
        });
    }

    // Show error modal if validation fails
    if (!isValid) {
        showErrorModal(errors);
    }

    return isValid;
}

// Show error modal
function showErrorModal(errors) {
    const errorList = document.getElementById('errorList');
    errorList.innerHTML = '';
    
    errors.forEach(error => {
        const li = document.createElement('li');
        li.textContent = error.message;
        li.dataset.canvas = error.canvas;
        li.dataset.field = error.field;
        li.onclick = () => goToError(error.canvas, error.field);
        li.style.cursor = 'pointer';
        errorList.appendChild(li);
    });
    
    document.getElementById('errorModal').style.display = 'block';
}

// Navigate to first error
function goToFirstError() {
    const firstError = document.querySelector('#errorList li');
    if (firstError) {
        const canvas = parseInt(firstError.dataset.canvas);
        const field = firstError.dataset.field;
        goToError(canvas, field);
        closeErrorModal();
    }
}

// Navigate to specific error
function goToError(canvasIndex, field) {
    // Switch to correct canvas tab if needed
    if (canvasIndex >= 0) {
        switchCanvas(canvasIndex);
        
        // Highlight the tab
        const tabs = document.querySelectorAll('.tab');
        tabs[canvasIndex]?.classList.add('error-tab');
    }
    
    // Find and highlight the error field
    let targetElement;
    if (field === 'size') {
        targetElement = document.querySelector(`[data-canvas="${canvasIndex}"] .size-grid`);
    } else if (field === 'images') {
        targetElement = document.querySelector(`[data-canvas="${canvasIndex}"] .upload-container`);
    } else if (field === 'fbName') {
        targetElement = document.getElementById('fbName');
    } else if (field === 'email') {
        targetElement = document.getElementById('email');
    }
    
    if (targetElement) {
        const section = targetElement.closest('.form-section');
        if (section) {
            section.classList.add('error-highlight');
            section.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Remove highlight after 3 seconds
            setTimeout(() => {
                section.classList.remove('error-highlight');
                document.querySelectorAll('.error-tab').forEach(tab => {
                    tab.classList.remove('error-tab');
                });
            }, 3000);
        }
    }
}

// Close error modal
function closeErrorModal() {
    document.getElementById('errorModal').style.display = 'none';
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Show error message (legacy function for compatibility)
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

// Confirm order
function confirmOrder() {
    // Store current canvas data
    storeCanvasData(currentCanvasIndex);
    
    if (!validateForm()) {
        return;
    }
    
    // Generate order summary
    const summary = generateOrderSummary();
    document.getElementById('orderSummary').innerHTML = summary;
    
    // Show confirmation modal
    document.getElementById('confirmModal').style.display = 'block';
}

// Generate order summary
function generateOrderSummary() {
    const canvasType = document.getElementById('canvasType').value;
    const canvasCount = canvasType === 'single' ? 1 : parseInt(document.getElementById('canvasQuantity').value);
    
    let summary = '<div class="order-summary">';
    
    // Canvas details
    summary += '<h4>Canvas Details:</h4>';
    summary += `<p>Type: ${canvasType.charAt(0).toUpperCase() + canvasType.slice(1)}</p>`;
    summary += `<p>Quantity: ${canvasCount}</p>`;
    
    // Individual canvas info
    for (let i = 0; i < canvasCount; i++) {
        summary += `<div class="canvas-summary">`;
        summary += `<h5>Canvas ${i + 1}:</h5>`;
        summary += `<p>Size: ${selectedSizes[i]}</p>`;
        
        const isTwoPerson = document.getElementById(`twoPersonCanvas-${i}`)?.checked;
        if (isTwoPerson) {
            summary += `<p>2 People Canvas: Yes (+$10)</p>`;
        }
        
        summary += `<p>Images: ${uploadedImages[i]?.length || 0} uploaded</p>`;
        
        const customText = document.getElementById(`customText-${i}`)?.value;
        if (customText) {
            summary += `<p>Text: ${customText}</p>`;
        }
        
        summary += `</div>`;
    }
    
    // Customer info
    summary += '<h4>Customer Information:</h4>';
    summary += `<p>Facebook Name: ${document.getElementById('fbName').value}</p>`;
    summary += `<p>Email: ${document.getElementById('email').value}</p>`;
    
    const phone = document.getElementById('phone').value;
    if (phone) {
        summary += `<p>Phone: ${phone}</p>`;
    }
    
    // Total price
    summary += `<h4>Total Price: ${document.getElementById('totalPrice').textContent}</h4>`;
    
    summary += '</div>';
    
    return summary;
}

// Close confirmation modal
function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
}

// Submit order
async function submitOrder() {
    try {
        // Show loading state
        const submitButton = document.querySelector('#confirmModal .primary-btn');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Processing...';
        submitButton.disabled = true;
        
        // Prepare form data
        const formData = await prepareFormData();
        
        // Upload images to Google Drive
        const imageUrls = await uploadImagesToGoogleDrive(formData);
        
        // Add image URLs to form data
        formData.imageUrls = imageUrls;
        
        // Send to N8N webhook
        await sendToN8N(formData);
        
        // Close modal and show thank you page
        closeConfirmModal();
        showThankYouPage();
        
    } catch (error) {
        console.error('Error submitting order:', error);
        alert('There was an error submitting your order. Please try again.');
        
        // Reset button
        const submitButton = document.querySelector('#confirmModal .primary-btn');
        submitButton.textContent = 'Confirm Order';
        submitButton.disabled = false;
    }
}

// Prepare form data
async function prepareFormData() {
    const canvasType = document.getElementById('canvasType').value;
    const canvasCount = canvasType === 'single' ? 1 : parseInt(document.getElementById('canvasQuantity').value);
    
    const urlParams = new URLSearchParams(window.location.search);
    
    const formData = {
        // URL parameters
        psid: urlParams.get('psid') || '',
        fbName: urlParams.get('fb_name') || document.getElementById('fbName').value,
        ref: urlParams.get('ref') || '',
        fbc: urlParams.get('fbc') || '',
        fbp: urlParams.get('fbp') || '',
        
        // Customer info
        customerFbName: document.getElementById('fbName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value || '',
        notes: document.getElementById('notes').value || '',
        
        // Canvas info
        canvasType: canvasType,
        canvasCount: canvasCount,
        totalPrice: document.getElementById('totalPrice').textContent,
        
        // Individual canvas details
        canvasDetails: []
    };
    
    // Collect details for each canvas
    for (let i = 0; i < canvasCount; i++) {
        const canvasDetail = {
            canvasNumber: i + 1,
            size: selectedSizes[i],
            price: prices[selectedSizes[i]],
            twoPersonCanvas: document.getElementById(`twoPersonCanvas-${i}`)?.checked || false,
            customText: document.getElementById(`customText-${i}`)?.value || '',
            date: document.getElementById(`date-${i}`)?.value || '',
            welcomeHome: document.getElementById(`welcomeHome-${i}`)?.checked || false,
            imageCount: uploadedImages[i]?.length || 0
        };
        
        // Calculate individual canvas price
        if (canvasType === 'collage') {
            canvasDetail.price += 5;
        }
        if (canvasDetail.twoPersonCanvas) {
            canvasDetail.price += 10;
        }
        
        formData.canvasDetails.push(canvasDetail);
    }
    
    // Add timestamp
    formData.timestamp = new Date().toISOString();
    
    return formData;
}

// Upload images to Google Drive
async function uploadImagesToGoogleDrive(formData) {
    const imageUrls = {};
    const canvasCount = formData.canvasCount;
    
    for (let i = 0; i < canvasCount; i++) {
        const images = uploadedImages[i] || [];
        imageUrls[`canvas_${i + 1}`] = [];
        
        for (let j = 0; j < images.length; j++) {
            try {
                const imageUrl = await uploadToGoogleDrive(images[j], `canvas${i + 1}_image${j + 1}`);
                imageUrls[`canvas_${i + 1}`].push(imageUrl);
            } catch (error) {
                console.error(`Error uploading image ${j + 1} for canvas ${i + 1}:`, error);
            }
        }
    }
    
    return imageUrls;
}

// Upload single image to Google Drive
async function uploadToGoogleDrive(file, fileName) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            try {
                const base64Data = e.target.result.split(',')[1];
                
                const response = await fetch('https://script.google.com/macros/s/AKfycbygWj_cmQvy29D_K31Kci2g0iBIycf9he2SiRFuU3PsBznjofyZjjQZ-kmDAgRUOzAQ/exec', {
                    method: 'POST',
                    body: JSON.stringify({
                        fileName: fileName,
                        mimeType: file.type,
                        data: base64Data
                    })
                });
                
                const result = await response.json();
                
                if (result.status === 'success') {
                    resolve(result.url);
                } else {
                    reject(new Error(result.message || 'Upload failed'));
                }
            } catch (error) {
                reject(error);
            }
        };
        
        reader.readAsDataURL(file);
    });
}

// Send data to N8N webhook
async function sendToN8N(formData) {
    const response = await fetch('https://jm9611.duckdns.org/webhook/form-submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
        throw new Error('Failed to send data to webhook');
    }
    
    return response.json();
}

// Show thank you page
function showThankYouPage() {
    document.querySelector('.container').style.display = 'none';
    document.getElementById('thankYouPage').style.display = 'flex';
}

// Start new order
function startNewOrder() {
    // Reset all data
    selectedSizes = {};
    uploadedImages = { 0: [] };
    canvasFormData = { 0: {} };
    currentCanvasIndex = 0;
    
    // Reset form
    document.getElementById('canvasType').value = 'single';
    document.getElementById('fbName').value = '';
    document.getElementById('email').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('notes').value = '';
    
    // Reset UI
    handleCanvasTypeChange();
    
    // Clear all inputs and selections
    document.querySelectorAll('.size-option').forEach(option => {
        option.classList.remove('active');
    });
    
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]').forEach(input => {
        if (input.id !== 'fbName') { // Keep FB name if from URL
            input.value = '';
        }
    });
    
    document.querySelectorAll('.image-thumbnails').forEach(container => {
        container.innerHTML = '';
    });
    
    document.querySelectorAll('.selected-price').forEach(price => {
        price.style.display = 'none';
    });
    
    // Update character counters
    document.querySelectorAll('[id^="charCount-"]').forEach(counter => {
        counter.textContent = '0';
    });
    
    // Calculate total
    calculateTotalPrice();
    
    // Show form again
    document.querySelector('.container').style.display = 'block';
    document.getElementById('thankYouPage').style.display = 'none';
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// FAQ functions
function openFAQ() {
    document.getElementById('faqModal').style.display = 'block';
}

function closeFAQ() {
    document.getElementById('faqModal').style.display = 'none';
}

function toggleFAQ(element) {
    const answer = element.nextElementSibling;
    const toggle = element.querySelector('.faq-toggle');
    
    if (answer.style.display === 'block') {
        answer.style.display = 'none';
        toggle.textContent = '+';
    } else {
        answer.style.display = 'block';
        toggle.textContent = '-';
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        if (event.target.id === 'cropModal') {
            // Don't close crop modal by clicking outside
            return;
        }
        event.target.style.display = 'none';
    }
}
