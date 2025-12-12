/*
 * ==========================================================================
 * !! IMPORTANT: SUPABASE SETUP INSTRUCTIONS !!
 * ==========================================================================
 * (Keep your existing Supabase SQL setup instructions here if you want, 
 * but for brevity I am focusing on the code execution logic below)
 * ==========================================================================
 */

const express = require('express');
const path = require('path');
const cors = require('cors'); 
const session = require('express-session');
const { createClient } = require('@supabase/supabase-js');
const rateLimit = require('express-rate-limit'); 

// --- Load Environment Variables (for local development) ---
// UPDATED PATH: Looks for .env in the 'admin' folder one level up
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: path.join(__dirname, '../admin/.env') });
}

const app = express();
const PORT = process.env.PORT || 3000;

// --- SUPABASE & ADMIN CREDENTIALS ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;
const SESSION_SECRET = process.env.SESSION_SECRET;

// Check for required environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY || !ADMIN_USER || !ADMIN_PASS || !SESSION_SECRET) {
    console.error('FATAL ERROR: Missing required environment variables.');
    // In Vercel, this log will show up in the function logs if it fails
    if (require.main === module) process.exit(1); 
}

// Initialize Supabase Client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// --- Middleware ---
app.use(cors()); 
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true }));

// --- Session Middleware ---
// Note: In Vercel serverless, memory sessions will reset when the function goes to sleep.
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { 
        maxAge: 1000 * 60 * 60 * 24 // 1 day
        // secure: process.env.NODE_ENV === 'production' 
    }
}));

// --- RATE LIMITERS ---
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 10, 
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
    standardHeaders: true, 
    legacyHeaders: false, 
});

const likeLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, 
    max: 5, 
    message: 'Too many like requests from this IP, please try again after an hour',
    standardHeaders: true,
    legacyHeaders: false,
});

// --- Helper Function ---
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
//               *** ROUTES ***
// ===================================================================

// --- AUTH ROUTES ---
app.post('/admin/login', loginLimiter, (req, res) => {
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

// --- HTML PAGE ROUTES (UPDATED FOR VERCEL) ---
// Uses process.cwd() to reliably find files from the project root

app.get('/admin/admin.html', checkAuth, (req, res) => {
    res.sendFile(path.join(process.cwd(), 'admin', 'admin.html'));
});

app.get('/admin/login.html', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'admin', 'login.html'));
});

// --- PUBLIC API ENDPOINT ---
app.get('/api/public-data', async (req, res) => {
    // Select * will now include the 'likes' column
    const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*') 
        .eq('published', true)
        .order('id', { ascending: false });

    if (postsError) return res.status(500).json({ message: 'Error reading posts.' });

    const { data: categoriesList, error: catsError } = await supabase
        .from('categories')
        .select('name, tags');

    if (catsError) return res.status(500).json({ message: 'Error reading categories.' });

    res.status(200).json({
        categories: formatCategories(categoriesList),
        posts: posts || []
    });
});

// --- PROTECTED ADMIN API ENDPOINTS ---

app.get('/api/data', checkApiAuth, async (req, res) => {
    const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('id', { ascending: false });

    if (postsError) return res.status(500).json({ message: 'Error reading posts.' });

    const { data: categoriesList, error: catsError } = await supabase
        .from('categories')
        .select('name, tags');

    if (catsError) return res.status(500).json({ message: 'Error reading categories.' });

    res.status(200).json({
        categories: formatCategories(categoriesList),
        posts: posts || []
    });
});

// --- POST CRUD ---
app.post('/api/posts', checkApiAuth, async (req, res) => {
    const newPost = req.body;
    if (!newPost || !newPost.title || !newPost.category) {
        return res.status(400).json({ message: 'Bad Request: Missing required fields.' });
    }
    
    const { error } = await supabase.from('posts').insert(newPost);
    if (error) return res.status(500).json({ message: 'Error saving post.' });
    
    res.status(200).json({ message: 'Post saved successfully!' });
});

app.put('/api/posts/:id', checkApiAuth, async (req, res) => {
    const postId = parseInt(req.params.id);
    const updatedPost = req.body;
    
    delete updatedPost.id;
    delete updatedPost.created_at; 

    const { error } = await supabase
        .from('posts')
        .update(updatedPost)
        .eq('id', postId);

    if (error) return res.status(500).json({ message: 'Error updating post.' });
    res.status(200).json({ message: 'Post updated successfully!' });
});

