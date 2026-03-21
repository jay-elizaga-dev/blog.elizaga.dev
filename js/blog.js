// Sanity API configuration
const SANITY_PROJECT_ID = 'w4gptd1g';
const SANITY_DATASET = 'production';
const SANITY_API_VERSION = '2024-01-01';

// Token removed — published content is publicly queryable


/**
 * Safely escape HTML text to prevent XSS
 */
function sanitizeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Format date string to readable format
 */
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

/**
 * Format date for grouping (e.g., "March 2025")
 */
function formatDateGroup(dateString) {
    const options = { year: 'numeric', month: 'long' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

/**
 * Estimate word count from excerpt
 */
function estimateWordCount(text) {
    if (!text) return 0;
    return text.split(/\s+/).filter(w => w.length > 0).length;
}


// GROQ query to fetch blog posts
const QUERY = `*[_type == "blogPost" && status == "published"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    "image": featuredImage.asset->url,
    author,
    publishedAt,
    category,
    tags,
    status
}`;

/**
 * Fetch all blog posts from Sanity
 */
async function fetchBlogPosts() {
    try {
        const query = QUERY;

        const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encodeURIComponent(query)}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.result || [];
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        throw error;
    }
}

/**
 * Render a single blog entry (Willison-style: title, meta, excerpt, tags)
 */
function renderBlogEntry(post) {
    const tagsHtml = post.tags && post.tags.length > 0
        ? `<div class="blog-entry-tags">${post.tags.map(tag => `<span class="tag">${sanitizeHtml(tag)}</span>`).join('')}</div>`
        : '';

    const excerptWords = estimateWordCount(post.excerpt);
    const wordCountHtml = excerptWords > 50
        ? `<span class="word-count">${excerptWords.toLocaleString()} words</span>`
        : '';

    return `
        <div class="blog-entry">
            <h3><a href="post.html?id=${post._id}">${sanitizeHtml(post.title)}</a></h3>
            <div class="blog-entry-meta">
                <time>${formatDate(post.publishedAt)}</time>
                ${post.category ? `&middot; <span class="blog-entry-category">${sanitizeHtml(post.category)}</span>` : ''}
                ${wordCountHtml ? `&middot; ${wordCountHtml}` : ''}
            </div>
            ${post.excerpt ? `<p class="blog-entry-excerpt">${sanitizeHtml(post.excerpt)}</p>` : ''}
            ${tagsHtml}
        </div>
    `;
}

/**
 * Group posts by month/year and render
 */
function renderPostsByDate(posts) {
    const groups = {};

    for (const post of posts) {
        const group = formatDateGroup(post.publishedAt);
        if (!groups[group]) groups[group] = [];
        groups[group].push(post);
    }

    let html = '';
    for (const [groupLabel, groupPosts] of Object.entries(groups)) {
        html += `<div class="date-group">`;
        html += `<h2>${groupLabel}</h2>`;
        html += groupPosts.map(renderBlogEntry).join('');
        html += `</div>`;
    }

    return html;
}

/**
 * Load and display all blog posts
 */
async function loadBlogPosts() {
    const container = document.getElementById('blog-container');

    try {
        const posts = await fetchBlogPosts();

        if (posts.length === 0) {
            container.innerHTML = '<div class="no-posts">No blog posts yet.</div>';
            return;
        }

        container.innerHTML = renderPostsByDate(posts);
    } catch (error) {
        container.innerHTML = `
            <div class="error">
                <strong>Error loading blog posts</strong>
                <p>${sanitizeHtml(error.message)}</p>
            </div>
        `;
    }
}

/**
 * Initialize blog page when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    loadBlogPosts();
});
