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
    });
  });
});
