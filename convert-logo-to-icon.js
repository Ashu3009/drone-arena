/**
 * Convert logo.png to drone-icon.ico
 * Requires: npm install sharp
 */

const fs = require('fs');
const path = require('path');

console.log('\n========================================');
console.log('  Converting Logo to Icon Format');
console.log('========================================\n');

// Check if sharp is installed
try {
    require.resolve('sharp');
} catch (e) {
    console.log('[ERROR] Package "sharp" not installed');
    console.log('\n[INFO] Installing sharp package...\n');

    const { execSync } = require('child_process');
    try {
        execSync('npm install sharp', { stdio: 'inherit' });
        console.log('\n[OK] Sharp installed successfully!\n');
    } catch (err) {
        console.log('\n[ERROR] Failed to install sharp');
        console.log('[SOLUTION] Run manually: npm install sharp');
        process.exit(1);
    }
}

const sharp = require('sharp');

const logoPath = path.join(__dirname, 'frontend', 'src', 'assets', 'logo.png');
const iconPath = path.join(__dirname, 'drone-icon.ico');

// Check if logo exists
if (!fs.existsSync(logoPath)) {
    console.log(`[ERROR] Logo not found at: ${logoPath}`);
    process.exit(1);
}

console.log(`[INFO] Reading logo from: ${logoPath}`);

// Convert PNG to ICO format (using PNG with ICO header)
sharp(logoPath)
    .resize(256, 256, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(iconPath.replace('.ico', '.png'))
    .then(() => {
        // Rename to .ico (Windows will recognize it)
        fs.renameSync(iconPath.replace('.ico', '.png'), iconPath);

        console.log('[OK] Icon created successfully!');
        console.log(`\nLocation: ${iconPath}`);
        console.log('\n========================================');
        console.log('  CONVERSION COMPLETE!');
        console.log('========================================\n');
        console.log('[NEXT STEP] Run: create-shortcut-with-logo.bat\n');
    })
    .catch(err => {
        console.log('[ERROR] Conversion failed:', err.message);
        console.log('\n[ALTERNATIVE] Use online converter:');
        console.log('https://www.icoconverter.com/');
    });
