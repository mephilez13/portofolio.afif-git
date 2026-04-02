/* ============================================
   PROJECT DETAIL JS - Muhammad Afif Alfarizi
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Get project ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    if (!projectId) {
        window.location.href = '/#projects';
        return;
    }

    // 2. Fetch and Render Project
    fetchProjectDetail(projectId);

    // 3. Navbar logic (already handled by class 'scrolled' in HTML, but can add scroll logic)
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            // Keep it scrolled for consistency on detail page if desired,
            // or allow transparency at the very top.
            // navbar.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    const navToggle = document.getElementById('navbar-toggle');
    const navMenu = document.getElementById('navbar-menu');
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Preloader
    window.addEventListener('load', () => {
        setTimeout(() => {
            document.getElementById('preloader').classList.add('hidden');
        }, 600);
    });
});

async function fetchProjectDetail(id) {
    try {
        const response = await fetch(`/api/projects/${id}`);
        if (!response.ok) throw new Error('Project not found');
        
        const project = await response.json();
        renderProjectDetail(project);
    } catch (error) {
        console.error('Error fetching project:', error);
        document.getElementById('project-title').textContent = 'Project Not Found';
        document.getElementById('project-description').textContent = 'Maaf, proyek yang Anda cari tidak ditemukan.';
        setTimeout(() => {
            document.getElementById('preloader').classList.add('hidden');
        }, 500);
    }
}

function renderProjectDetail(project) {
    // Basic Info
    document.getElementById('project-title').textContent = project.title;
    document.getElementById('project-description').textContent = project.description;
    document.getElementById('project-category').textContent = project.category;
    document.getElementById('project-category-alt').textContent = project.category;
    
    // Page Title & Meta
    document.title = `${project.title} | Muhammad Afif Alfarizi`;
    document.getElementById('meta-description').content = project.description;

    // Main Image
    const mainImgContainer = document.getElementById('project-main-image-container');
    if (project.image) {
        mainImgContainer.innerHTML = `<img src="${project.image}" alt="${project.title}" class="img-fluid reveal-image">`;
    } else {
        mainImgContainer.innerHTML = `<div class="placeholder-img shadow-lg" style="height:400px; display:flex; align-items:center; justify-content:center; background:#111; color:#333; font-size:4rem; border-radius:24px;"><i class="fas fa-image"></i></div>`;
    }

    // Sidebar Details
    document.getElementById('project-client').textContent = project.client || '-';
    document.getElementById('project-date').textContent = project.project_date || '-';
    
    // Live Link
    const linkBtn = document.getElementById('project-link');
    if (project.link && project.link !== '#') {
        linkBtn.href = project.link;
        linkBtn.style.display = 'inline-flex';
    } else {
        linkBtn.style.display = 'none';
    }

    // Tech Stack
    const techContainer = document.getElementById('project-tech-stack');
    if (project.tech_stack) {
        const techs = project.tech_stack.split(',').map(t => t.trim());
        techContainer.innerHTML = techs.map(t => `<span class="tech-tag">${t}</span>`).join('');
    } else {
        techContainer.innerHTML = '<span class="text-muted" style="color:rgba(255,255,255,0.4)">No technology info provided.</span>';
    }

    // Detailed Content
    const contentBody = document.getElementById('project-content');
    if (project.content) {
        // Convert line breaks to paragraphs for better reading if not HTML
        const paragraphs = project.content.split('\n').filter(p => p.trim() !== '');
        contentBody.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join('');
    } else {
        contentBody.innerHTML = `<p>${project.description}</p>`;
    }

    // Extra Images (Gallery)
    const gallery = document.getElementById('project-extra-images');
    if (project.extra_images && Array.isArray(project.extra_images) && project.extra_images.length > 0) {
        gallery.innerHTML = project.extra_images.map(img => `
            <div class="gallery-item reveal">
                <img src="${img}" alt="Gallery image for ${project.title}" loading="lazy">
            </div>
        `).join('');
    } else {
        gallery.style.display = 'none';
    }

    // Share Links
    setupShareLinks(project);

    // Initial Reveal Animation
    setTimeout(initReveal, 100);
}

function setupShareLinks(project) {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Lihat proyek keren ini: ${project.title}`);
    
    document.getElementById('share-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    document.getElementById('share-twitter').href = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
    document.getElementById('share-linkedin').href = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
}

function initReveal() {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, { threshold: 0.1 });

    reveals.forEach(el => observer.observe(el));
    
    // Also trigger immediately for elements in view
    reveals.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
            el.classList.add('revealed');
        }
    });
}
