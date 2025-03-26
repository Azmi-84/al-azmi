// Configuration and Constants
const CONFIG = {
  emailjs: {
    publicKey: "Uy9y355BvksGDJGhe",
    serviceId: "service_hp0axth",
    templateId: "template_rr1kng1",
  },
  selectors: {
    mobileMenuButton: "#mobile-menu-button",
    mobileMenu: "#mobile-menu",
    navLinks: ".nav-link",
    sections: "section",
    filterButtons: ".project-filter",
    projectCards: ".project-card",
    contactForm: "#contactForm",
    formResponse: "#form-response",
    projectDetailsBtns: ".project-details-btn",
    projectModal: "#project-modal",
    backToTopButton: "#back-to-top",
    currentYear: "#current-year",
    // New selectors for form validation
    nameInput: "#name",
    emailInput: "#email",
    messageInput: "#message",
    nameError: "#name-error",
    emailError: "#email-error",
    messageError: "#message-error",
    submitButton: "#submit-button",
  },
  validation: {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  scrollOffset: 80,
  animationDelay: 100,
};

// Utility Functions
const utils = {
  smoothScroll(targetElement, offset = CONFIG.scrollOffset) {
    if (!targetElement) return;
    window.scrollTo({
      top: targetElement.offsetTop - offset,
      behavior: "smooth",
    });
  },
  debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  },
  validateEmail(email) {
    return CONFIG.validation.email.test(email);
  },
  setError(element, errorElement, message) {
    element.classList.add("error");
    errorElement.textContent = message;
    errorElement.classList.remove("hidden");
    return false;
  },
  clearError(element, errorElement) {
    element.classList.remove("error");
    errorElement.textContent = "";
    errorElement.classList.add("hidden");
  },
  updateCopyright() {
    const yearElement = document.querySelector(CONFIG.selectors.currentYear);
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
    }
  },
  addIntersectionObserver() {
    // Add intersection observer for fade-in effects
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("animate-fadeIn");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );

      document.querySelectorAll(".project-card, article").forEach((el) => {
        observer.observe(el);
      });
    }
  },
  trapFocus(element) {
    // Get all focusable elements within the element
    const focusableElements = element.querySelectorAll(
      'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Set up event listener to trap focus
    element.addEventListener("keydown", function (e) {
      if (e.key === "Tab") {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    });
  },
};

// Mobile Menu Module - Enhanced with smoother animations
const MobileMenu = {
  init() {
    const menuButton = document.querySelector(
      CONFIG.selectors.mobileMenuButton
    );
    const mobileMenu = document.querySelector(CONFIG.selectors.mobileMenu);
    if (!menuButton || !mobileMenu) {
      console.warn("Mobile menu elements not found");
      return;
    }

    this.menuButton = menuButton;
    this.mobileMenu = mobileMenu;

    menuButton.addEventListener("click", () => this.toggleMenu());

    // Close menu when clicking anywhere else on the page
    document.addEventListener("click", (event) => {
      if (
        !event.target.closest(CONFIG.selectors.mobileMenu) &&
        !event.target.closest(CONFIG.selectors.mobileMenuButton) &&
        !mobileMenu.classList.contains("hidden")
      ) {
        this.closeMenu();
      }
    });

    // Close menu when escape key is pressed
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !mobileMenu.classList.contains("hidden")) {
        this.closeMenu();
      }
    });

    // Close menu when window is resized to desktop size
    window.addEventListener(
      "resize",
      utils.debounce(() => {
        if (
          window.innerWidth >= 768 &&
          !mobileMenu.classList.contains("hidden")
        ) {
          this.closeMenu();
        }
      }, 250)
    );
  },

  toggleMenu() {
    const isExpanded = this.menuButton.getAttribute("aria-expanded") === "true";

    if (isExpanded) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  },

  openMenu() {
    this.menuButton.setAttribute("aria-expanded", "true");
    this.mobileMenu.classList.remove("hidden");

    // Force a reflow to trigger animation
    this.mobileMenu.offsetWidth;

    this.mobileMenu.classList.add(
      "mobile-menu-enter",
      "mobile-menu-enter-active"
    );

    // Set focus on first menu item for accessibility
    setTimeout(() => {
      const firstLink = this.mobileMenu.querySelector("a");
      if (firstLink) firstLink.focus();
    }, 300);
  },

  closeMenu() {
    this.menuButton.setAttribute("aria-expanded", "false");
    this.mobileMenu.classList.remove("mobile-menu-enter-active");
    this.mobileMenu.classList.add(
      "mobile-menu-exit",
      "mobile-menu-exit-active"
    );

    // Return focus to menu button for accessibility
    this.menuButton.focus();

    setTimeout(() => {
      this.mobileMenu.classList.add("hidden");
      this.mobileMenu.classList.remove(
        "mobile-menu-enter",
        "mobile-menu-exit",
        "mobile-menu-exit-active"
      );
    }, 300);
  },
};

