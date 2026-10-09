# Shepherd & Rita Invitation Studio

Run `node server.cjs` and open http://127.0.0.1:4187. The buildless website is in `dist/`.

Previews are rendered in the browser. Generating or downloading an invitation registers the guest name and admitted-guest count in the existing wedding website's private Supabase `wedding_cards` table. PNG and JPEG downloads use the same 853 × 1280 canvas as the preview. Automatic fitting measures both text width and height; manual mode blocks an overflowing download. Reset style preserves the guest name.

The supplied card remains the source for the artwork except the guest-name area and code footer. The name area x214–646, y917–964 uses a color-matched, feathered patch from `dist/assets/invitation-blank.png`. The rest of the AI-edited image is never used. A sage footer replaces the original fixed code with a registered RS code.

## Organiser access and verification

Open Organiser access in the editor and paste the private organiser key supplied separately. The key and current draft are kept in sessionStorage, scoped to this tab. Forget key clears it. The private key must never be committed or included in frontend assets. Only its SHA-256 digest is in the Edge Function source. Rotation requires a fresh random 32-byte key and deployment with the new digest.

`database/issue-wedding-card.ts` is deployed as `issue-wedding-card` in project `kmmbavbmwpzfkdiwqqzm`. It validates the organiser bearer key before accessing any database row. Gateway JWT verification is disabled because this endpoint performs its own high-entropy key authentication. Service-role credentials stay in Supabase's server environment. Existing table permissions and RLS remain unchanged.

The server lets the database generate unique codes. A draft UUID ensures repeat downloads and network retries return the same code. Changing the name or admitted count starts a new draft; it does not revoke cards already issued. New invitation deliberately starts a separate card, even for a repeated name. Refresh restores the last draft and revalidates it on generation/download. Revocation is available by setting `active=false` in the private Supabase table. Verification is at https://shepherdwedsrita.vercel.app/#rsvp. It confirms the issued guest, not one-time admission.

`node test-issuance.cjs` runs live integration checks using the separately supplied local key file and creates one clearly labelled test record. Revoke that record after testing. No key or card code is logged.

Asset preparation used the built-in imagegen tool with this prompt:
“Use case: precise-object-edit. Edit target: attached wedding invitation. Remove ONLY the black text 'Mr. Opakrwoth Jonathan' in the guest name line (approximately x225–640 y920–960 in the 853x1280 original). Seamlessly reconstruct the pale sage photographic background behind those letters. Leave that line empty. Preserve ALL other pixels, text, ornament, photo, faces, colors, dimensions and layout exactly. Do not redesign, retype, recolor or change any other part. This is a blank-name template for an invitation editor.”

