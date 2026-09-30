# Cuewright

Cuewright is a screenplay studio that keeps the page and the look of each scene together. Write in screenplay form, attach hair, dress colors, wardrobe, a shooting location, stills, and video, then export `.txt`, `.pdf`, `.docx`, and `.doc`.

Scripts stay in this browser. Nothing is uploaded.

## Run it

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

```bash
npm test
npm run lint
```

## What a scene holds

- A slug (interior or exterior, place, time of day) and screenplay lines: action, character, parenthetical, dialogue, transition, and shot. Tab changes the element. Enter starts the next one.
- A cast list. Each person has a bible look, and a scene can override hairstyle, hair color, dress colors, and wardrobe.
- A shooting location: name, address, map link, scout notes, and stills. This is separate from the slug, which is the story location.
- Images, video files, and reference links. Stills are embedded in the PDF and Word scene kit when the file is a JPEG or PNG. Video is kept in the studio and named in the export.

## Export plugins

| File | What you get |
| --- | --- |
| `.txt` | Fountain screenplay, which Final Draft, Fade In, Highland, and Arc Studio can import, plus a scene-kit note |
| `.pdf` | Courier screenplay pages, then the cast bible and each scene's look, place, and stills |
| `.docx` | The same document for current Word, Google Docs, and LibreOffice |
| `.doc` | A Word-compatible copy for older Word |

## Where the shape came from

Final Draft and Fade In own the page. Highland made Fountain the plain-text interchange. Celtx and StudioBinder attach locations, wardrobe, and reference boards to a breakdown after the draft. Cuewright puts hair, dress color, and reference media on the scene itself, and sends them out with the script.
