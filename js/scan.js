// Perisai yang "dipindai" sebagai awan titik: berputar pelan, garis pindai lewat tiap ~7 detik,
// titik di sekitar lubang kunci menyala lime saat tersapu. Tanpa garis antar titik, tanpa glow.
document.querySelectorAll('canvas[data-scan]').forEach((canvas) => {
    const ctx = canvas.getContext('2d');
    const css = getComputedStyle(document.documentElement);
    const color = (name) => css.getPropertyValue(name).trim();
    const shades = [color('--point-lo'), color('--point-mid'), color('--point-hi')];
    const lime = color('--color-accent');

    // Siluet perisai: atas datar, sisi lurus, meruncing ke bawah. Lubang kunci di tengah.
    const inShield = (x, y) => {
        if (y > 1 || y < -1.25) return false;
        const half = y > 0.15 ? 1 - Math.max(0, y - 0.85) * 0.6 : Math.sqrt(Math.max(0, (y + 1.25) / 1.4));
        return Math.abs(x) <= half;
    };
    // m > 0 melebarkan lubang kunci, dipakai untuk mencari titik di tepinya.
    const inKeyhole = (x, y, m = 0) => Math.hypot(x, y - 0.3) < 0.2 + m || (Math.abs(x) < 0.08 + m && y > -0.35 - m && y < 0.3);

    const points = [];
    while (points.length < 5200) {
        const x = Math.random() * 2 - 1, y = Math.random() * 2.25 - 1.25;
        if (!inShield(x, y) || inKeyhole(x, y)) continue;
        // Permukaan sedikit cembung, ketebalan tipis.
        const z = (1 - x * x) * 0.25 + (Math.random() - 0.5) * 0.08;
        points.push({ x, y, z, rim: inKeyhole(x, y, 0.07) });
    }

    let w = 0, h = 0, dpr = 1, running = false, raf = 0, start = performance.now();
    const resize = () => {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = canvas.clientWidth; h = canvas.clientHeight;
        canvas.width = w * dpr; canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (t) => {
        ctx.clearRect(0, 0, w, h);
        const angle = Math.sin(t / 9000) * 0.6;
        const cos = Math.cos(angle), sin = Math.sin(angle);
        const sweep = 1.1 - ((t / 7000) % 1) * 2.5; // dari atas ke bawah
        const scale = Math.min(w, h) * 0.5, cx = w / 2, cy = h / 2 - scale * 0.08;
        for (const p of points) {
            const x = p.x * cos + p.z * sin, z = -p.x * sin + p.z * cos;
            const persp = 1 / (1.8 - z * 0.6);
            const sx = cx + x * scale * persp * 1.4, sy = cy - p.y * scale * persp * 1.4;
            const near = Math.abs(p.y - sweep) < 0.06;
            ctx.fillStyle = near ? shades[2] : shades[p.y > 0.35 ? 2 : p.y > -0.45 ? 1 : 0];
            if (p.rim && near) ctx.fillStyle = lime;
            if (p.rim && sweep < p.y) ctx.fillStyle = lime; // yang sudah tersapu tetap "ditemukan"
            const r = (p.rim ? 2.2 : near ? 1.9 : 1.4) * persp * 1.3;
            ctx.fillRect(sx - r / 2, sy - r / 2, r, r);
        }
    };

    const loop = (now) => {
        draw(now - start);
        if (running) raf = requestAnimationFrame(loop);
    };

    const still = matchMedia('(prefers-reduced-motion: reduce)');
    const play = () => { if (!running && !still.matches) { running = true; raf = requestAnimationFrame(loop); } };
    const pause = () => { running = false; cancelAnimationFrame(raf); };

    resize();
    draw(3500); // frame diam: garis pindai di tengah perisai
    new ResizeObserver(() => { resize(); draw(running ? performance.now() - start : 3500); }).observe(canvas);
    new IntersectionObserver(([e]) => (e.isIntersecting ? play() : pause())).observe(canvas);
    still.addEventListener('change', () => (still.matches ? (pause(), draw(3500)) : play()));
});
