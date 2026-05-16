/* ============================================================
   MFN DUALITY STUDIO — main.js
   Módulos:
     1. Calendario
     2. Time Slots
     3. Formulario & Confirmación
     4. Toast
     5. Scroll — Fade-in de elementos
     6. Scroll — Nav activa
     7. Init
============================================================ */

'use strict';

/* ─────────────────────────────────────────────────────────
   1. CALENDARIO
───────────────────────────────────────────────────────── */

const MONTH_NAMES = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const calendarState = {
  year:        new Date().getFullYear(),
  month:       new Date().getMonth(),
  selectedDay: null,
};

/**
 * Renderiza el calendario en el DOM según el estado actual.
 */
function renderCalendar() {
  const calEl   = document.getElementById('calendar');
  const labelEl = document.getElementById('month-label');
  const today   = new Date();

  labelEl.textContent = `${MONTH_NAMES[calendarState.month]} ${calendarState.year}`;

  // Encabezados de días
  const headers = DAY_HEADERS
    .map(d => `<div class="cal-day-header">${d}</div>`)
    .join('');

  // Celdas vacías hasta el primer día del mes
  const firstWeekday  = new Date(calendarState.year, calendarState.month, 1).getDay();
  const daysInMonth   = new Date(calendarState.year, calendarState.month + 1, 0).getDate();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  let dayCells = '';

  for (let i = 0; i < firstWeekday; i++) {
    dayCells += '<div class="cal-day empty"></div>';
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date   = new Date(calendarState.year, calendarState.month, d);
    const isPast = date < todayMidnight;
    const isSel  = calendarState.selectedDay === d && !isPast;
    const isToday =
      d === today.getDate() &&
      calendarState.month === today.getMonth() &&
      calendarState.year  === today.getFullYear();

    const classes = [
      'cal-day',
      isPast             ? 'disabled'  : '',
      isSel              ? 'selected'  : '',
      isToday && !isSel  ? 'today'     : '',
    ]
      .filter(Boolean)
      .join(' ');

    dayCells += `<div class="${classes}" data-d="${d}">${d}</div>`;
  }

  calEl.innerHTML = headers + dayCells;

  // Eventos de click en días disponibles
  calEl.querySelectorAll('.cal-day:not(.empty):not(.disabled)').forEach(el => {
    el.addEventListener('click', () => {
      calEl.querySelectorAll('.cal-day').forEach(c => c.classList.remove('selected'));
      el.classList.add('selected');
      calendarState.selectedDay = parseInt(el.dataset.d, 10);
    });
  });
}

/**
 * Navega al mes anterior.
 */
function prevMonth() {
  calendarState.month--;
  if (calendarState.month < 0) {
    calendarState.month = 11;
    calendarState.year--;
  }
  calendarState.selectedDay = null;
  renderCalendar();
}

/**
 * Navega al mes siguiente.
 */
function nextMonth() {
  calendarState.month++;
  if (calendarState.month > 11) {
    calendarState.month = 0;
    calendarState.year++;
  }
  calendarState.selectedDay = null;
  renderCalendar();
}

/**
 * Inicializa el calendario y los botones de navegación.
 */
function initCalendar() {
  renderCalendar();
  document.getElementById('prev-month').addEventListener('click', prevMonth);
  document.getElementById('next-month').addEventListener('click', nextMonth);
}


/* ─────────────────────────────────────────────────────────
    2. TIME SLOTS
───────────────────────────────────────────────────────── */

let selectedTime = null;

/**
 * Inicializa los slots de horario con su lógica de selección.
 */
function initTimeSlots() {
  document.querySelectorAll('.time-slot:not(.taken)').forEach(slot => {
    slot.addEventListener('click', () => {
      document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
      slot.classList.add('selected');
      selectedTime = slot.dataset.t;
    });
  });
}

/**
 * Limpia la selección de horario.
 */
function clearTimeSelection() {
  selectedTime = null;
  document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
}


/* ─────────────────────────────────────────────────────────
    3. FORMULARIO & CONFIRMACIÓN
───────────────────────────────────────────────────────── */

/**
 * Valida los campos del formulario de contacto.
 * @returns {string|null} Mensaje de error, o null si es válido.
 */
function validateForm() {
  const name  = document.getElementById('inp-name').value.trim();
  const email = document.getElementById('inp-email').value.trim();
  const phone = document.getElementById('inp-phone').value.trim();

  if (!name || !email || !phone) {
    return 'Por favor completá tus datos de contacto.';
  }
  if (!calendarState.selectedDay) {
    return 'Por favor seleccioná un día en el calendario.';
  }
  if (!selectedTime) {
    return 'Por favor seleccioná un horario disponible.';
  }
  return null;
}

/**
 * Limpia todos los campos del formulario de contacto.
 */
function clearContactForm() {
  ['inp-name', 'inp-email', 'inp-phone'].forEach(id => {
    document.getElementById(id).value = '';
  });
}

/**
 * Maneja el evento de confirmación de turno.
 */
function handleConfirm() {
  const error = validateForm();

  if (error) {
    showToast(error, true);
    return;
  }

  const message = `¡Turno reservado: ${MONTH_NAMES[calendarState.month]} ${calendarState.selectedDay} a las ${selectedTime}!`;
  showToast(message, false);

  // Reset del estado
  clearContactForm();
  calendarState.selectedDay = null;
  renderCalendar();
  clearTimeSelection();
}

/**
 * Inicializa el botón de confirmación.
 */
function initBookingForm() {
  document.getElementById('confirm-btn').addEventListener('click', handleConfirm);
}


/* ─────────────────────────────────────────────────────────
   4. TOAST
───────────────────────────────────────────────────────── */

let toastTimeout = null;

/**
 * Muestra un mensaje toast temporalmente.
 * @param {string}  message  - Texto a mostrar.
 * @param {boolean} isError  - Si es true, aplica estilos de error.
 */
function showToast(message, isError = false) {
  const toast = document.getElementById('toast');

  // Limpiar timeout previo si el toast ya estaba visible
  if (toastTimeout) clearTimeout(toastTimeout);

  toast.textContent = message;
  toast.style.background = isError ? '#c0392b' : '';
  toast.classList.add('show');

  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
    toastTimeout = null;
  }, 3500);
}


/* ─────────────────────────────────────────────────────────
   5. SCROLL — FADE-IN DE ELEMENTOS
───────────────────────────────────────────────────────── */

/**
 * Observa los elementos con clase .fade-in y los anima al entrar al viewport.
 */
function initFadeObserver() {
  const fadeElements = document.querySelectorAll('.fade-in');

  if (!fadeElements.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // Una sola vez
        }
      });
    },
    { threshold: 0.15 }
  );

  fadeElements.forEach(el => observer.observe(el));
}


/* ─────────────────────────────────────────────────────────
   6. SCROLL — NAV ACTIVA
───────────────────────────────────────────────────────── */

/**
 * Actualiza el link activo de la navegación según la sección visible.
 */
function updateActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  let current    = '';

  sections.forEach(section => {
    if (window.scrollY >= section.offsetTop - 80) {
      current = section.id;
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
}

/**
 * Inicializa el listener de scroll para la navegación activa.
 */
function initActiveNav() {
  window.addEventListener('scroll', updateActiveNav, { passive: true });
}


/* ─────────────────────────────────────────────────────────
   7. INIT — Punto de entrada
───────────────────────────────────────────────────────── */

/**
 * Inicializa todos los módulos de la página.
 */
function init() {
  initCalendar();
  initTimeSlots();
  initBookingForm();
  initFadeObserver();
  initActiveNav();
}

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);
