document.addEventListener('DOMContentLoaded', async () => {

    // --- START: MULTI-THEME TOGGLE LOGIC ---
    
    const THEMES = [
        { name: 'dark', icon: 'moon', label: 'Dark Theme' },
        { name: 'light', icon: 'sun', label: 'Light Theme' },
        { name: 'sepia', icon: 'book-open', label: 'Sepia Theme' },
        { name: 'slate', icon: 'layers', label: 'Slate Theme' },
        { name: 'matcha', icon: 'leaf', label: 'Matcha Theme' },
    ];
    
    const themeToggleButton = document.getElementById('theme-toggle-btn');
    const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
    const mobileThemeLabel = document.getElementById('mobile-theme-label');
    const postContent = document.getElementById('post-content');
    
    const desktopIcons = document.querySelectorAll('[data-theme-icon]');
    const mobileIcons = document.querySelectorAll('[data-theme-icon-mobile]');

    function applyTheme(themeName) {
        const theme = THEMES.find(t => t.name === themeName) || THEMES[0];
        document.documentElement.setAttribute('data-theme', theme.name);
        localStorage.setItem('theme', theme.name);
        
        if (theme.name === 'dark' || theme.name === 'slate') {
            if (postContent) postContent.classList.add('prose-invert');
        } else {
            if (postContent) postContent.classList.remove('prose-invert');
        }
        
        desktopIcons.forEach(icon => {
            icon.classList.toggle('hidden', icon.dataset.themeIcon !== theme.name);
        });
        
        mobileIcons.forEach(icon => {
            icon.classList.toggle('hidden', icon.dataset.themeIconMobile !== theme.name);
        });
        
        if (mobileThemeLabel) {
            mobileThemeLabel.textContent = theme.label;
        }
    }

    function cycleTheme(e) {
        e.preventDefault(); 
        const currentThemeName = localStorage.getItem('theme') || 'dark';
        const currentIndex = THEMES.findIndex(t => t.name === currentThemeName);
        const nextIndex = (currentIndex + 1) % THEMES.length;
        applyTheme(THEMES[nextIndex].name);
        
        if (e.currentTarget.id === 'mobile-theme-toggle') {
            closeMobileMenu();
        }
    }

    themeToggleButton.addEventListener('click', cycleTheme);
    mobileThemeToggle.addEventListener('click', cycleTheme);

    function loadInitialTheme() {
        const savedTheme = localStorage.getItem('theme');
        const osPreference = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
        const initialTheme = THEMES.find(t => t.name === savedTheme) ? savedTheme : osPreference;
        applyTheme(initialTheme);
    }
    
    loadInitialTheme();
    // --- END: MULTI-THEME TOGGLE LOGIC ---


    // --- DATA (Will be populated from fetch) ---
    let blogPosts = [];
    let allCategories = {};
    
    // --- STATE ---
    let activeCategory = 'all';
    let activeTag = null; 
    let typewriterInterval = null; 

    // --- PAGINATION STATE ---
    let filteredPosts = []; // Holds ALL filtered posts
    let currentPage = 1;
    const postsPerPage = 4;

    // --- ELEMENT REFERENCES ---
    const blogFeed = document.getElementById('blog-feed');
    const paginationControls = document.getElementById('pagination-controls');
    const categoryList = document.getElementById('category-list');
    const tagContainer = document.getElementById('tag-container');
    const tagList = document.getElementById('tag-list');
    const feedTitle = document.getElementById('feed-title');
    const mobileCategoryToggle = document.getElementById('mobile-category-toggle');
    const mobileCategoryLabel = document.getElementById('mobile-category-label');
    const mobileCategoryChevron = document.getElementById('mobile-category-chevron');
    const mobileCategoryMenu = document.getElementById('mobile-category-menu');
    const mobileCategoryListCustom = document.getElementById('mobile-category-list-custom');
    const mobileTagList = document.getElementById('mobile-tag-list');
    const mobileTagListLabel = document.getElementById('mobile-tag-list-label');
    const feedView = document.getElementById('feed-view');
    const postView = document.getElementById('post-view');
    const backButton = document.getElementById('back-button');
    const homeLink = document.getElementById('home-link');
    const moreBlogsList = document.getElementById('more-blogs-list');
    
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuIconClosed = document.getElementById('menu-icon-closed');
    const menuIconOpen = document.getElementById('menu-icon-open');
    const snackbar = document.getElementById('snackbar');
    const snackbarMessage = document.getElementById('snackbar-message');
    const toTopButton = document.getElementById('to-top-button');

    // --- COMMENT ELEMENT REFERENCES ---
    const commentForm = document.getElementById('comment-form');
    const commentsList = document.getElementById('comments-list');
    const commentPostIdInput = document.getElementById('comment-post-id');
    const commentNameInput = document.getElementById('comment-name');
    const commentContentInput = document.getElementById('comment-content');
    const commentSubmitBtn = document.getElementById('comment-submit-btn');
    
    // --- Shared Category Colors Map ---
    const categoryColors = {
        "Aphorism": "bg-purple-500/20 text-purple-300 border-purple-500/30",
        "Essay": "bg-blue-500/20 text-blue-300 border-blue-500/30",
        "Story writing": "bg-green-500/20 text-green-300 border-green-500/30",
        "Poetry": "bg-pink-500/20 text-pink-300 border-pink-500/30"
    };

    // --- FETCH LOGIC ---
    async function loadBlogData() {
        try {
            const response = await fetch('/api/public-data?cachebust=' + new Date().getTime());
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            blogPosts = data.posts || [];
            allCategories = data.categories || {};
            
            renderCategories();
            renderMoreBlogsList();
            filterAndRender(); 
            lucide.createIcons();
        
        } catch (error) {
            console.error("Could not load blog data:", error);
            blogFeed.innerHTML = `
                    <div class="text-center p-6 glass rounded-xl border border-red-700">
                    <i data-lucide="alert-triangle" class="w-16 h-16 mx-auto text-red-500 mb-4"></i>
                    <h3 class="text-2xl font-semibold" style="color: var(--body-color)">Error Loading Posts</h3>
                    <p class="mt-2" style="color: var(--nav-link-color)">Could not fetch data from the server. Please try again later.</p>
                    </div>`;
            lucide.createIcons(); 
        }
    }

    // --- FUNCTIONS ---

    // --- START: COMMENT LOGIC ---
    
    // Fetches *approved* comments from the API
    async function loadComments(postId) {
        if (!commentsList) return;
        commentsList.innerHTML = `<p style="color: var(--nav-link-color);">Loading comments...</p>`;
        
        try {
            const response = await fetch(`/api/comments/${postId}`);
            if (!response.ok) throw new Error('Failed to fetch comments');
            
            const comments = await response.json();
            renderComments(comments);
        } catch (error) {
            console.error(error);
            commentsList.innerHTML = `<p style="color: #ef4444;">Error loading comments.</p>`;
        }
    }

    // Renders the list of approved comments
    function renderComments(comments) {
        if (!commentsList) return;
        commentsList.innerHTML = ''; // Clear loading/error message

        if (comments.length === 0) {
            commentsList.innerHTML = `<p class="text-sm" style="color: var(--nav-link-color);">Be the first to comment.</p>`;
            return;
        }

        comments.forEach(comment => {
            const commentEl = document.createElement('div');
            commentEl.className = 'comment-card';
            
            const date = new Date(comment.created_at).toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });

            // === MODIFIED: Create avatar URL ===
            const avatarName = encodeURIComponent(comment.name);
            // Generate a colorful, rounded avatar from the user's name
            const avatarURL = `https://ui-avatars.com/api/?name=${avatarName}&background=6366f1&color=fff&size=40&rounded=true&font-size=0.33`;
            // === END MODIFICATION ===

            // === MODIFIED: New HTML structure with avatar ===
            commentEl.innerHTML = `
                <div class="comment-avatar">
                    <img src="${avatarURL}" alt="${escapeHTML(comment.name)}" />
                </div>
                <div class="comment-content-wrapper">
                    <div class="comment-header">
                        <span class="comment-name">${escapeHTML(comment.name)}</span>
                        <span class="comment-date">${date}</span>
                    </div>
                    <p class="comment-body">${escapeHTML(comment.content)}</p>
                </div>
            `;
            // === END MODIFICATION ===

            commentsList.appendChild(commentEl);
        });
    }

    // Handles the comment form submission
    if (commentForm) {
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            commentSubmitBtn.disabled = true;
            commentSubmitBtn.textContent = 'Posting...';

            const post_id = commentPostIdInput.value;
            const name = commentNameInput.value;
            const content = commentContentInput.value;

            try {
                const response = await fetch('/api/comments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ post_id, name, content })
                });

                if (!response.ok) throw new Error('Failed to post comment');
                
                showSnackbar('Comment submitted for moderation!');
                commentForm.reset(); 
            } catch (error) {
                console.error(error);
                showSnackbar('Error: Could not post comment.');
            } finally {
                commentSubmitBtn.disabled = false;
                commentSubmitBtn.textContent = 'Post Comment';
            }
        });
    }

    // Helper function to prevent XSS attacks
    function escapeHTML(str) {
        return str.replace(/[&<>"']/g, function(m) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[m];
        });
    }
    // --- END: COMMENT LOGIC ---

    function renderMoreBlogsList() {
        if (!moreBlogsList) return; 
        moreBlogsList.innerHTML = '';
        
        const sortedPosts = [...blogPosts].sort((a, b) => b.id - a.id);
        
        if (sortedPosts.length === 0) {
             moreBlogsList.innerHTML = `<p class="p-2" style="color: var(--nav-link-color);">No other posts found.</p>`;
             return;
        }

        sortedPosts.forEach(post => {
            const link = document.createElement('a');
            link.href = '#';
            link.className = 'more-blog-link';
            link.dataset.postId = post.id;
            link.title = post.title;

            const colorClass = categoryColors[post.category] || "bg-gray-500/20 text-gray-300 border-gray-500/30";

            let tagsHTML = '';
            if (post.tags && post.tags.length > 0) {
                tagsHTML = post.tags.slice(0, 2).map(tag => `<span class="more-blog-tag">${tag}</span>`).join(' ');
            }

            link.innerHTML = `
                <span class="more-blog-link-title truncate">${post.title}</span>
                <div class="more-blog-meta">
                    ${post.category ? `<span class="more-blog-category-pill ${colorClass}">${post.category}</span>` : ''}
                    ${tagsHTML}
                </div>
            `;
            moreBlogsList.appendChild(link);
        });
    }


    function renderCurrentPage() {
        const startIndex = (currentPage - 1) * postsPerPage;
        const endIndex = currentPage * postsPerPage;
        const paginatedPosts = filteredPosts.slice(startIndex, endIndex);
        renderPosts(paginatedPosts);
        renderPaginationControls();
    }

    function renderPaginationControls() {
        paginationControls.innerHTML = ''; 
        const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
        if (totalPages <= 1) return;

        const prevButton = document.createElement('button');
        prevButton.id = 'prev-page-btn';
        prevButton.className = 'pagination-btn';
        prevButton.innerHTML = `<i data-lucide="arrow-left" class="w-4 h-4 mr-2"></i> Previous`;
        prevButton.disabled = (currentPage === 1);
        prevButton.addEventListener('click', prevPage);
        
        const pageStatus = document.createElement('span');
        pageStatus.className = 'text-sm font-medium';
        pageStatus.style.color = "var(--nav-link-color)";
        pageStatus.textContent = `Page ${currentPage} of ${totalPages}`;

        const nextButton = document.createElement('button');
        nextButton.id = 'next-page-btn';
        nextButton.className = 'pagination-btn';
        nextButton.innerHTML = `Next <i data-lucide="arrow-right" class="w-4 h-4 ml-2"></i>`;
        nextButton.disabled = (currentPage === totalPages);
        nextButton.addEventListener('click', nextPage);

        paginationControls.appendChild(prevButton);
        paginationControls.appendChild(pageStatus);
        paginationControls.appendChild(nextButton);
        lucide.createIcons();
    }

    function nextPage() {
        const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderCurrentPage();
            blogFeed.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    function prevPage() {
        if (currentPage > 1) {
            currentPage--;
            renderCurrentPage();
            blogFeed.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function renderPosts(postsToRender) {
        blogFeed.innerHTML = ''; 
        if (postsToRender.length === 0) {
            let message = `<div class="text-center p-6 glass rounded-xl" style="border-color: var(--glass-border);">
                                <i data-lucide="archive-x" class="w-16 h-16 mx-auto text-gray-500 mb-4"></i>
                                <h3 class="text-2xl font-semibold" style="color: var(--body-color);">No Posts Found</h3>
                                <p class="mt-2" style="color: var(--nav-link-color);">No posts found matching your criteria.</p>
                           </div>`;
            
            if (activeCategory !== 'all' && filteredPosts.length === 0) {
                message = `<div class="text-center p-6 glass rounded-xl" style="border-color: var(--glass-border);">
                                <i data-lucide="archive-x" class="w-16 h-16 mx-auto text-gray-500 mb-4"></i>
                                <h3 class="text-2xl font-semibold" style="color: var(--body-color);">This Archive is Quiet</h3>
                                <p class="mt-2" style="color: var(--nav-link-color);">There are no posts in the '${activeCategory}' category just yet. Check back soon!</p>
                           </div>`;
                showSnackbar(`No posts yet in '${activeCategory}'.`);
            }
            blogFeed.innerHTML = message;
            lucide.createIcons(); 
            return; 
        }

        postsToRender.forEach(post => {
            const postElement = document.createElement('article');
            postElement.className = 'post-card rounded-2xl overflow-hidden';
            const color = categoryColors[post.category] || "bg-gray-500/20 text-gray-300 border-gray-500/30";

            postElement.innerHTML = `
                <img class="w-full h-64 object-cover post-image" src="${post.image}" alt="${post.title}" onerror="this.src='https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'">
                <div class="p-6 flex flex-col flex-grow">
                    <div>
                        <span class="${color} text-xs font-medium px-2.5 py-0.5 rounded-full border">${post.category}</span>
                        <h2 class="mt-3 mb-2 text-2xl font-semibold hover:text-blue-400 transition-colors" style="color: var(--body-color);">
                            <a href="#" class="view-post-link" data-post-id="${post.id}">${post.title}</a>
                        </h2>
                        <div class="flex items-center text-sm text-gray-400 mb-3">
                            <i data-lucide="calendar-days" class="w-4 h-4 mr-1.5"></i>
                            <span>${post.date}</span>
                        </div>
                        <p class="leading-relaxed mb-4" style="color: var(--nav-link-color);">${post.excerpt}</p>
                    </div>
                    <div class="mt-auto">
                        <a href="#" class="view-post-link inline-flex items-center text-blue-400 hover:text-blue-300 font-medium group" data-post-id="${post.id}">
                        Read More
                        <i data-lucide="arrow-right" class="w-4 h-4 ml-1 transition-transform duration-200 group-hover:translate-x-1"></i>
                        </a>
                        <div class="mt-4 flex flex-wrap gap-2">
                        ${(post.tags || []).map(tag => `
                            <span class="flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full" style="background-color: var(--glass-bg); color: var(--nav-link-color); border: 1px solid var(--glass-border);">
                            <i data-lucide="tag" class="w-3 h-3 mr-1"></i>
                            ${tag}
                            </span>
                        `).join('')}
                        </div>
                    </div>
                </div>
                `;
            blogFeed.appendChild(postElement);
        });
    }

    function renderCategories() {
        categoryList.innerHTML = '<li><a href="#" class="block px-4 py-2 rounded-xl transition-all duration-200 category-link category-active" data-category="all">All Posts</a></li>';
        mobileCategoryListCustom.innerHTML = '';
        
        let allLiCustom = document.createElement('li');
        allLiCustom.innerHTML = `<a href="#" class="block px-4 py-2 category-link-custom" style="color: var(--nav-link-color);" data-category="all">All Categories</a>`;
        mobileCategoryListCustom.appendChild(allLiCustom);

        const categoryNames = Object.keys(allCategories).sort();

        categoryNames.forEach(category => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="#" class="block px-4 py-2 rounded-xl transition-all duration-200 category-link" data-category="${category}">${category}</a>`;
            categoryList.appendChild(li);
            
            const liCustom = document.createElement('li');
            liCustom.innerHTML = `<a href="#" class="block px-4 py-2 category-link-custom" style="color: var(--nav-link-color);" data-category="${category}">${category}</a>`;
            mobileCategoryListCustom.appendChild(liCustom);
        });
    }

    function renderTags() {
        let tagsToShow = [];
        if (activeCategory === 'all') {
            const allTags = new Set();
            Object.values(allCategories).forEach(tagArray => {
                tagArray.forEach(tag => allTags.add(tag));
            });
            tagsToShow = Array.from(allTags).sort();
        } else {
            tagsToShow = (allCategories[activeCategory] || []).sort();
        }
        
        const hasTags = tagsToShow.length > 0;
        tagContainer.style.display = hasTags ? 'block' : 'none';
        mobileTagList.style.display = hasTags ? 'flex' : 'none';
        mobileTagListLabel.style.display = hasTags ? 'block' : 'none';

        tagList.innerHTML = ''; 
        mobileTagList.innerHTML = ''; 

        const createTagChip = (tag, isMobile) => {
            const tagChip = document.createElement('button');
            let isActive = (tag === 'all' && !activeTag) || (activeTag === tag);
            const mobileClass = isMobile ? 'flex-shrink-0 ' : '';

            tagChip.className = `${mobileClass}tag-chip px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 ${isActive ? 'tag-active' : 'border'}`;
            if (!isActive) {
                tagChip.style.backgroundColor = "var(--glass-bg)";
                tagChip.style.color = "var(--nav-link-color)";
                tagChip.style.borderColor = "var(--glass-border)";
            }
            tagChip.textContent = (tag === 'all') ? 'All Tags' : tag;
            tagChip.dataset.tag = tag;
            return tagChip;
        };

        if (tagsToShow.length > 0 || activeCategory === 'all') {
            tagList.appendChild(createTagChip('all', false));
            mobileTagList.appendChild(createTagChip('all', true));
        }

        tagsToShow.forEach(tag => {
            tagList.appendChild(createTagChip(tag, false));
            mobileTagList.appendChild(createTagChip(tag, true));
        });
    }
    
    function showSnackbar(message) {
        snackbarMessage.textContent = message;
        snackbar.className = "snackbar show";
        setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 4000);
    }

    function filterAndRender() {
        let tempPosts = blogPosts;
        if (activeCategory !== 'all') {
            tempPosts = tempPosts.filter(post => post.category === activeCategory);
        }
        if (activeTag) {
            tempPosts = tempPosts.filter(post => post.tags && post.tags.includes(activeTag));
        }
        tempPosts.sort((a, b) => (b.id - a.id));
        filteredPosts = tempPosts;
        currentPage = 1; 
        renderCurrentPage(); 
        updateCategoryUI();
        renderTags(); 
        updateFeedTitle();
        lucide.createIcons();
    }

    function updateCategoryUI() {
        document.querySelectorAll('#category-list .category-link').forEach(link => {
        if (link.dataset.category === activeCategory) {
            link.classList.add('category-active');
        } else {
            link.classList.remove('category-active');
        }
        });
        
        const selectedText = (activeCategory === 'all') ? 'All Categories' : activeCategory;
        mobileCategoryLabel.textContent = selectedText;

        mobileCategoryListCustom.querySelectorAll('.category-link-custom').forEach(link => {
        if (link.dataset.category === activeCategory) {
            link.classList.add('category-link-custom-active');
            link.style.color = "#c7d2fe"; // Active color
        } else {
            link.classList.remove('category-link-custom-active');
            link.style.color = "var(--nav-link-color)"; // Default color
        }
    });
    }

    function updateFeedTitle() {
        let title = "Recent Posts"; 
        if (activeCategory !== 'all') title = `Posts in: ${activeCategory}`;
        if (activeTag) {
            title = (activeCategory !== 'all') ? `${title} | ${activeTag}` : `Posts tagged: ${activeTag}`;
        }
        
        if (typewriterInterval) clearInterval(typewriterInterval);
        feedTitle.textContent = '';
        feedTitle.classList.add('typewriter'); 
        
        let i = 0;
        const typingSpeed = 50;
        typewriterInterval = setInterval(() => {
            if (i < title.length) {
                feedTitle.textContent += title.charAt(i);
                i++;
            } else {
                clearInterval(typewriterInterval);
                typewriterInterval = null;
            }
        }, typingSpeed);
    }

    function showPost(postId) {
        const post = blogPosts.find(p => p.id == postId);
        if (!post) return;

        document.getElementById('post-title').innerHTML = `<i data-lucide="book-open" class="w-10 h-10 -mt-2 mr-3 inline-block text-gray-500"></i> ${post.title}`;
        document.getElementById('post-date').innerHTML = `<i data-lucide="calendar-days" class="w-4 h-4 mr-2 inline-block text-gray-500"></i> ${post.date}`;
        document.getElementById('post-image').src = post.image; 
        document.getElementById('post-image').alt = post.title; 
        
        const postContent = document.getElementById('post-content');
        
        const currentTheme = localStorage.getItem('theme') || 'dark';
        if (currentTheme === 'dark' || currentTheme === 'slate') {
            postContent.classList.add('prose-invert');
        } else {
            postContent.classList.remove('prose-invert');
        }
        
        postContent.innerHTML = post.fullContent;
        postContent.classList.add('prose-headings:font-bold');

        if (moreBlogsList) {
            moreBlogsList.querySelectorAll('.more-blog-link').forEach(link => {
                if (link.dataset.postId == postId) {
                    link.classList.add('more-blog-active');
                    link.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                } else {
                    link.classList.remove('more-blog-active');
                }
            });
        }

        feedView.classList.add('hidden');
        feedView.classList.remove('md:flex'); 
        postView.classList.remove('hidden');
        postView.classList.add('md:flex', 'md:space-x-4', 'lg:space-x-8', 'animate__fadeIn'); 

        // === THIS IS THE FIX ===
        // 1. Reset the form first (clears all fields)
        if (commentForm) commentForm.reset();
        // 2. THEN set the hidden post ID
        if (commentPostIdInput) commentPostIdInput.value = post.id;
        // 3. Load the comments for this post
        loadComments(post.id);
        // === END FIX ===

        window.scrollTo(0, 0);
        lucide.createIcons();
    }

    function showFeed() {
        postView.classList.add('hidden');
        postView.classList.remove('md:flex', 'md:space-x-4', 'lg:space-x-8', 'animate__fadeIn');
        feedView.classList.remove('hidden');
        feedView.classList.add('md:flex'); 
        feedView.classList.add('animate__fadeIn');
        updateFeedTitle(); 
    }
    
    function closeMobileMenu() {
        if (!mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
            menuIconOpen.classList.add('hidden');
            menuIconClosed.classList.remove('hidden');
            mobileMenuButton.setAttribute('aria-expanded', 'false');
        }
    }
    
    // --- EVENT LISTENERS ---

    const handleCategoryClick = (e) => {
        const link = e.target.closest('.category-link');
        if (!link) return; 
        e.preventDefault();
        activeCategory = link.dataset.category;
        activeTag = null; 
        filterAndRender();
        showFeed();
    };
    categoryList.addEventListener('click', handleCategoryClick);
    
    
    mobileCategoryToggle.addEventListener('click', () => {
        const isHidden = mobileCategoryMenu.classList.toggle('hidden');
        mobileCategoryChevron.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
    });

    mobileCategoryMenu.addEventListener('click', (e) => {
        const link = e.target.closest('.category-link-custom');
        if (link) {
            e.preventDefault();
            activeCategory = link.dataset.category;
            activeTag = null;
            mobileCategoryMenu.classList.add('hidden');
            mobileCategoryChevron.style.transform = 'rotate(0deg)';
            filterAndRender();
            showFeed();
        }
    });

    window.addEventListener('click', (e) => {
        if (!mobileCategoryToggle.contains(e.target) && !mobileCategoryMenu.contains(e.target)) {
            if (!mobileCategoryMenu.classList.contains('hidden')) {
                mobileCategoryMenu.classList.add('hidden');
                mobileCategoryChevron.style.transform = 'rotate(0deg)';
            }
        }
    });

    const handleTagClick = (e) => {
        const tagChip = e.target.closest('.tag-chip');
        if (tagChip) {
            e.preventDefault();
            const tag = tagChip.dataset.tag;
            activeTag = (tag === 'all' || activeTag === tag) ? null : tag;
            filterAndRender();
        }
    };
    tagList.addEventListener('click', handleTagClick);
    mobileTagList.addEventListener('click', handleTagClick);

    blogFeed.addEventListener('click', (e) => {
        const link = e.target.closest('.view-post-link');
        if (link && link.dataset.postId) {
            e.preventDefault();
            showPost(link.dataset.postId);
        }
    });

    if (moreBlogsList) {
        moreBlogsList.addEventListener('click', (e) => {
            const link = e.target.closest('.more-blog-link');
            if (link && link.dataset.postId) {
                e.preventDefault();
                showPost(link.dataset.postId);
            }
        });
    }

    backButton.addEventListener('click', (e) => {
        e.preventDefault();
        showFeed();
    });

    const goHome = (e) => {
        e.preventDefault();
        activeCategory = 'all';
        activeTag = null;
        filterAndRender();
        showFeed();
        window.scrollTo(0, 0); 
    };
    homeLink.addEventListener('click', goHome);
    
    mobileMenuButton.addEventListener('click', () => {
        const expanded = mobileMenuButton.getAttribute('aria-expanded') === 'true' || false;
        mobileMenuButton.setAttribute('aria-expanded', !expanded);
        mobileMenu.classList.toggle('hidden');
        menuIconClosed.classList.toggle('hidden');
        menuIconOpen.classList.toggle('hidden');
    });

    mobileMenu.addEventListener('click', (e) => {
        const target = e.target.closest('a.mobile-nav-link');
        if (!target || target.id === 'mobile-theme-toggle') return; // Ignore theme toggle click

        const href = target.getAttribute('href');
        if (href && href.startsWith('#')) {
            e.preventDefault(); 
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        closeMobileMenu();
    });
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            toTopButton.classList.add('show');
        } else {
            toTopButton.classList.remove('show');
        }
    });

    toTopButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // --- INITIAL LOAD ---
    loadBlogData(); 

});
    </script>

</body>

</html>

}

{
type: uploaded file
fileName: abhijeetsachan/blog-site/blog-site-932aa32a6cc8bb889ddec9840a4c92ed114d71cd/admin/server.js
fullContent:
/*
 * ==========================================================================
 * !! IMPORTANT: SUPABASE SETUP INSTRUCTIONS !!
 * ==========================================================================
 * * Before this server will work, you MUST set up your Supabase database.
 * * 1. Create a new project in Supabase.
 * 2. Go to the "SQL Editor" section (the one with the `>` icon).
 * 3. Click "New query" and paste ALL of the code below and click "RUN".
 *
 * ------------------- PASTE THIS IN SUPABASE SQL EDITOR --------------------
 *
 * -- Create the 'posts' table
 * CREATE TABLE public.posts (
 * id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
 * created_at TIMESTAMPTZ DEFAULT now(),
 * title TEXT NOT NULL,
 * category TEXT,
 * tags TEXT[],
 * image TEXT,
 * excerpt TEXT,
 * "fullContent" TEXT,
 * published BOOLEAN DEFAULT false,
 * date TEXT
 * );
 * * -- Create the 'categories' table
 * CREATE TABLE public.categories (
 * id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
 * created_at TIMESTAMPTZ DEFAULT now(),
 * name TEXT NOT NULL UNIQUE,
 * tags TEXT[] DEFAULT ARRAY[]::TEXT[]
 * );
 *
 * -- Create the 'comments' table WITH moderation
 * CREATE TABLE public.comments (
 * id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
 * created_at TIMESTAMPTZ DEFAULT now(),
 * post_id BIGINT NOT NULL,
 * name TEXT NOT NULL,
 * content TEXT NOT NULL,
 * is_approved BOOLEAN DEFAULT false,
 * CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id)
 * REFERENCES public.posts (id) ON DELETE CASCADE
 * );
 *
 * * -- Create a helper function to remove an item from a text array
 * CREATE OR REPLACE FUNCTION array_remove(arr TEXT[], item TEXT)
 * RETURNS TEXT[] AS $$
 * BEGIN
 * RETURN array_agg(elem) FROM unnest(arr) AS elem WHERE elem <> item;
 * END;
 * $$ LANGUAGE plpgsql;
 * * -- Create a helper function to replace an item in a text array
 * CREATE OR REPLACE FUNCTION array_replace(arr TEXT[], old_item TEXT, new_item TEXT)
 * RETURNS TEXT[] AS $$
 * DECLARE
 * new_arr TEXT[];
 * BEGIN
 * SELECT array_agg(CASE WHEN elem = old_item THEN new_item ELSE elem END)
 * INTO new_arr
 * FROM unnest(arr) AS elem;
 * RETURN new_arr;
 * END;
 * $$ LANGUAGE plpgsql;
 *
 * -- Enable Row Level Security (RLS) for all tables
 * ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
 *
 * -- Create policies for 'posts' and 'categories'
 * CREATE POLICY "Public tables are viewable by everyone" 
 * ON public.posts FOR SELECT USING (true);
 * CREATE POLICY "Public categories are viewable by everyone" 
 * ON public.categories FOR SELECT USING (true);
 *
 * -- Create policies for 'comments'
 * CREATE POLICY "Public can only see approved comments"
 * ON public.comments FOR SELECT
 * USING (is_approved = true);
 *
 * CREATE POLICY "Anyone can create comments"
 * ON public.comments
 * FOR INSERT
 * TO anon -- This explicitly names the public (anonymous) role
 * WITH CHECK (true);
 * * * ------------------------- END OF SQL CODE --------------------------------
 *
 * 4. Go to "Project Settings" (the gear icon).
 * 5. Go to "API".
 * 6. Find the "Project URL", "anon" "public" key, and "service_role" "secret" key.
 * 7. You will add these to your environment variables (e.g., in a `.env` file
 * or in your hosting provider's settings) along with your other secrets.
 * * SUPABASE_URL="YOUR_PROJECT_URL"
 * SUPABASE_ANON_KEY="YOUR_ANON_KEY" (This is still needed for public)
 * SUPABASE_SERVICE_KEY="YOUR_SERVICE_ROLE_KEY" (This is the new one)
 * ADMIN_USER="admin"
 * ADMIN_PASS="password123"
 * SESSION_SECRET="your-very-secret-key-change-this"
 * * ==========================================================================
 */

const express = require('express');
const path = require('path');
const cors = require('cors'); 
const session = require('express-session');
const { createClient } = require('@supabase/supabase-js');

// --- Load Environment Variables (for local development) ---
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: path.join(__dirname, '.env') });
}

const app = express();
// Render provides the PORT environment variable
const PORT = process.env.PORT || 3000;

// --- SUPABASE & ADMIN CREDENTIALS ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
// === NEW: Add the Service Role Key ===
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;
const SESSION_SECRET = process.env.SESSION_SECRET;

// === MODIFIED: Check for the new key ===
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY || !ADMIN_USER || !ADMIN_PASS || !SESSION_SECRET) {
    console.error('FATAL ERROR: Missing required environment variables. (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, ADMIN_USER, ADMIN_PASS, SESSION_SECRET)');
    console.log('Please check your .env file or hosting environment.');
    process.exit(1);
}

// === MODIFIED: Initialize Supabase Client with the Service Role Key ===
// This gives the server "admin" rights, bypassing RLS.
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
// === END MODIFICATION ===

// --- Middleware ---
app.use(cors()); 
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true }));

// --- Session Middleware ---
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { 
        maxAge: 1000 * 60 * 60 * 24 // 1 day
        // secure: process.env.NODE_ENV === 'production' // Enable this if you are using HTTPS
    }
}));


// --- Helper Function to format categories ---
function formatCategories(categoryList) {
    if (!categoryList) return {};
    return categoryList.reduce((acc, cat) => {
        acc[cat.name] = cat.tags || [];
        return acc;
    }, {});
}

// --- Authentication Middleware ---
function checkAuth(req, res, next) {
    if (req.session.isLoggedIn) {
        next();
    } else {
        res.redirect('/admin/login.html');
    }
}

function checkApiAuth(req, res, next) {
    if (req.session.isLoggedIn) {
        next();
    } else {
        res.status(401).json({ message: 'Unauthorized: Please log in.' });
    }
}

// ===================================================================
//
//               *** ROUTING ORDER ***
//
// All specific API routes and page routes are defined *BEFORE*
// the `express.static` file server.
//
// ===================================================================

// --- AUTH ROUTES ---
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        req.session.isLoggedIn = true;
        res.redirect('/admin/admin.html');
    } else {
        res.redirect('/admin/login.html?error=1');
    }
});

app.get('/admin/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/admin/admin.html');
        }
        res.clearCookie('connect.sid');
        res.redirect('/admin/login.html');
    });
});

// --- PROTECTED ADMIN PAGE ROUTE ---
app.get('/admin/admin.html', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// --- PUBLIC PAGE ROUTE (LOGIN) ---
app.get('/admin/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// --- PUBLIC API ENDPOINT ---
app.get('/api/public-data', async (req, res) => {
    console.log(`[GET /api/public-data] Reading from Supabase for public...`);
    
    const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('published', true)
        .order('id', { ascending: false });

    if (postsError) {
        console.error('Supabase error (posts):', postsError.message);
        return res.status(500).json({ message: 'Error reading posts.' });
    }

    const { data: categoriesList, error: catsError } = await supabase
        .from('categories')
        .select('name, tags');

    if (catsError) {
        console.error('Supabase error (categories):', catsError.message);
        return res.status(500).json({ message: 'Error reading categories.' });
    }

    const publicData = {
        categories: formatCategories(categoriesList),
        posts: posts || []
    };
    res.status(200).json(publicData);
});

// --- PROTECTED ADMIN API ENDPOINTS ---

// GET ALL DATA (FOR ADMIN)
app.get('/api/data', checkApiAuth, async (req, res) => {
    console.log(`[GET /api/data] Reading from Supabase for admin...`);

    const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('id', { ascending: false });

    if (postsError) {
        console.error('Supabase error (posts):', postsError.message);
        return res.status(500).json({ message: 'Error reading posts.' });
    }

    const { data: categoriesList, error: catsError } = await supabase
        .from('categories')
        .select('name, tags');

    if (catsError) {
        console.error('Supabase error (categories):', catsError.message);
        return res.status(500).json({ message: 'Error reading categories.' });
    }

    const adminData = {
        categories: formatCategories(categoriesList),
        posts: posts || []
    };
    res.status(200).json(adminData);
});

// --- POST MANAGEMENT (CRUD) ROUTES ---

// CREATE: POST /api/posts
app.post('/api/posts', checkApiAuth, async (req, res) => {
    const newPost = req.body;
    console.log('[POST /api/posts] Inserting new post...');

    if (!newPost || !newPost.title || !newPost.category) {
        return res.status(400).json({ message: 'Bad Request: Missing required fields.' });
    }
    
    const { error } = await supabase.from('posts').insert(newPost);

    if (error) {
        console.error('Supabase error:', error.message);
        return res.status(500).json({ message: 'Error saving post.' });
    }
    
    console.log('Post saved successfully!');
    res.status(200).json({ message: 'Post saved successfully!' });
});

// UPDATE: PUT /api/posts/:id
app.put('/api/posts/:id', checkApiAuth, async (req, res) => {
    const postId = parseInt(req.params.id);
    const updatedPost = req.body;
    console.log(`[PUT /api/posts/${postId}] Updating post...`);

    delete updatedPost.id;
    delete updatedPost.created_at; 

    const { error } = await supabase
        .from('posts')
        .update(updatedPost)
        .eq('id', postId);

    if (error) {
        console.error('Supabase error:', error.message);
        return res.status(500).json({ message: 'Error updating post.' });
    }

    console.log('Post updated successfully!');
    res.status(200).json({ message: 'Post updated successfully!' });
});

// DELETE: DELETE /api/posts/:id
app.delete('/api/posts/:id', checkApiAuth, async (req, res) => {
    const postId = parseInt(req.params.id);
    console.log(`[DELETE /api/posts/${postId}] Deleting post...`);

    const { error } = await supabase.from('posts').delete().eq('id', postId);

    if (error) {
        console.error('Supabase error:', error.message);
        return res.status(500).json({ message: 'Error deleting post.' });
    }

    console.log('Post deleted successfully!');
    res.status(200).json({ message: 'Post deleted successfully!' });
});

// TOGGLE PUBLISH: PUT /api/posts/toggle-publish/:id
app.put('/api/posts/toggle-publish/:id', checkApiAuth, async (req, res) => {
    const postId = parseInt(req.params.id);
    console.log(`[PUT /api/posts/toggle-publish/${postId}] Toggling...`);

    const { data: post, error: fetchError } = await supabase
        .from('posts')
        .select('published')
        .eq('id', postId)
        .single(); 

    if (fetchError || !post) {
        console.error('Supabase error:', fetchError ? fetchError.message : 'Post not found');
        return res.status(404).json({ message: 'Post not found.' });
    }

    const { error: updateError } = await supabase
        .from('posts')
        .update({ published: !post.published })
        .eq('id', postId);

    if (updateError) {
        console.error('Supabase error:', updateError.message);
        return res.status(500).json({ message: 'Error updating status.' });
    }

    console.log(`Post ${postId} status set to: ${!post.published}`);
    res.status(200).json({ message: 'Publish status updated successfully!' });
});

// --- CATEGORY MANAGEMENT ---

// CREATE: POST /api/categories
app.post('/api/categories', checkApiAuth, async (req, res) => {
    const newCategoryName = req.body.name;
    console.log(`[POST /api/categories] Request to add: ${newCategoryName}`);

    if (!newCategoryName) {
        return res.status(400).json({ message: 'Category name is required.' });
    }

    const { error } = await supabase
        .from('categories')
        .insert({ name: newCategoryName, tags: [] });

    if (error) {
        if (error.code === '23505') { 
            return res.status(400).json({ message: 'Category already exists.' });
        }
        console.error('Supabase error:', error.message);
        return res.status(500).json({ message: 'Error adding category.' });
    }

    console.log(`Added new category: ${newCategoryName}`);
    res.status(200).json({ message: 'Category added successfully!' });
});

// DELETE: DELETE /api/categories/:name
app.delete('/api/categories/:name', checkApiAuth, async (req, res) => {
    const categoryToDelete = decodeURIComponent(req.params.name);
    console.log(`[DELETE /api/categories] Request to delete: ${categoryToDelete}`);

    const { error: catError } = await supabase
        .from('categories')
        .delete()
        .eq('name', categoryToDelete);

    if (catError) {
        console.error('Supabase error (deleting category):', catError.message);
        return res.status(500).json({ message: 'Error deleting category.' });
    }

    const { error: postError } = await supabase
        .from('posts')
        .update({ category: "" }) 
        .eq('category', categoryToDelete);
    
    if (postError) {
        console.error('Supabase error (updating posts):', postError.message);
    }
    
    console.log(`Deleted category: ${categoryToDelete} and updated posts.`);
    res.status(200).json({ message: 'Category deleted successfully!' });
});

// EDIT/RENAME: PUT /api/categories/:name
app.put('/api/categories/:name', checkApiAuth, async (req, res) => {
    const oldName = decodeURIComponent(req.params.name);
    const { newName } = req.body;
    console.log(`[PUT /api/categories] Request to rename '${oldName}' to '${newName}'`);

    if (!newName || newName.trim() === '') {
        return res.status(400).json({ message: 'New category name is required.' });
    }
    
    const { error: catError } = await supabase
        .from('categories')
        .update({ name: newName })
        .eq('name', oldName);

    if (catError) {
        if (catError.code === '23505') { 
            return res.status(400).json({ message: 'Category name already exists.' });
        }
        console.error('Supabase error (renaming category):', catError.message);
        return res.status(500).json({ message: 'Error renaming category.' });
    }

    const { error: postError } = await supabase
        .from('posts')
        .update({ category: newName })
        .eq('category', oldName);
    
    if (postError) {
         console.error('Supabase error (updating posts):', postError.message);
    }

    console.log(`Renamed category to '${newName}' and updated posts.`);
    res.status(200).json({ message: 'Category renamed successfully!' });
});


// --- TAG MANAGEMENT ROUTES ---

// CREATE: POST /api/tags
app.post('/api/tags', checkApiAuth, async (req, res) => {
    const { categoryName, tagName } = req.body;
    console.log(`[POST /api/tags] Request to add tag '${tagName}' to '${categoryName}'`);
    if (!categoryName || !tagName) {
        return res.status(400).json({ message: 'Category name and tag name are required.' });
    }

    const { data: category, error: fetchError } = await supabase
        .from('categories')
        .select('tags')
        .eq('name', categoryName)
        .single();
    
    if (fetchError || !category) {
        return res.status(404).json({ message: 'Category not found.' });
    }
    
    if (category.tags && category.tags.includes(tagName)) {
        return res.status(400).json({ message: 'Tag already exists in this category.' });
    }

    const newTags = [...(category.tags || []), tagName];
    const { error: updateError } = await supabase
        .from('categories')
        .update({ tags: newTags })
        .eq('name', categoryName);

    if (updateError) {
        console.error('Supabase error:', updateError.message);
        return res.status(500).json({ message: 'Error adding tag.' });
    }

    console.log('Tag added successfully');
    res.status(200).json({ message: 'Tag added successfully!' });
});

// DELETE: DELETE /api/tags/:categoryName/:tagName
app.delete('/api/tags/:categoryName/:tagName', checkApiAuth, async (req, res) => {
    const categoryName = decodeURIComponent(req.params.categoryName);
    const tagName = decodeURIComponent(req.params.tagName);
    console.log(`[DELETE /api/tags] Request to delete tag '${tagName}' from '${categoryName}'`);

    const { data: category, error: fetchError } = await supabase
        .from('categories')
        .select('tags')
        .eq('name', categoryName)
        .single();
    
    if (fetchError || !category) {
        return res.status(44).json({ message: 'Category not found.' });
    }

    if (!category.tags || !category.tags.includes(tagName)) {
        return res.status(404).json({ message: 'Tag not found in this category.' });
    }
    
    const newTags = category.tags.filter(t => t !== tagName);
    const { error: updateError } = await supabase
        .from('categories')
        .update({ tags: newTags })
        .eq('name', categoryName);

    if (updateError) {
        console.error('Supabase error (updating category):', updateError.message);
        return res.status(500).json({ message: 'Error deleting tag from category.' });
    }

    const { data: posts, error: postFetchError } = await supabase
        .from('posts')
        .select('id, tags')
        .eq('category', categoryName)
        .contains('tags', [tagName]);
    
    if (postFetchError) {
        console.error('Supabase error (fetching posts for tag removal):', postFetchError.message);
        return res.status(500).json({ message: 'Tag deleted, but failed to update posts.' });
    }

    const updates = posts.map(post => {
        return supabase
            .from('posts')
            .update({ tags: post.tags.filter(t => t !== tagName) })
            .eq('id', post.id);
    });
    
    await Promise.all(updates); 

    console.log('Tag deleted successfully and removed from posts.');
    res.status(200).json({ message: 'Tag deleted successfully!' });
});

// EDIT/RENAME: PUT /api/tags/:categoryName/:tagName
app.put('/api/tags/:categoryName/:tagName', checkApiAuth, async (req, res) => {
    const categoryName = decodeURIComponent(req.params.categoryName);
    const oldTagName = decodeURIComponent(req.params.tagName);
    const { newTagName } = req.body;
    console.log(`[PUT /api/tags] Request to rename tag '${oldTagName}' to '${newTagName}' in '${categoryName}'`);

    if (!newTagName || newName.trim() === '') {
        return res.status(400).json({ message: 'New tag name is required.' });
    }

    const { data: category, error: fetchError } = await supabase
        .from('categories')
        .select('tags')
        .eq('name', categoryName)
        .single();
    
    if (fetchError || !category) {
        return res.status(404).json({ message: 'Category not found.' });
    }
    
    if (!category.tags || !category.tags.includes(oldTagName)) {
        return res.status(404).json({ message: 'Tag to rename not found.' });
    }
    
    if (category.tags.includes(newTagName)) {
        return res.status(400).json({ message: 'Tag name already exists in this category.' });
    }

    const newTags = category.tags.map(t => (t === oldTagName ? newTagName : t));
    const { error: updateError } = await supabase
        .from('categories')
        .update({ tags: newTags })
        .eq('name', categoryName);

    if (updateError) {
        console.error('Supabase error (updating category):', updateError.message);
        return res.status(500).json({ message: 'Error renaming tag in category.' });
    }
    
    const { data: posts, error: postFetchError } = await supabase
        .from('posts')
        .select('id, tags')
        .eq('category', categoryName)
        .contains('tags', [oldTagName]);
    
    if (postFetchError) {
        console.error('Supabase error (fetching posts for tag rename):', postFetchError.message);
        return res.status(500).json({ message: 'Tag renamed, but failed to update posts.' });
    }
    
    const updates = posts.map(post => {
        return supabase
            .from('posts')
            .update({ tags: post.tags.map(t => (t === oldTagName ? newTagName : t)) })
            .eq('id', post.id);
    });
    
    await Promise.all(updates);

    console.log(`Renamed tag to '${newTagName}' and updated posts.`);
    res.status(200).json({ message: 'Tag renamed successfully!' });
});


// === ADMIN COMMENT MODERATION ROUTES ===

// GET: Fetch ALL comments (pending and approved) for admin
app.get('/api/admin/comments', checkApiAuth, async (req, res) => {
    console.log(`[GET /api/admin/comments] Fetching all comments for moderation...`);
    
    // Join with posts to get post title, which is helpful for context
    const { data: comments, error } = await supabase
        .from('comments')
        .select(`
            id,
            created_at,
            name,
            content,
            is_approved,
            post_id,
            post:posts ( title )
        `)
        .order('created_at', { ascending: false }); // Show newest first for admin

    if (error) {
        console.error('Supabase error (fetching all comments):', error.message);
        return res.status(500).json({ message: 'Error fetching comments.' });
    }
    
    res.status(200).json(comments || []);
});

// APPROVE: PUT /api/comments/approve/:id
app.put('/api/comments/approve/:id', checkApiAuth, async (req, res) => {
    const commentId = parseInt(req.params.id);
    console.log(`[PUT /api/comments/approve/${commentId}] Approving comment...`);

    const { error } = await supabase
        .from('comments')
        .update({ is_approved: true })
        .eq('id', commentId);

    if (error) {
        console.error('Supabase error (approving comment):', error.message);
        return res.status(500).json({ message: 'Error approving comment.' });
    }

    res.status(200).json({ message: 'Comment approved!' });
});

// DELETE: DELETE /api/comments/:id
app.delete('/api/comments/:id', checkApiAuth, async (req, res) => {
    const commentId = parseInt(req.params.id);
    console.log(`[DELETE /api/comments/${commentId}] Deleting comment...`);

    const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

    if (error) {
        console.error('Supabase error (deleting comment):', error.message);
        return res.status(500).json({ message: 'Error deleting comment.' });
    }

    res.status(200).json({ message: 'Comment deleted!' });
});


// === PUBLIC COMMENT ROUTES ===

// GET: Fetch all *APPROVED* comments for a specific post
app.get('/api/comments/:postId', async (req, res) => {
    const { postId } = req.params;
    
    const { data: comments, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .eq('is_approved', true) // <-- IMPORTANT: Only show approved
        .order('created_at', { ascending: true }); // Show oldest first

    if (error) {
        console.error('Supabase error (fetching comments):', error.message);
        return res.status(500).json({ message: 'Error fetching comments.' });
    }
    
    res.status(200).json(comments || []);
});

// POST: Submit a new comment (will be 'is_approved: false' by default)
app.post('/api/comments', async (req, res) => {
    
    const { post_id, name, content } = req.body;

    // 1. Check if fields exist
    if (!post_id || !name || !content) {
        console.error('Validation failed: Missing fields.', req.body);
        return res.status(400).json({ message: 'Missing required fields (post_id, name, content).' });
    }
    
    // 2. Parse/trim them
    const numeric_post_id = parseInt(post_id, 10);
    const trimmedName = name.trim();
    const trimmedContent = content.trim();

    // 3. Check if they are empty *after* trimming
    if (!numeric_post_id || !trimmedName || !trimmedContent) {
        console.error('Validation failed: Fields are empty after trimming.');
        return res.status(400).json({ message: 'All fields must have a value.' });
    }
    
    // 4. Proceed with insert
    // === THIS IS THE FIX: .select() has been removed ===
    const { error } = await supabase
        .from('comments')
        .insert([
            { post_id: numeric_post_id, name: trimmedName, content: trimmedContent }
        ]);
    // === END FIX ===

    if (error) {
        console.error('SupABASE ERROR (inserting comment):', error.message); // <-- More specific log
        console.error('Data sent to Supabase:', { post_id: numeric_post_id, name: trimmedName, content: trimmedContent });
        return res.status(500).json({ message: 'Error posting comment.' });
    }

    console.log('New comment posted, awaiting moderation.');
    res.status(201).json({ message: 'Comment submitted for moderation!' });
});
// === END OF COMMENT ROUTES ===


// --- STATIC FILE SERVER (NOW LAST) ---
// This serves all other static files (CSS, JS, images) from the root.
app.use(express.static(path.join(__dirname, '..'), {
    index: false, // We handle the index route ourselves
    setHeaders: (res, filePath) => {
        // Block sensitive files just in case
        if (filePath.endsWith('admin.html') || filePath.endsWith('db.json')) {
            res.status(403).send('Forbidden');
        }
    }
}));

// --- ROOT PAGE ROUTE (CATCH-ALL) ---
// This must be one of the last routes.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});


// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`--- Blog Server & Admin Panel (Supabase Mode) ---`);
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Public Blog: http://localhost:${PORT}`);
    console.log(`Admin Login: http://localhost:${PORT}/admin/login.html`);
    console.log(`-------------------------------------------------`);
});

}
