const cloudinary = require('../config/cloudinary');
const fs = require('fs');

class CloudinaryService {
  /**
   * Upload file to Cloudinary
   * @param {string} filePath - Local file path
   * @param {string} folder - Cloudinary folder name
   * @returns {Promise<{url: string, publicId: string}>}
   */
  static async uploadFile(filePath, folder = 'library-management') {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: folder,
        resource_type: 'auto',
        transformation: [
          { quality: 'auto', fetch_format: 'auto' }, // Auto optimize
        ],
      });

      // Delete local file after successful upload
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      // Delete local file if upload fails
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
  }

  /**
   * Delete file from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<boolean>}
   */
  static async deleteFile(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error(`Cloudinary delete failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Delete multiple files from Cloudinary
   * @param {string[]} publicIds - Array of Cloudinary public IDs
   * @returns {Promise<boolean>}
   */
  static async deleteFiles(publicIds) {
    try {
      const promises = publicIds.map((id) => this.deleteFile(id));
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error(`Cloudinary batch delete failed: ${error.message}`);
      return false;
    }
  }
}

module.exports = CloudinaryService;
