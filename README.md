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
