(function(){
'use strict';
if (window.__SWEEPX_ANDROID_DOM__) return;
window.__SWEEPX_ANDROID_DOM__ = true;

let running=false, deleted=0, failed=0;

const $=id=>document.getElementById(id);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const textOf=e=>(e&&e.innerText?e.innerText:'').trim();

function log(msg){
  const b=$('sx-log'); if(!b)return;
  const d=document.createElement('div');
  d.textContent='['+new Date().toLocaleTimeString('ar-SA')+'] '+msg;
  b.appendChild(d); b.scrollTop=b.scrollHeight;
}
function profileHref(){
  const a=document.querySelector('a[data-testid="AppTabBar_Profile_Link"]');
  return a&&a.getAttribute('href')?a.getAttribute('href'):null;
}
function ownProfile(){
  const h=profileHref();
  if(!h){ alert('افتح القائمة الجانبية في X ثم حاول مرة أخرى.'); return; }
  location.href='https://x.com'+h;
}
function ownReplies(){
  const h=profileHref();
  if(!h){ alert('افتح القائمة الجانبية في X ثم حاول مرة أخرى.'); return; }
  location.href='https://x.com'+h+'/with_replies';
}
function articles(){
  return Array.from(document.querySelectorAll('article[data-testid="tweet"]'));
}
function preview(){
  const list=articles();
  let reposts=0, deletable=0;
  list.forEach(a=>{
    if(a.querySelector('button[data-testid="unretweet"]')) reposts++;
    if(a.querySelector('button[data-testid="caret"]')) deletable++;
  });
  $('sx-preview').textContent='محمّل الآن: '+list.length+' منشور — محتمل للحذف: '+deletable+' — إعادة نشر: '+reposts;
  log('هذه معاينة فقط. لم يتم حذف شيء.');
}
async function tryUnrepost(article){
  const btn=article.querySelector('button[data-testid="unretweet"]');
  if(!btn)return false;
  btn.click(); await sleep(600);
  const confirm=document.querySelector('[data-testid="unretweetConfirm"]');
  if(confirm){confirm.click(); await sleep(1200); return true;}
  document.body.click();
  return false;
}
async function tryDelete(article){
  const caret=article.querySelector('button[data-testid="caret"]');
  if(!caret)return false;
  caret.click(); await sleep(650);

  const candidates=Array.from(document.querySelectorAll('[role="menuitem"], [data-testid="Dropdown"] div'));
  const del=candidates.find(e=>/^(delete|حذف)|delete post|حذف المنشور/i.test(textOf(e)));
  if(!del){ document.body.click(); return false; }

  del.click(); await sleep(650);
  const confirm=document.querySelector('[data-testid="confirmationSheetConfirm"]');
  if(!confirm){ document.body.click(); return false; }
  confirm.click(); await sleep(1400);
  return true;
}
async function run(){
  if(running)return;
  const max=Math.max(1,Math.min(500,parseInt($('sx-max').value||'50',10)));
  const minDelay=Math.max(2500,parseInt($('sx-delay').value||'4000',10));
  const removeReposts=$('sx-reposts').checked;
  running=true; deleted=0; failed=0;
  $('sx-start').disabled=true; $('sx-stop').disabled=false;
  log('بدأت العملية. الحد الأقصى '+max+' عنصر.');

  let stale=0;
  while(running && deleted<max && stale<10){
    const list=articles();
    let acted=false;

    for(const article of list){
      if(!running || deleted>=max)break;
      if(article.dataset.sxSeen==='1')continue;
      article.dataset.sxSeen='1';

      let ok=false;
      try{
        if(removeReposts) ok=await tryUnrepost(article);
        if(!ok) ok=await tryDelete(article);
      }catch(e){
        log('تعذر تنفيذ عنصر: '+e.message);
      }

      if(ok){
        deleted++; acted=true;
        log('تمت العملية رقم '+deleted+'.');
        $('sx-progress').textContent='نجاح: '+deleted+' — تعذر: '+failed;
        await sleep(minDelay+Math.floor(Math.random()*1800));
      }else{
        failed++;
      }
    }

    if(!running || deleted>=max)break;
    if(!acted) stale++; else stale=0;
    window.scrollBy({top:Math.max(700,window.innerHeight*0.9),behavior:'smooth'});
    await sleep(1600);
  }

  running=false;
  $('sx-start').disabled=false; $('sx-stop').disabled=true;
  $('sx-progress').textContent='انتهت/توقفت العملية — نجاح: '+deleted+' — تعذر: '+failed;
  log('انتهت العملية.');
}
function stop(){
  running=false;
  $('sx-stop').disabled=true;
  log('تم طلب الإيقاف.');
}

function build(){
  if($('sx-fab'))return;

  const fab=document.createElement('button');
  fab.id='sx-fab';
  fab.textContent='🧹 SweepX';
  fab.style.cssText='position:fixed;right:14px;bottom:18px;z-index:2147483646;background:#0f1419;color:#fff;border:1px solid #536471;border-radius:999px;padding:12px 17px;font:700 14px system-ui;box-shadow:0 5px 18px #0007';
  document.body.appendChild(fab);

  const modal=document.createElement('div');
  modal.id='sx-modal';
  modal.style.cssText='display:none;position:fixed;inset:0;z-index:2147483647;background:#000b;align-items:center;justify-content:center;padding:10px;direction:rtl;font-family:system-ui';
  modal.innerHTML=`
    <div style="width:min(620px,96vw);max-height:92vh;overflow:auto;background:#0f1419;color:#e7e9ea;border:1px solid #536471;border-radius:18px;padding:17px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:20px;font-weight:800">SweepX عربي</div>
          <div style="font-size:12px;color:#8b98a5;margin-top:3px">تنظيف حسابك من داخل X، بدون خادم وسيط.</div>
        </div>
        <button id="sx-close" style="background:none;border:0;color:#fff;font-size:25px">×</button>
      </div>

      <div style="margin-top:14px;padding:12px;background:#16181c;border:1px solid #2f3336;border-radius:13px">
        <div style="font-weight:700">ابدأ من صفحتك</div>
        <div style="display:flex;gap:8px;margin-top:9px">
          <button id="sx-profile" style="flex:1;padding:10px;border:0;border-radius:9px;background:#1d9bf0;color:#fff;font-weight:700">منشوراتي</button>
          <button id="sx-replies-page" style="flex:1;padding:10px;border:1px solid #536471;border-radius:9px;background:#202327;color:#fff;font-weight:700">منشوراتي + الردود</button>
        </div>
      </div>

      <div style="margin-top:12px;padding:12px;border:1px solid #2f3336;border-radius:13px">
        <label style="font-size:13px">الحد الأقصى في هذه الجولة
          <input id="sx-max" type="number" min="1" max="500" value="50" style="box-sizing:border-box;width:100%;margin-top:5px;padding:9px;border-radius:8px;border:1px solid #536471;background:#000;color:#fff">
        </label>
        <label style="display:block;font-size:13px;margin-top:9px">الفاصل الأساسي بالمللي ثانية
          <input id="sx-delay" type="number" min="2500" max="30000" value="4000" style="box-sizing:border-box;width:100%;margin-top:5px;padding:9px;border-radius:8px;border:1px solid #536471;background:#000;color:#fff">
        </label>
        <label style="display:block;margin-top:10px"><input id="sx-reposts" type="checkbox" checked> إلغاء إعادة النشر أيضًا</label>
      </div>

      <div style="margin-top:12px;padding:12px;border:1px solid #2f3336;border-radius:13px">
        <button id="sx-check" style="width:100%;padding:10px;border:1px solid #536471;border-radius:9px;background:#202327;color:#fff;font-weight:700">معاينة الصفحة الحالية</button>
        <div id="sx-preview" style="font-size:12px;color:#8b98a5;margin-top:8px">لم تتم المعاينة بعد.</div>
        <div style="font-size:12px;color:#ffb703;margin:10px 0">الحذف لا يبدأ تلقائيًا. ستظهر رسالة تأكيد قبل البدء.</div>
        <div style="display:flex;gap:8px">
          <button id="sx-start" style="flex:1;padding:11px;border:0;border-radius:9px;background:#f4212e;color:#fff;font-weight:800">بدء التنظيف</button>
          <button id="sx-stop" disabled style="padding:11px 15px;border:1px solid #536471;border-radius:9px;background:#202327;color:#fff">إيقاف</button>
        </div>
        <div id="sx-progress" style="font-size:12px;color:#8b98a5;margin-top:8px">جاهز.</div>
      </div>

      <div id="sx-log" style="margin-top:12px;height:120px;overflow:auto;background:#000;border-radius:10px;padding:8px;font:11px monospace;color:#8b98a5"></div>
    </div>`;
  document.body.appendChild(modal);

  fab.onclick=()=>modal.style.display='flex';
  $('sx-close').onclick=()=>modal.style.display='none';
  $('sx-profile').onclick=ownProfile;
  $('sx-replies-page').onclick=ownReplies;
  $('sx-check').onclick=preview;
  $('sx-stop').onclick=stop;
  $('sx-start').onclick=()=>{
    const n=Math.max(1,Math.min(500,parseInt($('sx-max').value||'50',10)));
    if(confirm('سيحاول التطبيق حذف/إلغاء إعادة نشر حتى '+n+' عنصر من صفحتك الحالية. هل تريد البدء؟')) run();
  };
}
setTimeout(build,1200);
})();