/**
 * CassCanva – A5 Flyer Editor
 * Drag-and-drop canvas editor with text, shapes, images, and export.
 */

/* =====================================================================
   State
   ===================================================================== */
const A5_W = 559;  // px at 96 dpi ≈ 148 mm
const A5_H = 794;  // px at 96 dpi ≈ 210 mm

let zoom = 1;
let activeTool = 'select';
let elements = [];       // { id, type, x, y, w, h, rotation, ...props }
let selectedId = null;
let history = [];        // snapshots for undo
let historyIndex = -1;
let isDragging = false;
let isResizing = false;
let isRotating = false;
let isDrawing = false;

// Per-drag state
let dragStart = { mouseX: 0, mouseY: 0, elX: 0, elY: 0 };
let resizeState = {};
let rotateState = {};
let drawStart = {};

// Background
let bgConfig = { type: 'solid', color: '#ffffff', grad1: '#7C3AED', grad2: '#DB2777', angle: 135 };

let nextId = 1;

/* =====================================================================
   DOM refs
   ===================================================================== */
const canvas        = document.getElementById('canvas');
const wrapper       = document.getElementById('canvas-wrapper');
const imgInput      = document.getElementById('image-upload-input');

/* =====================================================================
   Init
   ===================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  applyZoom(1);
  applyBackground();
  loadTemplate();
  bindToolButtons();
  bindTopBarButtons();
  bindCanvasEvents();
  bindPropertyPanel();
  bindKeyboard();
  bindZoomButtons();
  renderAll();
  saveHistory();
});

/* =====================================================================
   Templates
   ===================================================================== */
function loadTemplate() {
  const params = new URLSearchParams(window.location.search);
  const tpl = params.get('tpl');
  if (!tpl) return;
  switch (tpl) {
    case 'event':   loadEventTemplate(); break;
    case 'sale':    loadSaleTemplate(); break;
    case 'party':   loadPartyTemplate(); break;
    case 'business':loadBusinessTemplate(); break;
    case 'minimal': loadMinimalTemplate(); break;
  }
}

function loadEventTemplate() {
  bgConfig = { type: 'gradient', grad1: '#7C3AED', grad2: '#DB2777', angle: 135, color: '#7C3AED' };
  addElement({ type:'text', x:40, y:140, w:479, h:80, text:'BIG EVENT', fontSize:64, fontFamily:'Montserrat', fontColor:'#ffffff', fontBold:true, fontItalic:false, fontUnderline:false, textAlign:'center', lineHeight:1.1, opacity:1, rotation:0 });
  addElement({ type:'text', x:80, y:260, w:399, h:44, text:'Friday, 25 April 2026', fontSize:22, fontFamily:'Inter', fontColor:'rgba(255,255,255,.85)', fontBold:false, fontItalic:false, fontUnderline:false, textAlign:'center', lineHeight:1.2, opacity:1, rotation:0 });
  addElement({ type:'shape', shape:'rect', x:60, y:320, w:439, h:3, fill:'rgba(255,255,255,.3)', stroke:'transparent', strokeWidth:0, radius:2, opacity:1, rotation:0 });
  addElement({ type:'text', x:60, y:340, w:439, h:60, text:'📍 City Arena, Main Hall', fontSize:20, fontFamily:'Inter', fontColor:'rgba(255,255,255,.9)', fontBold:false, fontItalic:false, fontUnderline:false, textAlign:'center', lineHeight:1.4, opacity:1, rotation:0 });
  addElement({ type:'shape', shape:'rect', x:160, y:650, w:239, h:52, fill:'#ffffff', stroke:'transparent', strokeWidth:0, radius:26, opacity:1, rotation:0 });
  addElement({ type:'text', x:160, y:658, w:239, h:36, text:'Get Tickets →', fontSize:18, fontFamily:'Inter', fontColor:'#7C3AED', fontBold:true, fontItalic:false, fontUnderline:false, textAlign:'center', lineHeight:1, opacity:1, rotation:0 });
  applyBackground();
  renderAll();
  saveHistory();
}

function loadSaleTemplate() {
  bgConfig = { type: 'gradient', grad1: '#F59E0B', grad2: '#EF4444', angle: 135, color: '#F59E0B' };
  addElement({ type:'text', x:30, y:80, w:499, h:100, text:'MEGA\nSALE', fontSize:80, fontFamily:'Oswald', fontColor:'#ffffff', fontBold:true, fontItalic:false, fontUnderline:false, textAlign:'center', lineHeight:1, opacity:1, rotation:0 });
  addElement({ type:'shape', shape:'rect', x:50, y:250, w:459, h:120, fill:'rgba(255,255,255,.15)', stroke:'transparent', strokeWidth:0, radius:16, opacity:1, rotation:0 });
  addElement({ type:'text', x:50, y:270, w:459, h:80, text:'UP TO 70% OFF', fontSize:42, fontFamily:'Montserrat', fontColor:'#ffffff', fontBold:true, fontItalic:false, fontUnderline:false, textAlign:'center', lineHeight:1, opacity:1, rotation:0 });
  addElement({ type:'text', x:60, y:400, w:439, h:50, text:'Limited time only. Don\'t miss out!', fontSize:19, fontFamily:'Inter', fontColor:'rgba(255,255,255,.9)', fontBold:false, fontItalic:false, fontUnderline:false, textAlign:'center', lineHeight:1.3, opacity:1, rotation:0 });
  addElement({ type:'text', x:60, y:680, w:439, h:40, text:'yourshop.com  |  @yourshop', fontSize:16, fontFamily:'Inter', fontColor:'rgba(255,255,255,.8)', fontBold:false, fontItalic:false, fontUnderline:false, textAlign:'center', lineHeight:1, opacity:1, rotation:0 });
  applyBackground();
  renderAll();
  saveHistory();
}

