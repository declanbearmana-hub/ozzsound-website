window.OZZSOUND_CONFIG = {
  // Supabase public browser connection. Never put a secret/service-role key here.
  supabaseUrl: "https://lnritqkwejumknddyfzu.supabase.co",
  supabasePublishableKey: "sb_publishable_-5JZTaagJ2ozQ6QPPyIbxA_kgp-L5jx",
  supabaseUploadBucket: "event-uploads",
  phone: "",
  email: "ozzsound@hotmail.com",
  facebook: "",
  instagram: "",
  bookedDates: [], limitedDates: [], testimonials: [], heroMedia: [], galleryMedia: [],
  gearCatalogue: [
    { id: "pa", name: "PA / Speaker System", category: "sound", description: "Sound equipment for parties, functions, speeches and events.", image: "assets/images/gear/pa-speaker.jpg" },
    { id: "lighting", name: "Party / Event Lighting", category: "lighting", description: "Lighting options to add colour and atmosphere to your event.", image: "assets/images/gear/event-lighting.jpg" },
    { id: "strobe", name: "Strobe Lighting", category: "lighting", description: "Optional flashing-light effect. Organiser approval is required before use.", image: "assets/images/gear/strobe-light.jpg" },
    { id: "mic", name: "Microphone", category: "microphones", description: "Ask about microphone options for speeches, announcements and presentations.", image: "assets/images/gear/microphone.jpg" },
    { id: "karaoke", name: "Karaoke Setup", category: "karaoke", description: "Equipment for a self-run karaoke night. Ozzsound will confirm the suitable setup.", image: "assets/images/gear/karaoke.jpg" },
    { id: "dj", name: "DJ Equipment", category: "dj", description: "DJ equipment hire subject to the equipment and setup required.", image: "assets/images/gear/dj-equipment.jpg" },
    { id: "custom", name: "Custom Event Package", category: "sound", description: "Not sure what you need? Add this and tell Ozzsound about your event.", image: "assets/images/gear/custom-package.jpg" }
  ],
  eventMedia: {weddings:"assets/images/weddings/card-wedding.jpg",parties:"assets/images/parties/card-party.jpg",schools:"assets/images/schools/card-school.jpg",seasonal:"assets/images/seasonal/card-seasonal.jpg",corporate:"assets/images/corporate/card-corporate.jpg",sporting:"assets/images/sporting/card-sporting.jpg",karaoke:"assets/images/karaoke/card-karaoke.jpg"}
};
if (/\/admin\/?(?:index\.html)?$/i.test(location.pathname)) {
  ['admin-attention.js?v=20261005-3','admin-issues.js?v=20261005-1'].forEach(src=>{const s=document.createElement('script');s.src=src;s.defer=true;document.head.appendChild(s)});
} else {
  const s=document.createElement('script');s.src='js/site-feedback.js?v=20261005-1';s.defer=true;document.head.appendChild(s);
}
