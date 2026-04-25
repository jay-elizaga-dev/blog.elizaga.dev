// Sitemap — deep link navigation across elizaga.dev subdomains
(function() {
    const DOMAIN = 'elizaga.dev';
    const SUBDOMAINS = [
        { name: 'Home', slug: '', path: '' },
        { name: 'Blog', slug: 'blog', path: '' },
        { name: 'Research', slug: 'research', path: '' },
        { name: 'Portfolio', slug: 'portfolio', path: '' },
        { name: 'Hiring', slug: 'hiring', path: '' },
        { name: 'Affiliate', slug: 'affiliate', path: '' },
        { name: 'Mac Native MCP', slug: 'nexlayer-mac-native-mcp-dev', path: '' },
    ];

    const current = window.location.hostname;

    function render() {
        const nav = document.createElement('nav');
        nav.className = 'sitemap-bar';
        nav.setAttribute('aria-label', 'Subdomains');

        const inner = document.createElement('div');
        inner.className = 'sitemap-inner';

        for (const sub of SUBDOMAINS) {
            const url = sub.slug ? `https://${sub.slug}.${DOMAIN}${sub.path}` : `https://${DOMAIN}`;
            const isCurrent = sub.slug
                ? current === `${sub.slug}.${DOMAIN}`
                : current === DOMAIN;

            const a = document.createElement('a');
            a.href = url;
            a.textContent = sub.name;
            a.className = 'sitemap-link' + (isCurrent ? ' current' : '');
            if (isCurrent) a.setAttribute('aria-current', 'page');
            inner.appendChild(a);
        }

        nav.appendChild(inner);

        // Insert after header
        const header = document.querySelector('header');
        if (header && header.nextSibling) {
            header.parentNode.insertBefore(nav, header.nextSibling);
        } else {
            document.body.prepend(nav);
        }
    }

    // Inject styles
    const style = document.createElement('style');
    style.textContent = `
        .sitemap-bar {
            background: var(--bg-secondary, #f5f5f5);
            border-bottom: 1px solid var(--border, #ddd);
            padding: 8px 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 0.8rem;
        }
        .sitemap-inner {
            max-width: 820px;
            margin: 0 auto;
            padding: 0 20px;
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            justify-content: center;
        }
        .sitemap-link {
            color: var(--text-muted, #888);
            text-decoration: none;
            padding: 3px 10px;
            border-radius: 4px;
            transition: color 0.15s, background 0.15s;
        }
        .sitemap-link:hover {
            color: var(--text, #1a1a1a);
            background: var(--border, #ddd);
            text-decoration: none;
        }
        .sitemap-link.current {
            color: var(--accent, #2563eb);
            font-weight: 600;
            background: var(--accent-light, #dbeafe);
        }
        @media (max-width: 600px) {
            .sitemap-inner { gap: 4px; }
            .sitemap-link { padding: 3px 8px; font-size: 0.75rem; }
        }
    `;
    document.head.appendChild(style);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', render);
    } else {
        render();
    }
})();
