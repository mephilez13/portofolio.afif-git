/* ============================================
   ADMIN JS - Portfolio Manager
   ============================================ */

const API = '/admin/api';

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  initLogin();
  initSidebar();
  initLogout();
  initModalClose();
  initImageUploads();
  initForms();
  initQuickActions();
});

// ============================================
// AUTH
// ============================================
async function checkAuth() {
  try {
    const res = await fetch(`${API}/check-auth`);
    const data = await res.json();
    if (data.authenticated) {
      showDashboard();
      loadAllData();
    }
  } catch (e) {
    console.log('Not authenticated');
  }
}

function initLogin() {
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        showDashboard();
        loadAllData();
      } else {
        errorEl.textContent = data.error || 'Login failed';
      }
    } catch (e) {
      errorEl.textContent = 'Connection error';
    }
  });
}

function showDashboard() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-dashboard').style.display = 'flex';
}

function initLogout() {
  document.getElementById('btn-logout').addEventListener('click', async () => {
    await fetch(`${API}/logout`, { method: 'POST' });
    location.reload();
  });
}

// ============================================
// SIDEBAR NAVIGATION
// ============================================
function initSidebar() {
  const links = document.querySelectorAll('.sidebar-link');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.dataset.section;
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
      document.getElementById(`section-${section}`).classList.add('active');

      // Close mobile sidebar
      document.getElementById('sidebar').classList.remove('active');
    });
  });

  // Mobile toggle
  document.getElementById('sidebar-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('active');
  });
}

function initQuickActions() {
  document.querySelectorAll('.quick-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.dataset.goto;
      const link = document.querySelector(`.sidebar-link[data-section="${section}"]`);
      if (link) link.click();
    });
  });
}

// ============================================
// LOAD ALL DATA
// ============================================
async function loadAllData() {
  await Promise.all([
    loadHero(),
    loadServices(),
    loadAbout(),
    loadProjects(),
    loadTestimonials(),
    loadSkills(),
    loadContact(),
    loadSiteSettings(),
    loadExperiences(),
    loadDetailedSkills()
  ]);
  updateDashboardStats();
}

async function updateDashboardStats() {
  try {
    const [services, projects, testimonials, skills, detailedSkills] = await Promise.all([
      fetchJSON(`${API}/services`),
      fetchJSON(`${API}/projects`),
      fetchJSON(`${API}/testimonials`),
      fetchJSON(`${API}/skills`),
      fetchJSON(`${API}/detailed-skills`)
    ]);
    document.getElementById('dash-services-count').textContent = services.length;
    document.getElementById('dash-projects-count').textContent = projects.length;
    document.getElementById('dash-testimonials-count').textContent = testimonials.length;
    document.getElementById('dash-skills-count').textContent = (skills.length || 0) + (detailedSkills ? detailedSkills.length : 0);
  } catch (e) { /* ignore */ }
}

async function fetchJSON(url) {
  const res = await fetch(url);
  return res.json();
}

// ============================================
// HERO
// ============================================
async function loadHero() {
  try {
    const data = await fetchJSON(`${API}/settings/hero`);
    document.getElementById('hero-greeting').value = data.greeting || '';
    document.getElementById('hero-name').value = data.name || '';
    document.getElementById('hero-title').value = data.title || '';
    document.getElementById('hero-title-highlight').value = data.titleHighlight || '';
    document.getElementById('hero-desc').value = data.description || '';
    document.getElementById('hero-resume').value = data.resumeLink || '';
    if (data.profileImage) {
      document.getElementById('hero-image-preview').innerHTML = `<img src="${data.profileImage}" alt="Profile">`;
      document.getElementById('hero-image-preview').dataset.currentImage = data.profileImage;
    }
  } catch (e) { /* ignore */ }
}

// ============================================
// ABOUT
// ============================================
async function loadAbout() {
  try {
    const data = await fetchJSON(`${API}/settings/about`);
    document.getElementById('about-bio').value = data.bio || '';
    document.getElementById('about-years').value = data.yearsExperience || '';
    document.getElementById('about-projects').value = data.projectsCompleted || '';
    document.getElementById('about-clients').value = data.happyClients || '';
    if (data.image) {
      document.getElementById('about-image-preview').innerHTML = `<img src="${data.image}" alt="About">`;
      document.getElementById('about-image-preview').dataset.currentImage = data.image;
    }
  } catch (e) { /* ignore */ }
}

