document.querySelectorAll('form[data-endpoint]').forEach((form) => {
    const help = form.querySelector('[aria-live]');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fields = [...form.elements].filter((el) => el.willValidate);
        fields.forEach((el) => el.removeAttribute('aria-invalid'));
        const bad = fields.find((el) => !el.checkValidity());
        if (bad) {
            const invalid = fields.filter((el) => !el.checkValidity());
            invalid.forEach((el) => el.setAttribute('aria-invalid', 'true'));
            const name = (el) => (form.querySelector(`label[for="${el.id}"]`)?.textContent || el.name).trim();
            help.className = 'form-help is-error';
            help.textContent = `${t('Periksa isian:')} ${invalid.map(name).join(', ')}. ${bad.validationMessage}`;
            bad.focus();
            return;
        }
        if (form.dataset.next) {
            window.location.href = form.dataset.next;
            return;
        }
        help.className = 'form-help';
        help.textContent = t('Belum terkirim: form ini belum tersambung ke server.');
    });
});

document.querySelectorAll('form[data-answer]').forEach((form) => {
    const help = form.querySelector('[aria-live]');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const picked = form.querySelector('input[type="radio"]:checked');
        if (!picked) {
            help.className = 'form-help is-error';
            help.textContent = t('Pilih satu jawaban dulu.');
            return;
        }
        const ok = picked.value === form.dataset.answer;
        help.className = ok ? 'form-help is-ok' : 'form-help is-error';
        help.textContent = t(ok ? 'Benar. Password ditambah OTP memakai dua faktor yang berbeda.' : 'Belum tepat. Cari pilihan yang memakai dua faktor berbeda.');
    });
});

document.querySelectorAll('input[data-match]').forEach((input) => {
    const source = document.getElementById(input.dataset.match);
    const check = () => input.setCustomValidity(input.value && input.value !== source.value ? t('Password tidak sama.') : '');
    input.addEventListener('input', check);
    source.addEventListener('input', check);
});

document.querySelectorAll('[data-filter-for]').forEach((group) => {
    const list = document.getElementById(group.dataset.filterFor);
    const empty = list.closest('section').querySelector('[data-filter-empty]');
    group.querySelectorAll('[data-filter]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const f = btn.dataset.filter;
            group.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
            let shown = 0;
            list.querySelectorAll('[data-tags]').forEach((item) => {
                const on = f === 'semua' || item.dataset.tags.split(' ').includes(f);
                item.hidden = !on;
                shown += on;
            });
            if (empty) empty.hidden = shown > 0;
        });
    });
});

const quiz = document.getElementById('quiz-form');
if (quiz) {
    const result = document.getElementById('hasil');
    const help = quiz.querySelector('[aria-live]');
    quiz.addEventListener('submit', (e) => {
        e.preventDefault();
        const qs = [...quiz.querySelectorAll('fieldset[data-answer]')];
        const blank = qs.find((q) => !q.querySelector('input:checked'));
        if (blank) {
            help.className = 'form-help is-error';
            help.textContent = t('Jawab semua soal sebelum mengirim.');
            blank.querySelector('input').focus();
            return;
        }
        const wrong = qs.filter((q) => q.querySelector('input:checked').value !== q.dataset.answer);
        const score = Math.round((qs.length - wrong.length) / qs.length * 100);
        const pass = score >= Number(quiz.dataset.kkm);
        result.querySelector('[data-score]').textContent = score;
        result.querySelector('[data-detail]').textContent = t(`${qs.length - wrong.length} dari ${qs.length} soal benar`);
        result.querySelector('[data-status]').textContent = t(pass ? `Lulus (KKM ${quiz.dataset.kkm})` : `Belum lulus (KKM ${quiz.dataset.kkm})`);
        result.querySelector('[data-status]').className = pass ? 'tag tag-solid' : 'tag tag-error';
        result.querySelector('[data-advice]').textContent = t(pass
            ? 'Nilaimu sudah mencapai KKM. Lanjutkan ke materi berikutnya.'
            : 'Nilaimu belum mencapai KKM. Pelajari kembali topik berikut:');
        const topics = result.querySelector('[data-topics]');
        topics.replaceChildren(...[...new Set(wrong.map((q) => q.dataset.topic))].map((topic) => Object.assign(document.createElement('li'), { textContent: t(topic) })));
        result.querySelector('[data-review]').replaceChildren(...qs.map((q) => {
            const picked = q.querySelector('input:checked');
            const right = q.querySelector(`input[value="${q.dataset.answer}"]`);
            const ok = picked === right;
            const li = document.createElement('li');
            li.className = 'question';
            li.innerHTML = '<p class="fw-semibold mb-1"></p><p class="mb-1"></p><p class="mb-1"></p><p class="muted small mb-0"></p>';
            const [title, mine, correct, topic] = li.children;
            title.textContent = q.querySelector('legend').textContent;
            mine.textContent = `${t('Jawabanmu')}: ${picked.parentElement.textContent.trim()} (${t(ok ? 'benar' : 'salah')})`;
            if (ok) correct.remove(); else correct.textContent = `${t('Jawaban benar')}: ${right.parentElement.textContent.trim()}`;
            topic.textContent = `${t('Topik')}: ${t(q.dataset.topic)}`;
            return li;
        }));
        quiz.hidden = true;
        result.hidden = false;
        result.querySelector('h2').focus();
    });
    result.querySelector('[data-back]').addEventListener('click', () => {
        result.hidden = true;
        quiz.hidden = false;
        quiz.querySelector('input').focus();
    });
}

