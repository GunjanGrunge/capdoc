/**
 * Parses various GitHub URL formats and returns the raw file URL
 */
export const parseGitHubUrl = (url) => {
  try {
    const cleanUrl = url.trim();
    if (!cleanUrl) return null;

    // Already a raw URL
    if (cleanUrl.includes('raw.githubusercontent.com')) {
      return cleanUrl;
    }

    // Standard URL format: https://github.com/owner/repo/blob/branch/path/to/file.md
    const blobRegex = /github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)/i;
    const blobMatch = cleanUrl.match(blobRegex);

    if (blobMatch) {
      const [_, owner, repo, branch, path] = blobMatch;
      return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
    }

    // Direct repository format: https://github.com/owner/repo
    // In this case, we default to README.md on main branch
    const repoRegex = /github\.com\/([^/]+)\/([^/]+)/i;
    const repoMatch = cleanUrl.match(repoRegex);
    if (repoMatch) {
      const [_, owner, repo] = repoMatch;
      // Clean trailing slashes or subpaths
      const cleanRepo = repo.split('/')[0];
      return `https://raw.githubusercontent.com/${owner}/${cleanRepo}/main/README.md`;
    }

    return null;
  } catch (error) {
    console.error('Error parsing GitHub URL:', error);
    return null;
  }
};

/**
 * Fetches content from a public GitHub URL
 */
export const fetchGitHubFile = async (url) => {
  const rawUrl = parseGitHubUrl(url);
  if (!rawUrl) {
    throw new Error('Invalid GitHub URL format. Please use a repository link (e.g., https://github.com/user/repo) or a direct file blob link.');
  }

  try {
    let response = await fetch(rawUrl);
    
    // Fallback if main/README.md is not found, try master/README.md
    if (!response.ok && url.toLowerCase().indexOf('blob') === -1) {
      const fallbackUrl = rawUrl.replace('/main/', '/master/');
      const fallbackResponse = await fetch(fallbackUrl);
      if (fallbackResponse.ok) {
        response = fallbackResponse;
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const content = await response.text();
    
    // Get file name from URL
    const urlParts = rawUrl.split('/');
    const fileName = decodeURIComponent(urlParts[urlParts.length - 1]) || 'imported_file.md';

    return {
      content,
      fileName,
      rawUrl
    };
  } catch (error) {
    console.error('GitHub fetch error:', error);
    throw new Error(`Failed to fetch file from GitHub. Ensure the repository is public and the URL is correct. Details: ${error.message}`);
  }
};