// ============================================
// CONTACT
// ============================================
async function loadContact() {
  try {
    const data = await fetchJSON(`${API}/settings/contact`);
    document.getElementById('contact-email').value = data.email || '';
    document.getElementById('contact-phone').value = data.phone || '';
    document.getElementById('contact-whatsapp').value = data.whatsapp || '';
    document.getElementById('contact-website').value = data.website || '';
    document.getElementById('contact-address').value = data.address || '';
    document.getElementById('contact-instagram').value = data.instagram || '';
    document.getElementById('contact-linkedin').value = data.linkedin || '';
    document.getElementById('contact-tiktok').value = data.tiktok || '';
    document.getElementById('contact-website-social').value = data.websiteSocial || '';
  } catch (e) { /* ignore */ }
}

// ============================================
// SITE SETTINGS
// ============================================
async function loadSiteSettings() {
  try {
    const data = await fetchJSON(`${API}/settings/siteInfo`);
    document.getElementById('settings-logo').value = data.logo || '';
    document.getElementById('settings-copyright').value = data.copyright || '';
  } catch (e) { /* ignore */ }
}

// ============================================
// SERVICES
// ============================================
async function loadServices() {
  try {
    const services = await fetchJSON(`${API}/services`);
    const list = document.getElementById('services-list');
    if (services.length === 0) {
      list.innerHTML = '<p style="color:var(--admin-text-muted);text-align:center;padding:40px;">No services yet. Click "Add Service" to create one.</p>';
      return;
    }
    list.innerHTML = services.map(s => `
      <div class="item-card" data-id="${s.id}">
        <div class="item-info">
          <h4>${s.title}</h4>
          <p>${s.description || ''}</p>
          <span class="item-badge">${s.icon || 'star'}</span>
        </div>
        <div class="item-actions">
          <button class="btn-edit" onclick="editService(${s.id})"><i class="fas fa-edit"></i> Edit</button>
          <button class="btn-delete" onclick="deleteService(${s.id})"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `).join('');
  } catch (e) { /* ignore */ }
}

window.editService = async function(id) {
  const services = await fetchJSON(`${API}/services`);
  const service = services.find(s => s.id === id);
  if (!service) return;

  openModal('Edit Service', `
    <form id="modal-form">
      <input type="hidden" id="service-id" value="${service.id}">
      <div class="form-group">
        <label>Title</label>
        <input type="text" id="service-title" value="${service.title}" required>
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="service-desc" rows="3">${service.description || ''}</textarea>
      </div>
      <div class="form-group">
        <label>Icon Key (strategy, content, illustration, brand, marketing, social, design, star)</label>
        <input type="text" id="service-icon" value="${service.icon || 'star'}">
      </div>
      <button type="submit" class="btn btn-primary btn-full"><i class="fas fa-save"></i> Save</button>
    </form>
  `);

  document.getElementById('modal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await fetch(`${API}/services/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: document.getElementById('service-title').value,
        description: document.getElementById('service-desc').value,
        icon: document.getElementById('service-icon').value,
        sort_order: service.sort_order
      })
    });
    closeModal();
    loadServices();
    updateDashboardStats();
    showToast('Service updated!', 'success');
  });
};

window.deleteService = async function(id) {
  if (!confirm('Are you sure you want to delete this service?')) return;
  try {
    const res = await fetch(`${API}/services/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadServices();
      updateDashboardStats();
      showToast('Service deleted successfully', 'info');
    } else {
      showToast('Failed to delete service', 'error');
    }
  } catch (e) {
    showToast('Error deleting service', 'error');
  }
};

document.getElementById('add-service-btn')?.addEventListener('click', () => {
  openModal('Add Service', `
    <form id="modal-form">
      <div class="form-group">
        <label>Title</label>
        <input type="text" id="service-title" required>
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="service-desc" rows="3"></textarea>
      </div>
      <div class="form-group">
        <label>Icon Key (strategy, content, illustration, brand, marketing, social, design, star)</label>
        <input type="text" id="service-icon" value="star">
      </div>
      <button type="submit" class="btn btn-primary btn-full"><i class="fas fa-plus"></i> Add Service</button>
    </form>
  `);

  document.getElementById('modal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await fetch(`${API}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: document.getElementById('service-title').value,
        description: document.getElementById('service-desc').value,
        icon: document.getElementById('service-icon').value
      })
    });
    closeModal();
    loadServices();
    updateDashboardStats();
    showToast('Service added!', 'success');
  });
});