function loadPartyTemplate() {
  bgConfig = { type: 'gradient', grad1: '#10B981', grad2: '#3B82F6', angle: 135, color: '#10B981' };
  addElement({ type:'text', x:40, y:100, w:479, h:100, text:'🎉 PARTY\nTIME!', fontSize:60, fontFamily:'Montserrat', fontColor:'#ffffff', fontBold:true, fontItalic:false, fontUnderline:false, textAlign:'center', lineHeight:1.1, opacity:1, rotation:0 });
  addElement({ type:'text', x:60, y:260, w:439, h:50, text:'You\'re Invited!', fontSize:28, fontFamily:'Playfair Display', fontColor:'rgba(255,255,255,.95)', fontBold:false, fontItalic:true, fontUnderline:false, textAlign:'center', lineHeight:1.2, opacity:1, rotation:0 });
  addElement({ type:'shape', shape:'circle', x:220, y:330, w:119, h:119, fill:'rgba(255,255,255,.15)', stroke:'rgba(255,255,255,.4)', strokeWidth:2, radius:60, opacity:1, rotation:0 });
  addElement({ type:'text', x:60, y:480, w:439, h:100, text:'Saturday, 20 May\n8 PM – Late\n123 Party Street', fontSize:18, fontFamily:'Inter', fontColor:'rgba(255,255,255,.9)', fontBold:false, fontItalic:false, fontUnderline:false, textAlign:'center', lineHeight:1.6, opacity:1, rotation:0 });
  addElement({ type:'text', x:60, y:700, w:439, h:36, text:'RSVP: party@example.com', fontSize:15, fontFamily:'Inter', fontColor:'rgba(255,255,255,.7)', fontBold:false, fontItalic:false, fontUnderline:false, textAlign:'center', lineHeight:1, opacity:1, rotation:0 });
  applyBackground();
  renderAll();
  saveHistory();
}

function loadBusinessTemplate() {
  bgConfig = { type: 'gradient', grad1: '#1E3A5F', grad2: '#0EA5E9', angle: 160, color: '#1E3A5F' };
  addElement({ type:'shape', shape:'rect', x:0, y:0, w:559, h:200, fill:'rgba(0,0,0,.2)', stroke:'transparent', strokeWidth:0, radius:0, opacity:1, rotation:0 });
  addElement({ type:'text', x:40, y:50, w:479, h:100, text:'YOUR COMPANY', fontSize:40, fontFamily:'Montserrat', fontColor:'#ffffff', fontBold:true, fontItalic:false, fontUnderline:false, textAlign:'left', lineHeight:1.1, opacity:1, rotation:0 });
  addElement({ type:'text', x:40, y:160, w:479, h:36, text:'Professional Services', fontSize:18, fontFamily:'Inter', fontColor:'rgba(255,255,255,.7)', fontBold:false, fontItalic:false, fontUnderline:false, textAlign:'left', lineHeight:1, opacity:1, rotation:0 });
  addElement({ type:'shape', shape:'rect', x:40, y:220, w:60, h:4, fill:'#0EA5E9', stroke:'transparent', strokeWidth:0, radius:2, opacity:1, rotation:0 });
  addElement({ type:'text', x:40, y:250, w:479, h:180, text:'Delivering excellence\nand innovation since 2020.\n\nWe help businesses grow\nwith cutting-edge solutions.', fontSize:17, fontFamily:'Lato', fontColor:'rgba(255,255,255,.88)', fontBold:false, fontItalic:false, fontUnderline:false, textAlign:'left', lineHeight:1.6, opacity:1, rotation:0 });
  addElement({ type:'text', x:40, y:680, w:479, h:60, text:'www.yourcompany.com\n+1 (555) 000-1234', fontSize:15, fontFamily:'Inter', fontColor:'rgba(255,255,255,.7)', fontBold:false, fontItalic:false, fontUnderline:false, textAlign:'left', lineHeight:1.6, opacity:1, rotation:0 });
  applyBackground();
  renderAll();
  saveHistory();
}

function loadMinimalTemplate() {
  bgConfig = { type: 'solid', color: '#F8FAFC', grad1: '#7C3AED', grad2: '#DB2777', angle: 135 };
  addElement({ type:'shape', shape:'rect', x:40, y:40, w:479, h:5, fill:'#1E293B', stroke:'transparent', strokeWidth:0, radius:2, opacity:1, rotation:0 });
  addElement({ type:'text', x:40, y:80, w:479, h:100, text:'Clean Design', fontSize:52, fontFamily:'Playfair Display', fontColor:'#1E293B', fontBold:true, fontItalic:false, fontUnderline:false, textAlign:'left', lineHeight:1.1, opacity:1, rotation:0 });
  addElement({ type:'text', x:40, y:200, w:479, h:60, text:'A minimal and elegant layout\nfor your message.', fontSize:18, fontFamily:'Inter', fontColor:'#64748B', fontBold:false, fontItalic:false, fontUnderline:false, textAlign:'left', lineHeight:1.6, opacity:1, rotation:0 });
  addElement({ type:'shape', shape:'rect', x:40, y:290, w:479, h:1, fill:'#CBD5E1', stroke:'transparent', strokeWidth:0, radius:0, opacity:1, rotation:0 });
  addElement({ type:'text', x:40, y:680, w:479, h:50, text:'yourwebsite.com', fontSize:16, fontFamily:'Inter', fontColor:'#94A3B8', fontBold:false, fontItalic:false, fontUnderline:false, textAlign:'left', lineHeight:1, opacity:1, rotation:0 });
  addElement({ type:'shape', shape:'rect', x:40, y:750, w:479, h:4, fill:'#1E293B', stroke:'transparent', strokeWidth:0, radius:2, opacity:1, rotation:0 });
  applyBackground();
  renderAll();
  saveHistory();
}

