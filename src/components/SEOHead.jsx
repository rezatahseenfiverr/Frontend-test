import { Helmet } from "react-helmet-async";

const SITE_NAME = "Barvella";
const DEFAULT_DESCRIPTION = "Shop the latest trends with unbeatable prices. Quality products delivered to your doorstep in Bangladesh.";
const DEFAULT_KEYWORDS = "Barvella, online shopping, Bangladesh, ecommerce, fashion, electronics, home decor";
const DEFAULT_IMAGE = "/Barvella.png";
const BASE_URL = import.meta.env.VITE_SITE_URL || "http://localhost:5173";

const SEOHead = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  image = DEFAULT_IMAGE,
  url,
  type = "website",
  product,
  noindex = false,
}) => {
  // If a product object is passed, extract SEO from it
  const seo = product?.seo || {};
  const finalTitle = seo.metaTitle || title || SITE_NAME;
  const finalDescription = seo.metaDescription || description;
  const finalKeywords = seo.metaKeywords || keywords;
  const finalImage = seo.ogImage || product?.mainImage || image;
  const fullTitle = finalTitle.includes(SITE_NAME) ? finalTitle : `${finalTitle} | ${SITE_NAME}`;
  const fullUrl = url ? `${BASE_URL}${url}` : BASE_URL;

  // Structured data for products
  const productSchema = product ? {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: finalDescription,
    image: product.mainImage || finalImage,
    sku: product._id,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: {
      "@type": "Offer",
      price: product.discountPrice || product.mainPrice,
      priceCurrency: "BDT",
      availability: "https://schema.org/InStock",
    },
    aggregateRating: product.averageRating ? {
      "@type": "AggregateRating",
      ratingValue: product.averageRating,
      reviewCount: product.totalReviews || 0,
    } : undefined,
  } : null;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />

      {/* Structured Data */}
      {productSchema && (
        <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
      )}
    </Helmet>
  );
};

export default SEOHead;
