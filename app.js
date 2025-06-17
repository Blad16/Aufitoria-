// Datos de configuración
const CONFIG = {
  users: {
    jaylene: { 
      password: "456", 
      name: "Jaylene Iveth Pineda",
      storageKey: "auditData_jaylene"
    },
    abraham: { 
      password: "123", 
      name: "Abraham Argeñal",
      storageKey: "auditData_abraham"
    }
  },
  sessionTimeout: 24 * 60 * 60 * 1000 // 24 horas
};

// Estado de la aplicación
const state = {
  currentUser: null,
  companyName: "American Brokers",
  findings: [],
  auditPlans: [],
  risks: [],
  checklist: {
    iso: {},
    cobit: {},
    ens: {},
    diagnostics: {
      strengths: "",
      improvements: "",
      recommendations: ""
    }
  },
  charts: {
    status: null,
    priority: null,
    timeline: null,
    radar: null
  }
};

// Elementos del DOM
const DOM = {
  // Login
  loginContainer: document.getElementById("login-container"),
  loginForm: document.getElementById("login-form"),
  usernameInput: document.getElementById("username"),
  passwordInput: document.getElementById("password"),
  loginError: document.getElementById("login-error"),
  
  // App
  appContent: document.getElementById("app-content"),
  logoutBtn: document.getElementById("logout-btn"),
  companyNameDisplay: document.getElementById("company-name"),
  companyInput: document.getElementById("company-input"),
  saveConfigBtn: document.getElementById("save-config"),
  userInfo: document.getElementById("user-info"),
  
  // Findings
  findingsList: document.getElementById("findings-list"),
  addFindingBtn: document.getElementById("add-finding"),
  exportPdfBtn: document.getElementById("export-pdf"),
  exportPowerBiBtn: document.getElementById("export-powerbi"),
  showChecklistBtn: document.getElementById("show-checklist"),
  generateDiagnosticBtn: document.getElementById("generate-diagnostic"),
  
  // Modal
  findingModal: document.getElementById("finding-modal"),
  findingForm: document.getElementById("finding-form"),
  modalTitle: document.getElementById("modal-title"),
  findingIdInput: document.getElementById("finding-id"),
  
  // Checklist Modal
  checklistModal: document.getElementById("checklist-modal"),
  saveChecklistBtn: document.getElementById("save-checklist"),
  exportChecklistBtn: document.getElementById("export-checklist"),
  
  // Charts
  statusChart: document.getElementById("status-chart"),
  priorityChart: document.getElementById("priority-chart"),
  timelineChart: document.getElementById("timeline-chart"),
  radarChart: document.getElementById("radar-chart"),
  
  // Dashboard Avanzado
  pendingFindings: document.getElementById("pending-findings"),
  highRisks: document.getElementById("high-risks"),
  activePlans: document.getElementById("active-plans"),
  
  // Planificación de Auditoría
  plansList: document.getElementById("plans-list"),
  addPlanBtn: document.getElementById("add-plan"),
  exportPlanPdfBtn: document.getElementById("export-plan-pdf"),
  
  // Plan Modal
  planModal: document.getElementById("plan-modal"),
  planForm: document.getElementById("plan-form"),
  planModalTitle: document.getElementById("plan-modal-title"),
  planIdInput: document.getElementById("plan-id"),
  
  // Matriz de Riesgos
  matrixGrid: document.querySelector(".matrix-grid"),
  risksList: document.getElementById("risks-list"),
  addRiskBtn: document.getElementById("add-risk"),
  exportMatrixBtn: document.getElementById("export-matrix"),
  
  // Risk Modal
  riskModal: document.getElementById("risk-modal"),
  riskForm: document.getElementById("risk-form"),
  riskModalTitle: document.getElementById("risk-modal-title"),
  riskIdInput: document.getElementById("risk-id")
};

// Inicialización
function init() {
  loadSession();
  setupEventListeners();
  initRiskMatrix();
}

// Cargar sesión existente
function loadSession() {
  const savedSession = localStorage.getItem("auditAppSession");
  if (savedSession) {
    const session = JSON.parse(savedSession);
    
    // Verificar si la sesión es válida y no ha expirado
    if (session.user && session.timestamp && 
        (Date.now() - session.timestamp) < CONFIG.sessionTimeout) {
      state.currentUser = session.user;
      loadUserData();
      toggleAuthState(true);
    } else {
      // Sesión expirada
      localStorage.removeItem("auditAppSession");
    }
  }
}

// Cargar datos del usuario actual
function loadUserData() {
  if (!state.currentUser) return;
  
  const userKey = CONFIG.users[state.currentUser.username].storageKey;
  const savedData = localStorage.getItem(userKey);
  
  if (savedData) {
    const data = JSON.parse(savedData);
    state.companyName = data.companyName || state.companyName;
    state.findings = data.findings || state.findings;
    state.auditPlans = data.auditPlans || state.auditPlans;
    state.risks = data.risks || state.risks;
    state.checklist = data.checklist || state.checklist;
  }
  
  updateUI();
  updateChecklistUI();
  updateDashboardMetrics();
}

// Guardar datos del usuario actual
function saveUserData() {
  if (!state.currentUser) return;
  
  const userKey = CONFIG.users[state.currentUser.username].storageKey;
  localStorage.setItem(userKey, JSON.stringify({
    companyName: state.companyName,
    findings: state.findings,
    auditPlans: state.auditPlans,
    risks: state.risks,
    checklist: state.checklist
  }));
}

// Configurar event listeners
function setupEventListeners() {
  // Login
  DOM.loginForm.addEventListener("submit", handleLogin);
  
  // Logout
  DOM.logoutBtn.addEventListener("click", handleLogout);
  
  // Configuración
  DOM.saveConfigBtn.addEventListener("click", saveConfiguration);
  
  // Hallazgos
  DOM.addFindingBtn.addEventListener("click", () => openFindingModal());
  DOM.exportPdfBtn.addEventListener("click", exportToPDF);
  DOM.exportPowerBiBtn.addEventListener("click", exportToPowerBI);
  DOM.showChecklistBtn.addEventListener("click", () => openChecklistModal());
  DOM.generateDiagnosticBtn.addEventListener("click", generateCompleteDiagnostic);
  
  // Modal
  document.querySelector(".close").addEventListener("click", closeFindingModal);
  window.addEventListener("click", (e) => {
    if (e.target === DOM.findingModal) closeFindingModal();
  });
  DOM.findingForm.addEventListener("submit", handleFindingSubmit);
  
  // Planificación de Auditoría
  DOM.addPlanBtn.addEventListener("click", () => openPlanModal());
  DOM.exportPlanPdfBtn.addEventListener("click", exportPlanToPDF);
  DOM.planForm.addEventListener("submit", handlePlanSubmit);
  
  // Matriz de Riesgos
  DOM.addRiskBtn.addEventListener("click", () => openRiskModal());
  DOM.exportMatrixBtn.addEventListener("click", exportRiskMatrix);
  DOM.riskForm.addEventListener("submit", handleRiskSubmit);
}

