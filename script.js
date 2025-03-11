// Initialize AOS animation library
document.addEventListener('DOMContentLoaded', function() {
  // Initialize AOS animations
  AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true,
    mirror: false
  });

  // Mobile menu toggle functionality
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  
  mobileMenuButton.addEventListener('click', function() {
    const expanded = this.getAttribute('aria-expanded') === 'true';
    this.setAttribute('aria-expanded', !expanded);
    
    if (expanded) {
      mobileMenu.classList.add('mobile-menu-enter');
      mobileMenu.classList.remove('mobile-menu-enter-active');
      
      setTimeout(() => {
        mobileMenu.classList.add('hidden');
      }, 300);
    } else {
      mobileMenu.classList.remove('hidden');
      
      // Force reflow to enable transition
      mobileMenu.offsetWidth;
      
      mobileMenu.classList.add('mobile-menu-enter');
      mobileMenu.classList.add('mobile-menu-enter-active');
    }
  });

  // Smooth scrolling for navigation links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80, // Offset for fixed header
          behavior: 'smooth'
        });
        
        // Close mobile menu if open
        if (!mobileMenu.classList.contains('hidden')) {
          mobileMenuButton.click();
        }
      }
    });
  });

  // Active navigation link highlighting
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.nav-link');
  
  window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 100;
      const sectionHeight = section.clientHeight;
      
      if (pageYOffset >= sectionTop && pageYOffset < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });
    
    navLinks.forEach(link => {
      link.classList.remove('text-secondary');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('text-secondary');
      }
    });
  });

  // Contact form submission handling with animation
  const contactForm = document.getElementById('contactForm');
  
  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Add loading state
    const submitButton = this.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitButton.disabled = true;
    
    // Simulate form submission (replace with actual form handling)
    setTimeout(() => {
      // Success animation
      submitButton.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
      submitButton.classList.remove('bg-primary');
      submitButton.classList.add('bg-green-600');
      
      // Reset form
      contactForm.reset();
      
      // Reset button after delay
      setTimeout(() => {
        submitButton.innerHTML = originalText;
        submitButton.classList.remove('bg-green-600');
        submitButton.classList.add('bg-primary');
        submitButton.disabled = false;
      }, 3000);
    }, 1500);
  });
});