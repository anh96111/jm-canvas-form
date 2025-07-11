// Language Configuration
const defaultLanguage = 'en';
let currentLanguage = defaultLanguage;

// Complete Translation Dictionary
const translations = {
    en: {
        // Promotional Banner
        promoText: "🎁 Special Offer: Order 3+ canvas and get 5% OFF! Order 5+ canvas and get 12% OFF! 🎁",
        
        // Canvas Type Selection
        canvasType: "Select Canvas Type",
        singleCanvas: "Single Canvas",
        multiCanvas: "Multiple Different Canvas",
        collageCanvas: "Collage Multiple Images",
        
        // Canvas Configuration
        selectQuantity: "How many different canvas?",
        selectSize: "Select Size *",
        bestSeller: "Best Seller",
        twoPersonLabel: "2 people on 1 canvas (+$10)",
        
        // Upload Section
        uploadImages: "Upload Images *",
        uploadText: "Click to upload images (Max 6)",
        uploadSubtext: "Supports JPG, PNG - Will be cropped to 8:10 ratio",
        
        // Form Fields
        customText: "Enter your text",
        customTextPlaceholder: "e.g., Forever Together",
        date: "Date",
        datePlaceholder: "e.g., Dec 25, 2024",
        welcomeHome: "Welcome Home",
        notes: "Additional Notes",
        notesPlaceholder: "Special instructions...",
        
        // Customer Information
        customerInfo: "Customer Information",
        fbName: "Your Facebook name *",
        fbNamePlaceholder: "Enter your Facebook name",
        email: "Email *",
        emailPlaceholder: "your@email.com",
        
        // Preview & Pricing
        preview: "Canvas Preview",
        previewNotice: "This is only a preview for your custom text. The final canvas preview will be sent to your email and Messenger.",
        estimatedTotal: "Estimated Total",
        
        // Buttons & Actions
        submit: "Submit Order",
        confirmOrder: "Review Your Order",
        confirmSubmit: "Confirm Order",
        goBack: "Go Back",
        cancel: "Cancel",
        apply: "Apply Crop",
        cropImage: "Crop Your Image",
        
        // FAQ System
        faqButton: "❓ FAQ",
        faqTitle: "Frequently Asked Questions",
        backToForm: "Back to Form",
        
        // FAQ Content
        shippingTitle: "🚚 Shipping",
        deliveryTime: "Delivery Time:",
        usDelivery: "US: 5–10 business days",
        intlDelivery: "International: 7–15 business days",
        orderTracking: "Order Tracking: Sent via email automatically after purchase",
        securePackaging: "Secure Packaging: Shock-resistant, moisture-proof, and gift-ready",
        
        paymentTitle: "💳 Payment",
        acceptedMethods: "Accepted Methods:",
        creditCards: "Credit / Debit Cards",
        paypal: "PayPal",
        applePay: "Apple Pay",
        secureCheckout: "Secure Checkout: All payments are encrypted and processed safely",
        fastEasy: "Fast & Easy: No account needed — just a few quick steps",
        
        howItWorksTitle: "🧑‍🎨 How It Works",
        noLivePreview: "This canvas doesn't support live previews — but don't worry!",
        designerEnhance: "✅ Our designers will enhance your photo to look its very best.",
        completeDetails: "📝 Once you've completed the canvas details,",
        emailPreview: "📩 You'll receive a preview via email within 1–2 business days.",
        requestEdits: "🖼️ You can request edits until you're completely satisfied.",
        finalizeOrder: "✅ Finalize your order and we'll take care of the rest.",
        
        // Thank You Page
        thankYouTitle: "Thank You!",
        thankYouMessage: "Your order has been received successfully. We'll send your canvas preview to your email and Messenger within 2-3 business days.",
        newOrder: "Place Another Order",
        
        // Validation Messages
        fbNameRequired: "Facebook name is required",
        fbNameTooShort: "Facebook name must be at least 2 characters",
        emailRequired: "Email is required",
        emailInvalid: "Please enter a valid email address",
        sizeRequired: "Please select a canvas size",
        imagesRequired: "Please upload at least 1 image",
        allFieldsRequired: "Please fill in all required customer information",
        canvasIncomplete: "Please complete all canvas requirements (size and at least 1 image)",
        maxImagesError: "Maximum 6 images allowed per canvas",
        
        // Discount Messages
        discountText3: "Great! You get 5% OFF for ordering 3+ canvas!",
        discountText5: "Amazing! You get 12% OFF for ordering 5+ canvas!",
        
        // Status Messages
        submitting: "Submitting...",
        submitError: "There was an error submitting your order. Please try again."
    },
    
    vi: {
        // Promotional Banner
        promoText: "🎁 Ưu Đãi Đặc Biệt: Đặt 3+ canvas và nhận 5% GIẢM GIÁ! Đặt 5+ canvas và nhận 12% GIẢM GIÁ! 🎁",
        
        // Canvas Type Selection
        canvasType: "Chọn Loại Canvas",
        singleCanvas: "Canvas Đơn",
        multiCanvas: "Nhiều Canvas Khác Nhau",
        collageCanvas: "Ghép Nhiều Ảnh",
        
        // Canvas Configuration
        selectQuantity: "Bạn muốn bao nhiêu canvas khác nhau?",
        selectSize: "Chọn Kích Thước *",
        bestSeller: "Bán Chạy Nhất",
        twoPersonLabel: "2 người trên 1 canvas (+$10)",
        
        // Upload Section
        uploadImages: "Tải Ảnh Lên *",
        uploadText: "Nhấp để tải ảnh lên (Tối đa 6)",
        uploadSubtext: "Hỗ trợ JPG, PNG - Sẽ được cắt theo tỷ lệ 8:10",
        
        // Form Fields
        customText: "Nhập văn bản của bạn",
        customTextPlaceholder: "ví dụ: Mãi Mãi Bên Nhau",
        date: "Ngày Tháng",
        datePlaceholder: "ví dụ: 25 Tháng 12, 2024",
        welcomeHome: "Chào Mừng Về Nhà",
        notes: "Ghi Chú Thêm",
        notesPlaceholder: "Hướng dẫn đặc biệt...",
        
        // Customer Information
        customerInfo: "Thông Tin Khách Hàng",
        fbName: "Tên Facebook của bạn *",
        fbNamePlaceholder: "Nhập tên Facebook của bạn",
        email: "Email *",
        emailPlaceholder: "email@cua-ban.com",
        
        // Preview & Pricing
        preview: "Xem Trước Canvas",
        previewNotice: "Đây chỉ là bản xem trước cho văn bản tùy chỉnh của bạn. Bản xem trước canvas cuối cùng sẽ được gửi đến email và Messenger của bạn.",
        estimatedTotal: "Tổng Ước Tính",
        
        // Buttons & Actions
        submit: "Gửi Đơn Hàng",
        confirmOrder: "Xem Lại Đơn Hàng",
        confirmSubmit: "Xác Nhận Đơn Hàng",
        goBack: "Quay Lại",
        cancel: "Hủy",
        apply: "Áp Dụng Cắt",
        cropImage: "Cắt Ảnh Của Bạn",
        
        // FAQ System
        faqButton: "❓ FAQ",
        faqTitle: "Câu Hỏi Thường Gặp",
        backToForm: "Quay Lại Form",
        
        // FAQ Content
        shippingTitle: "🚚 Vận Chuyển",
        deliveryTime: "Thời Gian Giao Hàng:",
        usDelivery: "Mỹ: 5–10 ngày làm việc",
        intlDelivery: "Quốc tế: 7–15 ngày làm việc",
        orderTracking: "Theo Dõi Đơn Hàng: Tự động gửi qua email sau khi mua",
        securePackaging: "Đóng Gói An Toàn: Chống sốc, chống ẩm và sẵn sàng làm quà",
        
        paymentTitle: "💳 Thanh Toán",
        acceptedMethods: "Phương Thức Chấp Nhận:",
        creditCards: "Thẻ Tín Dụng / Ghi Nợ",
        paypal: "PayPal",
        applePay: "Apple Pay",
        secureCheckout: "Thanh Toán An Toàn: Tất cả thanh toán được mã hóa và xử lý an toàn",
        fastEasy: "Nhanh & Dễ: Không cần tài khoản — chỉ vài bước đơn giản",
        
        howItWorksTitle: "🧑‍🎨 Cách Hoạt Động",
        noLivePreview: "Canvas này không hỗ trợ xem trước trực tiếp — nhưng đừng lo!",
        designerEnhance: "✅ Các nhà thiết kế của chúng tôi sẽ nâng cao ảnh của bạn để trông đẹp nhất.",
        completeDetails: "📝 Sau khi bạn hoàn thành chi tiết canvas,",
        emailPreview: "📩 Bạn sẽ nhận được bản xem trước qua email trong vòng 1–2 ngày làm việc.",
        requestEdits: "🖼️ Bạn có thể yêu cầu chỉnh sửa cho đến khi hoàn toàn hài lòng.",
        finalizeOrder: "✅ Hoàn thiện đơn hàng và chúng tôi sẽ lo phần còn lại.",
        
        // Thank You Page
        thankYouTitle: "Cảm Ơn Bạn!",
        thankYouMessage: "Đơn hàng của bạn đã được nhận thành công. Chúng tôi sẽ gửi bản xem trước canvas đến email và Messenger của bạn trong vòng 2-3 ngày làm việc.",
        newOrder: "Đặt Đơn Hàng Khác",
        
        // Validation Messages
        fbNameRequired: "Tên Facebook là bắt buộc",
        fbNameTooShort: "Tên Facebook phải có ít nhất 2 ký tự",
        emailRequired: "Email là bắt buộc",
        emailInvalid: "Vui lòng nhập địa chỉ email hợp lệ",
        sizeRequired: "Vui lòng chọn kích thước canvas",
        imagesRequired: "Vui lòng tải lên ít nhất 1 ảnh",
        allFieldsRequired: "Vui lòng điền tất cả thông tin khách hàng bắt buộc",
        canvasIncomplete: "Vui lòng hoàn thành tất cả yêu cầu canvas (kích thước và ít nhất 1 ảnh)",
        maxImagesError: "Tối đa 6 ảnh cho mỗi canvas",
        
        // Discount Messages
        discountText3: "Tuyệt vời! Bạn được giảm 5% khi đặt 3+ canvas!",
        discountText5: "Tuyệt vời! Bạn được giảm 12% khi đặt 5+ canvas!",
        
        // Status Messages
        submitting: "Đang gửi...",
        submitError: "Có lỗi khi gửi đơn hàng của bạn. Vui lòng thử lại."
    }
};

