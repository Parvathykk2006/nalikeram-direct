/* Nalikeram Direct - app.js */
const $ = (id) => document.getElementById(id);

// SAMPLE reference prices. Replace with real local market rates.
const REFERENCE = [
  { name: "Fresh coconut", unit: "per piece", price: 30 },
  { name: "Copra (dry coconut)", unit: "per kg", price: 200 },
  { name: "Coconut oil", unit: "per litre", price: 300 }
];

// Address of your backend.
// On your own computer it uses localhost. On the live site it uses PRODUCTION_API.
// After deploying the backend, replace the address in PRODUCTION_API.
const PRODUCTION_API = "https://nalikeram-direct.onrender.com";
  location.hostname === "" || location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : PRODUCTION_API;

/* ---------- Safety net: shows a bar if something breaks ---------- */
function banner(text, color) {
  const b = $("banner");
  b.textContent = text;
  b.style.background = color || "";
  b.classList.remove("hidden");
}
window.addEventListener("error", (e) => banner("Error: " + e.message));
window.addEventListener("unhandledrejection", (e) =>
  banner("Error: " + ((e.reason && e.reason.message) || e.reason))
);

/* ---------- Saving data in the browser (with a backup box) ---------- */
const tempBox = {};
let canStore = true;
try {
  localStorage.setItem("nd_t", "1");
  localStorage.removeItem("nd_t");
} catch (e) {
  canStore = false;
}
const load = (k, d) => {
  try {
    const r = canStore ? localStorage.getItem(k) : tempBox[k];
    return r === null || r === undefined ? d : JSON.parse(r);
  } catch (e) {
    return d;
  }
};
const save = (k, v) => {
  const s = JSON.stringify(v);
  if (canStore) localStorage.setItem(k, s);
  else tempBox[k] = s;
};
const drop = (k) => {
  if (canStore) localStorage.removeItem(k);
  else delete tempBox[k];
};

/* ---------- Small helpers ---------- */
const esc = (t) => {
  const d = document.createElement("div");
  d.textContent = t;
  return d.innerHTML;
};

let toastTimer;
function toast(msg, bad) {
  const el = $("toast");
  el.textContent = msg;
  el.className = "toast show" + (bad ? " bad" : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.className = "toast"), 3000);
}