// ============================================
// PROJECTS
// ============================================
async function loadProjects() {
  try {
    const projects = await fetchJSON(`${API}/projects`);
    const list = document.getElementById('projects-list');
    if (projects.length === 0) {
      list.innerHTML = '<p style="color:var(--admin-text-muted);text-align:center;padding:40px;">No projects yet.</p>';
      return;
    }
    list.innerHTML = projects.map(p => `
      <div class="item-card" data-id="${p.id}">
        <div class="item-info">
          <h4>${p.title}</h4>
          <p>${p.description || ''}</p>
          <span class="item-badge">${p.category}</span>
        </div>
        <div class="item-actions">
          <button class="btn-edit" onclick="editProject(${p.id})"><i class="fas fa-edit"></i> Edit</button>
          <button class="btn-delete" onclick="deleteProject(${p.id})"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `).join('');
  } catch (e) { /* ignore */ }
}

window.editProject = async function(id) {
  const projects = await fetchJSON(`${API}/projects`);
  const project = projects.find(p => p.id === id);
  if (!project) return;

  openModal('Edit Project', `
    <form id="modal-form">
      <div class="form-row">
        <div class="form-group">
          <label>Title</label>
          <input type="text" id="project-title" value="${project.title}" required>
        </div>
        <div class="form-group">
          <label>Category</label>
          <select id="project-category">
            <option value="marketing" ${project.category === 'marketing' ? 'selected' : ''}>Marketing</option>
            <option value="illustration" ${project.category === 'illustration' ? 'selected' : ''}>Illustration</option>
          </select>
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label>Client</label>
          <input type="text" id="project-client" value="${project.client || ''}" placeholder="e.g. Retail Store">
        </div>
        <div class="form-group">
          <label>Project Date</label>
          <input type="text" id="project-date" value="${project.project_date || ''}" placeholder="e.g. July 2024">
        </div>
      </div>

      <div class="form-group">
        <label>Tech Stack (comma separated)</label>
        <input type="text" id="project-tech" value="${project.tech_stack || ''}" placeholder="e.g. WordPress, Elementor">
      </div>

      <div class="form-group">
        <label>Short Description (for card)</label>
        <textarea id="project-desc" rows="2">${project.description || ''}</textarea>
      </div>

      <div class="form-group">
        <label>Detailed Content / Project Explanation</label>
        <textarea id="project-content" rows="6" placeholder="Describe the project in detail...">${project.content || ''}</textarea>
      </div>

      <div class="form-group">
        <label>Main Image URL</label>
        <input type="text" id="project-image" value="${project.image || ''}">
        <div style="margin-top:8px;">
          <div class="image-upload-area" id="project-image-upload">
            <div class="image-preview" id="project-image-preview" style="min-height:100px;">
              ${project.image ? `<img src="${project.image}" alt="Project">` : '<i class="fas fa-cloud-upload-alt"></i><span>Or click to upload</span>'}
            </div>
            <input type="file" id="project-image-file" accept="image/*" hidden>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>Extra Images URLs (one per line)</label>
        <textarea id="project-extra-images" rows="3" placeholder="https://image1.jpg&#10;https://image2.jpg">${(project.extra_images || []).join('\n')}</textarea>
      </div>

      <div class="form-group">
        <label>External Link (optional)</label>
        <input type="text" id="project-link" value="${project.link || '#'}">
      </div>
      
      <button type="submit" class="btn btn-primary btn-full"><i class="fas fa-save"></i> Save Project</button>
    </form>
  `);

  initModalImageUpload('project-image-upload', 'project-image-preview', 'project-image-file', 'project-image');

  document.getElementById('modal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const extraImagesString = document.getElementById('project-extra-images').value;
    const extraImages = extraImagesString.split('\n').map(url => url.trim()).filter(url => url !== '');
    
    const res = await fetch(`${API}/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: document.getElementById('project-title').value,
        description: document.getElementById('project-desc').value,
        category: document.getElementById('project-category').value,
        image: document.getElementById('project-image').value,
        link: document.getElementById('project-link').value,
        content: document.getElementById('project-content').value,
        client: document.getElementById('project-client').value,
        project_date: document.getElementById('project-date').value,
        tech_stack: document.getElementById('project-tech').value,
        extra_images: extraImages,
        sort_order: project.sort_order
      })
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      showToast(errorData.error || 'Failed to update project', 'error');
      return;
    }

    closeModal();
    loadProjects();
    showToast('Project updated!', 'success');
  });
};

window.deleteProject = async function(id) {
  if (!confirm('Are you sure you want to delete this project?')) return;
  try {
    const res = await fetch(`${API}/projects/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadProjects();
      updateDashboardStats();
      showToast('Project deleted successfully', 'info');
    } else {
      showToast('Failed to delete project', 'error');
    }
  } catch (e) {
    showToast('Error deleting project', 'error');
  }
};