/* =====================================================================
   Element factory
   ===================================================================== */
function addElement(cfg) {
  const el = Object.assign({ id: nextId++, rotation: 0, opacity: 1 }, cfg);
  elements.push(el);
  return el;
}

function defaultTextEl(x, y) {
  return addElement({
    type: 'text', x, y, w: 200, h: 60,
    text: 'Double-click to edit',
    fontSize: 24, fontFamily: 'Inter', fontColor: '#1E293B',
    fontBold: false, fontItalic: false, fontUnderline: false,
    textAlign: 'left', lineHeight: 1.3, opacity: 1, rotation: 0,
  });
}

function defaultShapeEl(shape, x, y, w, h) {
  return addElement({
    type: 'shape', shape, x, y, w, h,
    fill: '#7C3AED', stroke: '#7C3AED', strokeWidth: 0, radius: 0,
    opacity: 1, rotation: 0,
  });
}

function defaultLineEl(x, y, x2, y2) {
  return addElement({
    type: 'line',
    x: Math.min(x, x2), y: Math.min(y, y2),
    w: Math.abs(x2 - x) || 2, h: Math.abs(y2 - y) || 2,
    x1: x, y1: y, x2, y2,
    stroke: '#7C3AED', strokeWidth: 3,
    opacity: 1, rotation: 0,
  });
}

/* =====================================================================
   Render
   ===================================================================== */
function renderAll() {
  // Remove all children
  canvas.innerHTML = '';

  elements.forEach(el => {
    const node = buildNode(el);
    canvas.appendChild(node);

    if (el.id === selectedId) {
      attachHandles(node, el);
    }
  });
}

function buildNode(el) {
  let node;

  if (el.type === 'text') {
    node = document.createElement('div');
    node.className = 'canvas-el text-el';
    node.contentEditable = 'false';
    node.innerHTML = escapeHtml(el.text).replace(/\n/g, '<br>');
    applyTextStyle(node, el);

  } else if (el.type === 'shape') {
    if (el.shape === 'circle') {
      node = document.createElement('div');
      node.className = 'canvas-el shape-el';
      node.style.borderRadius = '50%';
    } else if (el.shape === 'triangle') {
      node = document.createElement('div');
      node.className = 'canvas-el shape-el';
      // Triangle via clip-path
      node.style.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
    } else {
      node = document.createElement('div');
      node.className = 'canvas-el shape-el';
      node.style.borderRadius = el.radius + 'px';
    }
    applyShapeStyle(node, el);

  } else if (el.type === 'line') {
    node = document.createElement('div');
    node.className = 'canvas-el shape-el';
    // A line is just a thin rect rotated
    const angle = Math.atan2(el.y2 - el.y1, el.x2 - el.x1) * 180 / Math.PI;
    const len = Math.sqrt((el.x2 - el.x1) ** 2 + (el.y2 - el.y1) ** 2);
    node.style.left = el.x1 + 'px';
    node.style.top = (el.y1 - el.strokeWidth / 2) + 'px';
    node.style.width = len + 'px';
    node.style.height = el.strokeWidth + 'px';
    node.style.background = el.stroke;
    node.style.transformOrigin = '0 50%';
    node.style.transform = `rotate(${angle}deg)`;
    node.style.opacity = el.opacity;
    node.dataset.id = el.id;
    node.addEventListener('mousedown', onElementMouseDown);
    if (el.id === selectedId) node.classList.add('selected');
    return node;

  } else if (el.type === 'image') {
    node = document.createElement('div');
    node.className = 'canvas-el image-el';
    const img = document.createElement('img');
    img.src = el.src;
    img.draggable = false;
    img.style.objectFit = el.fit || 'cover';
    img.style.borderRadius = (el.radius || 0) + 'px';
    node.appendChild(img);
    node.style.left = el.x + 'px';
    node.style.top = el.y + 'px';
    node.style.width = el.w + 'px';
    node.style.height = el.h + 'px';
    node.style.opacity = el.opacity;
    node.style.transform = `rotate(${el.rotation || 0}deg)`;
    node.style.overflow = 'hidden';
    node.dataset.id = el.id;
    node.addEventListener('mousedown', onElementMouseDown);
    if (el.id === selectedId) node.classList.add('selected');
    return node;
  }

  node.style.left = el.x + 'px';
  node.style.top = el.y + 'px';
  node.style.width = el.w + 'px';
  node.style.height = el.h + 'px';
  node.style.transform = `rotate(${el.rotation || 0}deg)`;
  node.dataset.id = el.id;
  node.addEventListener('mousedown', onElementMouseDown);
  if (el.id === selectedId) node.classList.add('selected');
  return node;
}

function applyTextStyle(node, el) {
  node.style.fontSize = el.fontSize + 'px';
  node.style.fontFamily = `'${el.fontFamily}', sans-serif`;
  node.style.color = el.fontColor;
  node.style.fontWeight = el.fontBold ? '700' : '400';
  node.style.fontStyle = el.fontItalic ? 'italic' : 'normal';
  node.style.textDecoration = el.fontUnderline ? 'underline' : 'none';
  node.style.textAlign = el.textAlign;
  node.style.lineHeight = el.lineHeight;
  node.style.opacity = el.opacity;
  node.style.padding = '4px';
}

