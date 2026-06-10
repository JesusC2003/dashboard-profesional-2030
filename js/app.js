document.addEventListener('DOMContentLoaded', () => {
  initCompetenciaRadar();
  initDofaInteractive();
  initPlanDeAccion();
  initProjectsCRUD();
});

/* -------------------------------------------------------------
   1. GRÁFICO DE RADAR DE COMPETENCIAS (HTML5 CANVAS)
   ------------------------------------------------------------- */
function initCompetenciaRadar() {
  const canvas = document.getElementById('competenciaRadar');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  const competencies = [
    { label: 'Análisis y Diseño',  value: 0.90, fullLabel: 'Análisis y diseño de soluciones (90%)' },
    { label: 'Comunicación',       value: 0.88, fullLabel: 'Comunicación oral y exposición (88%)' },
    { label: 'Innovación',         value: 0.85, fullLabel: 'Creatividad e innovación (85%)' },
    { label: 'Programación',       value: 0.60, fullLabel: 'Programación (Python, SQL, JS) (60%)' },
    { label: 'BI & Analytics',     value: 0.58, fullLabel: 'Inteligencia de Negocios / BI (58%)' },
    { label: 'Gestión Tech',       value: 0.55, fullLabel: 'Gestión de proyectos tecnológicos (55%)' }
  ];

  const totalAxes = competencies.length;
  let animProgress = 0;
  let hoveredIndex = -1;
  let mousePos = { x: 0, y: 0 };

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    drawRadar();
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  function animate() {
    if (animProgress < 1) {
      animProgress += 0.03;
      if (animProgress > 1) animProgress = 1;
      drawRadar();
      requestAnimationFrame(animate);
    }
  }

  setTimeout(animate, 200);

  function getColors() {
    return {
      gridLines:   'rgba(15, 23, 42, 0.08)',
      axesLines:   'rgba(15, 23, 42, 0.15)',
      text:        '#475569',
      textActive:  '#0f172a',
      accent:      'rgba(37, 99, 235, 0.15)',
      accentStroke:'#2563eb',
      accentGlow:  'rgba(37, 99, 235, 0.15)',
      tooltipBg:   '#1e293b',
      tooltipText: '#ffffff'
    };
  }

  function drawRadar() {
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;
    const centerX = w / 2;
    const centerY = h / 2;
    const maxRadius = Math.min(w, h) * 0.35;

    ctx.clearRect(0, 0, w, h);
    const colors = getColors();

    // Círculos concéntricos
    const levels = 5;
    ctx.strokeStyle = colors.gridLines;
    ctx.lineWidth = 1;
    for (let j = 1; j <= levels; j++) {
      const radius = maxRadius * (j / levels);
      ctx.beginPath();
      for (let i = 0; i < totalAxes; i++) {
        const angle = (i * 2 * Math.PI) / totalAxes - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = colors.text;
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${(j / levels) * 100}%`, centerX, centerY - radius + 3);
    }

    // Ejes y etiquetas
    ctx.strokeStyle = colors.axesLines;
    ctx.lineWidth = 1;
    competencies.forEach((comp, i) => {
      const angle = (i * 2 * Math.PI) / totalAxes - Math.PI / 2;
      const targetX = centerX + maxRadius * Math.cos(angle);
      const targetY = centerY + maxRadius * Math.sin(angle);

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(targetX, targetY);
      ctx.stroke();

      const textDist = maxRadius + 18;
      const textX = centerX + textDist * Math.cos(angle);
      const textY = centerY + textDist * Math.sin(angle);

      ctx.fillStyle = hoveredIndex === i ? colors.textActive : colors.text;
      ctx.font = hoveredIndex === i ? '600 11px sans-serif' : '500 10.5px sans-serif';

      if (Math.cos(angle) > 0.1) ctx.textAlign = 'left';
      else if (Math.cos(angle) < -0.1) ctx.textAlign = 'right';
      else ctx.textAlign = 'center';

      if (Math.sin(angle) > 0.8) ctx.textBaseline = 'top';
      else if (Math.sin(angle) < -0.8) ctx.textBaseline = 'bottom';
      else ctx.textBaseline = 'middle';

      ctx.fillText(comp.label, textX, textY);
    });

    // Polígono de valores
    const points = competencies.map((comp, i) => {
      const angle = (i * 2 * Math.PI) / totalAxes - Math.PI / 2;
      const val = comp.value * animProgress;
      return {
        x: centerX + maxRadius * val * Math.cos(angle),
        y: centerY + maxRadius * val * Math.sin(angle)
      };
    });

    ctx.fillStyle = colors.accent;
    ctx.strokeStyle = colors.accentStroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Puntos interactivos
    points.forEach((pt, i) => {
      const isHovered = hoveredIndex === i;
      if (isHovered) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = colors.accentGlow;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isHovered ? 6 : 4, 0, 2 * Math.PI);
      ctx.fillStyle = isHovered ? '#ffffff' : colors.accentStroke;
      ctx.strokeStyle = colors.accentStroke;
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
    });

    // Tooltip
    if (hoveredIndex !== -1) {
      const text = competencies[hoveredIndex].fullLabel;
      ctx.font = '500 11px sans-serif';
      const textWidth = ctx.measureText(text).width;
      const padX = 12, padY = 8;
      const rectW = textWidth + padX * 2;
      const rectH = 14 + padY * 2;

      let tx = mousePos.x + 10;
      let ty = mousePos.y - rectH - 10;
      if (tx + rectW > w) tx = w - rectW - 10;
      if (tx < 10) tx = 10;
      if (ty < 10) ty = mousePos.y + 15;

      ctx.fillStyle = colors.tooltipBg;
      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(tx, ty, rectW, rectH, 6);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = colors.tooltipText;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, tx + padX, ty + rectH / 2);
    }
  }

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mousePos.x = e.clientX - rect.left;
    mousePos.y = e.clientY - rect.top;

    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;
    const centerX = w / 2;
    const centerY = h / 2;
    const maxRadius = Math.min(w, h) * 0.35;

    let foundIndex = -1;
    competencies.forEach((comp, i) => {
      const angle = (i * 2 * Math.PI) / totalAxes - Math.PI / 2;
      const val = comp.value * animProgress;
      const px = centerX + maxRadius * val * Math.cos(angle);
      const py = centerY + maxRadius * val * Math.sin(angle);
      if (Math.hypot(mousePos.x - px, mousePos.y - py) < 12) foundIndex = i;
    });

    if (foundIndex !== hoveredIndex) {
      hoveredIndex = foundIndex;
      drawRadar();
    }
  });

  canvas.addEventListener('mouseleave', () => {
    hoveredIndex = -1;
    drawRadar();
  });
}

/* -------------------------------------------------------------
   2. MATRIZ DOFA Y CRUCE ESTRATÉGICO INTERACTIVOS
   ------------------------------------------------------------- */
function initDofaInteractive() {
  const quadrants = document.querySelectorAll('.dofa-quadrant');
  const cruceCards = document.querySelectorAll('.cruce-card');

  quadrants.forEach(quad => {
    quad.addEventListener('mouseenter', () => {
      const id = quad.getAttribute('data-id');
      quad.classList.add('active-card');
      cruceCards.forEach(card => {
        const types = card.getAttribute('data-type');
        if (types.includes(id)) {
          card.classList.add('highlighted');
          card.classList.remove('dimmed');
        } else {
          card.classList.add('dimmed');
          card.classList.remove('highlighted');
        }
      });
    });

    quad.addEventListener('mouseleave', () => {
      quad.classList.remove('active-card');
      cruceCards.forEach(card => {
        card.classList.remove('highlighted', 'dimmed');
      });
    });
  });
}

/* -------------------------------------------------------------
   3. PLAN DE ACCIÓN INTERACTIVO CON BARRA DE PROGRESO
   ------------------------------------------------------------- */
function initPlanDeAccion() {
  const timelineCards = document.querySelectorAll('.timeline-card');
  const progressFill = document.querySelector('.plan-progress-bar-fill');
  const progressPercentText = document.getElementById('plan-progress-percentage');

  if (!timelineCards.length) return;

  let planState = JSON.parse(localStorage.getItem('plan_status')) || {
    '6m': 'proceso',
    '1a': 'pendiente',
    '3a': 'pendiente',
    '5a': 'pendiente'
  };

  timelineCards.forEach(card => {
    const period = card.getAttribute('data-period');
    if (planState[period]) {
      card.setAttribute('data-status', planState[period]);
      updateStatusLabel(card, planState[period]);
    }

    const statusBtn = card.querySelector('.timeline-status');
    if (statusBtn) {
      statusBtn.addEventListener('click', () => {
        const current = card.getAttribute('data-status');
        const next = current === 'pendiente' ? 'proceso'
                   : current === 'proceso'   ? 'completado'
                   : 'pendiente';

        card.setAttribute('data-status', next);
        updateStatusLabel(card, next);
        planState[period] = next;
        localStorage.setItem('plan_status', JSON.stringify(planState));
        calculateProgress();
      });
    }
  });

  calculateProgress();

  function updateStatusLabel(card, status) {
    const label = card.querySelector('.status-text');
    if (!label) return;
    label.textContent = status === 'completado' ? 'Completado'
                      : status === 'proceso'    ? 'En Proceso'
                      : 'Pendiente';
  }

  function calculateProgress() {
    let total = 0;
    timelineCards.forEach(card => {
      const s = card.getAttribute('data-status');
      if (s === 'completado') total += 100;
      else if (s === 'proceso') total += 50;
    });
    const avg = Math.round(total / timelineCards.length);
    if (progressFill) progressFill.style.width = `${avg}%`;
    if (progressPercentText) progressPercentText.textContent = `${avg}%`;
  }
}

/* -------------------------------------------------------------
   4. CRUD Y FILTRO DE PORTAFOLIO DE PROYECTOS
   ------------------------------------------------------------- */
function initProjectsCRUD() {
  const projectsContainer = document.getElementById('projects-container');
  const filterButtons     = document.querySelectorAll('.filter-btn');
  const openModalBtn      = document.getElementById('add-project-btn');
  const modalOverlay      = document.getElementById('project-modal');
  const closeModalBtn     = document.getElementById('close-modal');
  const cancelModalBtn    = document.getElementById('cancel-project');
  const projectForm       = document.getElementById('project-form');

  if (!projectsContainer) return;

  const defaultProjects = [
    {
      id: 1,
      title: 'Pipeline BI — NYC Yellow Taxi Trip Data',
      category: 'datos',
      description: 'Pipeline completo de Business Intelligence en Tiempo Real bajo arquitectura Medallion (Bronze, Silver, Gold). Procesa más de 187 millones de registros con cargas incremental y test de calidad.',
      techs: 'Databricks, dbt Core, Kafka, Delta Lake, Power BI, Python, SQL',
      link: 'https://github.com/JesusC2003/pipeline-bi-nyc-taxi'
    },
    {
      id: 2,
      title: 'Visualizador de Vulnerabilidades de Red',
      category: 'ciberseguridad',
      description: 'Escáner de puertos y analizador de tráfico de red local interactivo que detecta debilidades comunes y reporta puertos expuestos en tiempo real.',
      techs: 'Python, Scapy, Socket, UI Consola',
      link: ''
    },
    {
      id: 3,
      title: 'Simulador de Algoritmos de Planificación de CPU',
      category: 'software',
      description: 'Simulador interactivo y visualizador de algoritmos de sistemas operativos (FIFO, Round Robin, SRTF) desarrollado para comprender la sincronización y despacho de procesos.',
      techs: 'JavaScript, HTML5, CSS3',
      link: ''
    }
  ];

  let projectsList = JSON.parse(localStorage.getItem('portafolio_proyectos')) || defaultProjects;
  let activeFilter = 'todos';

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function saveAndRender() {
    localStorage.setItem('portafolio_proyectos', JSON.stringify(projectsList));
    renderProjects();
  }

  function renderProjects() {
    projectsContainer.innerHTML = '';

    const filtered = projectsList.filter(p =>
      activeFilter === 'todos' || p.category === activeFilter
    );

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'col-12';
      empty.style.cssText = 'text-align:center;padding:40px;color:var(--text-tertiary);';
      empty.textContent = 'No se encontraron proyectos en esta categoría.';
      projectsContainer.appendChild(empty);
      return;
    }

    filtered.forEach(proj => {
      const card = document.createElement('div');
      card.className = 'project-card';
      card.setAttribute('data-id', proj.id);

      // Categoría
      const catEl = document.createElement('div');
      catEl.className = 'project-category';
      catEl.textContent = getCategoryLabel(proj.category);

      // Título
      const titleEl = document.createElement('h4');
      titleEl.className = 'project-card-title';
      titleEl.textContent = proj.title;

      // Descripción
      const descEl = document.createElement('p');
      descEl.className = 'project-desc';
      descEl.textContent = proj.description;

      // Tecnologías
      const techsEl = document.createElement('div');
      techsEl.className = 'project-techs';
      proj.techs.split(',').forEach(t => {
        const tag = document.createElement('span');
        tag.className = 'project-tech-tag';
        tag.textContent = t.trim();
        techsEl.appendChild(tag);
      });

      // Contenido superior
      const top = document.createElement('div');
      top.appendChild(catEl);
      top.appendChild(titleEl);
      top.appendChild(descEl);
      top.appendChild(techsEl);

      // Footer
      const footer = document.createElement('div');
      footer.className = 'project-footer';

      if (proj.link) {
        const link = document.createElement('a');
        link.href = proj.link;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'project-link';
        link.textContent = 'Ver Proyecto';
        link.insertAdjacentHTML('beforeend', `
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
          </svg>`);
        footer.appendChild(link);
      } else {
        const placeholder = document.createElement('span');
        placeholder.style.cssText = 'font-size:12px;color:var(--text-tertiary);';
        placeholder.textContent = 'Sin repositorio';
        footer.appendChild(placeholder);
      }

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-project-btn';
      deleteBtn.title = 'Eliminar Proyecto';
      deleteBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;
      deleteBtn.addEventListener('click', () => {
        if (confirm(`¿Estás seguro de eliminar el proyecto "${proj.title}"?`)) {
          projectsList = projectsList.filter(p => p.id !== proj.id);
          saveAndRender();
        }
      });
      footer.appendChild(deleteBtn);

      card.appendChild(top);
      card.appendChild(footer);
      projectsContainer.appendChild(card);
    });
  }

  function getCategoryLabel(cat) {
    if (cat === 'datos') return 'Datos & Analítica';
    if (cat === 'ciberseguridad') return 'Ciberseguridad';
    if (cat === 'software') return 'Software & Web';
    return 'General';
  }

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.getAttribute('data-filter');
      renderProjects();
    });
  });

  if (openModalBtn && modalOverlay) {
    openModalBtn.addEventListener('click', () => {
      modalOverlay.classList.add('active');
      projectForm.reset();
    });

    const closeModal = () => modalOverlay.classList.remove('active');

    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', e => {
      if (e.target === modalOverlay) closeModal();
    });

    projectForm.addEventListener('submit', e => {
      e.preventDefault();

      const title       = document.getElementById('proj-title').value.trim();
      const category    = document.getElementById('proj-category').value;
      const description = document.getElementById('proj-desc').value.trim();
      const techs       = document.getElementById('proj-techs').value.trim();
      const link        = document.getElementById('proj-link').value.trim();

      if (!title || !description || !techs) {
        alert('Por favor completa los campos requeridos.');
        return;
      }

      projectsList.push({ id: Date.now(), title, category, description, techs, link });
      saveAndRender();
      closeModal();
    });
  }

  renderProjects();
}