// Language Detection and Initialization
function initializeLanguage() {
    // Check URL parameter first
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang') || urlParams.get('language');
    
    if (urlLang && translations[urlLang]) {
        currentLanguage = urlLang;
    } else {
        // Check localStorage
        const savedLang = localStorage.getItem('preferredLanguage');
        if (savedLang && translations[savedLang]) {
            currentLanguage = savedLang;
        } else {
            // Detect from browser
            const browserLang = navigator.language || navigator.userLanguage;
            const langCode = browserLang.split('-')[0];
            
            if (langCode === 'vi') {
                currentLanguage = 'vi';
            } else {
                currentLanguage = defaultLanguage;
            }
        }
    }
    
    // Apply translations
    translatePage();
    
    // Save preference
    localStorage.setItem('preferredLanguage', currentLanguage);
}

// Main Translation Function
function translatePage() {
    // Translate text content
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        const translation = getTranslation(key);
        
        if (translation) {
            if (element.tagName === 'INPUT' && (element.type === 'submit' || element.type === 'button')) {
                element.value = translation;
            } else {
                element.textContent = translation;
            }
        }
    });
    
    // Translate placeholders
    document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        const translation = getTranslation(key);
        
        if (translation) {
            element.placeholder = translation;
        }
    });
}

// Get Translation with Fallback
function getTranslation(key) {
    // Try current language
    if (translations[currentLanguage] && translations[currentLanguage][key]) {
        return translations[currentLanguage][key];
    }
    
    // Fallback to English
    if (translations[defaultLanguage] && translations[defaultLanguage][key]) {
        return translations[defaultLanguage][key];
    }
    
    // Return key if no translation found
    console.warn(`Translation not found for key: ${key}`);
    return key;
}

