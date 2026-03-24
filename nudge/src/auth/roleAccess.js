export function normalizeRoleValue(role) {
  return String(role ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

export function isAdminLikeRole(role) {
  const r = normalizeRoleValue(role);
  if (!r) {
    return false;
  }
  return (
    r === "admin" ||
    r === "support_agent" ||
    r === "support" ||
    r === "super_admin" ||
    r.endsWith("_admin")
  );
}
