// Global variables
let canvasData = [{}];
let currentCanvasIndex = 0;
let currentLanguage = 'en';
let cropper = null;
let currentCropCallback = null;

// Canvas prices
const canvasPrices = {
    '8x10': 29.99,
    '11x14': 39.99,
    '16x20': 49.99,
    '24x36': 69.99
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    updateTotalPrice();
});

// Initialize form
function initializeForm() {
    createCanvasItem(0);
    updatePreview();
}

// Create canvas item HTML - Updated order
function createCanvasItem(index) {
    const container = document.getElementById('canvasItemsContainer');
    const canvasItem = document.createElement('div');
    canvasItem.className = 'canvas-item';
    canvasItem.id = `canvas-${index}`;
    canvasItem.style.display = index === 0 ? 'block' : 'none';
    
    canvasItem.innerHTML = `
        <!-- Size Selection -->
        <div class="form-group">
            <label data-translate="selectSize">Select Size *</label>
            <div class="size-selection">
                <div class="size-option">
                    <input type="radio" id="size-8x10-${index}" name="size-${index}" value="8x10" onchange="updateCanvasData(${index}, 'size', '8x10')">
                    <label for="size-8x10-${index}">8x10" - $29.99</label>
                </div>
                <div class="size-option">
                    <input type="radio" id="size-11x14-${index}" name="size-${index}" value="11x14" onchange="updateCanvasData(${index}, 'size', '11x14')">
                    <label for="size-11x14-${index}">11x14" - $39.99</label>
                </div>
                <div class="size-option">
                    <input type="radio" id="size-16x20-${index}" name="size-${index}" value="16x20" onchange="updateCanvasData(${index}, 'size', '16x20')">
                    <label for="size-16x20-${index}">16x20" - $49.99</label>
                </div>
                <div class="size-option">
                    <input type="radio" id="size-24x36-${index}" name="size-${index}" value="24x36" onchange="updateCanvasData(${index}, 'size', '24x36')">
                    <label for="size-24x36-${index}">24x36" - $69.99</label>
                </div>
            </div>
        </div>

        <!-- Image Upload -->
        <div class="form-group image-upload-section">
            <label data-translate="uploadImage">Upload Your Image *</label>
            <label for="imageUpload-${index}" class="upload-btn">
                <span data-translate="chooseImage">Choose Image</span>
            </label>
            <input type="file" id="imageUpload-${index}" class="image-input" accept="image/*" multiple onchange="handleImageUpload(${index}, event)">
            <div id="imageThumbnails-${index}" class="image-thumbnails"></div>
        </div>

        <!-- Text Input -->
        <div class="form-group">
            <label data-translate="enterText">Enter Your Text</label>
            <input type="text" id="canvasText-${index}" placeholder="e.g., John Smith" onchange="updateCanvasData(${index}, 'text', this.value)">
        </div>

        <!-- Date Input -->
        <div class="form-group">
            <label data-translate="enterDate">Date</label>
            <input type="text" id="canvasDate-${index}" placeholder="e.g., 1990 ~ 2023" onchange="updateCanvasData(${index}, 'date', this.value)">
        </div>

        <!-- Welcome Home Checkbox -->
        <div class="welcome-checkbox">
            <input type="checkbox" id="welcomeHome-${index}" onchange="updateCanvasData(${index}, 'welcomeHome', this.checked)">
            <label for="welcomeHome-${index}" data-translate="addWelcomeHome">Add "Welcome Home"</label>
        </div>
    `;
    
    container.appendChild(canvasItem);
    
    // Initialize canvas data
    if (!canvasData[index]) {
        canvasData[index] = {
            images: [],
            selectedImageIndex: 0
        };
    }
}

// Handle image upload - Updated for multiple images
function handleImageUpload(canvasIndex, event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            showCropModal(e.target.result, function(croppedImage) {
                if (!canvasData[canvasIndex].images) {
                    canvasData[canvasIndex].images = [];
                }
                canvasData[canvasIndex].images.push(croppedImage);
                updateImageThumbnails(canvasIndex);
                updatePreview();
                updateTotalPrice();
            });
        };
        reader.readAsDataURL(file);
    });
}

// Update image thumbnails
function updateImageThumbnails(canvasIndex) {
    const container = document.getElementById(`imageThumbnails-${canvasIndex}`);
    container.innerHTML = '';
    
    const images = canvasData[canvasIndex].images || [];
    images.forEach((image, index) => {
        const thumbnailItem = document.createElement('div');
        thumbnailItem.className = 'thumbnail-item';
        
        thumbnailItem.innerHTML = `
            <img src="${image}" alt="Thumbnail ${index + 1}">
            <button class="delete-btn" onclick="deleteImage(${canvasIndex}, ${index})">×</button>
        `;
        
        container.appendChild(thumbnailItem);
    });
}

// Delete image
function deleteImage(canvasIndex, imageIndex) {
    canvasData[canvasIndex].images.splice(imageIndex, 1);
    updateImageThumbnails(canvasIndex);
    updatePreview();
    updateTotalPrice();
}

