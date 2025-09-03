// script.js
document.addEventListener("DOMContentLoaded", () => {
  const urlInput = document.getElementById("urlInput");
  const openBtn = document.getElementById("openBtn");
  const openNewBtn = document.getElementById("openNewBtn");
  const siteFrame = document.getElementById("siteFrame");
  const overlayMsg = document.getElementById("overlayMsg");
  const status = document.getElementById("status");
  const siteInfo = document.getElementById("siteInfo");
  const tryEmbed = document.getElementById("tryEmbed");
  const showImages = document.getElementById("showImages");
  const imagesPanel = document.getElementById("imagesPanel");
  const imageHolder = document.getElementById("imageHolder");
  const randomImageBtn = document.getElementById("randomImageBtn");
  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");
  const engineSelect = document.getElementById("engineSelect");
  const yearSpan = document.getElementById("year");

  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  // ユーティリティ: URL を正規化
  function normalizeUrl(raw) {
    if (!raw) return "";
    raw = raw.trim();
    if (/^https?:\/\//i.test(raw)) return raw;
    return "https://" + raw;
  }

  // iframe の埋め込み可否を簡易判定するロジック
  // 方法: load イベントを監視して一定時間内に onload が来ない or 空白のままなら埋め込み失敗と判断して新しいタブを開く（フォールバック）
  let embedTimeoutId = null;
  const EMBED_TIMEOUT_MS = 1600;

  function showStatus(text, color = "") {
    status.textContent = "状態: " + text;
    status.style.color = color || "";
  }

  function clearFrameOverlay() {
    overlayMsg.classList.add("hidden");
    overlayMsg.textContent = "";
  }

  function setFrameOverlay(msg) {
    overlayMsg.textContent = msg;
    overlayMsg.classList.remove("hidden");
  }

  // サイト情報表示更新
  function updateSiteInfo(url, embedded) {
    const source = embedded ? "iframe埋め込み" : "新しいタブ";
    siteInfo.innerHTML = `<strong>サイト:</strong> ${escapeHtml(url)} <br><strong>表示方法:</strong> ${source}`;
  }

  // HTML をテキストとして安全に表示する（XSS対策）
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[m]));
  }

  // 埋め込みを試みる関数
  function tryOpen(url) {
    clearFrameOverlay();
    showStatus("読み込み中...", "orange");

    // 最初に iframe src をセットして onload を待つ
    let loaded = false;

    function onFrameLoad() {
      loaded = true;
      clearTimeout(embedTimeoutId);
      try {
        // 同一オリジンでないと中身の確認はできないため、ここでは単純にロード成功と判断
        showStatus("埋め込みに成功（表示中）", "green");
        updateSiteInfo(url, true);
        clearFrameOverlay();
      } catch (err) {
        // アクセス拒否（CORS）等でもloadは来る場合がある — それでも見た目が空白になる場合もある
        showStatus("埋め込みに成功（ただし同一オリジンで詳細確認不可）", "green");
        updateSiteInfo(url, true);
        clearFrameOverlay();
      }
    }

    function onEmbedFail() {
      if (loaded) return;
      // 埋め込みできないと判断したら新タブで開く
      showStatus("埋め込み不可（新しいタブで開きます）", "crimson");
      updateSiteInfo(url, false);
      setFrameOverlay("このサイトは埋め込みを拒否しています。新しいタブで開きます。");
      // 少しだけ表示してから新しいタブを開く（ユーザーに通知）
      setTimeout(() => {
        window.open(url, "_blank", "noopener");
        clearFrameOverlay();
      }, 700);
    }

    // onload ハンドラ設定
    siteFrame.onload = onFrameLoad;

    // タイムアウトで失敗判定
    embedTimeoutId = setTimeout(onEmbedFail, EMBED_TIMEOUT_MS);

    // finally set src
    siteFrame.src = url;
  }

  // 新しいタブで開く
  function openInNewTab(url) {
    showStatus("新しいタブで開く", "black");
    updateSiteInfo(url, false);
    window.open(url, "_blank", "noopener");
  }

  // ボタン: 開く（埋め込み試行）
  openBtn.addEventListener("click", () => {
    const raw = urlInput.value;
    if (!raw) return alert("URLを入力してください。");
    const url = normalizeUrl(raw);
    if (tryEmbed.checked) {
      tryOpen(url);
    } else {
      openInNewTab(url);
    }
  });

  // ボタン: 新しいタブで開く（常に）
  openNewBtn.addEventListener("click", () => {
    const raw = urlInput.value;
    if (!raw) return alert("URLを入力してください。");
    const url = normalizeUrl(raw);
    openInNewTab(url);
  });

  // 検索フォーム（別タブで検索）
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = (searchInput.value || "").trim();
    if (!q) return;
    const engine = engineSelect.value;
    const searchUrl = engine + encodeURIComponent(q);
    window.open(searchUrl, "_blank", "noopener");
  });

  // 画像関連
  showImages.addEventListener("change", () => {
    if (showImages.checked) {
      imagesPanel.classList.remove("hidden");
    } else {
      imagesPanel.classList.add("hidden");
    }
  });

  // ランダム画像を表示（picsum）
  function showRandomImage() {
    const w = 1200;
    const h = 700;
    const rnd = Math.floor(Math.random() * 1000000);
    const url = `https://picsum.photos/${w}/${h}?random=${rnd}`;
    imageHolder.innerHTML = "";
    const img = document.createElement("img");
    img.src = url;
    img.alt = "ランダム画像";
    img.loading = "lazy";
    img.addEventListener("load", () => {
      imageHolder.appendChild(img);
    });
    img.addEventListener("error", () => {
      imageHolder.innerHTML = `<div class="placeholder">画像の読み込みに失敗しました</div>`;
    });
  }

  randomImageBtn.addEventListener("click", showRandomImage);

  // Enter で URL を開く（input にフォーカス時）
  urlInput.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      openBtn.click();
    }
  });

  // 初期表示
  showStatus("待機中");
  imagesPanel.classList.add("hidden");
});
