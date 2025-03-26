// Blog functionality with Firebase integration
document.addEventListener("DOMContentLoaded", function () {
  // Initialize AOS with better settings
  AOS.init({
    duration: 800,
    easing: "ease-in-out",
    once: true,
    disable: "mobile", // Disable on mobile for better performance
    offset: 100,
  });

  // Mobile menu functionality - enhanced with animations
  const mobileMenuButton = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu");

  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener("click", function () {
      const isExpanded =
        mobileMenuButton.getAttribute("aria-expanded") === "true";
      mobileMenuButton.setAttribute("aria-expanded", !isExpanded);

      if (isExpanded) {
        // Close menu with animation
        mobileMenu.classList.add("mobile-menu-exit");
        setTimeout(() => {
          mobileMenu.classList.add("mobile-menu-exit-active");
          setTimeout(() => {
            mobileMenu.classList.add("hidden");
            mobileMenu.classList.remove(
              "mobile-menu-enter",
              "mobile-menu-enter-active",
              "mobile-menu-exit",
              "mobile-menu-exit-active"
            );
          }, 300);
        }, 10);
      } else {
        // Open menu with animation
        mobileMenu.classList.remove("hidden");
        setTimeout(() => {
          mobileMenu.classList.add("mobile-menu-enter");
          setTimeout(() => {
            mobileMenu.classList.add("mobile-menu-enter-active");
          }, 10);
        }, 10);
      }
    });

    // Close mobile menu when clicking outside
    document.addEventListener("click", function (e) {
      if (
        !mobileMenu.contains(e.target) &&
        !mobileMenuButton.contains(e.target) &&
        !mobileMenu.classList.contains("hidden")
      ) {
        mobileMenuButton.click();
      }
    });

    // Close menu when window resizes to desktop size
    window.addEventListener("resize", function () {
      if (
        window.innerWidth >= 768 &&
        !mobileMenu.classList.contains("hidden")
      ) {
        mobileMenuButton.click();
      }
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

  // Enhanced Global state variables
  let db = null; // Firestore database reference
  let currentUser = null; // For future authentication implementation
  let posts = []; // To store all posts
  let currentCategory = "all";
  let currentPage = 1;
  const postsPerPage = 6; // Increased for better UX
  let isUsingLocalStorage = false;
  let selectedCategories = []; // To store selected categories for new/edit post
  let lastFocusedElement = null; // For focus management
  let connectionStatus = "unknown"; // Track connection status: "online", "offline", "unknown"
  let errorDismissTimeout = null; // For auto-dismiss functionality
  let syncPending = false; // Flag to indicate if sync is needed when connection restores
  let reconnectAttempts = 0; // Track reconnect attempts
  const MAX_RECONNECT_ATTEMPTS = 5;
  let unsyncedChanges = []; // Track changes made while offline

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
  const dismissToast = document.getElementById("dismissToast");
  const confirmDialog = document.getElementById("confirmDialog");
  const cancelDialog = document.getElementById("cancelDialog");
  const confirmDialogBtn = document.getElementById("confirmDialogBtn");
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
  const dismissErrorBtn = document.getElementById("dismissErrorBtn");
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
  const titleError = document.getElementById("titleError");
  const contentError = document.getElementById("contentError");
  const submitButton = document.getElementById("submitButton");

  // Additional element references
  const connectionStatusDot = document.getElementById("connection-dot");
  const connectionStatusText = document.getElementById("connection-text");
  const connectionStatusContainer =
    document.getElementById("connection-status");
  const offlineBanner = document.getElementById("offline-banner");
  const retryConnectionBtn = document.getElementById("retryConnectionBtn");
  const errorAutoDismiss = document.getElementById("error-auto-dismiss");
  const networkErrorMessage = document.getElementById("network-error-message");

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

  // Initialize Firebase or fall back to localStorage with improved error handling
  async function initializeFirebase() {
    try {
      // Show connecting status
      updateConnectionStatus("connecting");

      if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();

        // Check if we're actually connected
        await db.collection("test").doc("connectivity").set({
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });

        console.log("Firebase initialized successfully");
        updateConnectionStatus("online");

        // Set up connection state monitoring
        firebase
          .database()
          .ref(".info/connected")
          .on("value", (snapshot) => {
            const isConnected = !!snapshot.val();
            updateConnectionStatus(isConnected ? "online" : "offline");
          });

        // If we were using localStorage previously, try to sync data
        if (isUsingLocalStorage) {
          syncLocalDataToFirebase();
          isUsingLocalStorage = false;
          hideOfflineIndicators();
        }

        return true;
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
      updateConnectionStatus("offline");
      showOfflineIndicators(
        error.message || "Unable to connect to the database"
      );

      // Schedule automatic retry if it's not a configuration error
      if (
        firebaseConfig.apiKey !== "YOUR_API_KEY" &&
        reconnectAttempts < MAX_RECONNECT_ATTEMPTS
      ) {
        scheduleReconnect();
      }

      return false;
    }
  }

  // Function to update the visual connection status
  function updateConnectionStatus(status) {
    connectionStatus = status;

    if (
      !connectionStatusDot ||
      !connectionStatusText ||
      !connectionStatusContainer
    )
      return;

    // Make sure the indicator is visible
    connectionStatusContainer.classList.remove("hidden");

    // Update status based on connection state
    switch (status) {
      case "online":
        connectionStatusDot.className =
          "h-2.5 w-2.5 rounded-full bg-green-500 mr-2";
        connectionStatusText.textContent = "Connected";
        connectionStatusText.className = "text-xs font-medium text-green-700";
        connectionStatusContainer.title = "Connected to database";
        break;

      case "offline":
        connectionStatusDot.className =
          "h-2.5 w-2.5 rounded-full bg-red-500 mr-2";
        connectionStatusText.textContent = "Offline";
        connectionStatusText.className = "text-xs font-medium text-red-700";
        connectionStatusContainer.title =
          "Working offline - Data saved locally";
        break;

      case "connecting":
        connectionStatusDot.className =
          "h-2.5 w-2.5 rounded-full bg-yellow-500 mr-2 animate-pulse";
        connectionStatusText.textContent = "Connecting...";
        connectionStatusText.className = "text-xs font-medium text-yellow-700";
        connectionStatusContainer.title =
          "Attempting to connect to database...";
        break;

      default:
        connectionStatusDot.className =
          "h-2.5 w-2.5 rounded-full bg-gray-400 mr-2";
        connectionStatusText.textContent = "Unknown";
        connectionStatusText.className = "text-xs font-medium text-gray-600";
        connectionStatusContainer.title = "Connection status unknown";
        break;
    }
  }

  // Show offline indicators (banner and error message)
  function showOfflineIndicators(errorMsg) {
    // Show offline banner
    if (offlineBanner) {
      offlineBanner.classList.remove("hidden");
    }

    // Show error notification with auto-dismiss
    if (networkError) {
      // Set custom error message if provided
      if (errorMsg && networkErrorMessage) {
        networkErrorMessage.textContent = errorMsg;
      }

      networkError.classList.remove("hidden");

      // Start auto-dismiss animation
      startErrorAutoDismiss();
    }
  }

  // Hide offline indicators
  function hideOfflineIndicators() {
    if (offlineBanner) {
      offlineBanner.classList.add("hidden");
    }

    if (networkError) {
      networkError.classList.add("hidden");
    }

    // Clear any pending timeouts
    if (errorDismissTimeout) {
      clearTimeout(errorDismissTimeout);
      errorDismissTimeout = null;
    }
  }

  // Start auto-dismiss animation for error message
  function startErrorAutoDismiss() {
    if (!errorAutoDismiss || !networkError) return;

    // Reset any existing animation
    errorAutoDismiss.style.width = "0";
    clearTimeout(errorDismissTimeout);

    // Start the progress animation
    errorAutoDismiss.style.transition = "width 5s linear";
    setTimeout(() => {
      errorAutoDismiss.style.width = "100%";
    }, 50);

    // Set timeout to hide the error after 5 seconds
    errorDismissTimeout = setTimeout(() => {
      networkError.classList.add("hidden");
      errorDismissTimeout = null;
    }, 5000);
  }

  // Schedule reconnection attempt
  function scheduleReconnect() {
    reconnectAttempts++;

    // Exponential backoff for reconnect attempts (1s, 2s, 4s, 8s, 16s)
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 30000);

    console.log(
      `Scheduling reconnect attempt ${reconnectAttempts} in ${delay}ms`
    );

    setTimeout(async () => {
      const connected = await initializeFirebase();

      if (connected) {
        reconnectAttempts = 0;
        showToast("Connection restored!", "success");

        // If there are pending syncs, perform them now
        if (syncPending) {
          syncLocalDataToFirebase();
        }
      }
    }, delay);
  }

  // Handle retry connection button click
  if (retryConnectionBtn) {
    retryConnectionBtn.addEventListener("click", async () => {
      // Update button to show loading state
      retryConnectionBtn.disabled = true;
      retryConnectionBtn.innerHTML =
        '<svg class="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Connecting...';

      // Hide error auto-dismiss
      if (errorAutoDismiss) {
        errorAutoDismiss.style.width = "0";
      }

      // Attempt to reconnect
      const connected = await initializeFirebase();

      // Reset button state
      retryConnectionBtn.disabled = false;
      retryConnectionBtn.innerHTML = "Retry Connection";

      if (connected) {
        hideOfflineIndicators();
        showToast("Connection restored!", "success");
      } else {
        // If failed, restart auto-dismiss
        startErrorAutoDismiss();
      }
    });
  }

  // Sync local data to Firebase when connection is restored
  async function syncLocalDataToFirebase() {
    if (!db || isUsingLocalStorage) return;

    try {
      const localPosts = getPosts();

      if (localPosts.length === 0) {
        syncPending = false;
        return;
      }

      showToast("Syncing local posts to database...", "info");

      // Get existing posts from Firebase to avoid duplicates
      const snapshot = await db.collection("posts").get();
      const firebasePosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Find posts that need to be synced (not in Firebase or newer version)
      const postsToSync = localPosts.filter((localPost) => {
        const firebasePost = firebasePosts.find(
          (fbPost) => fbPost.id === localPost.id
        );
        return (
          !firebasePost ||
          new Date(localPost.date) > new Date(firebasePost.date)
        );
      });

      if (postsToSync.length === 0) {
        showToast("All posts are already in sync", "info");
        syncPending = false;
        return;
      }

      // Sync each post to Firebase
      let syncCount = 0;
      for (const post of postsToSync) {
        await db.collection("posts").doc(post.id).set(post);
        syncCount++;
      }

      showToast(
        `Successfully synced ${syncCount} posts to database`,
        "success"
      );
      syncPending = false;

      // Reload posts from Firebase to ensure we have the latest data
      loadPosts();
    } catch (error) {
      console.error("Error syncing posts:", error);
      showToast("Failed to sync some posts. Will try again later.", "warning");
      syncPending = true;
    }
  }

  // Monitor navigator online/offline events
  window.addEventListener("online", async () => {
    if (connectionStatus === "offline") {
      showToast(
        "Internet connection restored. Reconnecting to database...",
        "info"
      );
      const connected = await initializeFirebase();

      if (connected) {
        showToast("Database connection restored!", "success");
      }
    }
  });

  window.addEventListener("offline", () => {
    updateConnectionStatus("offline");
    showOfflineIndicators("Internet connection lost. Working in offline mode.");
    isUsingLocalStorage = true;
    syncPending = true;
  });

  // Enhanced error dismissal
  if (dismissErrorBtn && networkError) {
    dismissErrorBtn.addEventListener("click", function () {
      networkError.classList.add("hidden");

      if (errorDismissTimeout) {
        clearTimeout(errorDismissTimeout);
        errorDismissTimeout = null;
      }
    });
  }

  // Initialize app with improved error handling
  document.addEventListener("DOMContentLoaded", function () {
    // Initialize AOS with better settings
    AOS.init({
      duration: 800,
      easing: "ease-in-out",
      once: true,
      disable: "mobile", // Disable on mobile for better performance
      offset: 100,
    });

    // Mobile menu functionality - enhanced with animations
    const mobileMenuButton = document.getElementById("mobile-menu-button");
    const mobileMenu = document.getElementById("mobile-menu");

    if (mobileMenuButton && mobileMenu) {
      mobileMenuButton.addEventListener("click", function () {
        const isExpanded =
          mobileMenuButton.getAttribute("aria-expanded") === "true";
        mobileMenuButton.setAttribute("aria-expanded", !isExpanded);

        if (isExpanded) {
          // Close menu with animation
          mobileMenu.classList.add("mobile-menu-exit");
          setTimeout(() => {
            mobileMenu.classList.add("mobile-menu-exit-active");
            setTimeout(() => {
              mobileMenu.classList.add("hidden");
              mobileMenu.classList.remove(
                "mobile-menu-enter",
                "mobile-menu-enter-active",
                "mobile-menu-exit",
                "mobile-menu-exit-active"
              );
            }, 300);
          }, 10);
        } else {
          // Open menu with animation
          mobileMenu.classList.remove("hidden");
          setTimeout(() => {
            mobileMenu.classList.add("mobile-menu-enter");
            setTimeout(() => {
              mobileMenu.classList.add("mobile-menu-enter-active");
            }, 10);
          }, 10);
        }
      });

      // Close mobile menu when clicking outside
      document.addEventListener("click", function (e) {
        if (
          !mobileMenu.contains(e.target) &&
          !mobileMenuButton.contains(e.target) &&
          !mobileMenu.classList.contains("hidden")
        ) {
          mobileMenuButton.click();
        }
      });

      // Close menu when window resizes to desktop size
      window.addEventListener("resize", function () {
        if (
          window.innerWidth >= 768 &&
          !mobileMenu.classList.contains("hidden")
        ) {
          mobileMenuButton.click();
        }
      });
    }

    // Initialize Firebase with better error handling
    initializeFirebase().then((connected) => {
      if (connected) {
        console.log("Firebase initialized and connected");
      } else {
        console.log("Using local storage mode");
      }

      // Load posts regardless of connection status
      loadPosts();
    });

    // Event listeners
    if (newPostBtn) {
      newPostBtn.addEventListener("click", showNewPostForm);
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", hidePostForm);
    }

    if (blogPostForm) {
      blogPostForm.addEventListener("submit", handleFormSubmit);
    }

    // Form field validation on blur
    if (postTitleInput && titleError) {
      postTitleInput.addEventListener("blur", validateTitle);
      postTitleInput.addEventListener("input", () => {
        if (postTitleInput.classList.contains("error")) {
          validateTitle();
        }
      });
    }

    if (postContentInput && contentError) {
      postContentInput.addEventListener("blur", validateContent);
      postContentInput.addEventListener("input", () => {
        if (postContentInput.classList.contains("error")) {
          validateContent();
        }
      });
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

    // Toast dismiss button
    if (dismissToast && toast) {
      dismissToast.addEventListener("click", () => {
        hideToast();
      });
    }

    // Network error dismiss button
    if (dismissErrorBtn && networkError) {
      dismissErrorBtn.addEventListener("click", () => {
        networkError.classList.add("hidden");
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

        // Focus on textarea when switching to write tab
        postContentInput.focus();
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
          postContentInput.value || "<em>Nothing to preview</em>"
        );
      });
    }

    // Live preview for markdown editor
    if (postContentInput && previewContent) {
      postContentInput.addEventListener("input", () => {
        if (!previewContent.classList.contains("hidden")) {
          previewContent.innerHTML = marked.parse(
            postContentInput.value || "<em>Nothing to preview</em>"
          );
        }
      });
    }

    // Modal close buttons with focus management
    if (closeDetailModal && postDetailModal) {
      closeDetailModal.addEventListener("click", closeDetailModalWithFocus);
    }

    if (closeModalBtn && postDetailModal) {
      closeModalBtn.addEventListener("click", closeDetailModalWithFocus);
    }

    // Close modal on outside click and ESC key
    if (postDetailModal) {
      postDetailModal.addEventListener("click", (e) => {
        if (e.target === postDetailModal) {
          closeDetailModalWithFocus();
        }
      });

      document.addEventListener("keydown", (e) => {
        if (
          e.key === "Escape" &&
          !postDetailModal.classList.contains("hidden")
        ) {
          closeDetailModalWithFocus();
        }
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

    // Search functionality with debounce
    if (searchButton && searchInput) {
      searchButton.addEventListener("click", () => {
        filterAndDisplayPosts();
      });

      // Debounced search on typing
      let searchTimeout;
      searchInput.addEventListener("input", () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          filterAndDisplayPosts();
        }, 500);
      });

      searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          filterAndDisplayPosts();
        }
      });
    }

    // Pagination with better UX
    if (prevPage) {
      prevPage.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage--;
          filterAndDisplayPosts();

          // Scroll to top of posts with smooth animation
          blogPostsContainer.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      });
    }

    if (nextPage) {
      nextPage.addEventListener("click", () => {
        const totalPages = Math.ceil(getFilteredPosts().length / postsPerPage);
        if (currentPage < totalPages) {
          currentPage++;
          filterAndDisplayPosts();

          // Scroll to top of posts with smooth animation
          blogPostsContainer.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      });
    }

    // Dialog event listeners with proper focus management
    if (confirmDialog && cancelDialog) {
      cancelDialog.addEventListener("click", hideConfirmDialog);

      // Close on Escape key
      confirmDialog.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          hideConfirmDialog();
        }
      });

      // Close on outside click
      confirmDialog.addEventListener("click", (e) => {
        if (e.target === confirmDialog) {
          hideConfirmDialog();
        }
      });
    }

    // Load posts on page load
    loadPosts();

    // Form validation functions
    function validateTitle() {
      if (!postTitleInput || !titleError) return true;

      const value = postTitleInput.value.trim();
      if (!value) {
        postTitleInput.classList.add("error");
        titleError.textContent = "Title is required";
        titleError.classList.remove("hidden");
        return false;
      }

      postTitleInput.classList.remove("error");
      titleError.classList.add("hidden");
      return true;
    }

    function validateContent() {
      if (!postContentInput || !contentError) return true;

      const value = postContentInput.value.trim();
      if (!value) {
        postContentInput.classList.add("error");
        contentError.textContent = "Content is required";
        contentError.classList.remove("hidden");
        return false;
      }

      postContentInput.classList.remove("error");
      contentError.classList.add("hidden");
      return true;
    }

    function validateForm() {
      const titleValid = validateTitle();
      const contentValid = validateContent();
      return titleValid && contentValid;
    }

    function handleFormSubmit(e) {
      e.preventDefault();

      if (!validateForm()) {
        // Scroll to first error
        const firstError = document.querySelector(".form-input.error");
        if (firstError) {
          firstError.focus();
        }
        return;
      }

      savePost(e);
    }

    // Main functions
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
        showToast(
          "Failed to load posts. Using local storage instead.",
          "error"
        );

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
          "category-filter px-4 py-2 rounded-md bg-gray-200 text-gray-700 transition-all hover:bg-secondary hover:text-white focus-ring";
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

      // Announce to screen readers
      announceToScreenReader(
        `Showing ${paginatedPosts.length} posts of ${filteredPosts.length} total.`
      );
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
          ? "px-3 py-1 rounded-md bg-primary text-white focus-ring"
          : "px-3 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 focus-ring";
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

      // Add each post to the container with staggered animations
      postsToDisplay.forEach((post, index) => {
        const postEl = createPostElement(post);

        // Add staggered animation
        postEl.style.animationDelay = `${index * 50}ms`;
        postEl.classList.add("animate-fadeIn");

        postsGrid.appendChild(postEl);
      });
    }

    // Enhanced createPostElement function with sync status indicator
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

      // Determine if we need to show the "pending sync" indicator
      const syncStatusIndicator =
        post.syncStatus === "pending"
          ? `<div class="flex items-center ml-2">
          <span class="w-2 h-2 bg-amber-400 rounded-full mr-1 animate-pulse"></span>
          <span class="text-xs text-amber-600 font-medium">Not synced</span>
         </div>`
          : "";

      // Create post HTML structure with sync indicator
      postEl.innerHTML = `
        <div class="p-6 pb-4 flex justify-between items-start border-b border-gray-100">
          <h2 class="text-xl font-bold text-primary line-clamp-2">${escapeHtml(
            post.title
          )}</h2>
          <div class="flex space-x-1 ml-2">
            <button class="edit-btn bg-transparent border-none p-2 rounded-full hover:bg-blue-50 transition-colors 
              cursor-pointer text-gray-500 hover:text-primary focus-ring" title="Edit Post">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              <span class="sr-only">Edit post</span>
            </button>
            <button class="delete-btn bg-transparent border-none p-2 rounded-full hover:bg-red-50 transition-colors 
              cursor-pointer text-gray-500 hover:text-red-600 focus-ring" title="Delete Post">
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
            <span>${formattedDate}</span>
            ${syncStatusIndicator}
          </div>
          <div class="flex flex-wrap mb-3">
            ${categoryBadges}
          </div>
          <div class="prose prose-sm max-w-none line-clamp-3 mb-4 text-gray-600">
            ${marked.parse(excerpt)}
          </div>
        </div>
        <!-- ...existing code... -->
      `;

      // Add event listeners to the buttons
      const editBtn = postEl.querySelector(".edit-btn");
      const deleteBtn = postEl.querySelector(".delete-btn");
      const readMoreBtn = postEl.querySelector(".read-more-btn");

      editBtn.addEventListener("click", () => editPost(post.id));
      deleteBtn.addEventListener("click", () =>
        showDeleteConfirmation(post.id)
      );

      if (readMoreBtn) {
        readMoreBtn.addEventListener("click", () => {
          lastFocusedElement = readMoreBtn;
          showPostDetail(post);
        });
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
            <span class="font-medium">Author:</span> ${
              post.author || "Anonymous"
            }
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

      // Add modal animation
      postDetailModal.classList.add("modal-enter");
      setTimeout(() => {
        postDetailModal.classList.add("modal-enter-active");
      }, 10);

      // Focus on close button
      setTimeout(() => {
        closeDetailModal.focus();
      }, 100);

      // Trap focus in modal
      trapFocusInModal(postDetailModal);
    }

    function closeDetailModalWithFocus() {
      if (!postDetailModal) return;

      document.body.classList.remove("overflow-hidden");
      postDetailModal.classList.remove("modal-enter", "modal-enter-active");
      postDetailModal.classList.add("hidden");

      // Restore focus
      if (lastFocusedElement) {
        lastFocusedElement.focus();
        lastFocusedElement = null;
      }
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
        <span class="mr-1">${escapeHtml(category)}</span>
        <button type="button" class="remove-category text-blue-700 hover:text-blue-900 focus-ring" aria-label="Remove ${escapeHtml(
          category
        )}">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 011.414 0L10 8.586l4.293-4.293a1 1 111.414 1.414L11.414 10l4.293 4.293a1 1 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 01-1.414-1.414L8.586 10 4.293 5.707a1 1 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      `;

      // Add event listener to remove button
      const removeBtn = tagEl.querySelector(".remove-category");
      removeBtn.addEventListener("click", () => {
        selectedCategories = selectedCategories.filter(
          (cat) => cat !== category
        );
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

      // Clear any validation errors
      if (titleError) titleError.classList.add("hidden");
      if (contentError) contentError.classList.add("hidden");
      if (postTitleInput) postTitleInput.classList.remove("error");
      if (postContentInput) postContentInput.classList.remove("error");

      // Store last focused element for focus restoration
      lastFocusedElement = document.activeElement;

      postForm.classList.remove("hidden");
      newPostBtn.classList.add("hidden");

      // Show the form with animation
      postForm.classList.add("animate-fadeIn");

      // Focus on the title input
      setTimeout(() => {
        postTitleInput.focus();
      }, 100);
    }

    function hidePostForm() {
      postForm.classList.add("hidden");
      newPostBtn.classList.remove("hidden");

      // Restore focus
      if (lastFocusedElement) {
        lastFocusedElement.focus();
      } else {
        newPostBtn.focus();
      }
    }

    // Enhanced savePost function with offline tracking
    async function savePost(e) {
      e.preventDefault();

      // ...existing validation code...

      const title = postTitleInput.value.trim();
      const content = postContentInput.value.trim();

      // Submit button loading state
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML =
          '<svg class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Saving...';
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
        lastModified: new Date().toISOString(), // Track last modification time
        syncStatus: isUsingLocalStorage ? "pending" : "synced", // Track sync status
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
          post.syncStatus = "pending"; // Mark as needing sync
          savePostToStorage(post);
          syncPending = true; // Mark that we have pending changes to sync

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

        // Show success message with online/offline context
        if (isUsingLocalStorage) {
          showToast(
            isNewPost
              ? "Post saved locally. Will sync when connection is restored."
              : "Post updated locally. Will sync when connection is restored.",
            "info"
          );
        } else {
          showToast(
            isNewPost
              ? "Post created successfully!"
              : "Post updated successfully!"
          );
        }

        // Update category filters and display posts
        updateCategoryFilters();
        filterAndDisplayPosts();
      } catch (error) {
        console.error("Error saving post:", error);

        // Always fall back to local storage on error
        post.syncStatus = "pending";
        savePostToStorage(post);
        syncPending = true;

        // Update local array
        const postIndex = posts.findIndex((p) => p.id === postId);
        if (postIndex !== -1) {
          posts[postIndex] = post;
        } else {
          posts.push(post);
        }

        showToast(
          "Saved locally due to connection error. Will sync when connection is restored.",
          "warning"
        );

        // Switch to offline mode
        isUsingLocalStorage = true;
        updateConnectionStatus("offline");
        showOfflineIndicators("Connection error. Working in offline mode.");

        // Schedule reconnect
        scheduleReconnect();

        // Update UI
        hidePostForm();
        updateCategoryFilters();
        filterAndDisplayPosts();
      } finally {
        showLoading(false);

        // Reset submit button
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 01-1.414 0l-4-4a1 1 01-1.414-1.414L11.414 10l4.293 4.293a1 1 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 01-1.414-1.414L8.586 10 4.293 5.707a1 1 010-1.414z" clip-rule="evenodd" /></svg> Save Post';
        }
      }
    }

    function editPost(id) {
      const post = getPostById(id);
      if (!post) return;

      // Store last focused element for focus restoration
      lastFocusedElement = document.activeElement;

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

      // Clear any validation errors
      if (titleError) titleError.classList.add("hidden");
      if (contentError) contentError.classList.add("hidden");
      if (postTitleInput) postTitleInput.classList.remove("error");
      if (postContentInput) postContentInput.classList.remove("error");

      // Reset to write tab
      if (writeTab) {
        writeTab.click();
      }

      postForm.classList.remove("hidden");
      newPostBtn.classList.add("hidden");

      // Show the form with animation
      postForm.classList.add("animate-fadeIn");

      // Focus on the title input
      setTimeout(() => {
        postTitleInput.focus();
      }, 100);
    }

    function showDeleteConfirmation(id) {
      const post = getPostById(id);
      if (!post) return;

      // Store last focused element for focus restoration
      lastFocusedElement = document.activeElement;

      if (!confirmDialog) {
        // Fallback if dialog doesn't exist
        if (
          confirm(
            `Are you sure you want to delete "${post.title}"? This action cannot be undone.`
          )
        ) {
          deletePost(id);
        } else {
          // Restore focus if cancel clicked
          if (lastFocusedElement) {
            lastFocusedElement.focus();
            lastFocusedElement = null;
          }
        }
        return;
      }

      // Fix the confirmation dialog structure to match the HTML
      const dialogDiv = confirmDialog.querySelector(".bg-white");

      if (dialogDiv) {
        dialogDiv.innerHTML = `
          <h3 class="text-xl font-semibold text-gray-900 mb-4" id="dialogTitle">Delete Post</h3>
          <p id="dialogMessage" class="text-gray-700 mb-6">Are you sure you want to delete "${escapeHtml(
            post.title
          )}"? This action cannot be undone.</p>
          <div class="flex flex-col-reverse sm:flex-row justify-end space-y-3 space-y-reverse sm:space-y-0 sm:space-x-4">
            <button id="cancelDialog"
                class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition duration-300 focus-ring">
                Cancel
            </button>
            <button id="confirmDialogBtn"
                class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition duration-300 focus-ring">
                Delete
            </button>
          </div>
        `;

        // Set up button event listeners
        const newCancelBtn = dialogDiv.querySelector("#cancelDialog");
        const newConfirmBtn = dialogDiv.querySelector("#confirmDialogBtn");

        if (newCancelBtn) {
          newCancelBtn.addEventListener("click", hideConfirmDialog);
        }

        if (newConfirmBtn) {
          newConfirmBtn.addEventListener("click", () => {
            deletePost(id);
            hideConfirmDialog();
          });
        }
      }

      // Show the dialog with animation
      confirmDialog.classList.remove("hidden");

      // Focus on confirm button
      setTimeout(() => {
        const confirmBtn = confirmDialog.querySelector("#confirmDialogBtn");
        if (confirmBtn) confirmBtn.focus();
      }, 100);
    }

    function hideConfirmDialog() {
      if (confirmDialog) {
        confirmDialog.classList.add("hidden");

        // Restore focus
        if (lastFocusedElement) {
          lastFocusedElement.focus();
          lastFocusedElement = null;
        }
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

        // Update category filters as categories might have changed
        updateCategoryFilters();
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
      toast.classList.remove(
        "opacity-0",
        "translate-y-2",
        "pointer-events-none"
      );

      // Hide after 5 seconds
      clearTimeout(window.toastTimeout);
      window.toastTimeout = setTimeout(() => {
        hideToast();
      }, 5000);
    }

    function hideToast() {
      if (toast) {
        toast.classList.add(
          "opacity-0",
          "translate-y-2",
          "pointer-events-none"
        );
      }
    }

    function showLoading(isLoading) {
      if (!loadingState || !blogPostsContainer) return;

      if (isLoading) {
        loadingState.classList.remove("hidden");
        blogPostsContainer.classList.add("hidden");
      } else {
        loadingState.classList.add("hidden");
        blogPostsContainer.classList.remove("hidden");
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
      if (!unsafe) return "";

      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    function trapFocusInModal(modal) {
      // Get all focusable elements
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Handle tab key press
      modal.addEventListener("keydown", function (e) {
        if (e.key === "Tab") {
          // If shift key is pressed and focus is on first element, move to last element
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
          // If focus is on last element, move to first element
          else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      });
    }

    function announceToScreenReader(message) {
      // Create or get an invisible live region for screen reader announcements
      let ariaLive = document.getElementById("aria-live-region");

      if (!ariaLive) {
        ariaLive = document.createElement("div");
        ariaLive.id = "aria-live-region";
        ariaLive.setAttribute("aria-live", "polite");
        ariaLive.classList.add("sr-only");
        document.body.appendChild(ariaLive);
      }

      ariaLive.textContent = message;
    }
  });
});
