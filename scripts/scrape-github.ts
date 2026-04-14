// -- scrape-github.ts
// -- ee script nee GitHub repos data scrape chesi data/github_repos.json lo save chestundi
// -- RUN: npx tsx scripts/scrape-github.ts

import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
// @ts-ignore -- tsx handles this import fine at runtime, IDE shows error due to bundler moduleResolution
import { fetchUserRepos } from "../src/lib/github-scraper";

// -- .env.local nundi environment variables load chestundi
dotenv.config({ path: ".env.local" });

async function main() {
  // -- GitHub username .env.local nundi teskuntundi
  const username = process.env.GITHUB_USERNAME;

  if (!username) {
    console.error("ERROR: GITHUB_USERNAME not set in .env.local");
    console.error("Please add GITHUB_USERNAME=your-username to .env.local");
    process.exit(1);
  }

  console.log("========================================");
  console.log(`GitHub Repos Scraper - User: ${username}`);
  console.log("========================================\n");

  // -- GitHub API call chesi anni repos data fetch chestundi
  const repos = await fetchUserRepos(username);

  // -- data/ folder lo github_repos.json ga save chestundi
  const outputPath = path.join(process.cwd(), "data", "github_repos.json");

  // -- data folder lekunte create chestundi
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  // -- JSON file lo pretty-print chesi write chestundi (readable ga untundi)
  fs.writeFileSync(outputPath, JSON.stringify(repos, null, 2));

  console.log(`\nDone! Saved ${repos.length} repos to ${outputPath}`);

  // -- summary print chestundi -- ekkada em save ayyindo chupistundi
  console.log("\n--- Summary ---");
  repos.forEach((repo: any) => {
    const langs = Object.keys(repo.languages).join(", ") || "none";
    console.log(`  ${repo.name} | Languages: ${langs} | Stars: ${repo.stars}`);
  });
}

// -- main function run chesi, error unte catch chestundi
main().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
