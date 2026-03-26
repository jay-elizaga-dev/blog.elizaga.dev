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
 * GROQ query to fetch all series
 */
const QUERY = `*[_type == "series"] | order(startDate desc) {
    _id,
    title,
    slug,
    subtitle,
    description,
    "image": coverImage.asset->url,
    startDate,
    status,
    tags,
    "postCount": count(posts)
}`;

/**
 * Fetch all series from Sanity
 */
async function fetchSeries() {
    try {
        const query = QUERY;
        const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encodeURIComponent(query)}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${PUBLISHABLE_SANITY_TOKEN_VIEW_ONLY}`
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.result || [];
    } catch (error) {
        console.error('Error fetching series:', error);
        throw error;
    }
}

/**
 * Render a single series card
 */
function renderSeriesCard(series) {
    const statusBadge = series.status ? `<span class="series-status ${series.status}">${sanitizeHtml(series.status)}</span>` : '';
    const subtitle = series.subtitle ? `<p class="series-subtitle">${sanitizeHtml(series.subtitle)}</p>` : '';
    const tagsHtml = series.tags && series.tags.length > 0
        ? `<div class="series-tags">${series.tags.map(tag => `<span class="tag">${sanitizeHtml(tag)}</span>`).join('')}</div>`
        : '';

    const imageUrl = series.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="250"%3E%3Crect fill="%23e0e0e0" width="400" height="250"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="20" font-family="sans-serif"%3ENo Image%3C/text%3E%3C/svg%3E';

    return `
        <div class="series-card">
            <div class="series-image">
                <img src="${sanitizeHtml(imageUrl)}" alt="${sanitizeHtml(series.title)}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22250%22%3E%3Crect fill=%22%23e0e0e0%22 width=%22400%22 height=%22250%22/%3E%3C/svg%3E'">
            </div>
            <div class="series-content">
                <div class="series-header">
                    <h3><a href="/series-detail.html?slug=${encodeURIComponent(series.slug.current)}">${sanitizeHtml(series.title)}</a></h3>
                    ${statusBadge}
                </div>
                ${subtitle}
                <p class="series-meta">
                    <time>${formatDate(series.startDate)}</time>
                    &middot;
                    <span class="post-count">${series.postCount} post${series.postCount !== 1 ? 's' : ''}</span>
                </p>
                <p class="series-description">${sanitizeHtml(series.description)}</p>
                ${tagsHtml}
            </div>
        </div>
    `;
}

/**
 * Load and display all series
 */
async function loadSeries() {
    const container = document.getElementById('series-container');

    try {
        const series = await fetchSeries();

        if (series.length === 0) {
            container.innerHTML = '<div class="no-series">No series yet.</div>';
            return;
        }

        const seriesHtml = series.map(renderSeriesCard).join('');
        container.innerHTML = `<div class="series-grid">${seriesHtml}</div>`;
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
 * Initialize series page when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    loadSeries();
});
