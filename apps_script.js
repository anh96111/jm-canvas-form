// Google Apps Script - Code.gs
// Deploy as Web App with permissions to access Google Drive

// Main folder ID from env.txt
const MAIN_FOLDER_ID = '1j0Ej7n-LuJClyVtnOLz1-UoLkqJPOjkZ';

// Configuration
const CONFIG = {
  MAX_IMAGE_SIZE: 1200, // Max width/height in pixels
  JPEG_QUALITY: 0.85,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // milliseconds
  BATCH_SIZE: 3 // Process images in batches to avoid timeout
};

// Handle POST request
function doPost(e) {
  try {
    // Parse incoming data
    const data = JSON.parse(e.postData.contents);
    
    // Log incoming request
    console.log('Processing order:', data.order_id);
    
    // Create order folder with retry
    const orderFolderName = `Order_${data.order_id}_${sanitizeFolderName(data.customer_info.fb_name)}`;
    const orderFolder = createFolderWithRetry(MAIN_FOLDER_ID, orderFolderName);
    
    // Array to store all uploaded image links
    const allImageLinks = [];
    const processingErrors = [];
    
    // Process each canvas
    for (let i = 0; i < data.canvases.length; i++) {
      const canvas = data.canvases[i];
      
      try {
        // Create canvas folder
        const canvasFolderName = `Canvas_${canvas.canvas_id}`;
        const canvasFolder = createFolderWithRetry(orderFolder.getId(), canvasFolderName);
        
        // Upload images for this canvas with progress tracking
        const canvasImageLinks = [];
        const imageCount = canvas.images.length;
        
        // Process images in batches
        for (let batch = 0; batch < Math.ceil(imageCount / CONFIG.BATCH_SIZE); batch++) {
          const startIdx = batch * CONFIG.BATCH_SIZE;
          const endIdx = Math.min(startIdx + CONFIG.BATCH_SIZE, imageCount);
          
          for (let j = startIdx; j < endIdx; j++) {
            try {
              const base64Image = canvas.images[j];
              const imageName = `image_${j + 1}.jpg`;
              
              // Process image with compression and retry
              const imageLink = processAndUploadImage(
                base64Image, 
                imageName, 
                canvasFolder
              );
              
              if (imageLink) {
                canvasImageLinks.push(imageLink);
                allImageLinks.push(imageLink);
              }
              
            } catch (uploadError) {
              console.error(`Failed to upload image ${j + 1} for canvas ${canvas.canvas_id}:`, uploadError);
              processingErrors.push({
                canvas_id: canvas.canvas_id,
                image_index: j + 1,
                error: uploadError.toString()
              });
            }
          }
          
          // Small delay between batches
          Utilities.sleep(100);
        }
        
        // Create canvas_info.json
        const canvasInfo = {
          canvas_id: canvas.canvas_id,
          canvas_type: canvas.canvas_type,
          size: canvas.size,
          value: canvas.value,
          custom_text: canvas.custom_text || '',
          date: canvas.date || '',
          welcome_home: canvas.welcome_home || false,
          image_count: canvas.images.length,
          uploaded_count: canvasImageLinks.length,
          image_links: canvasImageLinks,
          processing_errors: processingErrors.filter(e => e.canvas_id === canvas.canvas_id),
          created_at: new Date().toISOString()
        };
        
        // Save canvas_info.json
        const jsonBlob = Utilities.newBlob(
          JSON.stringify(canvasInfo, null, 2), 
          'application/json', 
          'canvas_info.json'
        );
        canvasFolder.createFile(jsonBlob);
        
      } catch (canvasError) {
        console.error(`Failed to process canvas ${canvas.canvas_id}:`, canvasError);
        processingErrors.push({
          canvas_id: canvas.canvas_id,
          error: canvasError.toString()
        });
      }
    }
    
    // Create order_summary.json in main order folder
    const orderSummary = {
      order_id: data.order_id,
      customer_info: data.customer_info,
      canvas_count: data.canvases.length,
      total_images: allImageLinks.length,
      notes: data.notes || '',
      folder_link: orderFolder.getUrl(),
      processing_errors: processingErrors,
      created_at: new Date().toISOString(),
      status: processingErrors.length > 0 ? 'partial_upload' : 'uploaded'
    };
    
    const orderSummaryBlob = Utilities.newBlob(
      JSON.stringify(orderSummary, null, 2), 
      'application/json', 
      'order_summary.json'
    );
    orderFolder.createFile(orderSummaryBlob);
    
    // Log to spreadsheet with error handling
    try {
      logToSpreadsheet(data, orderFolder.getUrl(), allImageLinks, processingErrors);
    } catch (logError) {
      console.error('Failed to log to spreadsheet:', logError);
    }
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        order_id: data.order_id,
        folder_url: orderFolder.getUrl(),
        photo_links: allImageLinks,
        upload_count: allImageLinks.length,
        error_count: processingErrors.length,
        errors: processingErrors,
        message: processingErrors.length > 0 
          ? 'Order uploaded with some errors' 
          : 'Order uploaded successfully'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return error response
    console.error('Error processing order:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        message: 'Failed to process order',
        details: error.stack
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Process and upload image with compression
function processAndUploadImage(base64Image, imageName, folder) {
  let retries = 0;
  
  while (retries < CONFIG.MAX_RETRIES) {
    try {
      // Decode and potentially compress image
      const imageData = compressImageIfNeeded(base64Image);
      
      // Convert to blob
      const imageBlob = Utilities.newBlob(
        Utilities.base64Decode(imageData), 
        'image/jpeg', 
        imageName
      );
      
      // Upload file
      const imageFile = folder.createFile(imageBlob);
      imageFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      return imageFile.getUrl();
      
    } catch (error) {
      retries++;
      console.error(`Upload attempt ${retries} failed for ${imageName}:`, error);
      
      if (retries < CONFIG.MAX_RETRIES) {
        // Exponential backoff
        Utilities.sleep(CONFIG.RETRY_DELAY * Math.pow(2, retries - 1));
      } else {
        throw error;
      }
    }
  }
}

// Compress image if needed (simplified version for Apps Script)
function compressImageIfNeeded(base64Image) {
  try {
    // Remove data URL prefix if present
    const base64Data = base64Image.replace(/^data:image\/(png|jpg|jpeg);base64,/, '');
    
    // Trả về ảnh gốc mà không thực hiện nén
    return base64Data;
    
  } catch (error) {
    console.error('Error in image processing:', error);
    return base64Image.replace(/^data:image\/(png|jpg|jpeg);base64,/, '');
  }
}

// Create folder with retry mechanism
function createFolderWithRetry(parentId, folderName, maxRetries) {
  maxRetries = maxRetries || CONFIG.MAX_RETRIES;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return createFolder(parentId, folderName);
    } catch (error) {
      retries++;
      console.error(`Folder creation attempt ${retries} failed:`, error);
      
      if (retries < maxRetries) {
        Utilities.sleep(CONFIG.RETRY_DELAY * retries);
      } else {
        throw error;
      }
    }
  }
}

// Create folder helper function
function createFolder(parentId, folderName) {
  try {
    const parentFolder = DriveApp.getFolderById(parentId);
    
    // Check if folder already exists
    const folders = parentFolder.getFoldersByName(folderName);
    if (folders.hasNext()) {
      return folders.next();
    }
    
    // Create new folder
    return parentFolder.createFolder(folderName);
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
}

// Sanitize folder name
function sanitizeFolderName(name) {
  // Remove special characters that might cause issues in folder names
  return name
    .replace(/[<>:"\/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50); // Limit length
}

// Enhanced logging to Google Sheets
function logToSpreadsheet(data, folderUrl, imageLinks, errors) {
  errors = errors || [];
  
  try {
    // Create or get spreadsheet
    const spreadsheetName = 'JM-Canvas Orders Log';
    let spreadsheet;
    
    const files = DriveApp.getFilesByName(spreadsheetName);
    if (files.hasNext()) {
      spreadsheet = SpreadsheetApp.open(files.next());
    } else {
      spreadsheet = SpreadsheetApp.create(spreadsheetName);
      // Add headers
      const sheet = spreadsheet.getActiveSheet();
      sheet.getRange(1, 1, 1, 12).setValues([[
        'Order ID',
        'Timestamp',
        'Customer Name',
        'Email',
        'Phone',
        'Canvas Count',
        'Total Images',
        'Uploaded Images',
        'Errors',
        'Folder URL',
        'Image Links',
        'Notes'
      ]]);
      
      // Format header row
      sheet.getRange(1, 1, 1, 12)
        .setBackground('#2c5f41')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
    }
    
    const sheet = spreadsheet.getActiveSheet();
    
    // Calculate total images
    let totalImages = 0;
    for (let i = 0; i < data.canvases.length; i++) {
      totalImages += data.canvases[i].images.length;
    }
    
    // Add order data
    sheet.appendRow([
      data.order_id,
      new Date(),
      data.customer_info.fb_name,
      data.customer_info.email,
      data.customer_info.phone || '',
      data.canvases.length,
      totalImages,
      imageLinks.length,
      errors.length,
      folderUrl,
      imageLinks.join('\n'),
      data.notes || ''
    ]);
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, 12);
    
  } catch (error) {
    console.error('Error logging to spreadsheet:', error);
    // Don't throw error - logging is optional
  }
}

// Test function for debugging
function testDoPost() {
  const testData = {
    order_id: "JM_TEST_001",
    customer_info: {
      fb_name: "Test User",
      email: "test@example.com",
      phone: "123456789"
    },
    canvases: [
      {
        canvas_id: 1,
        canvas_type: "single",
        size: "16x20",
        value: 62,
        images: ["base64_test_data_here"],
        custom_text: "Test Text",
        date: "2024",
        welcome_home: true
      }
    ],
    notes: "Test order"
  };
  
  const e = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  const result = doPost(e);
  console.log(result.getContent());
}

// Get folder structure for debugging
function getFolderStructure() {
  const mainFolder = DriveApp.getFolderById(MAIN_FOLDER_ID);
  const folders = mainFolder.getFolders();
  
  const structure = [];
  while (folders.hasNext()) {
    const folder = folders.next();
    const subFolders = [];
    const subFolderIterator = folder.getFolders();
    
    while (subFolderIterator.hasNext()) {
      const subFolder = subFolderIterator.next();
      subFolders.push({
        name: subFolder.getName(),
        url: subFolder.getUrl()
      });
    }
    
    structure.push({
      name: folder.getName(),
      url: folder.getUrl(),
      id: folder.getId(),
      subFolders: subFolders
    });
  }
  
  return structure;
}

// Clean up old test folders (optional utility)
function cleanupTestFolders() {
  const mainFolder = DriveApp.getFolderById(MAIN_FOLDER_ID);
  const folders = mainFolder.getFolders();
  
  while (folders.hasNext()) {
    const folder = folders.next();
    if (folder.getName().includes('TEST')) {
      folder.setTrashed(true);
    }
  }
}

// Get order details by order ID
function getOrderDetails(orderId) {
  const mainFolder = DriveApp.getFolderById(MAIN_FOLDER_ID);
  const folders = mainFolder.getFolders();
  
  while (folders.hasNext()) {
    const folder = folders.next();
    if (folder.getName().includes(orderId)) {
      const files = folder.getFilesByName('order_summary.json');
      if (files.hasNext()) {
        const file = files.next();
        const content = file.getBlob().getDataAsString();
        return JSON.parse(content);
      }
    }
  }
  
  return null;
}

// Update order status
function updateOrderStatus(orderId, newStatus) {
  const orderDetails = getOrderDetails(orderId);
  if (orderDetails) {
    orderDetails.status = newStatus;
    orderDetails.updated_at = new Date().toISOString();
    
    // Update the file
    const mainFolder = DriveApp.getFolderById(MAIN_FOLDER_ID);
    const folders = mainFolder.getFolders();
    
    while (folders.hasNext()) {
      const folder = folders.next();
      if (folder.getName().includes(orderId)) {
        const files = folder.getFilesByName('order_summary.json');
        if (files.hasNext()) {
          const file = files.next();
          file.setContent(JSON.stringify(orderDetails, null, 2));
          return true;
        }
      }
    }
  }
  
  return false;
}

// Batch process orders (for recovery)
function reprocessFailedOrders() {
  const mainFolder = DriveApp.getFolderById(MAIN_FOLDER_ID);
  const folders = mainFolder.getFolders();
  const failedOrders = [];
  
  while (folders.hasNext()) {
    const folder = folders.next();
    const files = folder.getFilesByName('order_summary.json');
    
    if (files.hasNext()) {
      const file = files.next();
      const content = JSON.parse(file.getBlob().getDataAsString());
      
      if (content.status === 'partial_upload' || (content.processing_errors && content.processing_errors.length > 0)) {
        failedOrders.push({
          order_id: content.order_id,
          folder_name: folder.getName(),
          errors: content.processing_errors
        });
      }
    }
  }
  
  return failedOrders;
}

// Health check endpoint
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      folder_id: MAIN_FOLDER_ID
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Utility function to get spreadsheet URL
function getSpreadsheetUrl() {
  const files = DriveApp.getFilesByName('JM-Canvas Orders Log');
  if (files.hasNext()) {
    return files.next().getUrl();
  }
  return null;
}

// Function to send email notification for failed uploads
function sendErrorNotification(orderId, errors) {
  try {
    const recipient = Session.getActiveUser().getEmail();
    const subject = `JM-Canvas Order ${orderId} - Upload Errors`;
    
    let body = `There were errors processing order ${orderId}:\n\n`;
    
    for (let i = 0; i < errors.length; i++) {
      body += `Canvas ${errors[i].canvas_id}: ${errors[i].error}\n`;
    }
    
    body += `\nPlease check the order folder and reprocess if needed.`;
    
    MailApp.sendEmail(recipient, subject, body);
  } catch (error) {
    console.error('Failed to send error notification:', error);
  }
}
