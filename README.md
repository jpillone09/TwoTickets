# 🎟️ TwoTickets

**A private movie diary for couples.** Log what you watch, rate and review it, build a shared watchlist, and see your taste side by side. Inspired by Letterboxd, but made for two people.

**Status:** [two-tickets-two.vercel.app]  
**Repository:** [https://github.com/jpillone09/TwoTickets.git]

---

## About

Most movie-tracking apps are built around following strangers. I wanted something smaller and more personal: a cozy place where a couple can keep a shared record of their movie nights, compare ratings, and decide what to watch next.
Each person has their own account, diary and reviews. When two people pair up with an invite code, they unlock a shared watchlist, each other's ratings, recommendations and couple stats. Nobody outside the couple can see anything.
It started as a private app for two people and was redesigned so that any couple can sign up.

## Features

**Discover**
- Search TMDB's movie database, browse trending, popular, top-rated, in-cinema and upcoming films
- Mood picker (cozy night, date night, spooky, make me laugh, and more) with genre combinations and quality filters
- "Surprise me" button, plus genre, year and sort filters
- Movie pages with cast, director, runtime, similar movies and both partners' ratings

**Diary and reviews**
- Log every viewing with date, half-star rating, review, tags, rewatch and "watched together" flags
- Rewatches never overwrite earlier entries
- Spoiler reviews stay hidden until the reader chooses to show them
- Likes, comments and replies; you can't like your own review
- Diary as a list or poster grid, with year, month, genre and rating filters

**Watchlists and lists**
- Personal watchlist and a shared couple watchlist, with notes, priorities, sorting and filtering
- See whether your partner has watched or rated something
- Random "pick a movie for us" button
- Custom lists (Horror Night, Comfort Movies and so on) and favorites
- One-tap add from any poster

**Together**
- Invite-code pairing, limited to two people per couple
- Recommend movies to each other and accept, dismiss or add them to a watchlist
- In-app notifications and a shared activity feed

**Stats**
- Personal stats: movies and hours watched, average rating, top genres, directors and actors, viewing streaks
- Couple stats: movies watched together, shared average rating, biggest disagreements
- A yearly recap

**Account**
- Email sign-up, password reset, profile pictures and bios
- Download your data (CSV and JSON) and delete your account
- Privacy Policy and Terms pages

## Technologies

| Area | Tools |
|---|---|
| Front end | React, TypeScript, Vite, React Router |
| Styling | Tailwind CSS, Lucide icons, custom pastel theme |
| Back end | Supabase: PostgreSQL, Auth, Storage, Edge Functions |
| Security | Row Level Security, database triggers and functions, Cloudflare Turnstile (CAPTCHA) |
| Data | TMDB API |
| Hosting | Vercel |

## How it works

- **Privacy is enforced in the database.** Row Level Security policies mean a signed-in user can only read their own rows and their partner's. A SQL script (`supabase/tests/rls_check.sql`) creates a pair of test users and a stranger, tries to break the rules, and checks that everything is blocked.
- **Pairing.** A user starts a couple and gets a single-use invite code that expires after 7 days. The partner enters it to join. A database trigger stops any couple from having more than two people, and wrong guesses are rate limited.
- **TMDB access.** The browser never sees the TMDB key. It calls a Supabase Edge Function, which talks to TMDB and saves movie details in PostgreSQL so repeat views don't hit the API again.
- **Stats** are calculated from real diary and rating records rather than stored separately.

## My process

I planned this one phase at a time:

1. Wrote the project brief: features, stack, theme and data model
2. Designed the database and privacy rules
3. Built the app shell, sign-up and pairing
4. Connected TMDB and built Discover and movie pages
5. Added the diary, ratings and reviews
6. Added watchlists, custom lists, profiles, recommendations and notifications
7. Built the stats pages and yearly recap
8. Prepared it for launch: password reset, data export, account deletion, legal pages, security headers and a deployment checklist
9. Redesigned Discover and the Home page, and fixed bugs I found while testing

**I built this with an AI coding assistant (Claude).** I defined the idea and requirements, set up Supabase and TMDB, ran the app locally, tested it with multiple accounts, reported the bugs I found, and reviewed each fix.

## What I learned

- **Designing for privacy.** Why access rules belong in the database and not only in the interface, and how Row Level Security works. I also learned to test it by trying to break it with a stranger account.
- **Planning data before screens.** Moving from a two-person app to a public app meant redesigning the database around couples, not just changing the interface.
- **Keeping secrets off the browser.** Why the TMDB key lives in a server function, and how to store it as a secret.
- **Reading the real error.** A vague "non-2xx" message hid a TMDB 401 problem, and a profile page that said "not found" was really a database query failing. Showing the actual error message was the fix both times.
- **Ambiguous database relationships.** When two tables can be linked in more than one way, the database refuses to guess, so queries have to say which link to follow.
- **React quirks.** Two routes using the same page component share their state unless you give them different keys, which caused a button that did nothing.
- **Real-world limits.** Free email sending has strict rate limits, so public apps need their own email provider, and CAPTCHA has to be added to the form before it's switched on in the back end.
- **Working with an AI assistant.** Clear requirements and exact error messages get much better results, and I still need to test and understand what it produces rather than trusting it.

## Running it yourself

You'll need Node.js, a free [Supabase](https://supabase.com) project and a free [TMDB](https://www.themoviedb.org) API key.

```bash
npm install
cp .env.example .env.local   # add your Supabase URL and anon key
npm run dev
```

1. In the Supabase SQL Editor, run `supabase/migrations/0001_init.sql`, then `0002_launch_hardening.sql`.
2. Create an Edge Function named `tmdb` using `supabase/functions/tmdb/index.ts`, and add your TMDB token as a secret called `TMDB_READ_TOKEN`.
3. Run `supabase/tests/rls_check.sql` and confirm every row says `passed = true`.
4. See `DEPLOY.md` for email sending, CAPTCHA and deploying to Vercel.

Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and optionally `VITE_TURNSTILE_SITE_KEY`.

## Project structure

```
src/
  auth/         sign-in session and partner state
  components/   shared pieces: layout, movie cards, review cards, forms, charts
  lib/          Supabase and TMDB helpers, stats calculations, data export
  pages/        Home, Discover, Movie, Diary, Watchlists, Stats, Profile, Settings...
supabase/
  migrations/   database schema, privacy rules and launch hardening
  functions/    the TMDB edge function
  tests/        privacy test script
```

## What's next

- Dark mode and more polish on the diary, watchlists and stats pages
- A calendar view for the diary
- Change email or password from Settings
- Email notifications and emoji reactions
- A proper test on real phones

## Credits

Movie data and images come from [TMDB](https://www.themoviedb.org). *This product uses the TMDB API but is not endorsed or certified by TMDB.*
