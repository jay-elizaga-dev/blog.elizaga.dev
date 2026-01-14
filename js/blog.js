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
        // Build query with workspace filter if in workspace context
        const query = QUERY;

        // Use CDN endpoint which has better CORS support
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
 * Render a single blog card
 */
function renderBlogCard(post) {
    const imageUrl = post.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="250"%3E%3Crect fill="%23e0e0e0" width="400" height="250"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="20" font-family="sans-serif"%3ENo Image%3C/text%3E%3C/svg%3E';

    const tagsHtml = post.tags && post.tags.length > 0
        ? post.tags.map(tag => `<span class="tag">${sanitizeHtml(tag)}</span>`).join('')
        : '';

    return `
        <div class="blog-card">
            <img src="${sanitizeHtml(imageUrl)}" alt="${sanitizeHtml(post.title)}" class="blog-card-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22250%22%3E%3Crect fill=%22%23e0e0e0%22 width=%22400%22 height=%22250%22/%3E%3C/svg%3E'">
            <div class="blog-card-content">
                <div class="blog-card-meta">
                    <span>${formatDate(post.publishedAt)}</span>
                    ${post.author ? `<span>By ${sanitizeHtml(post.author.name)}</span>` : ''}
                </div>
                ${post.category ? `<span class="blog-card-category">${sanitizeHtml(post.category)}</span>` : ''}
                <h2>${sanitizeHtml(post.title)}</h2>
                <p>${sanitizeHtml(post.excerpt || '')}</p>
                ${tagsHtml ? `<div class="blog-card-tags">${tagsHtml}</div>` : ''}
                <a href="post.html?id=${post._id}" class="read-more">Read More →</a>
            </div>
        </div>
    `;
}

/**
 * Load and display all blog posts
 */
async function loadBlogPosts() {
    const container = document.getElementById('blog-container');

    try {
        const posts = await fetchBlogPosts();

        if (posts.length === 0) {
            container.innerHTML = '<div class="no-posts">No blog posts available.</div>';
            return;
        }

        container.innerHTML = posts.map(renderBlogCard).join('');
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
    // Load and display blog posts
    loadBlogPosts();
});
