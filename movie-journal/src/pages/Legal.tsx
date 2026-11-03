import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { APP_NAME, CONTACT_EMAIL, LEGAL_UPDATED, OPERATOR } from "../lib/brand";

function Page({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <Link to="/" className="font-heading text-xl font-bold">{APP_NAME}</Link>
      <article className="sticker-card mt-4 space-y-4 p-8 leading-relaxed [&_h2]:mt-6 [&_h2]:text-xl [&_ul]:list-disc [&_ul]:pl-6">
        <h1 className="text-3xl">{title}</h1>
        <p className="text-sm text-muted-foreground">Last updated: {LEGAL_UPDATED}</p>
        {children}
        <p className="pt-4 text-sm text-muted-foreground">Questions? Email <a className="font-bold text-berry underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </article>
    </div>
  );
}

export function Privacy() {
  return (
    <Page title="Privacy Policy">
      <p>{APP_NAME} is a movie diary for couples, run by {OPERATOR}. This page explains what we collect and why.</p>
      <h2>What we collect</h2>
      <ul>
        <li>Your email address and password (the password is stored hashed, never in plain text).</li>
        <li>What you add: display name, username, bio, profile picture, diary entries, ratings, reviews, comments, watchlists, lists, favorites and recommendations.</li>
        <li>Basic technical data such as IP address and browser type, which our hosting and security providers process to run and protect the service.</li>
      </ul>
      <h2>Who can see your data</h2>
      <p>Only you and your partner, once you pair up. Nobody else can see your diary, reviews, lists or watchlists. If you haven't paired, only you can. Your profile picture is stored at a public web address, so anyone who has that exact address can open the image.</p>
      <h2>Why we use it</h2>
      <p>To run the app: sign you in, show your diary and statistics, let you share with your partner, and send you emails such as sign-up confirmation and password reset. We don't sell your data and we don't show ads.</p>
      <h2>Services we use</h2>
      <ul>
        <li>Supabase: database, login and file storage.</li>
        <li>Vercel: website hosting.</li>
        <li>The Movie Database (TMDB): movie information. We send movie searches to TMDB, not your personal details. This product uses the TMDB API but is not endorsed or certified by TMDB.</li>
        <li>Cloudflare Turnstile: bot protection on sign-up and log-in.</li>
        <li>An email provider to deliver our emails.</li>
      </ul>
      <h2>Cookies and storage</h2>
      <p>We store your login session in your browser so you stay signed in. We don't use advertising or tracking cookies.</p>
      <h2>Your choices</h2>
      <ul>
        <li>Download your data: Settings → Your data.</li>
        <li>Delete your account and data: Settings → Delete account. This is permanent.</li>
        <li>Leave your couple at any time: your own entries stay yours and become private again.</li>
      </ul>
      <h2>Keeping it safe, and keeping it</h2>
      <p>We use access rules in the database so each person only reaches their own and their partner's data. No system is perfectly secure. We keep your data until you delete your account.</p>
      <h2>Children</h2>
      <p>You must be 13 or older to use {APP_NAME}, or older if your country requires it.</p>
      <h2>Changes</h2>
      <p>If we change this policy in a meaningful way, we'll update the date above and tell you in the app.</p>
    </Page>
  );
}

export function Terms() {
  return (
    <Page title="Terms of Use">
      <p>By creating an account you agree to these terms with {OPERATOR}.</p>
      <h2>Using {APP_NAME}</h2>
      <ul>
        <li>You must be 13 or older, and you're responsible for your account and password.</li>
        <li>Be kind. Don't post anything unlawful, hateful, harassing or that infringes someone else's rights.</li>
        <li>Don't try to break, overload or get around the security of the service, or access other people's data.</li>
        <li>An account is for one person. A couple means exactly two people.</li>
      </ul>
      <h2>Your content</h2>
      <p>Your diary, reviews and notes belong to you. You give us permission to store them and show them to your partner so the app can work. Your partner can see what you log once you're paired.</p>
      <h2>Movie information</h2>
      <p>Movie data and images come from TMDB. {APP_NAME} is not endorsed or certified by TMDB and isn't affiliated with any film studio.</p>
      <h2>Ending your account</h2>
      <p>You can delete your account at any time in Settings. We may suspend accounts that break these terms.</p>
      <h2>No guarantees</h2>
      <p>{APP_NAME} is provided as is, without promises that it will always be available or error-free. To the extent the law allows, we aren't liable for losses from using it. Keep your own copy of anything important using the export feature.</p>
      <h2>Changes</h2>
      <p>We may update these terms. If you keep using the service after a change, you accept the new version.</p>
    </Page>
  );
}
