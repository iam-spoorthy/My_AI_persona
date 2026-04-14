import { mdToPdf } from "md-to-pdf";
import path from "path";

async function main() {
  const inputPath = path.join(__dirname, "../evals/eval-report.md");
  const outputPath = path.join(__dirname, "../evals/eval-report.pdf");

  console.log("Generating PDF from:", inputPath);

  const pdf = await mdToPdf(
    { path: inputPath },
    {
      dest: outputPath,
      pdf_options: {
        format: "A4",
        margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
        printBackground: true,
      },
      css: `
        body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; line-height: 1.5; color: #1a1a1a; }
        h1 { font-size: 22px; border-bottom: 2px solid #2563eb; padding-bottom: 8px; color: #1e293b; }
        h2 { font-size: 16px; color: #2563eb; margin-top: 24px; }
        h3 { font-size: 13px; color: #334155; }
        table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 10px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
        th { background: #2563eb; color: white; font-weight: 600; }
        tr:nth-child(even) { background: #f1f5f9; }
        code { background: #f1f5f9; padding: 2px 4px; border-radius: 3px; font-size: 10px; }
        pre { background: #f1f5f9; padding: 12px; border-radius: 6px; }
        hr { border: none; border-top: 1px solid #e2e8f0; margin: 20px 0; }
        strong { color: #1e293b; }
      `,
    }
  );

  if (pdf?.filename) {
    console.log("PDF saved to:", pdf.filename);
  } else {
    console.log("PDF saved to:", outputPath);
  }
}

main().catch((err) => {
  console.error("Error generating PDF:", err.message);
  process.exit(1);
});
