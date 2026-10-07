// ==UserScript==
// @name         X Bulk Mobile AR
// @namespace    https://github.com/mksstoore-gif/open-ai-studio
// @version      1.0.0
// @description  أدوات تنظيف X من الجوال: حذف منشورات ظاهرة، إلغاء متابعة، إزالة إعجابات، وإزالة إعادات النشر عبر واجهة X نفسها.
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/mksstoore-gif/open-ai-studio/sweepx-mobile/XBulk-Mobile-Ar.user.js
// @updateURL    https://raw.githubusercontent.com/mksstoore-gif/open-ai-studio/sweepx-mobile/XBulk-Mobile-Ar.user.js
// @run-at       document-idle
// ==/UserScript==

(function(){
  'use strict';

  let running = false;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const rand = (a,b) => Math.floor(a + Math.random()*(b-a));
  const visible = e => e && e.offsetParent !== null;
  const all = s => Array.from(document.querySelectorAll(s));

  function setStatus(t){
    const e=document.getElementById('xbm-status');
    if(e)e.textContent=t;
  }

  async function waitFor(selector, timeout=2500){
    const start=Date.now();
    while(Date.now()-start<timeout){
      const e=document.querySelector(selector);
      if(e)return e;
      await sleep(120);
    }
    return null;
  }

  function stop(){
    running=false;
    setStatus('تم طلب الإيقاف');
  }

  function ensureButton(){
    if(document.getElementById('xbm-open')) return;
    const b=document.createElement('button');
    b.id='xbm-open';
    b.textContent='🧹 أدوات X';
    b.style.cssText='position:fixed;right:14px;bottom:18px;z-index:2147483646;background:#111;color:#fff;border:0;border-radius:999px;padding:12px 16px;font-weight:800;font-size:14px;box-shadow:0 8px 24px #0008';
    b.onclick=openPanel;
    document.body.appendChild(b);
  }

  function openPanel(){
    let o=document.getElementById('xbm-overlay');
    if(o){o.remove();return;}

    o=document.createElement('div');
    o.id='xbm-overlay';
    o.dir='rtl';
    o.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#000b;display:flex;align-items:flex-end;justify-content:center;font-family:system-ui,-apple-system,Segoe UI,Tahoma,Arial,sans-serif';
    o.innerHTML=
      '<div style="width:min(720px,100vw);max-height:92vh;overflow:auto;background:#0f1419;color:#e7e9ea;border-radius:20px 20px 0 0;padding:14px;box-sizing:border-box">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:#0f1419;padding-bottom:10px">'+
          '<div><b style="font-size:19px">X Bulk Mobile AR</b><div style="font-size:12px;color:#71767b;margin-top:3px">مجاني • يعمل محليًا • بدون X API</div></div>'+
          '<button id="xbm-close" style="width:38px;height:38px;border:0;border-radius:50%;background:#222;color:#fff;font-size:20px">×</button>'+
        '</div>'+

        '<div style="background:#16181c;border:1px solid #2f3336;border-radius:14px;padding:12px;margin:10px 0">'+
          '<b>حذف المنشورات من الصفحة الحالية</b>'+
          '<p style="font-size:12px;color:#8b98a5;line-height:1.6">افتح ملفك الشخصي في X. الأداة تستخدم قائمة الثلاث نقاط ثم زر حذف والتأكيد، وتتحرك لأسفل تلقائيًا.</p>'+
          '<input id="xbm-del-max" type="number" min="1" max="100" value="15" style="width:100%;box-sizing:border-box;padding:10px;border:1px solid #536471;border-radius:9px;background:#111;color:#fff">'+
          '<button id="xbm-delete" style="margin-top:8px;width:100%;padding:11px;border:0;border-radius:9px;background:#f4212e;color:#fff;font-weight:800">ابدأ حذف المنشورات</button>'+
        '</div>'+

        '<div style="background:#16181c;border:1px solid #2f3336;border-radius:14px;padding:12px;margin:10px 0">'+
          '<b>إلغاء متابعة جماعي</b>'+
          '<p style="font-size:12px;color:#8b98a5;line-height:1.6">افتح صفحة Following / المتابَعون أولاً.</p>'+
          '<input id="xbm-u-max" type="number" min="1" max="100" value="20" style="width:100%;box-sizing:border-box;padding:10px;border:1px solid #536471;border-radius:9px;background:#111;color:#fff">'+
          '<button id="xbm-unfollow" style="margin-top:8px;width:100%;padding:11px;border:0;border-radius:9px;background:#f4212e;color:#fff;font-weight:800">ابدأ إلغاء المتابعة</button>'+
        '</div>'+

        '<div style="background:#16181c;border:1px solid #2f3336;border-radius:14px;padding:12px;margin:10px 0">'+
          '<b>مسح الإعجابات</b>'+
          '<p style="font-size:12px;color:#8b98a5;line-height:1.6">افتح تبويب Likes / الإعجابات في حسابك أولاً.</p>'+
          '<input id="xbm-l-max" type="number" min="1" max="200" value="30" style="width:100%;box-sizing:border-box;padding:10px;border:1px solid #536471;border-radius:9px;background:#111;color:#fff">'+
          '<button id="xbm-unlike" style="margin-top:8px;width:100%;padding:11px;border:0;border-radius:9px;background:#f4212e;color:#fff;font-weight:800">ابدأ إزالة الإعجابات</button>'+
        '</div>'+

        '<div style="background:#16181c;border:1px solid #2f3336;border-radius:14px;padding:12px;margin:10px 0">'+
          '<b>إزالة إعادات النشر</b>'+
          '<p style="font-size:12px;color:#8b98a5;line-height:1.6">افتح ملفك الشخصي أو الصفحة التي تظهر فيها منشوراتك.</p>'+
          '<input id="xbm-r-max" type="number" min="1" max="200" value="30" style="width:100%;box-sizing:border-box;padding:10px;border:1px solid #536471;border-radius:9px;background:#111;color:#fff">'+
          '<button id="xbm-unrepost" style="margin-top:8px;width:100%;padding:11px;border:0;border-radius:9px;background:#f4212e;color:#fff;font-weight:800">ابدأ إزالة الريبوست</button>'+
        '</div>'+

        '<div style="background:#080b0e;border-radius:10px;padding:10px;font-size:12px"><b id="xbm-status">جاهز</b></div>'+
        '<button id="xbm-stop" style="margin-top:10px;width:100%;padding:11px;border:0;border-radius:9px;background:#273340;color:#fff;font-weight:800">إيقاف العملية الحالية</button>'+
        '<div style="font-size:11px;color:#ffb000;line-height:1.6;margin-top:10px">ابدأ بأعداد صغيرة. X قد يغير أسماء الأزرار أو يفرض حدودًا مؤقتة. الحذف النهائي لا يمكن التراجع عنه.</div>'+
      '</div>';

    document.body.appendChild(o);
    document.getElementById('xbm-close').onclick=()=>o.remove();
    document.getElementById('xbm-stop').onclick=stop;
    document.getElementById('xbm-delete').onclick=runDelete;
    document.getElementById('xbm-unfollow').onclick=runUnfollow;
    document.getElementById('xbm-unlike').onclick=runUnlike;
    document.getElementById('xbm-unrepost').onclick=runUnrepost;
  }

  async function runDelete(){
    if(running)return;
    const max=Math.max(1,Math.min(100,Number(document.getElementById('xbm-del-max').value)||15));
    if(!confirm('سيتم حذف ما يصل إلى '+max+' منشور نهائيًا من الصفحة الحالية. متابعة؟'))return;
    running=true;
    let n=0, empty=0;
    setStatus('جارٍ حذف المنشورات...');

    while(running && n<max && empty<8){
      const articles=all('article[data-testid="tweet"]').filter(visible).filter(a=>!a.dataset.xbmDone);
      let acted=false;

      for(const a of articles){
        if(!running || n>=max)break;
        a.dataset.xbmDone='1';
        const caret=a.querySelector('[data-testid="caret"]');
        if(!caret)continue;

        caret.click();
        await sleep(450);

        const items=all('[role="menuitem"]');
        const del=items.find(x=>{
          const t=(x.innerText||x.textContent||'').trim().toLowerCase();
          return t==='delete' || t.includes('حذف');
        });

        if(!del){
          document.body.click();
          continue;
        }

        del.click();
        const yes=await waitFor('[data-testid="confirmationSheetConfirm"]',2200);
        if(!yes){
          setStatus('لم أجد زر تأكيد الحذف؛ ربما تغيرت واجهة X');
          running=false;
          break;
        }
        yes.click();
        n++;
        acted=true;
        setStatus('تم حذف '+n+' / '+max);
        await sleep(rand(3200,5200));
      }

      if(!acted)empty++; else empty=0;
      scrollBy({top:Math.round(innerHeight*.72),behavior:'smooth'});
      await sleep(1400);
    }

    running=false;
    setStatus('توقفت جولة الحذف بعد '+n+' منشور');
  }

  async function runUnfollow(){
    if(running)return;
    const max=Math.max(1,Math.min(100,Number(document.getElementById('xbm-u-max').value)||20));
    if(!confirm('سيتم إلغاء متابعة ما يصل إلى '+max+' حساب. متابعة؟'))return;
    running=true;
    let n=0, empty=0;
    setStatus('جارٍ إلغاء المتابعة...');

    while(running && n<max && empty<8){
      const btns=all('button[data-testid$="-unfollow"]').filter(visible).filter(b=>!b.dataset.xbmDone);
      if(!btns.length){
        empty++;
        scrollBy({top:Math.round(innerHeight*.75),behavior:'smooth'});
        await sleep(1600);
        continue;
      }
      empty=0;

      for(const b of btns){
        if(!running || n>=max)break;
        b.dataset.xbmDone='1';
        b.click();
        await sleep(450);
        const yes=await waitFor('[data-testid="confirmationSheetConfirm"]',1800);
        if(!yes){
          setStatus('لم أجد زر تأكيد إلغاء المتابعة؛ ربما تغيرت واجهة X');
          running=false;
          break;
        }
        yes.click();
        n++;
        setStatus('تم إلغاء متابعة '+n+' / '+max);
        await sleep(rand(3200,5200));
      }

      scrollBy({top:Math.round(innerHeight*.62),behavior:'smooth'});
      await sleep(1100);
    }

    running=false;
    setStatus('توقفت جولة إلغاء المتابعة بعد '+n+' حساب');
  }

  async function runUnlike(){
    if(running)return;
    const max=Math.max(1,Math.min(200,Number(document.getElementById('xbm-l-max').value)||30));
    if(!confirm('سيتم إزالة ما يصل إلى '+max+' إعجاب. متابعة؟'))return;
    running=true;
    let n=0, empty=0;
    setStatus('جارٍ إزالة الإعجابات...');

    while(running && n<max && empty<9){
      const btns=all('[data-testid="unlike"]').filter(visible).filter(b=>!b.dataset.xbmDone);
      if(!btns.length){
        empty++;
        scrollBy({top:Math.round(innerHeight*.75),behavior:'smooth'});
        await sleep(1500);
        continue;
      }
      empty=0;

      for(const b of btns){
        if(!running || n>=max)break;
        b.dataset.xbmDone='1';
        b.click();
        n++;
        setStatus('تمت إزالة '+n+' / '+max+' إعجاب');
        await sleep(rand(2200,3700));
      }

      scrollBy({top:Math.round(innerHeight*.64),behavior:'smooth'});
      await sleep(900);
    }

    running=false;
    setStatus('توقفت جولة الإعجابات بعد '+n);
  }

  async function runUnrepost(){
    if(running)return;
    const max=Math.max(1,Math.min(200,Number(document.getElementById('xbm-r-max').value)||30));
    if(!confirm('سيتم إزالة ما يصل إلى '+max+' إعادة نشر. متابعة؟'))return;
    running=true;
    let n=0, empty=0;
    setStatus('جارٍ إزالة إعادات النشر...');

    while(running && n<max && empty<9){
      const btns=all('[data-testid="unretweet"]').filter(visible).filter(b=>!b.dataset.xbmDone);
      if(!btns.length){
        empty++;
        scrollBy({top:Math.round(innerHeight*.75),behavior:'smooth'});
        await sleep(1500);
        continue;
      }
      empty=0;

      for(const b of btns){
        if(!running || n>=max)break;
        b.dataset.xbmDone='1';
        b.click();
        await sleep(420);
        const yes=await waitFor('[data-testid="unretweetConfirm"]',1800);
        if(!yes){
          setStatus('لم أجد زر تأكيد إزالة الريبوست؛ ربما تغيرت واجهة X');
          running=false;
          break;
        }
        yes.click();
        n++;
        setStatus('تمت إزالة '+n+' / '+max+' إعادة نشر');
        await sleep(rand(2200,3700));
      }

      scrollBy({top:Math.round(innerHeight*.64),behavior:'smooth'});
      await sleep(900);
    }

    running=false;
    setStatus('توقفت جولة الريبوست بعد '+n);
  }

  setTimeout(ensureButton,1800);
  setInterval(ensureButton,3500);
})();