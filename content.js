(() => {
  const HOST_ID = "goodreads-douban-panel-host";
  let lastLookupKey = "";
  let activeRequest = 0;
  let debounceTimer;

  function onProductPage() {
    return /(^|\.)goodreads\.com$/.test(location.hostname) && /^\/book\/show\/\d+/.test(location.pathname);
  }

  function readTitle() {
    const candidates = [
      document.querySelector("h1[data-testid='bookTitle']")?.textContent,
      document.querySelector("h1.Text__title1")?.textContent,
      document.querySelector("main h1")?.textContent,
      document.querySelector("h1")?.textContent,
      document.querySelector("meta[property='og:title']")?.content,
      document.title
    ];
    for (const value of candidates) {
      const title = cleanTitle(value);
      if (title && !/audible\s*$/i.test(title)) return title;
    }
    return "";
  }

  function cleanTitle(value) {
    return String(value || "")
      .replace(/\s*\|\s*Goodreads\s*$/i, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function ensurePanel() {
    let host = document.getElementById(HOST_ID);
    if (host) {
      positionPanel(host);
      return host.shadowRoot;
    }
    host = document.createElement("div");
    host.id = HOST_ID;
    host.style.cssText = "all:initial;position:fixed;right:20px;top:110px;z-index:2147483647";
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <style>
        :host { all: initial; }
        .panel { box-sizing:border-box; width:340px; max-height:72vh; overflow:auto; color:#242424; background:#fff; border:1px solid #d6d6d6; border-radius:12px; box-shadow:0 8px 32px #0003; font:14px/1.45 Arial,sans-serif; }
        header { display:flex; align-items:center; justify-content:space-between; padding:12px 14px; background:#f6f4ef; border-bottom:1px solid #e8e4dc; border-radius:12px 12px 0 0; font-weight:700; cursor:move; touch-action:none; user-select:none; }
        button { border:0; background:transparent; color:#666; font-size:18px; cursor:pointer; }
        .reopen { padding:9px 13px; border:1px solid #d6d6d6; border-radius:18px; background:#fff; box-shadow:0 4px 16px #0003; color:#333; font:14px/1.2 Arial,sans-serif; }
        [hidden] { display:none !important; }
        main { padding:14px; }
        .status { color:#666; }
        .error { color:#8b3d32; }
        .error-actions { display:flex; align-items:center; gap:12px; margin-top:10px; font-size:13px; }
        .retry { border:1px solid #d6d6d6; border-radius:6px; padding:6px 9px; background:#f7f7f7; color:#333; font:13px Arial,sans-serif; }
        .douban-search { color:#3377aa; }
        .title { font-size:16px; font-weight:700; margin:0 0 5px; }
        .title a { color:#3377aa; }
        .meta { color:#666; margin:3px 0; }
        .rating { display:flex; align-items:center; gap:8px; margin:12px 0; color:#287d52; font-size:22px; font-weight:700; }
        .rating small { color:#777; font-size:12px; font-weight:400; }
        .rating-stars { color:#e09015; font-size:15px; letter-spacing:1px; white-space:nowrap; }
        .half-star { position:relative; display:inline-block; color:#ddd; }
        .half-star::before { position:absolute; left:0; width:50%; overflow:hidden; color:#e09015; content:"★"; }
        h3 { margin:14px 0 8px; padding-bottom:7px; border-bottom:1px solid #eaeaea; font-size:14px; font-weight:400; color:#333; }
        .comment-item { padding:9px 0 10px; border-bottom:1px dashed #ddd; }
        .comment-head { display:flex; flex-wrap:wrap; align-items:center; gap:5px; margin-bottom:5px; color:#999; font-size:12px; }
        .comment-head a { color:#3377aa; }
        .vote-count { margin-left:auto; color:#999; }
        .stars { color:#e09015; letter-spacing:1px; }
        .comment-content { margin:0; color:#494949; line-height:1.6; white-space:pre-line; overflow-wrap:anywhere; }
        a { color:#267a55; text-decoration:none; }
        a:hover { text-decoration:underline; }
        .empty { color:#777; }
      </style>
      <section class="panel" aria-label="Douban book information">
        <header class="drag-handle"><span>豆瓣读书</span><button class="close" type="button" aria-label="Hide panel" title="Hide panel">×</button></header>
        <main><div class="status">Reading Goodreads book title…</div></main>
      </section>
      <button class="reopen" type="button" hidden>打开豆瓣读书</button>`;
    const panel = shadow.querySelector(".panel");
    const closeButton = shadow.querySelector(".close");
    const reopenButton = shadow.querySelector(".reopen");
    const dragHandle = shadow.querySelector(".drag-handle");
    closeButton.addEventListener("click", () => {
      panel.hidden = true;
      reopenButton.hidden = false;
    });
    reopenButton.addEventListener("click", () => {
      panel.hidden = false;
      reopenButton.hidden = true;
    });

    let drag = null;
    dragHandle.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || event.target.closest("button")) return;
      const rect = host.getBoundingClientRect();
      drag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, left: rect.left, top: rect.top };
      dragHandle.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    dragHandle.addEventListener("pointermove", (event) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      if (Math.abs(dx) + Math.abs(dy) < 3) return;
      host.dataset.userPositioned = "true";
      const rect = host.getBoundingClientRect();
      const maxLeft = Math.max(0, window.innerWidth - rect.width);
      const maxTop = Math.max(0, window.innerHeight - rect.height);
      host.style.left = `${Math.max(0, Math.min(maxLeft, drag.left + dx))}px`;
      host.style.top = `${Math.max(0, Math.min(maxTop, drag.top + dy))}px`;
      host.style.right = "auto";
    });
    const endDrag = (event) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      if (dragHandle.hasPointerCapture(event.pointerId)) dragHandle.releasePointerCapture(event.pointerId);
      drag = null;
    };
    dragHandle.addEventListener("pointerup", endDrag);
    dragHandle.addEventListener("pointercancel", endDrag);
    document.documentElement.append(host);
    positionPanel(host);
    return shadow;
  }

  function positionPanel(host = document.getElementById(HOST_ID)) {
    if (!host || host.dataset.userPositioned === "true") return;
    const selectors = [
      "img.BookCover__image",
      "[data-testid*='cover'] img",
      "[class*='BookCover'] img",
      "img[alt*='cover' i]"
    ];
    let cover = null;
    for (const selector of selectors) {
      cover = [...document.querySelectorAll(selector)].find((image) => {
        const rect = image.getBoundingClientRect();
        return rect.width >= 80 && rect.height >= 80;
      });
      if (cover) break;
    }
    if (!cover) {
      const title = readTitle().toLocaleLowerCase();
      cover = [...document.images].find((image) => {
        const rect = image.getBoundingClientRect();
        const alt = (image.alt || "").toLocaleLowerCase();
        return rect.width >= 100 && rect.height >= 100 && alt && (alt.includes(title) || title.includes(alt));
      });
    }
    if (!cover) return;

    const coverTop = cover.getBoundingClientRect().top;
    const panelHeight = host.getBoundingClientRect().height;
    const maxTop = Math.max(0, window.innerHeight - panelHeight);
    host.style.top = `${Math.max(0, Math.min(maxTop, coverTop))}px`;
  }

  function setStatus(shadow, text) {
    shadow.querySelector("main").innerHTML = `<div class="status">${escapeHtml(text)}</div>`;
  }

  function renderResult(shadow, result) {
    const main = shadow.querySelector("main");
    if (!result.found) {
      main.innerHTML = `<div class="empty">No matching Douban book found.</div>`;
      return;
    }
    const comments = result.comments?.length
      ? `<h3>短评 <span class="meta">· · · (${escapeHtml(result.commentCount || result.comments.length)}条)</span></h3>${result.comments.map(renderComment).join("")}`
      : `<h3>Short comments</h3><div class="empty">No comments were available on the Douban page.</div>`;
    const stars = renderBookStars(result.starRating);
    main.innerHTML = `
      <div class="title"><a href="${escapeAttribute(result.url)}" target="_blank" rel="noreferrer">${escapeHtml(result.title)}</a></div>
      <div class="meta">${escapeHtml(result.author || "Author not listed")}</div>
      <div class="rating"><span>${escapeHtml(result.rating || "Not rated")}</span>${stars}<small>${escapeHtml(result.ratingCount || "")}</small></div>
      ${comments}`;
  }

  function renderBookStars(value) {
    const rating = Math.max(0, Math.min(5, Number(value) || 0));
    if (!rating) return "";
    const half = rating % 1 >= 0.5;
    const fullCount = Math.floor(rating);
    const emptyCount = 5 - fullCount - (half ? 1 : 0);
    const full = "★".repeat(fullCount);
    const halfStar = half ? '<span class="half-star">★</span>' : "";
    const empty = "☆".repeat(emptyCount);
    return `<span class="rating-stars" aria-label="${rating} out of 5 stars">${full}${halfStar}${empty}</span>`;
  }

  function renderComment(comment) {
    const rating = Number(comment.rating) || 0;
    const stars = rating ? `<span class="stars" title="${escapeAttribute(comment.ratingLabel || "")}">${"★".repeat(rating)}${"☆".repeat(Math.max(0, 5 - rating))}</span>` : "";
    const details = [comment.date, comment.location].filter(Boolean).map(escapeHtml).join(" · ");
    return `<article class="comment-item">
      <div class="comment-head"><a>${escapeHtml(comment.user || "Douban user")}</a>${stars}<span>${details}</span><span class="vote-count">${escapeHtml(comment.votes || "0")} 有用</span></div>
      <p class="comment-content">${escapeHtml(comment.text)}</p>
    </article>`;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
  }

  const escapeAttribute = escapeHtml;

  async function lookup() {
    if (!onProductPage()) return;
    const title = readTitle();
    if (!title) return;
    const key = `${location.pathname}|${title}`;
    if (key === lastLookupKey) return;
    lastLookupKey = key;
    const requestId = ++activeRequest;
    const shadow = ensurePanel();
    const main = shadow.querySelector("main");
    main.innerHTML = `<div class="status">Searching Douban for “${escapeHtml(title)}”…</div>`;

    lookupDoubanBook(title)
      .then((result) => { if (requestId === activeRequest) renderResult(shadow, result); })
      .catch((error) => {
        if (requestId !== activeRequest) return;
        lastLookupKey = "";
        renderLookupError(shadow, title, error.message || "Douban lookup failed.");
      });
  }

  function renderLookupError(shadow, title, message) {
    const blocked = /failed to fetch|networkerror/i.test(message);
    const explanation = blocked
      ? "Douban redirected the automatic request to a security check. Open Douban search, complete any check there, then retry."
      : message;
    const searchUrl = new URL("https://search.douban.com/book/subject_search");
    searchUrl.searchParams.set("search_text", title);
    searchUrl.searchParams.set("cat", "1001");
    const main = shadow.querySelector("main");
    main.innerHTML = `<div class="error">${escapeHtml(explanation)}</div>
      <div class="error-actions"><a class="douban-search" href="${escapeAttribute(searchUrl.href)}" target="_blank" rel="noreferrer">Open Douban search ↗</a><button class="retry" type="button">Retry</button></div>`;
    main.querySelector(".retry").addEventListener("click", () => {
      lastLookupKey = "";
      lookup();
    });
  }

  async function lookupDoubanBook(title) {
    const searchUrl = new URL("https://search.douban.com/book/subject_search");
    searchUrl.searchParams.set("search_text", title);
    searchUrl.searchParams.set("cat", "1001");
    const searchHtml = await fetchDouban(searchUrl.href);
    const match = chooseBookResult(new DOMParser().parseFromString(searchHtml, "text/html"), title);
    if (!match) return { found: false, title };
    const detailHtml = await fetchDouban(match.url);
    const detailDoc = new DOMParser().parseFromString(detailHtml, "text/html");
    const popularCommentsUrl = new URL("comments/?sort=score", match.url).href;
    const popularCommentsHtml = await fetchDouban(popularCommentsUrl);
    const popularCommentsDoc = new DOMParser().parseFromString(popularCommentsHtml, "text/html");
    return { found: true, ...extractBookDetails(detailDoc, match, popularCommentsDoc) };
  }

  function fetchDouban(url) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: "DOUBAN_FETCH_PAGE", url }, (response) => {
        if (chrome.runtime.lastError) return reject(new Error("Could not connect to the Douban lookup service."));
        if (!response?.ok) return reject(new Error(response?.error || "Douban lookup failed."));
        resolve(response.html);
      });
    });
  }

  function chooseBookResult(doc, query) {
    const embeddedResults = extractDoubanSearchData(doc);
    if (embeddedResults?.items?.length) {
      const candidates = embeddedResults.items
        .map((item) => {
          const url = normalizeSubjectUrl(item.url || `https://book.douban.com/subject/${item.id}/`);
          const title = String(item.title || "").trim();
          const text = String(item.abstract || "").trim();
          return url ? { url, title, text, authorHint: text.split("/")[0]?.trim() || "", score: titleMatchScore(query, title) } : null;
        })
        .filter((candidate) => candidate && candidate.score > 0);
      // Douban's own ranking is useful for short titles that have many unrelated editions.
      // Stable sorting retains that order when several titles match equally well.
      candidates.sort((a, b) => b.score - a.score);
      if (candidates.length) return candidates[0];
    }

    const links = [...doc.querySelectorAll('a[href*="book.douban.com/subject/"]')];
    const candidates = [];
    const seen = new Set();
    for (const link of links) {
      const url = normalizeSubjectUrl(link.href);
      if (!url || seen.has(url)) continue;
      seen.add(url);
      const card = link.closest("li, .item-root, .item, .subject-item, [class*=result], [class*=item]") || link.parentElement;
      const text = (card?.textContent || link.textContent || "").replace(/\s+/g, " ").trim();
      const title = (link.textContent || link.getAttribute("title") || "").replace(/\s+/g, " ").trim();
      candidates.push({ url, title, text, score: titleMatchScore(query, title || text) });
    }
    candidates.sort((a, b) => b.score - a.score);
    const selected = candidates.find((candidate) => candidate.score > 0) || candidates[0];
    if (!selected) return null;
    const authorHint = selected.text.match(/([^/|]+?)\s*\/\s*(?:[^/|]*?)(?:\/|$)/)?.[1]?.trim() || "";
    return { ...selected, authorHint };
  }

  function extractDoubanSearchData(doc) {
    for (const script of doc.scripts) {
      const source = script.textContent || "";
      const assignment = source.indexOf("window.__DATA__");
      if (assignment === -1) continue;
      const start = source.indexOf("{", assignment);
      if (start === -1) continue;
      let depth = 0;
      let inString = false;
      let escaped = false;
      for (let i = start; i < source.length; i += 1) {
        const char = source[i];
        if (inString) {
          if (escaped) escaped = false;
          else if (char === "\\") escaped = true;
          else if (char === '"') inString = false;
          continue;
        }
        if (char === '"') inString = true;
        else if (char === "{") depth += 1;
        else if (char === "}") {
          depth -= 1;
          if (depth === 0) {
            try { return JSON.parse(source.slice(start, i + 1)); } catch { break; }
          }
        }
      }
    }
    return null;
  }

  function titleMatchScore(query, candidate) {
    const normalize = (value) => value.toLocaleLowerCase().replace(/[’'“”"：:，,！!？?]/g, "").replace(/\s+/g, " ").trim();
    const q = normalize(query);
    const c = normalize(candidate);
    if (!q || !c) return 0;
    if (c.startsWith(q) || q.startsWith(c)) return 70;
    if (c.includes(q) || q.includes(c)) return 50;
    const words = q.split(" ").filter((word) => word.length > 1);
    return words.length ? Math.round(words.filter((word) => c.includes(word)).length / words.length * 20) : 0;
  }

  function normalizeSubjectUrl(href) {
    try {
      const url = new URL(href);
      if (url.hostname !== "book.douban.com" || !/^\/subject\/\d+\/?$/.test(url.pathname)) return null;
      return `https://book.douban.com${url.pathname}`;
    } catch { return null; }
  }

  function extractBookDetails(doc, match, popularCommentsDoc) {
    const title = doc.querySelector("#wrapper h1, h1")?.textContent?.replace(/\s+/g, " ").trim() || match.title || "Douban book";
    const info = doc.querySelector("#info")?.textContent || "";
    const authorLink = doc.querySelector('#info a[href*="/search/"]');
    const author = authorLink?.textContent?.trim() || parseInfoValue(info, "作者") || match.authorHint || "Author not listed";
    const ratingNode = doc.querySelector("#interest_sectl .rating_num, .rating_num, [property='v:average']");
    const rating = ratingNode?.getAttribute("content") || ratingNode?.textContent?.trim() || "Not rated";
    const starNode = doc.querySelector("#interest_sectl .rating_right [class*='bigstar']");
    const starClass = [...(starNode?.classList || [])].find((name) => /^bigstar\d{2}$/.test(name));
    const starRating = starClass ? Number(starClass.slice(7)) / 10 : (Number.parseFloat(rating) || 0) / 2;
    const ratingCount = doc.querySelector("#interest_sectl .rating_people, .rating_people")?.textContent?.replace(/\s+/g, " ").trim() || "";
    const commentItems = [...popularCommentsDoc.querySelectorAll("li.comment-item")];
    const comments = commentItems
      .map((item) => {
        const short = item.querySelector(".comment-content .short");
        const stars = item.querySelector(".comment-info .user-stars");
        const ratingClass = [...(stars?.classList || [])].find((name) => /^allstar\d+$/.test(name));
        return {
          text: short?.textContent.replace(/\s+/g, " ").trim() || "",
          user: item.querySelector(".comment-info a[href*='/people/']")?.textContent.trim() || "",
          rating: ratingClass ? Math.round(Number(ratingClass.slice(7)) / 10) : 0,
          ratingLabel: stars?.getAttribute("title") || "",
          votes: item.querySelector(".comment-vote .vote-count")?.textContent.trim() || "0",
          date: item.querySelector(".comment-time")?.textContent.trim() || "",
          location: item.querySelector(".comment-location")?.textContent.trim() || ""
        };
      })
      .filter((comment) => comment.text)
      .slice(0, 5);
    const commentCount = popularCommentsDoc.querySelector(".mod-hd .pl")?.textContent.match(/\d+/)?.[0] || "";
    return { title, author, rating, starRating, ratingCount, comments, commentCount, url: match.url };
  }

  function parseInfoValue(info, label) {
    const line = info.split(/\n+/).find((part) => part.trim().startsWith(`${label} :`) || part.trim().startsWith(`${label}:`));
    return line?.replace(new RegExp(`^\\s*${label}\\s*[:：]\\s*`), "").trim() || "";
  }

  function scheduleLookup() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(lookup, 700);
  }

  if (onProductPage()) {
    scheduleLookup();
    new MutationObserver(() => {
      scheduleLookup();
      positionPanel();
    }).observe(document.documentElement, { subtree: true, childList: true, characterData: true });
    window.addEventListener("scroll", () => positionPanel(), { passive: true });
    window.addEventListener("resize", () => positionPanel(), { passive: true });
    let lastPath = location.pathname;
    setInterval(() => {
      if (location.pathname !== lastPath) {
        lastPath = location.pathname;
        lastLookupKey = "";
        scheduleLookup();
      }
    }, 800);
  }
})();