// Navigation Module - Enhanced active section tracking
const Navigation = {
  init() {
    this.setupSmoothScroll();
    this.setupActiveNavHighlight();
  },
  setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        const targetId = anchor.getAttribute("href");
        if (targetId === "#") return;

        e.preventDefault();
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
          utils.smoothScroll(targetElement);

          // Update URL hash without jumping
          history.pushState(null, null, targetId);

          // Close mobile menu if open
          const mobileMenu = document.querySelector(
            CONFIG.selectors.mobileMenu
          );
          const mobileMenuButton = document.querySelector(
            CONFIG.selectors.mobileMenuButton
          );

          if (
            mobileMenu &&
            !mobileMenu.classList.contains("hidden") &&
            mobileMenuButton
          ) {
            const menuInstance = MobileMenu;
            menuInstance.closeMenu();
          }
        }
      });
    });
  },
  setupActiveNavHighlight() {
    const sections = document.querySelectorAll(CONFIG.selectors.sections);
    const navLinks = document.querySelectorAll(CONFIG.selectors.navLinks);

    if (sections.length === 0 || navLinks.length === 0) return;

    // Set initial active section on page load
    this.updateActiveSection(sections, navLinks);

    // More efficient scroll handling with IntersectionObserver
    if ("IntersectionObserver" in window) {
      const navObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const id = entry.target.getAttribute("id");
              this.setActiveLink(navLinks, id);
            }
          });
        },
        {
          rootMargin: "-20% 0% -80% 0%",
          threshold: 0.1,
        }
      );

      sections.forEach((section) => {
        navObserver.observe(section);
      });
    } else {
      // Fallback for browsers without IntersectionObserver
      const scrollHandler = utils.debounce(() => {
        this.updateActiveSection(sections, navLinks);
      }, CONFIG.animationDelay);

      window.addEventListener("scroll", scrollHandler);
    }
  },
  updateActiveSection(sections, navLinks) {
    let current = "";

    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 100;
      const sectionHeight = section.clientHeight;

      if (
        window.pageYOffset >= sectionTop &&
        window.pageYOffset < sectionTop + sectionHeight
      ) {
        current = section.getAttribute("id");
      }
    });

    this.setActiveLink(navLinks, current);
  },
  setActiveLink(navLinks, currentId) {
    navLinks.forEach((link) => {
      link.classList.remove("text-secondary");
      const href = link.getAttribute("href");

      // Handle both '#id' and 'page.html#id' formats
      if (
        href === `#${currentId}` ||
        (href.indexOf("#") > 0 && href.endsWith(`#${currentId}`))
      ) {
        link.classList.add("text-secondary");
      }
    });
  },
};