// Show crop modal - Updated with 8x10 aspect ratio
function showCropModal(imageSrc, callback) {
    const modal = document.getElementById('cropModal');
    const cropImage = document.getElementById('cropImage');
    
    currentCropCallback = callback;
    cropImage.src = imageSrc;
    modal.style.display = 'block';
    
    // Initialize cropper
    if (cropper) {
        cropper.destroy();
    }
    
    cropper = new Cropper(cropImage, {
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
    const modal = document.getElementById('cropModal');
    modal.style.display = 'none';
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
}

// Apply crop
function applyCrop() {
    if (cropper && currentCropCallback) {
        const canvas = cropper.getCroppedCanvas();
        const croppedImage = canvas.toDataURL('image/jpeg', 0.9);
        currentCropCallback(croppedImage);
    }
    cancelCrop();
}

// Update preview - Modified to use fixed background
function updatePreview() {
    const canvas = document.getElementById('previewCanvas');
    const ctx = canvas.getContext('2d');
    const data = canvasData[currentCanvasIndex];
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background image
    const bgImage = new Image();
    bgImage.onload = function() {
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        
        // Draw text overlay with custom font
        if (data && data.text) {
            ctx.font = 'bold 36px "JMH Typewriter"';
            ctx.fillStyle = 'black';
            ctx.strokeStyle = '#8B7355';
            ctx.lineWidth = 0.5;
            
            const textX = 30;
            const textY = canvas.height - 80;
            
            ctx.strokeText(data.text, textX, textY);
            ctx.fillText(data.text, textX, textY);
        }
        
        // Draw date with custom font
        if (data && data.date) {
            ctx.font = '28px "Amatic SC"';
            ctx.fillStyle = 'black';
            ctx.strokeStyle = '#8B7355';
            ctx.lineWidth = 0.3;
            
            const dateX = 30;
            const dateY = canvas.height - 40;
            
            ctx.strokeText(data.date, dateX, dateY);
            ctx.fillText(data.date, dateX, dateY);
        }
    };
    bgImage.src = 'preview-bg.jpg';
}

// Update canvas data
function updateCanvasData(index, field, value) {
    if (!canvasData[index]) {
        canvasData[index] = {};
    }
    canvasData[index][field] = value;
    
    if (index === currentCanvasIndex && (field === 'text' || field === 'date')) {
        updatePreview();
    }
    
    updateTotalPrice();
}

// Toggle multi canvas
function toggleMultiCanvas() {
    const isMulti = document.getElementById('multiCanvasToggle').checked;
    const quantitySection = document.getElementById('canvasQuantitySection');
    const canvasTabs = document.getElementById('canvasTabs');
    
    if (isMulti) {
        quantitySection.style.display = 'block';
        canvasTabs.style.display = 'flex';
        updateCanvasCount();
    } else {
        quantitySection.style.display = 'none';
        canvasTabs.style.display = 'none';
        // Reset to single canvas
        canvasData = [canvasData[0] || {}];
        currentCanvasIndex = 0;
        showCanvas(0);
    }
}

// Update canvas count
function updateCanvasCount() {
    const count = parseInt(document.getElementById('canvasQuantity').value);
    const tabsContainer = document.getElementById('canvasTabs');
    const discountNotification = document.getElementById('discountNotification');
    
    // Clear existing tabs
    tabsContainer.innerHTML = '';
    
    // Create tabs
    for (let i = 0; i < count; i++) {
        const tab = document.createElement('div');
        tab.className = 'tab';
        if (i === currentCanvasIndex) tab.classList.add('active');
        tab.textContent = `Canvas ${i + 1}`;
        tab.onclick = () => switchCanvas(i);
        tabsContainer.appendChild(tab);
        
        // Create canvas item if doesn't exist
        if (!document.getElementById(`canvas-${i}`)) {
            createCanvasItem(i);
        }
    }
    
    // Remove extra canvas items
    const allCanvasItems = document.querySelectorAll('.canvas-item');
    allCanvasItems.forEach((item, index) => {
        if (index >= count) {
            item.remove();
            canvasData[index] = null;
        }
    });
    
    // Show discount notification
    if (count >= 5) {
        discountNotification.style.display = 'flex';
        discountNotification.querySelector('.discount-text').textContent = '12% discount will be applied!';
    } else if (count >= 3) {
        discountNotification.style.display = 'flex';
        discountNotification.querySelector('.discount-text').textContent = '5% discount will be applied!';
    } else {
        discountNotification.style.display = 'none';
    }
    
    updateTotalPrice();
}

// Switch canvas
function switchCanvas(index) {
    currentCanvasIndex = index;
    
    // Update tabs
    document.querySelectorAll('.tab').forEach((tab, i) => {
        tab.classList.toggle('active', i === index);
    });
    
    // Show selected canvas
    showCanvas(index);
    
    // Update preview for current canvas
    updatePreview();
}

// Show specific canvas
function showCanvas(index) {
    document.querySelectorAll('.canvas-item').forEach((item, i) => {
        item.style.display = i === index ? 'block' : 'none';
    });
}

// Update total price
function updateTotalPrice() {
    let total = 0;
    const isMulti = document.getElementById('multiCanvasToggle').checked;
    const canvasCount = isMulti ? parseInt(document.getElementById('canvasQuantity').value) : 1;
    
    for (let i = 0; i < canvasCount; i++) {
        if (canvasData[i] && canvasData[i].size) {
            total += canvasPrices[canvasData[i].size];
        }
    }
    
    // Apply discount
    let discount = 0;
    if (canvasCount >= 5) {
        discount = 0.12;
    } else if (canvasCount >= 3) {
        discount = 0.05;
    }
    
    const discountedTotal = total * (1 - discount);
    
    document.querySelector('.total-price').textContent = `$${discountedTotal.toFixed(2)}`;
}

// Validate form - Updated to check required fields
function validateForm() {
    const fbName = document.getElementById('fbName').value.trim();
    const email = document.getElementById('email').value.trim();
    
    if (!fbName) {
        alert('Please enter your Facebook name');
        return false;
    }
    
    if (!email) {
        alert('Please enter your email');
        return false;
    }
    
    const isMulti = document.getElementById('multiCanvasToggle').checked;
    const canvasCount = isMulti ? parseInt(document.getElementById('canvasQuantity').value) : 1;
    
    for (let i = 0; i < canvasCount; i++) {
        if (!canvasData[i] || !canvasData[i].size) {
            alert(`Please select a size for Canvas ${i + 1}`);
            switchCanvas(i);
            return false;
        }
        
        if (!canvasData[i].images || canvasData[i].images.length === 0) {
            alert(`Please upload at least one image for Canvas ${i + 1}`);
            switchCanvas(i);
            return false;
        }
    }
    
    return true;
}

// Confirm order
function confirmOrder() {
    if (!validateForm()) return;
    
    const modal = document.getElementById('confirmModal');
    const summary = document.getElementById('orderSummary');
    
    const fbName = document.getElementById('fbName').value;
    const email = document.getElementById('email').value;
    const notes = document.getElementById('notes').value;
    const isMulti = document.getElementById('multiCanvasToggle').checked;
    const canvasCount = isMulti ? parseInt(document.getElementById('canvasQuantity').value) : 1;
    
    let summaryHTML = `
        <h4>Customer Information</h4>
        <p><strong>Facebook Name:</strong> ${fbName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <hr>
        <h4>Canvas Details</h4>
    `;
    
    let total = 0;
    
    for (let i = 0; i < canvasCount; i++) {
        const data = canvasData[i];
        if (data && data.size) {
            const price = canvasPrices[data.size];
            total += price;
            
            summaryHTML += `
                <div style="margin-bottom: 15px;">
                    <h5>Canvas ${i + 1}</h5>
                    <p><strong>Size:</strong> ${data.size}" - $${price.toFixed(2)}</p>
                    <p><strong>Images:</strong> ${data.images ? data.images.length : 0} uploaded</p>
                    ${data.text ? `<p><strong>Text:</strong> ${data.text}</p>` : ''}
                    ${data.date ? `<p><strong>Date:</strong> ${data.date}</p>` : ''}
                    ${data.welcomeHome ? `<p><strong>Welcome Home:</strong> Yes</p>` : ''}
                </div>
            `;
        }
    }
    
    // Apply discount
    let discount = 0;
    if (canvasCount >= 5) {
        discount = 0.12;
        summaryHTML += `<p><strong>Discount:</strong> 12%</p>`;
    } else if (canvasCount >= 3) {
        discount = 0.05;
        summaryHTML += `<p><strong>Discount:</strong> 5%</p>`;
    }
    
    const discountedTotal = total * (1 - discount);
    
    if (notes) {
        summaryHTML += `<hr><p><strong>Notes:</strong> ${notes}</p>`;
    }
    
    summaryHTML += `<hr><h3>Total: $${discountedTotal.toFixed(2)}</h3>`;
    
    summary.innerHTML = summaryHTML;
    modal.style.display = 'block';
}

// Close confirm modal
function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
}

// Submit order
function submitOrder() {
    // Here you would normally send the data to your server
    // For now, we'll just show the thank you page
    
    document.getElementById('confirmModal').style.display = 'none';
    document.getElementById('thankYouPage').style.display = 'flex';
    
    // You can add code here to send the order data to your server
    console.log('Order submitted:', {
        customer: {
            fbName: document.getElementById('fbName').value,
            email: document.getElementById('email').value
        },
        canvasData: canvasData,
        notes: document.getElementById('notes').value
    });
}

// Start new order
function startNewOrder() {
    location.reload();
}

// Language switcher
function switchLanguage(lang) {
    currentLanguage = lang;
    
    // Update all elements with data-translate attribute
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[lang] && translations[lang][key]) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translations[lang][key];
            } else {
                element.textContent = translations[lang][key];
            }
        }
    });
    
    // Update active language button
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase().includes(lang));
    });
}
