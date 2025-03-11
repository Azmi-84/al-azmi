// Import configuration with API keys
import CONFIG from "./config.js";

// Initialize AOS animation library
document.addEventListener("DOMContentLoaded", function () {
  // Initialize AOS animations
  AOS.init({
    duration: 800,
    easing: "ease-in-out",
    once: true,
    mirror: false,
  });

  // Initialize EmailJS with key from config file
  emailjs.init(CONFIG.emailjs.publicKey);

  // Mobile menu toggle functionality
  const mobileMenuButton = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu");

  mobileMenuButton.addEventListener("click", function () {
    const expanded = this.getAttribute("aria-expanded") === "true";
    this.setAttribute("aria-expanded", !expanded);

    if (expanded) {
      mobileMenu.classList.add("mobile-menu-enter");
      mobileMenu.classList.remove("mobile-menu-enter-active");

      setTimeout(() => {
        mobileMenu.classList.add("hidden");
      }, 300);
    } else {
      mobileMenu.classList.remove("hidden");

      // Force reflow to enable transition
      mobileMenu.offsetWidth;

      mobileMenu.classList.add("mobile-menu-enter");
      mobileMenu.classList.add("mobile-menu-enter-active");
    }
  });

  // Smooth scrolling for navigation links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href");

      if (targetId === "#") return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80, // Offset for fixed header
          behavior: "smooth",
        });

        // Close mobile menu if open
        if (!mobileMenu.classList.contains("hidden")) {
          mobileMenuButton.click();
        }
      }
    });
  });

  // Active navigation link highlighting
  const sections = document.querySelectorAll("section");
  const navLinks = document.querySelectorAll(".nav-link");

  window.addEventListener("scroll", () => {
    let current = "";

    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 100;
      const sectionHeight = section.clientHeight;

      if (
        pageYOffset >= sectionTop &&
        pageYOffset < sectionTop + sectionHeight
      ) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("text-secondary");
      if (link.getAttribute("href") === `#${current}`) {
        link.classList.add("text-secondary");
      }
    });
  });

  // Project filtering functionality
  const filterButtons = document.querySelectorAll(".project-filter");
  const projectCards = document.querySelectorAll(".project-card");

  filterButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const filter = this.getAttribute("data-filter");

      // Update ARIA attributes for accessibility
      filterButtons.forEach((btn) => {
        // Update visual styling
        btn.classList.remove("active", "bg-primary", "text-white");
        btn.classList.add("bg-gray-200");

        // Update ARIA attributes
        btn.setAttribute("aria-selected", "false");
      });

      // Add active class to clicked button
      this.classList.add("active", "bg-primary", "text-white");
      this.classList.remove("bg-gray-200");
      this.setAttribute("aria-selected", "true");

      // Filter projects based on category
      projectCards.forEach((card) => {
        // Show all cards if filter is "all"
        if (filter === "all") {
          card.style.display = "block";
          setTimeout(() => {
            card.classList.remove("opacity-0", "scale-95");
            card.classList.add("opacity-100", "scale-100");
          }, 50);
          return;
        }

        // Otherwise, filter by category
        const categories = card.getAttribute("data-category").split(" ");

        if (categories.includes(filter)) {
          card.style.display = "block";
          setTimeout(() => {
            card.classList.remove("opacity-0", "scale-95");
            card.classList.add("opacity-100", "scale-100");
          }, 50);
        } else {
          card.classList.remove("opacity-100", "scale-100");
          card.classList.add("opacity-0", "scale-95");
          setTimeout(() => {
            card.style.display = "none";
          }, 300);
        }
      });

      // Announce filter change for screen readers
      const filterAnnouncement = document.createElement("div");
      filterAnnouncement.setAttribute("aria-live", "polite");
      filterAnnouncement.classList.add("sr-only");
      filterAnnouncement.textContent = `Filtered by ${
        filter === "all" ? "all projects" : filter + " projects"
      }`;
      document.body.appendChild(filterAnnouncement);

      // Remove announcement after it's been read
      setTimeout(() => {
        document.body.removeChild(filterAnnouncement);
      }, 1000);
    });
  });

  // Project Details Modal Functionality
  const projectDetailsButtons = document.querySelectorAll(
    ".project-details-btn"
  );
  const projectModal = document.getElementById("project-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalContent = document.getElementById("modal-content");
  const closeModalButton = document.getElementById("close-modal");

  // Store the element that had focus before opening the modal
  let previouslyFocusedElement;

  // Project data
  const projectsData = {
    project1: {
      title: "Material Microstructure Analysis",
      description: `
        <p class="mb-4">This project uses computer vision and deep learning techniques to analyze material microstructures and predict mechanical properties based on visual patterns in the material.</p>
        
        <h4 class="text-lg font-semibold mb-2">Challenge:</h4>
        <p class="mb-4">Traditional methods for evaluating material properties are time-consuming and destructive. Our goal was to develop a non-destructive method using image analysis to predict properties accurately.</p>
        
        <h4 class="text-lg font-semibold mb-2">Methodology:</h4>
        <ul class="list-disc pl-5 mb-4 space-y-1">
          <li>Image preprocessing to enhance microstructure patterns</li>
          <li>Feature extraction using convolutional neural networks</li>
          <li>Transfer learning with pre-trained models (ResNet, VGG)</li>
          <li>Regression models for property prediction</li>
        </ul>
        
        <h4 class="text-lg font-semibold mb-2">Results:</h4>
        <p class="mb-4">Our model achieved 92% accuracy in predicting material hardness and 87% accuracy for tensile strength based purely on microstructure images. This presents a significant advancement in non-destructive material testing.</p>
        
        <div class="flex flex-wrap gap-3 mt-6">
          <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded">Python</span>
          <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded">TensorFlow</span>
          <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded">OpenCV</span>
          <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded">Materials Science</span>
          <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded">CNN</span>
        </div>
      `,
    },
    project2: {
      title: "Marimo Notebook Implementation",
      description: `
        <p class="mb-4">A comprehensive implementation of Recurrent Neural Networks (RNN) from scratch using Marimo notebook, demonstrating the capabilities of this Jupyter alternative for data science workflows.</p>
        
        <h4 class="text-lg font-semibold mb-2">Challenge:</h4>
        <p class="mb-4">Traditional notebooks can be difficult to maintain and share due to execution order issues and lack of modular components. We aimed to showcase how Marimo can address these limitations.</p>
        
        <h4 class="text-lg font-semibold mb-2">Implementation:</h4>
        <ul class="list-disc pl-5 mb-4 space-y-1">
          <li>Built RNN architectures from fundamental principles</li>
          <li>Implemented LSTM and GRU cells with clear explanations</li>
          <li>Created interactive visualizations of network training</li>
          <li>Developed a time-series prediction application</li>
          <li>Added interactive controls for hyperparameter tuning</li>
        </ul>
        
        <h4 class="text-lg font-semibold mb-2">Key Features:</h4>
        <p class="mb-4">The notebook includes interactive elements that allow users to adjust model parameters and immediately see results. The modular structure ensures reproducibility and easier understanding of complex neural network concepts.</p>
        
        <div class="flex flex-wrap gap-3 mt-6">
          <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded">Python</span>
          <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded">Marimo</span>
          <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded">RNN</span>
          <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded">Deep Learning</span>
          <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded">Data Visualization</span>
        </div>
      `,
    },
    project3: {
      title: "Mechanical Component Optimization",
      description: `
        <p class="mb-4">An algorithm that combines machine learning with finite element analysis to optimize mechanical component designs for specific performance characteristics while minimizing material usage.</p>
        
        <h4 class="text-lg font-semibold mb-2">Challenge:</h4>
        <p class="mb-4">Traditional design optimization is computationally expensive and often relies on designer intuition. We aimed to create a data-driven approach that could explore more design possibilities efficiently.</p>
        
        <h4 class="text-lg font-semibold mb-2">Approach:</h4>
        <ul class="list-disc pl-5 mb-4 space-y-1">
          <li>Parameterized component geometry for variable optimization</li>
          <li>Created surrogate models to predict FEA results without full simulation</li>
          <li>Implemented genetic algorithms for multi-objective optimization</li>
          <li>Developed a coupling between MATLAB optimization routines and FEA software</li>
        </ul>
        
        <h4 class="text-lg font-semibold mb-2">Results:</h4>
        <p class="mb-4">Our approach reduced design iteration time by 78% while producing components with 15% less material and equivalent or better performance. The ML-assisted optimization found novel design solutions that human designers had not considered.</p>
        
        <div class="flex flex-wrap gap-3 mt-6">
          <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded">MATLAB</span>
          <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded">FEA</span>
          <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded">CAD</span>
          <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded">Genetic Algorithms</span>
          <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded">Optimization</span>
        </div>
      `,
    },
  };

  // Open modal with project details
  projectDetailsButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const projectCard = this.closest(".project-card");
      const projectId = projectCard.getAttribute("data-project-id");
      const project = projectsData[projectId];

      // Store current focus for later restoration
      previouslyFocusedElement = document.activeElement;

      // Set modal content
      modalTitle.textContent = project.title;
      modalContent.innerHTML = project.description;

      // Show modal with animation - using existing CSS classes
      projectModal.classList.remove("hidden");
      projectModal.classList.add("animate-fadeIn");

      // Prevent body scrolling
      document.body.classList.add("overflow-hidden");

      // Move focus to modal close button
      setTimeout(() => {
        closeModalButton.focus();
      }, 100);
    });
  });

  // Close modal
  closeModalButton.addEventListener("click", function () {
    // Add fadeOut animation
    projectModal.classList.add("animate-fadeOut");

    setTimeout(() => {
      projectModal.classList.add("hidden");
      projectModal.classList.remove("animate-fadeIn", "animate-fadeOut");
      // Re-enable body scrolling
      document.body.classList.remove("overflow-hidden");

      // Restore focus to previously focused element
      if (previouslyFocusedElement) {
        previouslyFocusedElement.focus();
      }
    }, 300);
  });

  // Close modal when clicking outside
  projectModal.addEventListener("click", function (e) {
    if (e.target === this) {
      closeModalButton.click();
    }
  });

  // Close modal with Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !projectModal.classList.contains("hidden")) {
      closeModalButton.click();
    }
  });

  // Trap focus within modal when open for accessibility
  projectModal.addEventListener("keydown", function (e) {
    if (e.key === "Tab") {
      // Get all focusable elements in modal
      const focusableElements = projectModal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // If shift+tab and on first element, go to last element
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
      // If tab and on last element, go to first element
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  });

  // Back to top button functionality
  const backToTopButton = document.getElementById("back-to-top");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 500) {
      backToTopButton.classList.remove("opacity-0", "invisible");
      backToTopButton.classList.add("opacity-100", "visible");
    } else {
      backToTopButton.classList.remove("opacity-100", "visible");
      backToTopButton.classList.add("opacity-0", "invisible");
    }
  });

  backToTopButton.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });

  // Enhanced form validation and submission with better user feedback
  const contactForm = document.getElementById("contactForm");
  const formResponse = document.getElementById("form-response");

  // Real-time validation
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const messageInput = document.getElementById("message");

  // Helper function to validate email format
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Add input validation with immediate feedback
  emailInput.addEventListener("blur", function () {
    if (this.value && !isValidEmail(this.value)) {
      this.classList.add("border-red-500");
      this.setAttribute("aria-invalid", "true");

      // Add error message
      let errorMsg = this.parentNode.querySelector(".error-message");
      if (!errorMsg) {
        errorMsg = document.createElement("p");
        errorMsg.className = "text-red-500 text-sm mt-1 error-message";
        errorMsg.id = "email-error";
        this.setAttribute("aria-describedby", "email-error");
        this.parentNode.appendChild(errorMsg);
      }
      errorMsg.textContent = "Please enter a valid email address";
    } else {
      this.classList.remove("border-red-500");
      this.setAttribute("aria-invalid", "false");

      // Remove error message if exists
      const errorMsg = this.parentNode.querySelector(".error-message");
      if (errorMsg) {
        this.removeAttribute("aria-describedby");
        errorMsg.remove();
      }
    }
  });

  // Form submission handling
  contactForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // Form validation
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const message = messageInput.value.trim();

    if (!name || !email || !message) {
      showFormResponse("error", "Please fill in all required fields");
      return;
    }

    // Email validation
    if (!isValidEmail(email)) {
      showFormResponse("error", "Please enter a valid email address");
      emailInput.focus();
      return;
    }

    // Add loading state
    const submitButton = this.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitButton.disabled = true;

    // Prepare template parameters for EmailJS
    const templateParams = {
      name: name,
      email: email,
      message: message,
    };

    // Send email using EmailJS with config values
    emailjs
      .send(CONFIG.emailjs.serviceId, CONFIG.emailjs.templateId, templateParams)
      .then(
        function (response) {
          console.log("SUCCESS!", response.status, response.text);
          showFormResponse(
            "success",
            "Your message has been sent. I'll get back to you soon!"
          );

          // Reset form
          contactForm.reset();

          // Reset button
          setTimeout(() => {
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
            submitButton.focus(); // Return focus for accessibility
          }, 2000);
        },
        function (error) {
          console.log("FAILED...", error);
          showFormResponse(
            "error",
            "There was a problem sending your message. Please try again later."
          );

          // Reset button
          setTimeout(() => {
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
          }, 2000);
        }
      );
  });

  // Helper function to show form response messages
  function showFormResponse(type, message) {
    formResponse.classList.remove(
      "hidden",
      "bg-green-100",
      "bg-red-100",
      "text-green-800",
      "text-red-800"
    );

    if (type === "success") {
      formResponse.classList.add("bg-green-100", "text-green-800");
      formResponse.innerHTML = `<i class="fas fa-check-circle mr-2"></i> ${message}`;
    } else {
      formResponse.classList.add("bg-red-100", "text-red-800");
      formResponse.innerHTML = `<i class="fas fa-exclamation-circle mr-2"></i> ${message}`;
    }

    // Set focus to the response for screen readers
    formResponse.setAttribute("tabindex", "-1");
    formResponse.focus();

    // Automatically hide the message after 5 seconds
    setTimeout(() => {
      formResponse.classList.add("hidden");
      formResponse.removeAttribute("tabindex");
    }, 5000);
  }
});
