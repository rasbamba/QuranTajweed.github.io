/* QuranPath v9: progressive UI layer over the existing Quran reader and audio engine. */
(() => {
  'use strict';
  let focusIndex = 0;
  let lastRenderedSurah = null;
  let localRecorder = null;
  let localStream = null;
  let localChunks = [];
  let recordingURL = null;

  const get = (id) => document.getElementById(id);
  const apiRuleLabels = {
    ham_wasl:['Hamzat al-Waṣl','Connecting hamzah; pronunciation depends on context.'],
    slnt:['Silent letter','Letter or sign treated as silent in this reading.'],
    laam_shamsiyah:['Lām Shamsiyyah','The lām assimilates into a following sun letter.'],
    madda_normal:['Natural Madd','A natural lengthening, commonly two counts.'],
    madda_permissible:['Permissible Madd','A lengthening with context-dependent counts.'],
    madda_necessary:['Necessary Madd','A required extended lengthening in its prescribed context.'],
    madda_obligatory:['Obligatory Madd','A longer lengthening according to the rule.'],
    qalqalah:['Qalqalah','Echo-like release for designated consonants under the rule.'],
    ghunnah:['Ghunnah','A nasal sound, such as with a doubled nūn or mīm.'],
    ikhfa:['Ikhfā’','Concealment with a nasal sound.'],
    ikhfa_shafawi:['Ikhfā’ Shafawī','Lip-related concealment under its specific conditions.'],
    iqlab:['Iqlāb','Conversion of nūn/tanwīn sound before bā’.'],
    idgham_ghunnah:['Idghām with Ghunnah','Assimilation with nasalisation.'],
    idgham_wo_ghunnah:['Idghām without Ghunnah','Assimilation without nasalisation.'],
    idgham_shafawi:['Idghām Shafawī','Assimilation involving mīm.'],
    idgham_mutajanisayn:['Idghām Mutajānisayn','Assimilation of related articulation sounds.'],
    idgham_mutaqaribayn:['Idghām Mutaqāribayn','Assimilation of close articulation sounds.']
  };

  const currentVerse = () => Array.isArray(cur) ? cur[focusIndex] : null;
  function storeFocus() {
    const a = currentVerse();
    if (a) { S.focusVerse = {surah: curN, ayah: a.num}; save(); }
  }
  function focusNavigate(index) {
    if (!Array.isArray(cur) || !cur.length) return;
    focusIndex = Math.max(0, Math.min(index,cur.length - 1));
    storeFocus();
    renderFocusedVerse();
  }
  function updateAudioUI() {
    const a = currentVerse();
    const playing = !!(a && pl.on && pl.i === focusIndex && !au.paused);
    get('focusPlay').textContent = playing ? 'Ⅱ' : '▶';
    get('focusPlay').setAttribute('aria-label', playing ? 'Pause selected ayah' : 'Play selected ayah');
    get('focusAudioState').textContent = playing ? 'Playing' : (a && pl.on && pl.i === focusIndex ? 'Paused' : 'Ready');
  }
  window.updateFocusAudio = updateAudioUI;
  function renderFocusedVerse(justLoaded = false) {
    if (!Array.isArray(cur) || !cur.length) {
      get('focusArabic').textContent = 'Quran text is loading…';
      return;
    }
    if (justLoaded && lastRenderedSurah !== curN) {
      focusIndex = S.focusVerse?.surah === curN ? Math.min(cur.length - 1, Math.max(0, (S.focusVerse.ayah || 1)-1)) : 0;
      lastRenderedSurah = curN;
    }
    focusIndex = Math.max(0,Math.min(cur.length-1,focusIndex));
    const a = currentVerse();
    if (!a) return;
    const info = surahs?.find(s => s.number === curN);
    const shortName = info?.englishName || 'Surah ' + curN;
    const meaning = info?.englishNameTranslation || '';
    get('focusedTitle').textContent = shortName;
    get('focusReference').textContent = `${curN}:${a.num}${meaning ? ' · '+meaning : ''}`;
    get('focusArabicSurah').textContent = info?.name || ('سورة ' + curN.toLocaleString('ar-EG'));
    get('focusNumber').textContent = String(a.num).padStart(2,'0');
    const ayahSelect = get('focusAyah');
    if (ayahSelect.options.length !== cur.length) {
      ayahSelect.replaceChildren(...cur.map(v => new Option(String(v.num),String(v.num))));
    }
    ayahSelect.value=String(a.num);
    showBasmala(get('focusBasmala'), a.num === 1 && shouldShowBasmala());
    get('focusArabic').innerHTML = get('focusShowTj').checked && a.tj ? renderArabicWords(a.tj,true) : renderArabicWords(a.ar,false);
    get('focusTranslit').textContent = a.tr || 'Transliteration is unavailable for this ayah.';
    get('focusEnglish').textContent = a.en || 'Translation is unavailable for this ayah.';
    get('focusTranslitGroup').hidden = !get('focusShowTr').checked;
    get('focusEnglishGroup').hidden = !get('focusShowEn').checked;
    get('focusSourceLink').href = `https://quran.com/${curN}/${a.num}`;
    get('meaningSource').href = `https://quran.com/${curN}/${a.num}`;
    if (curN === 58 && a.num === 1) {
      get('meaningHeading').textContent = 'Allah hears the woman’s complaint';
      get('meaningBody').textContent = 'This verse recounts a woman speaking with the Prophet about her husband and appealing to Allah. For detailed context, read an established tafsir using the source link.';
    } else {
      get('meaningHeading').textContent = `${shortName} · Ayah ${a.num}`;
      get('meaningBody').textContent = a.en || 'English translation unavailable. Consult the source for interpretation.';
    }
    const classes = Array.from((a.tj || '').matchAll(/class\s*=\s*["']?([a-z_]+)/g), m=>m[1]);
    const rules = [...new Set(classes)].filter(k=>apiRuleLabels[k]).slice(0,4);
    const list = get('tajweedList'); list.replaceChildren();
    if (!a.tj) {
      const p = document.createElement('p'); p.textContent = 'Tajweed annotation data is unavailable for this ayah. Listen to a qualified reciter.';list.append(p);
    } else if (!rules.length) {
      const p = document.createElement('p');p.textContent = 'No labelled Tajweed rules were returned for this ayah.';list.append(p);
    } else {
      for (const k of rules) { const d = document.createElement('div');const strong = document.createElement('strong');strong.textContent=apiRuleLabels[k][0]+' · ';d.append(strong,document.createTextNode(apiRuleLabels[k][1]));list.append(d); }
    }
    get('focusPrev').disabled = focusIndex === 0;
    get('focusNext').disabled = focusIndex >= cur.length-1;
    S.reviewed ||= {};
    const done=!!S.reviewed[a.k];
    get('focusReviewed').textContent = done ? '✓ Reviewed' : '✓ Mark as reviewed';
    get('focusReviewed').setAttribute('aria-pressed',String(done));
    get('focusNotes').value = S.notes?.[a.k] || '';
    get('journeyPct').textContent = (Object.values(S.mem || {}).filter(Boolean).length /6236*100).toFixed(1)+'%';
    updateAudioUI();
    renderPracticeVerse();
  }
  window.renderFocusedVerse = renderFocusedVerse;

  function renderPracticeVerse() {
    const a=currentVerse();
    get('practiceReference').textContent = a ? `SURAH ${curN} · AYAH ${a.num}` : 'Select an ayah';
    showBasmala(get('practiceBasmala'), !!(a && a.num === 1 && shouldShowBasmala()));
    get('practiceArabic').textContent = a?.ar || 'Choose a surah in the Quran Reader to begin.';
  }
  window.renderPracticeVerse = renderPracticeVerse;
  function goPractice() { openTab('practice');renderPracticeVerse(); }
  get('focusAyah').addEventListener('change',e=>focusNavigate(Number(e.target.value)-1));
  for (const id of ['focusShowTr','focusShowEn','focusShowTj']) get(id).addEventListener('change',()=>renderFocusedVerse());
  get('focusPrev').addEventListener('click',()=>focusNavigate(focusIndex-1));
  get('focusNext').addEventListener('click',()=>focusNavigate(focusIndex+1));
  get('focusReviewed').addEventListener('click',()=>{
    const a=currentVerse();if (!a)return;
    S.reviewed ||= {};S.reviewed[a.k]=!S.reviewed[a.k];save();renderFocusedVerse();
  });
  get('focusPlay').addEventListener('click',()=>{
    if (!currentVerse())return;
    if (pl.on && pl.i===focusIndex && !au.paused) { au.pause();return; }
    if (pl.on && pl.i===focusIndex && au.paused) { au.play().catch(()=>updateAudioStatus('Playback blocked. Please try again.'));return; }
    beginPlayback(focusIndex,'surah',false);
  });
  get('focusPracticeBtn').addEventListener('click',goPractice);
  get('sidePractice').addEventListener('click',goPractice);
  get('focusNotes').addEventListener('input', e=> {
    const a = currentVerse();if (!a)return;
    S.notes ||= {};S.notes[a.k] = e.target.value.slice(0,5000);save();
  });
  get('heroContinue').addEventListener('click',()=> get('focusGrid').scrollIntoView({behavior:'smooth',block:'start'}));
  get('heroTajweed').addEventListener('click',()=>openTab('tajweed'));
  get('tajweedGoReader').addEventListener('click',()=>openTab('quran'));
  get('journeyBtn').addEventListener('click',()=>openTab('prog'));
  get('topInstall').addEventListener('click',()=>openTab('install'));

  function closeMenu() {document.body.classList.remove('menu-open');get('sidebarScrim').hidden=true;get('menuToggle').setAttribute('aria-expanded','false');}
  get('menuToggle').addEventListener('click',()=>{
    const open = document.body.classList.toggle('menu-open');get('sidebarScrim').hidden = !open;get('menuToggle').setAttribute('aria-expanded',String(open));
  });
  get('sidebarScrim').addEventListener('click',closeMenu);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
  const connection=()=>{
    get('connectionText').textContent = navigator.onLine ? 'Online lessons' : 'Offline mode';
    document.querySelector('.online-indicator i').style.background=navigator.onLine?'#0aab6b':'#c99b53';
  };
  addEventListener('online',connection);addEventListener('offline',connection);connection();

  get('practiceListen').addEventListener('click',()=>{if (currentVerse())beginPlayback(focusIndex,'surah',false);});
  get('practiceRecognize').addEventListener('click',()=>{
    if (!currentVerse())return;
    get('practiceResult').textContent='Listening… Recite the selected ayah.';
    listenOnce((_words,raw)=>{
      get('practiceWords').value=raw;
      get('practiceResult').textContent='Words recognised. Review or edit the transcript, then select Check recognised words.';
    }, msg=>get('practiceResult').textContent=msg);
  });
  get('practiceCheck').addEventListener('click',()=>{
    const a=currentVerse();if (!a)return;
    const target=norm(a.ar).split(/\s+/).filter(Boolean);
    const heard=norm(get('practiceWords').value).split(/\s+/).filter(Boolean);
    if (!heard.length){get('practiceResult').textContent='Enter or recognise Arabic words first.';return;}
    // Sequential comparison avoids counting the same recognised word repeatedly.
    let j=0,match=0;
    for (const word of target){ if (j < heard.length && sim(word,heard[j])>=0.72){match++;j++;}else{const near=heard.slice(j,j+3).findIndex(w=>sim(word,w)>=0.72);if(near>=0){match++;j+=near+1;}} }
    const score=Math.round(match/target.length*100);
    get('practiceResult').textContent=`Approximate transcription word match: ${score}% (${match}/${target.length}). This is not a Tajweed, pronunciation or memorisation score.`;
  });
  const recStart=get('recordStart'),recStop=get('recordStop'),recPlay=get('recordPlayback'),recStatus=get('recordStatus');
  recStart.addEventListener('click',async()=>{
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder==='undefined') {recStatus.textContent='Local recording is not supported by this browser.';return;}
    try{
      localStream=await navigator.mediaDevices.getUserMedia({audio:true});
      localChunks=[];localRecorder=new MediaRecorder(localStream);
      localRecorder.ondataavailable=e=>{if(e.data.size)localChunks.push(e.data);};
      localRecorder.onstop=()=>{
        if(recordingURL)URL.revokeObjectURL(recordingURL);
        recordingURL=URL.createObjectURL(new Blob(localChunks,{type:localRecorder.mimeType || 'audio/webm'}));
        recPlay.src=recordingURL;recPlay.hidden=false;
        localStream?.getTracks().forEach(track=>track.stop());localStream=null;
        recStart.disabled=false;recStop.disabled=true;recStatus.textContent='Recording ready to replay. Audio stays in this page only.';
      };
      localRecorder.start();recStart.disabled=true;recStop.disabled=false;recPlay.hidden=true;recStatus.textContent='Recording… Select Stop when finished.';
    }catch(err){recStatus.textContent='Unable to access microphone: '+err.message;localStream?.getTracks().forEach(t=>t.stop());recStart.disabled=false;recStop.disabled=true;}
  });
  recStop.addEventListener('click',()=>{if(localRecorder?.state==='recording')localRecorder.stop();});
  addEventListener('beforeunload',()=>{if(recordingURL)URL.revokeObjectURL(recordingURL);localStream?.getTracks().forEach(track=>track.stop());});
  openTab('quran');
  // API/cache responses can finish before this UI layer attaches; render again then.
  if (typeof cur !== 'undefined' && cur.length) renderFocusedVerse(true);
})();
