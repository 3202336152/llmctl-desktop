const sharp = require('sharp');
const path = require('path');

async function resizeIcon() {
  const inputPath = path.join(__dirname, 'assets', 'icon.png');
  const outputPath = path.join(__dirname, 'assets', 'icon-1024.png');

  try {
    await sharp(inputPath)
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputPath);

    console.log('✓ Icon resized to 1024x1024 successfully!');
    console.log(`  Output: ${outputPath}`);

    // 同时创建 512x512 版本
    const output512Path = path.join(__dirname, 'assets', 'icon-512.png');
    await sharp(inputPath)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(output512Path);

    console.log('✓ Icon resized to 512x512 successfully!');
    console.log(`  Output: ${output512Path}`);
  } catch (error) {
    console.error('Error resizing icon:', error);
    process.exit(1);
  }
}

resizeIcon();
