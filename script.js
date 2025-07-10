// Global Variables
let currentCanvas = 0;
let canvasData = [];
let cropper = null;
let currentCropInput = null;
let currentLanguage = 'en';

// Initialize canvas data structure
function initializeCanvas(index) {
    if (!canvasData[index]) {
        canvasData[index] = {
            size: '',
            images: [],
            text: '',
            date: '',
            welcomeHome: false,
            quantity: 1
        };
    }
}

// Initialize first canvas
initializeCanvas(0);

// Create canvas HTML structure
function createCanvasHTML(index) {
    return `
        <div class="canvas-item" data-canvas="${index}">
            <!-- Size Selection -->
            <div class="form-group">
                <label data-translate="selectSize">Select Size *</label>
                <div class="size-selection">
                    <div class="size-option">
                        <input type="radio" id="size-8x10-${index}" name="size-${index}" value="8x10" onchange="updateCanvasData(${index}, 'size', '8x10')">
                        <label for="size-8x10-${index}">8"×10"<br>$25</label>
                    </div>
                    <div class="size-option">
                        <input type="radio" id="size-11x14-${index}" name="size-${index}" value="11x14" onchange="updateCanvasData(${index}, 'size', '11x14')">
                        <label for="size-11x14-${index}">11"×14"<br>$35</label>
                    </div>
                    <div class="size-option">
                        <input type="radio" id="size-16x20-${index}" name="size-${index}" value="16x20" onchange="updateCanvasData(${index}, 'size', '16x20')">
                        <label for="size-16x20-${index}">16"×20"<br>$45</label>
                    </div>
                    <div class="size-option">
                        <input type="radio" id="size-18x24-${index}" name="size-${index}" value="18x24" onchange="updateCanvasData(${index}, 'size', '18x24')">
                        <label for="size-18x24-${index}">18"×24"<br>$55</label>
                    </div>
                </div>
            </div>

            <!-- Image Upload -->
            <div class="form-group image-upload-section">
                <label data-translate="uploadImages">Upload Images *</label>
                <input type="file" id="imageUpload-${index}" accept="image/*" multiple style="display: none;" onchange="handleImageUpload(event, ${index})">
                <div class="upload-area" onclick="document.getElementById('imageUpload-${index}').click()">
                    <div class="upload-icon">📷</div>
                    <p data-translate="clickToUpload">Click to upload images</p>
                </div>
                <div class="image-thumbnails" id="thumbnails-${index}"></div>
            </div>

            <!-- Text Input -->
            <div class="form-group">
                <label data-translate="enterText">Enter your text</label>
                <input type="text" id="canvasText-${index}" placeholder="Enter your custom text" onchange="updateCanvasData(${index}, 'text', this.value)">
            </div>

            <!-- Date Input -->
            <div class="form-group">
                <label data-translate="selectDate">Select Date</label>
                <input type="text" id="canvasDate-${index}" placeholder="e.g., 1999 ~ 2018" onchange="updateCanvasData(${index}, 'date', this.value)">
            </div>

            <!-- Welcome Home Checkbox -->
            <div class="welcome-checkbox">
                <input type="checkbox" id="welcomeHome-${index}" onchange="updateCanvasData(${index}, 'welcomeHome', this.checked)">
                <label for="welcomeHome-${index}" data-translate="addWelcomeHome">Add "Welcome Home"</label>
            </div>

            <!-- Quantity for Single Canvas -->
            ${!document.getElementById('multiCanvasToggle').checked ? `
                <div class="form-group">
                    <label data-translate="quantity">Quantity</label>
                    <input type="number" id="quantity-${index}" min="1" value="1" onchange="updateCanvasData(${index}, 'quantity', this.value)">
                </div>
            ` : ''}
        </div>
    `;
}

// Toggle multi canvas mode
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
        canvasTabs.innerHTML = '<div class="tab active" onclick="switchCanvas(0)">Canvas 1</div>';
        currentCanvas = 0;
        renderCanvasItems();
    }
}

// Update canvas count for multi-canvas
function updateCanvasCount() {
    const count = parseInt(document.getElementById('canvasQuantity').value);
    const canvasTabs = document.getElementById('canvasTabs');
    const discountNotification = document.getElementById('discountNotification');
    
    // Clear and rebuild tabs
    canvasTabs.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const tab = document.createElement('div');
        tab.className = i === currentCanvas ? 'tab active' : 'tab';
        tab.textContent = `Canvas ${i + 1}`;
        tab.onclick = () => switchCanvas(i);
        canvasTabs.appendChild(tab);
        
        initializeCanvas(i);
    }
    
    // Show discount notification
    if (count >= 3) {
        discountNotification.style.display = 'flex';
        const discountText = count >= 5 ? '12% discount applied!' : '5% discount applied!';
        document.querySelector('.discount-text').textContent = discountText;
    } else {
        discountNotification.style.display = 'none';
    }
    
    renderCanvasItems();
    updatePriceTotal();
}

