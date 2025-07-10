// Global variables
let canvasItems = [];
let currentCanvasIndex = 0;
let cropper = null;
let currentCropCanvasId = null;
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
        imageFile: null,
        croppedImage: null,
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
                <label data-translate="selectSize">${translations[currentLang].selectSize}</label>
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
                <label data-translate="uploadPhoto">${translations[currentLang].uploadPhoto}</label>
                <div class="file-upload-wrapper">
                    <label class="file-upload-label" for="photo-${index}">
                        <span id="photo-label-${index}">${item.imageFile ? item.imageFile.name : translations[currentLang].uploadPhoto}</span>
                    </label>
                    <input type="file" id="photo-${index}" accept="image/*" onchange="handlePhotoUpload(${index}, this)">
                </div>
                <p class="upload-note" data-translate="uploadNote">${translations[currentLang].uploadNote}</p>
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
    
    // Update preview
    drawPreview();
}

// Update canvas size
function updateCanvasSize(index, size) {
    canvasItems[index].size = size;
    canvasItems[index].price = PRICES[size];
    updatePricing();
    if (index === currentCanvasIndex) {
        drawPreview();
    }
}

// Handle photo upload
function handlePhotoUpload(index, input) {
    if (input.files && input.files[0]) {
        canvasItems[index].imageFile = input.files[0];
        currentCropCanvasId = index;
        
        // Update label
        document.getElementById(`photo-label-${index}`).textContent = input.files[0].name;
        
        // Open crop modal
        openCropModal(input.files[0]);
    }
}

// Open crop modal
function openCropModal(file) {
    const modal = document.getElementById('cropModal');
    const image = document.getElementById('cropImage');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        image.src = e.target.result;
        modal.style.display = 'flex';
        
        // Initialize cropper
        if (cropper) {
            cropper.destroy();
        }
        
        cropper = new Cropper(image, {
            aspectRatio: 1,
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
    };
    reader.readAsDataURL(file);
}

// Cancel crop
function cancelCrop() {
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    document.getElementById('cropModal').style.display = 'none';
    currentCropCanvasId = null;
}

// Apply crop
function applyCrop() {
    if (cropper && currentCropCanvasId !== null) {
        const canvas = cropper.getCroppedCanvas({
            width: 800,
            height: 800
        });
        
        canvas.toBlob(function(blob) {
            canvasItems[currentCropCanvasId].croppedImage = blob;
            
            // Create object URL for preview
            if (canvasItems[currentCropCanvasId].croppedImageUrl) {
                URL.revokeObjectURL(canvasItems[currentCropCanvasId].croppedImageUrl);
            }
            canvasItems[currentCropCanvasId].croppedImageUrl = URL.createObjectURL(blob);
            
            // Close modal
            cancelCrop();
            
            // Update preview if current canvas
            if (currentCropCanvasId === currentCanvasIndex) {
                drawPreview();
            }
        });
    }
}

// Update canvas text
function updateCanvasText(index, text) {
    canvasItems[index].text = text;
    if (index === currentCanvasIndex) {
        drawPreview();
    }
}

// Update canvas date
function updateCanvasDate(index, date) {
    canvasItems[index].date = date;
    if (index === currentCanvasIndex) {
        drawPreview();
    }
}

// Update welcome home
function updateWelcomeHome(index, checked) {
    canvasItems[index].welcomeHome = checked;
    if (index === currentCanvasIndex) {
        drawPreview();
    }
}

// Draw preview
function drawPreview() {
    const canvas = document.getElementById('previewCanvas');
    const ctx = canvas.getContext('2d');
    const item = canvasItems[currentCanvasIndex];
    
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
    const lineHeight = 35;
    let y = canvas.height - padding;
    
    // Set text style
    ctx.textAlign = 'left';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 4;
    
    // Draw date if provided
    if (item.date) {
        ctx.font = 'bold 24px DateFont, Arial';
        ctx.fillStyle = '#ffffff';
        ctx.strokeText(item.date, padding, y);
        ctx.fillText(item.date, padding, y);
        y -= lineHeight;
    }
    
    // Draw main text
    if (item.text) {
        ctx.font = 'bold 28px TextFont, Arial';
        ctx.fillStyle = '#ffffff';
        ctx.strokeText(item.text, padding, y);
        ctx.fillText(item.text, padding, y);
        y -= lineHeight;
    }
    
    // Draw Welcome Home if checked
    if (item.welcomeHome) {
        y -= 10; // Extra spacing
        ctx.font = 'bold 32px TextFont, Arial';
        ctx.fillStyle = '#ffffff';
        ctx.strokeText('Welcome Home', padding, y);
        ctx.fillText('Welcome Home', padding, y);
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
    const email = document.getElementById('email').value;
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
        if (!item.imageFile) {
            alert(`${translations[currentLang].canvasNumber} ${i + 1}: ${translations[currentLang].uploadPhoto}`);
            switchCanvas(i);
            return;
        }
        if (!item.text) {
            alert(`${translations[currentLang].canvasNumber} ${i + 1}: ${translations[currentLang].enterText}`);
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
                    <span><strong>Text:</strong> ${item.text}</span>
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
        canvasItems.forEach((item, index) => {
            formData.append(`canvas_${index}_size`, item.size);
            formData.append(`canvas_${index}_price`, item.price);
            formData.append(`canvas_${index}_text`, item.text);
            formData.append(`canvas_${index}_date`, item.date);
            formData.append(`canvas_${index}_welcomeHome`, item.welcomeHome);
            
            // Add cropped image
            if (item.croppedImage) {
                formData.append(`canvas_${index}_image`, item.croppedImage, `canvas_${index}.jpg`);
            } else if (item.imageFile) {
                formData.append(`canvas_${index}_image`, item.imageFile);
            }
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