function applyShapeStyle(node, el) {
  const fill = el.fillNone ? 'transparent' : el.fill;
  node.style.background = fill;
  if (el.strokeWidth > 0) {
    node.style.border = `${el.strokeWidth}px solid ${el.stroke}`;
    // for non-circle/triangle rect, also apply radius
    if (el.shape === 'rect') node.style.borderRadius = (el.radius || 0) + 'px';
  } else {
    node.style.border = 'none';
  }
  node.style.opacity = el.opacity;
}

function attachHandles(node, el) {
  const directions = ['nw','n','ne','e','se','s','sw','w'];
  directions.forEach(dir => {
    const h = document.createElement('div');
    h.className = 'resize-handle';
    h.dataset.dir = dir;
    h.addEventListener('mousedown', onResizeHandleDown);
    node.appendChild(h);
  });

  if (el.type !== 'line') {
    const rot = document.createElement('div');
    rot.className = 'rotate-handle';
    rot.addEventListener('mousedown', onRotateHandleDown);
    node.appendChild(rot);
  }
}

/* =====================================================================
   Background
   ===================================================================== */
function applyBackground() {
  if (bgConfig.type === 'solid') {
    canvas.style.background = bgConfig.color;
  } else {
    canvas.style.background = `linear-gradient(${bgConfig.angle}deg, ${bgConfig.grad1}, ${bgConfig.grad2})`;
  }
}

/* =====================================================================
   Tool buttons
   ===================================================================== */
function bindToolButtons() {
  document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tool = btn.dataset.tool;
      if (tool === 'image') {
        imgInput.click();
        return;
      }
      if (tool === 'background') {
        selectElement(null);
        setActiveTool('select');
        showBgPanel();
        return;
      }
      if (tool === 'delete') return;
      setActiveTool(tool);
    });
  });

  document.getElementById('btn-delete-el').addEventListener('click', deleteSelected);

  imgInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const el = addElement({
        type: 'image', src: ev.target.result,
        x: 30, y: 30, w: 300, h: 200,
        fit: 'cover', radius: 0, opacity: 1, rotation: 0,
      });
      selectElement(el.id);
      renderAll();
      saveHistory();
    };
    reader.readAsDataURL(file);
    imgInput.value = '';
    setActiveTool('select');
  });
}

function setActiveTool(tool) {
  activeTool = tool;
  document.querySelectorAll('.tool-btn[data-tool]').forEach(b => {
    b.classList.toggle('active', b.dataset.tool === tool);
  });
  canvas.className = '';
  if (tool !== 'select') canvas.classList.add(`tool-${tool}`);
}

/* =====================================================================
   Top bar
   ===================================================================== */
function bindTopBarButtons() {
  document.getElementById('btn-undo').addEventListener('click', undo);
  document.getElementById('btn-redo').addEventListener('click', redo);
  document.getElementById('btn-download').addEventListener('click', exportPNG);
  document.getElementById('btn-bg-quick').addEventListener('click', showBgPanel);
}

/* =====================================================================
   Canvas Mouse Events
   ===================================================================== */
function bindCanvasEvents() {
  canvas.addEventListener('mousedown', onCanvasMouseDown);
  canvas.addEventListener('dblclick', onCanvasDblClick);
  document.addEventListener('mousemove', onDocMouseMove);
  document.addEventListener('mouseup', onDocMouseUp);
}

function getCanvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) / zoom,
    y: (e.clientY - rect.top) / zoom,
  };
}

function onCanvasMouseDown(e) {
  if (e.target !== canvas) return; // handled by element listeners

  const pt = getCanvasPoint(e);

  if (activeTool === 'select') {
    selectElement(null);
    return;
  }

  if (activeTool === 'text') {
    const el = defaultTextEl(pt.x - 100, pt.y - 20);
    selectElement(el.id);
    renderAll();
    saveHistory();
    setActiveTool('select');
    // auto open for editing
    setTimeout(() => {
      const node = canvas.querySelector(`[data-id="${el.id}"]`);
      if (node) startEditing(node, el);
    }, 50);
    return;
  }

  // Shape / line drawing
  if (['rect','circle','triangle','line'].includes(activeTool)) {
    isDrawing = true;
    drawStart = { x: pt.x, y: pt.y, tool: activeTool };
    let ghost = document.createElement('div');
    ghost.className = 'drawing-ghost';
    ghost.id = 'drawing-ghost';
    if (activeTool === 'circle') ghost.style.borderRadius = '50%';
    if (activeTool === 'triangle') ghost.style.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
    ghost.style.left = pt.x + 'px';
    ghost.style.top = pt.y + 'px';
    ghost.style.width = '0';
    ghost.style.height = '0';
    canvas.appendChild(ghost);
    e.preventDefault();
  }
}

function onElementMouseDown(e) {
  e.stopPropagation();
  const id = parseInt(e.currentTarget.dataset.id, 10);

  if (activeTool !== 'select') return;

  selectElement(id);
  renderAll(); // re-render to show handles

  const el = getEl(id);
  const pt = getCanvasPoint(e);
  isDragging = true;
  dragStart = { mouseX: pt.x, mouseY: pt.y, elX: el.x, elY: el.y };
  e.preventDefault();
}

function onResizeHandleDown(e) {
  e.stopPropagation();
  e.preventDefault();
  isResizing = true;
  const el = getEl(selectedId);
  const pt = getCanvasPoint(e);
  resizeState = {
    dir: e.target.dataset.dir,
    startMX: pt.x, startMY: pt.y,
    startX: el.x, startY: el.y, startW: el.w, startH: el.h,
  };
}