// Switch between canvas tabs
function switchCanvas(index) {
    currentCanvas = index;
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach((tab, i) => {
        tab.classList.toggle('active', i === index);
    });
    renderCanvasItems();
    updatePreview();
}

// Render canvas items
function renderCanvasItems() {
    const container = document.getElementById('canvasItemsContainer');
    container.innerHTML = createCanvasHTML(currentCanvas);
    
    // Restore data
    const data = canvasData[currentCanvas];
    if (data.size) {
        document.getElementById(`size-${data.size}-${currentCanvas}`).checked = true;
    }
    if (data.text) {
        document.getElementById(`canvasText-${currentCanvas}`).value = data.text;
    }
    if (data.date) {
        document.getElementById(`canvasDate-${currentCanvas}`).value = data.date;
    }
    if (data.welcomeHome) {
        document.getElementById(`welcomeHome-${currentCanvas}`).checked = true;
    }
    if (data.quantity && !document.getElementById('multiCanvasToggle').checked) {
        document.getElementById(`quantity-${currentCanvas}`).value = data.quantity;
    }
    
    // Render thumbnails
    renderThumbnails(currentCanvas);
    
    // Update translations
    updateTranslations();
}

// Handle image upload
function handleImageUpload(event, canvasIndex) {
    const files = event.target.files;
    
    for (let file of files) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // Show crop modal
            currentCropInput = { canvasIndex, file, imageData: e.target.result };
            showCropModal(e.target.result);
        };
        reader.readAsDataURL(file);
    }
}

// Show crop modal
function showCropModal(imageSrc) {
    const modal = document.getElementById('cropModal');
    const image = document.getElementById('cropImage');
    
    image.src = imageSrc;
    modal.style.display = 'flex';
    
    // Initialize cropper after image loads
    image.onload = function() {
        if (cropper) {
            cropper.destroy();
        }
        cropper = new Cropper(image, {
            aspectRatio: 8 / 10, // 8x10 ratio
            viewMode: 1,
            guides: true,
            center: true,
            highlight: true,
            background: true,
            autoCrop: true,
            autoCropArea: 1,
            movable: true,
            rotatable: false,
            scalable: true,
            zoomable: true,
            zoomOnTouch: true,
            zoomOnWheel: true,
            cropBoxMovable: true,
            cropBoxResizable: true
        });
    };
}

// Cancel crop
function cancelCrop() {
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    document.getElementById('cropModal').style.display = 'none';
    currentCropInput = null;
}

// Apply crop
function applyCrop() {
    if (cropper && currentCropInput) {
        const canvas = cropper.getCroppedCanvas();
        const croppedImage = canvas.toDataURL('image/jpeg');
        
        // Add to canvas data
        if (!canvasData[currentCropInput.canvasIndex].images) {
            canvasData[currentCropInput.canvasIndex].images = [];
        }
        canvasData[currentCropInput.canvasIndex].images.push({
            original: currentCropInput.imageData,
            cropped: croppedImage,
            file: currentCropInput.file
        });
        
        // Render thumbnails
        renderThumbnails(currentCropInput.canvasIndex);
        
        // Show preview section
        document.getElementById('previewSection').style.display = 'block';
        updatePreview();
        
        // Clean up
        cancelCrop();
    }
}

// Render image thumbnails
function renderThumbnails(canvasIndex) {
    const container = document.getElementById(`thumbnails-${canvasIndex}`);
    if (!container) return;
    
    container.innerHTML = '';
    const images = canvasData[canvasIndex].images || [];
    
    images.forEach((img, index) => {
        const thumbDiv = document.createElement('div');
        thumbDiv.className = 'thumbnail-item';
        thumbDiv.innerHTML = `
            <img src="${img.cropped}" alt="Image ${index + 1}">
            <button class="delete-thumb" onclick="deleteImage(${canvasIndex}, ${index})">×</button>
        `;
        container.appendChild(thumbDiv);
    });
}

// Delete image
function deleteImage(canvasIndex, imageIndex) {
    canvasData[canvasIndex].images.splice(imageIndex, 1);
    renderThumbnails(canvasIndex);
    
    // Hide preview if no images
    if (canvasData[canvasIndex].images.length === 0) {
        document.getElementById('previewSection').style.display = 'none';
    }
}

// Update canvas data
function updateCanvasData(canvasIndex, field, value) {
    canvasData[canvasIndex][field] = value;
    updatePriceTotal();
    
    if (field === 'text' || field === 'date') {
        updatePreview();
    }
}

