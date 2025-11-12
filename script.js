console.log("--- SCRIPT.JS FILE HAS LOADED (Test 1) ---");

document.addEventListener('DOMContentLoaded', async () => {

            // --- START: MULTI-THEME TOGGLE LOGIC ---
            
            const THEMES = [
                { name: 'dark', icon: 'moon', label: 'Dark Theme' },
                { name: 'light', icon: 'sun', label: 'Light Theme' },
                { name: 'sepia', icon: 'book-open', label: 'Sepia Theme' },
                { name: 'slate', icon: 'layers', label: 'Slate Theme' },
                { name: 'matcha', icon: 'leaf', label: 'Matcha Theme' },
                { name: 'academic', icon: 'book-heart', label: 'Academic Theme' },
            ];
            
            const themeToggleButton = document.getElementById('theme-toggle-btn');
            const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
            const mobileThemeLabel = document.getElementById('mobile-theme-label');
            const postContent = document.getElementById('post-content');
            
            // --- FIX 1: Icon selectors are MOVED from here ---

            function applyTheme(themeName) {
                // --- FIX 1: Icon selectors are MOVED *INSIDE* here ---
                const desktopIcons = document.querySelectorAll('[data-theme-icon]');
                const mobileIcons = document.querySelectorAll('[data-theme-icon-mobile]');
                // --- END FIX 1 ---

                const theme = THEMES.find(t => t.name === themeName) || THEMES[0];
                document.documentElement.setAttribute('data-theme', theme.name);
                localStorage.setItem('theme', theme.name);
                
                if (theme.name === 'dark' || theme.name === 'slate' || theme.name === 'academic') {
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
            
            // --- FIX 2: This function is now *OUTSIDE* (separate from) applyTheme ---
            function cycleTheme(e) {
                e.preventDefault(); 
                const currentThemeName = localStorage.getItem('theme') || 'dark';
                const currentIndex = THEMES.findIndex(t => t.name === currentThemeName);
                const nextIndex = (currentIndex + 1) % THEMES.length;
                applyTheme(THEMES[nextIndex].name);
                
                // The 'if' block that called closeMobileMenu() has been removed.
            }
            // --- END FIX 2 ---

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
            const LIKED_POSTS_KEY = 'likedPosts';

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
            
            // --- UPDATED: LIKE & SHARE REFERENCES ---
            const likeButton = document.getElementById('like-button');
            const likeCount = document.getElementById('like-count');
            // const shareInstagram = document.getElementById('share-instagram');
            const shareFacebook = document.getElementById('share-facebook');
            const shareWhatsapp = document.getElementById('share-whatsapp');
            const shareTelegram = document.getElementById('share-telegram');

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
                    
                    blogPosts = data.posts || []; // This now includes 'likes'
                    allCategories = data.categories || {};
                    
                    renderCategories();
                    renderMoreBlogsList();
                    checkUrlHashAndRoute(); // <-- This will now correctly route on initial load
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

            function getLikedPosts() {
                try {
                    const liked = localStorage.getItem(LIKED_POSTS_KEY);
                    return liked ? JSON.parse(liked) : [];
                } catch (e) {
                    console.error("Could not parse liked posts from localStorage", e);
                    return [];
                }
            }

            function saveLikedPosts(likedPostsArray) {
                try {
                    localStorage.setItem(LIKED_POSTS_KEY, JSON.stringify(likedPostsArray));
                } catch (e) {
                    console.error("Could not save liked posts to localStorage", e);
                }
            }

            // --- START: COMMENT LOGIC ---
            
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

                    const avatarName = encodeURIComponent(comment.name);
                    const avatarURL = `https://ui-avatars.com/api/?name=${avatarName}&background=6366f1&color=fff&size=40&rounded=true&font-size=0.33`;

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

                    commentsList.appendChild(commentEl);
                });
            }

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
                    const postLikes = post.likes || 0;
                    
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
                                <div class="flex justify-between items-center">
                                    <a href="#" class="view-post-link inline-flex items-center text-blue-400 hover:text-blue-300 font-medium group" data-post-id="${post.id}">
                                    Read More
                                    <i data-lucide="arrow-right" class="w-4 h-4 ml-1 transition-transform duration-200 group-hover:translate-x-1"></i>
                                    </a>
                                    <div class="flex items-center gap-1 text-sm" style="color: var(--nav-link-color);">
                                        <i data-lucide="heart" class="w-4 h-4 ${postLikes > 0 ? 'text-pink-500 fill-pink-500' : ''}"></i>
                                        <span>${postLikes}</span>
                                    </div>
                                </div>
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

            // --- FIXED: showPost() ---
            // This function ONLY renders the post view. It does NOT change the hash.
            function showPost(postId) {
                const post = blogPosts.find(p => p.id == postId);
                if (!post) {
                    // If post not found (e.g., bad hash), go back to feed
                    window.location.hash = '';
                    return;
                }

                // --- Basic Post Info ---
                document.getElementById('post-title').innerHTML = `<i data-lucide="book-open" class="w-10 h-10 -mt-2 mr-3 inline-block text-gray-500"></i> ${post.title}`;
                document.getElementById('post-date').innerHTML = `<i data-lucide="calendar-days" class="w-4 h-4 mr-2 inline-block text-gray-500"></i> ${post.date}`;
                document.getElementById('post-image').src = post.image; 
                document.getElementById('post-image').alt = post.title; 
                
                // --- Post Content & Theme ---
                const postContent = document.getElementById('post-content');
                const currentTheme = localStorage.getItem('theme') || 'dark';
                if (currentTheme === 'dark' || currentTheme === 'slate' || currentTheme === 'academic') {
                    postContent.classList.add('prose-invert');
                } else {
                    postContent.classList.remove('prose-invert');
                }
                postContent.innerHTML = post.fullContent;
                postContent.classList.add('prose-headings:font-bold');

                // --- More Blogs List ---
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

                // --- View Switching ---
                feedView.classList.add('hidden');
                feedView.classList.remove('md:flex'); 
                postView.classList.remove('hidden');
                postView.classList.add('md:flex', 'md:space-x-4', 'lg:space-x-8', 'animate__fadeIn'); 

                // --- Comment Form Reset ---
                if (commentForm) commentForm.reset();
                if (commentPostIdInput) commentPostIdInput.value = post.id;
                loadComments(post.id);

                // --- UPDATED: Likes & Share Logic ---
                const postUrl = `${window.location.origin}${window.location.pathname}#post/${post.id}`;
                const postTitle = post.title;
                const encodedUrl = encodeURIComponent(postUrl);
                const encodedTitle = encodeURIComponent(postTitle);

                        // --- START DIAGNOSTIC TEST ---
                console.log("Running showPost function for post:", post.title);
                console.log("Found like button:", likeButton);
                console.log("Found like count span:", likeCount);
                // console.log("Found share-x link:", shareInstagram); // <-- This line was broken
                // --- END DIAGNOSTIC TEST ---


                // 1. Set Like Button State
                const currentLikes = post.likes || 0;
                likeCount.textContent = currentLikes;
                likeButton.classList.remove('liked');
                likeButton.disabled = false;
                
                const likedPosts = getLikedPosts();
                // Use .toString() to fix the number vs. string bug
                if (likedPosts.includes(post.id.toString())) {
                    likeButton.classList.add('liked');
                    likeButton.disabled = true; // Already liked
                }

                // 2. Set Share URLs (Now with Facebook, WhatsApp, Telegram)
                /*
                        if(shareInstagram) {
                    shareInstagram.href = `#`; // No direct share URL
                    shareInstagram.title = "Share on Instagram";
                    shareInstagram.onclick = (e) => {
                        e.preventDefault();
                        showSnackbar('Instagram does not support direct web sharing.');
                    };
                }
                        */
                // --- NEW: Define custom share text ---
                const shareTextLine1 = "Hey! Check out my blog post:";
                const shareTextLine3 = "You can read it here:";

                // For services that support line breaks (WhatsApp, Telegram)
                // %0A is a line break
                const shareTextForApps = `${encodeURIComponent(shareTextLine1)}%0A${encodedTitle}%0A%0A${encodeURIComponent(shareTextLine3)} ${encodedUrl}`;

                // For Facebook (quote param doesn't handle line breaks well)
                const shareTextForFacebook = `${shareTextLine1} ${encodedTitle}`;
                
                // --- Apply to all buttons ---
                if(shareFacebook) shareFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${shareTextForFacebook}`;
                if(shareWhatsapp) shareWhatsapp.href = `https://api.whatsapp.com/send?text=${shareTextForApps}`;
                if(shareTelegram) shareTelegram.href = `https://t.me/share/url?url=${encodedUrl}&text=${shareTextForApps}`;
                // --- END: Updated Logic ---

                window.scrollTo(0, 0);
                lucide.createIcons();
            }

            // This function ONLY renders the feed view.
            function showFeed() {
                postView.classList.add('hidden');
                postView.classList.remove('md:flex', 'md:space-x-4', 'lg:space-x-8', 'animate__fadeIn');
                feedView.classList.remove('hidden');
                feedView.classList.add('md:flex'); 
                feedView.classList.add('animate__fadeIn');
                
                filterAndRender(); 
            }
            
            // --- NEW: Router function ---
            // This is the SINGLE source of truth for navigation.
            function checkUrlHashAndRoute() {
                const hash = window.location.hash;
                if (hash && hash.startsWith('#post/')) {
                    const postId = hash.substring(6); // Grabs the ID after '#post/'
                    
                    if (blogPosts.length === 0) {
                        // If posts aren't loaded, wait a tiny bit and try again
                        setTimeout(() => checkUrlHashAndRoute(), 100); 
                    } else {
                        // Posts are loaded, so find and show the post
                        showPost(postId);
                    }
                } else {
                    // No hash or an unknown hash, just show the main feed
                    showFeed();
                }
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

            // === FIXED: All navigation clicks now ONLY change the hash ===
            
            const handleCategoryClick = (e) => {
                const link = e.target.closest('.category-link');
                if (!link) return; 
                e.preventDefault();
                activeCategory = link.dataset.category;
                activeTag = null; 
                window.location.hash = ''; // <-- Set hash to navigate
            };
            categoryList.addEventListener('click', handleCategoryClick);
            
            
            mobileCategoryToggle.addEventListener('click', () => {
                const isHidden = mobileCategoryMenu.classList.toggle('hidden');
                mobileCategoryChevron.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
            });

            mobileCategoryMenu.addEventListener('click', (e) => {
                const link = e.target.closest('.category-link-custom');
                
                // Stop this click from bubbling up to the window listener
                e.stopPropagation(); 

                if (link) {
                    e.preventDefault();
                    activeCategory = link.dataset.category;
                    activeTag = null;
                    mobileCategoryMenu.classList.add('hidden');
                    mobileCategoryChevron.style.transform = 'rotate(0deg)';
                    window.location.hash = ''; // <-- Set hash to navigate
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
    console.log("--- BLOG FEED CLICK DETECTED ---"); // <-- NEW
    const link = e.target.closest('.view-post-link');
    if (link && link.dataset.postId) {
        console.log("Post link found! Setting hash to:", '#post/' + link.dataset.postId); // <-- NEW
        e.preventDefault();
        window.location.hash = '#post/' + link.dataset.postId; // <-- Set hash
    } else {
        console.log("Click was not on a 'view-post-link'."); // <-- NEW
    }
});

            if (moreBlogsList) {
                moreBlogsList.addEventListener('click', (e) => {
                    const link = e.target.closest('.more-blog-link');
                    if (link && link.dataset.postId) {
                        e.preventDefault();
                        window.location.hash = '#post/' + link.dataset.postId; // <-- Set hash
                    }
                });
            }

            backButton.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.hash = ''; // <-- Set hash
            });

            const goHome = (e) => {
                e.preventDefault();
                activeCategory = 'all';
                activeTag = null;
                window.location.hash = ''; // <-- Set hash
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

            // --- Like Button Click Handler ---
            async function handleLikePost(postId) {
                // 1. Prevent double-clicks
                likeButton.disabled = true;

                // 2. Optimistic UI update
                const likedPosts = getLikedPosts();
                // Use .toString() to fix number vs. string bug
                const postIdString = postId.toString();
                if (likedPosts.includes(postIdString)) return;
                
                likedPosts.push(postIdString);
                saveLikedPosts(likedPosts);
                
                likeButton.classList.add('liked');
                const newCount = parseInt(likeCount.textContent) + 1;
                likeCount.textContent = newCount;

                // 3. Send request to backend
                try {
                    const response = await fetch(`/api/posts/like/${postId}`, { method: 'POST' });
                    
                    if (!response.ok) {
                        throw new Error('Like request failed');
                    }
                    
                    console.log('Post liked successfully');
                    const postInList = blogPosts.find(p => p.id.toString() === postId);
                    if (postInList) postInList.likes = newCount;
                    
                } catch (error) {
                    // Rollback on error
                    console.error(error);
                    showSnackbar('Like failed. Please try again.');
                    likeButton.disabled = false;
                    likeButton.classList.remove('liked');
                    likeCount.textContent = newCount - 1; // Revert count
                    
                    const rolledBackLikes = getLikedPosts().filter(id => id !== postIdString);
                    saveLikedPosts(rolledBackLikes);
                }
            }

            if (likeButton) {
                likeButton.addEventListener('click', () => {
                    const postId = commentPostIdInput.value;
                    if (postId && !likeButton.disabled) {
                        handleLikePost(postId);
                    }
                });
            }
            // --- END: Like Button Logic ---


            // --- INITIAL LOAD ---
            loadBlogData(); 

            // --- NEW: Handle browser back/forward buttons ---
            // This is now the main controller for navigation.
            window.addEventListener('hashchange', () => {
                checkUrlHashAndRoute();
            });

        });
