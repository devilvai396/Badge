export function mountBadge(root, env) {
  const STYLES = [
    { id:"pop",   name:"Pop",    bg:"#fff7ed", ink:"#0f172a", a:"#0ea5e9", b:"#ec4899" },
    { id:"mint",  name:"Mint",   bg:"#ecfeff", ink:"#052e16", a:"#22c55e", b:"#0ea5e9" },
    { id:"night", name:"Night",  bg:"#0b1020", ink:"#e2e8f0", a:"#a78bfa", b:"#22c55e" },
    { id:"amber", name:"Amber",  bg:"#fffbeb", ink:"#111827", a:"#f59e0b", b:"#ef4444" },
    { id:"mono",  name:"Mono",   bg:"#ffffff", ink:"#0f172a", a:"#0f172a", b:"#94a3b8" }
  ];

  const state = { env, name:"", style:STYLES[0], copied:false };

  function esc(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function haptic(){ if (navigator.vibrate) navigator.vibrate(12); }

  function save(){ try { localStorage.setItem("badge:name", state.name); localStorage.setItem("badge:style", state.style.id); } catch {} }
  function load(){
    try {
      state.name = localStorage.getItem("badge:name") || "";
      const sid = localStorage.getItem("badge:style") || STYLES[0].id;
      state.style = STYLES.find(s => s.id === sid) || STYLES[0];
    } catch {}
  }

  function roundRect(ctx, x, y, w, h, r){
    const rr = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+rr, y);
    ctx.arcTo(x+w, y, x+w, y+h, rr);
    ctx.arcTo(x+w, y+h, x, y+h, rr);
    ctx.arcTo(x, y+h, x, y, rr);
    ctx.arcTo(x, y, x+w, y, rr);
    ctx.closePath();
  }

  function draw(){
    const cv = root.querySelector("#cv");
    if (!cv) return;
    const ctx = cv.getContext("2d");

    const cssW = Math.min(560, root.querySelector(".card").clientWidth - 24);
    const cssH = 210;
    cv.style.width = cssW + "px";
    cv.style.height = cssH + "px";
    cv.width = Math.floor(cssW * devicePixelRatio);
    cv.height = Math.floor(cssH * devicePixelRatio);
    ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);

    const { bg, ink, a, b } = state.style;

    ctx.clearRect(0,0,cssW,cssH);
    ctx.fillStyle = bg;
    roundRect(ctx, 0,0, cssW, cssH, 22);
    ctx.fill();

    if (bg !== "#0b1020") {
      ctx.fillStyle = "rgba(15,23,42,.06)";
      for (let i=0;i<180;i++){
        ctx.fillRect(Math.random()*cssW, Math.random()*cssH, 1, 1);
      }
    }

    ctx.fillStyle = a; roundRect(ctx, 18, 18, 74, 34, 10); ctx.fill();
    ctx.fillStyle = b; roundRect(ctx, cssW-92, cssH-52, 74, 34, 10); ctx.fill();

    ctx.strokeStyle = (bg === "#0b1020") ? "rgba(226,232,240,.18)" : "rgba(15,23,42,.20)";
    ctx.lineWidth = 2; roundRect(ctx, 10,10, cssW-20, cssH-20, 22); ctx.stroke();

    ctx.fillStyle = ink;
    ctx.font = "800 22px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
    ctx.fillText("HELLO", 24, 72);
    ctx.fillText("MY NAME IS", 24, 98);

    const name = (state.name || "__________").toUpperCase();
    let fs = 46;
    const maxW = cssW - 48;
    while (fs > 26) {
      ctx.font = `900 ${fs}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto`;
      if (ctx.measureText(name).width <= maxW) break;
      fs -= 2;
    }
    ctx.fillText(name, 24, 156);

    ctx.fillStyle = (bg === "#0b1020") ? "rgba(226,232,240,.70)" : "rgba(15,23,42,.55)";
    ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
    ctx.fillText(env.isMini ? "FARCASTER/BASE" : "WEB PREVIEW", 24, cssH-22);
  }

  async function setName(v){
    state.name = (v || "").trim().slice(0, 26);
    state.copied = false;
    save(); render(false); draw();
  }

  function setStyle(id){
    state.style = STYLES.find(s => s.id === id) || STYLES[0];
    state.copied = false;
    save(); render(false); draw();
  }

  function downloadPng(){
    const cv = root.querySelector("#cv");
    const url = cv.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = (state.name ? state.name : "badge") + ".png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    state.copied = true;
    render(false);
    haptic();
  }

  async function copyPng(){
    const cv = root.querySelector("#cv");
    try {
      const blob = await new Promise(res => cv.toBlob(res, "image/png"));
      if (!blob) throw new Error("no blob");
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        state.copied = true;
        render(false);
        haptic();
        return;
      }
    } catch {}
    downloadPng();
  }

  function render(focus=true){
    root.innerHTML = `
      <div class="wrap">
        <header class="top">
          <div class="brand">
            <div class="logo">BADGE</div>
            <div class="sub">${env.isMini ? "Mini App" : "Web"} • instant sticker</div>
          </div>
          <button class="btn ghost" id="random" title="Random style">Mix</button>
        </header>

        <main class="card">
          <div class="hint">Type a name, choose a vibe, then copy or download your badge.</div>

          <div class="row">
            <input id="name" maxlength="26" placeholder="Your name…" value="${esc(state.name)}" />
            <button class="btn" id="make">Make</button>
          </div>

          <canvas id="cv" width="560" height="210" aria-label="Badge preview"></canvas>

          <div class="actions">
            <button class="btn" id="copy">${state.copied ? "Done" : "Copy PNG"}</button>
            <button class="btn ghost" id="dl">Download</button>
          </div>

          <div class="styleTitle">Styles</div>
          <div class="styles">
            ${STYLES.map(s => `
              <button class="chip ${s.id===state.style.id ? "on":""}" data-s="${s.id}">
                <span class="sw" style="background:${s.a}"></span>
                <span>${s.name}</span>
              </button>
            `).join("")}
          </div>
        </main>

        <footer class="foot">
          <div class="envpill">${env.isMini ? "Farcaster/Base" : "Web preview"}</div>
          <div class="tiny">No login. Saved locally.</div>
        </footer>
      </div>
    `;

    const $name = root.querySelector("#name");
    root.querySelector("#make").addEventListener("click", () => setName($name.value));
    $name.addEventListener("keydown", (e) => { if (e.key==="Enter"){ e.preventDefault(); setName($name.value);} });

    root.querySelector("#copy").addEventListener("click", copyPng);
    root.querySelector("#dl").addEventListener("click", downloadPng);

    root.querySelector("#random").addEventListener("click", () => {
      const next = STYLES[Math.floor(Math.random()*STYLES.length)];
      setStyle(next.id);
      haptic();
    });

    root.querySelectorAll(".chip").forEach(btn => {
      btn.addEventListener("click", () => { setStyle(btn.getAttribute("data-s")); haptic(); });
    });

    if (focus) $name.focus();
    draw();
  }

  load();
  render(true);
}