async function hashPassword(text) {
  try {
    if (window.crypto && window.crypto.subtle) {
      const bytes = new TextEncoder().encode(text);
      const buf = await window.crypto.subtle.digest("SHA-256", bytes);
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch (e) {
    /* use the backup below */
  }
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
  return "x" + h.toString(16);
}

const session = () => load("nd_session", null);
// Listings now come from the backend (kept here after loading)
let listings = [];
async function refreshListings() {
  const slow = setTimeout(() => toast("Waking up the server, please wait up to a minute..."), 4000);
  try {
    const res = await fetch(API + "/api/listings");
    if (!res.ok) throw new Error("Server error " + res.status);
    listings = await res.json();
  } catch (e) {
    toast("Could not reach the server. Try again in a minute.", true);
  }
  clearTimeout(slow);
  render();
}
const empty = (text) => '<div class="empty"><span>🥥</span>' + text + "</div>";

/* ---------- Drawing the pages ---------- */
function cardHTML(l, mine) {
  const phone = esc(l.sellerPhone);
  const callable = /^[6-9][0-9]{9}$/.test(l.sellerPhone);
  const actions = mine
    ? '<button type="button" class="btn ghost danger small" data-del="' + l.id + '">Remove listing</button>'
    : callable
    ? '<div class="lactions"><a class="btn" href="tel:' + phone + '">Call</a>' +
      '<a class="btn ghost" target="_blank" rel="noopener" href="https://wa.me/91' + phone + '">WhatsApp</a></div>'
    : '<p class="lqty">' + (l.id < 1000 ? "Sample listing (demo data)" : "Contact: " + phone) + "</p>";
  return (
    '<article class="lcard"><div class="lhead"><span class="avatar">' + esc(l.sellerName.charAt(0).toUpperCase()) +
    "</span><div><strong>" + esc(l.sellerName) + "</strong><small>" + esc(l.village) + "</small></div>" +
    '<span class="pill ' + (l.quality === "good" ? "good" : "average") + '">' + (l.quality === "good" ? "Good" : "Average") + "</span></div>" +
    '<div class="lprice">₹' + esc(String(l.price)) + "<small>per coconut</small></div>" +
    '<p class="lqty">' + esc(String(l.qty)) + " coconuts available</p>" + actions + "</article>"
  );
}

function renderSeller(s, all) {
  const mine = all.filter((l) => l.sellerPhone === s.phone);
  $("sellerHello").textContent = "Welcome, " + s.name;
  $("stat1").textContent = mine.length;
  $("stat2").textContent = mine.reduce((n, l) => n + l.qty, 0);
  $("stat3").textContent = mine.length
    ? "₹" + Math.round(mine.reduce((n, l) => n + l.price, 0) / mine.length)
    : "-";
  $("myListings").innerHTML = mine.length
    ? mine.map((l) => cardHTML(l, true)).join("")
    : empty("You have no listings yet. Add your first one above.");
  if (!$("lVillage").value) $("lVillage").value = s.village || "";
}

function renderBuyer(s, all) {
  const q = $("searchBox").value.trim().toLowerCase();
  const list = all.filter((l) => (l.village + " " + l.sellerName).toLowerCase().includes(q));
  if ($("sortBox").value === "low") list.sort((a, b) => a.price - b.price);
  $("buyerHello").textContent = "Welcome, " + s.name;
  $("resultCount").textContent = list.length + (list.length === 1 ? " listing" : " listings");
  $("allListings").innerHTML = list.length
    ? list.map((l) => cardHTML(l, false)).join("")
    : empty("No listings match your search. Try another place.");
}

function render() {
  const s = session();
  $("landing").classList.toggle("hidden", !!s);
  $("sellerView").classList.toggle("hidden", !(s && s.role === "seller"));
  $("buyerView").classList.toggle("hidden", !(s && s.role === "buyer"));
  $("navGuest").classList.toggle("hidden", !!s);
  $("navUser").classList.toggle("hidden", !s);
  if (s) {
    $("navName").textContent = s.name;
    const all = listings;
    if (s.role === "seller") renderSeller(s, all);
    else renderBuyer(s, all);
  }
}

/* ---------- Login / sign-up window ---------- */
let role = "seller";
let mode = "login";

function paintAuth() {
  document.querySelectorAll("[data-r]").forEach((b) => b.classList.toggle("on", b.dataset.r === role));
  document.querySelectorAll("[data-m]").forEach((b) => b.classList.toggle("on", b.dataset.m === mode));
  $("loginForm").classList.toggle("hidden", mode !== "login");
  $("signupForm").classList.toggle("hidden", mode !== "signup");
  $("villageRow").classList.toggle("hidden", role !== "seller");
  $("authTitle").textContent = mode === "login" ? "Welcome back" : "Create your account";
  $("authMsg").textContent = "";
}
function openAuth(r, m) {
  role = r;
  mode = m;
  paintAuth();
  $("authModal").classList.remove("hidden");
  document.body.classList.add("lock");
}
function closeAuth() {
  $("authModal").classList.add("hidden");
  document.body.classList.remove("lock");
}

document.querySelectorAll("[data-open]").forEach((b) =>
  b.addEventListener("click", () => {
    const p = b.dataset.open.split(":");
    openAuth(p[0], p[1]);
  })
);
document.querySelectorAll("[data-r]").forEach((b) =>
  b.addEventListener("click", () => { role = b.dataset.r; paintAuth(); })
);
document.querySelectorAll("[data-m]").forEach((b) =>
  b.addEventListener("click", () => { mode = b.dataset.m; paintAuth(); })
);
document.querySelectorAll("[data-eye]").forEach((b) =>
  b.addEventListener("click", () => {
    const ids = b.dataset.eye.split(",");
    const show = $(ids[0]).type === "password";
    ids.forEach((id) => ($(id).type = show ? "text" : "password"));
    b.textContent = show ? "Hide" : "Show";
  })
);
$("closeAuth").addEventListener("click", closeAuth);
$("authModal").addEventListener("click", (e) => { if (e.target === $("authModal")) closeAuth(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAuth(); });

function finishLogin(user) {
  save("nd_session", { role: user.role, name: user.name, phone: user.phone, village: user.village || "" });
  $("signupForm").reset();
  $("loginForm").reset();
  closeAuth();
  render();
  refreshListings();
  toast("Welcome, " + user.name + "!");
}

$("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const say = (t) => ($("authMsg").textContent = t);
  try {
    const name = $("suName").value.trim();
    const phone = $("suPhone").value.replace(/\s+/g, "");
    const village = $("suVillage").value.trim();
    const pw = $("suPassword").value;
    if (!name || !phone || !pw || (role === "seller" && !village)) return say("Please fill in all the boxes.");
    if (!/^[A-Za-z0-9]{4,15}$/.test(phone)) return say("Phone number: use 4 to 15 letters or numbers, with no spaces or symbols.");
    if (pw.length < 6) return say("Password must be at least 6 characters.");
    if (pw !== $("suPassword2").value) return say("The two passwords are not the same.");

    const users = load("nd_users", []);
    if (users.some((u) => u.role === role && u.phone === phone))
      return say("This number is already registered. Use the Login tab.");

    const user = { role, name, phone, village, hash: await hashPassword(phone + ":" + pw) };
    users.push(user);
    save("nd_users", users);
    finishLogin(user);
  } catch (err) {
    banner("Sign up problem: " + err.message);
  }
});

$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const say = (t) => ($("authMsg").textContent = t);
  try {
    const phone = $("loginPhone").value.replace(/\s+/g, "");
    const pw = $("loginPassword").value;
    if (!phone || !pw) return say("Please fill in all the boxes.");
    const hash = await hashPassword(phone + ":" + pw);
    const user = load("nd_users", []).find((u) => u.role === role && u.phone === phone && u.hash === hash);
    if (!user) return say("Wrong phone number or password.");
    finishLogin(user);
  } catch (err) {
    banner("Login problem: " + err.message);
  }
});