document.getElementById('add-project-btn')?.addEventListener('click', () => {
  openModal('Add Project', `
    <form id="modal-form">
      <div class="form-row">
        <div class="form-group">
          <label>Title</label>
          <input type="text" id="project-title" required>
        </div>
        <div class="form-group">
          <label>Category</label>
          <select id="project-category">
            <option value="marketing">Marketing</option>
            <option value="illustration">Illustration</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Client</label>
          <input type="text" id="project-client" placeholder="e.g. Retail Store">
        </div>
        <div class="form-group">
          <label>Project Date</label>
          <input type="text" id="project-date" placeholder="e.g. July 2024">
        </div>
      </div>

      <div class="form-group">
        <label>Tech Stack (comma separated)</label>
        <input type="text" id="project-tech" placeholder="e.g. WordPress, Elementor">
      </div>

      <div class="form-group">
        <label>Short Description (for card)</label>
        <textarea id="project-desc" rows="2"></textarea>
      </div>

      <div class="form-group">
        <label>Detailed Content / Project Explanation</label>
        <textarea id="project-content" rows="6" placeholder="Describe the project in detail..."></textarea>
      </div>

      <div class="form-group">
        <label>Main Image</label>
        <input type="text" id="project-image" placeholder="Image URL or upload below">
        <div style="margin-top:8px;">
          <div class="image-upload-area" id="project-image-upload">
            <div class="image-preview" id="project-image-preview" style="min-height:100px;">
              <i class="fas fa-cloud-upload-alt"></i><span>Click to upload</span>
            </div>
            <input type="file" id="project-image-file" accept="image/*" hidden>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>Extra Images URLs (one per line)</label>
        <textarea id="project-extra-images" rows="3" placeholder="https://image1.jpg&#10;https://image2.jpg"></textarea>
      </div>

      <div class="form-group">
        <label>External Link (optional)</label>
        <input type="text" id="project-link" placeholder="#">
      </div>
      
      <button type="submit" class="btn btn-primary btn-full"><i class="fas fa-plus"></i> Add Project</button>
    </form>
  `);

  initModalImageUpload('project-image-upload', 'project-image-preview', 'project-image-file', 'project-image');

  document.getElementById('modal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const extraImagesString = document.getElementById('project-extra-images').value;
    const extraImages = extraImagesString.split('\n').map(url => url.trim()).filter(url => url !== '');

    const res = await fetch(`${API}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: document.getElementById('project-title').value,
        description: document.getElementById('project-desc').value,
        category: document.getElementById('project-category').value,
        image: document.getElementById('project-image').value,
        link: document.getElementById('project-link').value || '#',
        content: document.getElementById('project-content').value,
        client: document.getElementById('project-client').value,
        project_date: document.getElementById('project-date').value,
        tech_stack: document.getElementById('project-tech').value,
        extra_images: extraImages
      })
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      showToast(errorData.error || 'Failed to add project', 'error');
      return;
    }

    closeModal();
    loadProjects();
    updateDashboardStats();
    showToast('Project added!', 'success');
  });
});

// ============================================
// TESTIMONIALS
// ============================================
async function loadTestimonials() {
  try {
    const testimonials = await fetchJSON(`${API}/testimonials`);
    const list = document.getElementById('testimonials-list');
    if (testimonials.length === 0) {
      list.innerHTML = '<p style="color:var(--admin-text-muted);text-align:center;padding:40px;">No testimonials yet.</p>';
      return;
    }
    list.innerHTML = testimonials.map(t => `
      <div class="item-card" data-id="${t.id}">
        <div class="item-info">
          <h4>${t.name} <span style="color:var(--admin-text-muted);font-weight:400;font-size:0.85rem;">— ${t.role || ''}</span></h4>
          <p>"${t.content || ''}"</p>
          <span class="item-badge">${'⭐'.repeat(t.rating || 5)}</span>
        </div>
        <div class="item-actions">
          <button class="btn-edit" onclick="editTestimonial(${t.id})"><i class="fas fa-edit"></i> Edit</button>
          <button class="btn-delete" onclick="deleteTestimonial(${t.id})"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `).join('');
  } catch (e) { /* ignore */ }
}

window.editTestimonial = async function(id) {
  const testimonials = await fetchJSON(`${API}/testimonials`);
  const t = testimonials.find(x => x.id === id);
  if (!t) return;

  openModal('Edit Testimonial', `
    <form id="modal-form">
      <div class="form-group">
        <label>Name</label>
        <input type="text" id="testimonial-name" value="${t.name}" required>
      </div>
      <div class="form-group">
        <label>Role / Company</label>
        <input type="text" id="testimonial-role" value="${t.role || ''}">
      </div>
      <div class="form-group">
        <label>Content</label>
        <textarea id="testimonial-content" rows="3">${t.content || ''}</textarea>
      </div>
      <div class="form-group">
        <label>Avatar URL</label>
        <input type="text" id="testimonial-avatar" value="${t.avatar || ''}">
      </div>
      <div class="form-group">
        <label>Rating (1-5)</label>
        <input type="number" id="testimonial-rating" min="1" max="5" value="${t.rating || 5}">
      </div>
      <button type="submit" class="btn btn-primary btn-full"><i class="fas fa-save"></i> Save</button>
    </form>
  `);

  document.getElementById('modal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await fetch(`${API}/testimonials/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('testimonial-name').value,
        role: document.getElementById('testimonial-role').value,
        content: document.getElementById('testimonial-content').value,
        avatar: document.getElementById('testimonial-avatar').value,
        rating: parseInt(document.getElementById('testimonial-rating').value),
        sort_order: t.sort_order
      })
    });
    closeModal();
    loadTestimonials();
    showToast('Testimonial updated!', 'success');
  });
};

