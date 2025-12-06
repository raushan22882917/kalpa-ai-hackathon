import { ColorTheme, GeneratedImage } from '../types/projectGenerator';
import promptTemplates from './promptTemplates';

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Service for generating AI-powered images for projects
 * Integrates with OpenAI DALL-E for image generation
 */
class ImageGeneratorService {
  private apiKey: string | undefined;
  private apiEndpoint: string;

  constructor() {
    // Access environment variable safely
    try {
      this.apiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY;
    } catch {
      this.apiKey = undefined;
    }
    this.apiEndpoint = 'https://api.openai.com/v1/images/generations';
  }

  /**
   * Generate a logo for the project
   * @param projectName - Name of the project
   * @param description - Project description
   * @param theme - Selected color theme
   * @returns Generated logo image
   */
  async generateLogo(
    projectName: string,
    description: string,
    theme: ColorTheme
  ): Promise<GeneratedImage> {
    const prompt = this.createLogoPrompt(projectName, description, theme);
    
    const imageUrl = await this.generateImage(prompt);
    const dataUrl = await this.convertToDataUrl(imageUrl);

    return {
      id: generateUUID(),
      type: 'logo',
      url: imageUrl,
      dataUrl,
      width: 512,
      height: 512,
      format: 'png',
      prompt,
    };
  }

  /**
   * Generate a hero image for the project
   * @param projectName - Name of the project
   * @param description - Project description
   * @param theme - Selected color theme
   * @returns Generated hero image
   */
  async generateHeroImage(
    projectName: string,
    description: string,
    theme: ColorTheme
  ): Promise<GeneratedImage> {
    const prompt = this.createHeroPrompt(projectName, description, theme);
    
    const imageUrl = await this.generateImage(prompt, '1792x1024');
    const dataUrl = await this.convertToDataUrl(imageUrl);

    return {
      id: generateUUID(),
      type: 'hero',
      url: imageUrl,
      dataUrl,
      width: 1792,
      height: 1024,
      format: 'png',
      prompt,
    };
  }

  /**
   * Generate an icon set for the project
   * @param projectName - Name of the project
   * @param theme - Selected color theme
   * @returns Array of generated icon images
   */
  async generateIcons(
    projectName: string,
    theme: ColorTheme
  ): Promise<GeneratedImage[]> {
    const iconSizes = [
      { width: 192, height: 192, size: '1024x1024' },
      { width: 512, height: 512, size: '1024x1024' },
    ];

    const prompt = this.createIconPrompt(projectName, theme);
    
    const icons: GeneratedImage[] = [];
    
    for (const iconSize of iconSizes) {
      const imageUrl = await this.generateImage(prompt, iconSize.size as '1024x1024');
      const dataUrl = await this.convertToDataUrl(imageUrl);

      icons.push({
        id: generateUUID(),
        type: 'icon',
        url: imageUrl,
        dataUrl,
        width: iconSize.width,
        height: iconSize.height,
        format: 'png',
        prompt,
      });
    }

    return icons;
  }

  /**
   * Save an image to the project files
   * @param image - Generated image to save
   * @param projectPath - Path to the project directory
   * @returns Path where the image was saved
   */
  async saveImage(image: GeneratedImage, projectPath: string): Promise<string> {
    const fileName = `${image.type}-${image.id}.${image.format}`;
    const imagePath = `${projectPath}/public/images/${fileName}`;

    // Convert data URL to blob for future use
    await this.dataUrlToBlob(image.dataUrl);
    
    // In a browser environment, we would use the File System Access API
    // For now, we'll return the path where it should be saved
    // The actual file writing would be handled by the file system service
    
    return imagePath;
  }

  /**
   * Create a prompt for logo generation
   */
  private createLogoPrompt(
    projectName: string,
    description: string,
    theme: ColorTheme
  ): string {
    return promptTemplates.generateImagePrompt({
      projectName,
      description,
      theme,
      imageType: 'logo',
    });
  }

  /**
   * Create a prompt for hero image generation
   */
  private createHeroPrompt(
    projectName: string,
    description: string,
    theme: ColorTheme
  ): string {
    return promptTemplates.generateImagePrompt({
      projectName,
      description,
      theme,
      imageType: 'hero',
    });
  }

  /**
   * Create a prompt for icon generation
   */
  private createIconPrompt(projectName: string, theme: ColorTheme): string {
    return promptTemplates.generateImagePrompt({
      projectName,
      description: '',
      theme,
      imageType: 'icon',
    });
  }

  /**
   * Generate an image using OpenAI DALL-E API
   */
  private async generateImage(
    prompt: string,
    size: '1024x1024' | '1792x1024' | '1024x1792' = '1024x1024'
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size,
        quality: 'standard',
        response_format: 'url',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Image generation failed: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.data[0].url;
  }

  /**
   * Convert image URL to base64 data URL
   */
  private async convertToDataUrl(imageUrl: string): Promise<string> {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Convert data URL to Blob
   */
  private async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl);
    return response.blob();
  }

  /**
   * Optimize image (resize and compress)
   * @param image - Image to optimize
   * @param maxWidth - Maximum width
   * @param maxHeight - Maximum height
   * @param quality - JPEG quality (0-1)
   * @returns Optimized image data URL
   */
  async optimizeImage(
    image: GeneratedImage,
    maxWidth: number,
    maxHeight: number,
    quality: number = 0.9
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to desired format
        const format = image.format === 'jpg' ? 'image/jpeg' : 'image/png';
        const optimizedDataUrl = canvas.toDataURL(format, quality);
        resolve(optimizedDataUrl);
      };
      img.onerror = reject;
      img.src = image.dataUrl;
    });
  }

  /**
   * Convert image format
   * @param image - Image to convert
   * @param targetFormat - Target format
   * @returns Converted image data URL
   */
  async convertFormat(
    image: GeneratedImage,
    targetFormat: 'png' | 'jpg'
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // For JPG, fill with white background (JPG doesn't support transparency)
        if (targetFormat === 'jpg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);
        
        const mimeType = targetFormat === 'jpg' ? 'image/jpeg' : 'image/png';
        const convertedDataUrl = canvas.toDataURL(mimeType, 0.95);
        resolve(convertedDataUrl);
      };
      img.onerror = reject;
      img.src = image.dataUrl;
    });
  }
}

export default new ImageGeneratorService();