const root = document.documentElement;
const syncThemeButtons = () => {
    const light = root.dataset.theme === 'light';
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
        btn.setAttribute('aria-label', t(light ? 'Ganti ke mode gelap' : 'Ganti ke mode terang'));
        btn.setAttribute('aria-pressed', String(light));
    });
};
document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
        const next = root.dataset.theme === 'light' ? 'dark' : 'light';
        if (next === 'light') root.dataset.theme = 'light'; else delete root.dataset.theme;
        try { localStorage.setItem('theme', next); } catch (e) {}
        syncThemeButtons();
        document.dispatchEvent(new Event('themechange'));
    });
});
syncThemeButtons();

const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!calm) {
    const items = document.querySelectorAll('main .box, main .cells, main > .section, main .table-responsive, main .steps, main .podium, main .question, main .reveal');
    const seen = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-in');
            seen.unobserve(entry.target);
        });
    }, { threshold: 0.08 });
    items.forEach((el, i) => {
        el.classList.add('reveal');
        el.style.transitionDelay = `${Math.min(i, 6) * 60}ms`;
        seen.observe(el);
    });

    document.querySelectorAll('.progress-bar').forEach((bar) => {
        const w = bar.style.width;
        bar.style.width = '0%';
        requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = w; }));
    });

    document.querySelectorAll('.lvl-ring').forEach((ring) => {
        const p = Number(getComputedStyle(ring).getPropertyValue('--p')) || 0;
        const start = performance.now();
        const step = (now) => {
            const k = Math.min(1, (now - start) / 1200);
            ring.style.setProperty('--p', (p * (1 - Math.pow(1 - k, 3))).toFixed(1));
            if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    });

    document.querySelectorAll('[data-count]').forEach((el) => {
        const end = Number(el.dataset.count);
        const start = performance.now();
        const step = (now) => {
            const k = Math.min(1, (now - start) / 900);
            el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))).toLocaleString('id-ID');
            if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    });
}

const side = document.getElementById('side');
if (side) {
    const openers = document.querySelectorAll('[data-drawer-open]');
    let backdrop = null;
    let lastFocus = null;
    const close = () => {
        side.classList.remove('is-open');
        openers.forEach((b) => b.setAttribute('aria-expanded', 'false'));
        document.body.style.overflow = '';
        if (backdrop) {
            const b = backdrop;
            b.classList.remove('is-open');
            setTimeout(() => b.remove(), 300);
            backdrop = null;
        }
        lastFocus?.focus();
    };
    const open = (btn) => {
        lastFocus = btn;
        backdrop = Object.assign(document.createElement('div'), { className: 'drawer-backdrop' });
        backdrop.addEventListener('click', close);
        document.body.append(backdrop);
        requestAnimationFrame(() => backdrop?.classList.add('is-open'));
        side.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
        side.querySelector('a, button')?.focus();
    };
    openers.forEach((btn) => btn.addEventListener('click', () => open(btn)));
    side.querySelectorAll('[data-drawer-close]').forEach((btn) => btn.addEventListener('click', close));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && side.classList.contains('is-open')) close(); });
    matchMedia('(min-width: 80rem)').addEventListener('change', (e) => { if (e.matches && side.classList.contains('is-open')) close(); });
}

document.querySelectorAll('[data-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
        const list = tab.closest('[role="tablist"]');
        const pane = document.querySelector(tab.dataset.tab);
        list.querySelectorAll('[data-tab]').forEach((t) => {
            const on = t === tab;
            t.classList.toggle('active', on);
            t.setAttribute('aria-selected', String(on));
            document.querySelector(t.dataset.tab)?.classList.toggle('active', on);
        });
        pane?.focus({ preventScroll: true });
    });
});
