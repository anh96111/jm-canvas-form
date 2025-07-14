// Global variables
let currentLanguage = 'en';
let canvasData = {};
let currentCanvas = 0;
let totalCanvases = 1;
let cropper = null;
let currentCropData = null;

// Prices configuration
const PRICES = {
    '8x10': 34,
    '11x14': 43,
    '16x20': 62,
    '20x30': 82,
    'twoPerson': 10
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeCanvas(0);
    updateLanguage();
    updateTotalPrice();
    
    // Add character counter listener
    document.getElementById('customText-0').addEventListener('input', function(e) {
        updateCharCounter(0);
    });
});

// Initialize canvas data
function initializeCanvas(canvasIndex) {
    if (!canvasData[canvasIndex]) {
        canvasData[canvasIndex] = {
            size: null,
            price: 0,
            images: [],
            customText: '',
            date: '',
            welcomeHome: false,
            twoPerson: false
        };
    }
}

// Handle canvas type change
function handleCanvasTypeChange() {
    const canvasType = document.getElementById('canvasType').value;
    const multiSection = document.getElementById('multiCanvasSection');
    const canvasTabs = document.getElementById('canvasTabs');
    const miniNav = document.getElementById('miniCanvasNav');
    
    if (canvasType === 'multi') {
        multiSection.style.display = 'block';
        canvasTabs.style.display = 'flex';
        miniNav.style.display = 'block';
        updateCanvasCount();
    } else {
        multiSection.style.display = 'none';
        canvasTabs.style.display = 'none';
        miniNav.style.display = 'none';
        totalCanvases = 1;
        
        // Keep canvas 1 data when switching back to single
        const tempData = canvasData[0];
        canvasData = { 0: tempData || {} };
        initializeCanvas(0);
    }
}

// Update canvas count for multi canvas
function updateCanvasCount() {
    const quantity = parseInt(document.getElementById('canvasQuantity').value);
    totalCanvases = quantity;
    
    // Update discount notification
    const discountNotification = document.getElementById('discountNotification');
    const discountText = document.querySelector('.discount-text');
    
    if (quantity >= 5) {
        discountNotification.style.display = 'block';
        discountText.textContent = 'You qualify for 12% discount!';
    } else if (quantity >= 3) {
        discountNotification.style.display = 'block';
        discountText.textContent = 'You qualify for 5% discount!';
    } else {
        discountNotification.style.display = 'none';
    }
    
    // Generate tabs
    generateCanvasTabs();
    generateMiniTabs();
    
    // Initialize new canvases
    for (let i = 0; i < quantity; i++) {
        initializeCanvas(i);
        if (i > 0) {
            duplicateCanvasElements(i);
        }
    }
    
    // Remove extra canvases
    for (let i = quantity; i < 10; i++) {
        removeCanvasElements(i);
        delete canvasData[i];
    }
    
    updateTotalPrice();
}

// Generate canvas tabs
function generateCanvasTabs() {
    const tabsContainer = document.getElementById('canvasTabs');
    tabsContainer.innerHTML = '';
    
    for (let i = 0; i < totalCanvases; i++) {
        const tab = document.createElement('div');
        tab.className = 'tab' + (i === currentCanvas ? ' active' : '');
        tab.textContent = `Canvas ${i + 1}`;
        tab.onclick = () => switchCanvas(i);
        tabsContainer.appendChild(tab);
    }
}

// Generate mini tabs for bottom navigation
function generateMiniTabs() {
    const miniTabsContainer = document.getElementById('miniTabs');
    miniTabsContainer.innerHTML = '';
    
    // Show 2-3 tabs around current
    let start = Math.max(0, currentCanvas - 1);
    let end = Math.min(totalCanvases - 1, start + 2);
    
    if (end - start < 2 && totalCanvases > 2) {
        start = Math.max(0, end - 2);
    }
    
    for (let i = start; i <= end; i++) {
        const tab = document.createElement('div');
        tab.className = 'mini-tab' + (i === currentCanvas ? ' active' : '');
        tab.textContent = `Canvas ${i + 1}`;
        tab.onclick = () => switchCanvas(i);
        miniTabsContainer.appendChild(tab);
    }
    
    // Update counter
    document.getElementById('currentCanvasNum').textContent = currentCanvas + 1;
    document.getElementById('totalCanvasNum').textContent = totalCanvases;
}

