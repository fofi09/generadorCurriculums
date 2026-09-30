 (function(){
"use strict";

const state = {
  personal: { nombre:'', puesto:'', email:'', telefono:'', ciudad:'', linkedin:'', resumen:'' },
  hasExperience: null,
  experiences: [],
  education: [],
  skills: [],
  languages: [],
  photo: { enabled:false, dataUrl:null },
  template: null,
  color: '#2C4E39'
};

const COLOR_PRESETS = ['#2C4E39','#1D3557','#7C2D12','#3D3D3D','#5B4636','#0B4F6C'];

const STEPS = ['personal','experience','education','skills','photo','template','customize'];
let stepIndex = 0;

const heroSection = document.getElementById('heroSection');
const wizard = document.getElementById('wizard');
const stepContainer = document.getElementById('stepContainer');
const stepNav = document.getElementById('stepNav');
const backBtn = document.getElementById('backBtn');
const nextBtn = document.getElementById('nextBtn');
const progressWrap = document.getElementById('progressWrap');
const progressFill = document.getElementById('progressFill');
const progressLabel = document.getElementById('progressLabel');

function uid(){ return 'id'+Math.random().toString(36).slice(2,9); }
function esc(str){
  return (str||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function nl2br(str){ return esc(str).replace(/\n/g,'<br>'); }
function fmtMonth(v){
  if(!v) return '';
  const [y,m] = v.split('-');
  const meses=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return meses[parseInt(m,10)-1] + ' ' + y;
}

document.getElementById('startBtn').addEventListener('click', () => {
  heroSection.style.display='none';
  wizard.classList.add('show');
  stepNav.classList.remove('hidden');
  progressWrap.classList.add('show');
  renderStep();
  window.scrollTo({top:0,behavior:'smooth'});
});

backBtn.addEventListener('click', () => {
  if(stepIndex===0){
    wizard.classList.remove('show');
    stepNav.classList.add('hidden');
    progressWrap.classList.remove('show');
    heroSection.style.display='';
    window.scrollTo({top:0,behavior:'smooth'});
    return;
  }
  stepIndex--;
  renderStep();
  window.scrollTo({top:0,behavior:'smooth'});
});

nextBtn.addEventListener('click', () => {
  if(!validateStep()) return;
  const currentStep = STEPS[stepIndex];
  if(currentStep === 'customize'){
    showFinalScreen();
    return;
  }
  if(stepIndex < STEPS.length - 1){
    stepIndex++;
    renderStep();
    window.scrollTo({top:0,behavior:'smooth'});
  }
});

function updateProgress(){
  const pct = ((stepIndex+1)/STEPS.length)*100;
  progressFill.style.width = pct+'%';
  progressLabel.textContent = `Paso ${stepIndex+1} de ${STEPS.length}`;
}

function renderStep(){
  updateProgress();
  const step = STEPS[stepIndex];
  stepContainer.innerHTML = RENDERERS[step]();
  attachStepEvents(step);
  nextBtn.textContent = step==='customize' ? 'Ver currículum final' : 'Continuar';
  backBtn.textContent = stepIndex===0 ? 'Volver al inicio' : 'Atrás';
}

function validateStep(){
  const step = STEPS[stepIndex];
  
  if(step==='personal'){
    const nombre = document.getElementById('f_nombre').value.trim();
    const email = document.getElementById('f_email').value.trim();
    const puesto = document.getElementById('f_puesto').value.trim();
    const ciudad = document.getElementById('f_ciudad').value.trim();
    const resumen = document.getElementById('f_resumen').value.trim();
    const telefono = document.getElementById('f_telefono').value.trim();
    
    if(!nombre || nombre.length < 5){ flagInvalid('f_nombre','Cuéntanos tu nombre para continuar (mínimo 5 letras).'); return false; }
    if(!puesto){ flagInvalid('f_puesto','El puesto es obligatorio.'); return false; }
    if(!email || !email.includes('@')){ flagInvalid('f_email','Necesitamos un correo de contacto válido (@).'); return false; }
    
    // Validacion de telefono si el usuario lo pone
    if(telefono){
      const soloNumeros = telefono.replace(/\D/g, '');
      if(soloNumeros.length < 8 || soloNumeros.length > 10){
        flagInvalid('f_telefono','El teléfono debe ser válido (entre 8 y 10 números).'); return false;
      }
    }
    
    if(!ciudad){ flagInvalid('f_ciudad','La ciudad es obligatoria.'); return false; }
    
    const wordCount = resumen.split(/\s+/).filter(w => w.length > 0).length;
    if(wordCount < 20){ flagInvalid('f_resumen','La descripción de tu perfil profesional debe tener al menos 20 palabras.'); return false; }
    return true;
  }
  
  if(step==='experience'){
    if(state.hasExperience===null){ 
      // Mostramos el error visual sin usar alert
      const choiceRow = document.querySelector('.choice-row');
      if(choiceRow){
        choiceRow.style.outline = '2px solid var(--danger)';
        choiceRow.style.borderRadius = '14px';
        setTimeout(() => choiceRow.style.outline = '', 3000);
      }
      return false; 
    }
    
    if(state.hasExperience){
      for(let i=0; i<state.experiences.length; i++){
        const e = state.experiences[i];
        
        // Descripcion obligatoria
        if(!e.descripcion.trim()){ 
          const descEl = document.querySelector(`textarea[data-exp="${i}"][data-field="descripcion"]`);
          if(descEl){ descEl.style.borderColor = 'var(--danger)'; descEl.focus(); }
          return false; 
        }

        // Validación super estricta de fechas (sin alertas, marcando bordes)
        if(e.inicio){
           const startVal = parseInt(e.inicio.replace('-', ''));
           
           if(!e.actual && e.fin){
               const endVal = parseInt(e.fin.replace('-', ''));
               if(endVal < startVal){
                  const el = document.querySelector(`input[data-exp="${i}"][data-field="fin"]`);
                  if(el) { el.style.borderColor = 'var(--danger)'; el.focus(); }
                  return false;
               }
           }
        }
      }
    }
    return true;
  }
  
  if(step==='education'){
    for(let i=0; i<state.education.length; i++){
      const e = state.education[i];
      if(e.inicio && e.fin){
         const startVal = parseInt(e.inicio.replace('-', ''));
         const endVal = parseInt(e.fin.replace('-', ''));
         if(endVal < startVal){
            const el = document.querySelector(`input[data-edu="${i}"][data-field="fin"]`);
            if(el) { el.style.borderColor = 'var(--danger)'; el.focus(); }
            return false;
         }
      }
    }
    return true;
  }
  
  if(step==='skills'){
    if(state.skills.length < 3){
      flagInvalid('skillInput', 'Añade al menos 3 habilidades.');
      return false;
    }
    if(state.languages.length === 0){
      // Reemplazo del alert nativo por feedback visual 
      const btnAddLang = document.getElementById('addLangBtn');
      if(btnAddLang){
         btnAddLang.style.border = '2px dashed var(--danger)';
         btnAddLang.style.color = 'var(--danger)';
         setTimeout(() => { btnAddLang.style.border = ''; btnAddLang.style.color = ''; }, 3000);
      }
      return false;
    }
    for(let i = 0; i < state.languages.length; i++){
      const l = state.languages[i];
      if(!l.idioma.trim()){ flagInvalid(`f_idioma_${i}`, 'Ingresa el idioma'); return false; }
      if(!l.nivel.trim()){ flagInvalid(`f_nivel_${i}`, 'Selecciona un nivel'); return false; }
    }
    return true;
  }
  return true;
}

function flagInvalid(id,msg){
  const el = document.getElementById(id);
  if(!el) return;
  el.style.borderColor = 'var(--danger)';
  el.focus();
  const clear = () => { el.style.borderColor=''; el.removeEventListener('input', clear); el.removeEventListener('change', clear); };
  el.addEventListener('input', clear);
  el.addEventListener('change', clear);
}

const RENDERERS = {

personal(){
  const p = state.personal;
  return `<div class="step-card">
    <div class="step-head">
      <p class="step-kicker">Datos de contacto</p>
      <h2>Empecemos por ti</h2>
      <p>Esta información aparece en la cabecera de tu currículum.</p>
    </div>
    <div class="field"><label>Nombre completo</label><input type="text" id="f_nombre" placeholder="Ej. Ana Sofia Aguirre" value="${esc(p.nombre)}"></div>
    <div class="field"><label>Puesto al que aspiras</label><input type="text" id="f_puesto" placeholder="Ej. Programadora / Contable Junior" value="${esc(p.puesto)}"></div>
    <div class="grid-2">
      <div class="field"><label>Correo electrónico</label><input type="email" id="f_email" placeholder="sofiaguirree18@gmail.com" value="${esc(p.email)}"></div>
      <div class="field"><label>Teléfono <span class="hint">(opcional)</span></label><input type="tel" id="f_telefono" placeholder="381 333 2255" value="${esc(p.telefono)}" oninput="this.value = this.value.replace(/[^0-9+ -]/g, '')"></div>
    </div>
    <div class="grid-2">
      <div class="field"><label>Ciudad</label><input type="text" id="f_ciudad" placeholder="Ciudad, País" value="${esc(p.ciudad)}"></div>
      <div class="field"><label>LinkedIn o portafolio <span class="hint">(opcional)</span></label><input type="text" id="f_linkedin" placeholder="linkedin.com" value="${esc(p.linkedin)}"></div>
    </div>
    <div class="field"><label>Descripción de tu perfil profesional <span class="hint">(mínimo 20 palabras)</span></label><textarea id="f_resumen" placeholder="Describe brevemente tu experiencia, habilidades y objetivos profesionales...">${esc(p.resumen)}</textarea></div>
  </div>`;
},

experience(){
  const has = state.hasExperience;
  const listHtml = state.experiences.map((e,i)=>`
    <div class="entry-card" data-i="${i}">
      <div class="entry-top">
        <span class="entry-title">Experiencia ${i+1}</span>
        <button class="icon-btn" data-remove-exp="${i}" title="Eliminar" aria-label="Eliminar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div class="field"><label>Puesto</label><input type="text" data-exp="${i}" data-field="puesto" value="${esc(e.puesto)}" placeholder="Ej. Auxiliar administrativo"></div>
      <div class="field"><label>Empresa</label><input type="text" data-exp="${i}" data-field="empresa" value="${esc(e.empresa)}" placeholder="Ej. Comercial del Norte S.L."></div>
      <div class="grid-2">
        <div class="field"><label>Inicio</label><input type="month" data-exp="${i}" data-field="inicio" value="${esc(e.inicio)}" onkeydown="return false;"></div>
        <div class="field"><label>Fin</label><input type="month" data-exp="${i}" data-field="fin" value="${esc(e.fin)}" ${e.actual?'disabled':''} onkeydown="return false;"></div>
      </div>
      <div class="checkbox-row">
        <input type="checkbox" id="actual_${i}" data-exp="${i}" data-field="actual" ${e.actual?'checked':''}>
        <label for="actual_${i}">Trabajo aquí actualmente</label>
      </div>
      <div class="field"><label>Funciones y logros <span class="hint">(obligatorio)</span></label><textarea data-exp="${i}" data-field="descripcion" placeholder="Ej. Gestión de pedidos, atención al cliente y control de inventario.">${esc(e.descripcion)}</textarea></div>
    </div>`).join('');

  return `<div class="step-card">
    <div class="step-head">
      <p class="step-kicker">Trayectoria</p>
      <h2>¿Tienes experiencia laboral?</h2>
      <p>Con esto elegimos qué plantilla te conviene más.</p>
    </div>
    <div class="choice-row">
      <button class="choice-card ${has===true?'active':''}" data-exp-choice="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 7h16v11a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" stroke="currentColor" stroke-width="1.6"/><path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" stroke="currentColor" stroke-width="1.6"/></svg>
        <strong>Sí, tengo experiencia</strong>
        <span>He trabajado antes en uno o varios empleos.</span>
      </button>
      <button class="choice-card ${has===false?'active':''}" data-exp-choice="false">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 4-8 4-8-4 8-4z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M4 11v5c0 1.5 3.5 3 8 3s8-1.5 8-3v-5" stroke="currentColor" stroke-width="1.6"/></svg>
        <strong>Aún no / soy recién egresado</strong>
        <span>Prefiero destacar estudios, prácticas o habilidades.</span>
      </button>
    </div>
    <div id="expListWrap" style="${has===true?'':'display:none;margin-top:18px;' }">
      ${has===true ? `<div style="margin-top:18px;">${listHtml}<button class="add-link" id="addExpBtn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Añadir experiencia</button></div>` : ''}
    </div>
  </div>`;
},

education(){
  const listHtml = state.education.map((e,i)=>`
    <div class="entry-card" data-i="${i}">
      <div class="entry-top">
        <span class="entry-title">Formación ${i+1}</span>
        <button class="icon-btn" data-remove-edu="${i}" title="Eliminar" aria-label="Eliminar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div class="field"><label>Título o estudio</label><input type="text" data-edu="${i}" data-field="titulo" value="${esc(e.titulo)}" placeholder="Ej. Bachillerato / Grado en Administración"></div>
      <div class="field"><label>Centro educativo</label><input type="text" data-edu="${i}" data-field="institucion" value="${esc(e.institucion)}" placeholder="Ej. IES Miguel de Cervantes"></div>
      <div class="grid-2">
        <div class="field"><label>Inicio</label><input type="month" data-edu="${i}" data-field="inicio" value="${esc(e.inicio)}" onkeydown="return false;"></div>
        <div class="field"><label>Fin <span class="hint">(o prevista)</span></label><input type="month" data-edu="${i}" data-field="fin" value="${esc(e.fin)}" onkeydown="return false;"></div>
      </div>
    </div>`).join('');
  return `<div class="step-card">
    <div class="step-head">
      <p class="step-kicker">Formación</p>
      <h2>Tu educación</h2>
      <p>Añade tus estudios, del más reciente al más antiguo.</p>
    </div>
    ${listHtml}
    <button class="add-link" id="addEduBtn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Añadir formación</button>
    <div style="margin-top:22px; padding-top:18px; border-top:1.5px dashed var(--line); font-size:13px; color:var(--ink-soft); display:flex; gap:10px; align-items:flex-start;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="flex-shrink:0; color:var(--pine);"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span>¿No tienes certificados o estudios previos? Te recomiendo explorar <a href="https://www.classcentral.com/" target="_blank" rel="noopener noreferrer" style="color:var(--pine-dark); font-weight:600; text-decoration:underline;">Class Central</a>, una plataforma en donde podrás realizar cursos con certificados gratis.</span>
    </div>
  </div>`;
},

skills(){
  const chips = state.skills.map((s,i)=>`<span class="chip">${esc(s)}<button data-remove-skill="${i}" aria-label="Quitar">&times;</button></span>`).join('');
  const langs = state.languages.map((l,i)=>`
    <div class="entry-card" data-i="${i}">
      <div class="entry-top">
        <span class="entry-title">Idioma ${i+1}</span>
        <button class="icon-btn" data-remove-lang="${i}" aria-label="Eliminar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div class="grid-2">
        <div class="field"><label>Idioma</label><input type="text" id="f_idioma_${i}" data-lang="${i}" data-field="idioma" value="${esc(l.idioma)}" placeholder="Ej. Inglés"></div>
        <div class="field"><label>Nivel</label>
          <select id="f_nivel_${i}" data-lang="${i}" data-field="nivel">
            <option value="">Elige...</option>
            <option value="Básico" ${l.nivel==='Básico'?'selected':''}>Básico</option>
            <option value="Intermedio" ${l.nivel==='Intermedio'?'selected':''}>Intermedio</option>
            <option value="Avanzado" ${l.nivel==='Avanzado'?'selected':''}>Avanzado</option>
            <option value="Nativo" ${l.nivel==='Nativo'?'selected':''}>Nativo</option>
          </select>
        </div>
      </div>
    </div>`).join('');
  return `<div class="step-card">
    <div class="step-head">
      <p class="step-kicker">Fortalezas</p>
      <h2>Habilidades e idiomas</h2>
      <p>Añade palabras clave relevantes para el puesto que buscas.</p>
    </div>
    <div class="field">
      <label>Habilidades <span class="hint">(Minimo 3, los debes escribir de a uno e ir apretando el botón añadir)</span></label>
      <div class="skills-input-row">
        <input type="text" id="skillInput" placeholder="Ej. Excel, atención al cliente...">
        <button class="btn btn-ghost btn-sm" id="addSkillBtn" type="button">Añadir</button>
      </div>
      <div class="chip-wrap" id="chipWrap">${chips}</div>
    </div>
    <div class="field" style="margin-top:22px;">
      <label>Idiomas <span class="hint">(añade por lo menos el nativo)</span></label>
      <div id="langListWrap">${langs}</div>
      <button class="add-link" id="addLangBtn" type="button"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Añadir idioma</button>
    </div>
  </div>`;
},

photo(){
  const ph = state.photo;
  return `<div class="step-card">
    <div class="step-head">
      <p class="step-kicker">Presentación</p>
      <h2>¿Incluir una foto?</h2>
      <p>Es opcional. Algunos sectores y países prefieren currículums sin foto — tú decides.</p>
    </div>
    <div class="photo-toggle">
      <div class="toggle-pill ${!ph.enabled?'active':''}" data-photo-choice="false">Sin foto</div>
      <div class="toggle-pill ${ph.enabled?'active':''}" data-photo-choice="true">Con foto</div>
    </div>
    <div id="photoUploadWrap" style="${ph.enabled?'':'display:none;'}">
      <label class="photo-upload" for="photoInput">
        ${ph.dataUrl ? `<img src="${ph.dataUrl}" class="photo-preview" alt="Vista previa">` : ''}
        <div class="photo-upload-label"><strong>${ph.dataUrl?'Cambiar foto':'Subir foto'}</strong><br>JPG o PNG, fondo neutro recomendado</div>
        <input type="file" id="photoInput" accept="image/*">
      </label>
    </div>
  </div>`;
},

template(){
  const hasExp = state.hasExperience === true && state.experiences.some(e => e.puesto || e.empresa);
  const hasEdu = state.education.some(e => e.titulo || e.institucion);
  const recommended = (!hasExp || !hasEdu) ? 'ejecutivo' : 'moderno';
  const chosen = state.template || recommended;
  if(!state.template) state.template = recommended;
  return `<div class="step-card">
    <div class="step-head">
      <p class="step-kicker">Diseño</p>
      <h2>Elige tu plantilla</h2>
      <p>Marcamos la que mejor suele funcionar según tu situación, pero la decisión es tuya.</p>
    </div>
    <div class="template-select-grid">
      <div class="template-option ${chosen==='ejecutivo'?'active':''}" data-tpl="ejecutivo">
        ${recommended==='ejecutivo'?'<span class="recommend-badge"><svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.7 1.6 6.8L12 17l-6.2 3.5 1.6-6.8L2.2 9l6.9-.7L12 2z" fill="currentColor"/></svg>Recomendada</span>':''}
        <div class="thumb-frame"><div id="thumbA"></div></div>
        <h3>Ejecutivo</h3>
        <p>Cronología clara en una columna. Formato clásico, ideal si tienes experiencia laboral que ordenar.</p>
      </div>
      <div class="template-option ${chosen==='moderno'?'active':''}" data-tpl="moderno">
        ${recommended==='moderno'?'<span class="recommend-badge"><svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.7 1.6 6.8L12 17l-6.2 3.5 1.6-6.8L2.2 9l6.9-.7L12 2z" fill="currentColor"/></svg>Recomendada</span>':''}
        <div class="thumb-frame"><div id="thumbB"></div></div>
        <h3>Moderno</h3>
        <p>Barra lateral con foco en habilidades y formación. Ideal para primeros empleos o perfiles visuales.</p>
      </div>
    </div>
  </div>`;
},

customize(){
  return `<div class="step-card">
    <div class="step-head">
      <p class="step-kicker">Últimos ajustes</p>
      <h2>Personaliza el color</h2>
      <p>Puedes cambiarlo cuantas veces quieras antes de descargar.</p>
    </div>
    <div class="swatch-row" id="swatchRow">
      ${COLOR_PRESETS.map(c=>`<div class="swatch ${state.color===c?'active':''}" style="background:${c}" data-color="${c}"></div>`).join('')}
      <div class="swatch-custom" title="Color personalizado">
        <input type="color" id="customColor" value="${state.color}">
      </div>
    </div>
    <div class="preview-shell">
      <div class="preview-scale-wrap">
        <div id="livePreview"></div>
      </div>
    </div>
  </div>`;
}

};

function attachStepEvents(step){
  if(step==='personal'){
    const ids = {f_nombre:'nombre',f_puesto:'puesto',f_email:'email',f_telefono:'telefono',f_ciudad:'ciudad',f_linkedin:'linkedin',f_resumen:'resumen'};
    Object.keys(ids).forEach(id=>{
      document.getElementById(id).addEventListener('input', e=>{ state.personal[ids[id]] = e.target.value; });
    });
  }

  if(step==='experience'){
    document.querySelectorAll('[data-exp-choice]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        state.hasExperience = btn.getAttribute('data-exp-choice')==='true';
        if(state.hasExperience && state.experiences.length===0){
          state.experiences.push(blankExp());
        }
        renderStep();
      });
    });
    document.getElementById('addExpBtn')?.addEventListener('click', ()=>{
      state.experiences.push(blankExp());
      renderStep();
    });
    document.querySelectorAll('[data-remove-exp]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        state.experiences.splice(parseInt(btn.getAttribute('data-remove-exp')),1);
        renderStep();
      });
    });
    document.querySelectorAll('[data-exp]').forEach(inp=>{
      inp.addEventListener('input', ()=>{
        const i = parseInt(inp.getAttribute('data-exp'));
        const f = inp.getAttribute('data-field');
        if(f==='actual'){
          state.experiences[i].actual = inp.checked;
          renderStep();
        } else {
          state.experiences[i][f] = inp.value;
        }
      });
      inp.addEventListener('change', ()=>{
        const i = parseInt(inp.getAttribute('data-exp'));
        const f = inp.getAttribute('data-field');
        if(f==='actual'){
          state.experiences[i].actual = inp.checked;
          renderStep();
        } else {
          state.experiences[i][f] = inp.value;
        }
      });
    });
  }

  if(step==='education'){
    document.getElementById('addEduBtn').addEventListener('click', ()=>{
      state.education.push({titulo:'',institucion:'',inicio:'',fin:''});
      renderStep();
    });
    document.querySelectorAll('[data-remove-edu]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        state.education.splice(parseInt(btn.getAttribute('data-remove-edu')),1);
        renderStep();
      });
    });
    document.querySelectorAll('[data-edu]').forEach(inp=>{
      inp.addEventListener('input', ()=>{
        const i = parseInt(inp.getAttribute('data-edu'));
        const f = inp.getAttribute('data-field');
        state.education[i][f] = inp.value;
      });
      inp.addEventListener('change', ()=>{
        const i = parseInt(inp.getAttribute('data-edu'));
        const f = inp.getAttribute('data-field');
        state.education[i][f] = inp.value;
      });
    });
  }

  if(step==='skills'){
    const addSkill = ()=>{
      const inp = document.getElementById('skillInput');
      const v = inp.value.trim();
      if(v){ state.skills.push(v); inp.value=''; renderStep(); document.getElementById('skillInput').focus(); }
    };
    document.getElementById('addSkillBtn').addEventListener('click', addSkill);
    document.getElementById('skillInput').addEventListener('keydown', e=>{
      if(e.key==='Enter'){ e.preventDefault(); addSkill(); }
    });
    document.querySelectorAll('[data-remove-skill]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        state.skills.splice(parseInt(btn.getAttribute('data-remove-skill')),1);
        renderStep();
      });
    });
    document.getElementById('addLangBtn').addEventListener('click', ()=>{
      state.languages.push({idioma:'',nivel:''});
      renderStep();
    });
    document.querySelectorAll('[data-remove-lang]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        state.languages.splice(parseInt(btn.getAttribute('data-remove-lang')),1);
        renderStep();
      });
    });
    document.querySelectorAll('[data-lang]').forEach(inp=>{
      inp.addEventListener('input', ()=>{
        const i = parseInt(inp.getAttribute('data-lang'));
        const f = inp.getAttribute('data-field');
        state.languages[i][f] = inp.value;
      });
      inp.addEventListener('change', ()=>{
        const i = parseInt(inp.getAttribute('data-lang'));
        const f = inp.getAttribute('data-field');
        state.languages[i][f] = inp.value;
      });
    });
  }

  if(step==='photo'){
    document.querySelectorAll('[data-photo-choice]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        state.photo.enabled = btn.getAttribute('data-photo-choice')==='true';
        renderStep();
      });
    });
    const input = document.getElementById('photoInput');
    input?.addEventListener('change', e=>{
      const file = e.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = ()=>{ state.photo.dataUrl = reader.result; renderStep(); };
      reader.readAsDataURL(file);
    });
  }

  if(step==='template'){
    document.getElementById('thumbA').innerHTML = buildResumeHTML('ejecutivo', true);
    document.getElementById('thumbB').innerHTML = buildResumeHTML('moderno', true);
    scaleThumb('thumbA'); scaleThumb('thumbB');
    document.querySelectorAll('[data-tpl]').forEach(card=>{
      card.addEventListener('click', ()=>{
        state.template = card.getAttribute('data-tpl');
        renderStep();
      });
    });
  }

  if(step==='customize'){
    renderLivePreview();
    document.querySelectorAll('[data-color]').forEach(sw=>{
      sw.addEventListener('click', ()=>{
        state.color = sw.getAttribute('data-color');
        document.querySelectorAll('#swatchRow .swatch').forEach(s => s.classList.remove('active'));
        sw.classList.add('active');
        const page = document.querySelector('#livePreview .resume-page');
        if(page) page.style.setProperty('--resume-accent', state.color);
      });
    });
    document.getElementById('customColor').addEventListener('input', e=>{
      state.color = e.target.value;
      document.querySelectorAll('#swatchRow .swatch').forEach(s => s.classList.remove('active'));
      const page = document.querySelector('#livePreview .resume-page');
      if(page) page.style.setProperty('--resume-accent', state.color);
    });
  }
}

function blankExp(){ return {puesto:'',empresa:'',inicio:'',fin:'',actual:false,descripcion:''}; }

function scaleThumb(id){
  const frame = document.getElementById(id).parentElement;
  const page = document.getElementById(id).querySelector('.resume-page');
  if(!page) return;
  const scale = frame.clientWidth / 794;
  page.style.transform = `scale(${scale})`;
}

function scaleLivePreview(){
  if(window.innerWidth > 860) {
    document.querySelectorAll('.preview-scale-wrap .resume-page').forEach(page => {
       page.style.transform = '';
       page.style.marginBottom = '';
    });
    return;
  }
  
  document.querySelectorAll('.preview-scale-wrap').forEach(wrap => {
     const page = wrap.querySelector('.resume-page');
     if(page) {
       const containerWidth = wrap.clientWidth; 
       const scale = containerWidth / 794;
       
       page.style.transformOrigin = 'top left'; 
       page.style.transform = `scale(${scale})`; 
       
       const originalHeight = page.offsetHeight;
       const ghostSpace = originalHeight - (originalHeight * scale);
       page.style.marginBottom = `-${ghostSpace}px`;
     }
  });
}

window.addEventListener('resize', ()=>{
  if(STEPS[stepIndex]==='template'){ scaleThumb('thumbA'); scaleThumb('thumbB'); }
  if(STEPS[stepIndex]==='customize'){ scaleLivePreview(); }
});

window.addEventListener("orientationchange", function() {
  setTimeout(scaleLivePreview, 100);
});

function renderLivePreview(){
  document.getElementById('livePreview').innerHTML = buildResumeHTML(state.template, false);
  setTimeout(scaleLivePreview, 10);
}

function buildResumeHTML(tpl, isThumb){
  const p = state.personal;
  const accent = state.color;
  const photoImg = (state.photo.enabled && state.photo.dataUrl) ? state.photo.dataUrl : null;

  const validExp = state.experiences.filter(e=>e.puesto||e.empresa);
  const expItems = validExp.length ? validExp.map(e=>`
    <div class="item">
      <div class="item-top"><strong>${esc(e.puesto)||'Puesto'}</strong><span class="date">${fmtMonth(e.inicio)} — ${e.actual?'Actualidad':fmtMonth(e.fin)}</span></div>
      <div class="item-sub">${esc(e.empresa)}</div>
      ${e.descripcion?`<div class="item-desc">${nl2br(e.descripcion)}</div>`:''}
    </div>`).join('') : '';

  const validEdu = state.education.filter(e=>e.titulo||e.institucion);
  const eduItems = validEdu.length ? validEdu.map(e=>`
    <div class="item">
      <div class="item-top"><strong>${esc(e.titulo)||'Título'}</strong><span class="date">${fmtMonth(e.inicio)} — ${fmtMonth(e.fin)||'Actualidad'}</span></div>
      <div class="item-sub">${esc(e.institucion)}</div>
    </div>`).join('') : '';

  const contactBits = [
    p.email ? p.email : '',
    p.telefono ? p.telefono : '',
    p.ciudad ? p.ciudad : '',
    p.linkedin ? p.linkedin : ''
  ].filter(Boolean);

  if(tpl==='moderno'){
    const skillTags = state.skills.map(s=>`<span class="skill-tag">${esc(s)}</span>`).join('');
    const langItems = state.languages.filter(l=>l.idioma).map(l=>`<div class="lang-item"><span>${esc(l.idioma)}</span><span>${esc(l.nivel)}</span></div>`).join('');
    return `
    <div class="resume-page" style="--resume-accent:${accent}">
      <div class="tpl-moderno">
        <div class="side">
          ${photoImg?`<img src="${photoImg}" alt="">`:''}
          <h1>${esc(p.nombre)||'Tu nombre'}</h1>
          ${p.puesto?`<div class="role">${esc(p.puesto)}</div>`:''}
          <h3 class="sec">Contacto</h3>
          ${contactBits.map(c=>`<div class="contact-item">${esc(c)}</div>`).join('') || '<div class="contact-item" style="opacity:.6">Añade tus datos de contacto</div>'}
          ${state.skills.length?`<h3 class="sec">Habilidades</h3><div>${skillTags}</div>`:''}
          ${state.languages.length?`<h3 class="sec">Idiomas</h3>${langItems}`:''}
        </div>
        <div class="main">
          ${p.resumen?`<h2 class="sec">Perfil profesional</h2><div class="summary">${nl2br(p.resumen)}</div>`:''}
          ${expItems ? `<section><h2 class="sec">Experiencia</h2>${expItems}</section>` : ''}
          ${eduItems ? `<section><h2 class="sec">Educación</h2>${eduItems}</section>` : ''}
        </div>
      </div>
    </div>`;
  }

  const skillPills = state.skills.map(s=>`<span class="skill-pill">${esc(s)}</span>`).join('');
  const langRows = state.languages.filter(l=>l.idioma).map(l=>`<div class="lang-row"><span>${esc(l.idioma)}</span><b>${esc(l.nivel)}</b></div>`).join('');
  return `
  <div class="resume-page" style="--resume-accent:${accent}">
    <div class="tpl-ejecutivo">
      <div class="head">
        ${photoImg?`<img src="${photoImg}" alt="">`:''}
        <div class="head-text">
          <h1>${esc(p.nombre)||'Tu nombre'}</h1>
          ${p.puesto?`<div class="role">${esc(p.puesto)}</div>`:''}
          <div class="contact-line">${contactBits.map(c=>`<span>${esc(c)}</span>`).join('')}</div>
        </div>
      </div>
      ${p.resumen?`<section><h2 class="sec">Perfil profesional</h2><div class="summary">${nl2br(p.resumen)}</div></section>`:''}
      ${expItems ? `<section><h2 class="sec">Experiencia</h2>${expItems}</section>` : ''}
      ${eduItems ? `<section><h2 class="sec">Educación</h2>${eduItems}</section>` : ''}
      ${state.skills.length?`<section><h2 class="sec">Habilidades</h2><div class="skills-flex">${skillPills}</div></section>`:''}
      ${state.languages.length?`<section><h2 class="sec">Idiomas</h2>${langRows}</section>`:''}
    </div>
  </div>`;
}

function showFinalScreen(){
  stepNav.classList.add('hidden');
  progressWrap.classList.remove('show');
  stepContainer.innerHTML = `
    <div class="step-card">
      <div class="step-head">
        <p class="step-kicker">Listo</p>
        <h2>Tu currículum está terminado</h2>
        <p>Descárgalo en PDF o vuelve atrás para seguir ajustándolo.</p>
      </div>
      <div class="customize-panel">
        <div class="customize-row">
          <div class="customize-label">Plantilla</div>
          <div class="mini-toggle">
            <button data-final-tpl="ejecutivo" class="${state.template==='ejecutivo'?'active':''}">Ejecutivo</button>
            <button data-final-tpl="moderno" class="${state.template==='moderno'?'active':''}">Moderno</button>
          </div>
        </div>
        <div class="customize-row">
          <div class="customize-label">Foto</div>
          <div class="mini-toggle">
            <button data-final-photo="false" class="${!state.photo.enabled?'active':''}">Sin foto</button>
            <button data-final-photo="true" class="${state.photo.enabled?'active':''}">Con foto</button>
          </div>
        </div>
        <div class="customize-row">
          <div class="customize-label">Color</div>
          <div class="swatch-row" style="margin:0;" id="finalSwatchRow">
            ${COLOR_PRESETS.map(c=>`<div class="swatch ${state.color===c?'active':''}" style="background:${c}" data-final-color="${c}"></div>`).join('')}
            <div class="swatch-custom"><input type="color" id="finalCustomColor" value="${state.color}"></div>
          </div>
        </div>
      </div>
      <div class="preview-shell">
        <div class="preview-scale-wrap">
          <div id="printArea">${buildResumeHTML(state.template, false)}</div>
        </div>
      </div>
      <div class="result-actions">
        <button class="btn btn-ghost" id="editBackBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Seguir editando
        </button>
        <button class="btn btn-ghost" id="printBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Imprimir
        </button>
        <button class="btn btn-primary" id="downloadBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 19h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Descargar en PDF
        </button>
      </div>
    </div>
  `;
  document.querySelectorAll('[data-final-tpl]').forEach(btn=>{
    btn.addEventListener('click', ()=>{ state.template = btn.getAttribute('data-final-tpl'); showFinalScreen(); });
  });
  
  document.querySelectorAll('[data-final-photo]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const isWithPhoto = btn.getAttribute('data-final-photo') === 'true';
      if (isWithPhoto) {
        if (state.photo.dataUrl) {
          state.photo.enabled = true;
          showFinalScreen();
        } else {
          const fileInput = document.createElement('input');
          fileInput.type = 'file';
          fileInput.accept = 'image/*';
          fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              state.photo.dataUrl = reader.result;
              state.photo.enabled = true;
              showFinalScreen(); 
            };
            reader.readAsDataURL(file);
          };
          fileInput.click();
        }
      } else {
        state.photo.enabled = false;
        showFinalScreen();
      }
    });
  });

  // ACÁ ESTÁ EL FIX DEL FINAL SCREEN
  document.querySelectorAll('[data-final-color]').forEach(sw=>{
    sw.addEventListener('click', ()=>{ 
      state.color = sw.getAttribute('data-final-color'); 
      document.querySelectorAll('#finalSwatchRow .swatch').forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
      const page = document.querySelector('#printArea .resume-page');
      if(page) page.style.setProperty('--resume-accent', state.color);
    });
  });
  document.getElementById('finalCustomColor').addEventListener('input', e=>{
    state.color = e.target.value;
    document.querySelectorAll('#finalSwatchRow .swatch').forEach(s => s.classList.remove('active'));
    const page = document.querySelector('#printArea .resume-page');
    if(page) page.style.setProperty('--resume-accent', state.color);
  });

  document.getElementById('editBackBtn').addEventListener('click', ()=>{
    stepNav.classList.remove('hidden');
    progressWrap.classList.add('show');
    stepIndex = STEPS.length - 1;
    renderStep();
    window.scrollTo({top:0,behavior:'smooth'});
  });
  
  document.getElementById('printBtn').addEventListener('click', ()=>{
    window.print();
  });

  document.getElementById('downloadBtn').addEventListener('click', async ()=>{
    const btn = document.getElementById('downloadBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Preparando PDF...';
    btn.disabled = true;

    try {
      const cvHtml = buildResumeHTML(state.template, false);
      
      const wrapper = document.createElement('div');
      wrapper.style.position = 'absolute';
      wrapper.style.top = '0';
      wrapper.style.left = '0';
      wrapper.style.opacity = '0';
      wrapper.style.pointerEvents = 'none';
      wrapper.style.zIndex = '-9999';
      wrapper.innerHTML = cvHtml;
      document.body.appendChild(wrapper);

      const target = wrapper.querySelector('.resume-page');
      target.style.transform = 'none';
      target.style.boxShadow = 'none';
      target.style.margin = '0';
      target.style.width = '794px';
      
      const canvas = await html2canvas(target, {
        scale: 2, 
        useCORS: true,
        width: 794,
        windowWidth: 794,
        scrollX: 0,
        scrollY: 0
      });

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth(); 
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width; 
      
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('Mi_Curriculum.pdf');

      document.body.removeChild(wrapper);
    } catch(err) {
      console.error(err);
      alert('Error al descargar. Puedes usar el botón "Imprimir" y elegir "Guardar como PDF".');
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  });
  window.scrollTo({top:0,behavior:'smooth'});
  
  setTimeout(scaleLivePreview, 10);
}

})();