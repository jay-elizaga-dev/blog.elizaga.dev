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
 * Extract post ID from URL query parameters
 */
function getPostId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

/**
 * Extract YouTube video ID from URL
 */
function extractYouTubeId(url) {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        /youtube\.com\/embed\/([^?&]+)/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

/**
 * Extract Vimeo video ID from URL
 */
function extractVimeoId(url) {
    if (!url) return null;
    const match = url.match(/(?:vimeo\.com\/)([0-9]+)/);
    return match ? match[1] : null;
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
            status,
            customTemplate
        }`;

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
        const posts = data.result || [];
        return posts.length > 0 ? posts[0] : null;
    } catch (error) {
        console.error('Error fetching post:', error);
        throw error;
    }
}

/**
 * Fetch series context for a post
 */
async function fetchSeriesContext(postId) {
    try {
        const query = `*[_type == "series" && references($postId)] | order(startDate desc) {
            title,
            slug,
            "position": array::indexOf(posts[]._ref, $postId),
            "total": count(posts),
            "prevPost": posts[array::indexOf(posts[]._ref, $postId) - 1]->{_id, title, slug},
            "nextPost": posts[array::indexOf(posts[]._ref, $postId) + 1]->{_id, title, slug}
        }`;

        const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encodeURIComponent(query)}&$postId="${postId}"`;

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
        console.error('Error fetching series context:', error);
        return [];
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
 * Render series context banner
 */
function renderSeriesBanner(series) {
    if (!series || series.length === 0) return '';

    // For now, just show the first series (could be extended for multiple series)
    const s = series[0];
    const position = s.position !== undefined ? s.position + 1 : 'N';
    const total = s.total || '?';

    let navHtml = '';
    if (s.prevPost) {
        navHtml += `<a href="/post.html?id=${s.prevPost._id}" class="series-nav-link">← ${sanitizeHtml(s.prevPost.title)}</a>`;
    }
    if (s.nextPost) {
        navHtml += `<a href="/post.html?id=${s.nextPost._id}" class="series-nav-link">${sanitizeHtml(s.nextPost.title)} →</a>`;
    }

    return `
        <div class="series-context-banner">
            <div class="series-context-info">
                <strong>Part ${position} of ${total}</strong> in
                <a href="/series-detail.html?slug=${encodeURIComponent(s.slug.current)}">${sanitizeHtml(s.title)}</a>
            </div>
            ${navHtml ? `<div class="series-context-nav">${navHtml}</div>` : ''}
        </div>
    `;
}

/**
 * Inject markdown content into post container
 */
function renderPostContent(container, contentHtml, tagsHtml, seriesHtml) {
    const contentDiv = container.querySelector('#post-content-inner');
    if (contentDiv) {
        contentDiv.innerHTML = (seriesHtml || '') + contentHtml + (tagsHtml ? `<div class="post-tags">${tagsHtml}</div>` : '');
    }
}

/**
 * Apply custom template if provided
 */
function applyCustomTemplate(post, contentHtml, tagsHtml) {
    if (!post.customTemplate || !post.customTemplate.enabled) {
        return null; // Use default rendering
    }

    // Inject custom CSS
    const styleTag = document.createElement('style');
    styleTag.textContent = post.customTemplate.css;
    document.head.appendChild(styleTag);

    // Prepare template variables
    const formattedDate = formatDate(post.publishedAt);
    const authorName = post.author?.name || 'Anonymous';
    const tagsContent = tagsHtml || '';

    // Replace placeholders in template HTML
    let templateHtml = post.customTemplate.html
        .replace(/\{\{title\}\}/g, sanitizeHtml(post.title))
        .replace(/\{\{excerpt\}\}/g, sanitizeHtml(post.excerpt || ''))
        .replace(/\{\{featuredImage\}\}/g, post.image || '')
        .replace(/\{\{content\}\}/g, contentHtml)
        .replace(/\{\{author\}\}/g, sanitizeHtml(authorName))
        .replace(/\{\{date\}\}/g, formattedDate)
        .replace(/\{\{category\}\}/g, sanitizeHtml(post.category || ''))
        .replace(/\{\{tags\}\}/g, tagsContent);

    return templateHtml;
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
            // Content is Sanity portable text (array of blocks, images, and videos)
            contentHtml = post.content.map(block => {
              if (block._type === 'block') {
                // Extract text from block children
                const blockText = block.children.map(child => child.text).join('');
                // If the block has a style property (like 'h1', 'h2'), wrap in markdown heading syntax
                if (block.style && block.style.startsWith('h')) {
                  const level = block.style.substring(1);
                  return '#'.repeat(parseInt(level)) + ' ' + blockText;
                }
                return blockText;
              } else if (block._type === 'image') {
                // Handle inline images from Sanity
                const imageUrl = block.asset?.url || '';
                const alt = sanitizeHtml(block.alt || 'Image');
                const caption = block.caption ? `<figcaption>${sanitizeHtml(block.caption)}</figcaption>` : '';
                return `<figure style="margin: 2rem 0;"><img src="${imageUrl}" alt="${alt}" style="max-width: 100%; height: auto; border-radius: 8px;">${caption}</figure>`;
              } else if (block._type === 'video') {
                // Handle inline videos from Sanity
                let videoEmbed = '';
                const caption = block.caption ? `<p style="text-align: center; margin-top: 0.5rem; font-size: 0.9rem; color: #666;">${sanitizeHtml(block.caption)}</p>` : '';

                if (block.source === 'youtube') {
                  const videoId = extractYouTubeId(block.url);
                  if (videoId) {
                    videoEmbed = `<iframe width="100%" height="500" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
                  }
                } else if (block.source === 'vimeo') {
                  const videoId = extractVimeoId(block.url);
                  if (videoId) {
                    videoEmbed = `<iframe src="https://player.vimeo.com/video/${videoId}?h=&color=ffffff&portrait=0" width="100%" height="500" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
                  }
                } else if (block.source === 'direct') {
                  videoEmbed = `<video width="100%" controls style="border-radius: 8px;"><source src="${block.url}" type="video/mp4">Your browser does not support the video tag.</video>`;
                }

                return videoEmbed ? `<div style="margin: 2rem 0;">${videoEmbed}${caption}</div>` : '';
              }
              return '';
            }).join('\n');
            contentHtml = marked.parse(contentHtml);
          }
        }

        const tagsHtml = post.tags && post.tags.length > 0
            ? post.tags.map(tag => `<span class="tag">${sanitizeHtml(tag)}</span>`).join('')
            : '';

        // Fetch series context (async, won't block rendering)
        let seriesHtml = '';
        try {
            const seriesContext = await fetchSeriesContext(post._id);
            if (seriesContext.length > 0) {
                seriesHtml = renderSeriesBanner(seriesContext);
            }
        } catch (e) {
            // Series context is optional, continue if it fails
        }

        // Check for custom template
        const customHtml = applyCustomTemplate(post, contentHtml, tagsHtml);

        if (customHtml) {
            // Use custom template
            container.innerHTML = customHtml;
        } else {
            // Use default template
            const postHtml = renderPost(post);
            container.innerHTML = postHtml;
            renderPostContent(container, contentHtml, tagsHtml, seriesHtml);
        }
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
