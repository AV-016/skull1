import { prisma } from './config/database';
import { generateToken } from './utils/generateToken';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

async function testUpload() {
  const user = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });
  
  if (!user) {
    console.error("No admin user found in database!");
    return;
  }
  
  console.log("Found admin user:", user.email);
  
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role
  });
  
  // Create a valid 1x1 pixel transparent PNG file to upload
  const tempFilePath = path.join(__dirname, '../temp-test.png');
  const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  fs.writeFileSync(tempFilePath, Buffer.from(base64Png, 'base64'));
  
  console.log("Uploading test file to http://localhost:5000/api/upload/product-image...");
  
  const form = new FormData();
  form.append('file', fs.createReadStream(tempFilePath));
  
  try {
    const response = await axios.post('http://localhost:5000/api/upload/product-image', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log("Upload Response Status:", response.status);
    console.log("Upload Response Data:", JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error("Upload failed!");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error(error.message);
    }
  } finally {
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
}

testUpload()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
