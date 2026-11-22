chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "DOUBAN_FETCH_PAGE") return false;

  fetchDouban(message.url)
    .then((html) => sendResponse({ ok: true, html }))
    .catch((error) => sendResponse({ ok: false, error: error.message || "Douban lookup failed." }));

  return true;
});

async function fetchDouban(rawUrl) {
  const url = new URL(rawUrl);
  const allowedHost = url.hostname === "search.douban.com" || url.hostname === "book.douban.com";
  const allowedPath = url.hostname === "search.douban.com"
    ? url.pathname === "/book/subject_search"
    : /^\/subject\/\d+\/(?:comments\/?)?$/.test(url.pathname);
  if (url.protocol !== "https:" || !allowedHost || !allowedPath) {
    throw new Error("The requested Douban URL is outside the extension's allowed lookup paths.");
  }
  const response = await fetch(url, {
    credentials: "include",
    headers: { Accept: "text/html,application/xhtml+xml" }
  });
  if (!response.ok) throw new Error(`Douban returned HTTP ${response.status}.`);
  const html = await response.text();
  if (/captcha|安全验证|请求过于频繁/i.test(html) && !/subject_search|subject\//i.test(html)) {
    throw new Error("Douban is asking for verification or rate-limiting this lookup.");
  }
  return html;
}
