// Sanity API configuration
const SANITY_PROJECT_ID = 'w4gptd1g';
const SANITY_DATASET = 'production';
const SANITY_API_VERSION = '2024-01-01';

const PUBLISHABLE_SANITY_TOKEN_VIEW_ONLY = 'skLdN4G0qDEDFVPxN70skvJSISWRNwZNZRpPg0mpkWkHoVB2d8eQkAhOWfWIPggrifCxiOXVxR6Qc7O20X4HyTPwjSLwt9EP1BS78opmlnYyGkNoLGvnzAfqILWhi9zKps2FzkKIfUd6zuu9XYgh3i2hBpN95tYzcJuvlvISTnGkZUWdRDVl';

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
 * Extract series slug from URL query parameters
 */
function getSeriesSlug() {
    const params = new URLSearchParams(window.location.search);
    return params.get('slug');
}

/**
 * Fetch a single series by slug from Sanity
 */
async function fetchSeries(slug) {
    try {
        const query = `*[_type == "series" && slug.current == $slug][0] {
            title,
            slug,
            subtitle,
            description,
            "image": coverImage.asset->url,
            startDate,
            endDate,
            status,
            tags,
            metaDescription,
            posts[]-> {
                _id,
                title,
                slug,
                excerpt,
                publishedAt,
                "image": featuredImage.asset->url,
                category,
                tags
            }
        }`;

        const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encodeURIComponent(query)}&$slug="${slug}"`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${PUBLISHABLE_SANITY_TOKEN_VIEW_ONLY}`
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.result;
    } catch (error) {
        console.error('Error fetching series:', error);
        throw error;
    }
}

/**
 * Render series header
 */
function renderSeriesHeader(series) {
    const subtitle = series.subtitle ? `<p class="series-subtitle">${sanitizeHtml(series.subtitle)}</p>` : '';
    const status = series.status ? `<span class="series-status ${series.status}">${sanitizeHtml(series.status)}</span>` : '';
    const dates = series.endDate
        ? `<time>${formatDate(series.startDate)}</time> – <time>${formatDate(series.endDate)}</time>`
        : `<time>${formatDate(series.startDate)}</time>`;

    const imageUrl = series.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="400"%3E%3Crect fill="%23e0e0e0" width="800" height="400"/%3E%3C/svg%3E';

    return `
        <div class="series-header-section">
            <img src="${sanitizeHtml(imageUrl)}" alt="${sanitizeHtml(series.title)}" class="series-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22800%22 height=%22400%22%3E%3Crect fill=%22%23e0e0e0%22 width=%22800%22 height=%22400%22/%3E%3C/svg%3E'">
            <div class="series-info">
                <div class="series-title-block">
                    <h1>${sanitizeHtml(series.title)}</h1>
                    ${status}
                </div>
                ${subtitle}
                <p class="series-dates">${dates}</p>
                <p class="series-description">${sanitizeHtml(series.description)}</p>
                ${series.tags && series.tags.length > 0 ? `<div class="series-tags">${series.tags.map(tag => `<span class="tag">${sanitizeHtml(tag)}</span>`).join('')}</div>` : ''}
            </div>
        </div>
    `;
}

/**
 * Render a post in the series
 */
function renderSeriesPost(post, index, total) {
    return `
        <div class="series-post">
            <div class="series-post-number">Part ${index + 1} of ${total}</div>
            <div class="series-post-card">
                <h3><a href="/post.html?id=${post._id}">${sanitizeHtml(post.title)}</a></h3>
                <div class="post-meta">
                    <time>${formatDate(post.publishedAt)}</time>
                    ${post.category ? `<span class="post-category">${sanitizeHtml(post.category)}</span>` : ''}
                </div>
                ${post.excerpt ? `<p class="post-excerpt">${sanitizeHtml(post.excerpt)}</p>` : ''}
                ${post.tags && post.tags.length > 0 ? `<div class="post-tags">${post.tags.map(tag => `<span class="tag">${sanitizeHtml(tag)}</span>`).join('')}</div>` : ''}
            </div>
        </div>
    `;
}

/**
 * Load and display the series
 */
async function loadSeries() {
    const slug = getSeriesSlug();
    const container = document.getElementById('series-container');

    if (!slug) {
        container.innerHTML = '<div class="error">No series slug provided.</div>';
        return;
    }

    try {
        const series = await fetchSeries(slug);

        if (!series) {
            container.innerHTML = '<div class="error">Series not found.</div>';
            return;
        }

        const headerHtml = renderSeriesHeader(series);
        const postsHtml = series.posts && series.posts.length > 0
            ? `<div class="series-posts">${series.posts.map((post, idx) => renderSeriesPost(post, idx, series.posts.length)).join('')}</div>`
            : '<div class="no-posts">No posts in this series yet.</div>';

        container.innerHTML = headerHtml + postsHtml;
    } catch (error) {
        container.innerHTML = `
            <div class="error">
                <strong>Error loading series</strong>
                <p>${sanitizeHtml(error.message)}</p>
            </div>
        `;
    }
}

/**
 * Initialize series detail page when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    loadSeries();
});
