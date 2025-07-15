// Global variables
let cropper = null;
let currentCropIndex = 0;
let currentCanvasIndex = 0;
let uploadedImages = {}; // Changed to object to store images per canvas
let currentLanguage = 'en';
let canvasCount = 1;
let canvasType = 'single';
let urlParams = {};

// ========== IMAGE COMPRESSION FUNCTIONS ==========
// Flexible compression - không bắt buộc size tối thiểu
async function compressImage(file, maxWidth = 4000, quality = 0.92) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                // Lấy kích thước gốc
                const originalWidth = img.width;
                const originalHeight = img.height;
                
                console.log(`Original image: ${originalWidth}x${originalHeight}px`);
                
                // GIỮ NGUYÊN nếu ảnh nhỏ - không upscale
                if (originalWidth < 1000 && originalHeight < 1000) {
                    console.log('Small image - keeping original quality');
                    resolve(e.target.result);
                    return;
                }
                
                // Chỉ resize nếu ảnh LỚN HƠN maxWidth
                let width = originalWidth;
                let height = originalHeight;
                
                if (width > maxWidth || height > maxWidth) {
                    // Resize giữ tỷ lệ
                    if (width > height) {
                        height = (maxWidth / width) * height;
                        width = maxWidth;
                    } else {
                        width = (maxWidth / height) * width;
                        height = maxWidth;
                    }
                }
                
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert với quality phù hợp
                canvas.toBlob((blob) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                }, 'image/jpeg', quality);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Smart compression dựa trên file size
async function smartCompressImage(file) {
    const fileSizeMB = file.size / (1024 * 1024);
    
    // Quy tắc compression thông minh
    let settings = {
        maxWidth: 4000,
        quality: 0.92
    };
    
    if (fileSizeMB < 1) {
        // Ảnh nhỏ < 1MB: giữ nguyên
        console.log('Small file - no compression needed');
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
        
    } else if (fileSizeMB < 3) {
        // Ảnh 1-3MB: compress nhẹ
        settings = { maxWidth: 3000, quality: 0.90 };
        
    } else if (fileSizeMB < 5) {
        // Ảnh 3-5MB: compress vừa
        settings = { maxWidth: 2500, quality: 0.85 };
        
    } else {
        // Ảnh > 5MB: compress mạnh hơn
        settings = { maxWidth: 2000, quality: 0.80 };
    }
    
    console.log(`File ${fileSizeMB.toFixed(1)}MB - Using settings:`, settings);
    return compressImage(file, settings.maxWidth, settings.quality);
}

// Compress base64 image
async function compressBase64Image(base64String, maxWidth = 1200, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            if (width > maxWidth) {
                height = (maxWidth / width) * height;
                width = maxWidth;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Return compressed base64
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = base64String;
    });
}

