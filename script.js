// Global variables
let selectedSizes = {};
let uploadedImages = {};
let canvasFormData = {};
let cropper = null;
let currentCropIndex = null;
let currentCanvasIndex = 0;
let pendingFiles = [];
let currentRotation = 0;

// NEW: Session management and upload tracking
let sessionId = null;
const uploadState = {
    pending: new Set(),
    completed: new Map(),
    failed: new Map()
};

// Price configuration
const prices = {
    '8x10': 34,
    '11x14': 43,
    '16x20': 62,
    '20x30': 82
};

// Original price configuration
const originalPrices = {
    '8x10': 54,
    '11x14': 69,
    '16x20': 79,
    '20x30': 115
};

// Configuration
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbygWj_cmQvy29D_K31Kci2g0iBIycf9he2SiRFuU3PsBznjofyZjjQZ-kmDAgRUOzAQ/exec';
const N8N_WEBHOOK_URL = 'https://jm9611.duckdns.org/webhook/form-submit';
const MAX_UPLOAD_RETRIES = 3;

// NEW: Session ID management
function getOrCreateSessionId() {
    if (!sessionId) {
        const storedSession = localStorage.getItem('jm_canvas_session');
        const sessionExpiry = localStorage.getItem('jm_canvas_session_expiry');
        
        // Check if stored session is still valid
        if (storedSession && sessionExpiry && new Date().getTime() < parseInt(sessionExpiry)) {
            sessionId = storedSession;
        } else {
            // Create new session
            const urlParams = new URLSearchParams(window.location.search);
            const psid = urlParams.get('psid') || '';
            sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${psid}`;
            
            // Store with 24 hour expiry
            localStorage.setItem('jm_canvas_session', sessionId);
            localStorage.setItem('jm_canvas_session_expiry', new Date().getTime() + (24 * 60 * 60 * 1000));
        }
        
        // Restore upload state if exists
        restoreUploadState();
    }
    return sessionId;
}

// NEW: Save upload state to localStorage
function saveUploadStateToLocalStorage() {
    const state = {
        completed: Array.from(uploadState.completed.entries()),
        failed: Array.from(uploadState.failed.entries())
    };
    localStorage.setItem(`jm_canvas_uploads_${sessionId}`, JSON.stringify(state));
}

// NEW: Restore upload state from localStorage
function restoreUploadState() {
    const savedState = localStorage.getItem(`jm_canvas_uploads_${sessionId}`);
    if (savedState) {
        try {
            const state = JSON.parse(savedState);
            uploadState.completed = new Map(state.completed);
            uploadState.failed = new Map(state.failed);
        } catch (e) {
            console.error('Failed to restore upload state:', e);
        }
    }
}

// NEW: Upload single image to TEMP folder - UPDATED to fix CORS
async function uploadSingleImage(blob, canvasIndex, imageOrder, retries = MAX_UPLOAD_RETRIES) {
    const uploadId = `${canvasIndex}_${imageOrder}`;
    
    // Prevent duplicate uploads
    if (uploadState.pending.has(uploadId)) {
        console.warn('Upload already in progress:', uploadId);
        return null;
    }
    
    // Check if already uploaded
    if (uploadState.completed.has(uploadId)) {
        console.log('Image already uploaded:', uploadId);
        return uploadState.completed.get(uploadId);
    }
    
    uploadState.pending.add(uploadId);
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const session = getOrCreateSessionId();
            const filename = `canvas_${canvasIndex}_img_${imageOrder}_${Date.now()}.jpg`;
            
            // Convert blob to base64
            const base64 = await blobToBase64(blob);
            
            // Send as JSON instead of FormData to fix CORS
            const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                mode: 'cors',
                body: JSON.stringify({
                    action: 'upload_temp',
                    session_id: session,
                    canvas_index: canvasIndex,
                    image_order: imageOrder,
                    filename: filename,
                    image: base64,
                    fileSize: blob.size // Track file size
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                uploadState.completed.set(uploadId, result.fileId);
                uploadState.pending.delete(uploadId);
                saveUploadStateToLocalStorage();
                return result.fileId;
            } else {
                throw new Error(result.error || 'Upload failed');
            }
            
        } catch (error) {
            console.error(`Upload attempt ${attempt} failed for ${uploadId}:`, error);
            
            if (attempt === retries) {
                uploadState.failed.set(uploadId, error.toString());
                uploadState.pending.delete(uploadId);
                throw error;
            }
            
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        }
    }
}

// NEW: Convert blob to base64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// NEW: Show upload progress
function showUploadProgress(canvasIndex, imageIndex) {
    const container = document.getElementById(`imageThumbnails-${canvasIndex}`);
    const thumbnails = container.querySelectorAll('.thumbnail');
    
    if (thumbnails[imageIndex]) {
        const thumbnail = thumbnails[imageIndex];
        
        // Add progress bar
        if (!thumbnail.querySelector('.upload-progress')) {
            const progressBar = document.createElement('div');
            progressBar.className = 'upload-progress';
            progressBar.innerHTML = `
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
                <span class="progress-text">Uploading...</span>
            `;
            thumbnail.appendChild(progressBar);
        }
    }
}

// NEW: Update upload progress
function updateUploadProgress(canvasIndex, imageIndex, percent, status = 'uploading') {
    const container = document.getElementById(`imageThumbnails-${canvasIndex}`);
    const thumbnails = container.querySelectorAll('.thumbnail');
    
    if (thumbnails[imageIndex]) {
        const thumbnail = thumbnails[imageIndex];
        const progressBar = thumbnail.querySelector('.upload-progress');
        
        if (progressBar) {
            const fill = progressBar.querySelector('.progress-fill');
            const text = progressBar.querySelector('.progress-text');
            
            fill.style.width = `${percent}%`;
            
            if (status === 'completed') {
                text.textContent = 'Uploaded';
                progressBar.classList.add('completed');
                setTimeout(() => {
                    progressBar.style.display = 'none';
                }, 2000);
            } else if (status === 'failed') {
                text.textContent = 'Failed';
                progressBar.classList.add('failed');
            } else {
                text.textContent = `${Math.round(percent)}%`;
            }
        }
    }
}

// NEW: Handle upload error
function handleUploadError(canvasIndex, imageIndex, error) {
    updateUploadProgress(canvasIndex, imageIndex, 0, 'failed');
    
    const container = document.getElementById(`imageThumbnails-${canvasIndex}`);
    const thumbnails = container.querySelectorAll('.thumbnail');
    
    if (thumbnails[imageIndex]) {
        const thumbnail = thumbnails[imageIndex];
        
        // Add retry button
        if (!thumbnail.querySelector('.retry-btn')) {
            const retryBtn = document.createElement('button');
            retryBtn.className = 'retry-btn';
            retryBtn.innerHTML = '↻ Retry';
            retryBtn.onclick = () => retryUpload(canvasIndex, imageIndex);
            thumbnail.appendChild(retryBtn);
        }
    }
}

// NEW: Retry upload
async function retryUpload(canvasIndex, imageIndex) {
    const imageData = uploadedImages[canvasIndex][imageIndex];
    if (!imageData || !imageData.blob) return;
    
    try {
        // Remove retry button
        const container = document.getElementById(`imageThumbnails-${canvasIndex}`);
        const thumbnails = container.querySelectorAll('.thumbnail');
        const retryBtn = thumbnails[imageIndex]?.querySelector('.retry-btn');
        if (retryBtn) retryBtn.remove();
        
        // Show progress
        showUploadProgress(canvasIndex, imageIndex);
        updateUploadProgress(canvasIndex, imageIndex, 30);
        
        // Upload
        const fileId = await uploadSingleImage(imageData.blob, canvasIndex, imageIndex);
        
        if (fileId) {
            imageData.fileId = fileId;
            imageData.status = 'uploaded';
            updateUploadProgress(canvasIndex, imageIndex, 100, 'completed');
        }
    } catch (error) {
        handleUploadError(canvasIndex, imageIndex, error);
    }
}

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
    
    // Initialize session
    getOrCreateSessionId();
    
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
    
    // Restore previous uploads if any
    restorePreviousUploads();
});

// NEW: Restore previous uploads from session
function restorePreviousUploads() {
    const savedImages = localStorage.getItem(`jm_canvas_images_${sessionId}`);
    if (savedImages) {
        try {
            const images = JSON.parse(savedImages);
            // Restore image data structure
            Object.keys(images).forEach(canvasIndex => {
                uploadedImages[canvasIndex] = images[canvasIndex];
                updateThumbnails(parseInt(canvasIndex));
            });
        } catch (e) {
            console.error('Failed to restore previous uploads:', e);
        }
    }
}

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

// Update preview for canvas 0
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

// Canvas type change handler
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
    
    // Hide/show fields based on canvas type
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
    
    // Show canvas 0 and restore data
    setTimeout(() => {
        switchCanvas(0);
        restoreCanvasData(0);
    }, 0);
    
    calculateTotalPrice();
}

// Update canvas count
function updateCanvasCount() {
    const quantity = parseInt(document.getElementById('canvasQuantity').value);
    const canvasType = document.getElementById('canvasType').value;
    const canvasTabs = document.getElementById('canvasTabs');
    const miniTabs = document.getElementById('miniTabs');
    const miniCanvasNav = document.getElementById('miniCanvasNav');
    const container = document.getElementById('canvasItemsContainer');
    
    // Store current data
    storeCanvasData(0);
    
    // Clear existing tabs
    canvasTabs.innerHTML = '';
    miniTabs.innerHTML = '';
    
    // Clear ALL canvas items
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
        
        // Create canvas items
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

// Create canvas items for a specific index
function createCanvasItems(canvasIndex) {
    const container = document.getElementById('canvasItemsContainer');
    const canvasType = document.getElementById('canvasType').value;
    const isCollage = canvasType === 'collage';
    
    // Double check no duplicate
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

// Generate HTML for canvas items
function generateCanvasHTML(canvasIndex, isCollage = false) {
    let html = '';
    
    // Size Selection
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
    
    // Two Person Canvas (not for collage)
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
    
    // Image Upload
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
    
    // Custom Text
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
    
    // Live Preview Box
    html += createLivePreviewBox(canvasIndex);
    
    // Date (not for collage)
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
    
    // Welcome Home (not for collage)
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

// Switch between canvases
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
    
    // Hide ALL canvas items first
    document.querySelectorAll('.canvas-item').forEach(item => {
        item.style.display = 'none';
    });
    
    // Show only selected canvas items
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

// Update price display
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

// Calculate total price
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

// UPDATED: Apply crop with immediate upload - Keep highest quality
async function applyCrop() {
    if (!cropper) return;
    
    // Disable crop buttons during processing
    const cropButtons = document.querySelectorAll('#cropModal button');
    cropButtons.forEach(btn => btn.disabled = true);
    
    // Get cropped canvas với kích thước gốc (không giới hạn)
    const croppedCanvas = cropper.getCroppedCanvas({
        // Không set width/height cố định - giữ nguyên tỷ lệ 8:10 với resolution cao nhất
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
    });
    
    // Convert to blob với chất lượng cao nhất
    croppedCanvas.toBlob(async function(blob) {
        try {
            // Get current image index
            const imageIndex = uploadedImages[currentCanvasIndex].length;
            
            // Check file size (optional warning)
            if (blob.size > 10 * 1024 * 1024) { // 10MB
                console.warn('Large file size:', (blob.size / 1024 / 1024).toFixed(2) + 'MB');
            }
            
            // Create temporary image data
            const tempImageData = {
                blob: blob,
                status: 'uploading',
                fileId: null,
                thumbnail: URL.createObjectURL(blob),
                fileSize: blob.size,
                originalDimensions: {
                    width: croppedCanvas.width,
                    height: croppedCanvas.height
                }
            };
            
            // Add to uploadedImages
            if (!uploadedImages[currentCanvasIndex]) {
                uploadedImages[currentCanvasIndex] = [];
            }
            uploadedImages[currentCanvasIndex].push(tempImageData);
            
            // Update thumbnails immediately
            updateThumbnails(currentCanvasIndex);
            
            // Close modal
            closeCropModal();
            
            // Show upload progress
            showUploadProgress(currentCanvasIndex, imageIndex);
            updateUploadProgress(currentCanvasIndex, imageIndex, 20);
            
            // Upload to TEMP folder
            try {
                const fileId = await uploadSingleImage(blob, currentCanvasIndex, imageIndex);
                
                if (fileId) {
                    // Update image data with fileId
                    tempImageData.fileId = fileId;
                    tempImageData.status = 'uploaded';
                    updateUploadProgress(currentCanvasIndex, imageIndex, 100, 'completed');
                    
                    // Save to localStorage
                    saveImagesToLocalStorage();
                }
            } catch (uploadError) {
                console.error('Upload failed:', uploadError);
                tempImageData.status = 'failed';
                handleUploadError(currentCanvasIndex, imageIndex, uploadError);
            }
            
            // Process next image
            currentCropIndex++;
            processNextImage();
            
        } catch (error) {
            console.error('Error processing crop:', error);
            alert('Error processing image. Please try again.');
            
            // Re-enable buttons
            cropButtons.forEach(btn => btn.disabled = false);
        }
    }, 'image/jpeg', 0.95); // Chất lượng JPEG 95%
}

// NEW: Save images to localStorage
function saveImagesToLocalStorage() {
    const imagesToSave = {};
    
    Object.keys(uploadedImages).forEach(canvasIndex => {
        imagesToSave[canvasIndex] = uploadedImages[canvasIndex].map(img => ({
            fileId: img.fileId,
            status: img.status,
            thumbnail: img.thumbnail
        }));
    });
    
    localStorage.setItem(`jm_canvas_images_${sessionId}`, JSON.stringify(imagesToSave));
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

// UPDATED: Update thumbnails with upload status
function updateThumbnails(canvasIndex) {
    const container = document.getElementById(`imageThumbnails-${canvasIndex}`);
    container.innerHTML = '';
    
    const images = uploadedImages[canvasIndex] || [];
    
    images.forEach((imageData, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'thumbnail';
        
        // Add status class
        if (imageData.status === 'uploading') {
            thumbnail.classList.add('uploading');
        } else if (imageData.status === 'failed') {
            thumbnail.classList.add('failed');
        }
        
        let thumbnailHTML = `<img src="${imageData.thumbnail}" alt="Uploaded image">`;
        
        // Only show remove button if uploaded or failed
        if (imageData.status !== 'uploading') {
            thumbnailHTML += `<button class="remove-btn" onclick="removeImage(${canvasIndex}, ${index})">✕</button>`;
        }
        
        thumbnail.innerHTML = thumbnailHTML;
        container.appendChild(thumbnail);
    });
}

// UPDATED: Remove image with cleanup
function removeImage(canvasIndex, imageIndex) {
    const imageData = uploadedImages[canvasIndex][imageIndex];
    
    // Revoke blob URL if exists
    if (imageData.thumbnail && imageData.thumbnail.startsWith('blob:')) {
        URL.revokeObjectURL(imageData.thumbnail);
    }
    
    // Remove from array
    uploadedImages[canvasIndex].splice(imageIndex, 1);
    
    // Update upload state
    const uploadId = `${canvasIndex}_${imageIndex}`;
    uploadState.completed.delete(uploadId);
    uploadState.failed.delete(uploadId);
    
    // Save to localStorage
    saveImagesToLocalStorage();
    saveUploadStateToLocalStorage();
    
    // Update thumbnails
    updateThumbnails(canvasIndex);
}

// UPDATED: Validate form with upload check
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
        const images = uploadedImages[i] || [];
        if (images.length === 0) {
            isValid = false;
            errors.push({
                canvas: i,
                field: 'images',
                message: `Canvas ${canvasNum}: Please upload at least one image`
            });
        } else {
            // NEW: Check if all images are uploaded
            const pendingUploads = images.filter(img => img.status === 'uploading');
            const failedUploads = images.filter(img => img.status === 'failed');
            
            if (pendingUploads.length > 0) {
                isValid = false;
                errors.push({
                    canvas: i,
                    field: 'images',
                    message: `Canvas ${canvasNum}: ${pendingUploads.length} image(s) still uploading`
                });
            }
            
            if (failedUploads.length > 0) {
                isValid = false;
                errors.push({
                    canvas: i,
                    field: 'images',
                    message: `Canvas ${canvasNum}: ${failedUploads.length} image(s) failed to upload`
                });
            }
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

// Generate order summary
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

// UPDATED: Submit order with new flow
async function submitOrder() {
    try {
        // Show loading state
        const submitButton = document.querySelector('#confirmModal .primary-btn');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Processing...';
        submitButton.disabled = true;
        
        // Generate order ID
        const fbName = document.getElementById('fbName').value;
        
        // Normalize FB name for Order ID
        const normalizedName = fbName
            .trim()
            .toLowerCase()
            .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
            .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
            .replace(/[ìíịỉĩ]/g, 'i')
            .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
            .replace(/[ùúụủũưừứựửữ]/g, 'u')
            .replace(/[ỳýỵỷỹ]/g, 'y')
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '')
            .substring(0, 20);
        
        // Format timestamp
        const now = new Date();
        const dateStr = now.getFullYear().toString() +
            (now.getMonth() + 1).toString().padStart(2, '0') +
            now.getDate().toString().padStart(2, '0');
        const timeStr = now.getHours().toString().padStart(2, '0') +
            now.getMinutes().toString().padStart(2, '0') +
            now.getSeconds().toString().padStart(2, '0');
        const ms = now.getMilliseconds().toString().padStart(3, '0');
        
        const orderId = `JM_${normalizedName}_${dateStr}_${timeStr}_${ms}`;
        
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        
        // Get canvas info
        const canvasType = document.getElementById('canvasType').value;
        const canvasCount = canvasType === 'single' ? 1 : parseInt(document.getElementById('canvasQuantity').value);
        
        // Build file mappings for Apps Script
        const fileMappings = {};
        const canvases = [];
        let totalValue = 0;
        let primarySize = '';
        
        for (let i = 0; i < canvasCount; i++) {
            const images = uploadedImages[i] || [];
            const fileIds = images.map(img => img.fileId).filter(id => id);
            
            fileMappings[`canvas_${i}`] = fileIds;
            
            // Calculate canvas value
            let canvasValue = prices[selectedSizes[i]];
            if (canvasType === 'collage') {
                canvasValue += 5;
            } else if (document.getElementById(`twoPersonCanvas-${i}`)?.checked) {
                canvasValue += 10;
            }
            
            totalValue += canvasValue;
            if (i === 0) primarySize = selectedSizes[i];
            
            // Build canvas object
            const canvasData = {
                canvas_id: i + 1,
                canvas_type: canvasType,
                size: selectedSizes[i],
                value: canvasValue,
                custom_text: document.getElementById(`customText-${i}`)?.value || '',
                date: document.getElementById(`date-${i}`)?.value || '',
                welcome_home: document.getElementById(`welcomeHome-${i}`)?.checked || false
            };
            
            canvases.push(canvasData);
        }
        
        // Apply discounts to get FINAL total
        let finalTotal = totalValue;
        if (canvasCount >= 5) {
            finalTotal = Math.round(totalValue * 0.88); // 12% off
        } else if (canvasCount >= 3) {
            finalTotal = Math.round(totalValue * 0.95); // 5% off
        }
        
        // Get customer info
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value || '';
        
        // Parse name
        const nameParts = fbName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        // Format submit time
        const submitTime = new Date().toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        
        // 1. Send to N8N webhook IMMEDIATELY
        const n8nData = {
            order_id: orderId,
            psid: urlParams.get('psid') || '',
            fb_name: fbName,
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone: phone,
            ref: urlParams.get('ref') || '',
            fbc: urlParams.get('fbc') || '',
            fbp: urlParams.get('fbp') || '',
            product: canvasType === 'single' ? 'Single Canvas' : 
                    canvasType === 'multi' ? 'Multiple Canvas' : 'Collage Canvas',
            size: primarySize,
            value: finalTotal,
            currency: 'USD',
            photo_links: '[]', // Always empty as requested
            note: document.getElementById('notes').value || '',
            submit_time: submitTime,
            status: 'pending'
        };
        
        // Send to N8N (fire and forget)
        fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(n8nData)
        }).catch(error => {
            console.error('N8N error (non-blocking):', error);
        });
        
        // 2. Organize files in Google Drive (async)
        const organizeData = {
            action: 'organize_order',
            order_id: orderId,
            session_id: getOrCreateSessionId(),
            file_mappings: fileMappings,
            customer_info: {
                fb_name: fbName,
                email: email,
                phone: phone
            },
            canvases: canvases,
            notes: document.getElementById('notes').value || ''
        };
        
        // Send to Apps Script (fire and forget)
        fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(organizeData)
        }).catch(error => {
            console.error('GAS organize error (non-blocking):', error);
        });
        
        // 3. Clear session data
        localStorage.removeItem(`jm_canvas_images_${sessionId}`);
        localStorage.removeItem(`jm_canvas_uploads_${sessionId}`);
        localStorage.removeItem('jm_canvas_session');
        localStorage.removeItem('jm_canvas_session_expiry');
        
        // 4. Show success page immediately
        setTimeout(() => {
            closeConfirmModal();
            showThankYouPage();
        }, 500);
        
    } catch (error) {
        console.error('Error in submitOrder:', error);
        alert('There was an error submitting your order. Please try again.');
        
        // Reset button
        const submitButton = document.querySelector('#confirmModal .primary-btn');
        if (submitButton) {
            submitButton.textContent = 'Confirm Order';
            submitButton.disabled = false;
        }
    }
}

// Helper function to convert file to base64
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
    
    // Clear upload state
    uploadState.pending.clear();
    uploadState.completed.clear();
    uploadState.failed.clear();
    
    // Generate new session
    sessionId = null;
    getOrCreateSessionId();
    
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
