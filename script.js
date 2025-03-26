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
  },
};

// Utility Functions
const utils = {
  smoothScroll(targetElement, offset = 80) {
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
};

// Mobile Menu Module
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

    menuButton.addEventListener("click", () => {
      const isExpanded = menuButton.getAttribute("aria-expanded") === "true";

      menuButton.setAttribute("aria-expanded", !isExpanded);

      if (isExpanded) {
        this.closeMenu(mobileMenu);
      } else {
        this.openMenu(mobileMenu);
      }
    });
  },

  openMenu(menu) {
    menu.classList.remove("hidden");
    menu.offsetWidth; // Force reflow
    menu.classList.add("mobile-menu-enter", "mobile-menu-enter-active");
  },

  closeMenu(menu) {
    // Don't add mobile-menu-enter if it might already be there
    menu.classList.remove("mobile-menu-enter-active");

    setTimeout(() => {
      menu.classList.add("hidden");
    }, 300);
  },
};

// Navigation Module
const Navigation = {
  init() {
    this.setupSmoothScroll();
    this.setupActiveNavHighlight();
  },

  setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = anchor.getAttribute("href");

        if (targetId === "#") return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          utils.smoothScroll(targetElement);

          // Close mobile menu if open
          const mobileMenu = document.querySelector(
            CONFIG.selectors.mobileMenu
          );
          const mobileMenuButton = document.querySelector(
            CONFIG.selectors.mobileMenuButton
          );
          if (mobileMenu && !mobileMenu.classList.contains("hidden")) {
            mobileMenuButton.click();
          }
        }
      });
    });
  },

  setupActiveNavHighlight() {
    const sections = document.querySelectorAll(CONFIG.selectors.sections);
    const navLinks = document.querySelectorAll(CONFIG.selectors.navLinks);

    if (sections.length === 0 || navLinks.length === 0) return;

    const scrollHandler = utils.debounce(() => {
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

      navLinks.forEach((link) => {
        link.classList.remove("text-secondary");
        if (link.getAttribute("href") === `#${current}`) {
          link.classList.add("text-secondary");
        }
      });
    }, 100);

    window.addEventListener("scroll", scrollHandler);
  },
};

