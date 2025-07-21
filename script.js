// Global variables
let selectedSizes = {};
let uploadedImages = {};
let canvasFormData = {};
let cropper = null;
let currentCropIndex = null;
let currentCanvasIndex = 0; // FIXED: Initialize to 0 instead of null
let pendingFiles = [];
let currentRotation = 0;

// Price configuration
const prices = {
    '8x10': 34,
    '11x14': 43,
    '16x20': 62,
    '20x30': 82
};

// Original price configuration - ADDED
const originalPrices = {
    '8x10': 54,
    '11x14': 69,
    '16x20': 79,
    '20x30': 115
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Load custom fonts
    const textFont = new FontFace('CustomText', 'url(./assets/text-font.ttf)');
    const dateFont = new FontFace('CustomDate', 'url(./assets/date-font.ttf)');
    
    Promise.all([textFont.load(), dateFont.load()]).then(fonts => {
        fonts.forEach(font => document.fonts.add(font));
    }).catch(err => {
        console.log('Font loading failed, using fallback fonts');
    });
    
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    
    // Pre-fill FB name if available
    const fbName = urlParams.get('fb_name');
    if (fbName) {
        document.getElementById('fbName').value = decodeURIComponent(fbName);
    }
    
    // Initialize character counter and live preview for canvas 0
    const customTextInput = document.getElementById('customText-0');
    if (customTextInput) {
        customTextInput.addEventListener('input', function() {
            updateCharCount(0);
            updateLivePreview(0);
        });
    }
    
    // Initialize date input listener for canvas 0
    const dateInput = document.getElementById('date-0');
    if (dateInput) {
        dateInput.addEventListener('input', function() {
            updateLivePreview(0);
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

// Update live preview
function updateLivePreview(canvasIndex) {
    const customText = document.getElementById(`customText-${canvasIndex}`)?.value || '';
    const date = document.getElementById(`date-${canvasIndex}`)?.value || '';
    const canvasType = document.getElementById('canvasType').value;
    
    const previewTextElement = document.getElementById(`previewText-${canvasIndex}`);
    const previewDateElement = document.getElementById(`previewDate-${canvasIndex}`);
    
    if (previewTextElement) {
        previewTextElement.textContent = customText || 'Your text will appear here';
        previewTextElement.style.opacity = customText ? '1' : '0.5';
    }
    
    if (previewDateElement && canvasType !== 'collage') {
        previewDateElement.textContent = date || 'Date will appear here';
        previewDateElement.style.opacity = date ? '1' : '0.5';
    }
}

// Create live preview box
function createLivePreviewBox(canvasIndex) {
    const canvasType = document.getElementById('canvasType').value;
    const isCollage = canvasType === 'collage';
    
    return `
        <div class="form-section canvas-item live-preview-section" data-canvas="${canvasIndex}" style="display: none;">
            <div class="live-preview-box ${isCollage ? 'collage-preview' : ''}" id="livePreview-${canvasIndex}" style="height: ${isCollage ? '50px' : '90px'};">
                <div class="preview-text" id="previewText-${canvasIndex}">Your text will appear here</div>
                ${!isCollage ? `<div class="preview-date" id="previewDate-${canvasIndex}">Date will appear here</div>` : ''}
            </div>
        </div>
    `;
}

// THÊM function mới để update preview cho canvas 0
function updateCanvas0Preview() {
    const canvasType = document.getElementById('canvasType').value;
    const isCollage = canvasType === 'collage';
    const livePreviewBox = document.getElementById('livePreview-0');
    const datePreview = document.getElementById('previewDate-0');
    
    if (livePreviewBox) {
        if (isCollage) {
            livePreviewBox.style.height = '50px';
            livePreviewBox.classList.add('collage-preview');
            if (datePreview) {
                datePreview.style.display = 'none';
            }
        } else {
            livePreviewBox.style.height = '90px';
            livePreviewBox.classList.remove('collage-preview');
            if (datePreview) {
                datePreview.style.display = 'block';
            }
        }
    }
}

// Canvas type change handler - UPDATED với recreate canvas 0
function handleCanvasTypeChange() {
    const canvasType = document.getElementById('canvasType').value;
    const multiCanvasSection = document.getElementById('multiCanvasSection');
    const canvasQuantitySelect = document.getElementById('canvasQuantity');
    const canvasTabs = document.getElementById('canvasTabs');
    const miniCanvasNav = document.getElementById('miniCanvasNav');
    
    // Store current canvas data
    storeCanvasData(currentCanvasIndex);
    
    // Update collage price display
    updateCollagePriceDisplay();
    
    if (canvasType === 'multi' || canvasType === 'collage') {
        multiCanvasSection.style.display = 'block';
        
        // Clear and rebuild options
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
        }
        
        // Set default value
        canvasQuantitySelect.value = canvasType === 'collage' ? '1' : '2';
        
        canvasTabs.style.display = 'flex';
        miniCanvasNav.style.display = 'block';
        
        // Reset currentCanvasIndex
        currentCanvasIndex = 0;
        
        updateCanvasCount();
    } else {
        multiCanvasSection.style.display = 'none';
        canvasTabs.style.display = 'none';
        miniCanvasNav.style.display = 'none';
        currentCanvasIndex = 0;
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

// Reset to single canvas - UPDATED để recreate canvas 0
function resetToSingleCanvas() {
    const container = document.getElementById('canvasItemsContainer');
    
    // Store canvas 0 data before clearing
    storeCanvasData(0);
    
    // Clear ALL canvas items
    container.innerHTML = '';
    
    // Keep only canvas 0 data
    selectedSizes = { 0: selectedSizes[0] };
    uploadedImages = { 0: uploadedImages[0] || [] };
    canvasFormData = { 0: canvasFormData[0] || {} };
    
    // Recreate canvas 0
    createCanvasItems(0);
    
    // Console log verification
    console.log('=== Single Canvas Reset ===');
    const canvas0Items = document.querySelectorAll('[data-canvas="0"]');
    console.log(`Canvas 0 items: ${canvas0Items.length}`);
    console.log('=== End Reset ===');
    
    // Show canvas 0 and restore data
    setTimeout(() => {
        switchCanvas(0);
        restoreCanvasData(0);
    }, 0);
    
    calculateTotalPrice();
}

// Update canvas count - UPDATED để recreate tất cả canvas kể cả canvas 0
function updateCanvasCount() {
    const quantity = parseInt(document.getElementById('canvasQuantity').value);
    const canvasType = document.getElementById('canvasType').value;
    const canvasTabs = document.getElementById('canvasTabs');
    const miniTabs = document.getElementById('miniTabs');
    const miniCanvasNav = document.getElementById('miniCanvasNav');
    const container = document.getElementById('canvasItemsContainer');
    
    // Store current data của canvas 0 trước khi xóa
    storeCanvasData(0);
    
    // Clear existing tabs
    canvasTabs.innerHTML = '';
    miniTabs.innerHTML = '';
    
    // QUAN TRỌNG: Xóa TẤT CẢ canvas items kể cả canvas 0
    container.innerHTML = '';
    
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
    
    // Generate tabs and recreate ALL canvas items
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
        
        // Initialize data structures if not exist
        if (!uploadedImages[i]) uploadedImages[i] = [];
        if (!canvasFormData[i]) canvasFormData[i] = {};
        
        // Create canvas items - INCLUDING canvas 0
        createCanvasItems(i);
    }
    
    // Clean up excess data
    Object.keys(uploadedImages).forEach(key => {
        if (parseInt(key) >= quantity) {
            delete uploadedImages[key];
            delete canvasFormData[key];
            delete selectedSizes[key];
        }
    });
    
    // Update totals
    document.getElementById('totalCanvasNum').textContent = quantity;
    
    // Ensure currentCanvasIndex is valid
    if (currentCanvasIndex >= quantity) {
        currentCanvasIndex = 0;
    }
    
    // Console log để verify
    console.log('=== Canvas Creation Verification ===');
    console.log(`Total canvas requested: ${quantity}`);
    console.log(`Canvas type: ${canvasType}`);
    
    for (let i = 0; i < quantity; i++) {
        const canvasItems = document.querySelectorAll(`[data-canvas="${i}"]`);
        console.log(`Canvas ${i}: ${canvasItems.length} items found`);
        
        // Verify specific elements
        const elements = {
            size: document.querySelector(`[data-canvas="${i}"] .size-grid`),
            upload: document.getElementById(`imageInput-${i}`),
            customText: document.getElementById(`customText-${i}`),
            livePreview: document.getElementById(`livePreview-${i}`),
            date: document.getElementById(`date-${i}`),
            welcomeHome: document.getElementById(`welcomeHome-${i}`),
            twoPersonCanvas: document.getElementById(`twoPersonCanvas-${i}`)
        };
        
        console.log(`Canvas ${i} elements:`, {
            size: !!elements.size,
            upload: !!elements.upload,
            customText: !!elements.customText,
            livePreview: !!elements.livePreview,
            date: !!elements.date,
            welcomeHome: !!elements.welcomeHome,
            twoPersonCanvas: !!elements.twoPersonCanvas
        });
    }
    console.log('=== End Verification ===');
    
    // Show current canvas after creation
    setTimeout(() => {
        switchCanvas(currentCanvasIndex);
        // Restore data for all canvas after recreation
        for (let i = 0; i < quantity; i++) {
            restoreCanvasData(i);
        }
    }, 0);
    
    calculateTotalPrice();
    updateCollageFields();
}

// Create canvas items for a specific index - UPDATED để cho phép tạo canvas 0
function createCanvasItems(canvasIndex) {
    // Remove the check that prevents canvas 0 creation
    // if (canvasIndex === 0) return;
    
    const container = document.getElementById('canvasItemsContainer');
    const canvasType = document.getElementById('canvasType').value;
    const isCollage = canvasType === 'collage';
    
    // Double check không tạo duplicate
    const existingItems = document.querySelectorAll(`[data-canvas="${canvasIndex}"]`);
    if (existingItems.length > 0) {
        console.warn(`Canvas items for index ${canvasIndex} already exist - removing old ones`);
        existingItems.forEach(item => item.remove());
    }
    
    let html = generateCanvasHTML(canvasIndex, isCollage);
    
    // Insert HTML
    container.insertAdjacentHTML('beforeend', html);
    
    // Initialize character counter and live preview for new canvas
    const customTextInput = document.getElementById(`customText-${canvasIndex}`);
    if (customTextInput) {
        customTextInput.addEventListener('input', function() {
            updateCharCount(canvasIndex);
            updateLivePreview(canvasIndex);
        });
    }
    
    // Initialize date input listener
    const dateInput = document.getElementById(`date-${canvasIndex}`);
    if (dateInput) {
        dateInput.addEventListener('input', function() {
            updateLivePreview(canvasIndex);
        });
    }
}

// Generate HTML for canvas items - UPDATED với ID chính xác
function generateCanvasHTML(canvasIndex, isCollage = false) {
    let html = '';
    
    // Size Selection - với data-canvas chính xác
    html += `
        <div class="form-section canvas-item" data-canvas="${canvasIndex}" style="display: none;">
            <h2>Select Size *</h2>
            <div class="size-grid">
                <div class="size-option" data-size="8x10" onclick="selectSize('8x10', ${canvasIndex})">
                    <div class="size-display">8x10 inches</div>
                    <div class="collage-price" style="display: ${isCollage ? 'block' : 'none'};">+$5 for collage</div>
                </div>
                <div class="size-option" data-size="11x14" onclick="selectSize('11x14', ${canvasIndex})">
                    <div class="size-display">11x14 inches</div>
                    <div class="best-seller">Best Seller</div>
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
    
    // Two Person Canvas (not for collage) - với ID unique
    if (!isCollage) {
        html += `
            <div class="form-section canvas-item" data-canvas="${canvasIndex}" id="twoPersonSection-${canvasIndex}" style="display: none;">
                <div class="checkbox-wrapper">
                    <input type="checkbox" id="twoPersonCanvas-${canvasIndex}" onchange="handleTwoPersonChange(${canvasIndex})">
                    <label for="twoPersonCanvas-${canvasIndex}">2 people on 1 canvas (+$10)</label>
                </div>
            </div>
        `;
    }
    
    // Image Upload - với ID unique
    html += `
        <div class="form-section canvas-item" data-canvas="${canvasIndex}" style="display: none;">
            <h2>Upload Images *</h2>
            <div class="upload-container">
                <div class="upload-area" onclick="triggerFileInput(${canvasIndex})">
                    <div class="upload-icon">📷</div>
                    <div class="upload-text">Click to upload images (Max 6)</div>
                    <div class="upload-subtext">Supports JPG, PNG - Will be cropped to 8:10 ratio</div>
                </div>
                <input type="file" id="imageInput-${canvasIndex}" multiple accept="image/jpeg,image/jpg,image/png" style="display: none;" onchange="handleImageUpload(event, ${canvasIndex})">
                <div class="image-thumbnails" id="imageThumbnails-${canvasIndex}"></div>
            </div>
            <div class="validation-error" id="image-error-${canvasIndex}"></div>
        </div>
    `;
    
    // Custom Text - với ID unique
    html += `
        <div class="form-section canvas-item" data-canvas="${canvasIndex}" style="display: none;">
            <div class="form-group">
                <label>Enter your text</label>
                <input type="text" id="customText-${canvasIndex}" maxlength="50" 
                       placeholder="e.g., Forever Together" 
                       oninput="updateCharCount(${canvasIndex}); updateLivePreview(${canvasIndex})">
                <div class="char-counter">
                    <span id="charCount-${canvasIndex}">0</span>/50
                </div>
            </div>
        </div>
    `;
    
    // Live Preview Box - với ID unique
    html += createLivePreviewBox(canvasIndex);
    
    // Date (not for collage) - với ID unique
    if (!isCollage) {
        html += `
            <div class="form-section canvas-item" data-canvas="${canvasIndex}" id="dateSection-${canvasIndex}" style="display: none;">
                <div class="form-group">
                    <label>Date</label>
                    <input type="text" id="date-${canvasIndex}" 
                           placeholder="e.g., Dec 25, 2024" 
                           oninput="updateLivePreview(${canvasIndex})">
                </div>
            </div>
        `;
    }
    
    // Welcome Home (not for collage) - với ID unique
    if (!isCollage) {
        html += `
            <div class="form-section canvas-item" data-canvas="${canvasIndex}" id="welcomeHomeSection-${canvasIndex}" style="display: none;">
                <div class="checkbox-wrapper">
                    <input type="checkbox" id="welcomeHome-${canvasIndex}">
                    <label for="welcomeHome-${canvasIndex}">Welcome Home</label>
                </div>
            </div>
        `;
    }
    
    return html;
}

// Switch between canvases - UPDATED
function switchCanvas(index) {
    // Validate index
    if (index === null || index === undefined || index < 0) return;
    
    // Store current canvas data
    if (currentCanvasIndex !== null && currentCanvasIndex !== undefined) {
        storeCanvasData(currentCanvasIndex);
    }
    
    // Update active tab
    document.querySelectorAll('.tab').forEach((tab, i) => {
        tab.classList.toggle('active', i === index);
    });
    
    document.querySelectorAll('.mini-tab').forEach((tab, i) => {
        tab.classList.toggle('active', i === index);
    });
    
    // QUAN TRỌNG: Ẩn TẤT CẢ canvas items trước
    document.querySelectorAll('.canvas-item').forEach(item => {
        item.style.display = 'none';
    });
    
    // Chỉ hiển thị canvas items của index được chọn
    const itemsToShow = document.querySelectorAll(`[data-canvas="${index}"]`);
    if (itemsToShow.length === 0) {
        console.error(`No canvas items found for index ${index}`);
        return;
    }
    
    itemsToShow.forEach(item => {
        item.style.display = 'block';
    });
    
    // Handle collage-specific fields
    const canvasType = document.getElementById('canvasType').value;
    if (canvasType === 'collage') {
        const dateSection = document.getElementById(`dateSection-${index}`);
        const welcomeSection = document.getElementById(`welcomeHomeSection-${index}`);
        const twoPersonSection = document.getElementById(`twoPersonSection-${index}`);
        
        if (dateSection) dateSection.style.display = 'none';
        if (welcomeSection) welcomeSection.style.display = 'none';
        if (twoPersonSection) twoPersonSection.style.display = 'none';
        
        const livePreviewBox = document.getElementById(`livePreview-${index}`);
        const datePreview = document.getElementById(`previewDate-${index}`);
        
        if (livePreviewBox) {
            livePreviewBox.style.height = '50px';
            livePreviewBox.classList.add('collage-preview');
            if (datePreview) {
                datePreview.style.display = 'none';
            }
        }
    }
    
    // Update current canvas number
    if (document.getElementById('currentCanvasNum')) {
        document.getElementById('currentCanvasNum').textContent = index + 1;
    }
    
    // Update current index
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
    
    // Update live preview after restoring data
    updateLivePreview(canvasIndex);
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

// Update price display - UPDATED
function updatePriceDisplay(canvasIndex) {
    const size = selectedSizes[canvasIndex];
    const priceElement = document.getElementById(`selectedPrice-${canvasIndex}`);
    
    if (!size || !priceElement) return;
    
    const originalPrice = originalPrices[size];
    const basePrice = prices[size];
    const isTwoPerson = document.getElementById(`twoPersonCanvas-${canvasIndex}`)?.checked;
    const canvasType = document.getElementById('canvasType').value;
    
    let finalPrice = basePrice;
    let priceHTML = '';
    
    if (canvasType === 'collage') {
        finalPrice += 5;
        const savings = originalPrice - finalPrice;
        priceHTML = `Price: <span class="original-price">$${originalPrice}</span> $${finalPrice} <span class="save-amount">(Save $${savings})</span>`;
    } else if (isTwoPerson) {
        finalPrice += 10;
        const savings = originalPrice - finalPrice;
        priceHTML = `Price: <span class="original-price">$${originalPrice}</span> $${finalPrice} <span class="save-amount">(Save $${savings})</span>`;
    } else {
        const savings = originalPrice - basePrice;
        priceHTML = `Price: <span class="original-price">$${originalPrice}</span> $${basePrice} <span class="save-amount">(Save $${savings})</span>`;
    }
    
    priceElement.innerHTML = priceHTML;
    priceElement.style.display = 'block';
    
    calculateTotalPrice();
}

// Calculate total price - UPDATED
function calculateTotalPrice() {
    let total = 0;
    let originalTotal = 0;
    const canvasType = document.getElementById('canvasType').value;
    const canvasCount = canvasType === 'single' ? 1 : parseInt(document.getElementById('canvasQuantity').value);
    
    for (let i = 0; i < canvasCount; i++) {
        if (selectedSizes[i]) {
            // Calculate original price
            originalTotal += originalPrices[selectedSizes[i]];
            
            // Calculate discounted price
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
    let discountPercent = 0;
    if (canvasCount >= 5) {
        total = total * 0.88; // 12% off
        discountPercent = 12;
    } else if (canvasCount >= 3) {
        total = total * 0.95; // 5% off
        discountPercent = 5;
    }
    
    const finalTotal = Math.round(total);
    const totalSavings = originalTotal - finalTotal;
    
    let priceHTML = '';
    if (discountPercent > 0) {
        priceHTML = `<span class="original-total">$${originalTotal}</span> $${finalTotal} <span class="discount-info">(${discountPercent}% OFF)</span> <span class="save-info">Save $${totalSavings}</span>`;
    } else {
        priceHTML = `<span class="original-total">$${originalTotal}</span> $${finalTotal} <span class="save-info">Save $${totalSavings}</span>`;
    }
    
    document.getElementById('totalPrice').innerHTML = priceHTML;
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

// Confirm order - UPDATED
function confirmOrder() {
    // Store ALL canvas data before validation
    const canvasType = document.getElementById('canvasType').value;
    const canvasCount = canvasType === 'single' ? 1 : parseInt(document.getElementById('canvasQuantity').value || 1);
    
    // Store data for all canvases
    for (let i = 0; i < canvasCount; i++) {
        storeCanvasData(i);
    }
    
    if (!validateForm()) {
        return;
    }
    
    // Generate order summary
    const summary = generateOrderSummary();
    document.getElementById('orderSummary').innerHTML = summary;
    
    // Show confirmation modal
    document.getElementById('confirmModal').style.display = 'block';
}

// Generate order summary - COMPLETELY UPDATED
function generateOrderSummary() {
    const canvasType = document.getElementById('canvasType').value;
    const canvasCount = canvasType === 'single' ? 1 : parseInt(document.getElementById('canvasQuantity').value);
    
    let summary = '<div class="order-summary">';
    
    // Canvas details
    summary += '<h4>Canvas Details:</h4>';
    summary += `<p><strong>Type:</strong> ${canvasType.charAt(0).toUpperCase() + canvasType.slice(1)}</p>`;
    summary += `<p><strong>Quantity:</strong> ${canvasCount}</p>`;
    
    // Calculate total before discount
    let subtotal = 0;
    
    // Individual canvas info
    for (let i = 0; i < canvasCount; i++) {
        summary += `<div class="canvas-summary">`;
        summary += `<h5>Canvas ${i + 1}:</h5>`;
        
        // Size and base price
        const size = selectedSizes[i];
        let canvasPrice = prices[size];
        summary += `<p><strong>Size:</strong> ${size} - $${canvasPrice}</p>`;
        
        // Canvas-specific options
        if (canvasType === 'collage') {
            canvasPrice += 5;
            summary += `<p><strong>Collage Layout:</strong> Yes (+$5)</p>`;
        } else {
            // Two Person Canvas (not for collage)
            const isTwoPerson = document.getElementById(`twoPersonCanvas-${i}`)?.checked;
            if (isTwoPerson) {
                canvasPrice += 10;
                summary += `<p><strong>2 People Canvas:</strong> Yes (+$10)</p>`;
            }
            
            // Date (not for collage)
            const date = document.getElementById(`date-${i}`)?.value;
            if (date) {
                summary += `<p><strong>Date:</strong> ${date}</p>`;
            }
            
            // Welcome Home (not for collage)
            const welcomeHome = document.getElementById(`welcomeHome-${i}`)?.checked;
            if (welcomeHome) {
                summary += `<p><strong>Welcome Home:</strong> Yes</p>`;
            }
        }
        
        // Images
        const imageCount = uploadedImages[i]?.length || 0;
        summary += `<p><strong>Images:</strong> ${imageCount} uploaded</p>`;
        
        // Custom Text
        const customText = document.getElementById(`customText-${i}`)?.value;
        if (customText) {
            summary += `<p><strong>Custom Text:</strong> "${customText}"</p>`;
        }
        
        // Canvas subtotal
        summary += `<p class="canvas-price"><strong>Canvas Price:</strong> $${canvasPrice}</p>`;
        subtotal += canvasPrice;
        
        summary += `</div>`;
    }
    
    // Notes section
    const notes = document.getElementById('notes').value;
    if (notes) {
        summary += '<h4>Additional Notes:</h4>';
        summary += `<p>${notes}</p>`;
    }
    
    // Customer info
    summary += '<h4>Customer Information:</h4>';
    summary += `<p><strong>Facebook Name:</strong> ${document.getElementById('fbName').value}</p>`;
    summary += `<p><strong>Email:</strong> ${document.getElementById('email').value}</p>`;
    
    const phone = document.getElementById('phone').value;
    if (phone) {
        summary += `<p><strong>Phone:</strong> ${phone}</p>`;
    }
    
    // Price breakdown
    summary += '<h4>Price Breakdown:</h4>';
    summary += `<p><strong>Subtotal:</strong> $${subtotal}</p>`;
    
    // Calculate discount
    let discountPercent = 0;
    let discountAmount = 0;
    if (canvasCount >= 5) {
        discountPercent = 12;
        discountAmount = Math.round(subtotal * 0.12);
    } else if (canvasCount >= 3) {
        discountPercent = 5;
        discountAmount = Math.round(subtotal * 0.05);
    }
    
    if (discountPercent > 0) {
        summary += `<p><strong>Discount (${discountPercent}%):</strong> -$${discountAmount}</p>`;
    }
    
    const finalTotal = subtotal - discountAmount;
    summary += `<h4 class="final-total"><strong>Total Price:</strong> $${finalTotal}</h4>`;
    
    summary += '</div>';
    
    return summary;
}

// Close confirmation modal
function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
}

// Submit order - VERIFIED SOLUTION
async function submitOrder() {
    try {
        // Show loading state
        const submitButton = document.querySelector('#confirmModal .primary-btn');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Processing...';
        submitButton.disabled = true;
        
        // Generate order ID
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        const orderId = `JM_${random}`;
        
        // Get canvas info
        const canvasType = document.getElementById('canvasType').value;
        const canvasCount = canvasType === 'single' ? 1 : parseInt(document.getElementById('canvasQuantity').value);
        
        // Build canvases array matching Apps Script structure
        const canvases = [];
        
        for (let i = 0; i < canvasCount; i++) {
            const images = uploadedImages[i] || [];
            const base64Images = [];
            
            // Convert all images to base64
            for (const file of images) {
                const base64 = await fileToBase64(file);
                base64Images.push(base64);
            }
            
            // Build canvas object matching Apps Script expectation
            const canvasData = {
                canvas_id: i + 1,
                canvas_type: canvasType,
                size: selectedSizes[i],
                value: prices[selectedSizes[i]],
                images: base64Images,
                custom_text: document.getElementById(`customText-${i}`)?.value || '',
                date: document.getElementById(`date-${i}`)?.value || '',
                welcome_home: document.getElementById(`welcomeHome-${i}`)?.checked || false
            };
            
            // Add two_person_canvas if applicable
            if (canvasType !== 'collage') {
                const twoPersonChecked = document.getElementById(`twoPersonCanvas-${i}`)?.checked || false;
                if (twoPersonChecked) {
                    canvasData.value += 10; // Add $10 to value
                }
            }
            
            canvases.push(canvasData);
        }
        
        // Build request data matching Apps Script structure exactly
        const requestData = {
            order_id: orderId,
            customer_info: {
                fb_name: document.getElementById('fbName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value || ''
            },
            canvases: canvases,
            notes: document.getElementById('notes').value || ''
        };
        
        // Send to Google Apps Script
        const scriptUrl = 'https://script.google.com/macros/s/AKfycbygWj_cmQvy29D_K31Kci2g0iBIycf9he2SiRFuU3PsBznjofyZjjQZ-kmDAgRUOzAQ/exec';
        
        // Use fetch with no-cors mode
        fetch(scriptUrl, {
            method: 'POST',
            mode: 'no-cors', // Required for Google Apps Script
            headers: {
                'Content-Type': 'text/plain' // Required by Apps Script
            },
            body: JSON.stringify(requestData)
        }).then(() => {
            // Can't read response in no-cors mode, but request is sent
            // Wait a bit to ensure processing
            setTimeout(() => {
                closeConfirmModal();
                showThankYouPage();
            }, 1000);
        }).catch(error => {
            console.error('Error submitting order:', error);
            alert('There was an error submitting your order. Please try again.');
            
            // Reset button
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        });
        
    } catch (error) {
        console.error('Error in submitOrder:', error);
        alert('There was an error processing your order. Please try again.');
        
        // Reset button
        const submitButton = document.querySelector('#confirmModal .primary-btn');
        if (submitButton) {
            submitButton.textContent = 'Confirm Order';
            submitButton.disabled = false;
        }
    }
}

// Helper function to convert file to base64 - REQUIRED
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // Extract base64 data without data URL prefix
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
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
    
    // Reset live previews
    document.querySelectorAll('[id^="previewText-"]').forEach(preview => {
        preview.textContent = 'Your text will appear here';
        preview.style.opacity = '0.5';
    });
    
    document.querySelectorAll('[id^="previewDate-"]').forEach(preview => {
        preview.textContent = 'Date will appear here';
        preview.style.opacity = '0.5';
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
