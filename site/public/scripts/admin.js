import { getSupabaseClient } from "./supabase-client.js";

const $ = (id) => document.getElementById(id);

// SINGLE Supabase instance for this page (no duplicate sb declarations)
let sbPromise = null;
function getSB() {
  if (!sbPromise) sbPromise = Promise.resolve(getSupabaseClient());
  return sbPromise;
}

function show(el, on) {
  if (!el) return;
  el.style.display = on ? "" : "none";
}

async function refreshUI() {
  const loginPanel = $("loginPanel");
  const adminPanel = $("adminPanel");
  const logoutBtn = $("logoutBtn");

  const sb = await getSB();
  const { data } = await sb.auth.getSession();
  const session = data?.session;

  if (!session) {
    show(loginPanel, true);
    show(adminPanel, false);
    show(logoutBtn, false);
    return;
  }

  show(loginPanel, false);
  show(adminPanel, true);
  show(logoutBtn, true);

  await loadAnnouncements();
}

async function loadAnnouncements() {
  const annList = $("annList");
  if (!annList) return;

  annList.textContent = "Loading…";
  const sb = await getSB();

  const { data, error } = await sb
    .from("announcements")
    .select("id,title,body,published,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error(error);
    annList.textContent = "Error loading announcements.";
    return;
  }

  if (!data || data.length === 0) {
    annList.textContent = "No announcements yet.";
    return;
  }

  annList.textContent = "";
  for (const a of data) {
    const row = document.createElement("div");
    row.className = "row";

    const left = document.createElement("div");
    left.className = "row-left";

    const t = document.createElement("div");
    t.className = "row-title";
    t.textContent = a.title;

    const b = document.createElement("div");
    b.className = "row-body";
    b.textContent = a.body;

    const m = document.createElement("div");
    m.className = "row-meta";
    m.textContent = `${a.published ? "Published" : "Draft"} • ${new Date(
      a.created_at
    ).toLocaleString()}`;

    left.appendChild(t);
    left.appendChild(b);
    left.appendChild(m);

    const right = document.createElement("div");
    right.className = "row-right";

    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = a.published ? "Unpublish" : "Publish";
    toggleBtn.addEventListener("click", async () => {
      try {
        const sb = await getSB();
        const { error } = await sb
          .from("announcements")
          .update({ published: !a.published })
          .eq("id", a.id);
        if (error) throw error;
        await loadAnnouncements();
      } catch (e) {
        console.error(e);
        alert("Could not update.");
      }
    });

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", async () => {
      if (!confirm("Delete this announcement?")) return;
      try {
        const sb = await getSB();
        const { error } = await sb
          .from("announcements")
          .delete()
          .eq("id", a.id);
        if (error) throw error;
        await loadAnnouncements();
      } catch (e) {
        console.error(e);
        alert("Could not delete.");
      }
    });

    right.appendChild(toggleBtn);
    right.appendChild(delBtn);

    row.appendChild(left);
    row.appendChild(right);
    annList.appendChild(row);
  }
}

function wireUI() {
  const loginForm = $("loginForm");
  const loginMsg = $("loginMsg");
  const logoutBtn = $("logoutBtn");
  const annForm = $("annForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      if (loginMsg) loginMsg.textContent = "";

      try {
        const email = $("loginEmail").value.trim();
        const password = $("loginPass").value;

        const sb = await getSB();
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;

        await refreshUI();
      } catch (e) {
        console.error(e);
        if (loginMsg) loginMsg.textContent = "Login failed.";
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        const sb = await getSB();
        await sb.auth.signOut();
      } finally {
        await refreshUI();
      }
    });
  }

  if (annForm) {
    annForm.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      try {
        const title = $("annTitle").value.trim();
        const body = $("annBody").value.trim();
        const published = $("annPublished").checked;

        const sb = await getSB();
        const { error } = await sb
          .from("announcements")
          .insert([{ title, body, published }]);

        if (error) throw error;

        ev.target.reset();
        await loadAnnouncements();
      } catch (e) {
        console.error(e);
        alert("Could not add announcement.");
      }
    });
  }
}

// Boot
wireUI();
refreshUI();