// Translation Function for JavaScript
function t(key, params = {}) {
    let translation = getTranslation(key);
    
    // Handle parameter replacement
    Object.keys(params).forEach(param => {
        const placeholder = `{${param}}`;
        translation = translation.replace(new RegExp(placeholder, 'g'), params[param]);
    });
    
    return translation;
}

// Change Language Function
function changeLanguage(langCode) {
    if (translations[langCode]) {
        currentLanguage = langCode;
        translatePage();
        localStorage.setItem('preferredLanguage', langCode);
        
        // Update URL parameter
        const url = new URL(window.location);
        url.searchParams.set('lang', langCode);
        window.history.replaceState({}, '', url);
        
        // Dispatch event for other components
        document.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { language: langCode } 
        }));
    }
}

// Helper Functions for Integration with script.js
function updateDiscountNotification(quantity) {
    const notification = document.getElementById('discountNotification');
    if (!notification) return;
    
    const textElement = notification.querySelector('.discount-text');
    if (!textElement) return;
    
    if (quantity >= 5) {
        textElement.textContent = t('discountText5');
        notification.style.display = 'block';
    } else if (quantity >= 3) {
        textElement.textContent = t('discountText3');
        notification.style.display = 'block';
    } else {
        notification.style.display = 'none';
    }
}

function showValidationError(elementId, messageKey) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = t(messageKey);
        errorElement.classList.add('show');
    }
}

function hideValidationError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.classList.remove('show');
    }
}

// Format Currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD' 
    }).format(amount);
}

// Get Current Language
function getCurrentLanguage() {
    return currentLanguage;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeLanguage();
    
    // Watch for dynamic content changes
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Translate newly added elements
                        const elementsToTranslate = node.querySelectorAll('[data-translate]');
                        elementsToTranslate.forEach(element => {
                            const key = element.getAttribute('data-translate');
                            const translation = getTranslation(key);
                            if (translation) {
                                element.textContent = translation;
                            }
                        });
                        
                        // Translate placeholders in new elements
                        const placeholderElements = node.querySelectorAll('[data-translate-placeholder]');
                        placeholderElements.forEach(element => {
                            const key = element.getAttribute('data-translate-placeholder');
                            const translation = getTranslation(key);
                            if (translation) {
                                element.placeholder = translation;
                            }
                        });
                    }
                });
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

// Export functions for global use
window.translations = {
    t,
    changeLanguage,
    getCurrentLanguage,
    updateDiscountNotification,
    showValidationError,
    hideValidationError,
    formatCurrency,
    translatePage
};
