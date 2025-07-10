// Global variables
let canvasItems = [];
let currentCanvasIndex = 0;
let cropper = null;
let currentCropCanvasId = null;
let currentCropImageIndex = null;
let currentLang = 'en';
let backgroundImage = null;
let isMultiCanvas = false;

// Prices
const PRICES = {
    '8x10': 34,
    '11x14': 43,
    '16x20': 62,
    '20x30': 82
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Load background image
    backgroundImage = new Image();
    backgroundImage.src = 'preview-bg.jpg';
    backgroundImage.onload = function() {
        initializeForm();
    };
});

function initializeForm() {
    // Get URL parameters
    const params = new URLSearchParams(window.location.search);
    const fbName = params.get('name') || '';
    const lang = params.get('lang') || detectLanguage();
    
    // Set Facebook name
    document.getElementById('fbName').value = fbName;
    
    // Set language
    currentLang = lang;
    updateLanguage();
    
    // Initialize with single canvas
    addCanvas(0);
    updatePricing();
}

// Language detection
function detectLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    return browserLang.startsWith('es') ? 'es' : 'en';
}

// Update language
function updateLanguage() {
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[currentLang] && translations[currentLang][key]) {
            element.textContent = translations[currentLang][key];
        }
    });
}

// Toggle multi canvas mode
function toggleMultiCanvas() {
    const checkbox = document.getElementById('multiCanvasToggle');
    const quantitySection = document.getElementById('canvasQuantitySection');
    
    isMultiCanvas = checkbox.checked;
    
    if (isMultiCanvas) {
        quantitySection.style.display = 'block';
        updateCanvasCount();
    } else {
        quantitySection.style.display = 'none';
        // Reset to single canvas
        while (canvasItems.length > 1) {
            canvasItems.pop();
        }
        updateCanvasTabs();
        updatePricing();
    }
}

// Update canvas count
function updateCanvasCount() {
    const quantity = parseInt(document.getElementById('canvasQuantity').value);
    
    // Preserve existing data
    const existingData = [...canvasItems];
    
    // Adjust canvas items array
    while (canvasItems.length < quantity) {
        addCanvas(canvasItems.length);
    }
    while (canvasItems.length > quantity) {
        canvasItems.pop();
    }
    
    // Restore data where possible
    existingData.forEach((data, index) => {
        if (index < canvasItems.length) {
            canvasItems[index] = data;
        }
    });
    
    updateCanvasTabs();
    updatePricing();
    showDiscountNotification(quantity);
}

// Show discount notification
function showDiscountNotification(quantity) {
    const notification = document.getElementById('discountNotification');
    const discountText = document.querySelector('.discount-text');
    
    if (quantity >= 5) {
        notification.style.display = 'flex';
        discountText.setAttribute('data-translate', 'discountText12');
        discountText.textContent = translations[currentLang].discountText12;
    } else if (quantity >= 3) {
        notification.style.display = 'flex';
        discountText.setAttribute('data-translate', 'discountText5');
        discountText.textContent = translations[currentLang].discountText5;
    } else {
        notification.style.display = 'none';
    }
}

// Add canvas
function addCanvas(index) {
    const canvasItem = {
        id: Date.now() + index,
        index: index,
        size: '',
        price: 0,
        images: [],
        text: '',
        date: '',
        welcomeHome: false
    };
    
    canvasItems[index] = canvasItem;
}

// Update canvas tabs
function updateCanvasTabs() {
    const tabsContainer = document.getElementById('canvasTabs');
    const itemsContainer = document.getElementById('canvasItemsContainer');
    
    // Clear existing
    tabsContainer.innerHTML = '';
    itemsContainer.innerHTML = '';
    
    // Create tabs and items
    canvasItems.forEach((item, index) => {
        // Create tab
        const tab = document.createElement('div');
        tab.className = 'tab' + (index === currentCanvasIndex ? ' active' : '');
        tab.textContent = `${translations[currentLang].canvasNumber} ${index + 1}`;
        tab.onclick = () => switchCanvas(index);
        tabsContainer.appendChild(tab);
        
        // Create canvas item
        const canvasHtml = createCanvasItemHtml(item, index);
        itemsContainer.insertAdjacentHTML('beforeend', canvasHtml);
    });
    
    // Show current canvas
    switchCanvas(currentCanvasIndex);
}