// Manejar login
function handleLogin(e) {
  e.preventDefault();
  
  const username = DOM.usernameInput.value.trim().toLowerCase();
  const password = DOM.passwordInput.value.trim();
  
  // Validar credenciales
  if (CONFIG.users[username] && CONFIG.users[username].password === password) {
    state.currentUser = {
      username: username,
      name: CONFIG.users[username].name
    };
    
    // Guardar sesión
    localStorage.setItem("auditAppSession", JSON.stringify({
      user: state.currentUser,
      timestamp: Date.now()
    }));
    
    // Cargar datos específicos del usuario
    loadUserData();
    
    // Actualizar UI
    toggleAuthState(true);
    DOM.loginError.textContent = "";
  } else {
    DOM.loginError.textContent = "Usuario o contraseña incorrectos";
    DOM.passwordInput.value = "";
    DOM.passwordInput.focus();
  }
}

// Manejar logout
function handleLogout() {
  // Guardar datos antes de cerrar sesión
  saveUserData();
  
  // Limpiar estado
  state.currentUser = null;
  state.companyName = "American Brokers";
  state.findings = [];
  state.auditPlans = [];
  state.risks = [];
  state.checklist = {
    iso: {},
    cobit: {},
    ens: {},
    diagnostics: {
      strengths: "",
      improvements: "",
      recommendations: ""
    }
  };
  
  // Eliminar sesión
  localStorage.removeItem("auditAppSession");
  
  // Limpiar formulario
  DOM.loginForm.reset();
  
  // Actualizar UI
  toggleAuthState(false);
}

// Cambiar estado de autenticación
function toggleAuthState(authenticated) {
  if (authenticated) {
    DOM.loginContainer.style.display = "none";
    DOM.appContent.style.display = "block";
    updateUI();
    initCharts();
    renderPlans();
    renderRisks();
  } else {
    DOM.loginContainer.style.display = "block";
    DOM.appContent.style.display = "none";
  }
}

// Guardar configuración
function saveConfiguration() {
  const newCompanyName = DOM.companyInput.value.trim();
  if (newCompanyName) {
    state.companyName = newCompanyName;
    saveUserData();
    updateUI();
    alert("Configuración guardada correctamente");
  } else {
    alert("Por favor ingrese un nombre válido para la empresa");
  }
}

// Actualizar UI
function updateUI() {
  DOM.companyNameDisplay.textContent = state.companyName;
  DOM.companyInput.value = state.companyName;
  
  if (state.currentUser) {
    DOM.userInfo.textContent = `Auditor: ${state.currentUser.name}`;
  }
  
  renderFindings();
  updateDashboardMetrics();
}

// Actualizar métricas del dashboard avanzado
function updateDashboardMetrics() {
  // Hallazgos pendientes
  const pendingFindings = state.findings.filter(f => f.status === "Pendiente").length;
  DOM.pendingFindings.textContent = pendingFindings;
  
  // Riesgos altos
  const highRisks = state.risks.filter(r => 
    (r.probability === "Alta" && r.impact === "Crítico") || 
    (r.probability === "Alta" && r.impact === "Alto") ||
    (r.probability === "Media" && r.impact === "Crítico")
  ).length;
  DOM.highRisks.textContent = highRisks;
  
  // Planes activos (con fecha actual entre inicio y fin)
  const today = new Date();
  const activePlans = state.auditPlans.filter(p => {
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);
    return today >= start && today <= end;
  }).length;
  DOM.activePlans.textContent = activePlans;
}

// Actualizar checklist UI
function updateChecklistUI() {
  // Actualizar checkboxes
  for (const key in state.checklist.iso) {
    const checkbox = document.getElementById(key);
    if (checkbox) checkbox.checked = state.checklist.iso[key];
  }
  
  for (const key in state.checklist.cobit) {
    const checkbox = document.getElementById(key);
    if (checkbox) checkbox.checked = state.checklist.cobit[key];
  }
  
  for (const key in state.checklist.ens) {
    const checkbox = document.getElementById(key);
    if (checkbox) checkbox.checked = state.checklist.ens[key];
  }
  
  // Actualizar diagnósticos
  document.getElementById("strengths").value = state.checklist.diagnostics.strengths || "";
  document.getElementById("improvements").value = state.checklist.diagnostics.improvements || "";
  document.getElementById("recommendations").value = state.checklist.diagnostics.recommendations || "";
}

// Hallazgos - Abrir modal
function openFindingModal(id = null) {
  if (id) {
    // Modo edición
    DOM.modalTitle.innerHTML = '<i class="fas fa-edit"></i> Editar Hallazgo';
    const finding = state.findings.find(f => f.id === id);
    if (finding) {
      DOM.findingIdInput.value = finding.id;
      document.getElementById("finding-desc").value = finding.description;
      document.getElementById("finding-type").value = finding.type;
      document.getElementById("finding-priority").value = finding.priority;
      document.getElementById("finding-status").value = finding.status;
      document.getElementById("finding-date").value = finding.date;
      document.getElementById("finding-responsible").value = finding.responsible;
    }
  } else {
    // Modo nuevo
    DOM.modalTitle.innerHTML = '<i class="fas fa-file-alt"></i> Nuevo Hallazgo';
    DOM.findingForm.reset();
    DOM.findingIdInput.value = "";
    document.getElementById("finding-date").value = new Date().toISOString().split("T")[0];
  }
  
  DOM.findingModal.style.display = "flex";
}

// Checklist - Abrir modal
function openChecklistModal() {
  DOM.checklistModal.style.display = "flex";
}

// Checklist - Cerrar modal
function closeChecklistModal() {
  DOM.checklistModal.style.display = "none";
}

// Hallazgos - Cerrar modal
function closeFindingModal() {
  DOM.findingModal.style.display = "none";
}

// Hallazgos - Guardar
function handleFindingSubmit(e) {
  e.preventDefault();
  
  const id = DOM.findingIdInput.value || Date.now().toString();
  const findingData = {
    id,
    description: document.getElementById("finding-desc").value.trim(),
    type: document.getElementById("finding-type").value,
    priority: document.getElementById("finding-priority").value,
    status: document.getElementById("finding-status").value,
    date: document.getElementById("finding-date").value,
    responsible: document.getElementById("finding-responsible").value.trim()
  };
  
  // Validación
  if (!findingData.description || !findingData.responsible) {
    alert("Por favor complete todos los campos requeridos");
    return;
  }
  
  // Actualizar o añadir hallazgo
  const existingIndex = state.findings.findIndex(f => f.id === id);
  if (existingIndex >= 0) {
    state.findings[existingIndex] = findingData;
  } else {
    state.findings.push(findingData);
  }
  
  // Guardar y actualizar
  saveUserData();
  renderFindings();
  updateCharts();
  updateDashboardMetrics();
  closeFindingModal();
}

