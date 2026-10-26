const API = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"
).replace(/\/$/, "");
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const $ = (id) => document.getElementById(id);
const state = {
  user: null,
  boxes: [],
  dashboard: null,
  received: [],
  sent: [],
  receivedFilter: "all",
  sentFilter: "all",
  claimToken: null,
  claim: null,
  claimLoginRequested: false,
};
const DEFAULT_IMAGE = new URL("/soanpapdi.jpg", import.meta.url).toString();

function esc(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
function date(value) {
  if (!value) return "Date unavailable";
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2800);
}
function showModal(id) {
  $(id).classList.add("show");
}
function closeModal(id) {
  $(id).classList.remove("show");
}
function showOnly(id) {
  ["loginScreen", "claimScreen", "appShell"].forEach((x) =>
    $(x).classList.toggle("hidden", x !== id),
  );
}
function claimTokenFromPath() {
  const m = location.pathname.match(/^\/claim\/([^/]+)\/?$/);
  return m ? decodeURIComponent(m[1]) : null;
}
function api(path, options = {}) {
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };
  return fetch(`${API}${path}`, {
    ...options,
    headers,
    credentials: "include",
  }).then(async (res) => {
    if (res.status === 204) return null;
    const data = await res
      .json()
      .catch(() => ({ error: `Unexpected response (${res.status})` }));
    if (!res.ok) {
      const err = new Error(data.error || `Request failed (${res.status})`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  });
}
function setLoginError(message = "") {
  $("loginError").textContent = message;
}
function initGoogleButton() {
  if (!GOOGLE_CLIENT_ID) {
    setLoginError(
      "Add VITE_GOOGLE_CLIENT_ID to your .env file, then restart the frontend.",
    );
    return;
  }
  const tryInit = () => {
    if (!window.google?.accounts?.id) {
      setTimeout(tryInit, 250);
      return;
    }
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: onGoogleCredential,
      auto_select: false,
    });
    window.google.accounts.id.renderButton($("googleButton"), {
      theme: "outline",
      size: "large",
      shape: "pill",
      text: "continue_with",
      width: 300,
    });
  };
  tryInit();
}
async function onGoogleCredential(response) {
  setLoginError("Signing you in…");
  try {
    const data = await api("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential: response.credential }),
    });
    state.user = data.user;
    setLoginError("");
    if (state.claimToken) {
      await loadClaimPreview();
      showOnly("claimScreen");
    } else {
      await loadApp();
    }
  } catch (e) {
    setLoginError(`${e.message}${e.status ? ` (HTTP ${e.status})` : ""}`);
  }
}
async function checkSession() {
  try {
    const data = await api("/api/auth/me");
    state.user = data.user;
    return true;
  } catch {
    state.user = null;
    return false;
  }
}
async function start() {
  state.claimToken = claimTokenFromPath();
  if (state.claimToken) {
    showOnly("claimScreen");
    $("claimAction").textContent = "Sign in to claim";
    $("claimAction").onclick = () => {
      state.claimLoginRequested = true;
      showOnly("loginScreen");
      initGoogleButton();
    };
    $("claimBack").onclick = () => {
      history.replaceState({}, "", "/");
      state.claimToken = null;
      showOnly(state.user ? "appShell" : "loginScreen");
      if (state.user) loadApp();
      else initGoogleButton();
    };
    if (await checkSession()) {
      await loadClaimPreview();
    } else {
      await loadClaimPreview(true);
    }
    return;
  }
  if (await checkSession()) await loadApp();
  else {
    showOnly("loginScreen");
    initGoogleButton();
  }
}
async function loadApp() {
  showOnly("appShell");
  $("userName").textContent = state.user?.name || state.user?.email || "Member";
  $("userAvatar").src = state.user?.pictureUrl || DEFAULT_IMAGE;
  $("userAvatar").onerror = () => {
    $("userAvatar").src = DEFAULT_IMAGE;
  };
  try {
    const [dashboard, boxes, received, sent] = await Promise.all([
      api("/api/dashboard"),
      api("/api/boxes"),
      api("/api/transfers/received"),
      api("/api/transfers/sent"),
    ]);
    state.dashboard = dashboard;
    state.boxes = boxes.boxes || [];
    state.received = received.received || [];
    state.sent = sent.transfers || [];
    renderAll();
  } catch (e) {
    toast(`${e.message}. Check that the backend and database are running.`);
    if (e.status === 401) {
      state.user = null;
      showOnly("loginScreen");
      initGoogleButton();
    }
  }
}
function boxCard(box) {
  const image = box.imageUrl || DEFAULT_IMAGE;
  return `<article class="box-card"><div class="box-photo" style="background-image:url('${esc(image)}')"><span class="box-id">${esc(box.boxCode)}</span></div><div class="box-content"><span class="status">IN YOUR COLLECTION</span><h3>${esc(box.boxCode)}</h3><p>Currently with you<br>${Number(box._count?.journeys || 0)} recorded event${Number(box._count?.journeys || 0) === 1 ? "" : "s"}</p><div class="box-actions"><button class="btn btn-green" data-pass="${esc(box.boxCode)}">↗ Pass this box</button><button class="btn btn-light" data-journey="${esc(box.boxCode)}">View journey</button></div></div></article>`;
}
function renderBoxes() {
  const html =
    state.boxes.map(boxCard).join("") ||
    '<div class="empty"><b>No boxes in your collection yet</b>Add a box to begin your journey, or claim one sent to you.</div>';
  $("dashBoxes").innerHTML =
    state.boxes.slice(0, 3).map(boxCard).join("") ||
    '<div class="empty"><b>Your collection starts here</b>Add your first Soan Papdi box to get started.</div>';
  $("allBoxes").innerHTML = html;
  $("statOwned").textContent =
    state.dashboard?.stats?.ownedBoxes ?? state.boxes.length;
  $("dashViewAll").onclick = () => navigate("inventory");
  document
    .querySelectorAll("[data-pass]")
    .forEach((b) => (b.onclick = () => startPass(b.dataset.pass)));
  document
    .querySelectorAll("[data-journey]")
    .forEach((b) => (b.onclick = () => trackBox(b.dataset.journey)));
}
function renderReceived() {
  let items = state.received;
  if (state.receivedFilter === "owned")
    items = items.filter((x) => x.currentlyOwnedByMe);
  if (state.receivedFilter === "passed")
    items = items.filter((x) => !x.currentlyOwnedByMe);
  $("receivedList").innerHTML = items.length
    ? items
        .map(
          (j) =>
            `<div class="list-row"><div class="mini-photo" style="background-image:url('${esc(j.box?.imageUrl || DEFAULT_IMAGE)}')"></div><div class="list-info"><b>${esc(j.box?.boxCode || "Box")} <span class="status ${j.currentlyOwnedByMe ? "" : "gold"}">${j.currentlyOwnedByMe ? "STILL WITH YOU" : "PASSED ON"}</span></b><small>Received from ${esc(j.fromOwner?.name || "a club member")} · ${date(j.createdAt)}<br>Current status: ${j.currentlyOwnedByMe ? "you own this box" : "no longer in your collection"}</small></div><button class="btn btn-light" data-journey="${esc(j.box?.boxCode || "")}">Journey</button></div>`,
        )
        .join("")
    : '<div class="empty"><b>No received boxes in this filter</b>Boxes you receive will stay in your history, even after you pass them on.</div>';
  $("receivedList")
    .querySelectorAll("[data-journey]")
    .forEach((b) => (b.onclick = () => trackBox(b.dataset.journey)));
  $("statReceived").textContent =
    state.dashboard?.stats?.receivedCount ?? state.received.length;
}
function renderSent() {
  let items = state.sent;
  if (state.sentFilter === "pending")
    items = items.filter((t) => t.status === "PENDING");
  if (state.sentFilter === "claimed")
    items = items.filter((t) => t.status === "CLAIMED");
  $("sentList").innerHTML = items.length
    ? items
        .map(
          (t) =>
            `<div class="list-row"><div class="mini-photo" style="background-image:url('${esc(t.box?.imageUrl || DEFAULT_IMAGE)}')"></div><div class="list-info"><b>${esc(t.box?.boxCode || "Box")} <span class="status ${t.status === "CLAIMED" ? "" : "gold"}">${esc(t.status)}</span></b><small>${t.recipient?.name ? `Claimed by ${esc(t.recipient.name)}` : "Claim link created"} · ${date(t.claimedAt || t.createdAt)}<br>${t.status === "PENDING" ? `Link expires ${date(t.expiresAt)}` : "Journey updated after claim"}</small></div><button class="btn btn-light" data-journey="${esc(t.box?.boxCode || "")}">Journey</button></div>`,
        )
        .join("")
    : '<div class="empty"><b>No sent boxes in this filter</b>Create a pass-on link from a box you own.</div>';
  $("sentList")
    .querySelectorAll("[data-journey]")
    .forEach((b) => (b.onclick = () => trackBox(b.dataset.journey)));
  $("statSent").textContent =
    state.dashboard?.stats?.sentCount ??
    state.sent.filter((t) => t.status === "CLAIMED").length;
  $("statPending").textContent =
    state.dashboard?.stats?.pendingCount ??
    state.sent.filter((t) => t.status === "PENDING").length;
}
function renderRecent() {
  const events = state.dashboard?.recentJourneys || [];
  $("recentList").innerHTML = events.length
    ? events
        .map(
          (j) =>
            `<div class="list-row"><div class="mini-photo" style="background-image:url('${esc(j.box?.imageUrl || DEFAULT_IMAGE)}')"></div><div class="list-info"><b>${esc(j.box?.boxCode || "Box")} · ${esc(j.fromOwner?.name || "Soan Papdi Club")} → ${esc(j.toOwner?.name || "Owner")}</b><small>${date(j.createdAt)} · ${esc(j.note || (j.eventType === "CREATED" ? "Box added to the club" : "Box transferred"))}</small></div><button class="btn btn-light" data-journey="${esc(j.box?.boxCode || "")}">View</button></div>`,
        )
        .join("")
    : '<div class="empty"><b>Your story starts here</b>Recent box movements will appear after you add or receive boxes.</div>';
  $("recentList")
    .querySelectorAll("[data-journey]")
    .forEach((b) => (b.onclick = () => trackBox(b.dataset.journey)));
}
function renderAll() {
  renderBoxes();
  renderReceived();
  renderSent();
  renderRecent();
}
function navigate(view) {
  document
    .querySelectorAll(".nav button")
    .forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  ["dashboard", "inventory", "received", "sent", "journey"].forEach((v) =>
    $(`${v}View`).classList.toggle("hidden", v !== view),
  );
  $("crumbCurrent").textContent =
    {
      dashboard: "Dashboard",
      inventory: "My Boxes",
      received: "Received by Me",
      sent: "Sent by Me",
      journey: "Track a Box",
    }[view] || "Dashboard";
  window.scrollTo({ top: 0, behavior: "smooth" });
}
async function trackBox(code) {
  navigate("journey");
  $("trackCode").value = code;
  $("journeyDetails").innerHTML =
    '<div class="empty">Loading box journey…</div>';
  try {
    const data = await api(`/api/boxes/${encodeURIComponent(code)}/journey`);
    const box = data.box;
    const journeys = box.journeys || [];
    $("journeyDetails").innerHTML =
      `<div class="journey-layout"><div><img class="journey-image" src="${esc(box.imageUrl || DEFAULT_IMAGE)}" alt="Soan Papdi box"><h3 style="margin:13px 0 5px">${esc(box.boxCode)}</h3><p class="muted">Current owner: <b>${esc(box.currentOwner?.name || "Unknown")}</b></p><span class="status">${journeys.length} JOURNEY EVENT${journeys.length === 1 ? "" : "S"}</span><div style="margin-top:15px"><button class="btn btn-light" id="copyJourneyLink">Copy public journey link</button></div></div><div><h3 style="margin-top:0">The journey so far</h3><ol class="journey-line">${journeys.map((j, i) => `<li><b>${j.eventType === "CREATED" ? "✨ Box added to the club" : "🎁 Box passed on"} · ${esc(j.fromOwner?.name || "Pass The Papdi")} → ${esc(j.toOwner?.name || "Unknown")}</b><small>${date(j.createdAt)}<br>${esc(j.note || "A new chapter in this box’s story.")}${i === journeys.length - 1 && box.currentOwner?.name === state.user?.name ? " · Back with you!" : ""}</small></li>`).join("")}</ol></div></div>`;
    $("copyJourneyLink").onclick = async () => {
      const url = `${location.origin}/?track=${encodeURIComponent(box.boxCode)}`;
      try {
        await navigator.clipboard.writeText(url);
        toast("Public journey link copied.");
      } catch {
        toast(url);
      }
    };
  } catch (e) {
    $("journeyDetails").innerHTML =
      `<div class="empty"><b>Couldn't find that journey</b>${esc(e.message)}<br>Check the box ID and try again.</div>`;
  }
}
function buyStart() {
  $("newBoxId").value = "Assigned by server after saving";
  $("imageUrl").value = "";
  $("imagePreview").style.backgroundImage = `url('${DEFAULT_IMAGE}')`;
  showModal("buyModal");
}
async function confirmBuy() {
  let imageUrl = $("imageUrl").value.trim();
  if (!imageUrl) {
    // toast("Please enter a direct image URL.");
    imageUrl = DEFAULT_IMAGE;
    // return;
  }
  try {
    const data = await api("/api/boxes", {
      method: "POST",
      body: JSON.stringify({ imageUrl }),
    });
    closeModal("buyModal");
    toast(`${data.box.boxCode} added to your collection! ✨`);
    await loadApp();
    navigate("inventory");
  } catch (e) {
    toast(e.message);
  }
}
function startPass(code) {
  if (!state.boxes.length) {
    toast("Add or claim a box before passing it on.");
    return;
  }
  $("passBoxSelect").innerHTML = state.boxes
    .map(
      (b) =>
        `<option value="${esc(b.boxCode)}" ${b.boxCode === code ? "selected" : ""}>${esc(b.boxCode)}</option>`,
    )
    .join("");
  $("friendMessage").value = "";
  showModal("passModal");
}
async function confirmPass() {
  const boxCode = $("passBoxSelect").value;
  const message = $("friendMessage").value.trim();
  try {
    const data = await api("/api/transfers", {
      method: "POST",
      body: JSON.stringify({ boxCode, ...(message ? { message } : {}) }),
    });
    closeModal("passModal");
    await loadApp();
    const opened = window.open(
      data.whatsappUrl,
      "_blank",
      "noopener,noreferrer",
    );
    if (!opened) {
      toast(
        "Claim link created. Popup blocked; copy it from the result below.",
      );
    }
    showTransferResult(data);
  } catch (e) {
    toast(e.message);
  }
}
function showTransferResult(data) {
  const existing = $("transferResult");
  if (existing) existing.remove();
  const box = document.createElement("div");
  box.id = "transferResult";
  box.className = "panel";
  box.style.marginTop = "16px";
  box.innerHTML = `<h3 style="margin-top:0">Your claim link is ready</h3><p class="muted">The box remains yours until the first eligible recipient explicitly claims it. You cannot cancel a pending link.</p><input readonly value="${esc(data.claimUrl)}" id="claimUrlOutput"><div class="modal-actions"><button class="btn btn-light" id="copyClaimUrl">Copy link</button><button class="btn btn-green" id="openWhatsApp">Open WhatsApp</button></div>`;
  const parent = $("sentView");
  parent.prepend(box);
  $("copyClaimUrl").onclick = async () => {
    try {
      await navigator.clipboard.writeText(data.claimUrl);
      toast("Claim link copied.");
    } catch {
      $("claimUrlOutput").select();
      document.execCommand("copy");
      toast("Claim link copied.");
    }
  };
  $("openWhatsApp").onclick = () =>
    window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
  navigate("sent");
}
async function loadClaimPreview(unauthenticated = false) {
  if (!state.claimToken) return;
  try {
    const data = await api(
      `/api/transfers/claim/${encodeURIComponent(state.claimToken)}`,
    );
    state.claim = data.claim;
    const video = $("claimVideo");

    video.src = "/animation.mp4";
    video.muted = true;
    video.loop = true;
    video.controls = false;

    // Start playback when the claim page loads.
    video.play().catch(() => {
      // Some browsers may delay autoplay until user interaction.
    });

    function escapeHtml(str = "") {
      return String(str).replace(
        /[&<>"']/g,
        (char) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[char],
      );
    }
    $("claimTitle").textContent = `${data.claim.boxCode} is waiting for you`;
    $("claimDescription").innerHTML =
      `Sent by <strong>${escapeHtml(data.claim.senderName)}</strong>. Sign in and explicitly claim it to make this box yours.`;
    $("claimMessage").textContent = data.claim.message || "";
    if (state.user) {
      $("claimAction").textContent = "Claim this box";
      $("claimAction").onclick = claimBox;
    } else {
      $("claimAction").textContent = "Sign in to claim";
      $("claimAction").onclick = () => {
        showOnly("loginScreen");
        initGoogleButton();
      };
    }
    $("claimError").textContent = unauthenticated
      ? "Sign in before claiming. Previewing the link does not transfer ownership."
      : "";
  } catch (e) {
    $("claimTitle").textContent = "This claim link is unavailable";
    $("claimDescription").textContent = e.message;
    $("claimAction").classList.add("hidden");
    $("claimError").textContent =
      "The link may have expired, already been claimed, or the box may have moved.";
  }
}
async function claimBox() {
  if (!state.user) {
    showOnly("loginScreen");
    initGoogleButton();
    return;
  }
  $("claimAction").disabled = true;
  $("claimError").textContent = "Claiming box…";
  try {
    const data = await api("/api/transfers/claim", {
      method: "POST",
      body: JSON.stringify({ token: state.claimToken }),
    });
    $("claimTitle").textContent = `${data.box.boxCode} is now yours!`;
    $("claimDescription").textContent =
      "The ownership change has been recorded in the permanent journey.";
    $("claimError").textContent = "";
    $("claimAction").textContent = "Open my collection";
    $("claimAction").disabled = false;
    $("claimAction").onclick = () => {
      history.replaceState({}, "", "/");
      state.claimToken = null;
      loadApp().then(() => navigate("inventory"));
    };
    toast(data.message || "Box claimed successfully!");
  } catch (e) {
    $("claimError").textContent = e.message;
    $("claimAction").disabled = false;
  }
}
async function logout() {
  try {
    await api("/api/auth/logout", { method: "POST" });
  } catch {}
  state.user = null;
  state.boxes = [];
  showOnly("loginScreen");
  initGoogleButton();
  toast("Signed out.");
}

document
  .querySelectorAll(".nav button")
  .forEach((b) => b.addEventListener("click", () => navigate(b.dataset.view)));
document
  .querySelectorAll("[data-close]")
  .forEach((b) =>
    b.addEventListener("click", () => closeModal(b.dataset.close)),
  );
document.querySelectorAll(".modal-wrap").forEach((m) =>
  m.addEventListener("click", (e) => {
    if (e.target === m) closeModal(m.id);
  }),
);
document.querySelectorAll("[data-received-filter]").forEach(
  (b) =>
    (b.onclick = () => {
      state.receivedFilter = b.dataset.receivedFilter;
      document
        .querySelectorAll("[data-received-filter]")
        .forEach((x) => x.classList.toggle("active", x === b));
      renderReceived();
    }),
);
document.querySelectorAll("[data-sent-filter]").forEach(
  (b) =>
    (b.onclick = () => {
      state.sentFilter = b.dataset.sentFilter;
      document
        .querySelectorAll("[data-sent-filter]")
        .forEach((x) => x.classList.toggle("active", x === b));
      renderSent();
    }),
);
$("heroBuy").onclick = buyStart;
$("invBuy").onclick = buyStart;
$("confirmBuy").onclick = confirmBuy;
$("heroPass").onclick = () => startPass(state.boxes[0]?.boxCode);
$("confirmPass").onclick = confirmPass;
$("trackButton").onclick = () => {
  const code = $("trackCode").value.trim();
  if (!code) {
    toast("Enter a box ID first.");
    return;
  }
  trackBox(code);
};
$("trackCode").addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("trackButton").click();
});
$("imageUrl").oninput = () => {
  const url = $("imageUrl").value.trim();
  if (/^https?:\/\//i.test(url))
    $("imagePreview").style.backgroundImage =
      `url("${url.replace(/["\\]/g, "")}")`;
  else $("imagePreview").style.backgroundImage = `url('${DEFAULT_IMAGE}')`;
};
$("logoutButton").onclick = logout;

const trackQuery = new URLSearchParams(location.search).get("track");
start().then(() => {
  if (trackQuery && state.user) trackBox(trackQuery);
});