// Create canvas item HTML
function createCanvasItemHtml(item, index) {
    return `
        <div class="canvas-item ${index === currentCanvasIndex ? 'active' : ''}" data-canvas-index="${index}">
            <div class="form-group">
                <label data-translate="selectSize">${translations[currentLang].selectSize} *</label>
                <div class="size-selection">
                    <div class="size-option">
                        <input type="radio" id="size-8x10-${index}" name="size-${index}" value="8x10" 
                            ${item.size === '8x10' ? 'checked' : ''} 
                            onchange="updateCanvasSize(${index}, '8x10')">
                        <label for="size-8x10-${index}" class="size-label">
                            <span class="size-name">8x10</span>
                            <span class="size-price">$34</span>
                        </label>
                    </div>
                    <div class="size-option">
                        <input type="radio" id="size-11x14-${index}" name="size-${index}" value="11x14" 
                            ${item.size === '11x14' ? 'checked' : ''} 
                            onchange="updateCanvasSize(${index}, '11x14')">
                        <label for="size-11x14-${index}" class="size-label">
                            <span class="size-name">11x14</span>
                            <span class="size-price">$43</span>
                            <span class="best-seller">Best Seller</span>
                        </label>
                    </div>
                    <div class="size-option">
                        <input type="radio" id="size-16x20-${index}" name="size-${index}" value="16x20" 
                            ${item.size === '16x20' ? 'checked' : ''} 
                            onchange="updateCanvasSize(${index}, '16x20')">
                        <label for="size-16x20-${index}" class="size-label">
                            <span class="size-name">16x20</span>
                            <span class="size-price">$62</span>
                        </label>
                    </div>
                    <div class="size-option">
                        <input type="radio" id="size-20x30-${index}" name="size-${index}" value="20x30" 
                            ${item.size === '20x30' ? 'checked' : ''} 
                            onchange="updateCanvasSize(${index}, '20x30')">
                        <label for="size-20x30-${index}" class="size-label">
                            <span class="size-name">20x30</span>
                            <span class="size-price">$82</span>
                        </label>
                    </div>
                </div>
            </div>
            
            <div class="form-group">
                <label data-translate="uploadPhoto">${translations[currentLang].uploadPhoto} *</label>
                <div class="file-upload-wrapper">
                    <label class="file-upload-label" for="photo-${index}">
                        <span id="photo-label-${index}">${translations[currentLang].uploadPhoto}</span>
                    </label>
                    <input type="file" id="photo-${index}" accept="image/*" multiple onchange="handlePhotoUpload(${index}, this)">
                </div>
                <p class="upload-note" data-translate="uploadNote">${translations[currentLang].uploadNote}</p>
                <div class="image-thumbnails" id="thumbnails-${index}"></div>
            </div>
            
            <!-- Preview Section moved here -->
            <div class="preview-section">
                <h3 data-translate="preview">${translations[currentLang].preview}</h3>
                <div class="preview-container">
                    <canvas id="previewCanvas-${index}" width="400" height="500"></canvas>
                    <div class="preview-notice" data-translate="previewNotice">
                        ${translations[currentLang].previewNotice}
                    </div>
                </div>
            </div>
            
            <div class="form-group">
                <label data-translate="enterText">${translations[currentLang].enterText}</label>
                <input type="text" id="text-${index}" value="${item.text}" onkeyup="updateCanvasText(${index}, this.value)" placeholder="Enter name or dedication">
            </div>
            
            <div class="form-group">
                <label data-translate="enterDate">${translations[currentLang].enterDate}</label>
                <input type="text" id="date-${index}" value="${item.date}" onkeyup="updateCanvasDate(${index}, this.value)" placeholder="1945-2023">
            </div>
            
            <div class="checkbox-wrapper">
                <input type="checkbox" id="welcome-${index}" ${item.welcomeHome ? 'checked' : ''} onchange="updateWelcomeHome(${index}, this.checked)">
                <label for="welcome-${index}" data-translate="welcomeHome">${translations[currentLang].welcomeHome}</label>
            </div>
        </div>
    `;
}

// Switch canvas
function switchCanvas(index) {
    currentCanvasIndex = index;
    
    // Update tabs
    document.querySelectorAll('.canvas-tabs .tab').forEach((tab, i) => {
        tab.classList.toggle('active', i === index);
    });
    
    // Update canvas items
    document.querySelectorAll('.canvas-item').forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });
}

// Update canvas size
function updateCanvasSize(index, size) {
    canvasItems[index].size = size;
    canvasItems[index].price = PRICES[size];
    updatePricing();
    drawPreview(index);
}

// Handle photo upload
function handlePhotoUpload(index, input) {
    if (input.files && input.files.length > 0) {
        const files = Array.from(input.files);
        
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageData = {
                    file: file,
                    url: e.target.result,
                    croppedUrl: null,
                    croppedBlob: null
                };
                
                canvasItems[index].images.push(imageData);
                updateImageThumbnails(index);
                
                // Update label
                const imageCount = canvasItems[index].images.length;
                document.getElementById(`photo-label-${index}`).textContent = 
                    `${imageCount} ${imageCount === 1 ? 'image' : 'images'} selected`;
            };
            reader.readAsDataURL(file);
        });
    }
}