// Switch between canvases
function switchCanvas(index) {
    // Save current canvas data
    saveCurrentCanvasData();
    
    // Hide current canvas elements
    document.querySelectorAll(`.canvas-item[data-canvas="${currentCanvas}"]`).forEach(el => {
        el.style.display = 'none';
    });
    
    // Show new canvas elements
    document.querySelectorAll(`.canvas-item[data-canvas="${index}"]`).forEach(el => {
        el.style.display = 'block';
    });
    
    // Update active tab
    document.querySelectorAll('.canvas-tabs .tab').forEach((tab, i) => {
        tab.classList.toggle('active', i === index);
    });
    
    currentCanvas = index;
    
    // Update mini tabs
    generateMiniTabs();
    
    // Load canvas data
    loadCanvasData(index);
}

// Save current canvas data
function saveCurrentCanvasData() {
    const data = canvasData[currentCanvas];
    data.customText = document.getElementById(`customText-${currentCanvas}`).value;
    data.date = document.getElementById(`date-${currentCanvas}`).value;
    data.welcomeHome = document.getElementById(`welcomeHome-${currentCanvas}`).checked;
    data.twoPerson = document.getElementById(`twoPersonCanvas-${currentCanvas}`).checked;
}

// Load canvas data
function loadCanvasData(index) {
    const data = canvasData[index];
    if (!data) return;
    
    document.getElementById(`customText-${index}`).value = data.customText || '';
    document.getElementById(`date-${index}`).value = data.date || '';
    document.getElementById(`welcomeHome-${index}`).checked = data.welcomeHome || false;
    document.getElementById(`twoPersonCanvas-${index}`).checked = data.twoPerson || false;
    
    updateCharCounter(index);
}

// Duplicate canvas elements for multi canvas
function duplicateCanvasElements(index) {
    const container = document.getElementById('canvasItemsContainer');
    const originalElements = document.querySelectorAll('.canvas-item[data-canvas="0"]');
    
    originalElements.forEach(element => {
        const clone = element.cloneNode(true);
        clone.setAttribute('data-canvas', index);
        clone.style.display = 'none';
        
        // Update IDs and attributes
        clone.querySelectorAll('[id]').forEach(el => {
            const oldId = el.id;
            const newId = oldId.replace('-0', `-${index}`);
            el.id = newId;
            
            // Update onchange/onclick attributes
            if (el.hasAttribute('onchange')) {
                el.setAttribute('onchange', el.getAttribute('onchange').replace('(0)', `(${index})`));
            }
            if (el.hasAttribute('onclick')) {
                el.setAttribute('onclick', el.getAttribute('onclick').replace('(0)', `(${index})`));
            }
        });
        
        // Update labels
        clone.querySelectorAll('label[for]').forEach(label => {
            const forAttr = label.getAttribute('for');
            label.setAttribute('for', forAttr.replace('-0', `-${index}`));
        });
        
        // Clear values
        clone.querySelectorAll('input[type="text"], input[type="email"], textarea').forEach(input => {
            input.value = '';
        });
        clone.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        container.appendChild(clone);
    });
    
    // Add character counter listener
    document.getElementById(`customText-${index}`).addEventListener('input', function(e) {
        updateCharCounter(index);
    });
}

// Remove canvas elements
function removeCanvasElements(index) {
    document.querySelectorAll(`.canvas-item[data-canvas="${index}"]`).forEach(el => {
        el.remove();
    });
}

// Select size
function selectSize(size, canvasIndex) {
    // Update UI
    document.querySelectorAll(`.canvas-item[data-canvas="${canvasIndex}"] .size-option`).forEach(option => {
        option.classList.remove('selected');
    });
    
    document.querySelector(`.canvas-item[data-canvas="${canvasIndex}"] .size-option[data-size="${size}"]`).classList.add('selected');
    
    // Update price display
    const priceDisplay = document.getElementById(`selectedPrice-${canvasIndex}`);
    const price = PRICES[size];
    priceDisplay.textContent = `$${price}`;
    priceDisplay.style.display = 'block';
    priceDisplay.classList.add('show');
    
    // Update data
    canvasData[canvasIndex].size = size;
    canvasData[canvasIndex].price = price;
    
    // Clear validation error
    const errorElement = document.getElementById(`size-error-${canvasIndex}`);
    errorElement.textContent = '';
    errorElement.classList.remove('show');
    
    updateTotalPrice();
}