window.deleteTestimonial = async function(id) {
  if (!confirm('Are you sure you want to delete this testimonial?')) return;
  try {
    const res = await fetch(`${API}/testimonials/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadTestimonials();
      updateDashboardStats();
      showToast('Testimonial deleted successfully', 'info');
    } else {
      showToast('Failed to delete testimonial', 'error');
    }
  } catch (e) {
    showToast('Error deleting testimonial', 'error');
  }
};

document.getElementById('add-testimonial-btn')?.addEventListener('click', () => {
  openModal('Add Testimonial', `
    <form id="modal-form">
      <div class="form-group">
        <label>Name</label>
        <input type="text" id="testimonial-name" required>
      </div>
      <div class="form-group">
        <label>Role / Company</label>
        <input type="text" id="testimonial-role">
      </div>
      <div class="form-group">
        <label>Content</label>
        <textarea id="testimonial-content" rows="3"></textarea>
      </div>
      <div class="form-group">
        <label>Avatar URL</label>
        <input type="text" id="testimonial-avatar">
      </div>
      <div class="form-group">
        <label>Rating (1-5)</label>
        <input type="number" id="testimonial-rating" min="1" max="5" value="5">
      </div>
      <button type="submit" class="btn btn-primary btn-full"><i class="fas fa-plus"></i> Add Testimonial</button>
    </form>
  `);

  document.getElementById('modal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await fetch(`${API}/testimonials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('testimonial-name').value,
        role: document.getElementById('testimonial-role').value,
        content: document.getElementById('testimonial-content').value,
        avatar: document.getElementById('testimonial-avatar').value,
        rating: parseInt(document.getElementById('testimonial-rating').value)
      })
    });
    closeModal();
    loadTestimonials();
    updateDashboardStats();
    showToast('Testimonial added!', 'success');
  });
});

// ============================================
// SKILLS
// ============================================
async function loadSkills() {
  try {
    const skills = await fetchJSON(`${API}/skills`);
    const list = document.getElementById('skills-list');
    if (skills.length === 0) {
      list.innerHTML = '<p style="color:var(--admin-text-muted);text-align:center;padding:40px;">No skills yet.</p>';
      return;
    }
    list.innerHTML = skills.map(s => `
      <div class="item-card" data-id="${s.id}">
        <div class="item-info">
          <h4>${s.name}</h4>
        </div>
        <div class="item-actions">
          <button class="btn-edit" onclick="editSkill(${s.id}, '${s.name.replace(/'/g, "\\'")}')"><i class="fas fa-edit"></i> Edit</button>
          <button class="btn-delete" onclick="deleteSkill(${s.id})"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `).join('');
  } catch (e) { /* ignore */ }
}

window.editSkill = function(id, name) {
  openModal('Edit Skill', `
    <form id="modal-form">
      <div class="form-group">
        <label>Skill Name</label>
        <input type="text" id="skill-name" value="${name}" required>
      </div>
      <button type="submit" class="btn btn-primary btn-full"><i class="fas fa-save"></i> Save</button>
    </form>
  `);

  document.getElementById('modal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await fetch(`${API}/skills/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: document.getElementById('skill-name').value })
    });
    closeModal();
    loadSkills();
    showToast('Skill updated!', 'success');
  });
};

window.deleteSkill = async function(id) {
  if (!confirm('Are you sure you want to delete this skill?')) return;
  try {
    const res = await fetch(`${API}/skills/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadSkills();
      updateDashboardStats();
      showToast('Skill deleted successfully', 'info');
    } else {
      showToast('Failed to delete skill', 'error');
    }
  } catch (e) {
    showToast('Error deleting skill', 'error');
  }
};

document.getElementById('add-skill-btn')?.addEventListener('click', () => {
  openModal('Add Skill', `
    <form id="modal-form">
      <div class="form-group">
        <label>Skill Name</label>
        <input type="text" id="skill-name" required>
      </div>
      <button type="submit" class="btn btn-primary btn-full"><i class="fas fa-plus"></i> Add Skill</button>
    </form>
  `);

  document.getElementById('modal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await fetch(`${API}/skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: document.getElementById('skill-name').value })
    });
    closeModal();
    loadSkills();
    updateDashboardStats();
    showToast('Skill added!', 'success');
  });
});

