/* ============================================================
   SYVRA STORE
   Safe static-store configuration
   ------------------------------------------------------------
   1) Put your WhatsApp number in WHATSAPP_NUMBER.
      Format: country code + number, no +, spaces or dashes.
      Example format: 923001234567
   2) For real Google sign-in, create a Firebase Web App,
      enable Google Authentication, and paste the web config
      into FIREBASE_CONFIG below.
   3) Never put WhatsApp API tokens, payment secrets, or private
      server keys in this frontend file.
   ============================================================ */

const CONFIG = {
  STORE_NAME: "SYVRA",
  CURRENCY: "PKR",
  WHATSAPP_NUMBER: "923099086490", // <-- REPLACE with your own WhatsApp number
  DELIVERY_FEE: 250,
  FREE_DELIVERY_FROM: 5000,

  // Firebase Web App config. These are public client identifiers,
  // but your Firebase Security Rules must still be configured correctly.
  FIREBASE_CONFIG: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  }
};

const PRODUCTS = [
  {id:"syvra-pure",name:"SYVRA Pure Face Wash", image: "assets/syvra-pure-face-wash.svg",category:"face-wash",price:1299,desc:"Daily cleansing formula for a fresh, clean feel.",badge:"BESTSELLER"},
  {id:"syvra-gold",name:"SYVRA Gold Face Wash", image: "assets/syvra-gold-face-wash.svg",category:"face-wash",price:1699,desc:"Signature premium cleanser with a rich-feel finish.",badge:"SIGNATURE"},
  {id:"syvra-glow",name:"SYVRA Glow Care", image: "assets/syvra-glow-care.svg",category:"care",price:1899,desc:"A simple daily care essential for a polished routine.",badge:"NEW"},
  {id:"syvra-duo",name:"SYVRA Duo Bundle", image: "assets/syvra-duo-bundle.svg",category:"bundle",price:2899,desc:"Two signature essentials together at a bundle price.",badge:"VALUE"}
];

const state = {
  cart: loadJSON("syvra_cart", []),
  orders: loadJSON("syvra_orders", []),
  currentCustomer: loadJSON("syvra_customer", null),
  checkoutCustomer: null,
  pendingOrder: null,
  firebase: null,
  firebaseAuth: null
};

const $ = id => document.getElementById(id);
const money = n => `${CONFIG.CURRENCY} ${Number(n).toLocaleString("en-PK")}`;

