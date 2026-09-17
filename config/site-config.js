window.OZZSOUND_CONFIG = {
  // Supabase public browser connection. Never put a secret/service-role key here.
  supabaseUrl: "https://lnritqkwejumknddyfzu.supabase.co",
  supabasePublishableKey: "sb_publishable_-5JZTaagJ2ozQ6QPPyIbxA_kgp-L5jx",
  supabaseUploadBucket: "event-uploads",
  phone: "",
  email: "ozzsound@hotmail.com",
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

  // Gear hire catalogue. Replace names/images with Ozzsound's exact equipment as inventory is confirmed.
  // image is optional: missing images automatically use the neon category artwork.
  gearCatalogue: [
    { id: "pa", name: "PA / Speaker System", category: "sound", description: "Sound equipment for parties, functions, speeches and events.", image: "assets/images/gear/pa-speaker.jpg" },
    { id: "lighting", name: "Party / Event Lighting", category: "lighting", description: "Lighting options to add colour and atmosphere to your event.", image: "assets/images/gear/event-lighting.jpg" },
    { id: "mic", name: "Microphone", category: "microphones", description: "Ask about microphone options for speeches, announcements and presentations.", image: "assets/images/gear/microphone.jpg" },
    { id: "karaoke", name: "Karaoke Setup", category: "karaoke", description: "Equipment for a self-run karaoke night. Ozzsound will confirm the suitable setup.", image: "assets/images/gear/karaoke.jpg" },
    { id: "dj", name: "DJ Equipment", category: "dj", description: "DJ equipment hire subject to the equipment and setup required.", image: "assets/images/gear/dj-equipment.jpg" },
    { id: "custom", name: "Custom Event Package", category: "sound", description: "Not sure what you need? Add this and tell Ozzsound about your event.", image: "assets/images/gear/custom-package.jpg" }
  ],

  // Optional event-card backgrounds. Missing files are simply ignored.
  eventMedia: {
    weddings: "assets/images/weddings/card-wedding.jpg",
    parties: "assets/images/parties/card-party.jpg",
    kids: "assets/images/kids/card-kids.jpg",
    corporate: "assets/images/corporate/card-corporate.jpg",
    sporting: "assets/images/sporting/card-sporting.jpg",
    karaoke: "assets/images/karaoke/card-karaoke.jpg"
  }
};