// Project Filtering Module - Improved animation and accessibility
const ProjectFilter = {
  init() {
    const filterButtons = document.querySelectorAll(
      CONFIG.selectors.filterButtons
    );
    const projectCards = document.querySelectorAll(
      CONFIG.selectors.projectCards
    );

    if (filterButtons.length === 0 || projectCards.length === 0) return;

    // Set default filter
    const defaultFilter = "all";
    const defaultButton = document.querySelector(
      `[data-filter="${defaultFilter}"]`
    );

    if (defaultButton) {
      this.filterProjects(defaultButton, projectCards);
    }

    filterButtons.forEach((button) => {
      button.addEventListener("click", () =>
        this.filterProjects(button, projectCards)
      );

      // Keyboard accessibility
      button.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.filterProjects(button, projectCards);
        }
      });
    });
  },
  filterProjects(activeButton, projectCards) {
    const filter = activeButton.getAttribute("data-filter");

    // Reset all filter buttons
    document.querySelectorAll(CONFIG.selectors.filterButtons).forEach((btn) => {
      btn.classList.remove("active", "bg-primary", "text-white");
      btn.classList.add("bg-gray-200");
      btn.setAttribute("aria-selected", "false");
    });

    // Activate current button
    activeButton.classList.add("active", "bg-primary", "text-white");
    activeButton.classList.remove("bg-gray-200");
    activeButton.setAttribute("aria-selected", "true");

    // Announce filter change for screen readers
    const srAnnounce =
      document.getElementById("sr-announce") ||
      (() => {
        const el = document.createElement("div");
        el.id = "sr-announce";
        el.setAttribute("aria-live", "polite");
        el.classList.add("sr-only");
        document.body.appendChild(el);
        return el;
      })();
    srAnnounce.textContent = `Showing ${
      filter === "all" ? "all" : filter
    } projects`;

    // Filter projects with staggered animations
    let delay = 0;
    projectCards.forEach((card) => {
      const categories = card.getAttribute("data-category").split(" ");

      if (filter === "all" || categories.includes(filter)) {
        setTimeout(() => this.showCard(card), delay);
        delay += 50; // Stagger the animations
      } else {
        this.hideCard(card);
      }
    });
  },
  showCard(card) {
    card.style.display = "block";

    // Force a reflow to trigger animation
    card.offsetWidth;

    card.classList.remove("opacity-0", "scale-95");
    card.classList.add(
      "opacity-100",
      "scale-100",
      "transition-all",
      "duration-300",
      "ease-out"
    );
    card.setAttribute("aria-hidden", "false");
  },
  hideCard(card) {
    card.classList.remove("opacity-100", "scale-100");
    card.classList.add(
      "opacity-0",
      "scale-95",
      "transition-all",
      "duration-300",
      "ease-in"
    );
    card.setAttribute("aria-hidden", "true");

    setTimeout(() => {
      card.style.display = "none";
    }, 300);
  },
};

