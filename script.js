// Global variables
let canvasItems = [];
let currentPreviewIndex = 0;
let cropper = null;
let currentCropIndex = null;
let currentLang = 'en';
let backgroundImage = null;

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
    backgroundImage.src = 'preview-bg.jpg'; // Your background image
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
    
    // Add first canvas
    addNewCanvas();
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

// Add new canvas
function addNewCanvas() {
    const index = canvasItems.length;
    const canvasItem = {
        id: Date.now(),
        index: index,
        size: '',
        price: 0,
        imageFile: null,
        croppedImage: null,
        text: '',
        date: '',
        welcomeHome: false
    };
    
    canvasItems.push(canvasItem);
    
    const container = document.querySelector('.canvas-items-container');
    const canvasHtml = createCanvasItemHtml(canvasItem);
    container.insertAdjacentHTML('beforeend', canvasHtml);
    
    // Add preview canvas
    addPreviewCanvas(index);
    
    // Update preview
    currentPreviewIndex = index;
    updatePreviewCarousel();
    updatePricing();
}

// Create canvas item HTML
function createCanvasItemHtml(item) {
    const canvasNumber = item.index + 1;
    return `
        <div class="canvas-item" data-canvas-id="${item.id}">
            <div class="canvas-item-header">
                <h3 class="canvas-item-title">
                    <span data-translate="canvasNumber">${translations[currentLang].canvasNumber}</span> ${canvasNumber}
                </h3>
                ${canvasItems.length > 1 ? `<button class="remove-canvas-btn" onclick="removeCanvas(${item.id})">×</button>` : ''}
            </div>
            
            <div class="form-group">
                <label data-translate="selectSize">${translations[currentLang].selectSize}</label>
                <div class="size-selection">
                    <div class="size-option">
                        <input type="radio" id="size-8x10-${item.id}" name="size-${item.id}" value="8x10" onchange="updateCanvasSize(${item.id}, '8x10')">
                        <label for="size-8x10-${item.id}" class="size-label">
                            <span class="size-name">8x10</span>
                            <span class="size-price">$34</span>
                        </label>
                    </div>
                    <div class="size-option">
                        <input type="radio" id="size-11x14-${item.id}" name="size-${item.id}" value="11x14" onchange="updateCanvasSize(${item.id}, '11x14')">
                        <label for="size-11x14-${item.id}" class="size-label">
                            <span class="size-name">11x14</span>
                            <span class="size-price">$43</span>
                            <span class="best-seller">Best Seller</span>
                        </label>
                    </div>
                    <div class="size-option">
                        <input type="radio" id="size-16x20-${item.id}" name="size-${item.id}" value="16x20" onchange="updateCanvasSize(${item.id}, '16x20')">
                        <label for="size-16x20-${item.id}" class="size-label">
                            <span class="size-name">16x20</span>
                            <span class="size-price">$62</span>
                        </label>
                    </div>
                    <div class="size-option">
                        <input type="radio" id="size-20x30-${item.id}" name="size-${item.id}" value="20x30" onchange="updateCanvasSize(${item.id}, '20x30')">
                        <label for="size-20x30-${item.id}" class="size-label">
                            <span class="size-name">20x30</span>
                            <span class="size-price">$82</span>
                        </label>
                    </div>
                </div>
            </div>
            
            <div class="form-group">
                <label data-translate="uploadPhoto">${translations[currentLang].uploadPhoto}</label>
                <div class="file-upload-wrapper">
                    <label class="file-upload-label" for="photo-${item.id}">
                        <span id="photo-label-${item.id}" data-translate="uploadPhoto">${translations[currentLang].uploadPhoto}</span>
                    </label>
                    <input type="file" id="photo-${item.id}" accept="image/*" onchange="handlePhotoUpload(${item.id}, this)">
                </div>
                <p class="upload-note" data-translate="uploadNote">${translations[currentLang].uploadNote}</p>
            </div>
            
            <div class="form-group">
                <label data-translate="enterText">${translations[currentLang].enterText}</label>
                <input type="text" id="text-${item.id}" onkeyup="updateCanvasText(${item.id}, this.value)" placeholder="Enter name or dedication">
            </div>
            
            <div class="form-group">
                <label data-translate="enterDate">${translations[currentLang].enterDate}</label>
                <input type="text" id="date-${item.id}" onkeyup="updateCanvasDate(${item.id}, this.value)" placeholder="1945-2023">
            </div>
            
            <div class="checkbox-wrapper">
                <input type="checkbox" id="welcome-${item.id}" onchange="updateWelcomeHome(${item.id}, this.checked)">
                <label for="welcome-${item.id}" data-translate="welcomeHome">${translations[currentLang].welcomeHome}</label>
            </div>
        </div>
    `;
}

