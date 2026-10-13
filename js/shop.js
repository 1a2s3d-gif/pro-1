const $=s=>document.querySelector(s);
const fmt = (num) => Number(num).toLocaleString('ae-AE') + ' د.إ';
const FREE=500,SHIP=25;
const EMIRATES=['أبوظبي','دبي','الشارقة','عجمان','أم القيوين','رأس الخيمة','الفجيرة'];
let cat='الكل',q='';
const products=()=>DB.products();
const find=id=>products().find(p=>p.id===id);

function toast(t){const e=document.createElement('div');e.className='toast';e.textContent=t;document.body.append(e);setTimeout(()=>e.remove(),1800)}

/* ---------- القائمة ---------- */
function renderCats(){
  const cs=['الكل',...new Set(products().map(p=>p.cat))];
  $('#catNav').innerHTML=cs.map(c=>`<button class="chip ${c===cat?'on':''}" data-cat="${c}">${c}</button>`).join('');
}
function list() {
  let l = products().filter(p => (cat === 'الكل' || p.cat === cat) && p.name.includes(q.trim()));
  
  if ($('#stockOnly').checked) l = l.filter(p => p.stock > 0);
  const s = $('#sortSel').value, d = p => p.old ? (p.old - p.price) / p.old : 0;
  
  if (s === 'priceAsc') l.sort((a, b) => a.price - b.price);
  if (s === 'priceDesc') l.sort((a, b) => b.price - a.price);
  if (s === 'rating') l.sort((a, b) => b.rating - a.rating);
  if (s === 'discount') l.sort((a, b) => d(b) - d(a));
  
  return l;
}

function renderGrid() {
  const l = list(); // تجلب القائمة المفلترة هنا فقط
  $('#listTitle').textContent = cat === 'الكل' ? 'كل المنتجات' : cat;
  $('#resultCount').textContent = l.length + ' منتج';
  
  $('#grid').innerHTML = l.length ? l.map(p => `
    <article>
      <div class="thumb">
        <img src="${p.icon}" alt="${p.name}" class="product-thumb-img">
      </div>
      <h3 class="product-title">${p.name}</h3>
      ${p.stock === 0 ? '<span class="tag out">نفذ</span>' : ''}
      <div class="price">
      <span>${p.price} د.إ</span> 
        ${p.old ? `<s>${fmt(p.old)}</s>` : ''}
      </div>
      <button class="btn" data-add="${p.id}" ${p.stock ? '' : 'disabled'}>
        ${p.stock ? 'إضافة للسلة' : 'غير متوفر'}
      </button>
    </article>
  `).join('') : '<p class="empty">لا توجد نتائج مطابقة لتطلعاتك</p>';
}
renderGrid();
/* ---------- السلة ---------- */
function add(id,n=1){
  const p=find(id),c=DB.cart(),it=c.find(x=>x.id===id);
  const have=it?it.qty:0;
  if(!p||have+n>p.stock)return toast('الكمية المتاحة في المخزون: '+(p?p.stock:0));
  it?it.qty+=n:c.push({id,qty:n});
  DB.saveCart(c);renderCart();toast('تمت الإضافة إلى السلة');
}
function setQty(id,d){
  let c=DB.cart();const it=c.find(x=>x.id===id),p=find(id);
  if(!it)return;
  it.qty+=d;
  if(it.qty>p.stock){it.qty=p.stock;toast('وصلت للحد الأقصى المتاح')}
  c=c.filter(x=>x.qty>0);DB.saveCart(c);renderCart();
}
function totals(){
  const items=DB.cart().map(x=>({...find(x.id),qty:x.qty})).filter(x=>x.id);
  const sub=items.reduce((s,i)=>s+i.price*i.qty,0);
  const ship=!sub||sub>=FREE?0:SHIP;
  return{items,sub,ship,total:sub+ship,vat:(sub+ship)*5/105};
}
function renderCart(){
  const t=totals();
  $('#cartCount').textContent=t.items.reduce((s,i)=>s+i.qty,0);
  $('#cartBody').innerHTML=t.items.length?t.items.map(i=>`
  <div class="line"><span class="ic">${i.icon}</span><div class="nm">${i.name}<br><small>${fmt(i.price)}</small></div>
  <div class="qty"><button class="icon-btn" data-q="${i.id}" data-d="-1" aria-label="إنقاص"><span data-ic="minus"></span></button><b>${i.qty}</b>
  <button class="icon-btn" data-q="${i.id}" data-d="1" aria-label="زيادة"><span data-ic="plus"></span></button></div></div>`).join(''):'<p class="empty">سلتك فارغة</p>';
  const f=$('#cartFoot');f.hidden=!t.items.length;
  f.innerHTML=summaryHTML(t)+'<button class="btn btn-lg btn-block" id="goCheckout">إتمام الطلب</button>';
  icons($('#cart'));
}
function summaryHTML(t){
  return `<div class="row"><span>المجموع</span><span>${fmt(t.sub)}</span></div>
  <div class="row"><span>الشحن</span><span>${t.ship?fmt(t.ship):'مجاني'}</span></div>
  <div class="row total"><span>الإجمالي</span><span>${fmt(t.total)}</span></div>
  <div class="row"><small>شامل ضريبة القيمة المضافة</small><small>${fmt(t.vat)}</small></div>`;
}
function openCart(o){
  $('#cart').classList.toggle('on',o);$('#overlay').classList.toggle('on',o);$('#cart').inert=!o;
}

