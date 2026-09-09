export type GithubInfo = {
  fullName: string;
  description: string | null;
  language: string | null;
  stars: number;
  defaultBranch: string;
  lastCommit: { message: string; author: string | null; date: string } | null;
};

type RepoHost = "github" | "gitlab" | "bitbucket";

function parseRepoUrl(repoUrl: string): { host: RepoHost; owner: string; repo: string } | null {
  try {
    const url = new URL(repoUrl);
    const [, owner, repoRaw] = url.pathname.split("/");
    if (!owner || !repoRaw) return null;
    const repo = repoRaw.replace(/\.git$/, "");

    if (url.hostname.includes("github.com")) return { host: "github", owner, repo };
    if (url.hostname.includes("gitlab.com")) return { host: "gitlab", owner, repo };
    if (url.hostname.includes("bitbucket.org")) return { host: "bitbucket", owner, repo };
    return null;
  } catch {
    return null;
  }
}

async function fetchGithubRepo(owner: string, repo: string): Promise<GithubInfo | null> {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "panel-organizacion" };

  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (!repoRes.ok) return null;
  const repoData = await repoRes.json();

  let lastCommit: GithubInfo["lastCommit"] = null;
  try {
    const commitsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`, {
      headers,
    });
    if (commitsRes.ok) {
      const commits = await commitsRes.json();
      const commit = commits?.[0];
      if (commit) {
        lastCommit = {
          message: commit.commit?.message?.split("\n")[0] ?? "",
          author: commit.commit?.author?.name ?? commit.author?.login ?? null,
          date: commit.commit?.author?.date ?? "",
        };
      }
    }
  } catch {
    // el repo puede ser privado o no tener commits visibles; no bloquea el resto de la info
  }

  return {
    fullName: repoData.full_name,
    description: repoData.description ?? null,
    language: repoData.language ?? null,
    stars: repoData.stargazers_count ?? 0,
    defaultBranch: repoData.default_branch ?? "main",
    lastCommit,
  };
}

async function fetchGitlabRepo(owner: string, repo: string): Promise<GithubInfo | null> {
  const projectPath = encodeURIComponent(`${owner}/${repo}`);

  const repoRes = await fetch(`https://gitlab.com/api/v4/projects/${projectPath}`);
  if (!repoRes.ok) return null;
  const repoData = await repoRes.json();

  let language: string | null = null;
  try {
    const langRes = await fetch(`https://gitlab.com/api/v4/projects/${projectPath}/languages`);
    if (langRes.ok) {
      const languages: Record<string, number> = await langRes.json();
      const top = Object.entries(languages).sort((a, b) => b[1] - a[1])[0];
      language = top?.[0] ?? null;
    }
  } catch {
    // sin permisos o sin lenguajes detectados; no bloquea el resto de la info
  }

  let lastCommit: GithubInfo["lastCommit"] = null;
  try {
    const commitsRes = await fetch(
      `https://gitlab.com/api/v4/projects/${projectPath}/repository/commits?per_page=1`
    );
    if (commitsRes.ok) {
      const commits = await commitsRes.json();
      const commit = commits?.[0];
      if (commit) {
        lastCommit = {
          message: (commit.title as string) ?? "",
          author: commit.author_name ?? null,
          date: commit.created_at ?? "",
        };
      }
    }
  } catch {
    // repo privado o sin commits visibles
  }

  return {
    fullName: repoData.path_with_namespace ?? `${owner}/${repo}`,
    description: repoData.description ?? null,
    language,
    stars: repoData.star_count ?? 0,
    defaultBranch: repoData.default_branch ?? "main",
    lastCommit,
  };
}

async function fetchBitbucketRepo(owner: string, repo: string): Promise<GithubInfo | null> {
  const repoRes = await fetch(`https://api.bitbucket.org/2.0/repositories/${owner}/${repo}`);
  if (!repoRes.ok) return null;
  const repoData = await repoRes.json();

  let lastCommit: GithubInfo["lastCommit"] = null;
  try {
    const commitsRes = await fetch(`https://api.bitbucket.org/2.0/repositories/${owner}/${repo}/commits`);
    if (commitsRes.ok) {
      const commitsData = await commitsRes.json();
      const commit = commitsData?.values?.[0];
      if (commit) {
        lastCommit = {
          message: (commit.message as string)?.split("\n")[0] ?? "",
          author: commit.author?.raw ?? commit.author?.user?.display_name ?? null,
          date: commit.date ?? "",
        };
      }
    }
  } catch {
    // repo privado o sin commits visibles
  }

  return {
    fullName: repoData.full_name ?? `${owner}/${repo}`,
    description: repoData.description ?? null,
    language: repoData.language || null,
    stars: 0, // Bitbucket no expone un conteo público de "stars" en su API v2
    defaultBranch: repoData.mainbranch?.name ?? "main",
    lastCommit,
  };
}

export async function fetchGithubInfo(repoUrl: string): Promise<GithubInfo | null> {
  const parsed = parseRepoUrl(repoUrl);
  if (!parsed) return null;

  switch (parsed.host) {
    case "github":
      return fetchGithubRepo(parsed.owner, parsed.repo);
    case "gitlab":
      return fetchGitlabRepo(parsed.owner, parsed.repo);
    case "bitbucket":
      return fetchBitbucketRepo(parsed.owner, parsed.repo);
  }
}