app.delete('/api/posts/:id', checkApiAuth, async (req, res) => {
    const postId = parseInt(req.params.id);
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) return res.status(500).json({ message: 'Error deleting post.' });
    res.status(200).json({ message: 'Post deleted successfully!' });
});

app.put('/api/posts/toggle-publish/:id', checkApiAuth, async (req, res) => {
    const postId = parseInt(req.params.id);
    const { data: post, error: fetchError } = await supabase
        .from('posts').select('published').eq('id', postId).single(); 

    if (fetchError || !post) return res.status(404).json({ message: 'Post not found.' });

    const { error: updateError } = await supabase
        .from('posts').update({ published: !post.published }).eq('id', postId);

    if (updateError) return res.status(500).json({ message: 'Error updating status.' });
    res.status(200).json({ message: 'Publish status updated successfully!' });
});

// --- CATEGORY MANAGEMENT ---
app.post('/api/categories', checkApiAuth, async (req, res) => {
    const newCategoryName = req.body.name;
    if (!newCategoryName) return res.status(400).json({ message: 'Category name is required.' });

    const { error } = await supabase
        .from('categories').insert({ name: newCategoryName, tags: [] });

    if (error) {
        if (error.code === '23505') return res.status(400).json({ message: 'Category already exists.' });
        return res.status(500).json({ message: 'Error adding category.' });
    }
    res.status(200).json({ message: 'Category added successfully!' });
});

app.delete('/api/categories/:name', checkApiAuth, async (req, res) => {
    const categoryToDelete = decodeURIComponent(req.params.name);
    
    const { error: catError } = await supabase.from('categories').delete().eq('name', categoryToDelete);
    if (catError) return res.status(500).json({ message: 'Error deleting category.' });

    await supabase.from('posts').update({ category: "" }).eq('category', categoryToDelete);
    res.status(200).json({ message: 'Category deleted successfully!' });
});

app.put('/api/categories/:name', checkApiAuth, async (req, res) => {
    const oldName = decodeURIComponent(req.params.name);
    const { newName } = req.body;
    if (!newName || newName.trim() === '') return res.status(400).json({ message: 'New name required.' });
    
    const { error: catError } = await supabase.from('categories').update({ name: newName }).eq('name', oldName);
    if (catError) {
        if (catError.code === '23505') return res.status(400).json({ message: 'Category name exists.' });
        return res.status(500).json({ message: 'Error renaming category.' });
    }

    await supabase.from('posts').update({ category: newName }).eq('category', oldName);
    res.status(200).json({ message: 'Category renamed successfully!' });
});

// --- TAG MANAGEMENT ---
app.post('/api/tags', checkApiAuth, async (req, res) => {
    const { categoryName, tagName } = req.body;
    if (!categoryName || !tagName) return res.status(400).json({ message: 'Missing fields.' });

    const { data: category } = await supabase.from('categories').select('tags').eq('name', categoryName).single();
    if (!category) return res.status(404).json({ message: 'Category not found.' });
    
    if (category.tags && category.tags.includes(tagName)) {
        return res.status(400).json({ message: 'Tag already exists in this category.' });
    }

    const newTags = [...(category.tags || []), tagName];
    const { error: updateError } = await supabase.from('categories').update({ tags: newTags }).eq('name', categoryName);

    if (updateError) return res.status(500).json({ message: 'Error adding tag.' });
    res.status(200).json({ message: 'Tag added successfully!' });
});

app.delete('/api/tags/:categoryName/:tagName', checkApiAuth, async (req, res) => {
    const categoryName = decodeURIComponent(req.params.categoryName);
    const tagName = decodeURIComponent(req.params.tagName);

    const { data: category } = await supabase.from('categories').select('tags').eq('name', categoryName).single();
    if (!category) return res.status(404).json({ message: 'Category not found.' });

    const newTags = (category.tags || []).filter(t => t !== tagName);
    const { error: updateError } = await supabase.from('categories').update({ tags: newTags }).eq('name', categoryName);

    if (updateError) return res.status(500).json({ message: 'Error deleting tag.' });

    // Remove tag from relevant posts
    const { data: posts } = await supabase.from('posts').select('id, tags').eq('category', categoryName).contains('tags', [tagName]);
    if (posts) {
        const updates = posts.map(post => {
            return supabase.from('posts').update({ tags: post.tags.filter(t => t !== tagName) }).eq('id', post.id);
        });
        await Promise.all(updates); 
    }
    res.status(200).json({ message: 'Tag deleted successfully!' });
});