$("logoutBtn").addEventListener("click", () => {
  drop("nd_session");
  render();
  toast("You are logged out.");
});

/* ---------- Listings ---------- */
$("listingForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const s = session();
  if (!s) return render();
  const village = $("lVillage").value.trim();
  const qty = Number($("lQty").value);
  const price = Number($("lPrice").value);
  if (!village || !(qty >= 1) || !(price >= 1)) return toast("Please fill in all the boxes.", true);

  try {
    const res = await fetch(API + "/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerName: s.name, sellerPhone: s.phone, village, qty, price, quality: $("lQuality").value })
    });
    if (!res.ok) {
      const info = await res.json().catch(() => ({}));
      throw new Error(info.error || "Server error " + res.status);
    }
    $("listingForm").reset();
    toast("Listing added!");
    await refreshListings();
  } catch (err) {
    toast((err && err.name === "TypeError") ? "Cannot reach the server. Is it running?" : err.message, true);
  }
});

$("myListings").addEventListener("click", async (e) => {
  const b = e.target.closest("[data-del]");
  if (!b) return;
  try {
    const res = await fetch(API + "/api/listings/" + b.dataset.del, { method: "DELETE" });
    if (!res.ok) throw new Error("Server error " + res.status);
    toast("Listing removed.");
    await refreshListings();
  } catch (err) {
    toast("Could not remove the listing. Try again.", true);
  }
});

$("searchBox").addEventListener("input", render);
$("sortBox").addEventListener("change", render);

/* ---------- Start ---------- */
$("priceRows").innerHTML = REFERENCE.map(
  (p) => '<div class="prow"><span>' + p.name + "</span><b>₹" + p.price + "</b><span>" + p.unit + "</span></div>"
).join("");
$("refHint").textContent = "Reference price today (sample): ₹" + REFERENCE[0].price + " per coconut";
render();
if (session()) refreshListings();
if (!canStore) banner("Your browser is blocking saving. The site works, but data is lost when you refresh.", "#b26a00");
window.appStarted = true;