// Update preview
function updatePreview() {
    const canvas = document.getElementById('previewCanvas');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Load and draw background image
    const bgImage = new Image();
    bgImage.onload = function() {
        // Draw background
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        
        // Get current canvas data
        const data = canvasData[currentCanvas];
        
        // Draw text overlay
        if (data.text) {
            ctx.save();
            
            // Text styling
            ctx.font = '40px Parisienne';
            ctx.fillStyle = '#000000';
            ctx.strokeStyle = 'rgba(139, 90, 43, 0.5)'; // Light brown stroke
            ctx.lineWidth = 1;
            ctx.textAlign = 'left';
            
            // Position text
            const textX = 40;
            const textY = canvas.height - 100;
            
            // Draw text with stroke
            ctx.strokeText(data.text, textX, textY);
            ctx.fillText(data.text, textX, textY);
            
            ctx.restore();
        }
        
        // Draw date
        if (data.date) {
            ctx.save();
            
            // Date styling
            ctx.font = '24px Amatic SC';
            ctx.fillStyle = '#000000';
            ctx.strokeStyle = 'rgba(139, 90, 43, 0.5)';
            ctx.lineWidth = 0.5;
            ctx.textAlign = 'left';
            
            // Position date below text
            const dateX = 40;
            const dateY = canvas.height - 60;
            
            // Draw date with stroke
            ctx.strokeText(data.date, dateX, dateY);
            ctx.fillText(data.date, dateX, dateY);
            
            ctx.restore();
        }
    };
    
    // Use the Jesus image as background
    bgImage.src = 'background-demo.jpg';
}

// Calculate price
function calculatePrice(size, quantity = 1) {
    const prices = {
        '8x10': 25,
        '11x14': 35,
        '16x20': 45,
        '18x24': 55
    };
    return (prices[size] || 0) * quantity;
}

// Update price total
function updatePriceTotal() {
    let total = 0;
    const isMulti = document.getElementById('multiCanvasToggle').checked;
    
    if (isMulti) {
        const count = parseInt(document.getElementById('canvasQuantity').value);
        for (let i = 0; i < count; i++) {
            if (canvasData[i] && canvasData[i].size) {
                total += calculatePrice(canvasData[i].size);
            }
        }
        
        // Apply discount
        if (count >= 5) {
            total *= 0.88; // 12% off
        } else if (count >= 3) {
            total *= 0.95; // 5% off
        }
    } else {
        if (canvasData[0] && canvasData[0].size) {
            total = calculatePrice(canvasData[0].size, canvasData[0].quantity || 1);
        }
    }
    
    document.querySelector('.total-price').textContent = `$${total.toFixed(2)}`;
}

// Validate form
function validateForm() {
    const fbName = document.getElementById('fbName').value.trim();
    const email = document.getElementById('email').value.trim();
    
    if (!fbName) {
        alert('Please enter your Facebook name');
        return false;
    }
    
    if (!email || !email.includes('@')) {
        alert('Please enter a valid email address');
        return false;
    }
    
    // Check canvas data
    const isMulti = document.getElementById('multiCanvasToggle').checked;
    const canvasCount = isMulti ? parseInt(document.getElementById('canvasQuantity').value) : 1;
    
    for (let i = 0; i < canvasCount; i++) {
        const data = canvasData[i];
        if (!data || !data.size) {
            alert(`Please select a size for Canvas ${i + 1}`);
            switchCanvas(i);
            return false;
        }
        
        if (!data.images || data.images.length === 0) {
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
    
    // Build order summary
    const isMulti = document.getElementById('multiCanvasToggle').checked;
    const canvasCount = isMulti ? parseInt(document.getElementById('canvasQuantity').value) : 1;
    
    let summaryHTML = `
        <p><strong>Customer:</strong> ${document.getElementById('fbName').value}</p>
        <p><strong>Email:</strong> ${document.getElementById('email').value}</p>
        <hr>
    `;
    
    for (let i = 0; i < canvasCount; i++) {
        const data = canvasData[i];
        summaryHTML += `
            <h4>Canvas ${i + 1}</h4>
            <p>Size: ${data.size}"</p>
            <p>Images: ${data.images.length} uploaded</p>
            <p>Text: ${data.text || 'None'}</p>
            <p>Date: ${data.date || 'None'}</p>
            <p>Welcome Home: ${data.welcomeHome ? 'Yes' : 'No'}</p>
            ${!isMulti ? `<p>Quantity: ${data.quantity || 1}</p>` : ''}
            <hr>
        `;
    }
    
    const total = document.querySelector('.total-price').textContent;
    summaryHTML += `<h3>Total: ${total}</h3>`;
    
    document.getElementById('orderSummary').innerHTML = summaryHTML;
    document.getElementById('confirmModal').style.display = 'flex';
}

// Close confirmation modal
function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
}

// Submit order
function submitOrder() {
    // Here you would normally send the data to your server
    // For now, we'll just show the thank you page
    
    document.getElementById('confirmModal').style.display = 'none';
    document.getElementById('thankYouPage').style.display = 'flex';
    
    // Log order data (for debugging)
    console.log('Order submitted:', {
        customer: {
            fbName: document.getElementById('fbName').value,
            email: document.getElementById('email').value
        },
        canvases: canvasData,
        notes: document.getElementById('notes').value
    });
}

// Start new order
function startNewOrder() {
    location.reload();
}

// Update translations
function updateTranslations() {
    if (typeof translations === 'undefined') return;
    
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translations[currentLanguage][key];
            } else {
                element.textContent = translations[currentLanguage][key];
            }
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    renderCanvasItems();
    updateTranslations();
});