function onRotateHandleDown(e) {
  e.stopPropagation();
  e.preventDefault();
  isRotating = true;
  const el = getEl(selectedId);
  const rect = canvas.querySelector(`[data-id="${el.id}"]`).getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  rotateState = { centerX, centerY, startRotation: el.rotation || 0 };
}

function onDocMouseMove(e) {
  if (isDragging && selectedId !== null) {
    const el = getEl(selectedId);
    const pt = getCanvasPoint(e);
    const newX = dragStart.elX + (pt.x - dragStart.mouseX);
    const newY = dragStart.elY + (pt.y - dragStart.mouseY);
    if (el.type === 'line') {
      // Offset line endpoints by the same delta
      const dx = newX - el.x;
      const dy = newY - el.y;
      el.x1 = (el.x1 || el.x) + dx;
      el.y1 = (el.y1 || el.y) + dy;
      el.x2 = (el.x2 || el.x + el.w) + dx;
      el.y2 = (el.y2 || el.y + el.h) + dy;
      el.x = newX;
      el.y = newY;
      renderAll(); // lines need full re-render to update angle
    } else {
      el.x = newX;
      el.y = newY;
      const node = canvas.querySelector(`[data-id="${el.id}"]`);
      if (node) {
        node.style.left = el.x + 'px';
        node.style.top = el.y + 'px';
      }
    }
    updatePropPanel(el);
    return;
  }

  if (isResizing && selectedId !== null) {
    const el = getEl(selectedId);
    const pt = getCanvasPoint(e);
    const dx = pt.x - resizeState.startMX;
    const dy = pt.y - resizeState.startMY;
    const dir = resizeState.dir;

    let newX = resizeState.startX;
    let newY = resizeState.startY;
    let newW = resizeState.startW;
    let newH = resizeState.startH;

    if (dir.includes('e')) newW = Math.max(10, resizeState.startW + dx);
    if (dir.includes('s')) newH = Math.max(10, resizeState.startH + dy);
    if (dir.includes('w')) { newW = Math.max(10, resizeState.startW - dx); newX = resizeState.startX + resizeState.startW - newW; }
    if (dir.includes('n')) { newH = Math.max(10, resizeState.startH - dy); newY = resizeState.startY + resizeState.startH - newH; }

    el.x = newX; el.y = newY; el.w = newW; el.h = newH;

    const node = canvas.querySelector(`[data-id="${el.id}"]`);
    if (node) {
      node.style.left = el.x + 'px';
      node.style.top = el.y + 'px';
      node.style.width = el.w + 'px';
      node.style.height = el.h + 'px';
    }
    updatePropPanel(el);
    return;
  }

  if (isRotating && selectedId !== null) {
    const el = getEl(selectedId);
    const angle = Math.atan2(
      e.clientY - rotateState.centerY,
      e.clientX - rotateState.centerX
    ) * 180 / Math.PI + 90;
    el.rotation = Math.round(angle);
    const node = canvas.querySelector(`[data-id="${el.id}"]`);
    if (node) node.style.transform = `rotate(${el.rotation}deg)`;
    updatePropPanel(el);
    return;
  }

  if (isDrawing) {
    const pt = getCanvasPoint(e);
    const x = Math.min(pt.x, drawStart.x);
    const y = Math.min(pt.y, drawStart.y);
    const w = Math.abs(pt.x - drawStart.x);
    const h = Math.abs(pt.y - drawStart.y);
    const ghost = document.getElementById('drawing-ghost');
    if (ghost) {
      ghost.style.left = x + 'px';
      ghost.style.top = y + 'px';
      ghost.style.width = w + 'px';
      ghost.style.height = h + 'px';
    }
  }
}

function onDocMouseUp(e) {
  if (isDragging) {
    isDragging = false;
    if (selectedId !== null) saveHistory();
  }
  if (isResizing) {
    isResizing = false;
    renderAll();
    saveHistory();
  }
  if (isRotating) {
    isRotating = false;
    saveHistory();
  }
  if (isDrawing) {
    isDrawing = false;
    const ghost = document.getElementById('drawing-ghost');
    if (ghost) ghost.remove();

    const pt = getCanvasPoint(e);
    const x = Math.min(pt.x, drawStart.x);
    const y = Math.min(pt.y, drawStart.y);
    const w = Math.max(20, Math.abs(pt.x - drawStart.x));
    const h = Math.max(20, Math.abs(pt.y - drawStart.y));

    let el;
    if (drawStart.tool === 'line') {
      el = defaultLineEl(drawStart.x, drawStart.y, pt.x, pt.y);
    } else {
      el = defaultShapeEl(drawStart.tool, x, y, w, h);
    }
    selectElement(el.id);
    renderAll();
    saveHistory();
    setActiveTool('select');
  }
}

function onCanvasDblClick(e) {
  if (e.target === canvas) return;
  const node = e.target.closest('.canvas-el');
  if (!node) return;
  const id = parseInt(node.dataset.id, 10);
  const el = getEl(id);
  if (el && el.type === 'text') {
    startEditing(node, el);
  }
}

/* =====================================================================
   Text editing (contentEditable)
   ===================================================================== */
function startEditing(node, el) {
  node.contentEditable = 'true';
  node.focus();
  // Place cursor at end
  const range = document.createRange();
  range.selectNodeContents(node);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  node.addEventListener('blur', () => finishEditing(node, el), { once: true });
  node.addEventListener('keydown', e => {
    if (e.key === 'Escape') { node.blur(); }
  });
}

function finishEditing(node, el) {
  node.contentEditable = 'false';
  // Extract plain text safely using DOM traversal (avoids innerHTML regex sanitization bypass)
  el.text = extractPlainText(node);
  renderAll();
  saveHistory();
}

