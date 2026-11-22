# Privacy Disclosure

**Last updated: November 22, 2026**

Goodreads + Douban is an independent extension. It is not affiliated with or endorsed by Goodreads or Douban.

## Information the extension processes

- **Goodreads book title:** On a Goodreads book detail page, the extension reads the visible book title and uses it as a search query on Douban.
- **Douban session cookies:** Requests to Douban use the browser's existing cookies for Douban when available. This lets Douban recognize a session you already have. The extension does not read, extract, or store cookie values.
- **Douban book information:** The extension retrieves the matching Douban book page and its popular-comments page to display the book title, author, rating, rating count, and up to five comments with available author, rating, date, location, and helpful-vote details.

## Where information goes

The book-title query and any applicable Douban cookies are sent directly by the browser over HTTPS to `search.douban.com` and `book.douban.com`. Douban handles those requests under its own terms and privacy practices. The extension does not send lookup data to a server operated by the extension developer or to an analytics or advertising service.

## Storage and retention

The extension does not save book titles, cookie values, Douban results, or browsing history in extension storage or a developer-operated database. It processes the fetched page content in memory to display the panel; that temporary data is discarded when it is no longer needed by the page.

## Your choices

The lookup runs automatically on Goodreads book detail pages while the extension is enabled. You can stop this processing by disabling or removing the extension. If you are signed out of Douban or Douban does not allow a request, the panel may show an error or incomplete information.

## Contact

For questions about this disclosure, use the [project repository](https://github.com/minchnew/goodreads-douban-extension).