// Project Filtering Module
const ProjectFilter = {
  init() {
    const filterButtons = document.querySelectorAll(
      CONFIG.selectors.filterButtons
    );
    const projectCards = document.querySelectorAll(
      CONFIG.selectors.projectCards
    );

    if (filterButtons.length === 0 || projectCards.length === 0) return;

    filterButtons.forEach((button) => {
      button.addEventListener("click", () =>
        this.filterProjects(button, projectCards)
      );
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

    // Filter projects
    projectCards.forEach((card) => {
      const categories = card.getAttribute("data-category").split(" ");

      if (filter === "all" || categories.includes(filter)) {
        this.showCard(card);
      } else {
        this.hideCard(card);
      }
    });
  },

  showCard(card) {
    card.style.display = "block";
    setTimeout(() => {
      card.classList.remove("opacity-0", "scale-95");
      card.classList.add("opacity-100", "scale-100");
    }, 50);
  },

  hideCard(card) {
    card.classList.remove("opacity-100", "scale-100");
    card.classList.add("opacity-0", "scale-95");
    setTimeout(() => {
      card.style.display = "none";
    }, 300);
  },
};

// Email Submission Module
const EmailSubmission = {
  init() {
    const contactForm = document.querySelector(CONFIG.selectors.contactForm);
    const formResponse = document.querySelector(CONFIG.selectors.formResponse);

    if (!contactForm || !formResponse) return;

    // Initialize EmailJS
    const emailJSInitialized = this.initEmailJS();

    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();

      // Check if EmailJS is properly initialized before attempting submission
      if (!emailJSInitialized && typeof emailjs === "undefined") {
        this.showErrorMessage(
          formResponse,
          "Email service is not properly configured. Please try contacting directly via email."
        );
        return;
      }

      this.submitForm(contactForm, formResponse);
    });
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

      emailjs.init({
        publicKey: CONFIG.emailjs.publicKey,
      });
      console.log("EmailJS initialized successfully");
      return true;
    } catch (error) {
      console.error("EmailJS initialization error:", error);
      return false;
    }
  },

  submitForm(form, responseElement) {
    const name = form.querySelector("#name");
    const email = form.querySelector("#email");
    const message = form.querySelector("#message");

    if (!this.validateForm(name, email, message)) {
      this.showErrorMessage(responseElement, "Please fill out all fields.");
      return;
    }

    const templateParams = {
      from_name: name.value,
      from_email: email.value,
      message: message.value,
    };

    this.showLoadingState(responseElement);

    emailjs
      .send(CONFIG.emailjs.serviceId, CONFIG.emailjs.templateId, templateParams)
      .then(() => {
        this.showSuccessMessage(responseElement);
        form.reset();
      })
      .catch((error) => {
        this.handleSubmissionError(responseElement, error);
      });
  },

  validateForm(name, email, message) {
    return name.value.trim() && email.value.trim() && message.value.trim();
  },

  showLoadingState(responseElement) {
    responseElement.classList.remove("hidden", "bg-green-100", "bg-red-100");
    responseElement.classList.add("my-4", "p-4", "rounded-md", "bg-blue-100");
    responseElement.textContent = "Sending your message...";
    responseElement.setAttribute("aria-hidden", "false");
  },

  showSuccessMessage(responseElement) {
    responseElement.classList.remove("bg-blue-100", "bg-red-100");
    responseElement.classList.add("my-4", "p-4", "rounded-md", "bg-green-100");
    responseElement.textContent = "Your message has been sent successfully!";
  },

  showErrorMessage(responseElement, message) {
    responseElement.classList.remove("bg-blue-100", "bg-green-100");
    responseElement.classList.add("my-4", "p-4", "rounded-md", "bg-red-100");
    responseElement.classList.remove("hidden");
    responseElement.textContent = message;
    responseElement.setAttribute("aria-hidden", "false");
  },

  handleSubmissionError(responseElement, error) {
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
    this.showErrorMessage(responseElement, errorMessage);

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

// Back to Top Button Module
const BackToTopButton = {
  init() {
    const backToTopButton = document.querySelector(
      CONFIG.selectors.backToTopButton
    );
    if (!backToTopButton) return;

    window.addEventListener(
      "scroll",
      utils.debounce(() => {
        this.toggleVisibility(backToTopButton);
      }, 100)
    );

    backToTopButton.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  },

  toggleVisibility(button) {
    if (window.pageYOffset > 300) {
      button.classList.remove("opacity-0", "invisible");
      button.classList.add("opacity-100");
    } else {
      button.classList.remove("opacity-100");
      button.classList.add("opacity-0", "invisible");
    }
  },
};

// Project Modal Module
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

    this.setupModalEvents(projectDetailsBtns, projectModal);
  },

  setupModalEvents(buttons, modal) {
    const closeModal = modal.querySelector("#close-modal");
    const modalTitle = modal.querySelector("#modal-title");
    const modalContent = modal.querySelector("#modal-content");

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const projectCard = btn.closest(".project-card");
        const projectId = projectCard.getAttribute("data-project-id");
        const project = this.projectDetails[projectId];

        if (project) {
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
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    // Focus on the close button for accessibility with error handling
    setTimeout(() => {
      const closeButton = modal.querySelector("#close-modal");
      if (closeButton) {
        closeButton.focus();
      }
    }, 100);
  },

  closeModal(modal) {
    modal.classList.add("hidden");
    document.body.style.overflow = "";
  },
};

// AOS Animation Initialization
const AOSInitializer = {
  init() {
    if (typeof AOS !== "undefined") {
      console.log("AOS available, initializing...");
      AOS.init({
        duration: 800,
        easing: "ease-in-out",
        once: true,
        mirror: false,
      });
    } else {
      console.error(
        "AOS is not defined! Check if the AOS script is loading correctly."
      );
    }
  },
};

// Main Initialization
document.addEventListener("DOMContentLoaded", () => {
  console.log("Document loaded, initializing components...");

  AOSInitializer.init();
  MobileMenu.init();
  Navigation.init();
  ProjectFilter.init();
  EmailSubmission.init();
  BackToTopButton.init();
  ProjectModal.init();

  console.log("Website initialization complete.");
});