function extractPlainText(node) {
  let text = '';
  node.childNodes.forEach(child => {
    if (child.nodeType === Node.TEXT_NODE) {
      text += child.textContent;
    } else if (child.nodeName === 'BR') {
      text += '\n';
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      text += extractPlainText(child);
    }
  });
  return text;
}

/* =====================================================================
   Selection
   ===================================================================== */
function selectElement(id) {
  selectedId = id;
  renderAll();
  if (id === null) {
    showDefaultPanel();
  } else {
    const el = getEl(id);
    if (el) updatePropPanel(el);
  }
}

function getEl(id) {
  return elements.find(e => e.id === id);
}

function deleteSelected() {
  if (selectedId === null) return;
  elements = elements.filter(e => e.id !== selectedId);
  selectedId = null;
  renderAll();
  showDefaultPanel();
  saveHistory();
}

/* =====================================================================
   Property Panel
   ===================================================================== */
function bindPropertyPanel() {
  // Text props
  document.getElementById('prop-font-family').addEventListener('change', e => { updateProp('fontFamily', e.target.value); });
  document.getElementById('prop-font-size').addEventListener('input', e => { updateProp('fontSize', parseInt(e.target.value, 10)); });
  document.getElementById('prop-font-color').addEventListener('input', e => { updateProp('fontColor', e.target.value); });
  document.getElementById('prop-line-height').addEventListener('input', e => { updateProp('lineHeight', parseFloat(e.target.value)); });

  const opacityText = document.getElementById('prop-text-opacity');
  opacityText.addEventListener('input', e => {
    document.getElementById('prop-text-opacity-val').textContent = e.target.value + '%';
    updateProp('opacity', e.target.value / 100);
  });

  document.querySelectorAll('.align-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.align-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateProp('textAlign', btn.dataset.align);
    });
  });

  document.querySelectorAll('.style-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      const s = btn.dataset.style;
      const el = getEl(selectedId);
      if (!el) return;
      if (s === 'bold') updateProp('fontBold', !el.fontBold);
      if (s === 'italic') updateProp('fontItalic', !el.fontItalic);
      if (s === 'underline') updateProp('fontUnderline', !el.fontUnderline);
    });
  });

  // Shape props
  document.getElementById('prop-shape-fill').addEventListener('input', e => { updateProp('fill', e.target.value); });
  document.getElementById('prop-shape-fill-none').addEventListener('change', e => { updateProp('fillNone', e.target.checked); });
  document.getElementById('prop-shape-stroke').addEventListener('input', e => { updateProp('stroke', e.target.value); });
  document.getElementById('prop-shape-stroke-width').addEventListener('input', e => { updateProp('strokeWidth', parseInt(e.target.value, 10)); });
  document.getElementById('prop-shape-radius').addEventListener('input', e => { updateProp('radius', parseInt(e.target.value, 10)); });

  const opacityShape = document.getElementById('prop-shape-opacity');
  opacityShape.addEventListener('input', e => {
    document.getElementById('prop-shape-opacity-val').textContent = e.target.value + '%';
    updateProp('opacity', e.target.value / 100);
  });

  // Image props
  const opacityImg = document.getElementById('prop-img-opacity');
  opacityImg.addEventListener('input', e => {
    document.getElementById('prop-img-opacity-val').textContent = e.target.value + '%';
    updateProp('opacity', e.target.value / 100);
  });
  document.getElementById('prop-img-fit').addEventListener('change', e => { updateProp('fit', e.target.value); });
  document.getElementById('prop-img-radius').addEventListener('input', e => { updateProp('radius', parseInt(e.target.value, 10)); });

  // Transform
  document.getElementById('prop-x').addEventListener('input', e => { updateProp('x', parseInt(e.target.value, 10)); });
  document.getElementById('prop-y').addEventListener('input', e => { updateProp('y', parseInt(e.target.value, 10)); });
  document.getElementById('prop-w').addEventListener('input', e => { updateProp('w', parseInt(e.target.value, 10)); });
  document.getElementById('prop-h').addEventListener('input', e => { updateProp('h', parseInt(e.target.value, 10)); });
  document.getElementById('prop-rotation').addEventListener('input', e => { updateProp('rotation', parseInt(e.target.value, 10)); });

  // Layer
  document.getElementById('btn-bring-front').addEventListener('click', bringToFront);
  document.getElementById('btn-send-back').addEventListener('click', sendToBack);

  // Background
  document.getElementById('prop-bg-type').addEventListener('change', e => {
    bgConfig.type = e.target.value;
    document.getElementById('bg-solid-row').style.display = e.target.value === 'solid' ? 'flex' : 'none';
    document.getElementById('bg-gradient-rows').style.display = e.target.value === 'gradient' ? 'block' : 'none';
    applyBackground();
  });
  document.getElementById('prop-bg-color').addEventListener('input', e => { bgConfig.color = e.target.value; applyBackground(); });
  document.getElementById('prop-bg-grad1').addEventListener('input', e => { bgConfig.grad1 = e.target.value; applyBackground(); });
  document.getElementById('prop-bg-grad2').addEventListener('input', e => { bgConfig.grad2 = e.target.value; applyBackground(); });
  document.getElementById('prop-bg-angle').addEventListener('input', e => { bgConfig.angle = parseInt(e.target.value, 10); applyBackground(); });
}

