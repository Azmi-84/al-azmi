// Blog functionality with Firebase integration
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

  // Firebase Configuration
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-messaging-sender-id",
    appId: "your-app-id",
  };

  let db = null; // Firestore database reference
  let currentUser = null; // For future authentication implementation
  let posts = []; // To store all posts
  let currentCategory = "all";
  let currentPage = 1;
  const postsPerPage = 6; // Increased for better UX
  let isUsingLocalStorage = false;
  let selectedCategories = []; // To store selected categories for new/edit post

  // Elements
  const blogPostsContainer = document.getElementById("blogPosts");
  const postForm = document.getElementById("postForm");
  const blogPostForm = document.getElementById("blogPostForm");
  const newPostBtn = document.getElementById("newPostBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const postIdInput = document.getElementById("postId");
  const postTitleInput = document.getElementById("postTitle");
  const postContentInput = document.getElementById("postContent");
  const formTitle = document.getElementById("formTitle");
  const loadingState = document.getElementById("loadingState");
  const emptyState = document.getElementById("emptyState");
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toastMessage");
  const confirmDialog = document.getElementById("confirmDialog");
  const cancelDialog = document.getElementById("cancelDialog");
  const confirmDialogBtn = document.getElementById("confirmDialog");
  const dialogMessage = document.getElementById("dialogMessage");
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");
  const writeTab = document.getElementById("writeTab");
  const previewTab = document.getElementById("previewTab");
  const writeContent = document.getElementById("writeContent");
  const previewContent = document.getElementById("previewContent");
  const categoryFiltersContainer = document.getElementById("categoryFilters");
  const pagination = document.getElementById("pagination");
  const prevPage = document.getElementById("prevPage");
  const nextPage = document.getElementById("nextPage");
  const pageNumbers = document.getElementById("pageNumbers");
  const networkError = document.getElementById("networkError");
  const postDetailModal = document.getElementById("postDetailModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalContent = document.getElementById("modalContent");
  const closeDetailModal = document.getElementById("closeDetailModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const categoryInput = document.getElementById("categoryInput");
  const addCategoryBtn = document.getElementById("addCategoryBtn");
  const selectedCategoriesContainer =
    document.getElementById("selectedCategories");
  const categorySuggestions = document.querySelectorAll(".category-suggestion");

  // Initialize marked.js options for markdown parsing
  marked.setOptions({
    breaks: true, // Convert line breaks to <br>
    gfm: true, // GitHub flavored markdown
    sanitize: false, // Allow HTML in markdown
    smartypants: true, // Typography improvements
    highlight: function (code, lang) {
      // Optional: Add syntax highlighting
      return code;
    },
  });

  // Initialize Firebase or fall back to localStorage
  try {
    if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
      firebase.initializeApp(firebaseConfig);
      db = firebase.firestore();
      console.log("Firebase initialized successfully");
    } else {
      console.warn(
        "Using placeholder Firebase configuration. Using local storage instead."
      );
      throw new Error("Invalid Firebase config");
    }
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    db = null;
    isUsingLocalStorage = true;

    // Show network error message if it exists in DOM
    if (networkError) {
      networkError.classList.remove("hidden");
    }
  }

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

  // Category input event listeners
  if (addCategoryBtn && categoryInput && selectedCategoriesContainer) {
    addCategoryBtn.addEventListener("click", addCategory);

    // Allow pressing Enter to add a category
    categoryInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addCategory();
      }
    });
  }

  // Category suggestions
  if (categorySuggestions) {
    categorySuggestions.forEach((btn) => {
      btn.addEventListener("click", () => {
        const category = btn.getAttribute("data-category");
        addCategoryToSelection(category);
        categoryInput.value = "";
        categoryInput.focus();
      });
    });
  }

  // Editor tabs
  if (writeTab && previewTab) {
    writeTab.addEventListener("click", () => {
      writeTab.classList.add(
        "text-secondary",
        "border-secondary",
        "font-medium"
      );
      writeTab.classList.remove("text-gray-700");
      previewTab.classList.remove(
        "text-secondary",
        "border-secondary",
        "font-medium"
      );
      previewTab.classList.add("text-gray-700");
      writeContent.classList.remove("hidden");
      previewContent.classList.add("hidden");

      // Update ARIA states
      writeTab.setAttribute("aria-selected", "true");
      previewTab.setAttribute("aria-selected", "false");
      writeContent.setAttribute("aria-hidden", "false");
      previewContent.setAttribute("aria-hidden", "true");
    });

    previewTab.addEventListener("click", () => {
      previewTab.classList.add(
        "text-secondary",
        "border-secondary",
        "font-medium"
      );
      previewTab.classList.remove("text-gray-700");
      writeTab.classList.remove(
        "text-secondary",
        "border-secondary",
        "font-medium"
      );
      writeTab.classList.add("text-gray-700");
      previewContent.classList.remove("hidden");
      writeContent.classList.add("hidden");

      // Update ARIA states
      writeTab.setAttribute("aria-selected", "false");
      previewTab.setAttribute("aria-selected", "true");
      writeContent.setAttribute("aria-hidden", "true");
      previewContent.setAttribute("aria-hidden", "false");

      // Update preview content
      previewContent.innerHTML = marked.parse(
        postContentInput.value || "Nothing to preview"
      );
    });
  }

  // Live preview for markdown editor
  if (postContentInput && previewContent) {
    postContentInput.addEventListener("input", () => {
      if (!previewContent.classList.contains("hidden")) {
        previewContent.innerHTML = marked.parse(
          postContentInput.value || "Nothing to preview"
        );
      }
    });
  }

  // Modal close buttons
  if (closeDetailModal) {
    closeDetailModal.addEventListener("click", () => {
      postDetailModal.classList.add("hidden");
      document.body.classList.remove("overflow-hidden");
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
      postDetailModal.classList.add("hidden");
      document.body.classList.remove("overflow-hidden");
    });
  }

  // Category filters - now handled dynamically
  function initCategoryFilters() {
    const filterButtons =
      categoryFiltersContainer.querySelectorAll(".category-filter");

    filterButtons.forEach((filter) => {
      filter.addEventListener("click", () => {
        // Update active state
        filterButtons.forEach((btn) => {
          btn.classList.remove("active", "bg-primary", "text-white");
          btn.classList.add("bg-gray-200", "text-gray-700");
          btn.setAttribute("aria-pressed", "false");
        });
        filter.classList.remove("bg-gray-200", "text-gray-700");
        filter.classList.add("active", "bg-primary", "text-white");
        filter.setAttribute("aria-pressed", "true");

        // Filter posts
        currentCategory = filter.getAttribute("data-category");
        currentPage = 1;
        filterAndDisplayPosts();
      });
    });
  }

  // Search functionality
  if (searchButton && searchInput) {
    searchButton.addEventListener("click", () => {
      filterAndDisplayPosts();
    });

    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        filterAndDisplayPosts();
      }
    });
  }

  // Pagination
  if (prevPage) {
    prevPage.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        filterAndDisplayPosts();
        // Scroll to top of posts
        blogPostsContainer.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  if (nextPage) {
    nextPage.addEventListener("click", () => {
      const totalPages = Math.ceil(getFilteredPosts().length / postsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        filterAndDisplayPosts();
        // Scroll to top of posts
        blogPostsContainer.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  // Dialog event listeners
  if (confirmDialog && cancelDialog) {
    cancelDialog.addEventListener("click", hideConfirmDialog);
  }

  // Load posts on page load
  loadPosts();

  // Functions
  async function loadPosts() {
    if (!blogPostsContainer) return;

    showLoading(true);

    try {
      if (db && !isUsingLocalStorage) {
        // Load from Firebase
        const snapshot = await db
          .collection("posts")
          .orderBy("date", "desc")
          .get();
        posts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      } else {
        // Load from localStorage
        posts = getPosts();
        if (!isUsingLocalStorage) {
          isUsingLocalStorage = true;
          if (networkError) networkError.classList.remove("hidden");
        }
      }

      filterAndDisplayPosts();
    } catch (error) {
      console.error("Error loading posts:", error);
      showToast("Failed to load posts. Using local storage instead.", "error");

      // Fallback to localStorage if Firebase fails
      isUsingLocalStorage = true;
      if (networkError) networkError.classList.remove("hidden");
      posts = getPosts();
      filterAndDisplayPosts();
    } finally {
      showLoading(false);
    }

    // After posts are loaded, generate dynamic category filters
    updateCategoryFilters();
  }

  // Get unique categories from all posts
  function getUniqueCategories() {
    const categories = new Set();

    // Always include "all" category
    categories.add("all");

    // Extract categories from posts
    posts.forEach((post) => {
      if (post.categories && Array.isArray(post.categories)) {
        post.categories.forEach((category) => {
          categories.add(category);
        });
      }
    });

    return Array.from(categories);
  }

  // Update category filters based on available categories in posts
  function updateCategoryFilters() {
    if (!categoryFiltersContainer) return;

    const categories = getUniqueCategories();

    // Keep the "All Posts" button and remove other filters
    const allButton = categoryFiltersContainer.querySelector(
      '[data-category="all"]'
    );
    categoryFiltersContainer.innerHTML = "";
    if (allButton) {
      categoryFiltersContainer.appendChild(allButton);
    }

    // Add category filters except "all" which is already added
    categories.forEach((category) => {
      if (category === "all") return;

      const button = document.createElement("button");
      button.className =
        "category-filter px-4 py-2 rounded-md bg-gray-200 text-gray-700 transition-all hover:bg-secondary hover:text-white focus:outline-none focus:ring-2 focus:ring-secondary";
      button.setAttribute("data-category", category);
      button.setAttribute("aria-pressed", "false");
      button.textContent = category;

      categoryFiltersContainer.appendChild(button);
    });

    // Reinitialize event listeners
    initCategoryFilters();
  }

  function filterAndDisplayPosts() {
    const filteredPosts = getFilteredPosts();

    // Update pagination
    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
    updatePagination(totalPages);

    // Get current page posts
    const start = (currentPage - 1) * postsPerPage;
    const end = start + postsPerPage;
    const paginatedPosts = filteredPosts.slice(start, end);

    displayPosts(paginatedPosts);
  }

  function getFilteredPosts() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";

    return posts.filter((post) => {
      // Filter by category
      if (
        currentCategory !== "all" &&
        (!post.categories || !post.categories.includes(currentCategory))
      ) {
        return false;
      }

      // Filter by search term
      if (
        searchTerm &&
        !post.title.toLowerCase().includes(searchTerm) &&
        !post.content.toLowerCase().includes(searchTerm)
      ) {
        return false;
      }

      return true;
    });
  }

  function updatePagination(totalPages) {
    if (!pagination || !pageNumbers || !prevPage || !nextPage) return;

    if (totalPages <= 1) {
      pagination.classList.add("hidden");
      return;
    }

    pagination.classList.remove("hidden");
    pageNumbers.innerHTML = "";

    // Previous button
    prevPage.disabled = currentPage === 1;
    prevPage.classList.toggle("opacity-50", currentPage === 1);
    prevPage.setAttribute("aria-disabled", currentPage === 1);

    // Page numbers - with better mobile support
    const createPageButton = (pageNum, isActive = false) => {
      const pageBtn = document.createElement("button");
      pageBtn.className = isActive
        ? "px-3 py-1 rounded-md bg-primary text-white"
        : "px-3 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100";
      pageBtn.textContent = pageNum;
      pageBtn.setAttribute("aria-label", `Page ${pageNum}`);
      if (isActive) {
        pageBtn.setAttribute("aria-current", "page");
      }
      pageBtn.addEventListener("click", () => {
        currentPage = pageNum;
        filterAndDisplayPosts();
      });
      return pageBtn;
    };

    // Simplified pagination for mobile/many pages
    if (totalPages > 5) {
      // Always show first page
      pageNumbers.appendChild(createPageButton(1, currentPage === 1));

      // Show ellipsis if needed
      if (currentPage > 3) {
        const ellipsis = document.createElement("span");
        ellipsis.className = "px-2 py-1";
        ellipsis.textContent = "...";
        ellipsis.setAttribute("aria-hidden", "true");
        pageNumbers.appendChild(ellipsis);
      }

      // Show pages around current page
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        if (i === 1 || i === totalPages) continue; // Skip first and last as they're always shown
        pageNumbers.appendChild(createPageButton(i, currentPage === i));
      }

      // Show ellipsis if needed
      if (currentPage < totalPages - 2) {
        const ellipsis = document.createElement("span");
        ellipsis.className = "px-2 py-1";
        ellipsis.textContent = "...";
        ellipsis.setAttribute("aria-hidden", "true");
        pageNumbers.appendChild(ellipsis);
      }

      // Always show last page
      pageNumbers.appendChild(
        createPageButton(totalPages, currentPage === totalPages)
      );
    } else {
      // Show all pages if there are only a few
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.appendChild(createPageButton(i, currentPage === i));
      }
    }

    // Next button
    nextPage.disabled = currentPage === totalPages;
    nextPage.classList.toggle("opacity-50", currentPage === totalPages);
    nextPage.setAttribute("aria-disabled", currentPage === totalPages);
  }

  function displayPosts(postsToDisplay) {
    if (!blogPostsContainer) return;

    // Clear the container
    blogPostsContainer.innerHTML = "";

    // If no posts, show message
    if (postsToDisplay.length === 0) {
      let message = "No posts yet. Be the first to create a post!";

      if (searchInput && searchInput.value) {
        message = "No posts match your search.";
      } else if (currentCategory !== "all") {
        message = `No posts in the ${currentCategory} category.`;
      }

      const emptyStateDiv = document.createElement("div");
      emptyStateDiv.className = "text-center py-16 text-gray-500 italic";
      emptyStateDiv.innerHTML = message;
      blogPostsContainer.appendChild(emptyStateDiv);
      return;
    }

    // Create responsive grid for posts
    const postsGrid = document.createElement("div");
    postsGrid.className =
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
    blogPostsContainer.appendChild(postsGrid);

    // Add each post to the container
    postsToDisplay.forEach((post) => {
      const postEl = createPostElement(post);
      postsGrid.appendChild(postEl);
    });
  }

  function createPostElement(post) {
    const postEl = document.createElement("div");
    postEl.classList.add(
      "bg-white",
      "rounded-lg",
      "shadow-md",
      "overflow-hidden",
      "transition-all",
      "duration-300",
      "hover:shadow-lg",
      "transform",
      "hover:-translate-y-1",
      "flex",
      "flex-col"
    );
    postEl.dataset.id = post.id;

    // Format the date
    const postDate = new Date(post.date);
    const formattedDate = postDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Create category badges
    let categoryBadges = "";
    if (post.categories && post.categories.length > 0) {
      categoryBadges = post.categories
        .map(
          (category) =>
            `<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2 mb-2">${category}</span>`
        )
        .join("");
    }

    // Get an excerpt from content (first 150 chars)
    const excerpt =
      post.content.length > 150
        ? post.content.substring(0, 150) + "..."
        : post.content;

    // Create post HTML structure with modern icons and improved styling
    postEl.innerHTML = `
      <div class="p-6 pb-4 flex justify-between items-start border-b border-gray-100">
        <h2 class="text-xl font-bold text-primary line-clamp-2">${escapeHtml(
          post.title
        )}</h2>
        <div class="flex space-x-1 ml-2">
          <button class="edit-btn bg-transparent border-none p-2 rounded-full hover:bg-blue-50 transition-colors 
            cursor-pointer text-gray-500 hover:text-primary focus:outline-none focus:ring-2 focus:ring-secondary" title="Edit Post">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            <span class="sr-only">Edit post</span>
          </button>
          <button class="delete-btn bg-transparent border-none p-2 rounded-full hover:bg-red-50 transition-colors 
            cursor-pointer text-gray-500 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-secondary" title="Delete Post">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M9 2a1 1 00-.894.553L7.382 4H4a1 1 00-1 1v10a2 2 002 2h8a2 2 002-2V6a1 1 100-2h-3.382l-.724-1.447A1 1 0011 2H9zM7 8a1 1 012 0v6a1 1 11-2 0V8zm5-1a1 1 00-1 1v6a1 1 102 0V8a1 1 00-1-1z" clip-rule="evenodd" />
            </svg>
            <span class="sr-only">Delete post</span>
          </button>
        </div>
      </div>
      <div class="p-6 pt-4 flex-grow">
        <div class="flex items-center mb-3 text-sm text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-secondary" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M6 2a1 1 00-1 1v1H4a2 2 00-2 2v10a2 2 002 2h12a2 2 002-2V6a2 2 00-2-2h-1V3a1 1 10-2 0v1H7V3a1 1 00-1-1zm0 5a1 1 000 2h8a1 1 100-2H6z" clip-rule="evenodd" />
          </svg>
          ${formattedDate}
        </div>
        <div class="flex flex-wrap mb-3">
          ${categoryBadges}
        </div>
        <div class="prose prose-sm max-w-none line-clamp-3 mb-4 text-gray-600">
          ${marked.parse(excerpt)}
        </div>
      </div>
      <div class="px-6 py-4 border-t border-gray-100 mt-auto bg-gray-50 flex justify-between items-center">
        <span class="text-xs text-gray-500">By ${
          post.author || "Anonymous"
        }</span>
        <button class="read-more-btn text-secondary hover:text-blue-700 transition-all inline-flex items-center gap-1 font-medium text-sm">
          <span>Read more</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M10.293 5.293a1 1 011.414 0l4 4a1 1 010 1.414l-4 4a1 1 01-1.414-1.414L12.586 11H5a1 1 110-2h7.586l-2.293-2.293a1 1 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    `;

    // Add event listeners to the buttons
    const editBtn = postEl.querySelector(".edit-btn");
    const deleteBtn = postEl.querySelector(".delete-btn");
    const readMoreBtn = postEl.querySelector(".read-more-btn");

    editBtn.addEventListener("click", () => editPost(post.id));
    deleteBtn.addEventListener("click", () => showDeleteConfirmation(post.id));

    if (readMoreBtn) {
      readMoreBtn.addEventListener("click", () => showPostDetail(post));
    }

    return postEl;
  }

  function showPostDetail(post) {
    if (!postDetailModal || !modalTitle || !modalContent) return;

    // Set modal content
    modalTitle.textContent = post.title;

    // Format date for detail view
    const postDate = new Date(post.date);
    const formattedDate = postDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Create category badges
    let categoryBadges = "";
    if (post.categories && post.categories.length > 0) {
      categoryBadges = post.categories
        .map(
          (category) =>
            `<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2 mb-2">${category}</span>`
        )
        .join("");
    }

    modalContent.innerHTML = `
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 text-sm text-gray-600">
        <div class="flex items-center mb-2 sm:mb-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-secondary" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M6 2a1 1 00-1 1v1H4a2 2 00-2 2v10a2 2 002 2h12a2 2 002-2V6a2 2 00-2-2h-1V3a1 1 10-2 0v1H7V3a1 1 00-1-1zm0 5a1 1 000 2h8a1 1 100-2H6z" clip-rule="evenodd" />
          </svg>
          ${formattedDate}
        </div>
        <div>
          <span class="font-medium">Author:</span> ${post.author || "Anonymous"}
        </div>
      </div>
      <div class="flex flex-wrap mb-6">
        ${categoryBadges}
      </div>
      <div class="prose prose-sm sm:prose max-w-none">
        ${marked.parse(post.content)}
      </div>
    `;

    // Show modal and prevent body scrolling
    postDetailModal.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
  }

  function addCategory() {
    const category = categoryInput.value.trim();
    if (category) {
      addCategoryToSelection(category);
      categoryInput.value = "";
      categoryInput.focus();
    }
  }

  function addCategoryToSelection(category) {
    // Check if already in the list
    if (selectedCategories.includes(category)) {
      showToast(`"${category}" is already added`, "info");
      return;
    }

    // Add to the list
    selectedCategories.push(category);

    // Create tag element
    const tagEl = document.createElement("div");
    tagEl.className =
      "inline-flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm";
    tagEl.innerHTML = `
      <span class="mr-1">${category}</span>
      <button type="button" class="remove-category text-blue-700 hover:text-blue-900 focus:outline-none" aria-label="Remove ${category}">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 011.414 0L10 8.586l4.293-4.293a1 1 111.414 1.414L11.414 10l4.293 4.293a1 1 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 01-1.414-1.414L8.586 10 4.293 5.707a1 1 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    `;

    // Add event listener to remove button
    const removeBtn = tagEl.querySelector(".remove-category");
    removeBtn.addEventListener("click", () => {
      selectedCategories = selectedCategories.filter((cat) => cat !== category);
      tagEl.remove();
    });

    // Add to the container
    selectedCategoriesContainer.appendChild(tagEl);
  }

  function showNewPostForm() {
    formTitle.textContent = "Create New Post";
    postIdInput.value = "";
    postTitleInput.value = "";
    postContentInput.value = "";

    // Clear selected categories
    selectedCategories = [];
    if (selectedCategoriesContainer) {
      selectedCategoriesContainer.innerHTML = "";
    }

    // Reset tabs
    if (writeTab && previewTab) {
      writeTab.click();
    }

    postForm.classList.remove("hidden");
    newPostBtn.classList.add("hidden");
    postTitleInput.focus();
  }

  function hidePostForm() {
    postForm.classList.add("hidden");
    newPostBtn.classList.remove("hidden");
  }

  async function savePost(e) {
    e.preventDefault();

    const title = postTitleInput.value.trim();
    const content = postContentInput.value.trim();

    if (!title || !content) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    const postId = postIdInput.value || generateId();
    const isNewPost = !postIdInput.value;

    // Create post object with the selected categories
    const post = {
      id: postId,
      title: title,
      content: content,
      categories: selectedCategories,
      date: isNewPost
        ? new Date().toISOString()
        : getPostById(postId)?.date || new Date().toISOString(),
      author: currentUser?.displayName || "Anonymous",
    };

    showLoading(true);

    try {
      if (db && !isUsingLocalStorage) {
        // Save to Firebase
        if (isNewPost) {
          await db.collection("posts").doc(postId).set(post);
        } else {
          await db.collection("posts").doc(postId).update(post);
        }

        // Update local posts array
        const postIndex = posts.findIndex((p) => p.id === postId);
        if (postIndex !== -1) {
          posts[postIndex] = post;
        } else {
          posts.push(post);
        }
      } else {
        // Save to localStorage
        savePostToStorage(post);

        // Update local posts array
        const postIndex = posts.findIndex((p) => p.id === postId);
        if (postIndex !== -1) {
          posts[postIndex] = post;
        } else {
          posts.push(post);
        }
      }

      // Reset and hide form
      hidePostForm();

      // Show success message
      showToast(
        isNewPost ? "Post created successfully!" : "Post updated successfully!"
      );

      // Update category filters and display posts
      updateCategoryFilters();
      filterAndDisplayPosts();
    } catch (error) {
      console.error("Error saving post:", error);
      showToast("Failed to save post. Please try again.", "error");
    } finally {
      showLoading(false);
    }
  }

  function editPost(id) {
    const post = getPostById(id);

    if (!post) return;

    formTitle.textContent = "Edit Post";
    postIdInput.value = post.id;
    postTitleInput.value = post.title;
    postContentInput.value = post.content;

    // Set categories
    selectedCategories = [...(post.categories || [])];
    if (selectedCategoriesContainer) {
      selectedCategoriesContainer.innerHTML = "";
      selectedCategories.forEach((category) => {
        addCategoryToSelection(category);
      });
    }

    // Reset to write tab
    if (writeTab) {
      writeTab.click();
    }

    postForm.classList.remove("hidden");
    newPostBtn.classList.add("hidden");
    postTitleInput.focus();
  }

  function showDeleteConfirmation(id) {
    const post = getPostById(id);
    if (!post) return;

    if (!confirmDialog) {
      // Fallback if dialog doesn't exist
      if (
        confirm(
          `Are you sure you want to delete "${post.title}"? This action cannot be undone.`
        )
      ) {
        deletePost(id);
      }
      return;
    }

    // Set up the dialog
    const dialogTitle = confirmDialog.querySelector("#dialogTitle");
    if (dialogTitle) {
      dialogTitle.textContent = "Delete Post";
    }

    if (dialogMessage) {
      dialogMessage.textContent = `Are you sure you want to delete "${post.title}"? This action cannot be undone.`;
    }

    // Set up the confirm button
    if (confirmDialogBtn) {
      // Remove existing event listeners
      const newConfirmBtn = confirmDialogBtn.cloneNode(true);
      confirmDialogBtn.parentNode.replaceChild(newConfirmBtn, confirmDialogBtn);

      // Add new event listener
      newConfirmBtn.addEventListener("click", () => {
        deletePost(id);
        hideConfirmDialog();
      });
    }

    // Show the dialog
    confirmDialog.classList.remove("hidden");
  }

  function hideConfirmDialog() {
    if (confirmDialog) {
      confirmDialog.classList.add("hidden");
    }
  }

  async function deletePost(id) {
    showLoading(true);

    try {
      if (db && !isUsingLocalStorage) {
        // Delete from Firebase
        await db.collection("posts").doc(id).delete();
      } else {
        // Delete from localStorage
        savePostsToStorage(posts.filter((post) => post.id !== id));
      }

      // Update local posts array
      posts = posts.filter((post) => post.id !== id);

      showToast("Post deleted successfully");

      // Refresh posts display
      filterAndDisplayPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      showToast("Failed to delete post. Please try again.", "error");
    } finally {
      showLoading(false);
    }
  }

  // Helper functions
  function showToast(message, type = "success") {
    if (!toast || !toastMessage) return;

    // Set message
    toastMessage.textContent = message;

    // Set color based on type
    toast.className =
      "fixed bottom-4 right-4 px-6 py-3 rounded-md shadow-lg transform transition-all duration-300 flex items-center z-50";

    switch (type) {
      case "error":
        toast.classList.add("bg-red-600", "text-white");
        break;
      case "warning":
        toast.classList.add("bg-yellow-500", "text-white");
        break;
      case "info":
        toast.classList.add("bg-blue-600", "text-white");
        break;
      default:
        toast.classList.add("bg-green-600", "text-white");
    }

    // Show toast
    toast.classList.remove("opacity-0", "translate-y-2", "pointer-events-none");

    // Hide after 3 seconds
    setTimeout(() => {
      toast.classList.add("opacity-0", "translate-y-2", "pointer-events-none");
    }, 3000);
  }

  function showLoading(isLoading) {
    if (!loadingState) return;

    if (isLoading) {
      loadingState.classList.remove("hidden");
      if (blogPostsContainer) {
        blogPostsContainer.classList.add("hidden");
      }
    } else {
      loadingState.classList.add("hidden");
      if (blogPostsContainer) {
        blogPostsContainer.classList.remove("hidden");
      }
    }
  }

  function getPosts() {
    const storedPosts = localStorage.getItem("blogPosts");
    return storedPosts ? JSON.parse(storedPosts) : [];
  }

  function getPostById(id) {
    // First try to find in memory
    const post = posts.find((post) => post.id === id);
    if (post) return post;

    // If not found and using localStorage, try there
    if (isUsingLocalStorage) {
      const storagePosts = getPosts();
      return storagePosts.find((post) => post.id === id);
    }

    return null;
  }

  function savePostToStorage(post) {
    const storedPosts = getPosts();

    // Check if post exists
    const existingPostIndex = storedPosts.findIndex((p) => p.id === post.id);

    if (existingPostIndex !== -1) {
      // Update existing post
      storedPosts[existingPostIndex] = post;
    } else {
      // Add new post
      storedPosts.push(post);
    }

    // Save back to localStorage
    savePostsToStorage(storedPosts);
  }

  function savePostsToStorage(postsArray) {
    localStorage.setItem("blogPosts", JSON.stringify(postsArray));
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