// ============================================
// DETAILED SKILLS
// ============================================
async function loadDetailedSkills() {
  try {
    const skills = await fetchJSON(`${API}/detailed-skills`);
    const list = document.getElementById('detailed-skills-list');
    if (!list) return;

    if (skills.length === 0) {
      list.innerHTML = '<p style="color:var(--admin-text-muted);text-align:center;padding:40px;">No detailed skills yet.</p>';
      return;
    }
    list.innerHTML = skills.map(s => `
      <div class="item-card" data-id="${s.id}">
        <div class="item-info">
          <h4>${s.name}</h4>
          <p>${s.percentage}% | <i class="${s.icon}"></i></p>
          <div style="width:20px;height:20px;background:${s.color};border-radius:4px;margin-top:4px;"></div>
        </div>
        <div class="item-actions">
          <button class="btn-edit" onclick="editDetailedSkill(${s.id})"><i class="fas fa-edit"></i> Edit</button>
          <button class="btn-delete" onclick="deleteDetailedSkill(${s.id})"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `).join('');
  } catch (e) { /* ignore */ }
}

window.editDetailedSkill = async function(id) {
  const skills = await fetchJSON(`${API}/detailed-skills`);
  const skill = skills.find(s => s.id === id);
  if (!skill) return;

  openModal('Edit Detailed Skill', `
    <form id="modal-form">
      <div class="form-group">
        <label>Skill Name (e.g. FIGMA)</label>
        <input type="text" id="det-name" value="${skill.name}" required>
      </div>
      <div class="form-group">
        <label>Percentage (0-100)</label>
        <input type="number" id="det-percentage" value="${skill.percentage}" min="0" max="100" required>
      </div>
      <div class="form-group">
        <label>Icon Class (FontAwesome, e.g. fab fa-figma)</label>
        <input type="text" id="det-icon" value="${skill.icon || ''}" required>
      </div>
      <div class="form-group">
        <label>Accent Color (Hex or Gradient)</label>
        <input type="text" id="det-color" value="${skill.color || '#2563EB'}" required>
      </div>
      <button type="submit" class="btn btn-primary btn-full"><i class="fas fa-save"></i> Save</button>
    </form>
  `);

  document.getElementById('modal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/detailed-skills/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('det-name').value,
        percentage: document.getElementById('det-percentage').value,
        icon: document.getElementById('det-icon').value,
        color: document.getElementById('det-color').value,
        sort_order: skill.sort_order
      })
    });
    
    if (!res.ok) {
      const err = await res.json();
      showToast(err.error || 'Failed to update', 'error');
      return;
    }

    closeModal();
    loadDetailedSkills();
    showToast('Detailed skill updated!', 'success');
  });
};

