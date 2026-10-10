// Isolated, dependency-free review carousel. No analytics or third-party scripts.
function setupShowcase(root) {
  if (root.dataset.ready) return;
  root.dataset.ready = 'true';
  const slides = [...root.querySelectorAll('.cr-slide')];
  const tabs = [...root.querySelectorAll('.cr-tab')];
  const toggle = root.querySelector('[data-rotation]');
  const status = root.querySelector('[data-status]');
  const current = root.querySelector('[data-current]');
  const announce = root.querySelector('[data-announcement]');
  const dialog = root.querySelector('.cr-dialog');
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, elapsed = 0, lastTime = 0, userPaused = media.matches;
  let hovered = false, focused = false, visible = true, previousOpener = null;
  const duration = i => Math.max(10000, Number(slides[i].dataset.readingTime || 16000));
  const blocked = () => userPaused || hovered || focused || document.hidden || !visible || dialog.open;
  function updateStatus() {
    toggle.innerHTML = userPaused ? '▶' : 'Ⅱ';
    toggle.setAttribute('aria-label', userPaused ? 'Start automatic slideshow' : 'Pause automatic slideshow');
    toggle.title = userPaused ? 'Start automatic slideshow' : 'Pause automatic slideshow';
    status.textContent = userPaused ? 'Autoplay paused' : (hovered || focused || dialog.open) ? 'Paused while you explore' : 'Auto-playing · pause anytime';
  }
  function select(next, manual = false) {
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, i) => { slide.hidden = i !== index; });
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-pressed', String(i === index));
      tab.style.setProperty('--cr-progress', '0');
    });
    current.textContent = String(index + 1).padStart(2, '0');
    elapsed = 0;
    if (manual) announce.textContent = `Review ${index + 1} of ${slides.length}: ${slides[index].dataset.author}`;
    updateStatus();
  }
  tabs.forEach((tab, i) => tab.addEventListener('click', () => select(i, true)));
  root.querySelector('[data-prev]').addEventListener('click', () => select(index - 1, true));
  root.querySelector('[data-next]').addEventListener('click', () => select(index + 1, true));
  toggle.addEventListener('click', () => { userPaused = !userPaused; updateStatus(); });
  root.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovered = true; updateStatus(); } });
  root.addEventListener('pointerleave', () => { hovered = false; updateStatus(); });
  root.addEventListener('focusin', () => { focused = true; updateStatus(); });
  root.addEventListener('focusout', () => { setTimeout(() => { focused = root.contains(document.activeElement); updateStatus(); }, 0); });
  media.addEventListener('change', event => { if (event.matches) userPaused = true; updateStatus(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }, { threshold: 0.08 }).observe(root);
  }
  const stage = root.querySelector('.cr-stage');
  let start = null;
  stage.addEventListener('touchstart', e => { start = {x:e.touches[0].clientX, y:e.touches[0].clientY}; }, {passive:true});
  stage.addEventListener('touchend', e => {
    if (!start) return;
    const x = e.changedTouches[0].clientX - start.x, y = e.changedTouches[0].clientY - start.y;
    if (Math.abs(x) > 55 && Math.abs(x) > Math.abs(y) * 1.5) select(index + (x < 0 ? 1 : -1), true);
    start = null;
  }, {passive:true});
  stage.addEventListener('keydown', e => {
    if (dialog.open) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); select(index + 1, true); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); select(index - 1, true); }
  });
  root.querySelectorAll('[data-enlarge]').forEach(button => button.addEventListener('click', () => {
    previousOpener = button;
    const img = button.querySelector('img');
    const target = dialog.querySelector('.cr-dialog-image');
    target.src = img.src;
    target.alt = img.alt;
    dialog.querySelector('h3').textContent = button.dataset.title;
    dialog.showModal();
    updateStatus();
  }));
  dialog.querySelector('.cr-dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => {
    if (e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => { if (previousOpener) previousOpener.focus(); updateStatus(); });
  function frame(time) {
    const delta = lastTime ? Math.min(time - lastTime, 100) : 0;
    lastTime = time;
    if (!blocked()) {
      elapsed += delta;
      tabs[index].style.setProperty('--cr-progress', String(Math.min(elapsed / duration(index), 1)));
      if (elapsed >= duration(index)) select(index + 1);
    }
    requestAnimationFrame(frame);
  }
  select(0);
  requestAnimationFrame(frame);
}
document.querySelectorAll('[data-client-showcase]').forEach(setupShowcase);