// Email Submission Module - Enhanced validation and error handling
const EmailSubmission = {
  init() {
    const contactForm = document.querySelector(CONFIG.selectors.contactForm);
    const formResponse = document.querySelector(CONFIG.selectors.formResponse);
    const nameInput = document.querySelector(CONFIG.selectors.nameInput);
    const emailInput = document.querySelector(CONFIG.selectors.emailInput);
    const messageInput = document.querySelector(CONFIG.selectors.messageInput);
    const nameError = document.querySelector(CONFIG.selectors.nameError);
    const emailError = document.querySelector(CONFIG.selectors.emailError);
    const messageError = document.querySelector(CONFIG.selectors.messageError);
    const submitButton = document.querySelector(CONFIG.selectors.submitButton);

    if (!contactForm || !formResponse) return;

    // Initialize EmailJS
    const emailJSInitialized = this.initEmailJS();

    // Store references for use in methods
    this.elements = {
      form: contactForm,
      response: formResponse,
      name: nameInput,
      email: emailInput,
      message: messageInput,
      nameError,
      emailError,
      messageError,
      submitButton,
    };

    // Setup input validation on blur
    if (nameInput && nameError) {
      nameInput.addEventListener("blur", () => this.validateName());
    }

    if (emailInput && emailError) {
      emailInput.addEventListener("blur", () => this.validateEmail());
    }

    if (messageInput && messageError) {
      messageInput.addEventListener("blur", () => this.validateMessage());
    }

    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();

      // Validate all fields
      const nameValid = this.validateName();
      const emailValid = this.validateEmail();
      const messageValid = this.validateMessage();

      if (!nameValid || !emailValid || !messageValid) {
        return;
      }

      // Check if EmailJS is properly initialized before attempting submission
      if (!emailJSInitialized && typeof emailjs === "undefined") {
        this.showErrorMessage(
          formResponse,
          "Email service is not properly configured. Please try contacting directly via email."
        );
        return;
      }

      this.submitForm();
    });
  },
  validateName() {
    const { name, nameError } = this.elements;
    if (!name || !nameError) return true;

    if (!name.value.trim()) {
      return utils.setError(name, nameError, "Please enter your name");
    }

    utils.clearError(name, nameError);
    return true;
  },
  validateEmail() {
    const { email, emailError } = this.elements;
    if (!email || !emailError) return true;

    if (!email.value.trim()) {
      return utils.setError(
        email,
        emailError,
        "Please enter your email address"
      );
    }

    if (!utils.validateEmail(email.value.trim())) {
      return utils.setError(
        email,
        emailError,
        "Please enter a valid email address"
      );
    }

    utils.clearError(email, emailError);
    return true;
  },
  validateMessage() {
    const { message, messageError } = this.elements;
    if (!message || !messageError) return true;

    if (!message.value.trim()) {
      return utils.setError(message, messageError, "Please enter your message");
    }

    if (message.value.trim().length < 10) {
      return utils.setError(message, messageError, "Your message is too short");
    }

    utils.clearError(message, messageError);
    return true;
  },
  initEmailJS() {
    try {
      // Only check if a public key exists
      if (!CONFIG.emailjs.publicKey) {
        console.error(
          "EmailJS not configured: Please add a public key in the CONFIG object"
        );
        return false;
      }

      if (typeof emailjs === "undefined") {
        console.error(
          "EmailJS library not loaded. Make sure to include the EmailJS script."
        );
        return false;
      }

      // Use the self-executing function pattern as per EmailJS docs
      (function () {
        emailjs.init({
          publicKey: CONFIG.emailjs.publicKey,
        });
      })();

      console.log("EmailJS initialized successfully");
      return true;
    } catch (error) {
      console.error("EmailJS initialization error:", error);
      return false;
    }
  },
  submitForm() {
    const { form, response, name, email, message, submitButton } =
      this.elements;

    const templateParams = {
      from_name: name.value,
      from_email: email.value,
      message: message.value,
    };

    this.showLoadingState(response, submitButton);

    emailjs
      .send(CONFIG.emailjs.serviceId, CONFIG.emailjs.templateId, templateParams)
      .then(() => {
        this.showSuccessMessage(response, submitButton);
        form.reset();

        // Reset all error states
        if (this.elements.nameError)
          utils.clearError(name, this.elements.nameError);
        if (this.elements.emailError)
          utils.clearError(email, this.elements.emailError);
        if (this.elements.messageError)
          utils.clearError(message, this.elements.messageError);
      })
      .catch((error) => {
        this.handleSubmissionError(response, error, submitButton);
      });
  },
  showLoadingState(responseElement, submitButton) {
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML =
        '<i class="fas fa-spinner fa-spin mr-2"></i> Sending...';
    }

    responseElement.classList.remove("hidden", "bg-green-100", "bg-red-100");
    responseElement.classList.add("my-4", "p-4", "rounded-md", "bg-blue-100");
    responseElement.innerHTML =
      '<i class="fas fa-info-circle mr-2"></i> Sending your message...';
    responseElement.setAttribute("aria-hidden", "false");
  },
  showSuccessMessage(responseElement, submitButton) {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Send Message";
    }

    responseElement.classList.remove("bg-blue-100", "bg-red-100");
    responseElement.classList.add("my-4", "p-4", "rounded-md", "bg-green-100");
    responseElement.innerHTML =
      '<i class="fas fa-check-circle mr-2"></i> Your message has been sent successfully!';
  },
  showErrorMessage(responseElement, message, submitButton) {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Send Message";
    }

    responseElement.classList.remove("bg-blue-100", "bg-green-100", "hidden");
    responseElement.classList.add("my-4", "p-4", "rounded-md", "bg-red-100");
    responseElement.innerHTML = `<i class="fas fa-exclamation-circle mr-2"></i> ${message}`;
    responseElement.setAttribute("aria-hidden", "false");
  },
  handleSubmissionError(responseElement, error, submitButton) {
    console.error("EmailJS error:", error);

    // More detailed error handling
    const errorMessages = {
      400: "Configuration error: The EmailJS Public Key is invalid. Please update your configuration.",
      401: "Authentication error: Please check your EmailJS credentials.",
      403: "Service authentication failed. Please contact support.",
      404: "The specified EmailJS template or service was not found.",
      429: "Too many requests. Please try again later.",
      500: "EmailJS server error. Please try again later.",
      default:
        "Sorry, there was an error sending your message. Please try again later or contact directly via email.",
    };

    const errorMessage = errorMessages[error.status] || errorMessages.default;
    this.showErrorMessage(responseElement, errorMessage, submitButton);

    // Show direct email as fallback when service fails
    if (error.status === 400 || error.status === 401 || error.status === 403) {
      const directEmail = document.createElement("p");
      directEmail.className = "mt-2 text-sm";
      directEmail.innerHTML =
        'Please email me directly at <a href="mailto:azmi@iut-dhaka.edu" class="text-primary underline">azmi@iut-dhaka.edu</a>';
      responseElement.appendChild(directEmail);
    }
  },
};

