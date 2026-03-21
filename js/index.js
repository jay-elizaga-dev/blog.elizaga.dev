// Sanity API configuration
const SANITY_PROJECT_ID = 'w4gptd1g';
const SANITY_DATASET = 'production';
const SANITY_API_VERSION = '2024-01-01';

const SANITY_TOKEN = 'skLdN4G0qDEDFVPxN70skvJSISWRNwZNZRpPg0mpkWkHoVB2d8eQkAhOWfWIPggrifCxiOXVxR6Qc7O20X4HyTPwjSLwt9EP1BS78opmlnYyGkNoLGvnzAfqILWhi9zKps2FzkKIfUd6zuu9XYgh3i2hBpN95tYzcJuvlvISTnGkZUWdRDVl';


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

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${SANITY_TOKEN}`
            }
        });

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
 * Render featured post (full width with image)
 */
function renderFeaturedPost(post) {
    const imageHtml = post.image ? `<img src="${post.image}" alt="${sanitizeHtml(post.title)}" class="featured-image">` : '';
    const tagsHtml = post.tags && post.tags.length > 0
        ? `<div class="featured-tags">${post.tags.map(tag => `<span class="tag">${sanitizeHtml(tag)}</span>`).join('')}</div>`
        : '';

    return `
        <div class="featured-post">
            ${imageHtml}
            <div class="featured-content">
                <div class="featured-meta">
                    <time>${formatDate(post.publishedAt)}</time>
                    ${post.category ? `&middot; <span class="featured-category">${sanitizeHtml(post.category)}</span>` : ''}
                </div>
                <h2><a href="post.html?id=${post._id}">${sanitizeHtml(post.title)}</a></h2>
                ${post.excerpt ? `<p class="featured-excerpt">${sanitizeHtml(post.excerpt)}</p>` : ''}
                ${tagsHtml}
                <a href="post.html?id=${post._id}" class="read-more">Read full post →</a>
            </div>
        </div>
    `;
}

/**
 * Render a single blog entry (for the list)
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
 * Load and display blog posts with featured section
 */
async function loadBlogPosts() {
    const featuredSection = document.getElementById('featured-section');
    const container = document.getElementById('blog-container');

    try {
        const posts = await fetchBlogPosts();

        if (posts.length === 0) {
            featuredSection.innerHTML = '<div class="no-posts">No blog posts yet.</div>';
            container.innerHTML = '';
            return;
        }

        // Display featured post (the first one, which is most recent)
        const featuredPost = posts[0];
        featuredSection.innerHTML = renderFeaturedPost(featuredPost);

        // Display remaining posts grouped by date
        const remainingPosts = posts.slice(1);
        if (remainingPosts.length > 0) {
            container.innerHTML = `
                <h2 class="all-posts-heading">All Posts</h2>
                ${renderPostsByDate(remainingPosts)}
            `;
        } else {
            container.innerHTML = '';
        }
    } catch (error) {
        featuredSection.innerHTML = `
            <div class="error">
                <strong>Error loading blog posts</strong>
                <p>${sanitizeHtml(error.message)}</p>
            </div>
        `;
        container.innerHTML = '';
    }
}

/**
 * Initialize index page when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    loadBlogPosts();
});
