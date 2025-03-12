// Configuration object directly embedded in script.js
const CONFIG = {
  // EmailJS configuration
  emailjs: {
    publicKey: "Uy9y355BvksGDJGhe", // Replace with your actual EmailJS public key
    serviceId: "service_saocigo", // Replace with your EmailJS service ID
    templateId: "template_rr1kng1", // Replace with your EmailJS template ID
  },
};

// Initialize AOS animation library
document.addEventListener("DOMContentLoaded", function () {
  console.log("Document loaded, initializing components...");

  // Initialize AOS animations - moved this right to the top for visibility
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

  // Initialize EmailJS if configured
  try {
    if (CONFIG.emailjs.publicKey !== "YOUR_EMAILJS_PUBLIC_KEY") {
      emailjs.init(CONFIG.emailjs.publicKey);
      console.log("EmailJS initialized");
    } else {
      console.warn(
        "EmailJS not initialized: please set your public key in the CONFIG object"
      );
    }
  } catch (e) {
    console.error("Error initializing EmailJS:", e);
  }

  console.log("Setting up UI interactions...");

  // Mobile menu toggle functionality
  const mobileMenuButton = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu");

  if (mobileMenuButton && mobileMenu) {
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
  } else {
    console.warn("Mobile menu elements not found");
  }

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

  if (sections.length > 0 && navLinks.length > 0) {
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
  }

  // Project filtering functionality
  const filterButtons = document.querySelectorAll(".project-filter");
  const projectCards = document.querySelectorAll(".project-card");

  if (filterButtons.length > 0 && projectCards.length > 0) {
    console.log("Setting up project filtering...");
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
      });
    });
  }

  // Add contact form submission handler
  const contactForm = document.getElementById("contactForm");
  const formResponse = document.getElementById("form-response");

  if (contactForm) {
    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();

      // Get form data
      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const message = document.getElementById("message").value;

      // Prepare template parameters
      const templateParams = {
        from_name: name,
        from_email: email,
        message: message,
      };

      // Show loading state
      formResponse.classList.remove("hidden", "bg-green-100", "bg-red-100");
      formResponse.classList.add("bg-blue-100");
      formResponse.textContent = "Sending your message...";
      formResponse.setAttribute("aria-hidden", "false");

      // Send email using EmailJS
      emailjs
        .send(
          CONFIG.emailjs.serviceId,
          CONFIG.emailjs.templateId,
          templateParams
        )
        .then(
          function () {
            // Success message
            formResponse.classList.remove("bg-blue-100", "bg-red-100");
            formResponse.classList.add("bg-green-100");
            formResponse.textContent =
              "Your message has been sent successfully!";
            contactForm.reset();
          },
          function (error) {
            // Error message
            formResponse.classList.remove("bg-blue-100", "bg-green-100");
            formResponse.classList.add("bg-red-100");
            formResponse.textContent =
              "Sorry, there was an error sending your message. Please try again later.";
            console.error("EmailJS error:", error);
          }
        );
    });
  }

  // Back to top button functionality
  const backToTopButton = document.getElementById("back-to-top");

  if (backToTopButton) {
    window.addEventListener("scroll", function () {
      if (window.pageYOffset > 300) {
        backToTopButton.classList.remove("opacity-0", "invisible");
        backToTopButton.classList.add("opacity-100");
      } else {
        backToTopButton.classList.remove("opacity-100");
        backToTopButton.classList.add("opacity-0", "invisible");
      }
    });

    backToTopButton.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  // Modal functionality for project details
  const projectDetailsBtns = document.querySelectorAll(".project-details-btn");
  const projectModal = document.getElementById("project-modal");
  const closeModal = document.getElementById("close-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalContent = document.getElementById("modal-content");

  // Project details data - could be moved to a JSON file if it grows too large
  const projectDetails = {
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
  };

  if (projectDetailsBtns.length > 0 && projectModal) {
    projectDetailsBtns.forEach((btn) => {
      btn.addEventListener("click", function () {
        // Find the parent project card and get its ID
        const projectCard = this.closest(".project-card");
        const projectId = projectCard.getAttribute("data-project-id");

        // Get project details from our data object
        const project = projectDetails[projectId];

        if (project) {
          // Update modal content
          modalTitle.textContent = project.title;
          modalContent.innerHTML = project.content;

          // Show modal
          projectModal.classList.remove("hidden");
          document.body.style.overflow = "hidden"; // Prevent scrolling

          // Focus on the modal for accessibility
          setTimeout(() => {
            closeModal.focus();
          }, 100);
        }
      });
    });

    // Close modal functionality
    closeModal.addEventListener("click", function () {
      projectModal.classList.add("hidden");
      document.body.style.overflow = ""; // Restore scrolling
    });

    // Close modal on background click
    projectModal.addEventListener("click", function (event) {
      if (event.target === projectModal) {
        closeModal.click();
      }
    });

    // Close modal on ESC key
    document.addEventListener("keydown", function (event) {
      if (
        event.key === "Escape" &&
        !projectModal.classList.contains("hidden")
      ) {
        closeModal.click();
      }
    });
  }

  console.log("Website initialization complete.");
});
