import { getSupabaseClient } from "./supabase-client.js";

const sb = getSupabaseClient();

async function submitStory(payload) {
  const sb = await getSupabaseClient();
  return await sb.from("submissions").insert([payload]);
}

storyForm.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  msg.textContent = "";

  // Honeypot: if filled, silently accept but do nothing
  if (website.value.trim()) {
    msg.textContent = "Received. Thank you.";
    ev.target.reset();
    return;
  }

  const story_text = storyText.value.trim();
  if (story_text.length < 20) {
    msg.textContent = "Write a little more so we understand the moment.";
    return;
  }

  const payload = {
    display_name: displayName.value.trim() || null,
    contact_email: contactEmail.value.trim().toLowerCase() || null,
    story_text,
  };

  try {
    const { error } = await submitStory(payload);
    if (error) throw error;

    msg.textContent = "Received. Thank you.";
    ev.target.reset();
  } catch (e) {
    console.error(e);
    msg.textContent = "Could not submit right now. Try again later.";
  }
});