// Add preview canvas
function addPreviewCanvas(index) {
    const slidesContainer = document.getElementById('previewSlides');
    const slide = document.createElement('div');
    slide.className = 'preview-slide';
    slide.innerHTML = `<canvas id="preview-canvas-${index}" width="400" height="500"></canvas>`;
    slidesContainer.appendChild(slide);
    
    // Draw initial preview
    drawPreview(index);
}

// Remove canvas
function removeCanvas(id) {
    const index = canvasItems.findIndex(item => item.id === id);
    if (index > -1 && canvasItems.length > 1) {
        canvasItems.splice(index, 1);
        
        // Remove from DOM
        document.querySelector(`[data-canvas-id="${id}"]`).remove();
        document.getElementById('previewSlides').children[index].remove();
        
        // Re-index remaining items
        canvasItems.forEach((item, i) => {
            item.index = i;
        });
        
        // Update canvas numbers
        updateCanvasNumbers();
        
        // Update preview
        if (currentPreviewIndex >= canvasItems.length) {
            currentPreviewIndex = canvasItems.length - 1;
        }
        updatePreviewCarousel();
        updatePricing();
    }
}

// Update canvas numbers
function updateCanvasNumbers() {
    document.querySelectorAll('.canvas-item').forEach((element, index) => {
        const title = element.querySelector('.canvas-item-title');
        title.innerHTML = `<span data-translate="canvasNumber">${translations[currentLang].canvasNumber}</span> ${index + 1}`;
    });
}

// Update canvas size
function updateCanvasSize(id, size) {
    const item = canvasItems.find(i => i.id === id);
    if (item) {
        item.size = size;
        item.price = PRICES[size];
        updatePricing();
        drawPreview(item.index);
    }
}

