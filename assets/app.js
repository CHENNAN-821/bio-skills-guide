(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const root = document.documentElement.dataset.root || './';
  const lessonKey = 'bioSkills.read.v1';
  const savedKey = 'bioSkills.saved.v1';
  const read = key => { try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value.filter(x => typeof x === 'string') : []; } catch { return []; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
  const toast = text => { const box = $('.toast'); if (!box) return; box.textContent = text; box.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => box.classList.remove('show'), 2500); };

  const mobileMenu = $('.mobile-nav');
  $('.menu-toggle')?.addEventListener('click', event => {
    const button = event.currentTarget;
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!expanded));
    mobileMenu.hidden = expanded;
  });
  const lessonSidebar = $('.lesson-sidebar');
  const lessonMenu = $('.lesson-menu-toggle');
  lessonMenu?.addEventListener('click', () => {
    const open = lessonSidebar.classList.toggle('open');
    lessonMenu.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', event => {
    if (lessonSidebar?.classList.contains('open') && !lessonSidebar.contains(event.target) && !lessonMenu.contains(event.target)) {
      lessonSidebar.classList.remove('open'); lessonMenu.setAttribute('aria-expanded', 'false');
    }
  });

  function updateProgress() {
    const completed = new Set(read(lessonKey));
    $$('[data-lesson-card]').forEach(el => el.classList.toggle('completed', completed.has(el.dataset.lessonCard)));
    $$('[data-progress-link]').forEach(el => el.classList.toggle('completed', completed.has(el.dataset.progressLink)));
    const total = 14;
    const count = Math.min(completed.size, total);
    ['#home-progress', '#sidebar-progress'].forEach(selector => { const el = $(selector); if (el) el.textContent = `已完成 ${count} / ${total} 节`; });
    $$('.progress-track > span').forEach(el => el.style.width = `${count / total * 100}%`);
    $$('.mark-complete').forEach(button => {
      const done = completed.has(button.dataset.complete);
      button.classList.toggle('completed', done);
      button.setAttribute('aria-pressed', String(done));
      button.lastChild.textContent = done ? ' 已标记 · 撤销' : ' 标记已读';
    });
  }
  $$('.mark-complete').forEach(button => button.addEventListener('click', () => {
    const completed = new Set(read(lessonKey)); const id = button.dataset.complete;
    completed.has(id) ? completed.delete(id) : completed.add(id);
    if (!write(lessonKey, [...completed])) { toast('当前浏览器无法保存进度，仍可正常阅读。'); return; }
    updateProgress(); toast(completed.has(id) ? '这一节已标记，继续下一步吧。' : '已撤销这一节的已读标记。');
  }));
  updateProgress();

  let activeFilter = 'all';
  function updateResources() {
    const saved = new Set(read(savedKey));
    const query = ($('#resource-search')?.value || '').trim().toLocaleLowerCase();
    let visible = 0;
    $$('.resource-card').forEach(card => {
      const isSaved = saved.has(card.id);
      const button = $('.save-resource', card);
      if (button) { button.textContent = isSaved ? '已收藏' : '收藏'; button.setAttribute('aria-pressed', String(isSaved)); }
      if (!card.closest('.resource-directory')) return;
      const matchCategory = activeFilter === 'all' || (activeFilter === 'saved' ? isSaved : card.dataset.category === activeFilter);
      const matchQuery = !query || card.dataset.search.toLocaleLowerCase().includes(query);
      card.hidden = !(matchCategory && matchQuery);
      if (!card.hidden) visible++;
    });
    const empty = $('.no-resources'); if (empty) empty.hidden = visible > 0;
  }
  $$('.save-resource').forEach(button => button.addEventListener('click', () => {
    const saved = new Set(read(savedKey)); const id = button.dataset.save;
    saved.has(id) ? saved.delete(id) : saved.add(id);
    if (!write(savedKey, [...saved])) { toast('当前浏览器无法保存收藏。'); return; }
    updateResources(); toast(saved.has(id) ? '已收藏到当前浏览器。' : '已取消收藏。');
  }));
  $$('[data-filter]').forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    $$('[data-filter]').forEach(el => { const selected = el === button; el.classList.toggle('selected', selected); el.setAttribute('aria-pressed', String(selected)); });
    updateResources();
  }));
  $('#resource-search')?.addEventListener('input', updateResources);
  updateResources();

  async function copy(text) {
    if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(text); return true; } catch { /* Use local fallback when browser permissions reject the clipboard API. */ }
    }
    const textarea = document.createElement('textarea'); textarea.value = text;
    textarea.style.cssText = 'position:fixed;left:-10000px;top:0;';
    document.body.appendChild(textarea); textarea.select();
    let success = false; try { success = document.execCommand('copy'); } catch { success = false; }
    textarea.remove(); return success;
  }
  $$('.copy-code').forEach(button => button.addEventListener('click', async () => {
    const text = $('code', button.closest('.code-block')).textContent;
    const success = await copy(text);
    button.textContent = success ? '已复制' : '请选中代码复制';
    if (success) toast('代码已复制，请按对应系统在终端中执行。');
    setTimeout(() => { button.textContent = '复制代码'; }, 2200);
  }));

  const dialog = $('.search-dialog');
  const searchInput = $('#global-search');
  const searchResults = $('.search-results');
  function renderSearch() {
    const query = searchInput.value.trim().toLocaleLowerCase();
    searchResults.replaceChildren();
    if (!query) { const p = document.createElement('p'); p.className = 'search-hint'; p.textContent = '输入关键词，查找教程、技能库和常见问题。'; searchResults.appendChild(p); return; }
    const tokens = query.split(/\s+/).filter(Boolean);
    const found = (window.SITE_SEARCH || []).map(item => {
      const title = item.title.toLocaleLowerCase(); const text = item.text.toLocaleLowerCase();
      const score = tokens.reduce((n, token) => n + (title.includes(token) ? 10 : 0) + (text.includes(token) ? 1 : 0), 0);
      return {item, score};
    }).filter(({item, score}) => score > 0 && tokens.every(token => `${item.title} ${item.text}`.toLocaleLowerCase().includes(token))).sort((a,b) => b.score - a.score).slice(0, 10);
    if (!found.length) { const p = document.createElement('p'); p.className = 'search-hint'; p.textContent = '暂时没有找到。试试 Python、安装、GC 或单细胞。'; searchResults.appendChild(p); return; }
    found.forEach(({item}) => {
      const a = document.createElement('a'); a.className = 'search-result'; a.href = root + item.url;
      const small = document.createElement('small'); small.textContent = item.category;
      const strong = document.createElement('strong'); strong.textContent = item.title;
      const p = document.createElement('p'); const position = item.text.toLocaleLowerCase().indexOf(tokens[0]); const start = Math.max(0, position - 20); p.textContent = (start > 0 ? '…' : '') + item.text.slice(start,start+100) + '…';
      a.append(small,strong,p); searchResults.appendChild(a);
    });
  }
  function openSearch() { if (!dialog.open) dialog.showModal(); renderSearch(); searchInput.focus(); }
  $('.search-toggle')?.addEventListener('click',openSearch);
  $('.search-close')?.addEventListener('click',() => dialog.close());
  dialog?.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
  searchInput?.addEventListener('input',renderSearch);
  searchInput?.addEventListener('keydown',event => { if (event.key === 'ArrowDown') { event.preventDefault(); $('.search-result',searchResults)?.focus(); } if (event.key === 'Enter') $('.search-result',searchResults)?.click(); });
  document.addEventListener('keydown',event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === 'k') { event.preventDefault(); openSearch(); }
    if (event.key === 'Escape') { lessonSidebar?.classList.remove('open'); lessonMenu?.setAttribute('aria-expanded','false'); if (mobileMenu) mobileMenu.hidden = true; $('.menu-toggle')?.setAttribute('aria-expanded','false'); }
  });

  const fastaInput = $('#fasta-input');
  if (fastaInput) {
    const sample = fastaInput.value;
    let lastRows = [];
    const analyze = () => {
      const error = $('#fasta-error'); error.hidden = true; error.textContent = '';
      const records = []; let current = null;
      const lines = fastaInput.value.replace(/^\uFEFF/,'').split(/\r?\n/);
      try {
        if (fastaInput.value.length > 2000000) throw new Error('本练习支持 2 MB 以内的文本，请先用较短序列练习。');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim(); if (!line) continue;
          if (line.startsWith('>')) {
            const name = line.slice(1).trim().split(/\s+/)[0];
            if (!name) throw new Error(`第 ${i+1} 行缺少序列名称，请在 > 后填写名称。`);
            if (records.length >= 1000) throw new Error('本练习每次最多统计 1000 条序列。更多数据请使用配套 Python 脚本。');
            current = {name,seq:''}; records.push(current);
          } else {
            if (!current) throw new Error(`第 ${i+1} 行前缺少 >序列名称，请使用 FASTA 格式。`);
            const seq = line.toUpperCase();
            if (/[^ATGC]/.test(seq)) throw new Error(`序列 ${current.name} 含有非 ATGC 字符。本练习不处理 N 等模糊碱基，请修改后重试。`);
            current.seq += seq;
          }
        }
        if (!records.length) throw new Error('请先粘贴 FASTA 序列，或点击恢复示例。');
        if (records.some(record => !record.seq)) throw new Error('存在没有碱基内容的序列，请在名称下方填写序列。');
        if (new Set(records.map(record => record.name)).size !== records.length) throw new Error('序列名称重复，请为每条序列使用不同名称。');
        lastRows = records.map(({name,seq}) => ({name,length:seq.length,gc:((seq.match(/[GC]/g)||[]).length/seq.length*100).toFixed(2)}));
        const output = $('#fasta-results'); output.replaceChildren();
        const table = document.createElement('table'); table.className = 'results-table';
        const thead = document.createElement('thead'); const heading = document.createElement('tr');
        ['序列名称','长度 / bp','GC 比例'].forEach(text => { const th = document.createElement('th'); th.textContent = text; th.scope = 'col'; heading.appendChild(th); });
        thead.appendChild(heading); const tbody = document.createElement('tbody');
        lastRows.forEach(row => { const tr = document.createElement('tr'); [row.name,row.length,`${row.gc}%`].forEach(value => { const td = document.createElement('td'); td.textContent = value; tr.appendChild(td); }); tbody.appendChild(tr); });
        table.append(thead,tbody); output.appendChild(table);
        const bars = document.createElement('div'); bars.className = 'result-bars';
        lastRows.forEach(row => { const div = document.createElement('div'); const label = document.createElement('span'); label.textContent = row.name; const track = document.createElement('span'); track.className = 'bar-track'; const bar = document.createElement('i'); bar.style.width = `${row.gc}%`; track.appendChild(bar); div.append(label,track); bars.appendChild(div); });
        output.appendChild(bars);
        $('#sequence-count').textContent = `${lastRows.length} 条序列`;
        $('#download-csv').disabled = false;
      } catch (e) {
        error.textContent = e.message; error.hidden = false;
        $('#download-csv').disabled = true; lastRows = [];
        $('#sequence-count').textContent = '请检查输入';
        $('#fasta-results').replaceChildren();
        const p=document.createElement('p'); p.className='search-hint';p.textContent='修改输入后，重新点击统计序列。';$('#fasta-results').appendChild(p);
      }
    };
    $('#analyze-fasta').addEventListener('click',analyze);
    $('#reset-fasta').addEventListener('click',() => { fastaInput.value = sample; analyze(); toast('已恢复三条教学序列。'); });
    fastaInput.addEventListener('input',() => { $('#download-csv').disabled=true; lastRows=[]; $('#sequence-count').textContent='输入已修改，请重新统计'; });
    $('#download-csv').addEventListener('click',() => {
      if (!lastRows.length) return;
      const csvCell = value => { const s=String(value); return '"'+s.replaceAll('"','""')+'"'; };
      const safeName = value => /^[=+@-]/.test(value) ? "'" + value : value;
      const data = [['sequence_id','length','gc_percent'],...lastRows.map(row=>[safeName(row.name),row.length,row.gc])];
      const csv = '\uFEFF'+data.map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';
      const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
      const a=document.createElement('a');a.href=url;a.download='sequence_summary.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    });
  }
})();
