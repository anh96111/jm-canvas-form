// Language translations
const translations = {
    en: {
        customerInfo: "Customer Information",
        fbName: "Facebook Name",
        email: "Email *",
        selectSize: "Select Canvas Size",
        preview: "Canvas Preview",
        uploadPhoto: "Upload Photo *",
        enterText: "Enter Your Text *",
        enterDate: "Date",
        welcomeHome: 'Add "Welcome Home" text',
        notes: "Additional Notes",
        submit: "Submit Order"
    },
    es: {
        customerInfo: "Información del Cliente",
        fbName: "Nombre de Facebook",
        email: "Correo Electrónico *",
        selectSize: "Seleccionar Tamaño del Lienzo",
        preview: "Vista Previa del Lienzo",
        uploadPhoto: "Subir Foto *",
        enterText: "Ingrese Su Texto *",
        enterDate: "Fecha",
        welcomeHome: 'Agregar texto "Welcome Home"',
        notes: "Notas Adicionales",
        submit: "Enviar Pedido"
    }
};

// Get URL parameters
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        fbid: params.get('fbid') || '',
        name: params.get('name') || '',
        lang: params.get('lang') || 'en'
    };
}

// Initialize form
document.addEventListener('DOMContentLoaded', function() {
    const params = getUrlParams();
    
    // Set Facebook name
    document.getElementById('fbName').value = params.name;
    
    // Set language
    setLanguage(params.lang);
    
    // Language switch
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            setLanguage(this.dataset.lang);
        });
    });
    
    // Size selection
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            document.querySelector('.preview-section').style.display = 'block';
            updatePreview();
        });
    });
    
    // File upload
    document.getElementById('photoUpload').addEventListener('change', updatePreview);
    
    // Text inputs
    document.getElementById('customText').addEventListener('input', updatePreview);
    document.getElementById('customDate').addEventListener('input', updatePreview);
    
    // Submit form
    document.querySelector('.submit-btn').addEventListener('click', submitForm);
});

// Set language
function setLanguage(lang) {
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        element.textContent = translations[lang][key] || translations['en'][key];
    });
}

// Update preview
function updatePreview() {
    const canvas = document.getElementById('previewCanvas');
    const ctx = canvas.getContext('2d');
    const fileInput = document.getElementById('photoUpload');
    const customText = document.getElementById('customText').value;
    const customDate = document.getElementById('customDate').value;
    
    // Clear canvas
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw image if uploaded
    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                // Draw image to fit canvas
                const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
                const x = (canvas.width / 2) - (img.width / 2) * scale;
                const y = (canvas.height / 2) - (img.height / 2) * scale;
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
                
                // Draw text overlay
                drawTextOverlay(ctx, customText, customDate);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        // Draw placeholder text
        ctx.fillStyle = '#999';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Upload photo to preview', canvas.width / 2, canvas.height / 2);
    }
}

// Draw text overlay
function drawTextOverlay(ctx, text, date) {
    // Text settings
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    
    // Position (bottom left with padding)
    const padding = 30;
    const lineHeight = 30;
    let y = ctx.canvas.height - padding;
    
    // Draw date if provided
    if (date) {
        ctx.strokeText(date, padding, y);
        ctx.fillText(date, padding, y);
        y -= lineHeight;
    }
    
    // Draw main text
    if (text) {
        ctx.strokeText(text, padding, y);
        ctx.fillText(text, padding, y);
    }
}

// Submit form
function submitForm() {
    const params = getUrlParams();
    const selectedSize = document.querySelector('.size-btn.selected');
    
    // Validate
    if (!selectedSize) {
        alert('Please select a canvas size');
        return;
    }
    
    if (!document.getElementById('email').value) {
        alert('Please enter your email');
        return;
    }
    
    if (!document.getElementById('photoUpload').files[0]) {
        alert('Please upload a photo');
        return;
    }
    
    // Collect form data
    const formData = {
        fbid: params.fbid,
        fbName: document.getElementById('fbName').value,
        email: document.getElementById('email').value,
        size: selectedSize.dataset.size,
        price: selectedSize.dataset.price,
        customText: document.getElementById('customText').value,
        customDate: document.getElementById('customDate').value,
        welcomeHome: document.getElementById('welcomeHome').checked,
        notes: document.getElementById('notes').value,
        timestamp: new Date().toISOString()
    };
    
    // For demo, just show alert
    alert('Order submitted successfully!\n\n' + JSON.stringify(formData, null, 2));
    
    // TODO: Send to n8n webhook
    // fetch('YOUR_N8N_WEBHOOK_URL', {
    //     method: 'POST',
    //     headers: {'Content-Type': 'application/json'},
    //     body: JSON.stringify(formData)
    // });
}
