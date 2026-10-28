document.querySelectorAll('form[data-endpoint]').forEach((form) => {
    const help = form.querySelector('[aria-live]');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fields = [...form.elements].filter((el) => el.willValidate);
        fields.forEach((el) => el.removeAttribute('aria-invalid'));
        const bad = fields.find((el) => !el.checkValidity());
        if (bad) {
            fields.filter((el) => !el.checkValidity()).forEach((el) => el.setAttribute('aria-invalid', 'true'));
            help.className = 'form-help is-error';
            help.textContent = form.dataset.invalid || 'Masih ada isian yang kosong atau tidak valid.';
            bad.focus();
            return;
        }
        if (form.dataset.next) {
            window.location.href = form.dataset.next;
            return;
        }
        help.className = 'form-help';
        help.textContent = 'Belum terkirim: form ini belum tersambung ke server.';
    });
});

document.querySelectorAll('form[data-answer]').forEach((form) => {
    const help = form.querySelector('[aria-live]');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const picked = form.querySelector('input[type="radio"]:checked');
        if (!picked) {
            help.className = 'form-help is-error';
            help.textContent = 'Pilih satu jawaban dulu.';
            return;
        }
        const ok = picked.value === form.dataset.answer;
        help.className = ok ? 'form-help is-ok' : 'form-help is-error';
        help.textContent = ok ? 'Benar. Password ditambah OTP memakai dua faktor yang berbeda.' : 'Belum tepat. Cari pilihan yang memakai dua faktor berbeda.';
    });
});

document.querySelectorAll('input[data-match]').forEach((input) => {
    const source = document.getElementById(input.dataset.match);
    const check = () => input.setCustomValidity(input.value && input.value !== source.value ? 'Password tidak sama.' : '');
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
            help.textContent = 'Jawab semua soal sebelum mengirim.';
            blank.querySelector('input').focus();
            return;
        }
        const wrong = qs.filter((q) => q.querySelector('input:checked').value !== q.dataset.answer);
        const score = Math.round((qs.length - wrong.length) / qs.length * 100);
        const pass = score >= Number(quiz.dataset.kkm);
        result.querySelector('[data-score]').textContent = score;
        result.querySelector('[data-detail]').textContent = `${qs.length - wrong.length} dari ${qs.length} soal benar`;
        result.querySelector('[data-status]').textContent = pass ? `Lulus (KKM ${quiz.dataset.kkm})` : `Belum lulus (KKM ${quiz.dataset.kkm})`;
        result.querySelector('[data-status]').className = pass ? 'tag tag-solid' : 'tag tag-error';
        result.querySelector('[data-advice]').textContent = pass
            ? 'Nilaimu sudah mencapai KKM. Lanjutkan ke materi berikutnya.'
            : 'Nilaimu belum mencapai KKM. Pelajari kembali topik berikut:';
        const topics = result.querySelector('[data-topics]');
        topics.replaceChildren(...[...new Set(wrong.map((q) => q.dataset.topic))].map((t) => Object.assign(document.createElement('li'), { textContent: t })));
        result.querySelector('[data-review]').replaceChildren(...qs.map((q) => {
            const picked = q.querySelector('input:checked');
            const right = q.querySelector(`input[value="${q.dataset.answer}"]`);
            const ok = picked === right;
            const li = document.createElement('li');
            li.className = 'question';
            li.innerHTML = '<p class="fw-semibold mb-1"></p><p class="mb-1"></p><p class="mb-1"></p><p class="muted small mb-0"></p>';
            const [title, mine, correct, topic] = li.children;
            title.textContent = q.querySelector('legend').textContent;
            mine.textContent = `Jawabanmu: ${picked.parentElement.textContent.trim()} (${ok ? 'benar' : 'salah'})`;
            if (ok) correct.remove(); else correct.textContent = `Jawaban benar: ${right.parentElement.textContent.trim()}`;
            topic.textContent = `Topik: ${q.dataset.topic}`;
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
