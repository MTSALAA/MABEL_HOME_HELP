import type { CSSProperties } from "react";

export type EmailContent = {
  lang: "en" | "fr";
  /** Short line shown by mail clients next to the subject. */
  preview: string;
  heading: string;
  paragraphs: string[];
  details?: { label: string; value: string }[];
  cta?: { label: string; url: string };
  afterCta?: string[];
  signoff?: string[];
  footer: string;
};

const colors = {
  green900: "#1F3D2B",
  green700: "#2F5D43",
  cream50: "#FBF8F1",
  cream100: "#F4EEDF",
  cream300: "#E2D7BD",
  ink: "#1C241F",
  muted: "#4F5A53",
};

const fontStack =
  "'Atkinson Hyperlegible', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

const paragraph: CSSProperties = {
  margin: "0 0 16px",
  fontSize: "17px",
  lineHeight: "1.6",
  color: colors.ink,
};

// Table-based layout with inline styles: the only thing every mail client
// renders consistently.
export function EmailLayout(content: EmailContent) {
  return (
    <html lang={content.lang}>
      {/* eslint-disable-next-line @next/next/no-head-element -- an email document, not a page */}
      <head>
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: colors.cream50,
          fontFamily: fontStack,
        }}
      >
        <div
          style={{
            display: "none",
            overflow: "hidden",
            lineHeight: "1px",
            opacity: 0,
            maxHeight: 0,
            maxWidth: 0,
          }}
        >
          {content.preview}
        </div>
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ backgroundColor: colors.cream50 }}
        >
          <tbody>
            <tr>
              <td align="center" style={{ padding: "32px 16px" }}>
                <table
                  role="presentation"
                  width="100%"
                  cellPadding={0}
                  cellSpacing={0}
                  style={{ maxWidth: "560px" }}
                >
                  <tbody>
                    <tr>
                      <td
                        style={{
                          padding: "0 8px 20px",
                          fontFamily: "Georgia, 'Times New Roman', serif",
                          fontSize: "22px",
                          fontWeight: 700,
                          color: colors.green900,
                        }}
                      >
                        Mabel Home Help
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          backgroundColor: "#FFFFFF",
                          border: `1px solid ${colors.cream300}`,
                          borderRadius: "16px",
                          padding: "32px 28px",
                        }}
                      >
                        <h1
                          style={{
                            margin: "0 0 20px",
                            fontFamily: "Georgia, 'Times New Roman', serif",
                            fontSize: "26px",
                            lineHeight: "1.25",
                            color: colors.green900,
                          }}
                        >
                          {content.heading}
                        </h1>

                        {content.paragraphs.map((text, index) => (
                          <p key={`p-${index}`} style={paragraph}>
                            {text}
                          </p>
                        ))}

                        {content.details && content.details.length > 0 ? (
                          <table
                            role="presentation"
                            width="100%"
                            cellPadding={0}
                            cellSpacing={0}
                            style={{
                              margin: "8px 0 20px",
                              backgroundColor: colors.cream100,
                              borderRadius: "12px",
                            }}
                          >
                            <tbody>
                              {content.details.map((row, index) => (
                                <tr key={`d-${index}`}>
                                  <td
                                    style={{
                                      padding: "10px 16px",
                                      fontSize: "15px",
                                      color: colors.muted,
                                      verticalAlign: "top",
                                      width: "40%",
                                    }}
                                  >
                                    {row.label}
                                  </td>
                                  <td
                                    style={{
                                      padding: "10px 16px",
                                      fontSize: "16px",
                                      color: colors.ink,
                                      verticalAlign: "top",
                                      whiteSpace: "pre-wrap",
                                    }}
                                  >
                                    {row.value}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : null}

                        {content.cta ? (
                          <p style={{ margin: "8px 0 24px" }}>
                            <a
                              href={content.cta.url}
                              style={{
                                display: "inline-block",
                                backgroundColor: colors.green700,
                                color: "#FFFFFF",
                                fontSize: "17px",
                                fontWeight: 700,
                                textDecoration: "none",
                                padding: "14px 24px",
                                borderRadius: "12px",
                              }}
                            >
                              {content.cta.label}
                            </a>
                          </p>
                        ) : null}

                        {content.afterCta?.map((text, index) => (
                          <p key={`a-${index}`} style={paragraph}>
                            {text}
                          </p>
                        ))}

                        {content.signoff && content.signoff.length > 0 ? (
                          <p style={{ ...paragraph, margin: "24px 0 0" }}>
                            {content.signoff.map((line, index) => (
                              <span key={`s-${index}`}>
                                {line}
                                <br />
                              </span>
                            ))}
                          </p>
                        ) : null}
                      </td>
                    </tr>
                    <tr>
                      <td
                        style={{
                          padding: "20px 8px 0",
                          fontSize: "13px",
                          lineHeight: "1.5",
                          color: colors.muted,
                        }}
                      >
                        {content.footer}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}
