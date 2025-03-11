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

  // Contact form submission handling with actual email sending
  const contactForm = document.getElementById("contactForm");

  contactForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // Add loading state
    const submitButton = this.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitButton.disabled = true;

    // Get form data
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const message = document.getElementById("message").value;

    // Prepare template parameters for EmailJS
    const templateParams = {
      name: name,
      email: email,
      message: message,
    };

    // Send email using EmailJS
    // Replace with your actual service ID and template ID
    emailjs.send("service_id", "template_id", templateParams).then(
      function (response) {
        console.log("SUCCESS!", response.status, response.text);

        // Success animation
        submitButton.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
        submitButton.classList.remove("bg-primary");
        submitButton.classList.add("bg-green-600");

        // Reset form
        contactForm.reset();

        // Reset button after delay
        setTimeout(() => {
          submitButton.innerHTML = originalText;
          submitButton.classList.remove("bg-green-600");
          submitButton.classList.add("bg-primary");
          submitButton.disabled = false;
        }, 3000);
      },
      function (error) {
        console.log("FAILED...", error);

        // Error feedback
        submitButton.innerHTML =
          '<i class="fas fa-exclamation-circle"></i> Failed to Send';
        submitButton.classList.remove("bg-primary");
        submitButton.classList.add("bg-red-600");

        // Reset button after delay
        setTimeout(() => {
          submitButton.innerHTML = originalText;
          submitButton.classList.remove("bg-red-600");
          submitButton.classList.add("bg-primary");
          submitButton.disabled = false;
        }, 3000);
      }
    );
  });
});
