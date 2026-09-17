# Ozzsound Website V3

Official development website for Ozzsound Mobile Music.

## Media workflow
The cinematic hero can mix photos and videos. Add real media into the folders below, then edit `config/site-config.js` to set the order and duration.

- `assets/videos/` — hero/event MP4 clips
- `assets/images/weddings/`
- `assets/images/parties/`
- `assets/images/kids/`
- `assets/images/corporate/`
- `assets/images/sporting/`
- `assets/images/general/`

Recommended hero video: MP4 (H.264), 1920×1080, muted, 6–15 seconds, ideally under ~12 MB after compression.
Recommended hero photos: WebP/JPG, around 1920 px wide, compressed for web.

Missing files listed in the config are automatically skipped, so the site remains functional while media is being collected.

## Contact details
Phone, email and social links remain blank in `config/site-config.js` until the correct Ozzsound details are ready.


## Stage 4 media
Add genuine event photos/videos to `assets/images/...` or `assets/videos/`, then list them in `config/site-config.js` under `galleryMedia`. The gallery supports category filters, video playback and a full-screen lightbox. Optional `eventMedia` files become event-card backgrounds automatically. Missing files are ignored.

## Supabase enquiry storage (V1.7)
Before deploying the new direct-submit enquiry form, run `SUPABASE-SETUP.sql` once in the Ozzsound Supabase project's SQL Editor. The public website can insert enquiries but has no public read/update/delete policy. Photos remain in the private `event-uploads` bucket and their private paths are saved with the matching enquiry.

## V1.8 Supabase enquiry alignment
Run `SUPABASE-SETUP.sql` once in Supabase SQL Editor before deploying this version. The website now uses one `OZZ-XXXXXXXX` reference for the customer message, database row and upload folder, and stores attachment paths, wedding display-photo paths and complete enquiry/builder data.