/* ---------- تفاصيل المنتج ---------- */
function showProduct(id){
  const p=find(id);if(!p)return;
  $('#pdKicker').textContent=p.cat;
  $('#productBody').innerHTML=`<div class="pd"><div class="thumb">${p.icon}</div><div>
  <h2>${p.name}</h2><p class="sub">★ ${p.rating} · ${p.stock?`متوفر (${p.stock} قطعة)`:'غير متوفر'}</p>
  <p style="margin:12px 0">${p.desc}</p><div class="price" style="font-size:1.5rem">${fmt(p.price)}${p.old?`<s>${fmt(p.old)}</s>`:''}</div>
  <button class="btn btn-lg btn-block" data-add="${p.id}" ${p.stock?'':'disabled'}>أضف للسلة</button></div></div>`;
  $('#productDlg').showModal();
}

/* ---------- الدفع ---------- */
const err=(el,m)=>{el.classList.toggle('bad',!!m);el.parentElement.querySelector('.err').textContent=m||'';return !m};
const luhn=s=>{let sum=0,alt=false;for(let i=s.length-1;i>=0;i--){let n=+s[i];if(alt){n*=2;if(n>9)n-=9}sum+=n;alt=!alt}return sum%10===0};
function validate(){
  let ok=true;const v=id=>$('#'+id).value.trim();
  ok&=err($('#coName'),v('coName').length<3?'أدخل اسمك الكامل':'');
  ok&=err($('#coPhone'),/^(\+?971|0)?5\d{8}$/.test(v('coPhone').replace(/\s/g,''))?'':'رقم جوال إماراتي غير صحيح');
  ok&=err($('#coEmail'),/^\S+@\S+\.\S+$/.test(v('coEmail'))?'':'بريد إلكتروني غير صحيح');
  ok&=err($('#coEmirate'),v('coEmirate')?'':'اختر الإمارة');
  ok&=err($('#coAddress'),v('coAddress').length<8?'أدخل عنوانًا تفصيليًا':'');
  if(document.querySelector('[name=pay]:checked').value==='card'){
    const n=v('cardNum').replace(/\s/g,'');
    ok&=err($('#cardNum'),/^\d{16}$/.test(n)&&luhn(n)?'':'رقم بطاقة غير صحيح');
    const m=v('cardExp').match(/^(\d\d)\/(\d\d)$/);const now=new Date();
    const good=m&&+m[1]>=1&&+m[1]<=12&&new Date(2000+ +m[2],+m[1],0,23,59)>=now;
    ok&=err($('#cardExp'),good?'':'تاريخ غير صحيح أو منتهي');
    ok&=err($('#cardCvv'),/^\d{3,4}$/.test(v('cardCvv'))?'':'رمز غير صحيح');
  }
  return !!ok;
}
function openCheckout(){
  openCart(false);
  $('#coSummary').innerHTML='<h3 style="margin-bottom:10px">ملخص الطلب</h3>'+totals().items.map(i=>`<div class="row"><span>${i.name} × ${i.qty}</span><span>${fmt(i.price*i.qty)}</span></div>`).join('')+summaryHTML(totals());
  $('#coError').textContent='';$('#checkoutDlg').showModal();
}
function placeOrder(e){
  e.preventDefault();
  const t=totals();
  if(!t.items.length)return;
  if(!validate()){$('#coError').textContent='راجع الحقول المحددة بالأحمر.';return}
  // إعادة فحص المخزون قبل التأكيد
  const bad=t.items.find(i=>i.qty>find(i.id).stock);
  if(bad){$('#coError').textContent='نفدت كمية "'+bad.name+'". عدّل السلة.';return}
  const all=products();
  t.items.forEach(i=>{all.find(p=>p.id===i.id).stock-=i.qty});
  DB.saveProducts(all);
  const order={id:'NB-'+Date.now().toString().slice(-6),date:new Date().toISOString(),
    customer:{name:$('#coName').value.trim(),phone:$('#coPhone').value.trim(),email:$('#coEmail').value.trim(),emirate:$('#coEmirate').value,address:$('#coAddress').value.trim()},
    items:t.items.map(i=>({id:i.id,name:i.name,price:i.price,qty:i.qty})),
    subtotal:t.sub,shipping:t.ship,total:t.total,pay:document.querySelector('[name=pay]:checked').value,status:'جديد'};
  const os=DB.orders();os.unshift(order);DB.saveOrders(os);   // لا تُحفظ بيانات البطاقة
  DB.saveCart([]);$('#coForm').reset();
  $('#checkoutDlg').close();
  $('#doneBody').innerHTML=`<div style="text-align:center"><div style="font-size:3rem">✅</div><h2>تم استلام طلبك</h2>
  <p class="sub" style="margin:8px 0">رقم الطلب: <b dir="ltr">${order.id}</b></p><p>الإجمالي: ${fmt(order.total)}</p>
  <button class="btn btn-block" data-close>متابعة التسوق</button></div>`;
  $('#doneDlg').showModal();
  renderCart();renderGrid();
}

