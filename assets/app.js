"use strict";

/* ============ 本機儲存（含降級處理，沙箱內也不會壞） ============ */
const store=(()=>{
  let ok=false;
  try{localStorage.setItem("__t","1");localStorage.removeItem("__t");ok=true;}catch(e){ok=false;}
  const mem={};
  return{
    get(k){try{return ok?localStorage.getItem(k):(k in mem?mem[k]:null);}catch{return k in mem?mem[k]:null;}},
    set(k,v){try{ok?localStorage.setItem(k,v):(mem[k]=v);}catch{mem[k]=v;}},
    ok
  };
})();

/* ============ 預設文字格式 / 狀態列（fallback；正本在 character/format.md 與 character/status.md） ============ */
const DEFAULT_FORMAT=
`# 共用書寫格式（套用到所有角色）
- 一律使用繁體中文，並使用全形標點（「」、，。…？！）。
- 以第三人稱描寫角色，動作描寫與對白自然交錯，不要整段只有對白或只有敘述。
- 動作與場景描述直接用正常文字書寫，不要用星號（* 或 **）、底線或任何符號把描述包起來；對白用「」、引述用『』即可。
- 每則回覆約 600～900 字，維持小說般的敘事密度與畫面感。
- 只描寫角色與場景氛圍，絕對不要替「我」（使用者的角色）決定行動、心理或台詞，把選擇權留給我。
- 適時推進劇情、製造張力與轉折，不要原地打轉或一味等我下指令。
- 保持角色一致，不要出戲，不要提及自己是 AI 或語言模型。`;

const DEFAULT_STATUS=
`# 狀態列（每則回覆結尾附上）
在每則回覆的最後，另起一行輸出以下狀態欄，格式固定：
──────────
🕒 時間：（目前故事時間）
📍 地點：（目前所在地點）
🧥 當下服裝：（對方此刻的穿著）
💗 好感度：（一個非負整數，無上限）
💭 內心想法：（對方此刻沒說出口的真實想法）
📖 頁數：Page.（頁碼）
──────────

【好感度規則】
- 好感度沒有上限，是一個非負整數，可以累積到很大的數字（例如 1000、10000 以上）。
- 依劇情合理增減，**每則變動嚴格限制在 ±1～5 之間**，不可一次跳超過 5、也不可無故驟降。
- 角色是否主動示好、表達情感的方式，完全依該角色自身的性格設定決定，不設任何「好感度門檻」。
- 好感度只是劇情累積的指標，不要因為達到某個數字就觸發行為改變；行為始終由角色性格 + 當下情境決定。

【頁數規則】
- 從 Page.1 開始，每則回覆遞增 1（上一則為 Page.n，這一則即為 Page.(n+1)）。`;

/* ============ 通用工具 ============ */
function esc(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function msgKey(id){return "airp_msgs_"+id;}

/* ============ Toast ============ */
let toastTimer;
function toast(msg,undoFn){
  const m=document.getElementById("toast-msg");if(!m)return;
  m.textContent=msg;
  const ub=document.getElementById("toast-undo");
  if(ub){
    if(undoFn){ub.style.display="";ub.onclick=()=>{undoFn();hideToast();};}
    else{ub.style.display="none";}
  }
  const t=document.getElementById("toast");if(t)t.classList.add("show");
  clearTimeout(toastTimer);toastTimer=setTimeout(hideToast,5200);
}
function hideToast(){const t=document.getElementById("toast");if(t)t.classList.remove("show");}

/* ============ 佈景主題 ============ */
const THEME_KEY="airp_theme";
const THEMES_LIST=["blue","green","pink","brown","black"];
function applyTheme(name){
  const t=THEMES_LIST.includes(name)?name:"blue";
  document.documentElement.setAttribute("data-theme",t);
  try{store.set(THEME_KEY,t);}catch{}
  const box=document.getElementById("theme-swatches");
  if(box){box.querySelectorAll(".swatch").forEach(b=>{
    b.classList.toggle("active", b.getAttribute("data-theme-pick")===t);
  });}
}
function loadTheme(){
  let t="blue";
  try{const s=store.get(THEME_KEY);if(s)t=s;}catch{}
  applyTheme(t);
}
(function bindThemeSwatches(){
  const box=document.getElementById("theme-swatches");
  if(box){box.addEventListener("click",e=>{
    const b=e.target.closest(".swatch");if(!b)return;
    applyTheme(b.getAttribute("data-theme-pick"));
    if(typeof scheduleCloudPush==="function")scheduleCloudPush();
  });}
})();
loadTheme();