// Back to Top Button Module - Enhanced behavior
const BackToTopButton = {
  init() {
    const backToTopButton = document.querySelector(
      CONFIG.selectors.backToTopButton
    );
    if (!backToTopButton) return;

    this.button = backToTopButton;

    // Initial visibility check
    this.toggleVisibility();

    window.addEventListener(
      "scroll",
      utils.debounce(() => {
        this.toggleVisibility();
      }, 100)
    );

    backToTopButton.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      // Focus on the first focusable element at the top for accessibility
      setTimeout(() => {
        const firstFocusable = document.querySelector(
          "a[href], button, input, select, textarea"
        );
        if (firstFocusable) firstFocusable.focus();
      }, 1000);
    });
  },
  toggleVisibility() {
    if (window.pageYOffset > 300) {
      this.button.classList.remove("opacity-0", "invisible");
      this.button.classList.add("opacity-100");
    } else {
      this.button.classList.remove("opacity-100");
      this.button.classList.add("opacity-0");

      // Use a separate timeout to add invisible class to prevent tabbing to the hidden button
      setTimeout(() => {
        if (window.pageYOffset <= 300) {
          this.button.classList.add("invisible");
        }
      }, 300);
    }
  },
};

// Project Modal Module - Enhanced accessibility and focus management
const ProjectModal = {
  // Using the original project details to maintain consistency
  projectDetails: {
    project1: {
      title: "Material Microstructure Analysis",
      content: `
        <div class="space-y-4">
          <p>This project uses computer vision techniques to analyze material microstructures and predict their properties, helping researchers quickly understand material characteristics without extensive physical testing.</p>
          
          <h4 class="text-lg font-semibold">Technologies Used:</h4>
          <ul class="list-disc pl-5 space-y-1">
            <li>Python with NumPy, Pandas, and SciPy</li>
            <li>TensorFlow and Keras for deep learning models</li>
            <li>OpenCV for image processing and feature extraction</li>
            <li>Matplotlib and Seaborn for visualization</li>
          </ul>
          
          <h4 class="text-lg font-semibold">Key Features:</h4>
          <ul class="list-disc pl-5 space-y-1">
            <li>Automated microstructure segmentation</li>
            <li>Feature extraction from material images</li>
            <li>Correlation of visual features with physical properties</li>
            <li>Interactive visualization of results</li>
          </ul>
          
          <h4 class="text-lg font-semibold">Research Impact:</h4>
          <p>This tool significantly reduces the time needed to characterize new materials, accelerating materials science research and development cycles.</p>
        </div>
      `,
    },
    project2: {
      title: "Marimo Notebook Implementation",
      content: `
        <div class="space-y-4">
          <p>As a Marimo Ambassador, I developed a complete implementation of Recurrent Neural Networks (RNN) from scratch using the Marimo notebook environment, showcasing both the power of Marimo for scientific computing and the underlying mathematics of RNNs.</p>
          
          <h4 class="text-lg font-semibold">Technologies Used:</h4>
          <ul class="list-disc pl-5 space-y-1">
            <li>Marimo interactive notebook environment</li>
            <li>Python with NumPy for numerical computations</li>
            <li>Custom RNN implementation without using deep learning frameworks</li>
            <li>Interactive data visualizations</li>
          </ul>
          
          <h4 class="text-lg font-semibold">Key Features:</h4>
          <ul class="list-disc pl-5 space-y-1">
            <li>Interactive explanations of RNN mathematics</li>
            <li>Step-by-step implementation with visualizations</li>
            <li>Time-series prediction demonstrations</li>
            <li>Performance comparisons with framework implementations</li>
          </ul>
          
          <h4 class="text-lg font-semibold">Educational Value:</h4>
          <p>This notebook serves as both a learning resource for students and a demonstration of Marimo's capabilities for scientific and educational computing.</p>
        </div>
      `,
    },
    project3: {
      title: "Mechanical Component Optimization",
      content: `
        <div class="space-y-4">
          <p>This project combines mechanical engineering principles with machine learning to optimize component designs for specific performance criteria while minimizing material usage and manufacturing costs.</p>
          
          <h4 class="text-lg font-semibold">Technologies Used:</h4>
          <ul class="list-disc pl-5 space-y-1">
            <li>MATLAB for simulation and algorithm implementation</li>
            <li>Finite Element Analysis (FEA) for stress and strain modeling</li>
            <li>Genetic algorithms for optimization</li>
            <li>CAD integration for design validation</li>
          </ul>
          
          <h4 class="text-lg font-semibold">Key Features:</h4>
          <ul class="list-disc pl-5 space-y-1">
            <li>Parametric design model generation</li>
            <li>Multi-objective optimization framework</li>
            <li>Automated FEA simulation and result analysis</li>
            <li>Material selection recommendations</li>
          </ul>
          
          <h4 class="text-lg font-semibold">Engineering Applications:</h4>
          <p>This tool has been successfully applied to optimize structural components, reducing material usage by 22% while maintaining required performance specifications.</p>
        </div>
      `,
    },
  },

  init() {
    const projectDetailsBtns = document.querySelectorAll(
      CONFIG.selectors.projectDetailsBtns
    );
    const projectModal = document.querySelector(CONFIG.selectors.projectModal);

    if (!projectModal || projectDetailsBtns.length === 0) return;

    this.modal = projectModal;
    this.currentFocus = null; // To restore focus when modal closes

    this.setupModalEvents(projectDetailsBtns, projectModal);

    // Add keyboard trap inside modal for better accessibility
    utils.trapFocus(projectModal);
  },

  setupModalEvents(buttons, modal) {
    const closeModal = modal.querySelector("#close-modal");
    const modalTitle = modal.querySelector("#modal-title");
    const modalContent = modal.querySelector("#modal-content");

    buttons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const projectCard = btn.closest(".project-card");
        const projectId = projectCard.getAttribute("data-project-id");
        const project = this.projectDetails[projectId];

        if (project) {
          this.currentFocus = e.target; // Store current focus
          this.openModal(modal, modalTitle, modalContent, project);
        }
      });
    });

    closeModal.addEventListener("click", () => this.closeModal(modal));

    modal.addEventListener("click", (event) => {
      if (event.target === modal) this.closeModal(modal);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.classList.contains("hidden")) {
        this.closeModal(modal);
      }
    });
  },

  openModal(modal, titleEl, contentEl, project) {
    titleEl.textContent = project.title;
    contentEl.innerHTML = project.content;

    document.body.style.overflow = "hidden";
    modal.classList.remove("hidden");

    // Add animation class
    modal.classList.add("animate-fadeIn");

    // Focus on the close button for accessibility
    setTimeout(() => {
      const closeButton = modal.querySelector("#close-modal");
      if (closeButton) {
        closeButton.focus();
      }
    }, 100);
  },

  closeModal(modal) {
    document.body.style.overflow = "";

    // Add fade-out animation class
    modal.classList.add("animate-fadeOut");

    setTimeout(() => {
      modal.classList.remove("animate-fadeIn", "animate-fadeOut");
      modal.classList.add("hidden");

      // Restore focus to the element that opened the modal
      if (this.currentFocus && typeof this.currentFocus.focus === "function") {
        this.currentFocus.focus();
      }
    }, 300);
  },
};

