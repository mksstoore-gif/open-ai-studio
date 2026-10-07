// ==UserScript==
// @name         SweepX عربي للجوال
// @namespace    https://github.com/eddiezhan/SweepX
// @version      1.0.0-ar-mobile
// @description  تنظيف منشورات X من داخل جلسة الحساب - نسخة عربية للجوال
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const BEARER =
    'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';
  const Q = {
    DeleteTweet: 'VaenaVgh5q5ih7kvyVjgtg',
    DeleteRetweet: 'iQtK4dl5hBmXewYZuEOKVw'
  };

  let list = [];
  let running = false;

  function ct0() {
    const m = document.cookie.match(/(^|;\s*)ct0=([^;]+)/);
    return m ? m[2] : '';
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  function addLauncher() {
    if (document.getElementById('sx-ar-btn')) return;
    const b = document.createElement('button');
    b.id='sx-ar-btn';
    b.textContent='🧹 تنظيف X';
    b.style.cssText='position:fixed;bottom:84px;left:16px;z-index:2147483646;background:#1d9bf0;color:white;border:0;border-radius:999px;padding:12px 18px;font-size:15px;font-weight:800;box-shadow:0 5px 18px #0008';
    b.onclick=toggle;
    document.body.appendChild(b);
  }

  function modal() {
    if (document.getElementById('sx-ar-modal')) return;
    const m=document.createElement('div');
    m.id='sx-ar-modal';
    m.dir='rtl';
    m.style.cssText='display:none;position:fixed;inset:4vh 4vw;z-index:2147483647;background:#111820;color:#fff;border:1px solid #34404b;border-radius:18px;padding:18px;overflow:auto;font-family:Arial,sans-serif;box-shadow:0 12px 40px #000b';
    m.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #34404b;padding-bottom:12px">
        <b style="font-size:20px;color:#1d9bf0">SweepX — تنظيف حساب X</b>
        <button id="sx-close" style="background:#26313b;color:#fff;border:0;border-radius:10px;padding:8px 12px">إغلاق</button>
      </div>
      <p style="color:#aab7c2;line-height:1.7">يعمل داخل جلسة X الحالية. اختر ملف <b>tweets.js</b> من أرشيف حسابك، ثم راجع العدد قبل التنفيذ.</p>
      <label style="display:block;background:#0b1117;border:2px dashed #34404b;padding:18px;border-radius:12px;text-align:center">
        📁 اختر ملف tweets.js
        <input id="sx-file" type="file" accept=".js,.json" style="display:none">
      </label>
      <div id="sx-stat" style="margin:12px 0;color:#20c77a">لم يتم تحميل ملف بعد</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0">
        <label><input id="sx-o" type="checkbox" checked> المنشورات الأصلية</label>
        <label><input id="sx-r" type="checkbox" checked> إعادة النشر</label>
        <label><input id="sx-q" type="checkbox" checked> الاقتباسات</label>
        <label><input id="sx-p" type="checkbox" checked> الردود</label>
      </div>
      <label style="display:block;background:#17202a;padding:12px;border-radius:10px;margin:12px 0">
        <input id="sx-dry" type="checkbox" checked> وضع المعاينة فقط — لا يحذف شيئًا
      </label>
      <div style="display:flex;gap:8px">
        <button id="sx-start" disabled style="flex:1;background:#1d9bf0;color:#fff;border:0;border-radius:10px;padding:12px;font-weight:800">ابدأ</button>
        <button id="sx-stop" disabled style="background:#3a2020;color:#ff7777;border:0;border-radius:10px;padding:12px">إيقاف</button>
      </div>
      <div style="margin-top:14px;background:#0b1117;border-radius:10px;padding:10px">
        <div id="sx-status">بانتظار الملف</div>
        <div style="height:7px;background:#26313b;border-radius:8px;margin-top:8px;overflow:hidden"><div id="sx-bar" style="height:100%;width:0;background:#20c77a"></div></div>
      </div>
      <div id="sx-log" style="height:150px;overflow:auto;margin-top:12px;background:#070b0f;border-radius:10px;padding:10px;font:12px monospace;color:#aab7c2"></div>
    `;
    document.body.appendChild(m);

    document.getElementById('sx-close').onclick=toggle;
    const input=document.getElementById('sx-file');
    input.parentElement.onclick=()=>input.click();
    input.onchange=e=>e.target.files?.[0] && load(e.target.files[0]);
    document.getElementById('sx-start').onclick=start;
    document.getElementById('sx-stop').onclick=()=>{running=false; log('تم طلب الإيقاف.');};
  }

  function toggle() {
    modal();
    const m=document.getElementById('sx-ar-modal');
    m.style.display=m.style.display==='none'?'block':'none';
  }

  function log(s) {
    const e=document.getElementById('sx-log'); if(!e) return;
    const d=document.createElement('div');
    d.textContent='['+new Date().toLocaleTimeString('ar-SA')+'] '+s;
    e.appendChild(d); e.scrollTop=e.scrollHeight;
  }

  function load(file) {
    const r=new FileReader();
    r.onload=e=>{
      try {
        let t=String(e.target.result).trim()
          .replace(/^window\.YTD\.tweets\.part\d+\s*=\s*/, '')
          .replace(/;$/, '');
        const raw=JSON.parse(t);
        list=raw.map(x=>{
          const z=x.tweet||x;
          const id=String(z.id_str||z.id);
          const text=z.full_text||z.text||'';
          let cat='original', source=null;
          if(text.startsWith('RT @')||z.retweeted_status_id_str){cat='retweet';source=z.retweeted_status_id_str||id;}
          else if(z.in_reply_to_status_id_str) cat='reply';
          else if(z.quoted_status_id_str) cat='quote';
          return {id,cat,source,text};
        }).filter(x=>x.id && x.id!=='undefined');
        document.getElementById('sx-stat').textContent='تم تحميل '+list.length+' سجل';
        document.getElementById('sx-start').disabled=false;
        log('تم تحليل الأرشيف: '+list.length+' منشور.');
      } catch(err) {
        alert('تعذر قراءة الملف: '+err.message);
      }
    };
    r.readAsText(file);
  }

  function selected() {
    const ok={original:document.getElementById('sx-o').checked,retweet:document.getElementById('sx-r').checked,quote:document.getElementById('sx-q').checked,reply:document.getElementById('sx-p').checked};
    return list.filter(x=>ok[x.cat]);
  }

  async function start() {
    const targets=selected();
    if(!targets.length){alert('لا توجد عناصر مطابقة.');return;}
    const dry=document.getElementById('sx-dry').checked;
    if(dry){
      document.getElementById('sx-status').textContent='المعاينة: '+targets.length+' عنصر جاهز';
      log('معاينة فقط: سيتم استهداف '+targets.length+' عنصر. لم يتم حذف شيء.');
      return;
    }
    const token=ct0();
    if(!token){alert('سجّل الدخول إلى x.com داخل التطبيق أولًا ثم حاول مجددًا.');return;}
    if(!confirm('سيتم حذف '+targets.length+' عنصر نهائيًا. هل تريد المتابعة؟')) return;

    running=true;
    document.getElementById('sx-start').disabled=true;
    document.getElementById('sx-stop').disabled=false;

    let i=0;
    for(const item of targets){
      if(!running) break;
      try{
        const rt=item.cat==='retweet';
        const op=rt?'DeleteRetweet':'DeleteTweet';
        const qid=rt?Q.DeleteRetweet:Q.DeleteTweet;
        const body=rt
          ? {variables:{source_tweet_id:item.source||item.id},queryId:qid}
          : {variables:{tweet_id:item.id,dark_request:false},queryId:qid};
        const res=await fetch('https://x.com/i/api/graphql/'+qid+'/'+op,{
          method:'POST',
          headers:{authorization:BEARER,'x-csrf-token':token,'x-twitter-active-user':'yes','x-twitter-auth-type':'OAuth2Session','content-type':'application/json'},
          body:JSON.stringify(body)
        });
        if(res.status===200) log('✓ تم: '+item.id);
        else if(res.status===429){log('حد مؤقت 429 — توقف تلقائيًا لحماية الحساب.');running=false;break;}
        else log('فشل '+item.id+' — HTTP '+res.status);
      }catch(err){log('خطأ: '+err.message);}
      i++;
      const p=Math.round(i*100/targets.length);
      document.getElementById('sx-bar').style.width=p+'%';
      document.getElementById('sx-status').textContent='التقدم '+i+' / '+targets.length+' — '+p+'%';
      await sleep(3000+Math.random()*2000);
    }

    running=false;
    document.getElementById('sx-start').disabled=false;
    document.getElementById('sx-stop').disabled=true;
    log('انتهت العملية أو تم إيقافها.');
  }

  setTimeout(addLauncher,1800);
  setInterval(addLauncher,5000);
})();