window.deleteDetailedSkill = async function(id) {
  if (!confirm('Are you sure?')) return;
  try {
    const res = await fetch(`${API}/detailed-skills/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadDetailedSkills();
      updateDashboardStats();
      showToast('Deleted', 'info');
    }
  } catch (e) { showToast('Error', 'error'); }
};

document.getElementById('add-detailed-skill-btn')?.addEventListener('click', () => {
  openModal('Add Detailed Skill', `
    <form id="modal-form">
      <div class="form-group">
        <label>Skill Name</label>
        <input type="text" id="det-name" required>
      </div>
      <div class="form-group">
        <label>Percentage</label>
        <input type="number" id="det-percentage" value="0" min="0" max="100" required>
      </div>
      <div class="form-group">
        <label>Icon Class</label>
        <input type="text" id="det-icon" placeholder="fab fa-figma" required>
      </div>
      <div class="form-group">
        <label>Accent Color</label>
        <input type="text" id="det-color" value="#2563EB" required>
      </div>
      <button type="submit" class="btn btn-primary btn-full"><i class="fas fa-plus"></i> Add Skill</button>
    </form>
  `);

  document.getElementById('modal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/detailed-skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('det-name').value,
        percentage: document.getElementById('det-percentage').value,
        icon: document.getElementById('det-icon').value,
        color: document.getElementById('det-color').value
      })
    });

    if (!res.ok) {
      const err = await res.json();
      showToast(err.error || 'Failed to add', 'error');
      return;
    }

    closeModal();
    loadDetailedSkills();
    updateDashboardStats();
    showToast('Detailed skill added!', 'success');
  });
});

// ============================================
// EXPERIENCES
// ============================================
async function loadExperiences() {
  try {
    const experiences = await fetchJSON(`${API}/experiences`);
    const list = document.getElementById('experiences-list');
    if (!list) return;

    if (experiences.length === 0) {
      list.innerHTML = '<p style="color:var(--admin-text-muted);text-align:center;padding:40px;">No experiences yet.</p>';
      return;
    }
    list.innerHTML = experiences.map(e => `
      <div class="item-card" data-id="${e.id}">
        <div class="item-info">
          <h4>${e.title}</h4>
          <p>${e.subtitle || ''} | <span class="item-badge">${e.type}</span></p>
        </div>
        <div class="item-actions">
          <button class="btn-edit" onclick="editExperience(${e.id})"><i class="fas fa-edit"></i> Edit</button>
          <button class="btn-delete" onclick="deleteExperience(${e.id})"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `).join('');
  } catch (e) { /* ignore */ }
}

window.editExperience = async function(id) {
  const experiences = await fetchJSON(`${API}/experiences`);
  const exp = experiences.find(e => e.id === id);
  if (!exp) return;

  openModal('Edit Experience', `
    <form id="modal-form">
      <div class="form-group">
        <label>Title (e.g. Graphic Designer / Universitas ABC)</label>
        <input type="text" id="exp-title" value="${exp.title}" required>
      </div>
      <div class="form-group">
        <label>Subtitle (e.g. 2020 - Present)</label>
        <input type="text" id="exp-subtitle" value="${exp.subtitle || ''}">
      </div>
      <div class="form-group">
        <label>Description (e.g. 4.8/5 or short detail)</label>
        <textarea id="exp-desc" rows="3">${exp.description || ''}</textarea>
      </div>
      <div class="form-group">
        <label>Type</label>
        <select id="exp-type">
          <option value="work" ${exp.type === 'work' ? 'selected' : ''}>Work Experience</option>
          <option value="education" ${exp.type === 'education' ? 'selected' : ''}>Education & Certifications</option>
        </select>
      </div>
      <button type="submit" class="btn btn-primary btn-full"><i class="fas fa-save"></i> Save</button>
    </form>
  `);

  document.getElementById('modal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await fetch(`${API}/experiences/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: document.getElementById('exp-title').value,
        subtitle: document.getElementById('exp-subtitle').value,
        description: document.getElementById('exp-desc').value,
        type: document.getElementById('exp-type').value,
        sort_order: exp.sort_order
      })
    });
    closeModal();
    loadExperiences();
    showToast('Experience updated!', 'success');
  });
};

