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
 * Extract post ID from URL query parameters
 */
function getPostId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}


/**
 * Fetch a single post by ID from Sanity
 */
async function fetchPost(postId) {
    try {
        const query = `*[_id == "${postId}" && status == "published"] {
            _id,
            title,
            slug,
            excerpt,
            content,
            "image": featuredImage.asset->url,
            author->{name},
            publishedAt,
            category,
            tags,
            status
        }`;

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
        const posts = data.result || [];
        return posts.length > 0 ? posts[0] : null;
    } catch (error) {
        console.error('Error fetching post:', error);
        throw error;
    }
}

/**
 * Render post header and metadata
 */
function renderPost(post) {
    const imageUrl = post.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="250"%3E%3Crect fill="%23e0e0e0" width="400" height="250"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="20" font-family="sans-serif"%3ENo Image%3C/text%3E%3C/svg%3E';

    return `
        <div class="post-header">
            <div class="post-meta">
                <span>${formatDate(post.publishedAt)}</span>
                ${post.author ? `<span>By ${sanitizeHtml(post.author.name)}</span>` : ''}
            </div>
            ${post.category ? `<span class="post-category">${sanitizeHtml(post.category)}</span>` : ''}
            <h1 class="post-title">${sanitizeHtml(post.title)}</h1>
        </div>
        <img src="${sanitizeHtml(imageUrl)}" alt="${sanitizeHtml(post.title)}" class="post-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22800%22 height=%22500%22%3E%3Crect fill=%22%23e0e0e0%22 width=%22800%22 height=%22500%22/%3E%3C/svg%3E'">
        <div class="post-content" id="post-content-inner">
        </div>
    `;
}

/**
 * Inject markdown content into post container
 */
function renderPostContent(container, contentHtml, tagsHtml) {
    const contentDiv = container.querySelector('#post-content-inner');
    if (contentDiv) {
        contentDiv.innerHTML = contentHtml + (tagsHtml ? `<div class="post-tags">${tagsHtml}</div>` : '');
    }
}

/**
 * Load and display the post
 */
async function loadPost() {
    const postId = getPostId();
    const container = document.getElementById('post-container');

    if (!postId) {
        container.innerHTML = '<div class="error">No post ID provided.</div>';
        return;
    }

    try {
        const post = await fetchPost(postId);

        if (!post) {
            container.innerHTML = '<div class="error">Post not found.</div>';
            return;
        }


        const postHtml = renderPost(post);
        container.innerHTML = postHtml;

        // Now render the markdown content separately
        let contentHtml = '<p>No content available.</p>';
        if (post.content) {
          if (typeof post.content === 'string') {
            // Content is a markdown string, parse it
            contentHtml = marked.parse(post.content);
          } else if (Array.isArray(post.content)) {
            // Content is Sanity portable text (array of blocks)
            const textContent = post.content.map(block => {
              if (block._type === 'block') {
                // Extract text from block children
                const blockText = block.children.map(child => child.text).join('');
                // If the block has a style property (like 'h1', 'h2'), wrap in markdown heading syntax
                if (block.style && block.style.startsWith('h')) {
                  const level = block.style.substring(1);
                  return '#'.repeat(parseInt(level)) + ' ' + blockText;
                }
                return blockText;
              }
              return '';
            }).join('\n\n');
            contentHtml = marked.parse(textContent);
          }
        }

        const tagsHtml = post.tags && post.tags.length > 0
            ? post.tags.map(tag => `<span class="tag">${sanitizeHtml(tag)}</span>`).join('')
            : '';

        renderPostContent(container, contentHtml, tagsHtml);
    } catch (error) {
        container.innerHTML = `
            <div class="error">
                <strong>Error loading post</strong>
                <p>${sanitizeHtml(error.message)}</p>
            </div>
        `;
    }
}

/**
 * Initialize post page when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    // Load and display the post
    loadPost();
});