// Hallazgos - Renderizar lista
function renderFindings() {
  DOM.findingsList.innerHTML = "";
  
  state.findings.forEach(finding => {
    const findingElement = document.createElement("div");
    findingElement.className = "finding-card";
    
    findingElement.innerHTML = `
      <div class="finding-info">
        <h3>${finding.description}</h3>
        <div class="finding-meta">
          <span class="badge ${getTypeClass(finding.type)}">${finding.type}</span>
          <span class="badge ${getPriorityClass(finding.priority)}">${finding.priority}</span>
          <span class="badge ${getStatusClass(finding.status)}">${finding.status}</span>
          <span><i class="fas fa-user-tie"></i> ${finding.responsible}</span>
          <span><i class="fas fa-calendar-alt"></i> ${formatDate(finding.date)}</span>
        </div>
      </div>
      <div class="finding-actions">
        <button onclick="app.editFinding('${finding.id}')"><i class="fas fa-edit"></i></button>
        <button onclick="app.deleteFinding('${finding.id}')"><i class="fas fa-trash"></i></button>
      </div>
    `;
    
    DOM.findingsList.appendChild(findingElement);
  });
}

// Funciones helper para clases CSS
function getTypeClass(type) {
  return type.toLowerCase() === "seguridad" ? "security" : 
         type.toLowerCase() === "proceso" ? "process" : "tech";
}

function getPriorityClass(priority) {
  return priority.toLowerCase() === "alta" ? "high" : 
         priority.toLowerCase() === "media" ? "medium" : "low";
}

function getStatusClass(status) {
  return status.toLowerCase() === "pendiente" ? "pending" : 
         status.toLowerCase() === "en proceso" ? "in-progress" : "completed";
}

function formatDate(dateStr) {
  if (!dateStr) return "Sin fecha";
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES");
}

// Gráficos
function initCharts() {
  state.charts.status = new Chart(DOM.statusChart, {
    type: "doughnut",
    data: getChartData("status"),
    options: getChartOptions("Hallazgos por Estado")
  });
  
  state.charts.priority = new Chart(DOM.priorityChart, {
    type: "bar",
    data: getChartData("priority"),
    options: getChartOptions("Hallazgos por Prioridad")
  });
  
  state.charts.timeline = new Chart(DOM.timelineChart, {
    type: "line",
    data: getTimelineChartData(),
    options: getChartOptions("Hallazgos por Mes", true)
  });
  
  state.charts.radar = new Chart(DOM.radarChart, {
    type: "radar",
    data: getRadarChartData(),
    options: getChartOptions("Distribución de Riesgos", true)
  });
}

function updateCharts() {
  state.charts.status.data = getChartData("status");
  state.charts.priority.data = getChartData("priority");
  state.charts.timeline.data = getTimelineChartData();
  state.charts.radar.data = getRadarChartData();
  
  state.charts.status.update();
  state.charts.priority.update();
  state.charts.timeline.update();
  state.charts.radar.update();
}

function getChartData(type) {
  if (type === "status") {
    const statuses = ["Pendiente", "En Proceso", "Finalizada"];
    const counts = statuses.map(status => 
      state.findings.filter(f => f.status === status).length
    );
    
    return {
      labels: statuses,
      datasets: [{
        data: counts,
        backgroundColor: [
          "#ff9e00", // Pendiente
          "#3498db", // En Proceso
          "#2ecc71"  // Finalizada
        ]
      }]
    };
  } else {
    const priorities = ["Alta", "Media", "Baja"];
    const counts = priorities.map(priority => 
      state.findings.filter(f => f.priority === priority).length
    );
    
    return {
      labels: priorities,
      datasets: [{
        label: "Cantidad",
        data: counts,
        backgroundColor: [
          "#e74c3c", // Alta
          "#f39c12", // Media
          "#2ecc71"  // Baja
        ]
      }]
    };
  }
}

function getTimelineChartData() {
  // Agrupar hallazgos por mes
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const currentYear = new Date().getFullYear();
  
  const monthlyData = Array(12).fill(0);
  
  state.findings.forEach(finding => {
    const date = new Date(finding.date);
    if (date.getFullYear() === currentYear) {
      monthlyData[date.getMonth()]++;
    }
  });
  
  return {
    labels: months,
    datasets: [{
      label: "Hallazgos",
      data: monthlyData,
      borderColor: "#3498db",
      backgroundColor: "rgba(52, 152, 219, 0.1)",
      fill: true,
      tension: 0.4
    }]
  };
}

function getRadarChartData() {
  const categories = ["Seguridad", "Operacional", "Legal", "Financiero", "Reputacional"];
  const riskLevels = categories.map(cat => 
    state.risks.filter(r => r.category === cat).length
  );
  
  return {
    labels: categories,
    datasets: [{
      label: "Riesgos por Categoría",
      data: riskLevels,
      backgroundColor: "rgba(231, 76, 60, 0.2)",
      borderColor: "#e74c3c",
      pointBackgroundColor: "#e74c3c",
      pointBorderColor: "#fff",
      pointHoverBackgroundColor: "#fff",
      pointHoverBorderColor: "#e74c3c"
    }]
  };
}

function getChartOptions(title, isAdvanced = false) {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: title,
        color: "#ecf0f1",
        font: {
          size: 16
        }
      },
      legend: {
        labels: {
          color: "#ecf0f1"
        }
      }
    }
  };
  
  if (isAdvanced) {
    return {
      ...baseOptions,
      scales: {
        r: {
          angleLines: {
            color: "rgba(236, 240, 241, 0.1)"
          },
          grid: {
            color: "rgba(236, 240, 241, 0.1)"
          },
          pointLabels: {
            color: "#ecf0f1"
          },
          ticks: {
            backdropColor: "transparent",
            color: "#ecf0f1"
          }
        },
        y: {
          ticks: {
            color: "#ecf0f1",
            precision: 0
          },
          grid: {
            color: "rgba(236, 240, 241, 0.1)"
          }
        },
        x: {
          ticks: {
            color: "#ecf0f1"
          },
          grid: {
            color: "rgba(236, 240, 241, 0.1)"
          }
        }
      }
    };
  } else {
    return {
      ...baseOptions,
      scales: {
        y: {
          ticks: {
            color: "#ecf0f1",
            precision: 0
          },
          grid: {
            color: "rgba(236, 240, 241, 0.1)"
          }
        },
        x: {
          ticks: {
            color: "#ecf0f1"
          },
          grid: {
            color: "rgba(236, 240, 241, 0.1)"
          }
        }
      }
    };
  }
}

