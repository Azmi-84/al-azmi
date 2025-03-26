// Blog functionality
document.addEventListener("DOMContentLoaded", function () {
  // Initialize AOS
  AOS.init({
    duration: 800,
    easing: "ease-in-out",
    once: true,
  });

  // Mobile menu functionality
  const mobileMenuButton = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu");

  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener("click", function () {
      const isExpanded =
        mobileMenuButton.getAttribute("aria-expanded") === "true";
      mobileMenuButton.setAttribute("aria-expanded", !isExpanded);
      mobileMenu.classList.toggle("hidden");
    });
  }

  // Blog functionality
  const blogPostsContainer = document.getElementById("blogPosts");
  const postForm = document.getElementById("postForm");
  const blogPostForm = document.getElementById("blogPostForm");
  const newPostBtn = document.getElementById("newPostBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const postIdInput = document.getElementById("postId");
  const postTitleInput = document.getElementById("postTitle");
  const postContentInput = document.getElementById("postContent");
  const formTitle = document.getElementById("formTitle");

  // Initialize marked.js options for markdown parsing
  marked.setOptions({
    breaks: true, // Convert line breaks to <br>
    gfm: true, // GitHub flavored markdown
    sanitize: false, // Allow HTML in markdown
    smartypants: true, // Typography improvements
  });

  // Load posts on page load
  loadPosts();

  // Event listeners
  if (newPostBtn) {
    newPostBtn.addEventListener("click", showNewPostForm);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", hidePostForm);
  }

  if (blogPostForm) {
    blogPostForm.addEventListener("submit", savePost);
  }

  // Blog Functions
  function loadPosts() {
    if (!blogPostsContainer) return;

    // Clear the container
    blogPostsContainer.innerHTML = "";

    // Get posts from localStorage
    const posts = getPosts();

    // If no posts, show message
    if (posts.length === 0) {
      blogPostsContainer.innerHTML = `
                <div class="text-center py-16 text-gray-500 italic">
                    No posts yet. Be the first to create a post!
                </div>
            `;
      return;
    }

    // Sort posts by date (newest first)
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Add each post to the container
    posts.forEach((post) => {
      const postEl = createPostElement(post);
      blogPostsContainer.appendChild(postEl);
    });
  }

  function createPostElement(post) {
    const postEl = document.createElement("div");
    postEl.classList.add("blog-post");
    postEl.dataset.id = post.id;

    // Format the date
    const postDate = new Date(post.date);
    const formattedDate = postDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Create post HTML structure
    postEl.innerHTML = `
            <div class="post-header">
                <h2 class="post-title">${escapeHtml(post.title)}</h2>
                <div class="post-actions">
                    <button class="edit-btn" title="Edit Post"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" title="Delete Post"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div class="post-content">
                <div class="post-meta">Posted on ${formattedDate}</div>
                <div class="post-body">${marked.parse(post.content)}</div>
            </div>
        `;

    // Add event listeners to the buttons
    const editBtn = postEl.querySelector(".edit-btn");
    const deleteBtn = postEl.querySelector(".delete-btn");

    editBtn.addEventListener("click", () => editPost(post.id));
    deleteBtn.addEventListener("click", () => deletePost(post.id));

    return postEl;
  }

  function showNewPostForm() {
    formTitle.textContent = "Create New Post";
    postIdInput.value = "";
    postTitleInput.value = "";
    postContentInput.value = "";
    postForm.classList.remove("hidden");
    newPostBtn.classList.add("hidden");
    postTitleInput.focus();
  }

  function hidePostForm() {
    postForm.classList.add("hidden");
    newPostBtn.classList.remove("hidden");
  }

  function savePost(e) {
    e.preventDefault();

    const title = postTitleInput.value.trim();
    const content = postContentInput.value.trim();

    if (!title || !content) {
      alert("Please fill in all fields");
      return;
    }

    const postId = postIdInput.value || generateId();
    const isNewPost = !postIdInput.value;

    // Create post object
    const post = {
      id: postId,
      title: title,
      content: content,
      date: isNewPost ? new Date().toISOString() : getPostById(postId).date,
    };

    // Save the post
    savePostToStorage(post);

    // Reset and hide form
    hidePostForm();

    // Reload posts
    loadPosts();
  }

  function editPost(id) {
    const post = getPostById(id);

    if (!post) return;

    formTitle.textContent = "Edit Post";
    postIdInput.value = post.id;
    postTitleInput.value = post.title;
    postContentInput.value = post.content;

    postForm.classList.remove("hidden");
    newPostBtn.classList.add("hidden");
    postTitleInput.focus();
  }

  function deletePost(id) {
    if (confirm("Are you sure you want to delete this post?")) {
      // Get all posts
      let posts = getPosts();

      // Filter out the post to delete
      posts = posts.filter((post) => post.id !== id);

      // Save back to localStorage
      localStorage.setItem("blogPosts", JSON.stringify(posts));

      // Reload posts
      loadPosts();
    }
  }

  // Helper functions
  function getPosts() {
    const posts = localStorage.getItem("blogPosts");
    return posts ? JSON.parse(posts) : [];
  }

  function getPostById(id) {
    const posts = getPosts();
    return posts.find((post) => post.id === id);
  }

  function savePostToStorage(post) {
    const posts = getPosts();

    // Check if post exists
    const existingPostIndex = posts.findIndex((p) => p.id === post.id);

    if (existingPostIndex !== -1) {
      // Update existing post
      posts[existingPostIndex] = post;
    } else {
      // Add new post
      posts.push(post);
    }

    // Save back to localStorage
    localStorage.setItem("blogPosts", JSON.stringify(posts));
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
