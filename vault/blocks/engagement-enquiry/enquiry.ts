/**
 * The `mailto:` an enquiry opens: the studio's address, a subject, and a body
 * with the case it started from already written in.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * Pure, so the encoding is testable without a page. It is the one thing here
 * that can be wrong without looking wrong: an unencoded `&` in a title ends
 * the subject early, and an unencoded line break collapses the brief into one
 * line — the link still opens a mail client, just with a worse letter in it.
 * The address is left as written; it is the studio's own, from
 * `studioSettings` or `FALLBACK_CONTACT`, not reader input.
 */
export function enquiryHref(
  email: string,
  subject: string,
  body: string
): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