function loadJSON(key, fallback){
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function saveJSON(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
function escapeHTML(value){
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}
function showToast(message){
  const t=$("toast"); t.textContent=message; t.classList.add("show");
  clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>t.classList.remove("show"),3000);
}
function openModal(id){ $(id).classList.remove("hidden"); document.body.style.overflow="hidden"; }
function closeModal(id){ $(id).classList.add("hidden"); if(!document.querySelector(".modal:not(.hidden)")) document.body.style.overflow=""; }

function isCheckoutComplete(){
  const requiredIds=["customerName","customerPhone","customerEmail","customerAddress","customerCity","paymentMethod"];
  const filled=requiredIds.every(id=>$(id).value.trim()!=="");
  const terms=$("termsCheck").checked;
  const phoneOk=validPhone($("customerPhone").value.trim());
  const emailOk=$("customerEmail").checkValidity();
  return filled && terms && phoneOk && emailOk;
}
function updateReviewButton(){
  const btn=$("reviewOrderBtn");
  if(!btn) return;
  btn.disabled=!isCheckoutComplete();
  btn.title=btn.disabled ? "Complete all required details and accept the confirmation checkbox first." : "Review your order";
}
function setupCheckoutValidation(){
  ["customerName","customerPhone","customerEmail","customerAddress","customerCity","customerPostal","paymentMethod","termsCheck"]
    .forEach(id=>{
      const el=$(id);
      if(!el) return;
      el.addEventListener("input",updateReviewButton);
      el.addEventListener("change",updateReviewButton);
    });
  updateReviewButton();
}
function getProduct(id){ return PRODUCTS.find(p=>p.id===id); }
function cartSubtotal(){ return state.cart.reduce((sum,item)=>sum+(getProduct(item.id)?.price||0)*item.qty,0); }
function deliveryFee(){
  const subtotal=cartSubtotal();
  if(!subtotal) return 0;
  return subtotal >= CONFIG.FREE_DELIVERY_FROM ? 0 : CONFIG.DELIVERY_FEE;
}
function cartTotal(){ return cartSubtotal()+deliveryFee(); }

function renderProducts(){
  const query=$("searchInput").value.trim().toLowerCase();
  const category=$("categoryFilter").value;
  const list=PRODUCTS.filter(p=>
    (category==="all"||p.category===category) &&
    (!query || `${p.name} ${p.desc}`.toLowerCase().includes(query))
  );
  $("productGrid").innerHTML=list.length ? list.map(productCard).join("") :
    `<div class="empty-products">No products matched your search.</div>`;
}
function productCard(p){
  return `<article class="product-card">
    <div class="product-media">
      <div class="product-bottle"><div class="product-cap"></div></div>
    </div>
    <div class="product-info">
      <div class="product-category">${escapeHTML(p.badge)} • ${escapeHTML(p.category.replace("-", " "))}</div>
      <h3>${escapeHTML(p.name)}</h3>
      <p class="product-desc">${escapeHTML(p.desc)}</p>
      <div class="product-bottom">
        <span class="price">${money(p.price)}</span>
        <button class="add-btn" data-add="${p.id}">Add to cart</button>
      </div>
    </div>
  </article>`;
}

function addToCart(id){
  const found=state.cart.find(i=>i.id===id);
  if(found) found.qty++;
  else state.cart.push({id,qty:1});
  saveJSON("syvra_cart",state.cart); renderCart(); showToast("Added to cart.");
}
function updateQty(id,delta){
  const item=state.cart.find(i=>i.id===id); if(!item) return;
  item.qty+=delta;
  if(item.qty<=0) state.cart=state.cart.filter(i=>i.id!==id);
  saveJSON("syvra_cart",state.cart); renderCart();
}
function renderCart(){
  const count=state.cart.reduce((s,i)=>s+i.qty,0);
  $("cartCount").textContent=count;
  $("cartItems").innerHTML=state.cart.length ? state.cart.map(item=>{
    const p=getProduct(item.id);
    return `<div class="cart-row">
      <div class="cart-thumb">S</div>
      <div><h4>${escapeHTML(p.name)}</h4><small>${money(p.price)} each</small>
        <div class="qty">
          <button data-minus="${p.id}">−</button><span>${item.qty}</span><button data-plus="${p.id}">+</button>
        </div>
        <button class="remove" data-remove="${p.id}">Remove</button>
      </div>
      <div class="cart-price">${money(p.price*item.qty)}</div>
    </div>`;
  }).join("") : `<div class="empty-products">Your cart is empty.</div>`;
  $("cartSubtotal").textContent=money(cartSubtotal());
  $("cartDelivery").textContent=deliveryFee()===0 ? (cartSubtotal() ? "FREE" : money(0)) : money(deliveryFee());
  $("cartTotal").textContent=money(cartTotal());
  $("checkoutBtn").disabled=!state.cart.length;
  $("checkoutBtn").style.opacity=state.cart.length?1:.5;
}
function openCart(){ $("cartOverlay").classList.remove("hidden"); $("cartDrawer").classList.remove("hidden"); }
function closeCart(){ $("cartOverlay").classList.add("hidden"); $("cartDrawer").classList.add("hidden"); }

function openAccount(){
  closeCart(); updateAccountUI(); openModal("accountModal");
}
function updateAccountUI(){
  const logged=!!state.currentCustomer;
  $("accountLoggedOut").classList.toggle("hidden",logged);
  $("accountLoggedIn").classList.toggle("hidden",!logged);
  if(logged){
    const c=state.currentCustomer;
    $("accountTitle").textContent="Your account";
    $("accountSub").textContent="Your customer profile is available for this device.";
    $("profileName").textContent=c.name||"Customer";
    $("profileEmail").textContent=c.email||"";
    $("profileAvatar").textContent=(c.name||"S").charAt(0).toUpperCase();
  }else{
    $("accountTitle").textContent="Welcome back";
    $("accountSub").textContent="Sign in to keep your account details available on this device.";
  }
}

async function initFirebase(){
  const c=CONFIG.FIREBASE_CONFIG;
  const ready=c && c.apiKey && c.authDomain && c.projectId && c.appId;
  if(!ready) return false;
  try{
    const appMod=await import("https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js");
    const authMod=await import("https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js");
    state.firebase=appMod.initializeApp(c);
    state.firebaseAuth=authMod.getAuth(state.firebase);
    $("googleSignInBtn").dataset.firebaseReady="true";
    window.__firebaseAuthMod=authMod;
    authMod.onAuthStateChanged(state.firebaseAuth,user=>{
      if(user){
        state.currentCustomer={name:user.displayName||"Customer",email:user.email||"",photoURL:user.photoURL||"",provider:"google"};
        saveJSON("syvra_customer",state.currentCustomer);
        updateAccountUI();
      }
    });
    return true;
  }catch(err){
    console.error("Firebase init error:",err);
    return false;
  }
}

async function googleSignIn(){
  if(!state.firebaseAuth){
    showToast("Google sign-in needs Firebase setup in script.js.");
    openFirebaseHelp();
    return;
  }
  try{
    const {GoogleAuthProvider,signInWithPopup}=window.__firebaseAuthMod;
    const provider=new GoogleAuthProvider();
    await signInWithPopup(state.firebaseAuth,provider);
    showToast("Google sign-in successful.");
  }catch(err){
    console.error(err);
    showToast(err.code==="auth/popup-closed-by-user" ? "Sign-in window was closed." : "Google sign-in could not be completed.");
  }
}
function openFirebaseHelp(){
  alert("Google Sign-in setup:\\n\\n1. Create a Firebase project.\\n2. Add a Web App.\\n3. Authentication → Sign-in method → enable Google.\\n4. Authentication → Settings → Authorized domains → add your live domain.\\n5. Copy the Web App config into CONFIG.FIREBASE_CONFIG in script.js.\\n\\nDo not add server secrets or private API tokens to this file.");
}

function emailLocalSignIn(e){
  e.preventDefault();
  const email=$("emailInput").value.trim();
  const password=$("passwordInput").value;
  if(!email || password.length<6) return;
  // Safe starter behavior: profile is local until Firebase Email/Password is connected.
  state.currentCustomer={name:email.split("@")[0],email,provider:"local"};
  saveJSON("syvra_customer",state.currentCustomer);
  updateAccountUI(); showToast("Local profile created on this device.");
}

function startCheckout(){
  if(!state.cart.length){showToast("Your cart is empty.");return;}
  closeCart();
  if(state.currentCustomer){
    $("customerName").value=state.currentCustomer.name||"";
    $("customerEmail").value=state.currentCustomer.email||"";
  }
  $("checkoutError").textContent="";
  openModal("checkoutModal");
  updateReviewButton();
}

function buildCustomerFromForm(){
  return {
    name:$("customerName").value.trim(),
    phone:$("customerPhone").value.trim(),
    email:$("customerEmail").value.trim(),
    address:$("customerAddress").value.trim(),
    city:$("customerCity").value.trim(),
    postal:$("customerPostal").value.trim(),
    payment:$("paymentMethod").value
  };
}
function validPhone(phone){ return /^[0-9+()\\-\\s]{8,20}$/.test(phone); }

function reviewCheckout(e){
  e.preventDefault();
  if(!isCheckoutComplete()){ updateReviewButton(); $("checkoutError").textContent="Please complete all required details before reviewing your order."; return; }
  const c=buildCustomerFromForm();
  $("checkoutError").textContent="";
  if(!validPhone(c.phone)){ $("checkoutError").textContent="Please enter a valid phone number."; return; }
  state.checkoutCustomer=c;
  $("reviewCustomer").innerHTML=`<strong>${escapeHTML(c.name)}</strong><br>${escapeHTML(c.phone)} • ${escapeHTML(c.email)}<br>${escapeHTML(c.address)}, ${escapeHTML(c.city)} ${escapeHTML(c.postal)}`;
  $("reviewItems").innerHTML=state.cart.map(i=>{
    const p=getProduct(i.id);
    return `<div class="review-line"><span>${escapeHTML(p.name)} × ${i.qty}</span><strong>${money(p.price*i.qty)}</strong></div>`;
  }).join("") + `<div class="review-line"><span>Delivery</span><strong>${deliveryFee()===0?"FREE":money(deliveryFee())}</strong></div>`;
  $("reviewTotal").textContent=money(cartTotal());
  closeModal("checkoutModal"); openModal("reviewModal");
}

function createOrder(){
  if(!state.checkoutCustomer || !state.cart.length) return;
  const orderId="SYV-"+Date.now().toString(36).toUpperCase().slice(-7);
  const order={
    id:orderId,createdAt:new Date().toISOString(),
    customer:state.checkoutCustomer,
    items:state.cart.map(i=>({id:i.id,qty:i.qty,name:getProduct(i.id).name,price:getProduct(i.id).price})),
    subtotal:cartSubtotal(),delivery:deliveryFee(),total:cartTotal(),status:"Confirmed for WhatsApp handoff"
  };
  state.orders.unshift(order);
  saveJSON("syvra_orders",state.orders);
  state.pendingOrder=order;
  state.cart=[]; saveJSON("syvra_cart",state.cart); renderCart();
  closeModal("reviewModal");
  $("successOrderId").textContent=orderId;
  $("successSummary").innerHTML=`<strong>${escapeHTML(order.customer.name)}</strong><br>${order.items.map(i=>`${escapeHTML(i.name)} × ${i.qty}`).join("<br>")}<br><br><strong>Total: ${money(order.total)}</strong>`;
  const direct=buildWhatsAppLink(order);
  $("closeSuccessBtn").href=direct.invalid ? "#" : direct.url;
  $("closeSuccessBtn").style.pointerEvents=direct.invalid ? "none" : "auto";
  $("closeSuccessBtn").style.opacity=direct.invalid ? ".45" : "1";
  openModal("successModal");
}

function buildWhatsAppLink(order){
  const number = CONFIG.WHATSAPP_NUMBER.replace(/\D/g,"");
  const items = order.items.map(item =>
    `${item.name} x${item.qty} - PKR ${money(item.price * item.qty)}`
  ).join("\n");

  const text = `SYVRA ORDER
Order ID: ${order.id}
Customer: ${order.customer.name}
Phone: ${order.customer.phone}
Address: ${order.customer.address}, ${order.customer.city}
Payment: ${order.customer.payment}
Items:
${items}
Total: PKR ${money(order.total)}`;

  return {
    url: `https://wa.me/${number}?text=${encodeURIComponent(text)}`,
    invalid: !number || number.includes("XXXXXXXX")
  };
}

function openWhatsApp(){
  const order=state.pendingOrder;
  if(!order) return;
  const result=whatsappUrl(order);
  if(result.invalid){
    showToast("Add your WhatsApp number in CONFIG.WHATSAPP_NUMBER first.");
    alert("Open script.js and replace CONFIG.WHATSAPP_NUMBER with your own WhatsApp number in international format, e.g. 923001234567.");
    return;
  }
  window.open(result.url,"_blank","noopener,noreferrer");
}

function renderOrders(){
  const list=$("ordersList");
  if(!state.orders.length){list.innerHTML=`<div class="empty-products">No orders saved on this device yet.</div>`;return;}
  list.innerHTML=state.orders.map(o=>`<div class="order-item">
    <div class="order-item-top"><strong>${escapeHTML(o.id)}</strong><span>${money(o.total)}</span></div>
    <small>${new Date(o.createdAt).toLocaleString()}</small>
    <p>${o.items.map(i=>`${escapeHTML(i.name)} × ${i.qty}`).join(" • ")}<br>${escapeHTML(o.customer.city)} • ${escapeHTML(o.status)}</p>
  </div>`).join("");
}

document.addEventListener("click",e=>{
  const add=e.target.closest("[data-add]"); if(add){addToCart(add.dataset.add);return}
  const plus=e.target.closest("[data-plus]"); if(plus){updateQty(plus.dataset.plus,1);return}
  const minus=e.target.closest("[data-minus]"); if(minus){updateQty(minus.dataset.minus,-1);return}
  const remove=e.target.closest("[data-remove]"); if(remove){state.cart=state.cart.filter(i=>i.id!==remove.dataset.remove);saveJSON("syvra_cart",state.cart);renderCart();return}
  const close=e.target.closest("[data-close]"); if(close){closeModal(close.dataset.close);return}
});

$("cartBtn").addEventListener("click",openCart);
$("closeCartBtn").addEventListener("click",closeCart);
$("cartOverlay").addEventListener("click",closeCart);
$("checkoutBtn").addEventListener("click",startCheckout);
$("accountBtn").addEventListener("click",openAccount);
$("heroAccountBtn").addEventListener("click",openAccount);
$("footerAccountBtn").addEventListener("click",openAccount);
$("footerOrdersBtn").addEventListener("click",()=>{renderOrders();openModal("ordersModal")});
$("googleSignInBtn").addEventListener("click",googleSignIn);
$("emailAuthForm").addEventListener("submit",emailLocalSignIn);
$("signOutBtn").addEventListener("click",()=>{
  state.currentCustomer=null;localStorage.removeItem("syvra_customer");updateAccountUI();showToast("Signed out.");
});
$("checkoutForm").addEventListener("submit",reviewCheckout);
$("confirmOrderBtn").addEventListener("click",createOrder);

$("searchInput").addEventListener("input",renderProducts);
$("categoryFilter").addEventListener("change",renderProducts);
$("mobileMenuBtn").addEventListener("click",()=>$("mainNav").classList.toggle("open"));
document.querySelectorAll("#mainNav a").forEach(a=>a.addEventListener("click",()=>$("mainNav").classList.remove("open")));
document.querySelectorAll(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)closeModal(m.id)}));

$("year").textContent=new Date().getFullYear();
renderProducts();renderCart();updateAccountUI();
setupCheckoutValidation();
$("closeSyvraAd").addEventListener("click",()=>{ $("syvraAd").remove(); localStorage.setItem("syvra_ad_closed","1"); });
if(localStorage.getItem("syvra_ad_closed")==="1") $("syvraAd").remove();
initFirebase();