// Handle two person change
function handleTwoPersonChange(canvasIndex) {
    const isChecked = document.getElementById(`twoPersonCanvas-${canvasIndex}`).checked;
    canvasData[canvasIndex].twoPerson = isChecked;
    updateTotalPrice();
}

// Update character counter
function updateCharCounter(canvasIndex) {
    const input = document.getElementById(`customText-${canvasIndex}`);
    const counter = document.getElementById(`charCount-${canvasIndex}`);
    if (counter) {
        counter.textContent = input.value.length;
    }
}

// Trigger file input
function triggerFileInput(canvasIndex) {
    document.getElementById(`imageInput-${canvasIndex}`).click();
}

// Handle image upload
function handleImageUpload(event, canvasIndex) {
    const files = Array.from(event.target.files);
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxImages = 6;
    
    // Clear validation error
    const errorElement = document.getElementById(`image-error-${canvasIndex}`);
    errorElement.textContent = '';
    errorElement.classList.remove('show');
    
    // Check current image count
    if (canvasData[canvasIndex].images.length >= maxImages) {
        errorElement.textContent = `Maximum ${maxImages} images allowed`;
        errorElement.classList.add('show');
        return;
    }
    
    // Validate files
    const validFiles = files.filter(file => {
        if (!validTypes.includes(file.type)) {
            errorElement.textContent = 'Only JPG and PNG files are allowed';
            errorElement.classList.add('show');
            return false;
        }
        return true;
    });
    
    // Process valid files
    validFiles.forEach(file => {
        if (canvasData[canvasIndex].images.length < maxImages) {
            const reader = new FileReader();
            reader.onload = function(e) {
                // Open crop modal
                openCropModal(e.target.result, canvasIndex);
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Clear input
    event.target.value = '';
}

// Open crop modal
function openCropModal(imageSrc, canvasIndex) {
    const modal = document.getElementById('cropModal');
    const image = document.getElementById('cropImage');
    
    currentCropData = {
        canvasIndex: canvasIndex,
        originalSrc: imageSrc
    };
    
    image.src = imageSrc;
    modal.style.display = 'block';
    
    // Initialize cropper
    if (cropper) {
        cropper.destroy();
    }
    
    cropper = new Cropper(image, {
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
        zoomable: true,
        zoomOnTouch: true,
        zoomOnWheel: true,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: true
    });
}

// Cancel crop
function cancelCrop() {
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    document.getElementById('cropModal').style.display = 'none';
    currentCropData = null;
}

// Apply crop
function applyCrop() {
    if (!cropper || !currentCropData) return;
    
    const canvas = cropper.getCroppedCanvas({
        width: 400,
        height: 500
    });
    
    const croppedImage = canvas.toDataURL('image/jpeg', 0.9);
    
    // Add to canvas data
    canvasData[currentCropData.canvasIndex].images.push(croppedImage);
    
    // Update thumbnails
    updateImageThumbnails(currentCropData.canvasIndex);
    
    // Close modal
    cancelCrop();
}

// Update image thumbnails
function updateImageThumbnails(canvasIndex) {
    const container = document.getElementById(`imageThumbnails-${canvasIndex}`);
    container.innerHTML = '';
    
    canvasData[canvasIndex].images.forEach((image, index) => {
        const thumb = document.createElement('div');
        thumb.className = 'image-thumb';
        thumb.innerHTML = `
            <img src="${image}" alt="Image ${index + 1}">
            <button class="remove-image" onclick="removeImage(${canvasIndex}, ${index})">×</button>
        `;
        container.appendChild(thumb);
    });
}

// Remove image
function removeImage(canvasIndex, imageIndex) {
    canvasData[canvasIndex].images.splice(imageIndex, 1);
    updateImageThumbnails(canvasIndex);
}

// Open preview modal
function openPreviewModal(canvasIndex) {
    const modal = document.getElementById('previewModal');
    const canvas = document.getElementById('previewCanvas');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Load background image
    const bgImage = new Image();
    const isTwoPerson = canvasData[canvasIndex].twoPerson;
    bgImage.src = isTwoPerson ? 'canvas-bg-couple.jpg' : 'canvas-bg-single.jpg';
    
    bgImage.onload = function() {
        // Draw background
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        
        // Draw preview notice in center
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(50, 200, 300, 100);
        
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const notice = 'This is only a preview for your custom text.\nThe final canvas preview will be sent to\nyour email and Messenger.';
        const lines = notice.split('\n');
        lines.forEach((line, index) => {
            ctx.fillText(line, 200, 230 + (index * 20));
        });
        ctx.restore();
        
        // Draw custom text
        const customText = canvasData[canvasIndex].customText;
        if (customText) {
            ctx.save();
            ctx.fillStyle = '#333';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(customText, 200, 380);
            ctx.restore();
        }
        
        // Draw date
        const date = canvasData[canvasIndex].date;
        if (date) {
            ctx.save();
            ctx.fillStyle = '#666';
            ctx.font = '18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(date, 200, 420);
            ctx.restore();
        }
        
        // Draw welcome home if selected
        if (canvasData[canvasIndex].welcomeHome) {
            const welcomeImg = new Image();
            welcomeImg.src = 'welcome-home-overlay.png';
            welcomeImg.onload = function() {
                ctx.drawImage(welcomeImg, 100, 50, 200, 50);
            };
        }
    };
    
    modal.style.display = 'block';
}

// Close preview modal
function closePreviewModal() {
    document.getElementById('previewModal').style.display = 'none';
}

// Update total price
function updateTotalPrice() {
    let total = 0;
    
    // Calculate base price for all canvases
    for (let i = 0; i < totalCanvases; i++) {
        if (canvasData[i]) {
            total += canvasData[i].price || 0;
            if (canvasData[i].twoPerson) {
                total += PRICES.twoPerson;
            }
        }
    }
    
    // Apply discount
    let discount = 0;
    if (totalCanvases >= 5) {
        discount = 0.12;
    } else if (totalCanvases >= 3) {
        discount = 0.05;
    }
    
    const discountedTotal = total * (1 - discount);
    
    document.getElementById('totalPrice').textContent = `$${discountedTotal.toFixed(2)}`;
}

// Validate form
function validateForm() {
    let isValid = true;
    const errors = [];
    
    // Save current canvas data
    saveCurrentCanvasData();
    
    // Validate each canvas
    for (let i = 0; i < totalCanvases; i++) {
        const data = canvasData[i];
        
        // Check size
        if (!data.size) {
            document.getElementById(`size-error-${i}`).textContent = 'Please select a size';
            document.getElementById(`size-error-${i}`).classList.add('show');
            errors.push(`Canvas ${i + 1}: Please select a size`);
            isValid = false;
        }
        
        // Check images
        if (data.images.length === 0) {
            document.getElementById(`image-error-${i}`).textContent = 'Please upload at least one image';
            document.getElementById(`image-error-${i}`).classList.add('show');
            errors.push(`Canvas ${i + 1}: Please upload at least one image`);
            isValid = false;
        }
    }
    
    // Validate customer info
    const fbName = document.getElementById('fbName').value.trim();
    const email = document.getElementById('email').value.trim();
    
    if (!fbName) {
        document.getElementById('fbName-error').textContent = 'Please enter your Facebook name';
        document.getElementById('fbName-error').classList.add('show');
        isValid = false;
    }
    
    if (!email || !isValidEmail(email)) {
        document.getElementById('email-error').textContent = 'Please enter a valid email address';
        document.getElementById('email-error').classList.add('show');
        isValid = false;
    }
    
    return { isValid, errors };
}

// Check valid email
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Confirm order
function confirmOrder() {
    const validation = validateForm();
    
    if (!validation.isValid) {
        // If multi canvas, switch to first canvas with error
        if (totalCanvases > 1 && validation.errors.length > 0) {
            const firstError = validation.errors[0];
            const canvasMatch = firstError.match(/Canvas (\d+)/);
            if (canvasMatch) {
                switchCanvas(parseInt(canvasMatch[1]) - 1);
            }
        }
        return;
    }
    
    // Show confirmation modal
    showOrderSummary();
}

// Show order summary
function showOrderSummary() {
    const modal = document.getElementById('confirmModal');
    const summary = document.getElementById('orderSummary');
    
    let html = '<div class="order-summary">';
    
    // Canvas details
    for (let i = 0; i < totalCanvases; i++) {
        const data = canvasData[i];
        html += `
            <div class="canvas-summary">
                <h4>Canvas ${i + 1}</h4>
                <p>Size: ${data.size} inches - $${data.price}</p>
                ${data.twoPerson ? '<p>Two Person Canvas: +$10</p>' : ''}
                <p>Images: ${data.images.length} uploaded</p>
                ${data.customText ? `<p>Text: ${data.customText}</p>` : ''}
                ${data.date ? `<p>Date: ${data.date}</p>` : ''}
                ${data.welcomeHome ? '<p>Welcome Home: Yes</p>' : ''}
            </div>
        `;
    }
    
    // Customer info
    html += `
        <div class="customer-summary">
            <h4>Customer Information</h4>
            <p>Facebook Name: ${document.getElementById('fbName').value}</p>
            <p>Email: ${document.getElementById('email').value}</p>
        </div>
    `;
    
    // Notes
    const notes = document.getElementById('notes').value;
    if (notes) {
        html += `
            <div class="notes-summary">
                <h4>Additional Notes</h4>
                <p>${notes}</p>
            </div>
        `;
    }
    
    // Total
    const totalPrice = document.getElementById('totalPrice').textContent;
    html += `
        <div class="total-summary">
            <h4>Total: ${totalPrice}</h4>
            ${totalCanvases >= 3 ? '<p class="discount-applied">Discount applied!</p>' : ''}
        </div>
    `;
    
    html += '</div>';
    
    summary.innerHTML = html;
    modal.style.display = 'block';
}

// Close confirm modal
function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
}

// Submit order
function submitOrder() {
    // Prepare order data
    const orderData = {
        canvases: [],
        customer: {
            fbName: document.getElementById('fbName').value,
            email: document.getElementById('email').value
        },
        notes: document.getElementById('notes').value,
        totalPrice: document.getElementById('totalPrice').textContent,
        timestamp: new Date().toISOString()
    };
    
    // Add canvas data
    for (let i = 0; i < totalCanvases; i++) {
        orderData.canvases.push({
            canvasNumber: i + 1,
            size: canvasData[i].size,
            price: canvasData[i].price,
            twoPerson: canvasData[i].twoPerson,
            images: canvasData[i].images,
            customText: canvasData[i].customText,
            date: canvasData[i].date,
            welcomeHome: canvasData[i].welcomeHome
        });
    }
    
    // Send order (you would implement the actual API call here)
    console.log('Order submitted:', orderData);
    
    // For now, just show thank you page
    closeConfirmModal();
    showThankYouPage();
}

// Show thank you page
function showThankYouPage() {
    document.getElementById('thankYouPage').style.display = 'flex';
}

// Start new order
function startNewOrder() {
    // Reset everything
    canvasData = {};
    currentCanvas = 0;
    totalCanvases = 1;
    
    // Reset form
    document.getElementById('canvasType').value = 'single';
    document.getElementById('canvasQuantity').value = '2';
    document.getElementById('fbName').value = '';
    document.getElementById('email').value = '';
    document.getElementById('notes').value = '';
    
    // Hide thank you page
    document.getElementById('thankYouPage').style.display = 'none';
    
    // Reinitialize
    initializeCanvas(0);
    handleCanvasTypeChange();
    
    // Clear all form fields
    document.querySelectorAll('input[type="text"], input[type="email"], textarea').forEach(input => {
        input.value = '';
    });
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    document.querySelectorAll('.size-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelectorAll('.selected-price').forEach(price => {
        price.style.display = 'none';
    });
    document.querySelectorAll('.image-thumbnails').forEach(container => {
        container.innerHTML = '';
    });
    document.querySelectorAll('.validation-error').forEach(error => {
        error.textContent = '';
        error.classList.remove('show');
    });
    
    updateTotalPrice();
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
    element.classList.toggle('active');
    answer.classList.toggle('show');
}

// Update language
function updateLanguage() {
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            element.textContent = translations[currentLanguage][key];
        }
    });
    
    document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            element.placeholder = translations[currentLanguage][key];
        }
    });
}

// Close modals when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
    }
}
