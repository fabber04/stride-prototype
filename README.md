# Stride prototype

A mobile-first demo of an app that gives young people structured, supervised things to do (the "idleness" side of underage drinking), with guardians approving and verified mentors and clubs on board.

Built with React, Vite and a PWA service worker, so it installs to a phone's home screen and opens with no data after the first load.

## Run it

```bash
npm install
npm run dev
```

Vite prints a local link and a network link. Open the network link on your phone (same Wi-Fi) to see it at real size.

## Build and share it

```bash
npm run build
npm run preview
```

The `dist` folder is a plain static site. Drop it on Netlify, Vercel, GitHub Pages or Firebase Hosting and send the link. It uses relative paths and hash routing (`#/clubs`), so it works from any folder or host with no server settings.

On a phone, open the link and choose "Add to home screen". The app shell and fonts are cached, so it opens offline once it has loaded one time on a connection.

## The five screens

| Route | File | What it shows |
| --- | --- | --- |
| `#/today` | `src/screens/Today.jsx` | Weekly streak, check in to a session, mentor challenge |
| `#/clubs` | `src/screens/Clubs.jsx` | Verified clubs, filters, ask a guardian to approve |
| `#/learn` | `src/screens/Learn.jsx` | Lessons that download for offline play, with offline tasks |
| `#/mentor` | `src/screens/Mentor.jsx` | Mentor safety checks, guardian-visible messages, report a concern |
| `#/guardian` | `src/screens/Guardian.jsx` | Approve requests, confirmed sessions, WhatsApp summary |

## Where things live

- `src/styles.css` holds the design tokens (colors, fonts) at the top, then the styles for each part of the app. The tokens match the Family of Greatness app: Inter, slate neutrals, a `#2563eb` blue accent, a navy wordmark, thin borders and pill-shaped controls.
- `src/data.js` holds the sample clubs, lessons and children. Swap this for real data.
- `src/store.jsx` is the shared state, so a club request made in Clubs shows up in the Guardian view.
- `src/icons.jsx` holds the inline icons.
- `vite.config.js` holds the PWA name, colors and offline caching.

## Sample data

The names (Stride, Tino, Rudo, Tendai N.) and the clubs are placeholders. Nothing here is real, and no impact numbers are claimed.

## Next steps

- Add real sign-in (guardian account with child profiles switched by PIN), for example with Firebase Auth.
- Store clubs, requests and attendance in a database so clubs can confirm sessions.
- Add the guardian sign-up flow.
- If you later need a store app, the components and logic can move to React Native with Expo.
