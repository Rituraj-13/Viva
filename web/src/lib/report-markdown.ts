import type { Report } from "./types";

const bandLabel = {
  ready: "Ready for the next round",
  almost: "Almost there",
  not_yet: "Not yet",
} as const;

export function reportToMarkdown(input: {
  filePath: string;
  language: string;
  lineCount: number;
  report: Report;
}): string {
  const { filePath, language, lineCount, report } = input;
  const lines: string[] = [
    `# Viva report — ${filePath}`,
    "",
    `**${bandLabel[report.band]}** · ${language} · ${lineCount} lines`,
    "",
    `## ${report.headline}`,
    "",
    report.summary,
    "",
    "## Axes",
    "",
    ...report.axes.map(
      (axis) =>
        `- **${axis.label}: ${axis.score.toFixed(1)}/4** — ${
          axis.evidenceQuote
            ? `“${axis.evidenceQuote}” (line ${axis.line})`
            : "No answer recorded."
        }`,
    ),
    "",
  ];

  if (report.confidentButWrong) {
    lines.push(
      "## Confident but wrong",
      "",
      `> “${report.confidentButWrong.quote}”`,
      "",
      `Question ${report.confidentButWrong.questionIndex + 1}. ${report.confidentButWrong.why}`,
      "",
    );
  }

  if (report.bestMoment) {
    lines.push(
      "## Best moment",
      "",
      `> “${report.bestMoment.quote}”`,
      "",
      `Question ${report.bestMoment.questionIndex + 1}.`,
      "",
    );
  }

  lines.push("## Next time, ask", "");
  report.nextQuestions.forEach((question, index) => {
    lines.push(`${index + 1}. ${question}`);
  });
  lines.push(
    "",
    "---",
    "",
    "Viva is a signal, not a hiring verdict. Quotes are exact substrings of the spoken answer.",
  );

  return lines.join("\n");
}