// Handle photo upload
function handlePhotoUpload(id, input) {
    if (input.files && input.files[0]) {
        const item = canvasItems.find(i => i.id === id);
        if (item) {
            item.imageFile = input.files[0];
            currentCropIndex = item.index;
            
            // Update label
            document.getElementById(`photo-label-${id}`).textContent = input.files[0].name;
            
            // Open crop modal
            openCropModal(input.files[0]);
        }
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
    currentCropIndex = null;
}

// Apply crop
function applyCrop() {
    if (cropper && currentCropIndex !== null) {
        const canvas = cropper.getCroppedCanvas({
            width: 800,
            height: 800
        });
        
        canvas.toBlob(function(blob) {
            const item = canvasItems[currentCropIndex];
            item.croppedImage = blob;
            
            // Create object URL for preview
            if (item.croppedImageUrl) {
                URL.revokeObjectURL(item.croppedImageUrl);
            }
            item.croppedImageUrl = URL.createObjectURL(blob);
            
            // Close modal
            cancelCrop();
            
            // Update preview
            drawPreview(currentCropIndex);
        });
    }
}

// Update canvas text
function updateCanvasText(id, text) {
    const item = canvasItems.find(i => i.id === id);
    if (item) {
        item.text = text;
        drawPreview(item.index);
    }
}

// Update canvas date
function updateCanvasDate(id, date) {
    const item = canvasItems.find(i => i.id === id);
    if (item) {
        item.date = date;
        drawPreview(item.index);
    }
}

// Update welcome home
function updateWelcomeHome(id, checked) {
    const item = canvasItems.find(i => i.id === id);
    if (item) {
        item.welcomeHome = checked;
        drawPreview(item.index);
    }
}

// Draw preview
function drawPreview(index) {
    const canvas = document.getElementById(`preview-canvas-${index}`);
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

// Update preview carousel
function updatePreviewCarousel() {
    const slides = document.getElementById('previewSlides');
    const offset = -currentPreviewIndex * 100;
    slides.style.transform = `translateX(${offset}%)`;
    
    // Update indicator
    const indicator = document.getElementById('previewIndicator');
    indicator.textContent = `Canvas ${currentPreviewIndex + 1} of ${canvasItems.length}`;
    
    // Show/hide navigation buttons
    document.querySelector('.carousel-btn.prev').style.display = 
        currentPreviewIndex > 0 ? 'flex' : 'none';
    document.querySelector('.carousel-btn.next').style.display = 
        currentPreviewIndex < canvasItems.length - 1 ? 'flex' : 'none';
}

// Change preview
function changePreview(direction) {
    currentPreviewIndex += direction;
    currentPreviewIndex = Math.max(0, Math.min(currentPreviewIndex, canvasItems.length - 1));
    updatePreviewCarousel();
}

// Update pricing
function updatePricing() {
    let subtotal = 0;
    canvasItems.forEach(item => {
        subtotal += item.price;
    });
    
    let discount = 0;
    let discountText = '';
    
    if (canvasItems.length >= 5) {
        discount = subtotal * 0.12;
        discountText = `12% ${translations[currentLang].discount} (5+ canvas)`;
    } else if (canvasItems.length >= 3) {
        discount = subtotal * 0.05;
        discountText = `5% ${translations[currentLang].discount} (3+ canvas)`;
    }
    
    const total = subtotal - discount;
    
    // Update display
    document.querySelector('.price-amount').textContent = `$${total.toFixed(2)}`;
    
    const discountInfo = document.querySelector('.discount-info');
    if (discount > 0) {
        discountInfo.style.display = 'block';
        discountInfo.querySelector('.discount-text').textContent = discountText;
    } else {
        discountInfo.style.display = 'none';
    }
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
    for (let item of canvasItems) {
        if (!item.size) {
            alert(`Canvas ${item.index + 1}: ${translations[currentLang].selectSize}`);
            return;
        }
        if (!item.imageFile) {
            alert(`Canvas ${item.index + 1}: ${translations[currentLang].uploadPhoto}`);
            return;
        }
        if (!item.text) {
            alert(`Canvas ${item.index + 1}: ${translations[currentLang].enterText}`);
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
    
    let summaryHtml = `<h4>${translations[currentLang].orderSummaryTitle}</h4>`;
    let subtotal = 0;
    
    canvasItems.forEach((item, index) => {
        summaryHtml += `
            <div class="order-summary-item">
                <strong>Canvas ${index + 1}</strong><br>
                Size: ${item.size} - $${item.price}<br>
                Text: ${item.text}<br>
                Date: ${item.date || 'N/A'}<br>
                Welcome Home: ${item.welcomeHome ? 'Yes' : 'No'}
            </div>
        `;
        subtotal += item.price;
    });
    
    // Calculate discount
    let discount = 0;
    if (canvasItems.length >= 5) {
        discount = subtotal * 0.12;
    } else if (canvasItems.length >= 3) {
        discount = subtotal * 0.05;
    }
    
    const total = subtotal - discount;
    
    summaryHtml += `
        <div class="order-summary-total">
            Subtotal: $${subtotal.toFixed(2)}<br>
            ${discount > 0 ? `Discount: -$${discount.toFixed(2)}<br>` : ''}
            <strong>Total: $${total.toFixed(2)}</strong>
        </div>
    `;
    
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
         const response = await fetch('https://script.google.com/macros/s/AKfycbyUAX6Fikn14ExNC_uzNojc6gFvKZAbSYaS3rxEVyyeen0Kb_ahf-hdRvjsxj9QJyHR/exec', {
        //     method: 'POST',
        //     body: formData
        // });
        
        // For demo, just log the data
        console.log('Order data prepared:', formData);
        
        // Show success message
        alert(translations[currentLang].thankYou);
        
        // Close modal and reset form
        closeConfirmModal();
        // window.location.reload(); // Uncomment to reset form after submission
        
    } catch (error) {
        console.error('Error submitting order:', error);
        alert(translations[currentLang].errorSubmit);
    }
}
