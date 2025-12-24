import { getSupabaseClient } from "../scripts/supabase-client.js";

function el(id){ return document.getElementById(id); }

async function requireSupabase() {
  return await getSupabaseClient();
}

async function refreshSessionUI() {
  const sb = await requireSupabase();
  const { data } = await sb.auth.getSession();
  const authed = !!data.session;

  el("loginPanel").style.display = authed ? "none" : "block";
  el("adminPanel").style.display = authed ? "block" : "none";
  el("logoutBtn").style.display = authed ? "inline-block" : "none";

  if (authed) {
    await loadAllAnnouncements();
  }
}

async function login(email, password) {
  const sb = await requireSupabase();
  return await sb.auth.signInWithPassword({ email, password });
}

async function logout() {
  const sb = await requireSupabase();
  await sb.auth.signOut();
}

async function addAnnouncement(payload) {
  const sb = await requireSupabase();
  return await sb.from("announcements").insert([payload]);
}

async function deleteAnnouncement(id) {
  const sb = await requireSupabase();
  return await sb.from("announcements").delete().eq("id", id);
}

async function togglePublished(id, published) {
  const sb = await requireSupabase();
  return await sb.from("announcements").update({ published }).eq("id", id);
}

async function loadAllAnnouncements() {
  const mount = el("annList");
  mount.textContent = "Loading…";
  const sb = await requireSupabase();
  const { data, error } = await sb
    .from("announcements")
    .select("id,title,body,published,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error(error);
    mount.textContent = "Error loading announcements.";
    return;
  }

  mount.textContent = "";
  if (!data || data.length === 0) {
    mount.textContent = "No announcements.";
    return;
  }

  for (const item of data) {
    const row = document.createElement("div");
    row.className = "admin-row";

    const left = document.createElement("div");
    left.className = "admin-row-left";

    const t = document.createElement("div");
    t.className = "card-title";
    t.textContent = item.title;

    const b = document.createElement("div");
    b.className = "card-body";
    b.textContent = item.body;

    const m = document.createElement("div");
    m.className = "card-meta";
    m.textContent = ${new Date(item.created_at).toLocaleString()} • ;

    left.appendChild(t);
    left.appendChild(b);
    left.appendChild(m);

    const right = document.createElement("div");
    right.className = "admin-row-right";

    const pubBtn = document.createElement("button");
    pubBtn.textContent = item.published ? "Unpublish" : "Publish";
    pubBtn.addEventListener("click", async () => {
      const { error: e2 } = await togglePublished(item.id, !item.published);
      if (e2) alert(e2.message);
      await loadAllAnnouncements();
    });

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", async () => {
      if (!confirm("Delete this announcement?")) return;
      const { error: e2 } = await deleteAnnouncement(item.id);
      if (e2) alert(e2.message);
      await loadAllAnnouncements();
    });

    right.appendChild(pubBtn);
    right.appendChild(delBtn);

    row.appendChild(left);
    row.appendChild(right);
    mount.appendChild(row);
  }
}

function wireUI() {
  el("loginForm").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    el("loginMsg").textContent = "";
    const email = el("loginEmail").value.trim();
    const pass = el("loginPass").value;
    try {
      const { error } = await login(email, pass);
      if (error) throw error;
      await refreshSessionUI();
    } catch (e) {
      console.error(e);
      el("loginMsg").textContent = "Login failed.";
    }
  });

  el("logoutBtn").addEventListener("click", async () => {
    await logout();
    await refreshSessionUI();
  });

  el("annForm").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const payload = {
      title: el("annTitle").value.trim(),
      body: el("annBody").value.trim(),
      published: el("annPublished").checked
    };
    try {
      const { error } = await addAnnouncement(payload);
      if (error) throw error;
      ev.target.reset();
      await loadAllAnnouncements();
    } catch (e) {
      console.error(e);
      alert("Could not add announcement. Check RLS/admin policy.");
    }
  });
}

(async function init(){
  wireUI();
  await refreshSessionUI();
})();
