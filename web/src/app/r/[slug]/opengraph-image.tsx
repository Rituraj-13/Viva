import { ImageResponse } from "next/og";
import { connection } from "next/server";
import { getSessionBySlug } from "@/lib/store";
import { readinessScore } from "@/lib/scoring";
import { RUNG_LABELS, type SessionData } from "@/lib/types";

export const alt = "Viva report — the oral exam for code";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const bandCopy = {
  ready: { label: "Ready for the next round", color: "#5c6b57" },
  almost: { label: "Almost there", color: "#a76f1f" },
  not_yet: { label: "Not yet", color: "#b23a2e" },
} as const;

function truncate(value: string, max: number) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function appHost() {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (!raw) return "viva-oral-exam.vercel.app";
  return raw.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function fallbackImage(title: string, body: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: "#f4efe4",
          color: "#1a1814",
          padding: "64px",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontSize: 56, letterSpacing: -3 }}>Viva</span>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              backgroundColor: "#b23a2e",
            }}
          />
        </div>
        <div style={{ marginTop: 28, fontSize: 42, letterSpacing: -1 }}>
          {title}
        </div>
        <div style={{ marginTop: 10, fontSize: 20, color: "#5f594d" }}>
          {body}
        </div>
      </div>
    ),
    { ...size },
  );
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;

  let session: SessionData | null = null;
  try {
    session = await getSessionBySlug(slug);
  } catch (error) {
    console.error("[viva][og] report lookup failed", error);
    return fallbackImage("Viva", "The oral exam for code.");
  }

  if (!session?.report) {
    return fallbackImage(
      "Report not found",
      "This session may have been deleted by its owner.",
    );
  }

  const report = session.report;
  const band = bandCopy[report.band];
  const score = readinessScore(report.axes).toFixed(1);
  const quoteEntry = report.confidentButWrong
    ? {
        label: "Confident but wrong",
        questionIndex: report.confidentButWrong.questionIndex,
        quote: report.confidentButWrong.quote,
      }
    : report.quietlyRight
      ? {
          label: "Quietly right",
          questionIndex: report.quietlyRight.questionIndex,
          quote: report.quietlyRight.quote,
        }
      : report.bestMoment
        ? {
            label: "The moment",
            questionIndex: report.bestMoment.questionIndex,
            quote: report.bestMoment.quote,
          }
        : null;

  const question = quoteEntry
    ? session.questions.find((item) => item.index === quoteEntry.questionIndex)
    : undefined;
  const questionLabel = quoteEntry
    ? `Question ${String(quoteEntry.questionIndex + 1).padStart(2, "0")}${
        question ? ` · ${RUNG_LABELS[question.rung]}` : ""
      }`
    : "Evidence";
  const headlineSize =
    report.headline.length > 90 ? 40 : report.headline.length > 60 ? 46 : 54;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#f4efe4",
          color: "#1a1814",
          padding: "50px 64px 40px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "2px solid #d6ccb9",
            paddingBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 40, letterSpacing: -2 }}>Viva</span>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                backgroundColor: "#b23a2e",
              }}
            />
          </div>
          <span
            style={{
              fontSize: 15,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#5f594d",
            }}
          >
            The oral exam for code
          </span>
        </div>

        <div style={{ display: "flex", flex: 1, gap: 36, paddingTop: 26 }}>
          <div
            style={{
              display: "flex",
              flex: 1,
              minWidth: 0,
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  display: "flex",
                  border: `2px solid ${band.color}`,
                  color: band.color,
                  padding: "5px 10px",
                  fontSize: 13,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                {band.label}
              </span>
              <span
                style={{
                  display: "flex",
                  border: "1px solid #d6ccb9",
                  color: "#5f594d",
                  padding: "5px 10px",
                  fontSize: 13,
                  letterSpacing: 1,
                  maxWidth: 380,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {session.filePath}
              </span>
            </div>

            <div
              style={{
                marginTop: 18,
                fontSize: headlineSize,
                lineHeight: 1.02,
                letterSpacing: -2,
              }}
            >
              {report.headline}
            </div>

            {quoteEntry && (
              <div
                style={{
                  marginTop: 22,
                  display: "flex",
                  flexDirection: "column",
                  borderLeft: "4px solid #b23a2e",
                  paddingLeft: 18,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    color: "#b23a2e",
                  }}
                >
                  {quoteEntry.label} · {questionLabel}
                </span>
                <span
                  style={{
                    marginTop: 8,
                    fontSize: 21,
                    lineHeight: 1.3,
                    fontStyle: "italic",
                  }}
                >
                  “{truncate(quoteEntry.quote, 168)}”
                </span>
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              width: 220,
              flexDirection: "column",
              justifyContent: "center",
              borderLeft: "1px solid #d6ccb9",
              paddingLeft: 28,
            }}
          >
            <span
              style={{
                fontSize: 12,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: "#5f594d",
              }}
            >
              Readiness
            </span>
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <span
                style={{
                  fontSize: 92,
                  lineHeight: 1,
                  letterSpacing: -4,
                }}
              >
                {score}
              </span>
              <span style={{ fontSize: 20, color: "#5f594d" }}>/4</span>
            </div>

            <div
              style={{
                marginTop: 22,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {report.axes.map((axis) => (
                <div
                  key={axis.key}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        letterSpacing: 1.5,
                        textTransform: "uppercase",
                        color: "#5f594d",
                      }}
                    >
                      {axis.label}
                    </span>
                    <span style={{ fontSize: 12 }}>{axis.score.toFixed(1)}</span>
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      width: "100%",
                      height: 5,
                      backgroundColor: "#e3d9c6",
                      display: "flex",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.max(0, Math.min(100, (axis.score / 4) * 100))}%`,
                        height: 5,
                        backgroundColor: "#1a1814",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: "2px solid #d6ccb9",
            paddingTop: 14,
            fontSize: 12,
            letterSpacing: 1.5,
            color: "#5f594d",
          }}
        >
          <span>
            {appHost()}/r/{slug}
          </span>
          <span>Wispr Flow · spoken answers</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