// Update image thumbnails
function updateImageThumbnails(canvasIndex) {
    const container = document.getElementById(`thumbnails-${canvasIndex}`);
    const images = canvasItems[canvasIndex].images;
    
    container.innerHTML = '';
    
    images.forEach((image, imageIndex) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'thumbnail-item';
        thumbnail.innerHTML = `
            <img src="${image.croppedUrl || image.url}" onclick="openCropModal(${canvasIndex}, ${imageIndex})">
            <button class="thumbnail-remove" onclick="removeImage(${canvasIndex}, ${imageIndex})">×</button>
        `;
        container.appendChild(thumbnail);
    });
}

// Remove image
function removeImage(canvasIndex, imageIndex) {
    canvasItems[canvasIndex].images.splice(imageIndex, 1);
    updateImageThumbnails(canvasIndex);
    
    // Update label
    const imageCount = canvasItems[canvasIndex].images.length;
    document.getElementById(`photo-label-${canvasIndex}`).textContent = 
        imageCount > 0 ? `${imageCount} ${imageCount === 1 ? 'image' : 'images'} selected` : translations[currentLang].uploadPhoto;
}

// Open crop modal
function openCropModal(canvasIndex, imageIndex) {
    const modal = document.getElementById('cropModal');
    const image = document.getElementById('cropImage');
    const imageData = canvasItems[canvasIndex].images[imageIndex];
    
    currentCropCanvasId = canvasIndex;
    currentCropImageIndex = imageIndex;
    
    image.src = imageData.url;
    modal.style.display = 'flex';
    
    // Initialize cropper
    if (cropper) {
        cropper.destroy();
    }
    
    cropper = new Cropper(image, {
        aspectRatio: 4 / 5, // 8x10 ratio
        viewMode: 1,
        guides: true,
        center: true,
        highlight: true,
        background: true,
        autoCrop: true,
        movable: true,
        rotatable: false,
        scalable: true,
        zoomable: true
    });
}

// Cancel crop
function cancelCrop() {
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    document.getElementById('cropModal').style.display = 'none';
    currentCropCanvasId = null;
    currentCropImageIndex = null;
}

// Apply crop
function applyCrop() {
    if (cropper && currentCropCanvasId !== null && currentCropImageIndex !== null) {
        const canvas = cropper.getCroppedCanvas({
            width: 800,
            height: 1000 // 4:5 ratio
        });
        
        canvas.toBlob(function(blob) {
            const imageData = canvasItems[currentCropCanvasId].images[currentCropImageIndex];
            imageData.croppedBlob = blob;
            imageData.croppedUrl = URL.createObjectURL(blob);
            
            // Update thumbnails
            updateImageThumbnails(currentCropCanvasId);
            
            // Close modal
            cancelCrop();
        });
    }
}

// Update canvas text
function updateCanvasText(index, text) {
    canvasItems[index].text = text;
    drawPreview(index);
}

// Update canvas date
function updateCanvasDate(index, date) {
    canvasItems[index].date = date;
    drawPreview(index);
}

// Update welcome home
function updateWelcomeHome(index, checked) {
    canvasItems[index].welcomeHome = checked;
}

// Draw preview
function drawPreview(index) {
    const canvas = document.getElementById(`previewCanvas-${index}`);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const item = canvasItems[index];
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background image
    if (backgroundImage && backgroundImage.complete) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Draw text overlay
    const padding = 30;
    const lineHeight = 30;
    let y = canvas.height - padding;
    
    // Set text style
    ctx.textAlign = 'left';
    
    // Draw date if provided
    if (item.date) {
        ctx.font = '20px DateFont, Arial';
        
        // Brown outline
        ctx.strokeStyle = 'rgba(139, 69, 19, 0.6)';
        ctx.lineWidth = 2;
        ctx.strokeText(item.date, padding, y);
        
        // Black text
        ctx.fillStyle = '#000000';
        ctx.fillText(item.date, padding, y);
        
        y -= lineHeight;
    }
    
    // Draw main text
    if (item.text) {
        ctx.font = 'bold 26px TextFont, Arial';
        
        // Brown outline
        ctx.strokeStyle = 'rgba(139, 69, 19, 0.6)';
        ctx.lineWidth = 2;
        ctx.strokeText(item.text, padding, y);
        
        // Black text
        ctx.fillStyle = '#000000';
        ctx.fillText(item.text, padding, y);
    }
}

// Update pricing
function updatePricing() {
    let subtotal = 0;
    canvasItems.forEach(item => {
        subtotal += item.price;
    });
    
    let discount = 0;
    if (canvasItems.length >= 5) {
        discount = subtotal * 0.12;
    } else if (canvasItems.length >= 3) {
        discount = subtotal * 0.05;
    }
    
    const total = subtotal - discount;
    
    // Update display
    document.querySelector('.total-price').textContent = `$${total.toFixed(2)}`;
}

