import { getSupabaseClient } from "./supabase-client.js";

function escapeText(s) {
  // Defensive: render via textContent later, but keep a safe helper in case.
  return String(s ?? "");
}

async function loadAnnouncements() {
  const mount = document.getElementById("announcements");
  try {
    const sb = await getSupabaseClient();
    const { data, error } = await sb
      .from("announcements")
      .select("id,title,body,created_at")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;

    mount.textContent = "";
    if (!data || data.length === 0) {
      mount.textContent = "No announcements yet.";
      return;
    }

    for (const item of data) {
      const card = document.createElement("div");
      card.className = "card";

      const title = document.createElement("div");
      title.className = "card-title";
      title.textContent = escapeText(item.title);

      const body = document.createElement("div");
      body.className = "card-body";
      body.textContent = escapeText(item.body);

      const meta = document.createElement("div");
      meta.className = "card-meta";
      meta.textContent = new Date(item.created_at).toLocaleString();

      card.appendChild(title);
      card.appendChild(body);
      card.appendChild(meta);
      mount.appendChild(card);
    }
  } catch (e) {
    mount.textContent = "Error loading announcements.";
    console.error(e);
  }
}

async function wireSignup() {
  const form = document.getElementById("signupForm");
  const msg = document.getElementById("signupMsg");
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    msg.textContent = "";
    try {
      const email = document.getElementById("email").value.trim().toLowerCase();
      if (!email || !email.includes("@")) {
        msg.textContent = "Please enter a valid email.";
        return;
      }
      const sb = await getSupabaseClient();
      const { error } = await sb.from("mailing_list").insert([{ email }]);
      if (error) throw error;
      msg.textContent = "Saved.";
      form.reset();
    } catch (e) {
      console.error(e);
      msg.textContent = "Could not save email (it may already be saved).";
    }
  });
}

loadAnnouncements();
wireSignup();