app.put('/api/tags/:categoryName/:tagName', checkApiAuth, async (req, res) => {
    const categoryName = decodeURIComponent(req.params.categoryName);
    const oldTagName = decodeURIComponent(req.params.tagName);
    const { newTagName } = req.body;

    if (!newTagName || newTagName.trim() === '') return res.status(400).json({ message: 'New tag required.' });

    const { data: category } = await supabase.from('categories').select('tags').eq('name', categoryName).single();
    if (!category) return res.status(404).json({ message: 'Category not found.' });
    
    if (category.tags.includes(newTagName)) return res.status(400).json({ message: 'Tag already exists.' });

    const newTags = category.tags.map(t => (t === oldTagName ? newTagName : t));
    const { error: updateError } = await supabase.from('categories').update({ tags: newTags }).eq('name', categoryName);

    if (updateError) return res.status(500).json({ message: 'Error renaming tag.' });
    
    const { data: posts } = await supabase.from('posts').select('id, tags').eq('category', categoryName).contains('tags', [oldTagName]);
    if (posts) {
        const updates = posts.map(post => {
            return supabase.from('posts').update({ tags: post.tags.map(t => (t === oldTagName ? newTagName : t)) }).eq('id', post.id);
        });
        await Promise.all(updates);
    }
    res.status(200).json({ message: 'Tag renamed successfully!' });
});

// --- COMMENTS (ADMIN) ---
app.get('/api/admin/comments', checkApiAuth, async (req, res) => {
    const { data: comments, error } = await supabase
        .from('comments')
        .select(`id, created_at, name, content, is_approved, post_id, post:posts ( title )`)
        .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ message: 'Error fetching comments.' });
    res.status(200).json(comments || []);
});

app.put('/api/comments/approve/:id', checkApiAuth, async (req, res) => {
    const { error } = await supabase.from('comments').update({ is_approved: true }).eq('id', parseInt(req.params.id));
    if (error) return res.status(500).json({ message: 'Error approving comment.' });
    res.status(200).json({ message: 'Comment approved!' });
});

app.delete('/api/comments/:id', checkApiAuth, async (req, res) => {
    const { error } = await supabase.from('comments').delete().eq('id', parseInt(req.params.id));
    if (error) return res.status(500).json({ message: 'Error deleting comment.' });
    res.status(200).json({ message: 'Comment deleted!' });
});

// --- COMMENTS (PUBLIC) ---
app.get('/api/comments/:postId', async (req, res) => {
    const { data: comments, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', req.params.postId)
        .eq('is_approved', true) 
        .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ message: 'Error fetching comments.' });
    res.status(200).json(comments || []);
});

app.post('/api/comments', async (req, res) => {
    const { post_id, name, content } = req.body;
    if (!post_id || !name || !content) return res.status(400).json({ message: 'Missing fields.' });
    
    const { error } = await supabase.from('comments').insert([{ post_id: parseInt(post_id, 10), name: name.trim(), content: content.trim() }]);
    if (error) return res.status(500).json({ message: 'Error posting comment.' });

    res.status(201).json({ message: 'Comment submitted for moderation!' });
});

// --- LIKES (PUBLIC) ---
app.post('/api/posts/like/:id', likeLimiter, async (req, res) => {
    const postId = parseInt(req.params.id);
    if (isNaN(postId)) return res.status(400).json({ message: 'Invalid post ID.' });

    const { error } = await supabase.rpc('increment_likes', { post_id_to_inc: postId });
    if (error) return res.status(500).json({ message: 'Error updating like count.' });

    res.status(200).json({ message: 'Like registered!' });
});

// --- STATIC FILES (FALLBACK) ---
// This handles static files if they aren't caught by Vercel's static serving or for local dev.
app.use(express.static(path.join(process.cwd()), {
    index: false,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('admin.html') || filePath.endsWith('db.json')) {
            res.status(403).send('Forbidden');
        }
    }
}));

// Root Route
app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'index.html'));
});

// --- EXPORT FOR VERCEL ---
module.exports = app;

// --- LISTEN (ONLY LOCAL) ---
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`--- Blog Server & Admin Panel (Supabase Mode) ---`);
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
