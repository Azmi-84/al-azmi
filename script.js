// Initialize AOS animation library
document.addEventListener("DOMContentLoaded", function () {
  // Initialize AOS animations
  AOS.init({
    duration: 800,
    easing: "ease-in-out",
    once: true,
    mirror: false,
  });

  // Initialize EmailJS
  // Replace with your actual EmailJS public key once you create an account
  emailjs.init("YOUR_PUBLIC_KEY");

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
      // Remove active class from all buttons
      filterButtons.forEach((btn) => {
        btn.classList.remove("active", "bg-primary", "text-white");
        btn.classList.add("bg-gray-200");
      });

      // Add active class to clicked button
      this.classList.add("active", "bg-primary", "text-white");
      this.classList.remove("bg-gray-200");

      const filter = this.getAttribute("data-filter");

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
    });
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

  // Enhanced form submission with better user feedback
  const contactForm = document.getElementById("contactForm");
  const formResponse = document.getElementById("form-response");

  contactForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // Form validation
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const message = document.getElementById("message").value.trim();

    if (!name || !email || !message) {
      showFormResponse("error", "Please fill in all fields");
      return;
    }

    // Email validation using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showFormResponse("error", "Please enter a valid email address");
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

    // Send email using EmailJS
    emailjs.send("service_id", "template_id", templateParams).then(
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

    // Automatically hide the message after 5 seconds
    setTimeout(() => {
      formResponse.classList.add("hidden");
    }, 5000);
  }

  // Add simple dark mode toggle (bonus feature)
  const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

  // Add theme toggle functionality if you want to implement a dark mode toggle button later
  if (prefersDarkScheme.matches) {
    document.body.classList.add("dark-mode");
  }
});
