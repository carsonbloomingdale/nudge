import { completeJournalAttachment, presignJournalAttachment } from "./journalApi";

/**
 * Presign → PUT bytes to storage → complete. Tolerates common presign response shapes.
 *
 * @param {string|number} journalId
 * @param {File[]} files
 */
export async function uploadJournalAttachments(journalId, files) {
  if (journalId == null || !files?.length) {
    return;
  }

  for (const file of files) {
    const presign = await presignJournalAttachment(journalId, {
      filename: file.name || "photo.jpg",
      content_type: file.type || "image/jpeg",
      byte_size: file.size,
    });

    const uploadUrl =
      presign.upload_url ??
      presign.url ??
      presign.presigned_url ??
      presign.put_url;
    const attachmentId =
      presign.attachment_id ??
      presign.id ??
      presign.attachment?.attachment_id ??
      presign.attachment?.id;

    if (!uploadUrl || attachmentId == null) {
      throw new Error("Unexpected attachment presign response");
    }

    const headers = {
      "Content-Type": file.type || "application/octet-stream",
      ...(typeof presign.headers === "object" && presign.headers
        ? presign.headers
        : {}),
    };

    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers,
    });

    if (!putRes.ok) {
      throw new Error(`Upload failed (${putRes.status})`);
    }

    await completeJournalAttachment(journalId, attachmentId, {
      byte_size: file.size,
    });
  }
}
