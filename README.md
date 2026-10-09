# Shepherd & Rita Invitation Studio

Run `node server.cjs` and open http://127.0.0.1:4187. The buildless website is in `dist/`.

Guest names are processed entirely in the browser. No names are stored or uploaded. PNG and JPEG downloads use the same 853 × 1280 canvas as the preview. Automatic fitting measures both text width and height; manual mode blocks an overflowing download. Reset style preserves the guest name.

The supplied card remains the source for all artwork outside x214–646, y917–964. That small guest-name area uses a color-matched, feathered patch from `dist/assets/invitation-blank.png`. The rest of the AI-edited image is never used. The original access code SR001 remains fixed.

Asset preparation used the built-in imagegen tool with this prompt:
“Use case: precise-object-edit. Edit target: attached wedding invitation. Remove ONLY the black text 'Mr. Opakrwoth Jonathan' in the guest name line (approximately x225–640 y920–960 in the 853x1280 original). Seamlessly reconstruct the pale sage photographic background behind those letters. Leave that line empty. Preserve ALL other pixels, text, ornament, photo, faces, colors, dimensions and layout exactly. Do not redesign, retype, recolor or change any other part. This is a blank-name template for an invitation editor.”

