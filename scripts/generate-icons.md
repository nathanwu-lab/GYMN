# Generate PWA Icons

To generate the required PWA icons (192x192 and 512x512 PNG files), you can:

1. Use an online tool like https://realfavicongenerator.net/ or https://www.pwabuilder.com/imageGenerator
2. Use ImageMagick if installed: `convert pwa-icon.svg -resize 192x192 pwa-192x192.png`
3. Use any image editor to create icons with "G" or your logo

Place the generated files in the `public` folder:
- `pwa-192x192.png`
- `pwa-512x512.png`
- `apple-touch-icon.png` (180x180)
