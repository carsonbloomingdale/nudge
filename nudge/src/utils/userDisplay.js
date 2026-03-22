function firstInitial(name) {
  const t = String(name ?? "").trim();
  if (!t) {
    return "";
  }
  const cp = [...t][0];
  return cp ? cp.toLocaleUpperCase() : "";
}

/**
 * Text for small avatar circles: first + last initial when both exist, else one initial, else username/email.
 */
export function displayUserAvatarLabel(user) {
  const fi = firstInitial(user?.firstName);
  const li = firstInitial(user?.lastName);
  if (fi && li) {
    return fi + li;
  }
  if (fi) {
    return fi;
  }
  if (li) {
    return li;
  }
  const raw = (user?.username || user?.email || "").trim();
  if (!raw) {
    return "?";
  }
  return [...raw][0].toLocaleUpperCase();
}

/**
 * Greeting fragment after "Welcome back, …" — prefers first + last name, then first, then username.
 */
export function displayWelcomeName(user) {
  const first = String(user?.firstName ?? "").trim();
  const last = String(user?.lastName ?? "").trim();
  if (first && last) {
    return `${first} ${last}`;
  }
  if (first) {
    return first;
  }
  if (last) {
    return last;
  }
  const un = String(user?.username ?? "").trim();
  if (un) {
    return un;
  }
  return "";
}
