/**
 * An email address that, in a narrow column, wraps after the "@" rather than
 * in the middle of a word.
 */
export function EmailText({ email }: { email: string }) {
  const at = email.indexOf("@");
  if (at < 0) return <>{email}</>;
  return (
    <span className="[overflow-wrap:anywhere]">
      {email.slice(0, at + 1)}
      <wbr />
      {email.slice(at + 1)}
    </span>
  );
}