function updateProp(key, value) {
  const el = getEl(selectedId);
  if (!el) return;
  el[key] = value;
  // Live update the DOM node
  const node = canvas.querySelector(`[data-id="${el.id}"]`);
  if (node) {
    if (el.type === 'text') applyTextStyle(node, el);
    else if (el.type === 'shape') applyShapeStyle(node, el);
    else if (el.type === 'image') {
      node.style.opacity = el.opacity;
      node.style.overflow = 'hidden';
      const img = node.querySelector('img');
      if (img) {
        img.style.objectFit = el.fit || 'cover';
        img.style.borderRadius = (el.radius || 0) + 'px';
      }
    }
    if (['x','y'].includes(key)) {
      node.style.left = el.x + 'px';
      node.style.top = el.y + 'px';
    }
    if (['w','h'].includes(key)) {
      node.style.width = el.w + 'px';
      node.style.height = el.h + 'px';
    }
    if (key === 'rotation') {
      node.style.transform = `rotate(${el.rotation}deg)`;
    }
    if (key === 'radius' && el.type === 'shape' && el.shape === 'rect') {
      node.style.borderRadius = el.radius + 'px';
    }
  }
}

function updatePropPanel(el) {
  // Hide all sections
  document.getElementById('props-default').style.display = 'none';
  document.getElementById('props-text').style.display = 'none';
  document.getElementById('props-shape').style.display = 'none';
  document.getElementById('props-image').style.display = 'none';
  document.getElementById('props-transform').style.display = 'none';
  document.getElementById('props-background').style.display = 'none';

  // Show transform always
  document.getElementById('props-transform').style.display = 'block';

  // Set transform values
  document.getElementById('prop-x').value = Math.round(el.x);
  document.getElementById('prop-y').value = Math.round(el.y);
  document.getElementById('prop-w').value = Math.round(el.w);
  document.getElementById('prop-h').value = Math.round(el.h);
  document.getElementById('prop-rotation').value = Math.round(el.rotation || 0);

  if (el.type === 'text') {
    const s = document.getElementById('props-text');
    s.style.display = 'block';
    document.getElementById('prop-font-family').value = el.fontFamily || 'Inter';
    document.getElementById('prop-font-size').value = el.fontSize || 24;
    document.getElementById('prop-font-color').value = el.fontColor || '#1E293B';
    document.getElementById('prop-line-height').value = el.lineHeight || 1.3;
    const textOpacityPct = Math.round((el.opacity ?? 1) * 100);
    document.getElementById('prop-text-opacity').value = textOpacityPct;
    document.getElementById('prop-text-opacity-val').textContent = textOpacityPct + '%';
    document.querySelectorAll('.align-btn').forEach(b => b.classList.toggle('active', b.dataset.align === el.textAlign));
    document.querySelector('[data-style="bold"]').classList.toggle('active', !!el.fontBold);
    document.querySelector('[data-style="italic"]').classList.toggle('active', !!el.fontItalic);
    document.querySelector('[data-style="underline"]').classList.toggle('active', !!el.fontUnderline);

  } else if (el.type === 'shape' || el.type === 'line') {
    const s = document.getElementById('props-shape');
    s.style.display = 'block';
    document.getElementById('prop-shape-fill').value = el.fill || '#7C3AED';
    document.getElementById('prop-shape-fill-none').checked = !!el.fillNone;
    document.getElementById('prop-shape-stroke').value = el.stroke || '#7C3AED';
    document.getElementById('prop-shape-stroke-width').value = el.strokeWidth || 0;
    document.getElementById('prop-shape-radius').value = el.radius || 0;
    const shapeOpacityPct = Math.round((el.opacity ?? 1) * 100);
    document.getElementById('prop-shape-opacity').value = shapeOpacityPct;
    document.getElementById('prop-shape-opacity-val').textContent = shapeOpacityPct + '%';

  } else if (el.type === 'image') {
    const s = document.getElementById('props-image');
    s.style.display = 'block';
    const imgOpacityPct = Math.round((el.opacity ?? 1) * 100);
    document.getElementById('prop-img-opacity').value = imgOpacityPct;
    document.getElementById('prop-img-opacity-val').textContent = imgOpacityPct + '%';
    document.getElementById('prop-img-fit').value = el.fit || 'cover';
    document.getElementById('prop-img-radius').value = el.radius || 0;
  }
}

function showDefaultPanel() {
  document.getElementById('props-default').style.display = 'block';
  document.getElementById('props-text').style.display = 'none';
  document.getElementById('props-shape').style.display = 'none';
  document.getElementById('props-image').style.display = 'none';
  document.getElementById('props-transform').style.display = 'none';
  document.getElementById('props-background').style.display = 'none';
}

function showBgPanel() {
  document.getElementById('props-default').style.display = 'none';
  document.getElementById('props-text').style.display = 'none';
  document.getElementById('props-shape').style.display = 'none';
  document.getElementById('props-image').style.display = 'none';
  document.getElementById('props-transform').style.display = 'none';
  document.getElementById('props-background').style.display = 'block';

  document.getElementById('prop-bg-type').value = bgConfig.type;
  document.getElementById('prop-bg-color').value = bgConfig.color;
  document.getElementById('prop-bg-grad1').value = bgConfig.grad1;
  document.getElementById('prop-bg-grad2').value = bgConfig.grad2;
  document.getElementById('prop-bg-angle').value = bgConfig.angle;
  document.getElementById('bg-solid-row').style.display = bgConfig.type === 'solid' ? 'flex' : 'none';
  document.getElementById('bg-gradient-rows').style.display = bgConfig.type === 'gradient' ? 'block' : 'none';
}

/* =====================================================================
   Layers
   ===================================================================== */
function bringToFront() {
  const idx = elements.findIndex(e => e.id === selectedId);
  if (idx < elements.length - 1) {
    const [el] = elements.splice(idx, 1);
    elements.push(el);
    renderAll();
    saveHistory();
  }
}

