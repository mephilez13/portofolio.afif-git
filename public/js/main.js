/* ============================================
   PORTFOLIO JS - Muhammad Afif Alfarizi
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // ----- Load Portfolio Data -----
  loadPortfolioData();

  // ----- Preloader -----
  window.addEventListener('load', () => {
    setTimeout(() => {
      document.getElementById('preloader').classList.add('hidden');
    }, 800);
  });

  // ----- Navbar Scroll Effect -----
  const navbar = document.getElementById('navbar');
  const backToTop = document.getElementById('back-to-top');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 80) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Back to top visibility
    if (window.scrollY > 500) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }

    // Active nav link based on scroll position
    updateActiveNavLink();
  });

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ----- Mobile Menu Toggle -----
  const navToggle = document.getElementById('navbar-toggle');
  const navMenu = document.getElementById('navbar-menu');

  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
  });

  // Close menu on link click
  navMenu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('active');
      navMenu.classList.remove('active');
    });
  });

  // ----- Scroll Reveal -----
  initScrollReveal();

  // ----- Contact Form -----
  initContactForm();
});

// ============================================
// Load Portfolio Data from API
// ============================================
async function loadPortfolioData() {
  try {
    const response = await fetch('/api/portfolio');
    const data = await response.json();

    renderHero(data.hero, data.contact);
    renderSkillsMarquee(data.skills);
    renderServices(data.services);
    renderAbout(data.about);
    renderProjects(data.projects);
    renderTestimonials(data.testimonials);
    renderContact(data.contact);
    renderFooter(data.contact, data.siteInfo);

    // Re-init scroll reveal after rendering
    setTimeout(initScrollReveal, 100);
  } catch (error) {
    console.error('Error loading portfolio data:', error);
  }
}

// ============================================
// Render Functions
// ============================================
function renderHero(hero, contact) {
  if (!hero) return;

  if (hero.greeting) {
    document.querySelector('.greeting-text').textContent = hero.greeting;
  }
  if (hero.name) {
    document.getElementById('hero-name').textContent = hero.name + ',';
  }
  if (hero.title) {
    document.getElementById('hero-title').textContent = hero.title;
  }
  if (hero.titleHighlight) {
    document.getElementById('hero-highlight').textContent = hero.titleHighlight;
  }
  if (hero.description) {
    document.getElementById('hero-description').textContent = hero.description;
  }
  if (hero.profileImage) {
    const container = document.getElementById('hero-image-container');
    container.innerHTML = `<img src="${hero.profileImage}" alt="${hero.name || 'Profile'}" loading="lazy">`;
  }

  // WhatsApp link
  if (contact && contact.whatsapp) {
    document.getElementById('hero-whatsapp-btn').href = `https://wa.me/${contact.whatsapp}`;
  }
}

function renderSkillsMarquee(skills) {
  const marqueeContent = document.getElementById('marquee-content');
  if (!skills || skills.length === 0) return;

  let html = '';
  // Duplicate for seamless loop
  for (let i = 0; i < 3; i++) {
    skills.forEach(skill => {
      html += `<div class="marquee-item">
        <span>${skill.name}</span>
        <span class="separator">✦</span>
      </div>`;
    });
  }
  marqueeContent.innerHTML = html;
}

function renderServices(services) {
  const grid = document.getElementById('services-grid');
  if (!services || services.length === 0) return;

  const iconMap = {
    strategy: 'fas fa-chess',
    content: 'fas fa-pen-fancy',
    illustration: 'fas fa-paint-brush',
    brand: 'fas fa-palette',
    star: 'fas fa-star',
    marketing: 'fas fa-bullhorn',
    design: 'fas fa-object-group',
    social: 'fas fa-share-alt'
  };

  grid.innerHTML = services.map((service, index) => `
    <div class="service-card reveal" style="transition-delay: ${index * 0.1}s">
      <span class="service-number">0${index + 1}</span>
      <div class="service-icon">
        <i class="${iconMap[service.icon] || 'fas fa-star'}"></i>
      </div>
      <h3>${service.title}</h3>
      <p>${service.description}</p>
    </div>
  `).join('');
}

function renderAbout(about) {
  if (!about) return;

  if (about.bio) {
    document.getElementById('about-bio').textContent = about.bio;
  }
  if (about.image) {
    const aboutImage = document.getElementById('about-image');
    aboutImage.innerHTML = `<img src="${about.image}" alt="About Me" loading="lazy">`;
  }

  // Stats
  const statsContainer = document.getElementById('about-stats');
  const years = about.yearsExperience || '3+';
  const projects = about.projectsCompleted || '50+';
  const clients = about.happyClients || '30+';

  statsContainer.innerHTML = `
    <div class="stat-item">
      <span class="stat-number" data-target="${parseInt(projects)}">${parseInt(projects)}</span>
      <span class="stat-plus">+</span>
      <span class="stat-label">Projects Completed</span>
    </div>
    <div class="stat-item">
      <span class="stat-number" data-target="${parseInt(clients)}">${parseInt(clients)}</span>
      <span class="stat-plus">+</span>
      <span class="stat-label">Happy Clients</span>
    </div>
    <div class="stat-item">
      <span class="stat-number" data-target="${parseInt(years)}">${parseInt(years)}</span>
      <span class="stat-plus">+</span>
      <span class="stat-label">Years Experience</span>
    </div>
  `;

  // Experience badge
  const expBadge = document.getElementById('about-experience-badge');
  expBadge.querySelector('.exp-number').textContent = years;

  // Init counter animation
  initCounterAnimation();
}

function renderProjects(projects) {
  const grid = document.getElementById('projects-grid');
  if (!projects || projects.length === 0) return;

  // Build filter categories
  const categories = [...new Set(projects.map(p => p.category))];
  const filterContainer = document.getElementById('projects-filter');
  filterContainer.innerHTML = `
    <button class="filter-btn active" data-filter="all">All</button>
    ${categories.map(cat => `<button class="filter-btn" data-filter="${cat}">${cat.charAt(0).toUpperCase() + cat.slice(1)}</button>`).join('')}
  `;

  // Render project cards
    grid.innerHTML = projects.map((project, index) => `
      <div class="project-card reveal" data-category="${project.category}" style="transition-delay: ${index * 0.1}s">
        <div class="project-image">
          ${project.image
            ? `<img src="${project.image}" alt="${project.title}" loading="lazy">`
            : `<div class="project-image-placeholder"><i class="${project.category === 'illustration' ? 'fas fa-paint-brush' : 'fas fa-bullhorn'}"></i></div>`
          }
          <a href="/project.html?id=${project.id}" class="project-overlay">
            <span class="project-overlay-btn"><i class="fas fa-eye"></i></span>
          </a>
        </div>
        <div class="project-body" onclick="window.location.href='/project.html?id=${project.id}'" style="cursor: pointer;">
          <span class="project-category">${project.category}</span>
          <h3><a href="/project.html?id=${project.id}">${project.title}</a></h3>
          <p>${project.description}</p>
        </div>
      </div>
    `).join('');

  // Filter functionality
  initProjectFilter();
}

function renderTestimonials(testimonials) {
  if (!testimonials || testimonials.length === 0) return;

  const track = document.getElementById('testimonials-track');
  const dotsContainer = document.getElementById('testi-dots');

  track.innerHTML = testimonials.map((t, index) => `
    <div class="testimonial-card ${index === 0 ? 'active' : ''}" data-index="${index}">
      <div class="testimonial-quote"><i class="fas fa-quote-left"></i></div>
      <p class="testimonial-content">${t.content}</p>
      <div class="testimonial-stars">
        ${Array.from({ length: t.rating || 5 }, () => '<i class="fas fa-star"></i>').join('')}
      </div>
      <div class="testimonial-avatar">
        ${t.avatar ? `<img src="${t.avatar}" alt="${t.name}">` : '<i class="fas fa-user"></i>'}
      </div>
      <div class="testimonial-name">${t.name}</div>
      <div class="testimonial-role">${t.role}</div>
    </div>
  `).join('');

  // Dots
  dotsContainer.innerHTML = testimonials.map((_, index) => `
    <div class="testi-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></div>
  `).join('');

  initTestimonialSlider(testimonials.length);
}

function renderContact(contact) {
  if (!contact) return;

  if (contact.email) document.getElementById('contact-email').textContent = contact.email;
  if (contact.phone) document.getElementById('contact-phone').textContent = contact.phone;
  if (contact.website) {
    const w = contact.website.replace(/^https?:\/\//, '');
    document.getElementById('contact-website').textContent = w;
  }
  if (contact.address) document.getElementById('contact-address').textContent = contact.address;

  if (contact.instagram && contact.instagram !== '#') {
    document.getElementById('social-instagram').href = contact.instagram;
  }
  if (contact.linkedin && contact.linkedin !== '#') {
    document.getElementById('social-linkedin').href = contact.linkedin;
  }
  if (contact.behance && contact.behance !== '#') {
    document.getElementById('social-behance').href = contact.behance;
  }
  if (contact.dribbble && contact.dribbble !== '#') {
    document.getElementById('social-dribbble').href = contact.dribbble;
  }
}

function renderFooter(contact, siteInfo) {
  if (contact) {
    if (contact.email) document.getElementById('footer-email').textContent = contact.email;
    if (contact.phone) document.getElementById('footer-phone').textContent = contact.phone;
    if (contact.website) {
      const w = contact.website.replace(/^https?:\/\//, '');
      document.getElementById('footer-website').textContent = w;
    }
  }
  if (siteInfo && siteInfo.copyright) {
    document.getElementById('footer-copyright').textContent = siteInfo.copyright;
  }
}

// ============================================
// Project Filter
// ============================================
function initProjectFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      projectCards.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = 'block';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 50);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
          setTimeout(() => { card.style.display = 'none'; }, 300);
        }
      });
    });
  });
}

// ============================================
// Testimonial Slider
// ============================================
function initTestimonialSlider(total) {
  let current = 0;
  const cards = document.querySelectorAll('.testimonial-card');
  const dots = document.querySelectorAll('.testi-dot');

  function showSlide(index) {
    cards.forEach(c => c.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    cards[index]?.classList.add('active');
    dots[index]?.classList.add('active');
    current = index;
  }

  document.getElementById('testi-next').addEventListener('click', () => {
    showSlide((current + 1) % total);
  });

  document.getElementById('testi-prev').addEventListener('click', () => {
    showSlide((current - 1 + total) % total);
  });

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      showSlide(parseInt(dot.dataset.index));
    });
  });

  // Auto-play
  setInterval(() => {
    showSlide((current + 1) % total);
  }, 6000);
}

// ============================================
// Counter Animation
// ============================================
function initCounterAnimation() {
  const statNumbers = document.querySelectorAll('.stat-number');
  let animated = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animated) {
        animated = true;
        statNumbers.forEach(num => {
          const target = parseInt(num.dataset.target) || 0;
          animateCounter(num, target);
        });
      }
    });
  }, { threshold: 0.5 });

  const statsSection = document.getElementById('about-stats');
  if (statsSection) observer.observe(statsSection);
}

function animateCounter(element, target) {
  let current = 0;
  const duration = 2000;
  const step = target / (duration / 16);

  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    element.textContent = Math.floor(current);
  }, 16);
}

// ============================================
// Scroll Reveal
// ============================================
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  reveals.forEach(el => observer.observe(el));
}

// ============================================
// Active Nav Link on Scroll
// ============================================
function updateActiveNavLink() {
  const sections = document.querySelectorAll('section[id]');
  const scrollPos = window.scrollY + 150;

  sections.forEach(section => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute('id');

    if (scrollPos >= top && scrollPos < top + height) {
      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === id) {
          link.classList.add('active');
        }
      });
    }
  });
}

// ============================================
// Contact Form
// ============================================
function initContactForm() {
  const form = document.getElementById('contact-form');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('form-name').value;
    const email = document.getElementById('form-email').value;
    const subject = document.getElementById('form-subject').value;
    const message = document.getElementById('form-message').value;

    // Build WhatsApp message
    const waNumber = document.getElementById('hero-whatsapp-btn').href.replace('https://wa.me/', '');
    const waMessage = `Halo, saya *${name}* (${email}).\n\n*Subject:* ${subject}\n\n${message}`;
    const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;

    window.open(waUrl, '_blank');
    showToast('Message will be sent via WhatsApp!', 'success');
    form.reset();
  });
}

// ============================================
// Toast Notification
// ============================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    info: 'fas fa-info-circle'
  };
  toast.innerHTML = `<i class="${icons[type]}"></i> ${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}