/* ---------- الأحداث ---------- */
document.addEventListener('click',e=>{
  const t=e.target;
  const a=t.closest('[data-add]');if(a){e.stopPropagation();add(+a.dataset.add);return}
  const q2=t.closest('[data-q]');if(q2)return setQty(+q2.dataset.q,+q2.dataset.d);
  const c=t.closest('[data-cat]');if(c){cat=c.dataset.cat;renderCats();return renderGrid()}
  if(t.closest('[data-close]'))return t.closest('dialog').close();
  if(t.closest('#goCheckout'))return openCheckout();
  const card=t.closest('.card');if(card)showProduct(+card.dataset.id);
});
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close()}));
$('#cartBtn').onclick=()=>openCart(true);$('#cartClose').onclick=$('#overlay').onclick=()=>openCart(false);
$('#searchInput').oninput=e=>{q=e.target.value;renderGrid()};
$('#sortSel').onchange=$('#stockOnly').onchange=renderGrid;
$('#coForm').onsubmit=placeOrder;
document.querySelectorAll('[name=pay]').forEach(r=>r.onchange=()=>{$('#cardFields').style.display=document.querySelector('[name=pay]:checked').value==='card'?'grid':'none'});
$('#cardNum').oninput=e=>{e.target.value=e.target.value.replace(/\D/g,'').slice(0,19).replace(/(.{4})/g,'$1 ').trim()};
$('#cardExp').oninput=e=>{let v=e.target.value.replace(/\D/g,'').slice(0,4);e.target.value=v.length>2?v.slice(0,2)+'/'+v.slice(2):v};
$('#coEmirate').innerHTML+=EMIRATES.map(x=>`<option>${x}</option>`).join('');

/* ---------- تتبع الطلب ---------- */
$('#trackBtn').onclick=()=>{$('#trackRes').innerHTML='';$('#trackDlg').showModal()};
$('#trackGo').onclick=()=>{
  const id=$('#trackId').value.trim().toUpperCase(),o=DB.orders().find(x=>x.id===id),S=['جديد','قيد التجهيز','تم الشحن','تم التسليم'];
  $('#trackRes').innerHTML=!o?'<p class="err">لم يتم العثور على الطلب.</p>':o.status==='ملغي'?'<p class="low">هذا الطلب ملغي.</p>':
  S.map((x,i)=>`<div class="row"><span>${i<=S.indexOf(o.status)?'✅':'⬜'} ${x}</span></div>`).join('')+`<p class="sub" style="margin-top:8px">الإجمالي: ${fmt(o.total)}</p>`;
};