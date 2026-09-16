window.OZZSOUND_CONFIG = {
  phone: "",
  email: "",
  facebook: "",
  instagram: "",

  // Availability calendar — use YYYY-MM-DD.
  // Add/remove dates here, commit, and push to update the public calendar.
  bookedDates: [],
  limitedDates: [],

  // Genuine client reviews only. Add entries here and the reviews section appears automatically.
  // Example: { quote: "...", name: "First name", event: "Wedding · Hobart" }
  testimonials: [],

  // Add real Ozzsound media here as it arrives. Photos and videos can be mixed.
  // Missing files are skipped automatically, so the site still works while the library is empty.
  heroMedia: [
    { type: "video", src: "assets/videos/hero-wedding.mp4", poster: "assets/images/general/hero-poster.jpg", duration: 9000 },
    { type: "image", src: "assets/images/weddings/hero-wedding.jpg", duration: 6500 },
    { type: "video", src: "assets/videos/hero-party.mp4", poster: "assets/images/general/hero-poster.jpg", duration: 9000 },
    { type: "image", src: "assets/images/parties/hero-party.jpg", duration: 6500 },
    { type: "image", src: "assets/images/corporate/hero-corporate.jpg", duration: 6500 },
    { type: "image", src: "assets/images/sporting/hero-sporting.jpg", duration: 6500 }
  ],

  // Stage 4 media gallery. Add genuine Ozzsound photos/videos here.
  // category: wedding, party, kids, corporate, sporting or general.
  galleryMedia: [
    // { type: "image", src: "assets/images/weddings/reception-01.jpg", category: "wedding", label: "Wedding reception" },
    // { type: "video", src: "assets/videos/dancefloor-01.mp4", poster: "assets/images/general/dancefloor-poster.jpg", category: "party", label: "Dance floor" }
  ],

  // Optional event-card backgrounds. Missing files are simply ignored.
  eventMedia: {
    weddings: "assets/images/weddings/card-wedding.jpg",
    parties: "assets/images/parties/card-party.jpg",
    kids: "assets/images/kids/card-kids.jpg",
    corporate: "assets/images/corporate/card-corporate.jpg",
    sporting: "assets/images/sporting/card-sporting.jpg"
  }
};
