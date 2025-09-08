/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      // REQUIRED
      'firebasestorage.googleapis.com',
      // DEMO & PLACEHOLDERS
      'placekitten.com',
      'placehold.co',
      // MAJOR E-COMMERCE
      'm.media-amazon.com',
      'i.ebayimg.com',
      'cdn.shopify.com',
      'media.kohlsimg.com',
      'i5.walmartimages.com',
      'target.scene7.com',
      // FASHION & LUXURY
      'assets.vogue.com',
      'www.chanel.com',
      'www.dior.com',
      'media.gucci.com',
      'louisvuitton.com',
      'assets.prada.com',
      'www.hermes.com',
      'images.neimanmarcus.com',
      'saksfifthavenue.com',
      'images.bloomingdalesassets.com',
      // TECH & ELECTRONICS
      'store.storeimages.cdn-apple.com',
      'i.pcmag.com',
      'media.wired.com',
      'cdn.thewirecutter.com',
    ],
  },
};
module.exports = nextConfig;