// Exportar a PDF
function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Título del documento
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text(`Reporte de Hallazgos - ${state.companyName}`, 14, 20);
  
  // Información de la auditoría
  doc.setFontSize(12);
  doc.text(`Generado por: ${state.currentUser.name}`, 14, 30);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 14, 36);
  doc.text(`Total de hallazgos: ${state.findings.length}`, 14, 42);
  
  // Configuración de la tabla
  const headers = [["Descripción", "Tipo", "Prioridad", "Estado", "Responsable", "Fecha Límite"]];
  const data = state.findings.map(finding => [
    finding.description,
    finding.type,
    finding.priority,
    finding.status,
    finding.responsible,
    formatDate(finding.date)
  ]);
  
  // Añadir tabla
  doc.autoTable({
    startY: 50,
    head: headers,
    body: data,
    theme: 'grid',
    headStyles: {
      fillColor: [44, 62, 80],
      textColor: 255
    },
    alternateRowStyles: {
      fillColor: [236, 240, 241]
    },
    styles: {
      cellPadding: 3,
      fontSize: 10,
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { cellWidth: 60 }, // Descripción
      1: { cellWidth: 20 }, // Tipo
      2: { cellWidth: 20 }, // Prioridad
      3: { cellWidth: 25 }, // Estado
      4: { cellWidth: 30 }, // Responsable
      5: { cellWidth: 25 }  // Fecha
    }
  });
  
  // Guardar el PDF
  doc.save(`Hallazgos_${state.companyName}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Exportar datos para Power BI
function exportToPowerBI() {
  // Preparar datos estructurados
  const exportData = {
    metadata: {
      empresa: state.companyName,
      auditor: state.currentUser.name,
      fechaExportacion: new Date().toISOString(),
      totalHallazgos: state.findings.length
    },
    hallazgos: state.findings.map(f => ({
      ...f,
      prioridadNumerica: f.priority === "Alta" ? 3 : f.priority === "Media" ? 2 : 1,
      estadoNumerico: f.status === "Pendiente" ? 1 : f.status === "En Proceso" ? 2 : 3
    })),
    resumenGraficos: {
      status: getChartData("status"),
      priority: getChartData("priority")
    }
  };

  // Convertir a JSON
  const jsonData = JSON.stringify(exportData, null, 2);
  
  // Crear blob y descargar
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Datos_PowerBI_${state.companyName}_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Checklist - Guardar
function saveChecklist() {
  // Guardar estado de checkboxes
  const checkboxes = document.querySelectorAll('.checklist-checkbox');
  
  checkboxes.forEach(checkbox => {
    const id = checkbox.id;
    if (id.startsWith('iso')) {
      state.checklist.iso[id] = checkbox.checked;
    } else if (id.startsWith('cobit')) {
      state.checklist.cobit[id] = checkbox.checked;
    } else if (id.startsWith('ens')) {
      state.checklist.ens[id] = checkbox.checked;
    }
  });
  
  // Guardar diagnósticos
  state.checklist.diagnostics = {
    strengths: document.getElementById("strengths").value,
    improvements: document.getElementById("improvements").value,
    recommendations: document.getElementById("recommendations").value
  };
  
  saveUserData();
  alert("Checklist guardado correctamente");
}

// Checklist - Exportar
function exportChecklist() {
  // Preparar datos para exportación
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Título
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text(`Checklist de Auditoría - ${state.companyName}`, 14, 20);
  
  // Información
  doc.setFontSize(12);
  doc.text(`Auditor: ${state.currentUser.name}`, 14, 30);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 14, 36);
  
  // ISO 27001
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 255);
  doc.text("ISO 27001 - Seguridad de la Información", 14, 50);
  
  // Añadir checklist ISO
  const isoItems = [
    ["✓", "Existe política de seguridad documentada y aprobada", state.checklist.iso["iso1"] ? "Sí" : "No"],
    ["✓", "La política se revisa anualmente", state.checklist.iso["iso2"] ? "Sí" : "No"],
    ["✓", "Evaluación de riesgos formal anual", state.checklist.iso["iso3"] ? "Sí" : "No"]
  ];
  
  doc.autoTable({
    startY: 60,
    head: [["", "Item", "Cumple"]],
    body: isoItems,
    theme: 'grid',
    headStyles: {
      fillColor: [44, 62, 80],
      textColor: 255
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 120 },
      2: { cellWidth: 30 }
    }
  });
  
  // COBIT
  doc.setTextColor(0, 0, 255);
  doc.text("COBIT 2019 - Gobierno TI", 14, doc.autoTable.previous.finalY + 20);
  
  const cobitItems = [
    ["✓", "Existe comité de gobierno de TI", state.checklist.cobit["cobit1"] ? "Sí" : "No"],
    ["✓", "Objetivos de TI alineados con negocio", state.checklist.cobit["cobit2"] ? "Sí" : "No"]
  ];
  
  doc.autoTable({
    startY: doc.autoTable.previous.finalY + 30,
    head: [["", "Item", "Cumple"]],
    body: cobitItems,
    theme: 'grid',
    headStyles: {
      fillColor: [44, 62, 80],
      textColor: 255
    }
  });
  
  // Diagnósticos
  doc.setTextColor(0, 0, 255);
  doc.text("Diagnósticos Finales", 14, doc.autoTable.previous.finalY + 20);
  
  const diagnostics = [
    ["Fortalezas:", state.checklist.diagnostics.strengths],
    ["Áreas de Mejora:", state.checklist.diagnostics.improvements],
    ["Recomendaciones:", state.checklist.diagnostics.recommendations]
  ];
  
  doc.autoTable({
    startY: doc.autoTable.previous.finalY + 30,
    body: diagnostics,
    theme: 'grid',
    columnStyles: {
      0: { cellWidth: 40, fontStyle: 'bold' },
      1: { cellWidth: 120 }
    }
  });
  
  // Guardar el PDF
  doc.save(`Checklist_${state.companyName}_${new Date().toISOString().split('T')[0]}.pdf`);
}

/* ============================================= */
/* Módulo de Planificación de Auditoría */
/* ============================================= */

// Abrir modal de plan
function openPlanModal(id = null) {
  if (id) {
    // Modo edición
    DOM.planModalTitle.innerHTML = '<i class="fas fa-edit"></i> Editar Plan de Auditoría';
    const plan = state.auditPlans.find(p => p.id === id);
    if (plan) {
      DOM.planIdInput.value = plan.id;
      document.getElementById("plan-name").value = plan.name;
      document.getElementById("plan-start").value = plan.startDate;
      document.getElementById("plan-end").value = plan.endDate;
      document.getElementById("plan-scope").value = plan.scope;
      document.getElementById("plan-methodology").value = plan.methodology;
      document.getElementById("plan-responsible").value = plan.responsible;
    }
  } else {
    // Modo nuevo
    DOM.planModalTitle.innerHTML = '<i class="fas fa-calendar-plus"></i> Nuevo Plan de Auditoría';
    DOM.planForm.reset();
    DOM.planIdInput.value = "";
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("plan-start").value = today;
  }
  
  DOM.planModal.style.display = "flex";
}

// Cerrar modal de plan
function closePlanModal() {
  DOM.planModal.style.display = "none";
}

// Guardar plan de auditoría
function handlePlanSubmit(e) {
  e.preventDefault();
  
  const id = DOM.planIdInput.value || Date.now().toString();
  const planData = {
    id,
    name: document.getElementById("plan-name").value.trim(),
    startDate: document.getElementById("plan-start").value,
    endDate: document.getElementById("plan-end").value,
    scope: document.getElementById("plan-scope").value.trim(),
    methodology: document.getElementById("plan-methodology").value,
    responsible: document.getElementById("plan-responsible").value.trim(),
    createdAt: new Date().toISOString()
  };
  
  // Validación
  if (!planData.name || !planData.scope || !planData.responsible) {
    alert("Por favor complete todos los campos requeridos");
    return;
  }
  
  // Validar fechas
  if (new Date(planData.startDate) > new Date(planData.endDate)) {
    alert("La fecha de inicio no puede ser posterior a la fecha de fin");
    return;
  }
  
  // Actualizar o añadir plan
  const existingIndex = state.auditPlans.findIndex(p => p.id === id);
  if (existingIndex >= 0) {
    state.auditPlans[existingIndex] = planData;
  } else {
    state.auditPlans.push(planData);
  }
  
  // Guardar y actualizar
  saveUserData();
  renderPlans();
  updateDashboardMetrics();
  closePlanModal();
}

// Renderizar lista de planes
function renderPlans() {
  DOM.plansList.innerHTML = "";
  
  // Ordenar planes por fecha de inicio (más recientes primero)
  const sortedPlans = [...state.auditPlans].sort((a, b) => 
    new Date(b.startDate) - new Date(a.startDate)
  );
  
  sortedPlans.forEach(plan => {
    const planElement = document.createElement("div");
    planElement.className = "plan-card";
    
    // Determinar estado del plan
    const today = new Date();
    const startDate = new Date(plan.startDate);
    const endDate = new Date(plan.endDate);
    
    let status = "Pendiente";
    let statusClass = "pending";
    
    if (today >= startDate && today <= endDate) {
      status = "En Curso";
      statusClass = "in-progress";
    } else if (today > endDate) {
      status = "Completado";
      statusClass = "completed";
    }
    
    planElement.innerHTML = `
      <div class="plan-info">
        <h3>${plan.name}</h3>
        <div class="plan-meta">
          <span><i class="fas fa-calendar-day"></i> ${formatDate(plan.startDate)} - ${formatDate(plan.endDate)}</span>
          <span><i class="fas fa-project-diagram"></i> ${plan.methodology}</span>
          <span><i class="fas fa-user-tie"></i> ${plan.responsible}</span>
          <span class="badge ${statusClass}">${status}</span>
        </div>
        <p>${plan.scope}</p>
      </div>
      <div class="plan-actions">
        <button onclick="app.editPlan('${plan.id}')"><i class="fas fa-edit"></i></button>
        <button onclick="app.deletePlan('${plan.id}')"><i class="fas fa-trash"></i></button>
      </div>
    `;
    
    DOM.plansList.appendChild(planElement);
  });
}

// Exportar plan a PDF
function exportPlanToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Título del documento
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text(`Planes de Auditoría - ${state.companyName}`, 14, 20);
  
  // Información
  doc.setFontSize(12);
  doc.text(`Generado por: ${state.currentUser.name}`, 14, 30);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 14, 36);
  doc.text(`Total de planes: ${state.auditPlans.length}`, 14, 42);
  
  // Configuración de la tabla
  const headers = [["Nombre", "Fechas", "Metodología", "Responsable", "Estado"]];
  const data = state.auditPlans.map(plan => {
    const today = new Date();
    const startDate = new Date(plan.startDate);
    const endDate = new Date(plan.endDate);
    
    let status = "Pendiente";
    if (today >= startDate && today <= endDate) status = "En Curso";
    else if (today > endDate) status = "Completado";
    
    return [
      plan.name,
      `${formatDate(plan.startDate)} - ${formatDate(plan.endDate)}`,
      plan.methodology,
      plan.responsible,
      status
    ];
  });
  
  // Añadir tabla
  doc.autoTable({
    startY: 50,
    head: headers,
    body: data,
    theme: 'grid',
    headStyles: {
      fillColor: [44, 62, 80],
      textColor: 255
    },
    alternateRowStyles: {
      fillColor: [236, 240, 241]
    },
    styles: {
      cellPadding: 3,
      fontSize: 10,
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { cellWidth: 40 }, // Nombre
      1: { cellWidth: 30 }, // Fechas
      2: { cellWidth: 30 }, // Metodología
      3: { cellWidth: 30 }, // Responsable
      4: { cellWidth: 20 }  // Estado
    }
  });
  
  // Guardar el PDF
  doc.save(`Planes_Auditoria_${state.companyName}_${new Date().toISOString().split('T')[0]}.pdf`);
}

/* ============================================= */
/* Módulo de Matriz de Riesgos */
/* ============================================= */

// Inicializar matriz de riesgos
function initRiskMatrix() {
  // Limpiar matriz
  DOM.matrixGrid.innerHTML = "";
  
  // Probabilidades (filas)
  const probabilities = ["Baja", "Media", "Alta"];
  // Impactos (columnas)
  const impacts = ["Bajo", "Moderado", "Alto", "Crítico"];
  
  // Crear celdas de la matriz
  for (let row = 0; row < probabilities.length; row++) {
    for (let col = 0; col < impacts.length; col++) {
      const cell = document.createElement("div");
      cell.className = "matrix-cell";
      
      // Añadir clase según el nivel de riesgo
      if (col >= 2 && row >= 1) cell.classList.add("high-impact");
      else if (col >= 1 && row >= 1) cell.classList.add("medium-impact");
      else cell.classList.add("low-impact");
      
      // Posicionar etiquetas
      if (row === 0 && col === 0) {
        const impactLabel = document.createElement("div");
        impactLabel.className = "matrix-label impact";
        impactLabel.textContent = "Impacto →";
        cell.appendChild(impactLabel);
        
        const probLabel = document.createElement("div");
        probLabel.className = "matrix-label probability";
        probLabel.textContent = "Probabilidad ↓";
        cell.appendChild(probLabel);
      } else if (row === 0) {
        cell.textContent = impacts[col];
      } else if (col === 0) {
        cell.textContent = probabilities[row - 1];
      }
      
      DOM.matrixGrid.appendChild(cell);
    }
  }
  
  // Renderizar riesgos en la matriz
  renderRisksInMatrix();
}

// Renderizar riesgos en la matriz
function renderRisksInMatrix() {
  // Limpiar marcadores existentes
  document.querySelectorAll('.risk-marker').forEach(marker => marker.remove());
  
  // Agrupar riesgos por posición en la matriz
  const riskGroups = {};
  
  state.risks.forEach(risk => {
    const probIndex = risk.probability === "Baja" ? 1 : risk.probability === "Media" ? 2 : 3;
    const impactIndex = risk.impact === "Bajo" ? 1 : risk.impact === "Moderado" ? 2 : 
                      risk.impact === "Alto" ? 3 : 4;
    
    const key = `${probIndex}-${impactIndex}`;
    if (!riskGroups[key]) riskGroups[key] = [];
    riskGroups[key].push(risk);
  });
  
  // Añadir marcadores a la matriz
  for (const [key, risks] of Object.entries(riskGroups)) {
    const [probIndex, impactIndex] = key.split('-').map(Number);
    // Las celdas están indexadas desde 0, pero la primera fila y columna son etiquetas
    const cellIndex = (probIndex - 1) * 4 + impactIndex;
    const cell = DOM.matrixGrid.children[cellIndex];
    
    if (cell) {
      const marker = document.createElement("div");
      marker.className = "risk-marker";
      marker.textContent = risks.length;
      marker.title = risks.map(r => r.name).join("\n");
      marker.style.backgroundColor = risks.length > 3 ? "#e74c3c" : 
                                   risks.length > 1 ? "#f39c12" : "#2ecc71";
      marker.onclick = () => highlightRisks(risks.map(r => r.id));
      
      cell.appendChild(marker);
    }
  }
}

// Resaltar riesgos en la lista
function highlightRisks(riskIds) {
  document.querySelectorAll('.risk-card').forEach(card => {
    if (riskIds.includes(card.dataset.id)) {
      card.style.border = "2px solid #f39c12";
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      card.style.border = "";
    }
  });
}

// Abrir modal de riesgo
function openRiskModal(id = null) {
  if (id) {
    // Modo edición
    DOM.riskModalTitle.innerHTML = '<i class="fas fa-edit"></i> Editar Riesgo';
    const risk = state.risks.find(r => r.id === id);
    if (risk) {
      DOM.riskIdInput.value = risk.id;
      document.getElementById("risk-name").value = risk.name;
      document.getElementById("risk-description").value = risk.description;
      document.getElementById("risk-probability").value = risk.probability;
      document.getElementById("risk-impact").value = risk.impact;
      document.getElementById("risk-category").value = risk.category;
      document.getElementById("risk-mitigation").value = risk.mitigation;
    }
  } else {
    // Modo nuevo
    DOM.riskModalTitle.innerHTML = '<i class="fas fa-radiation-alt"></i> Nuevo Riesgo';
    DOM.riskForm.reset();
    DOM.riskIdInput.value = "";
  }
  
  DOM.riskModal.style.display = "flex";
}

// Cerrar modal de riesgo
function closeRiskModal() {
  DOM.riskModal.style.display = "none";
}

// Guardar riesgo
function handleRiskSubmit(e) {
  e.preventDefault();
  
  const id = DOM.riskIdInput.value || Date.now().toString();
  const riskData = {
    id,
    name: document.getElementById("risk-name").value.trim(),
    description: document.getElementById("risk-description").value.trim(),
    probability: document.getElementById("risk-probability").value,
    impact: document.getElementById("risk-impact").value,
    category: document.getElementById("risk-category").value,
    mitigation: document.getElementById("risk-mitigation").value.trim(),
    createdAt: new Date().toISOString()
  };
  
  // Validación
  if (!riskData.name || !riskData.description || !riskData.mitigation) {
    alert("Por favor complete todos los campos requeridos");
    return;
  }
  
  // Actualizar o añadir riesgo
  const existingIndex = state.risks.findIndex(r => r.id === id);
  if (existingIndex >= 0) {
    state.risks[existingIndex] = riskData;
  } else {
    state.risks.push(riskData);
  }
  
  // Guardar y actualizar
  saveUserData();
  renderRisks();
  updateDashboardMetrics();
  closeRiskModal();
}

// Renderizar lista de riesgos
function renderRisks() {
  DOM.risksList.innerHTML = "";
  
  // Ordenar riesgos por nivel (probabilidad * impacto)
  const sortedRisks = [...state.risks].sort((a, b) => {
    const aScore = getRiskScore(a);
    const bScore = getRiskScore(b);
    return bScore - aScore;
  });
  
  sortedRisks.forEach(risk => {
    const riskElement = document.createElement("div");
    riskElement.className = "risk-card";
    riskElement.dataset.id = risk.id;
    
    const score = getRiskScore(risk);
    const scoreClass = score >= 9 ? "high" : score >= 4 ? "medium" : "low";
    
    riskElement.innerHTML = `
      <div class="risk-info">
        <h3>${risk.name}</h3>
        <div class="risk-meta">
          <span class="badge ${scoreClass}">Nivel: ${score}</span>
          <span><i class="fas fa-chart-line"></i> Probabilidad: ${risk.probability}</span>
          <span><i class="fas fa-bomb"></i> Impacto: ${risk.impact}</span>
          <span><i class="fas fa-filter"></i> ${risk.category}</span>
          <span><i class="fas fa-calendar-alt"></i> ${formatDate(risk.createdAt)}</span>
        </div>
        <p><strong>Descripción:</strong> ${risk.description}</p>
        <p><strong>Mitigación:</strong> ${risk.mitigation}</p>
      </div>
      <div class="risk-actions">
        <button onclick="app.editRisk('${risk.id}')"><i class="fas fa-edit"></i></button>
        <button onclick="app.deleteRisk('${risk.id}')"><i class="fas fa-trash"></i></button>
      </div>
    `;
    
    DOM.risksList.appendChild(riskElement);
  });
  
  // Actualizar matriz
  renderRisksInMatrix();
}

// Calcular puntuación de riesgo
function getRiskScore(risk) {
  const probScore = risk.probability === "Baja" ? 1 : risk.probability === "Media" ? 2 : 3;
  const impactScore = risk.impact === "Bajo" ? 1 : risk.impact === "Moderado" ? 2 : 
                     risk.impact === "Alto" ? 3 : 4;
  return probScore * impactScore;
}

// Exportar matriz de riesgos
function exportRiskMatrix() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Título del documento
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text(`Matriz de Riesgos - ${state.companyName}`, 14, 20);
  
  // Información
  doc.setFontSize(12);
  doc.text(`Generado por: ${state.currentUser.name}`, 14, 30);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 14, 36);
  doc.text(`Total de riesgos: ${state.risks.length}`, 14, 42);
  
  // Dibujar matriz
  const startX = 20;
  const startY = 50;
  const cellWidth = 40;
  const cellHeight = 20;
  
  // Encabezados
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  
  // Probabilidad (vertical)
  doc.text("Probabilidad", startX - 10, startY + cellHeight * 1.5, { angle: 90 });
  
  // Impacto (horizontal)
  doc.text("Impacto →", startX + cellWidth * 1.5, startY - 5);
  
  // Celdas
  const probabilities = ["Baja", "Media", "Alta"];
  const impacts = ["Bajo", "Moderado", "Alto", "Crítico"];
  
  // Colores según nivel de riesgo
  const getColor = (row, col) => {
    if (row >= 1 && col >= 2) return [231, 76, 60];   // Rojo (alto)
    if (row >= 1 && col >= 1) return [243, 156, 18];  // Amarillo (medio)
    return [46, 204, 113];                            // Verde (bajo)
  };
  
  // Dibujar matriz
  for (let row = 0; row <= probabilities.length; row++) {
    for (let col = 0; col <= impacts.length; col++) {
      // Bordes
      doc.rect(
        startX + col * cellWidth, 
        startY + row * cellHeight, 
        cellWidth, 
        cellHeight
      );
      
      // Contenido de las celdas
      if (row === 0 && col === 0) {
        // Celda vacía en la esquina
      } else if (row === 0) {
        // Encabezados de impacto
        doc.setTextColor(0, 0, 0);
        doc.text(
          impacts[col - 1], 
          startX + col * cellWidth + cellWidth / 2, 
          startY + row * cellHeight + cellHeight / 2,
          { align: 'center', baseline: 'middle' }
        );
      } else if (col === 0) {
        // Encabezados de probabilidad
        doc.setTextColor(0, 0, 0);
        doc.text(
          probabilities[row - 1], 
          startX + col * cellWidth + cellWidth / 2, 
          startY + row * cellHeight + cellHeight / 2,
          { align: 'center', baseline: 'middle' }
        );
      } else {
        // Celdas de riesgo
        const color = getColor(row - 1, col - 1);
        doc.setFillColor(color[0], color[1], color[2]);
        doc.rect(
          startX + col * cellWidth, 
          startY + row * cellHeight, 
          cellWidth, 
          cellHeight,
          'F'
        );
        
        // Contar riesgos en esta celda
        const count = state.risks.filter(r => {
          const probIndex = r.probability === "Baja" ? 0 : r.probability === "Media" ? 1 : 2;
          const impactIndex = r.impact === "Bajo" ? 0 : r.impact === "Moderado" ? 1 : 
                            r.impact === "Alto" ? 2 : 3;
          return probIndex === row - 1 && impactIndex === col - 1;
        }).length;
        
        if (count > 0) {
          doc.setTextColor(255, 255, 255);
          doc.text(
            count.toString(), 
            startX + col * cellWidth + cellWidth / 2, 
            startY + row * cellHeight + cellHeight / 2,
            { align: 'center', baseline: 'middle' }
          );
        }
      }
    }
  }
  
  // Leyenda
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("Leyenda:", 14, startY + cellHeight * 4 + 20);
  
  doc.setFillColor(46, 204, 113);
  doc.rect(14, startY + cellHeight * 4 + 30, 10, 10, 'F');
  doc.text("Riesgo Bajo", 26, startY + cellHeight * 4 + 35);
  
  doc.setFillColor(243, 156, 18);
  doc.rect(14, startY + cellHeight * 4 + 45, 10, 10, 'F');
  doc.text("Riesgo Medio", 26, startY + cellHeight * 4 + 50);
  
  doc.setFillColor(231, 76, 60);
  doc.rect(14, startY + cellHeight * 4 + 60, 10, 10, 'F');
  doc.text("Riesgo Alto", 26, startY + cellHeight * 4 + 65);
  
  // Lista de riesgos
  doc.setFontSize(14);
  doc.text("Lista de Riesgos", 14, startY + cellHeight * 4 + 85);
  
  const headers = [["Nombre", "Probabilidad", "Impacto", "Categoría", "Nivel"]];
  const data = state.risks.map(risk => {
    const score = getRiskScore(risk);
    return [
      risk.name,
      risk.probability,
      risk.impact,
      risk.category,
      score.toString()
    ];
  });
  
  doc.autoTable({
    startY: startY + cellHeight * 4 + 90,
    head: headers,
    body: data,
    theme: 'grid',
    headStyles: {
      fillColor: [44, 62, 80],
      textColor: 255
    },
    alternateRowStyles: {
      fillColor: [236, 240, 241]
    },
    columnStyles: {
      0: { cellWidth: 40 }, // Nombre
      1: { cellWidth: 25 }, // Probabilidad
      2: { cellWidth: 25 }, // Impacto
      3: { cellWidth: 25 }, // Categoría
      4: { cellWidth: 15 }  // Nivel
    }
  });
  
  // Guardar el PDF
  doc.save(`Matriz_Riesgos_${state.companyName}_${new Date().toISOString().split('T')[0]}.pdf`);
}

/* ============================================= */
/* Función de Diagnóstico Completo */
/* ============================================= */

function generateCompleteDiagnostic() {
  if (!state.currentUser) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Configuración inicial del documento
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text(`Diagnóstico Completo de Auditoría - ${state.companyName}`, 14, 20);
  
  doc.setFontSize(12);
  doc.text(`Generado por: ${state.currentUser.name}`, 14, 30);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 14, 36);
  
  // Resumen ejecutivo
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 255);
  doc.text("Resumen Ejecutivo", 14, 50);
  
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  const executiveSummary = `Este documento presenta un diagnóstico completo de la auditoría realizada a ${state.companyName}, 
  incluyendo hallazgos, riesgos identificados, estado de cumplimiento de normativas y recomendaciones.`;
  doc.text(executiveSummary, 14, 60, { maxWidth: 180 });
  
  // Metodología y alcance
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 255);
  doc.text("Metodología y Alcance", 14, 80);
  
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  const methodologyText = `La auditoría se realizó utilizando una combinación de metodologías según los planes establecidos:
  ${state.auditPlans.map(p => p.methodology).filter((v, i, a) => a.indexOf(v) === i).join(", ")}.`;
  doc.text(methodologyText, 14, 90, { maxWidth: 180 });
  
  // Hallazgos principales
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 255);
  doc.text("Hallazgos Principales", 14, 110);
  
  const findingsSummary = [
    ["Total Hallazgos", state.findings.length],
    ["Pendientes", state.findings.filter(f => f.status === "Pendiente").length],
    ["En Proceso", state.findings.filter(f => f.status === "En Proceso").length],
    ["Finalizados", state.findings.filter(f => f.status === "Finalizada").length]
  ];
  
  doc.autoTable({
    startY: 120,
    head: [["Categoría", "Cantidad"]],
    body: findingsSummary,
    theme: 'grid',
    headStyles: {
      fillColor: [44, 62, 80],
      textColor: 255
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 30 }
    }
  });
  
  // Hallazgos críticos
  const criticalFindings = state.findings.filter(f => f.priority === "Alta");
  if (criticalFindings.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Hallazgos Críticos:", 14, doc.autoTable.previous.finalY + 10);
    
    criticalFindings.forEach((finding, index) => {
      doc.text(`${index + 1}. ${finding.description} (${finding.type})`, 20, doc.autoTable.previous.finalY + 20 + (index * 10));
    });
  }
  
  // Riesgos identificados
  doc.addPage();
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 255);
  doc.text("Riesgos Identificados", 14, 20);
  
  const risksSummary = [
    ["Total Riesgos", state.risks.length],
    ["Alto", state.risks.filter(r => getRiskScore(r) >= 9).length],
    ["Medio", state.risks.filter(r => getRiskScore(r) >= 4 && getRiskScore(r) < 9).length],
    ["Bajo", state.risks.filter(r => getRiskScore(r) < 4).length]
  ];
  
  doc.autoTable({
    startY: 30,
    head: [["Nivel de Riesgo", "Cantidad"]],
    body: risksSummary,
    theme: 'grid',
    headStyles: {
      fillColor: [44, 62, 80],
      textColor: 255
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 30 }
    }
  });
  
  // Riesgos más significativos
  const significantRisks = [...state.risks].sort((a, b) => getRiskScore(b) - getRiskScore(a)).slice(0, 5);
  if (significantRisks.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Riesgos más significativos:", 14, doc.autoTable.previous.finalY + 10);
    
    significantRisks.forEach((risk, index) => {
      const yPos = doc.autoTable.previous.finalY + 20 + (index * 20);
      doc.text(`${index + 1}. ${risk.name} (Nivel: ${getRiskScore(risk)})`, 20, yPos);
      doc.text(`   - ${risk.description}`, 20, yPos + 5);
      doc.text(`   - Mitigación: ${risk.mitigation}`, 20, yPos + 10);
    });
  }
  
  // Cumplimiento de normativas
  doc.addPage();
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 255);
  doc.text("Cumplimiento de Normativas", 14, 20);
  
  // ISO 27001
  doc.setFontSize(12);
  doc.text("ISO 27001 - Seguridad de la Información", 14, 30);
  
  const isoItems = [
    ["Política de seguridad documentada", state.checklist.iso["iso1"] ? "Cumple" : "No cumple"],
    ["Revisión anual de políticas", state.checklist.iso["iso2"] ? "Cumple" : "No cumple"],
    ["Evaluación formal de riesgos", state.checklist.iso["iso3"] ? "Cumple" : "No cumple"]
  ];
  
  doc.autoTable({
    startY: 40,
    body: isoItems,
    theme: 'grid',
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 30 }
    }
  });
  
  // COBIT
  doc.setFontSize(12);
  doc.text("COBIT 2019 - Gobierno TI", 14, doc.autoTable.previous.finalY + 10);
  
  const cobitItems = [
    ["Comité de gobierno de TI", state.checklist.cobit["cobit1"] ? "Cumple" : "No cumple"],
    ["Objetivos alineados con negocio", state.checklist.cobit["cobit2"] ? "Cumple" : "No cumple"]
  ];
  
  doc.autoTable({
    startY: doc.autoTable.previous.finalY + 20,
    body: cobitItems,
    theme: 'grid',
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 30 }
    }
  });
  
  // Diagnósticos y recomendaciones
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 255);
  doc.text("Diagnósticos y Recomendaciones", 14, doc.autoTable.previous.finalY + 20);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Fortalezas Identificadas:", 14, doc.autoTable.previous.finalY + 30);
  doc.text(state.checklist.diagnostics.strengths || "No se identificaron fortalezas", 20, doc.autoTable.previous.finalY + 40, { maxWidth: 180 });
  
  doc.text("Áreas de Mejora:", 14, doc.autoTable.previous.finalY + 60);
  doc.text(state.checklist.diagnostics.improvements || "No se identificaron áreas de mejora", 20, doc.autoTable.previous.finalY + 70, { maxWidth: 180 });
  
  doc.text("Recomendaciones:", 14, doc.autoTable.previous.finalY + 90);
  doc.text(state.checklist.diagnostics.recommendations || "No se generaron recomendaciones", 20, doc.autoTable.previous.finalY + 100, { maxWidth: 180 });
  
  // Conclusión
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 255);
  doc.text("Conclusión", 14, doc.autoTable.previous.finalY + 120);
  
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  const conclusion = `El presente diagnóstico representa una evaluación integral del estado de seguridad y gobernanza 
  de TI en ${state.companyName}. Se recomienda priorizar la atención a los hallazgos críticos y riesgos altos identificados, 
  así como implementar las recomendaciones proporcionadas para mejorar el cumplimiento normativo y la postura de seguridad.`;
  doc.text(conclusion, 14, doc.autoTable.previous.finalY + 130, { maxWidth: 180 });
  
  // Guardar el PDF
  doc.save(`Diagnostico_Auditoria_${state.companyName}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// API pública para los botones
const app = {
  editFinding: function(id) {
    openFindingModal(id);
  },
  deleteFinding: function(id) {
    if (confirm("¿Está seguro de eliminar este hallazgo?")) {
      state.findings = state.findings.filter(f => f.id !== id);
      saveUserData();
      renderFindings();
      updateCharts();
      updateDashboardMetrics();
    }
  },
  openChecklistModal: function() {
    openChecklistModal();
  },
  closeChecklistModal: function() {
    closeChecklistModal();
  },
  saveChecklist: function() {
    saveChecklist();
  },
  exportChecklist: function() {
    exportChecklist();
  },
  editPlan: function(id) {
    openPlanModal(id);
  },
  deletePlan: function(id) {
    if (confirm("¿Está seguro de eliminar este plan de auditoría?")) {
      state.auditPlans = state.auditPlans.filter(p => p.id !== id);
      saveUserData();
      renderPlans();
      updateDashboardMetrics();
    }
  },
  closePlanModal: function() {
    closePlanModal();
  },
  editRisk: function(id) {
    openRiskModal(id);
  },
  deleteRisk: function(id) {
    if (confirm("¿Está seguro de eliminar este riesgo?")) {
      state.risks = state.risks.filter(r => r.id !== id);
      saveUserData();
      renderRisks();
      updateDashboardMetrics();
    }
  },
  closeRiskModal: function() {
    closeRiskModal();
  }
};

// Iniciar la aplicación
document.addEventListener("DOMContentLoaded", init);