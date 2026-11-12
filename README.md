# Stride prototype

A mobile-first demo of an app that gives young people structured, supervised things to do (the "idleness" side of underage drinking), with guardians approving and verified mentors and clubs on board.

Built with React, Vite and a PWA service worker, so it installs to a phone's home screen and opens with no data after the first load.

## Run it

```bash
npm install
npm run dev
```

Vite prints a local link and a network link. Open the network link on your phone (same Wi-Fi) to see it at real size.

## Shared family database

Skip-and-explore stays on this phone. A real signup is stored in SQLite so a second phone can open the same teen.

```bash
npm run server
```

Leave that running, then `npm run dev` in another terminal. A teen signup shows a one-time guardian code. On the other phone, choose "I have a family code" and enter it. That phone can approve, pause, and release held messages. The teen phone can ask, message, and report. A club leader uses a separate code after a guardian approves.

The database file is `server/data/stride.db`. Identity checks, WhatsApp, and the school link are not connected, and the app does not call them done.

## Build and share it

```bash
npm run build
npm run preview
```

The `dist` folder is a plain static site. Drop it on Netlify, Vercel, GitHub Pages or Firebase Hosting and send the link. It uses relative paths and hash routing (`#/clubs`), so it works from any folder or host with no server settings.

On a phone, open the link and choose "Add to home screen". The app shell and fonts are cached, so it opens offline once it has loaded one time on a connection.

## Android and iOS

The same screens also sit inside a native shell (Capacitor), so they can be installed from a store later. The web build is copied into the app. There is no second codebase.

```bash
npm run cap:android
```

That builds the native bundle, copies it in, and opens the `android` folder in Android Studio. Run it on a phone or an emulator from there. Android Studio and a JDK are required. They are not part of this project.

```bash
npm run cap:ios
```

That opens the Xcode project. iOS can only be built on a Mac.

`npm run cap:sync` rebuilds and copies the web app into both projects without opening an IDE. The native build skips the service worker, because the WebView already has the files on the device.

## The screens

The first five are tabs in the bottom bar. Club and Lesson open from a list.

| Route | File | What it shows |
| --- | --- | --- |
| `#/today` | `src/screens/Today.jsx` | This week's sessions, 8-week streak, your clubs, mentor challenge |
| `#/clubs` | `src/screens/Clubs.jsx` | Search and filter verified clubs |
| `#/learn` | `src/screens/Learn.jsx` | Continue learning, lessons, and a growth record of adult-confirmed sessions and badges |
| `#/mentor` | `src/screens/Mentor.jsx` | Mentor safety checks, guardian-visible messages, report a concern |
| `#/guardian` | `src/screens/Guardian.jsx` | Confirmed sessions, approve requests, other parents at each club, WhatsApp summary |
| `#/club/<id>` | `src/screens/ClubDetail.jsx` | Club details, the checks the leader passed, who covers the cost, upcoming sessions |
| `#/lesson/<id>` | `src/screens/Lesson.jsx` | Lesson video, offline task, badge, "I did the task" |

## Where things live

- `src/styles.css` holds the design tokens (colors, fonts) at the top, then the styles for each part of the app: a calm, near-monochrome look with Instrument Serif headlines, Instrument Sans text, hairline borders, ink-black buttons and one deep green accent for progress.
- `src/data.js` holds the sample clubs, lessons and children. Swap this for real data.
- `src/store.jsx` is the shared state, so a club request made in Clubs shows up in the Guardian view.
- `src/icons.jsx` holds the inline icons.
- `vite.config.js` holds the PWA name, colors and offline caching.

## Sample data

The names (Stride, Tino, Rudo, Fabulous Lashid) and the clubs are placeholders. Nothing here is real, and no impact numbers are claimed.

## Next steps

- Add real sign-in (guardian account with child profiles switched by PIN), for example with Firebase Auth.
- Store clubs, requests and attendance in a database so clubs can confirm sessions.
- Add the guardian sign-up flow.
- If you later need a store app, the components and logic can move to React Native with Expo.
