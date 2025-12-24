import { getSupabaseClient } from "./supabase-client.js";

const $ = (id) => document.getElementById(id);

async function sb() {
  return await getSupabaseClient();
}

async function refreshUI() {
  const client = await sb();
  const { data, error } = await client.auth.getSession();
  if (error) console.error(error);

  const authed = !!data?.session;

  $("loginPanel").style.display = authed ? "none" : "block";
  $("adminPanel").style.display = authed ? "block" : "none";
  $("logoutBtn").style.display = authed ? "inline-block" : "none";

  if (authed) await loadAllAnnouncements();
}

async function doLogin(email, password) {
  const client = await sb();
  return await client.auth.signInWithPassword({ email, password });
}

async function doLogout() {
  const client = await sb();
  return await client.auth.signOut();
}

async function addAnnouncement(payload) {
  const client = await sb();
  return await client.from("announcements").insert([payload]);
}

async function deleteAnnouncement(id) {
  const client = await sb();
  return await client.from("announcements").delete().eq("id", id);
}

async function togglePublished(id, published) {
  const client = await sb();
  return await client.from("announcements").update({ published }).eq("id", id);
}

async function loadAllAnnouncements() {
  const mount = $("annList");
  mount.textContent = "Loading…";

  const client = await sb();
  const { data, error } = await client
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
    m.textContent =
      `${new Date(item.created_at).toLocaleString()} • ` +
      (item.published ? "PUBLISHED" : "DRAFT");

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
  $("loginForm").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    $("loginMsg").textContent = "";

    const email = $("loginEmail").value.trim();
    const pass = $("loginPass").value;

    try {
      const { error } = await doLogin(email, pass);
      if (error) throw error;
      await refreshUI();
    } catch (e) {
      console.error(e);
      $("loginMsg").textContent = "Login failed.";
    }
  });

  $("logoutBtn").addEventListener("click", async () => {
    await doLogout();
    await refreshUI();
  });

  $("annForm").addEventListener("submit", async (ev) => {
    ev.preventDefault();

    const payload = {
      title: $("annTitle").value.trim(),
      body: $("annBody").value.trim(),
      published: $("annPublished").checked,
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

(async function init() {
  console.log("Admin script running.");
  wireUI();
  await refreshUI();
})();
