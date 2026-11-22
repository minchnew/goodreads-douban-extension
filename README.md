# Goodreads + Douban

A local Chrome Manifest V3 extension that adds a Douban book information panel to Goodreads book detail pages.

## What it does

1. Runs on Goodreads `/book/show/...` pages.
2. Reads the book title and author from the page.
3. Searches Douban Books for a matching title.
4. Shows the Douban title and author, overall rating and stars, rating count, and up to five popular short comments. Each comment includes its author, star rating, date/location when available, and helpful vote count.

The extension sends the Goodreads book title as a search query to Douban and includes your existing Douban cookies on requests to `search.douban.com` and `book.douban.com` so Douban can recognize your session. It does not read or store those cookies. Douban may still require verification or rate-limit requests; in that case the panel shows an error and lets you retry.

## Load it in Chrome

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Choose **Load unpacked** and select this directory.
4. Open or reload a Goodreads book detail page.

No build step or external libraries are required.