function sendToBack() {
  const idx = elements.findIndex(e => e.id === selectedId);
  if (idx > 0) {
    const [el] = elements.splice(idx, 1);
    elements.unshift(el);
    renderAll();
    saveHistory();
  }
}

/* =====================================================================
   Keyboard shortcuts
   ===================================================================== */
function bindKeyboard() {
  document.addEventListener('keydown', e => {
    const tag = document.activeElement.tagName.toLowerCase();
    const editable = document.activeElement.contentEditable === 'true';
    if (editable || ['input','textarea','select'].includes(tag)) return;

    if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected();
    if (e.key === 'Escape') selectElement(null);
    if (e.key === 'v' || e.key === 'V') setActiveTool('select');
    if (e.key === 't' || e.key === 'T') setActiveTool('text');
    if (e.key === 'r' || e.key === 'R') setActiveTool('rect');
    if (e.key === 'c' || e.key === 'C') setActiveTool('circle');
    if (e.key === 'l' || e.key === 'L') setActiveTool('line');
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Z')) { e.preventDefault(); redo(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); duplicateSelected(); }

    // Arrow nudge
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key) && selectedId !== null) {
      const el = getEl(selectedId);
      if (!el) return;
      const step = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowLeft') el.x -= step;
      if (e.key === 'ArrowRight') el.x += step;
      if (e.key === 'ArrowUp') el.y -= step;
      if (e.key === 'ArrowDown') el.y += step;
      renderAll();
      updatePropPanel(el);
      e.preventDefault();
    }
  });
}

function duplicateSelected() {
  if (selectedId === null) return;
  const src = getEl(selectedId);
  if (!src) return;
  const copy = JSON.parse(JSON.stringify(src));
  copy.id = nextId++;
  copy.x += 20;
  copy.y += 20;
  elements.push(copy);
  selectElement(copy.id);
  renderAll();
  saveHistory();
}

/* =====================================================================
   Zoom
   ===================================================================== */
function bindZoomButtons() {
  document.getElementById('btn-zoom-in').addEventListener('click', () => applyZoom(Math.min(3, zoom + 0.1)));
  document.getElementById('btn-zoom-out').addEventListener('click', () => applyZoom(Math.max(0.2, zoom - 0.1)));
  document.getElementById('btn-zoom-fit').addEventListener('click', fitZoom);
  fitZoom();
}

function applyZoom(z) {
  zoom = parseFloat(z.toFixed(2));
  wrapper.style.transform = `scale(${zoom})`;
  wrapper.style.width = A5_W + 'px';
  wrapper.style.height = A5_H + 'px';
  document.getElementById('zoom-label').textContent = Math.round(zoom * 100) + '%';
}

function fitZoom() {
  const area = document.querySelector('.canvas-scroll');
  const aw = area.clientWidth - 80;
  const ah = area.clientHeight - 80;
  const zw = aw / A5_W;
  const zh = ah / A5_H;
  applyZoom(Math.min(zw, zh, 1));
}

/* =====================================================================
   History (Undo / Redo)
   ===================================================================== */
function saveHistory() {
  const snapshot = JSON.stringify({ elements, bgConfig, selectedId });
  history = history.slice(0, historyIndex + 1);
  history.push(snapshot);
  if (history.length > 60) history.shift();
  historyIndex = history.length - 1;
  updateUndoRedoBtns();
}

function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    restoreSnapshot(history[historyIndex]);
  }
}

function redo() {
  if (historyIndex < history.length - 1) {
    historyIndex++;
    restoreSnapshot(history[historyIndex]);
  }
}

function restoreSnapshot(snapshot) {
  const state = JSON.parse(snapshot);
  elements = state.elements;
  bgConfig = state.bgConfig;
  selectedId = state.selectedId;
  nextId = elements.length > 0 ? elements.reduce((max, e) => Math.max(max, e.id), 0) + 1 : 1;
  applyBackground();
  renderAll();
  if (selectedId) {
    const el = getEl(selectedId);
    if (el) updatePropPanel(el);
  } else {
    showDefaultPanel();
  }
  updateUndoRedoBtns();
}

function updateUndoRedoBtns() {
  document.getElementById('btn-undo').disabled = historyIndex <= 0;
  document.getElementById('btn-redo').disabled = historyIndex >= history.length - 1;
}

/* =====================================================================
   Export PNG
   ===================================================================== */
function exportPNG() {
  const prevSelected = selectedId;
  selectElement(null); // deselect to remove handles

  const title = document.getElementById('flyer-title').value.trim() || 'flyer';

  // Use html2canvas if available, else fall back to a notice
  if (typeof html2canvas !== 'undefined') {
    showToast('Exporting…');
    html2canvas(canvas, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      width: A5_W,
      height: A5_H,
    }).then(canvasEl => {
      const link = document.createElement('a');
      link.download = `${title}.png`;
      link.href = canvasEl.toDataURL('image/png');
      link.click();
      showToast('✅ Downloaded!');
      if (prevSelected) selectElement(prevSelected);
    }).catch(() => {
      showToast('Export failed – try again.');
      if (prevSelected) selectElement(prevSelected);
    });
  } else {
    showToast('Exporting… (loading library)');
    setTimeout(() => {
      if (typeof html2canvas !== 'undefined') {
        exportPNG();
      } else {
        showToast('html2canvas not loaded. Check network.');
      }
    }, 1500);
  }
}

/* =====================================================================
   Toast
   ===================================================================== */
function showToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2500);
}

/* =====================================================================
   Helpers
   ===================================================================== */
function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