// Confirm order
function confirmOrder() {
    // Validate form
    const fbName = document.getElementById('fbName').value;
    const email = document.getElementById('email').value;
    
    if (!fbName) {
        alert(translations[currentLang].required + ': ' + translations[currentLang].fbName);
        return;
    }
    
    if (!email) {
        alert(translations[currentLang].required + ': Email');
        return;
    }
    
    // Validate each canvas
    for (let i = 0; i < canvasItems.length; i++) {
        const item = canvasItems[i];
        if (!item.size) {
            alert(`${translations[currentLang].canvasNumber} ${i + 1}: ${translations[currentLang].selectSize}`);
            switchCanvas(i);
            return;
        }
        if (item.images.length === 0) {
            alert(`${translations[currentLang].canvasNumber} ${i + 1}: ${translations[currentLang].uploadPhoto}`);
            switchCanvas(i);
            return;
        }
    }
    
    // Show confirmation modal
    showConfirmModal();
}

// Show confirmation modal
function showConfirmModal() {
    const modal = document.getElementById('confirmModal');
    const summary = document.getElementById('orderSummary');
    
    let summaryHtml = '';
    
    canvasItems.forEach((item, index) => {
        summaryHtml += `
            <div class="order-item">
                <h4>${translations[currentLang].canvasNumber} ${index + 1}</h4>
                <div class="order-item-details">
                    <span><strong>Size:</strong> ${item.size} - $${item.price}</span>
                    <span><strong>Images:</strong> ${item.images.length} uploaded</span>
                    <span><strong>Text:</strong> ${item.text || '-'}</span>
                    <span><strong>Date:</strong> ${item.date || '-'}</span>
                    <span><strong>Welcome Home:</strong> ${item.welcomeHome ? 'Yes' : 'No'}</span>
                </div>
            </div>
        `;
    });
    
    summary.innerHTML = summaryHtml;
    modal.style.display = 'flex';
}

// Close confirm modal
function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
}

// Submit order
async function submitOrder() {
    try {
        // Prepare form data
        const formData = new FormData();
        
        // Add basic info
        formData.append('fbName', document.getElementById('fbName').value);
        formData.append('email', document.getElementById('email').value);
        formData.append('notes', document.getElementById('notes').value);
        formData.append('language', currentLang);
        formData.append('timestamp', new Date().toISOString());
        formData.append('order_type', isMultiCanvas ? 'multi' : 'single');
        
        // Add canvas data
        formData.append('canvasCount', canvasItems.length);
        
        // Calculate totals
        let subtotal = 0;
        canvasItems.forEach(item => subtotal += item.price);
        
        let discount = 0;
        if (canvasItems.length >= 5) discount = subtotal * 0.12;
        else if (canvasItems.length >= 3) discount = subtotal * 0.05;
        
        formData.append('subtotal', subtotal);
        formData.append('discount', discount);
        formData.append('total', subtotal - discount);
        
        // Add each canvas data
        canvasItems.forEach((item, canvasIndex) => {
            formData.append(`canvas_${canvasIndex}_size`, item.size);
            formData.append(`canvas_${canvasIndex}_price`, item.price);
            formData.append(`canvas_${canvasIndex}_text`, item.text);
            formData.append(`canvas_${canvasIndex}_date`, item.date);
            formData.append(`canvas_${canvasIndex}_welcomeHome`, item.welcomeHome);
            formData.append(`canvas_${canvasIndex}_imageCount`, item.images.length);
            
            // Add all images for this canvas
            item.images.forEach((image, imageIndex) => {
                if (image.croppedBlob) {
                    formData.append(`canvas_${canvasIndex}_image_${imageIndex}`, image.croppedBlob, `canvas_${canvasIndex}_image_${imageIndex}.jpg`);
                } else {
                    formData.append(`canvas_${canvasIndex}_image_${imageIndex}`, image.file);
                }
            });
        });
        
        // TODO: Replace with your actual webhook URL
        // const response = await fetch('YOUR_WEBHOOK_URL', {
        //     method: 'POST',
        //     body: formData
        // });
        
        // For demo, just log the data
        console.log('Order data prepared:', formData);
        
        // Show thank you page
        closeConfirmModal();
        showThankYouPage();
        
    } catch (error) {
        console.error('Error submitting order:', error);
        alert(translations[currentLang].errorSubmit);
    }
}

// Show thank you page
function showThankYouPage() {
    document.getElementById('thankYouPage').style.display = 'flex';
    document.querySelector('.container').style.display = 'none';
}

// Start new order
function startNewOrder() {
    window.location.reload();
}

// Initialize preview for all canvases when page loads
window.addEventListener('load', function() {
    setTimeout(() => {
        canvasItems.forEach((item, index) => {
            drawPreview(index);
        });
    }, 500);
});
