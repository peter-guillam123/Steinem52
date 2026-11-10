# Steinem52

Kind: Work
Audience: general readers
Voice: plain editorial for the piece itself; the About page is in Chris's voice
Design: its own look (no Guardian fonts, colours, logo or masthead)
Publishing: public, on GitHub Pages (Chris said so on 10 November 2026)

## What this is

A scrolling interactive on the life of Gloria Steinem (25 March 1934 – 2 September 2026), told as far as possible in her own words.

## Rules for this project

- Every quotation on the page must have been checked word for word against the full text of the source cited. If it has not been read in full, it does not go on the page.
- Every factual claim carries a numbered citation that points to the sources list at the foot of the page.
- Images must be public domain or openly licensed, with the credit and licence shown.
- Where sources disagree (how long she worked at the Playboy Club, which issue of Ms. sold 300,000 copies), say so on the page rather than picking one silently.
- No build step. Plain HTML, CSS and JavaScript modules. Libraries are installed with pnpm and copied into `vendor/` by `pnpm run vendor`.
