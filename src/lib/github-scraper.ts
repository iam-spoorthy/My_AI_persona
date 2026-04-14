// -- github-scraper.ts
// -- GitHub REST API nundi repos data fetch chese helper functions
// -- ee module scripts/scrape-github.ts lo use avthundi

// -- okko repo ki ee data store chestam
export interface RepoData {
  name: string;           // -- repo peru (e.g., "My_AI_Persona_Scaler")
  description: string;    // -- repo description
  url: string;            // -- GitHub URL (e.g., "https://github.com/user/repo")
  languages: Record<string, number>; // -- language breakdown (e.g., { TypeScript: 5000, Python: 3000 })
  topics: string[];       // -- repo topics/tags (e.g., ["ai", "nextjs"])
  stars: number;          // -- star count
  readme: string;         // -- README content (first 3000 chars)
}

// -- GitHub API base URL -- anni requests ikkada ki veltayi
const GITHUB_API = "https://api.github.com";

// -- headers prepare chese function -- authentication + JSON format set chestundi
function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json", // -- GitHub API v3 JSON format lo response kavali
  };
  // -- GITHUB_TOKEN unte authentication add chestundi (rate limits ekkuva avthay)
  // -- token lekunte anonymous ga 60 requests/hour untundi, token tho 5000
  // -- token invalid unte skip chestundi, anonymous ga try chestundi
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.startsWith("ghp_")) {
    headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

// -- oka user yokka anni public repos fetch chese main function
// -- GitHub API /users/{username}/repos endpoint use chestundi
export async function fetchUserRepos(username: string): Promise<RepoData[]> {
  console.log(`Fetching repos for user: ${username}...`);

  // -- repos list fetch chestundi (100 max per page, recently updated first)
  const response = await fetch(
    `${GITHUB_API}/users/${username}/repos?per_page=100&sort=updated&type=owner`,
    { headers: getHeaders() }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  // -- raw repos data JSON ga parse chestundi
  const repos = await response.json();
  console.log(`Found ${repos.length} repos. Fetching details for each...`);

  // -- okko repo ki detailed data (README, languages) parallel ga fetch chestundi
  // -- forked repos skip chestundi (mana original work matrame kavali)
  const repoDataPromises = repos
    .filter((repo: any) => !repo.fork) // -- fork ayina repos filter out chestundi
    .map(async (repo: any): Promise<RepoData> => {
      // -- README and languages PARALLEL ga fetch chestundi (time save avthundi)
      const [readme, languages] = await Promise.all([
        fetchRepoReadme(username, repo.name),
        fetchRepoLanguages(username, repo.name),
      ]);

      return {
        name: repo.name,
        description: repo.description || "No description provided",
        url: repo.html_url,
        languages,
        topics: repo.topics || [],
        stars: repo.stargazers_count || 0,
        readme: readme.slice(0, 3000), // -- first 3000 chars matrame teskuntundi (peddha README lu issue avthay)
      };
    });

  // -- anni repos parallel ga process avthay, results wait chestundi
  const repoData = await Promise.all(repoDataPromises);
  console.log(`Successfully fetched detailed data for ${repoData.length} repos`);
  return repoData;
}

// -- oka specific repo README content raw text ga fetch chestundi
// -- README markdown lo untundi, daanni plain text ga return chestundi
export async function fetchRepoReadme(owner: string, repo: string): Promise<string> {
  try {
    const response = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/readme`,
      {
        headers: {
          ...getHeaders(),
          Accept: "application/vnd.github.raw", // -- raw text kavali (base64 encoded kadu)
        },
      }
    );

    if (!response.ok) {
      // -- konni repos ki README undadu -- adi normal, skip chestundi
      return "No README available";
    }

    return await response.text();
  } catch {
    return "No README available";
  }
}

// -- oka repo lo use aina programming languages fetch chestundi
// -- GitHub automatically bytes count chesi istundi
// -- return example: { "TypeScript": 15000, "CSS": 2000, "JavaScript": 500 }
export async function fetchRepoLanguages(
  owner: string,
  repo: string
): Promise<Record<string, number>> {
  try {
    const response = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/languages`,
      { headers: getHeaders() }
    );

    if (!response.ok) return {};
    return await response.json();
  } catch {
    return {};
  }
}