window.deleteExperience = async function(id) {
  if (!confirm('Are you sure you want to delete this experience?')) return;
  try {
    const res = await fetch(`${API}/experiences/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadExperiences();
      showToast('Experience deleted successfully', 'info');
    } else {
      showToast('Failed to delete experience', 'error');
    }
  } catch (e) {
    showToast('Error deleting experience', 'error');
  }
};

document.getElementById('add-experience-btn')?.addEventListener('click', () => {
  openModal('Add Experience', `
    <form id="modal-form">
      <div class="form-group">
        <label>Title</label>
        <input type="text" id="exp-title" required>
      </div>
      <div class="form-group">
        <label>Subtitle (e.g. 2020 - Present)</label>
        <input type="text" id="exp-subtitle">
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="exp-desc" rows="3"></textarea>
      </div>
      <div class="form-group">
        <label>Type</label>
        <select id="exp-type">
          <option value="work">Work Experience</option>
          <option value="education">Education & Certifications</option>
        </select>
      </div>
      <button type="submit" class="btn btn-primary btn-full"><i class="fas fa-plus"></i> Add Experience</button>
    </form>
  `);

  document.getElementById('modal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/experiences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: document.getElementById('exp-title').value,
          subtitle: document.getElementById('exp-subtitle').value,
          description: document.getElementById('exp-desc').value,
          type: document.getElementById('exp-type').value
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        showToast('Error: ' + (data.error || 'Failed to add experience'), 'error');
        console.error('Add experience error:', data);
        return;
      }
      closeModal();
      loadExperiences();
      showToast('Experience added!', 'success');
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
      console.error('Add experience error:', err);
    }
  });
});

// ============================================
// FORMS INIT
// ============================================
function initForms() {
  // Hero form
  document.getElementById('hero-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const preview = document.getElementById('hero-image-preview');
    await fetch(`${API}/settings/hero`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        greeting: document.getElementById('hero-greeting').value,
        name: document.getElementById('hero-name').value,
        title: document.getElementById('hero-title').value,
        titleHighlight: document.getElementById('hero-title-highlight').value,
        description: document.getElementById('hero-desc').value,
        profileImage: preview.dataset.currentImage || '',
        resumeLink: document.getElementById('hero-resume').value
      })
    });
    showToast('Hero section saved!', 'success');
  });

  // About form
  document.getElementById('about-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const preview = document.getElementById('about-image-preview');
    await fetch(`${API}/settings/about`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bio: document.getElementById('about-bio').value,
        yearsExperience: document.getElementById('about-years').value,
        projectsCompleted: document.getElementById('about-projects').value,
        happyClients: document.getElementById('about-clients').value,
        image: preview.dataset.currentImage || ''
      })
    });
    showToast('About section saved!', 'success');
  });

  // Contact form
  document.getElementById('contact-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await fetch(`${API}/settings/contact`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('contact-email').value,
        phone: document.getElementById('contact-phone').value,
        whatsapp: document.getElementById('contact-whatsapp').value,
        website: document.getElementById('contact-website').value,
        address: document.getElementById('contact-address').value,
        instagram: document.getElementById('contact-instagram').value,
        linkedin: document.getElementById('contact-linkedin').value,
        tiktok: document.getElementById('contact-tiktok').value,
        websiteSocial: document.getElementById('contact-website-social').value
      })
    });
    showToast('Contact info saved!', 'success');
  });

  // Site settings form
  document.getElementById('site-settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await fetch(`${API}/settings/siteInfo`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        logo: document.getElementById('settings-logo').value,
        copyright: document.getElementById('settings-copyright').value
      })
    });
    showToast('Site settings saved!', 'success');
  });

  // Password form
  document.getElementById('password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: document.getElementById('pw-current').value,
        newPassword: document.getElementById('pw-new').value
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Password changed successfully!', 'success');
      document.getElementById('password-form').reset();
    } else {
      showToast(data.error || 'Failed to change password', 'error');
    }
  });
}

// ============================================
// IMAGE UPLOAD
// ============================================
function initImageUploads() {
  setupImageUpload('hero-image-upload', 'hero-image-preview', 'hero-image-file');
  setupImageUpload('about-image-upload', 'about-image-preview', 'about-image-file');
}

function setupImageUpload(areaId, previewId, fileId) {
  const area = document.getElementById(areaId);
  const preview = document.getElementById(previewId);
  const fileInput = document.getElementById(fileId);

  if (!area || !preview || !fileInput) return;

  area.addEventListener('click', () => fileInput.click());

  area.addEventListener('dragover', (e) => {
    e.preventDefault();
    preview.style.borderColor = 'var(--admin-primary)';
  });

  area.addEventListener('dragleave', () => {
    preview.style.borderColor = '';
  });

  area.addEventListener('drop', (e) => {
    e.preventDefault();
    preview.style.borderColor = '';
    if (e.dataTransfer.files.length > 0) {
      uploadFile(e.dataTransfer.files[0], preview);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      uploadFile(fileInput.files[0], preview);
    }
  });
}

function initModalImageUpload(areaId, previewId, fileId, inputId) {
  const area = document.getElementById(areaId);
  const preview = document.getElementById(previewId);
  const fileInput = document.getElementById(fileId);
  const urlInput = document.getElementById(inputId);

  if (!area || !preview || !fileInput) return;

  area.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async () => {
    if (fileInput.files.length > 0) {
      const path = await uploadFile(fileInput.files[0], preview);
      if (path && urlInput) {
        urlInput.value = path;
      }
    }
  });
}

async function uploadFile(file, previewEl) {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const res = await fetch(`${API}/upload`, { method: 'POST', body: formData });
    const data = await res.json();
    if (data.success) {
      previewEl.innerHTML = `<img src="${data.path}" alt="Uploaded">`;
      previewEl.dataset.currentImage = data.path;
      showToast('Image uploaded!', 'success');
      return data.path;
    } else {
      showToast(data.error || 'Upload failed', 'error');
    }
  } catch (e) {
    showToast('Upload error', 'error');
  }
  return null;
}

// ============================================
// MODAL
// ============================================
function openModal(title, bodyHtml) {
  document.getElementById('modal-header-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHtml;
  document.getElementById('modal-overlay').classList.add('active');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
}

function initModalClose() {
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  });
}

// ============================================
// TOAST
// ============================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: 'fas fa-check-circle', error: 'fas fa-exclamation-circle', info: 'fas fa-info-circle' };
  toast.innerHTML = `<i class="${icons[type]}"></i> ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}