// Show loading overlay
function showLoading(message = 'Processing...') {
    // Remove existing overlay if any
    hideLoading();
    
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;
    
    overlay.innerHTML = `
        <div style="
            background: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        ">
            <div style="
                width: 50px;
                height: 50px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #2c5f41;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            "></div>
            <p style="
                margin: 0;
                font-size: 18px;
                color: #333;
            ">${message}</p>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    
    document.body.appendChild(overlay);
}

// Hide loading overlay
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}
// ========== END COMPRESSION FUNCTIONS ==========

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Parse URL parameters from Facebook
    parseURLParameters();
    
    // Initialize language
    const savedLang = localStorage.getItem('selectedLanguage') || 'en';
    setLanguage(savedLang);
    
    // Initialize form
    initializeForm();
    
    // Add input listeners
    addInputListeners();
    
    // Initialize uploadedImages for first canvas
    uploadedImages[0] = [];
});

// Parse URL parameters from Facebook Messenger
function parseURLParameters() {
    const params = new URLSearchParams(window.location.search);
    urlParams = {
        psid: params.get('psid') || '',
        fb_name: params.get('fb_name') || '',
        ref: params.get('ref') || '',
        fbc: params.get('fbc') || '',
        fbp: params.get('fbp') || ''
    };
    
    // Pre-fill Facebook name if available
    if (urlParams.fb_name) {
        const fbNameInput = document.getElementById('fbName');
        if (fbNameInput) {
            fbNameInput.value = decodeURIComponent(urlParams.fb_name);
        }
    }
}

// Initialize form
function initializeForm() {
    // Set default canvas type
    document.getElementById('canvasType').value = 'single';
    handleCanvasTypeChange();
}

// Add input listeners
function addInputListeners() {
    // Custom text character counter
    document.querySelectorAll('[id^="customText-"]').forEach(input => {
        input.addEventListener('input', function() {
            const canvasIndex = parseInt(this.id.split('-')[1]);
            updateCharCount(canvasIndex);
        });
    });
    
    // Phone number formatting
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            // Allow only numbers, spaces, hyphens, and plus sign
            this.value = this.value.replace(/[^0-9\s\-+]/g, '');
        });
    }
}

// Handle canvas type change
function handleCanvasTypeChange() {
    const type = document.getElementById('canvasType').value;
    canvasType = type;
    const multiSection = document.getElementById('multiCanvasSection');
    const canvasTabs = document.getElementById('canvasTabs');
    const miniNav = document.getElementById('miniCanvasNav');
    
    if (type === 'multi' || type === 'collage') {
        multiSection.style.display = 'block';
        canvasTabs.style.display = 'flex';
        miniNav.style.display = 'block';
        
        // Update section title for collage
        const sectionTitle = multiSection.querySelector('label');
        if (type === 'collage') {
            sectionTitle.setAttribute('data-translate', 'selectQuantityCollage');
            sectionTitle.textContent = translations[currentLanguage].selectQuantityCollage || 'How many collage canvas?';
        } else {
            sectionTitle.setAttribute('data-translate', 'selectQuantity');
            sectionTitle.textContent = translations[currentLanguage].selectQuantity || 'How many different canvas?';
        }
        
        updateCanvasCount();
    } else {
        multiSection.style.display = 'none';
        canvasTabs.style.display = 'none';
        miniNav.style.display = 'none';
        canvasCount = 1;
        
        // Reset to single canvas
        resetToSingleCanvas();
    }
    
    updateTotalPrice();
}

// Reset to single canvas
function resetToSingleCanvas() {
    // Keep only canvas 0 images
    const tempImages = uploadedImages[0] || [];
    uploadedImages = { 0: tempImages };
    
    // Reset UI
    currentCanvasIndex = 0;
    updateCanvasUI();
}

// Update canvas count
function updateCanvasCount() {
    const quantity = parseInt(document.getElementById('canvasQuantity').value);
    canvasCount = quantity;
    
    // Initialize uploadedImages for each canvas if not exists
    for (let i = 0; i < quantity; i++) {
        if (!uploadedImages[i]) {
            uploadedImages[i] = [];
        }
    }
    
    // Remove excess canvas images
    Object.keys(uploadedImages).forEach(key => {
        if (parseInt(key) >= quantity) {
            delete uploadedImages[key];
        }
    });
    
    generateCanvasTabs();
    updateDiscountNotification();
    updateTotalPrice();
}

// Generate canvas tabs
function generateCanvasTabs() {
    const tabsContainer = document.getElementById('canvasTabs');
    const miniTabsContainer = document.getElementById('miniTabs');
    tabsContainer.innerHTML = '';
    miniTabsContainer.innerHTML = '';
    
    for (let i = 0; i < canvasCount; i++) {
        // Main tab
        const tab = document.createElement('div');
        tab.className = i === currentCanvasIndex ? 'tab active' : 'tab';
        tab.textContent = `Canvas ${i + 1}`;
        tab.onclick = () => switchCanvas(i);
        tabsContainer.appendChild(tab);
        
        // Mini tab
        const miniTab = document.createElement('div');
        miniTab.className = i === currentCanvasIndex ? 'mini-tab active' : 'mini-tab';
        miniTab.textContent = i + 1;
        miniTab.onclick = () => switchCanvas(i);
        miniTabsContainer.appendChild(miniTab);
    }
    
    // Update counter
    document.getElementById('currentCanvasNum').textContent = currentCanvasIndex + 1;
    document.getElementById('totalCanvasNum').textContent = canvasCount;
}

// Switch canvas
function switchCanvas(index) {
    currentCanvasIndex = index;
    
    // Update active tabs
    document.querySelectorAll('.tab').forEach((tab, i) => {
        tab.classList.toggle('active', i === index);
    });
    
    document.querySelectorAll('.mini-tab').forEach((tab, i) => {
        tab.classList.toggle('active', i === index);
    });
    
    // Update counter
    document.getElementById('currentCanvasNum').textContent = index + 1;
    
    // Update canvas UI
    updateCanvasUI();
}

// Update canvas UI for current canvas
function updateCanvasUI() {
    // Update size selection
    const selectedSize = getSelectedSize(currentCanvasIndex);
    document.querySelectorAll('.size-option').forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.size === selectedSize) {
            option.classList.add('selected');
        }
    });
    
    // Update two person checkbox visibility for collage
    const twoPersonSection = document.getElementById('twoPersonSection-0');
    if (canvasType === 'collage') {
        twoPersonSection.style.display = 'none';
    } else {
        twoPersonSection.style.display = 'block';
    }
    
    // Update welcome home visibility for collage
    const welcomeHomeSection = document.getElementById('welcomeHomeSection-0');
    const dateInput = document.querySelector('.form-section:has(#date-0)');
    if (canvasType === 'collage') {
        welcomeHomeSection.style.display = 'none';
        if (dateInput) dateInput.style.display = 'none';
    } else {
        welcomeHomeSection.style.display = 'block';
        if (dateInput) dateInput.style.display = 'block';
    }
    
    // Update image thumbnails
    updateImageThumbnails();
    
    // Update form values
    updateFormValues();
    
    // Update price display
    updatePriceDisplay();
}

// Update form values for current canvas
function updateFormValues() {
    const canvasData = getCanvasData(currentCanvasIndex);
    
    // Update text fields
    document.getElementById('customText-0').value = canvasData.customText || '';
    document.getElementById('date-0').value = canvasData.date || '';
    
    // Update checkboxes
    document.getElementById('twoPersonCanvas-0').checked = canvasData.twoPersonCanvas || false;
    document.getElementById('welcomeHome-0').checked = canvasData.welcomeHome || false;
    
    // Update character counter
    updateCharCount(0);
}

// Get canvas data
function getCanvasData(index) {
    if (!window.canvasData) {
        window.canvasData = {};
    }
    
    if (!window.canvasData[index]) {
        window.canvasData[index] = {
            size: '',
            twoPersonCanvas: false,
            customText: '',
            date: '',
            welcomeHome: false
        };
    }
    
    return window.canvasData[index];
}

// Save canvas data
function saveCanvasData(index) {
    if (!window.canvasData) {
        window.canvasData = {};
    }
    
    window.canvasData[index] = {
        size: getSelectedSize(index),
        twoPersonCanvas: document.getElementById('twoPersonCanvas-0').checked,
        customText: document.getElementById('customText-0').value,
        date: document.getElementById('date-0').value,
        welcomeHome: document.getElementById('welcomeHome-0').checked
    };
}

// Select size
function selectSize(size, canvasIndex) {
    // Save current canvas data before switching
    saveCanvasData(currentCanvasIndex);
    
    // Update UI
    document.querySelectorAll('.size-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    document.querySelector(`[data-size="${size}"]`).classList.add('selected');
    
    // Save size for current canvas
    const canvasData = getCanvasData(currentCanvasIndex);
    canvasData.size = size;
    
    // Update price display
    updatePriceDisplay();
    updateTotalPrice();
    
    // Clear validation error
    document.getElementById('size-error-0').textContent = '';
}

// Get selected size
function getSelectedSize(canvasIndex) {
    const canvasData = getCanvasData(canvasIndex);
    return canvasData.size || '';
}

// Update price display
function updatePriceDisplay() {
    const size = getSelectedSize(currentCanvasIndex);
    const priceDisplay = document.getElementById('selectedPrice-0');
    
    if (size) {
        const basePrice = getBasePrice(size);
        const canvasData = getCanvasData(currentCanvasIndex);
        let price = basePrice;
        
        // Add collage price
        if (canvasType === 'collage') {
            price += 5;
        }
        
        // Add two person price
        if (canvasData.twoPersonCanvas && canvasType !== 'collage') {
            price += 10;
        }
        
        priceDisplay.textContent = `Price: $${price}`;
        priceDisplay.style.display = 'block';
    } else {
        priceDisplay.style.display = 'none';
    }
}

// Get base price
function getBasePrice(size) {
    const prices = {
        '8x10': 34,
        '11x14': 43,
        '16x20': 62,
        '20x30': 82
    };
    return prices[size] || 0;
}

// Handle two person change
function handleTwoPersonChange(canvasIndex) {
    saveCanvasData(currentCanvasIndex);
    updatePriceDisplay();
    updateTotalPrice();
}

// Update character count
function updateCharCount(index) {
    const input = document.getElementById(`customText-${index}`);
    const counter = document.getElementById(`charCount-${index}`);
    if (input && counter) {
        counter.textContent = input.value.length;
    }
}

// Trigger file input
function triggerFileInput(canvasIndex) {
    document.getElementById(`imageInput-${canvasIndex}`).click();
}

// Handle image upload - Updated with smart compression
async function handleImageUpload(event, canvasIndex) {
    const files = Array.from(event.target.files);
    const currentImages = uploadedImages[currentCanvasIndex] || [];
    
    if (currentImages.length + files.length > 6) {
        alert(translations[currentLanguage].maxImagesError || 'Maximum 6 images per canvas allowed');
        return;
    }
    
    showLoading('Processing images...');
    
    for (const [index, file] of files.entries()) {
        if (file.type.match(/image\/(jpeg|jpg|png)/)) {
            try {
                // Smart compress - tự động quyết định dựa trên file size
                const processedImage = await smartCompressImage(file);
                
                if (!uploadedImages[currentCanvasIndex]) {
                    uploadedImages[currentCanvasIndex] = [];
                }
                
                const imageData = {
                    original: processedImage,
                    cropped: null,
                    file: file,
                    fileSize: (file.size / (1024 * 1024)).toFixed(2) + 'MB'
                };
                
                uploadedImages[currentCanvasIndex].push(imageData);
                
                // Auto crop ảnh đầu tiên
                if (index === 0) {
                    openCropModal(processedImage, uploadedImages[currentCanvasIndex].length - 1);
                } else {
                    updateImageThumbnails();
                }
                
            } catch (error) {
                console.error('Error processing image:', error);
                alert('Error processing image: ' + file.name);
            }
        }
    }
    
    hideLoading();
    event.target.value = '';
}

// Update image thumbnails
function updateImageThumbnails() {
    const container = document.getElementById('imageThumbnails-0');
    container.innerHTML = '';
    
    const currentImages = uploadedImages[currentCanvasIndex] || [];
    
    currentImages.forEach((imageData, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'image-thumbnail';
        
        const img = document.createElement('img');
        img.src = imageData.cropped || imageData.original;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-image';
        removeBtn.innerHTML = '×';
        removeBtn.onclick = () => removeImage(index);
        
        thumbnail.appendChild(img);
        thumbnail.appendChild(removeBtn);
        container.appendChild(thumbnail);
    });
    
    // Clear validation error
    if (currentImages.length > 0) {
        document.getElementById('image-error-0').textContent = '';
    }
}

// Remove image
function removeImage(index) {
    uploadedImages[currentCanvasIndex].splice(index, 1);
    updateImageThumbnails();
}

// Open crop modal
function openCropModal(imageSrc, imageIndex) {
    currentCropIndex = imageIndex;
    const modal = document.getElementById('cropModal');
    const cropImage = document.getElementById('cropImage');
    
    cropImage.src = imageSrc;
    modal.style.display = 'flex';
    
    // Initialize cropper
    setTimeout(() => {
        if (cropper) {
            cropper.destroy();
        }
        
        cropper = new Cropper(cropImage, {
            aspectRatio: 8 / 10,
            viewMode: 1,
            guides: true,
            center: true,
            highlight: true,
            background: true,
            autoCropArea: 1,
            movable: true,
            rotatable: false,
            scalable: true,
            zoomable: true
        });
    }, 100);
}

// Cancel crop
function cancelCrop() {
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    document.getElementById('cropModal').style.display = 'none';
}

// Apply crop
function applyCrop() {
    if (cropper) {
        const canvas = cropper.getCroppedCanvas({
            width: 800,
            height: 1000
        });
        
        const croppedImage = canvas.toDataURL('image/jpeg', 0.9);
        uploadedImages[currentCanvasIndex][currentCropIndex].cropped = croppedImage;
        
        updateImageThumbnails();
        
        cropper.destroy();
        cropper = null;
    }
    
    document.getElementById('cropModal').style.display = 'none';
}

// Update discount notification
function updateDiscountNotification() {
    const notification = document.getElementById('discountNotification');
    const discountText = document.querySelector('.discount-text');
    
    if (canvasCount >= 5) {
        notification.style.display = 'flex';
        discountText.textContent = translations[currentLanguage].discount12 || 'You get 12% discount!';
    } else if (canvasCount >= 3) {
        notification.style.display = 'flex';
        discountText.textContent = translations[currentLanguage].discount5 || 'You get 5% discount!';
    } else {
        notification.style.display = 'none';
    }
}

// Calculate total price
function calculateTotalPrice() {
    let total = 0;
    
    // Save current canvas data
    saveCanvasData(currentCanvasIndex);
    
    // Calculate price for each canvas
    for (let i = 0; i < canvasCount; i++) {
        const canvasData = getCanvasData(i);
        if (canvasData.size) {
            let canvasPrice = getBasePrice(canvasData.size);
            
            // Add collage price
            if (canvasType === 'collage') {
                canvasPrice += 5;
            }
            
            // Add two person price
            if (canvasData.twoPersonCanvas && canvasType !== 'collage') {
                canvasPrice += 10;
            }
            
            total += canvasPrice;
        }
    }
    
    // Apply discount
    let discount = 0;
    if (canvasCount >= 5) {
        discount = 0.12; // 12% discount
    } else if (canvasCount >= 3) {
        discount = 0.05; // 5% discount
    }
    
    const discountAmount = total * discount;
    const finalTotal = total - discountAmount;
    
    return {
        subtotal: total,
        discount: discountAmount,
        total: finalTotal
    };
}

// Update total price display
function updateTotalPrice() {
    const priceInfo = calculateTotalPrice();
    const totalPriceElement = document.getElementById('totalPrice');
    
    if (priceInfo.discount > 0) {
        totalPriceElement.innerHTML = `
            <span style="text-decoration: line-through; color: #999;">$${priceInfo.subtotal}</span>
            <span style="color: #27ae60; font-weight: bold;">$${priceInfo.total.toFixed(2)}</span>
            <span style="color: #e74c3c; font-size: 0.9em;">(Save $${priceInfo.discount.toFixed(2)})</span>
        `;
    } else {
        totalPriceElement.textContent = `$${priceInfo.total}`;
    }
}

// Validate form
function validateForm() {
    let isValid = true;
    const errors = [];
    
    // Save current canvas data
    saveCanvasData(currentCanvasIndex);
    
    // Validate each canvas
    for (let i = 0; i < canvasCount; i++) {
        const canvasData = getCanvasData(i);
        const canvasImages = uploadedImages[i] || [];
        
        // Check size
        if (!canvasData.size) {
            errors.push(`Canvas ${i + 1}: Please select a size`);
            isValid = false;
        }
        
        // Check images
        if (canvasImages.length === 0) {
            errors.push(`Canvas ${i + 1}: Please upload at least one image`);
            isValid = false;
        }
    }
    
    // Validate customer info
    const fbName = document.getElementById('fbName').value.trim();
    const email = document.getElementById('email').value.trim();
    
    if (!fbName) {
        document.getElementById('fbName-error').textContent = 'Facebook name is required';
        isValid = false;
    } else {
        document.getElementById('fbName-error').textContent = '';
    }
    
    if (!email || !isValidEmail(email)) {
        document.getElementById('email-error').textContent = 'Valid email is required';
        isValid = false;
    } else {
        document.getElementById('email-error').textContent = '';
    }
    
    // Show first error if on multi canvas
    if (errors.length > 0 && (canvasType === 'multi' || canvasType === 'collage')) {
        alert(errors.join('\n'));
    }
    
    return isValid;
}

// Validate email
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Open preview modal
function openPreviewModal(canvasIndex) {
    const modal = document.getElementById('previewModal');
    const canvas = document.getElementById('previewCanvas');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Get canvas data
    const canvasData = getCanvasData(currentCanvasIndex);
    
    // Load background image based on type
    const bgImage = new Image();
    const bgSrc = canvasData.twoPersonCanvas ? './canvas-bg-couple.jpg' : './canvas-bg-single.jpg';
    
    bgImage.onload = function() {
        // Draw background
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        
        // Draw text if provided
        if (canvasData.customText) {
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = '#333';
            ctx.textAlign = 'center';
            ctx.fillText(canvasData.customText, canvas.width / 2, canvas.height - 100);
        }
        
        // Draw date if provided
        if (canvasData.date && canvasType !== 'collage') {
            ctx.font = '18px Arial';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText(canvasData.date, canvas.width / 2, canvas.height - 60);
        }
    };
    
    bgImage.src = bgSrc;
    modal.style.display = 'flex';
}

// Close preview modal
function closePreviewModal() {
    document.getElementById('previewModal').style.display = 'none';
}

// Confirm order
function confirmOrder() {
    if (!validateForm()) {
        return;
    }
    
    // Show confirmation modal
    const modal = document.getElementById('confirmModal');
    const summary = document.getElementById('orderSummary');
    
    // Build order summary
    let summaryHTML = '<div class="order-details">';
    summaryHTML += `<p><strong>Canvas Type:</strong> ${canvasType}</p>`;
    
    if (canvasType === 'multi' || canvasType === 'collage') {
        summaryHTML += `<p><strong>Number of Canvas:</strong> ${canvasCount}</p>`;
    }
    
    // Canvas details
    for (let i = 0; i < canvasCount; i++) {
        const canvasData = getCanvasData(i);
        const images = uploadedImages[i] || [];
        
        summaryHTML += `<div class="canvas-summary">`;
        summaryHTML += `<h4>Canvas ${i + 1}</h4>`;
        summaryHTML += `<p>Size: ${canvasData.size}</p>`;
        summaryHTML += `<p>Images: ${images.length}</p>`;
        
        if (canvasData.customText) {
            summaryHTML += `<p>Text: ${canvasData.customText}</p>`;
        }
        
        if (canvasData.twoPersonCanvas && canvasType !== 'collage') {
            summaryHTML += `<p>Two Person Canvas: Yes</p>`;
        }
        
        summaryHTML += `</div>`;
    }
    
    // Price summary
    const priceInfo = calculateTotalPrice();
    summaryHTML += '<div class="price-summary">';
    summaryHTML += `<p>Subtotal: $${priceInfo.subtotal}</p>`;
    
    if (priceInfo.discount > 0) {
        summaryHTML += `<p>Discount: -$${priceInfo.discount.toFixed(2)}</p>`;
    }
    
    summaryHTML += `<p><strong>Total: $${priceInfo.total.toFixed(2)}</strong></p>`;
    summaryHTML += '</div>';
    
    summary.innerHTML = summaryHTML;
    modal.style.display = 'flex';
}

// Close confirm modal
function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
}

// Submit order
async function submitOrder() {
    try {
        // Show loading state
        showLoading('Processing your order...');
        const submitBtn = document.querySelector('#confirmModal .primary-btn');
        submitBtn.textContent = 'Processing...';
        submitBtn.disabled = true;
        
        // Generate order ID
        const orderId = generateOrderId();
        
        // Prepare canvas data for Apps Script
        const canvasesData = [];
        for (let i = 0; i < canvasCount; i++) {
            const canvasData = getCanvasData(i);
            const images = uploadedImages[i] || [];
            
            showLoading(`Processing canvas ${i + 1} of ${canvasCount}...`);
            
            // Convert images to base64 with compression
            const base64Images = [];
            for (const imageData of images) {
                try {
                    // Use cropped image if available, otherwise use original
                    const imageToCompress = imageData.cropped || imageData.original;
                    
                    // Compress again before sending (ensure small size)
                    const compressedBase64 = await compressBase64Image(imageToCompress, 1000, 0.75);
                    
                    // Remove data URL prefix
                    const base64Only = compressedBase64.split(',')[1];
                    base64Images.push(base64Only);
                    
                } catch (error) {
                    console.error('Error compressing image for upload:', error);
                }
            }
            
            canvasesData.push({
                canvas_id: i + 1,
                canvas_type: canvasData.twoPersonCanvas ? 'couple' : 'single',
                size: canvasData.size,
                value: calculateCanvasPrice(canvasData),
                images: base64Images,
                custom_text: canvasData.customText,
                date: canvasData.date,
                welcome_home: canvasData.welcomeHome
            });
        }
        
        // Prepare data for Apps Script
        const appsScriptData = {
            order_id: orderId,
            customer_info: {
                fb_name: document.getElementById('fbName').value.trim(),
                email: document.getElementById('email').value.trim(),
                phone: document.getElementById('phone').value.trim()
            },
            canvases: canvasesData,
            notes: document.getElementById('notes').value.trim()
        };
        
        showLoading('Uploading to server...');
        
        // Send to Apps Script
        const appsScriptUrl = 'https://script.google.com/macros/s/AKfycbygWj_cmQvy29D_K31Kci2g0iBIycf9he2SiRFuU3PsBznjofyZjjQZ-kmDAgRUOzAQ/exec';
        const appsScriptResponse = await fetch(appsScriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(appsScriptData)
        });
        
        // Prepare data for N8N
        const priceInfo = calculateTotalPrice();
        const n8nData = {
            order_id: orderId,
            psid: urlParams.psid,
            fb_name: document.getElementById('fbName').value.trim(),
            first_name: document.getElementById('fbName').value.trim().split(' ')[0],
            last_name: document.getElementById('fbName').value.trim().split(' ').slice(1).join(' '),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            ref: urlParams.ref,
            fbc: urlParams.fbc,
            fbp: urlParams.fbp,
            product: canvasType === 'collage' ? 'Collage Canvas' : 'Welcome Home Canvas',
            canvas_type: canvasType,
            canvas_count: canvasCount,
            size: canvasCount === 1 ? getCanvasData(0).size : 'Multiple',
            value: priceInfo.total,
            currency: 'USD',
            photo_links: '["Uploading to Google Drive..."]', // Will be updated by Apps Script
            note: document.getElementById('notes').value.trim(),
            submit_time: new Date().toLocaleString(),
            status: 'pending'
        };
        
        // Send to N8N
        const n8nUrl = 'https://jm9611.duckdns.org/webhook/form-submit';
        await fetch(n8nUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(n8nData)
        });
        
        // Hide loading and show success
        hideLoading();
        showThankYouPage();
        
    } catch (error) {
        console.error('Error submitting order:', error);
        hideLoading();
        alert('There was an error submitting your order. Please try again.');
        
        // Reset button
        const submitBtn = document.querySelector('#confirmModal .primary-btn');
        submitBtn.textContent = 'Confirm Order';
        submitBtn.disabled = false;
    }
}

// Generate order ID
function generateOrderId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `JM_${timestamp}_${random}`;
}

// Calculate canvas price
function calculateCanvasPrice(canvasData) {
    let price = getBasePrice(canvasData.size);
    
    if (canvasType === 'collage') {
        price += 5;
    }
    
    if (canvasData.twoPersonCanvas && canvasType !== 'collage') {
        price += 10;
    }
    
    return price;
}

// Show thank you page
function showThankYouPage() {
    document.getElementById('confirmModal').style.display = 'none';
    document.querySelector('.container').style.display = 'none';
    document.getElementById('thankYouPage').style.display = 'flex';
}

// Start new order
function startNewOrder() {
    // Reset form
    window.location.reload();
}

// FAQ functions
function openFAQ() {
    document.getElementById('faqModal').style.display = 'flex';
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

// Language functions
function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('selectedLanguage', lang);
    
    // Update all translatable elements
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
    
    // Update placeholders
    document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        if (translations[lang] && translations[lang][key]) {
            element.placeholder = translations[lang][key];
        }
    });
    
    // Update dynamic content
    updateDiscountNotification();
}

// Initialize character counters on load
window.addEventListener('load', function() {
    updateCharCount(0);
});
