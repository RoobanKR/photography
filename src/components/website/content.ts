// Everything the public website says lives here, so the studio can edit it in one place.
// Photos are Indian-wedding stock images from Unsplash: swap them for the studio's own
// work (Cloudinary URLs work too). Keep the ?w= values as they are — the portfolio
// lightbox and the film strip resize by swapping the width in the URL.

const unsplash = (id: string, w = 1600) =>
  `https://images.unsplash.com/photo-${id}?q=80&w=${w}&auto=format&fit=crop`;

export const STUDIO = {
  name: "KR5",
  tagline: "Photography & Films",
  phone: "+91 88385 15246",
  whatsapp: "918838515246", // country code + number, no spaces
  email: "hello@kr5studio.com",
  location: "Available across India",
  instagram: "https://instagram.com/",
  youtube: "https://youtube.com/",
};

export const HERO_SLIDES = [
  { image: unsplash("1741201864879-c5e7f81c98b0", 2400), title: "Timeless", subtitle: "Where every glance becomes a memory" },
  { image: unsplash("1587271636175-90d58cdad458", 2400), title: "Candid", subtitle: "Weddings told the way they felt" },
  { image: unsplash("1630526720753-aa4e71acf67d", 2400), title: "Yours", subtitle: "Stories you will return to for a lifetime" },
];

export const STORIES = [
  { names: "Anu & Karthik", place: "Wedding · Madurai", image: unsplash("1764286954620-28029fbae9b6", 1000) },
  { names: "Divya & Rahul", place: "Pre-wedding · Ooty", image: unsplash("1774814328175-86c1ed4949e6", 1000) },
  { names: "Meera & Arun", place: "Wedding · Chennai", image: unsplash("1756190564669-215843660e93", 1000) },
  { names: "Kavya & Vikram", place: "Reception · Coimbatore", image: unsplash("1779475559689-a19f9c339352", 1000) },
];

// Shown as big faded numbers that count up. Replace with the studio's real figures.
export const COUNTERS = [
  { value: 8, suffix: "+", label: "Years of experience" },
  { value: 350, suffix: "+", label: "Events captured" },
  { value: 40, suffix: "", label: "Destination weddings" },
  { value: 1, suffix: "M+", label: "Photos delivered" },
];

export const PORTFOLIO = [
  unsplash("1610173827043-9db50e0d8ef9", 900), // bridal portrait — also the inset in the intro section
  unsplash("1621801306185-8c0ccf9c8eb8", 900), // henna hands, bangles
  unsplash("1681717166573-f71589207785", 900), // haldi
  unsplash("1769500809146-953b80aaa98e", 900), // bride between blue windows
  unsplash("1505932794465-147d1f1b2c97", 900), // mehndi hands
  unsplash("1599462616558-2b75fd26a283", 900), // sherwani & lehenga couple
  unsplash("1702378154233-9b870ff8f1b3", 900),
  unsplash("1589463349208-95817c91f971", 900), // marigold hangings
  unsplash("1769500810743-5e5dd4fd5848", 900),
  unsplash("1767790693955-bb886f16dce9", 900),
];

export const PARALLAX_BACKDROP = unsplash("1773745060497-4cc1df774c72", 2400);
export const CONTACT_BACKDROP = unsplash("1745573673416-66e829644ae9", 2400);

export const SERVICES = [
  { title: "Weddings", text: "Every ritual and every emotion, from the first haldi to the last goodbye.", image: unsplash("1587271407850-8d438ca9fdf2", 900) },
  { title: "Pre-wedding", text: "Relaxed couple shoots at places that mean something to you.", image: unsplash("1774814319627-6b105a4dbf03", 900) },
  { title: "Birthdays & baby showers", text: "Candid family moments, kept for the years ahead.", image: unsplash("1784815015307-a62b83f8b949", 900) },
  { title: "Maternity & newborn", text: "Soft, timeless portraits as you welcome your little one.", image: unsplash("1780329930345-19a7f25e5fc6", 900) },
  { title: "Portraits", text: "Personal and professional portraits in natural light.", image: unsplash("1526392195523-1f40e4e78117", 900) },
  { title: "Corporate & events", text: "Conferences, launches and team photos, delivered on time.", image: unsplash("1776248783518-400b6d0da64c", 900) },
];

export const PLANS = [
  { name: "Standard", text: "Single-day coverage", features: ["1 photographer", "Candid & traditional photos", "Online gallery with QR", "Edited photos in 3 weeks"] },
  { name: "Premium", text: "Wedding + reception", features: ["2 photographers + 1 filmmaker", "Highlight film", "Online gallery with face search", "Premium photo album"], featured: true },
  { name: "Luxury", text: "Full wedding story", features: ["Full team across all events", "Pre-wedding shoot", "Cinematic wedding film", "Two premium albums"] },
];

export const MARQUEE = ["Weddings", "Pre-wedding", "Engagements", "Receptions", "Maternity", "Baby showers", "Birthdays", "Portraits"];
