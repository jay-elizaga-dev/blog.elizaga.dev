// Sanity API configuration
const SANITY_PROJECT_ID = 'w4gptd1g';
const SANITY_DATASET = 'production';
const SANITY_API_VERSION = '2024-01-01';

// Default featured post ID
const FEATURED_POST_ID = 'qhSwcy3H9AuRqc0GLKS5MA';

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
 * Fetch a specific post by ID from Sanity
 */
async function fetchPostById(id) {
    const query = `*[_type == "blogPost" && _id == "${id}"][0] {
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

    const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encodeURIComponent(query)}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.result;
}

/**
 * Render featured post
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
                <h3><a href="post.html?id=${post._id}">${sanitizeHtml(post.title)}</a></h3>
                ${post.excerpt ? `<p class="featured-excerpt">${sanitizeHtml(post.excerpt)}</p>` : ''}
                ${tagsHtml}
                <a href="post.html?id=${post._id}" class="read-more">Read full post &rarr;</a>
            </div>
        </div>
    `;
}

/**
 * Load and display the featured post
 */
async function loadFeaturedPost() {
    const section = document.getElementById('featured-section');
    const heading = section.querySelector('.section-heading');

    try {
        const post = await fetchPostById(FEATURED_POST_ID);

        if (!post) {
            section.innerHTML = '';
            return;
        }

        section.innerHTML = '';
        if (heading) section.appendChild(heading.cloneNode(true));
        section.innerHTML = `<h2 class="section-heading">Featured Post</h2>` + renderFeaturedPost(post);
    } catch (error) {
        console.error('Error loading featured post:', error);
        section.innerHTML = `<h2 class="section-heading">Featured Post</h2>
            <div class="error">
                <strong>Error loading featured post</strong>
                <p>${sanitizeHtml(error.message)}</p>
            </div>`;
    }
}

/**
 * Initialize index page when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    loadFeaturedPost();
});
