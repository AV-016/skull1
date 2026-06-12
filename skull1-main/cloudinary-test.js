const { v2: cloudinary } = require('cloudinary');

// 1. Configure Cloudinary
cloudinary.config({
  cloud_name: 'dxbqqlzmz',
  api_key: '867364395796827',
  api_secret: 'gMnE-5Yf31yQESwP2MIXf7MOQOQ'
});

async function run() {
  try {
    console.log("Uploading sample image to Cloudinary...");
    
    // 2. Upload an image
    const uploadResult = await cloudinary.uploader.upload('https://res.cloudinary.com/demo/image/upload/sample.jpg', {
      folder: 'onboarding_test'
    });
    
    console.log("Secure URL: " + uploadResult.secure_url);
    console.log("Public ID: " + uploadResult.public_id);
    
    // 3. Get image details
    console.log("Image details:");
    console.log("Width: " + uploadResult.width + "px");
    console.log("Height: " + uploadResult.height + "px");
    console.log("Format: " + uploadResult.format);
    console.log("File Size: " + uploadResult.bytes + " bytes");
    
    // 4. Transform the image
    // f_auto (fetch_format: 'auto') enables automatic format selection (delivers WebP/AVIF dynamically to supported browsers to save space)
    // q_auto (quality: 'auto') enables automatic quality compression (reduces file size dynamically without any visible drop in quality)
    const transformedUrl = cloudinary.url(uploadResult.public_id, {
      fetch_format: 'auto',
      quality: 'auto',
      secure: true
    });
    
    console.log("Done! Click link below to see optimized version of the image. Check the size and the format.");
    console.log(transformedUrl);
    
  } catch (error) {
    console.error("Error executing Cloudinary operations:", error);
  }
}

run();
