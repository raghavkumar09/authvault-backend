const cloudinary = require('../config/cloudinary.config');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

// Check if Cloudinary is configured
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

/**
 * Upload a local file to Cloudinary or fallback to local storage
 * @param {string} localFilePath - Path to the local file
 * @param {string} folder - Folder name (Cloudinary folder or local subfolder in uploads)
 * @returns {Promise<object|null>} - Response object containing secure_url or null
 */
const uploadOnCloudinary = async (localFilePath, folder = 'profile_pictures') => {
  try {
    if (!localFilePath) return null;

    if (isCloudinaryConfigured) {
      // Upload file to cloudinary
      const response = await cloudinary.uploader.upload(localFilePath, {
        folder: folder,
        resource_type: 'auto',
      });

      logger.info(`File uploaded to Cloudinary: ${response.url}`);
      
      // Remove temporary local file
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
      
      return response;
    } else {
      // Fallback to local storage
      logger.info('Cloudinary not configured, falling back to local storage');
      
      const fileName = path.basename(localFilePath);
      const destinationDir = path.join(process.cwd(), 'uploads', folder);
      
      // Ensure the destination folder exists
      if (!fs.existsSync(destinationDir)) {
        fs.mkdirSync(destinationDir, { recursive: true });
      }
      
      const destinationPath = path.join(destinationDir, fileName);
      
      // Move file from temporary location to permanent local storage
      fs.copyFileSync(localFilePath, destinationPath);
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
      
      logger.info(`File stored locally: ${destinationPath}`);
      
      // Return a response that mimics Cloudinary response for the service to handle
      return {
        secure_url: fileName, // The service will prepend server URL if it's just a filename
        public_id: fileName,
        resource_type: 'image',
        local: true
      };
    }
  } catch (error) {
    logger.error(`Upload error: ${error.message}`);
    
    // Remove the locally saved temporary file as the upload operation failed
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    
    return null;
  }
};

/**
 * Delete a file from Cloudinary or local storage
 * @param {string} publicIdOrPath - Cloudinary public ID or local filename
 * @param {string} folder - Local subfolder name if deleting locally
 * @returns {Promise<object|null>} - Response or null
 */
const deleteFromCloudinary = async (publicIdOrPath, folder = 'avatars') => {
  try {
    if (!publicIdOrPath) return null;

    if (isCloudinaryConfigured && publicIdOrPath.includes('/')) {
        // Likely a Cloudinary public ID if it contains folder path or if we are sure
        // Actually, public IDs often don't have slashes unless folders are specified
        // A better check might be if it's a URL or if we know we are in Cloudinary mode
        const response = await cloudinary.uploader.destroy(publicIdOrPath);
        return response;
    } else {
        // Fallback or explicit local delete
        const localPath = path.join(process.cwd(), 'uploads', folder, publicIdOrPath);
        if (fs.existsSync(localPath)) {
            fs.unlinkSync(localPath);
            logger.info(`Local file deleted: ${localPath}`);
            return { result: 'ok', local: true };
        }
        return null;
    }
  } catch (error) {
    logger.error(`Delete error: ${error.message}`);
    return null;
  }
};

module.exports = {
  uploadOnCloudinary,
  deleteFromCloudinary,
};