// AOS Animation Initialization - More robust error handling
const AOSInitializer = {
  init() {
    if (typeof AOS !== "undefined") {
      console.log("AOS available, initializing...");
      try {
        AOS.init({
          duration: 800,
          easing: "ease-in-out",
          once: true,
          mirror: false,
          disable: "mobile", // Disable on mobile for better performance
          anchorPlacement: "top-bottom",
        });
      } catch (e) {
        console.error("Error initializing AOS:", e);
      }
    } else {
      console.warn(
        "AOS is not defined! Animations will not work. Check if the AOS script is loading correctly."
      );

      // Fallback for when AOS is not available
      utils.addIntersectionObserver();
    }
  },
};

// Main Initialization
document.addEventListener("DOMContentLoaded", () => {
  console.log("Document loaded, initializing components...");

  try {
    // Update copyright year
    utils.updateCopyright();

    // Initialize all modules
    AOSInitializer.init();
    MobileMenu.init();
    Navigation.init();
    ProjectFilter.init();
    EmailSubmission.init();
    BackToTopButton.init();
    ProjectModal.init();

    console.log("Website initialization complete.");

    // Check for hash in URL and scroll to it after initialization
    if (window.location.hash) {
      setTimeout(() => {
        const targetElement = document.querySelector(window.location.hash);
        if (targetElement) {
          utils.smoothScroll(targetElement);
        }
      }, 500);
    }
  } catch (error) {
    console.error("Error during initialization:", error);
  }
});

// Handle page visibility change for better performance
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    // Re-initialize AOS when page becomes visible again
    if (typeof AOS !== "undefined") {
      AOS.refresh();
    }
  }
});
