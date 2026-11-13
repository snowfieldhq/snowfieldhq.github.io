(()=>{"use strict";const u=document,w=u.documentElement,o=(t,n=u)=>n?n.querySelector(t):null,d=(t,n=u)=>n?[...n.querySelectorAll(t)]:[],S=matchMedia("(prefers-reduced-motion: reduce)");
const A=()=>w.dataset.theme==="light"?"light":"dark";
const box=o(".crystal-view"),frame=o(".frame",box),pic=o(".pic",box),btn=o("#play"),st=o("[role=status]",box);
let f=null,pending=null,playing=false,settle=false,raf=0,t0=0,yaw=0,pitch=0,last=0;
const say=t=>{if(st)st.textContent=t};
const load=src=>new Promise((a,b)=>{const e=u.createElement("script");e.src=src;e.onload=a;e.onerror=b;u.head.append(e)});
const place=()=>{if(!f||!frame)return;const r=f.sheet.focus,N=Snowfield3D,p=N.R.clone().multiplyScalar(r.x-f.sheet.width/2).addScaledVector(N.U,f.sheet.height/2-r.y).project(f.camera);frame.style.setProperty("--fx",p.x*50+50+"%");frame.style.setProperty("--fy",50-p.y*50+"%")};
const start=()=>pending||(pending=load("kit/engine/crystal-assets.js").then(()=>load("kit/engine/field3d.classic.js")).then(()=>Snowfield3D.makeField(o("canvas",pic),{theme:A(),composition:"crystal",span:+getComputedStyle(frame).getPropertyValue("--S"),onResize:()=>f&&place()})).then(x=>{f=x;place();pic.classList.add("ready");pic.parentNode.classList.add("ready");return f}).catch(()=>{pending=null;say("Static view active.")}));
const finish=()=>{raf=0;yaw=pitch=0;if(f){f.rest();place()}if(frame)frame.classList.remove("turned");settle=false};
const tick=a=>{raf=0;if(!f)return;const dt=Math.min(.05,(a-last)/1e3||.016);last=a;
 if(playing){const t=(a-t0)/1e3,r=Math.min(1,t/2.5);yaw=.4*r*Math.sin(t*2*Math.PI/16);pitch=.1*r*Math.sin(t*2*Math.PI/23)}
 else if(settle){const k=Math.exp(-4*dt);yaw*=k;pitch*=k;if(Math.abs(yaw)<5e-4&&Math.abs(pitch)<5e-4){finish();return}}
 f.view(yaw,pitch);place();if(frame)frame.classList.toggle("turned",Math.abs(yaw)+Math.abs(pitch)>.02);raf=requestAnimationFrame(tick)};
const stop=m=>{if(!playing)return;playing=false;if(btn){btn.textContent="Play";btn.setAttribute("aria-pressed","false")}say(m||"");if(S.matches){finish()}else{settle=true;if(!raf){last=performance.now();raf=requestAnimationFrame(tick)}}};
if(btn&&box)btn.onclick=()=>{if(playing){stop();return}if(S.matches)return;say("Loading.");start().then(x=>{if(!x)return;playing=true;settle=false;btn.textContent="Stop";btn.setAttribute("aria-pressed","true");say("");t0=last=performance.now();if(!raf)raf=requestAnimationFrame(tick)})};
S.addEventListener("change",()=>{if(S.matches)stop("")});
u.addEventListener("visibilitychange",()=>{if(u.hidden)stop("")});
function b(t,n){if(w.dataset.theme!==t&&(w.dataset.theme=t),n)try{localStorage.setItem("sf-theme",t)}catch{}d(".theme button").forEach(s=>s.setAttribute("aria-pressed",s.dataset.t===t)),f&&f.setTheme(t)}d(".theme button").forEach(t=>{t.onclick=()=>b(t.dataset.t,1)}),b(A());
window.SNOW={setTheme:b}})();
