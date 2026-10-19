// ==UserScript==
// @name         学习通自动刷课助手（整合修复版 · AI 答题）
// @namespace    cx-autocourse
// @version      1.3.45
// @description  学习通/超星：自动播放(静音2x)｜媒体停滞自动重播｜已完成任务点跳过｜后台常驻防节流｜自动跳任务点与下一章(侧栏/键盘兜底)｜章节测验/作业/考试自动答题提交｜题库三通道(本地/外部API/AI大模型，默认免费GLM-4-Flash)｜多选题字母串拆分｜选项四层匹配｜点选后回读校验｜PPT/电子书阅读｜字库加密题干解密｜结构导出排查
// @author       cx-tools
// @license      MIT
// @match        *://*.chaoxing.com/*
// @match        *://*.edu.cn/*
// @match        *://*.nbdlib.cn/*
// @match        *://*.hnsyu.net/*
// @match        *://*.gdkmooc.com/*
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      api.tikuhai.com
// @connect      *
// @noframes
// ==/UserScript==

/* ============================================================================
 * ⚠️ 使用前必读 · 免责与使用限制（完整版见仓库 README.md）
 * ----------------------------------------------------------------------------
 * 本脚本是一份「浏览器前端技术研究样本」，仅用于研究：
 *   · SPA 中 <video>/<audio> 等媒体元素的接管与速率控制
 *   · @font-face 反爬字体的字形比对还原思路
 *   · iframe 跨文档结构探测与事件节流绕过
 *   · 油猴（Tampermonkey）脚本的元数据、GM_* API 与本地存储机制
 *
 * 【项目性质】
 *   不是教学工具，不是学习辅助产品，不提供教学 / 辅导 / 答疑 / 代刷 /
 *   代考 / 代写服务；未获任何教育机构或平台授权、背书或合作。
 *   作者明确反对一切违规使用；列出能力仅为让你知道「不该用它做什么」。
 *
 * 【绝对禁止】以下用途一律禁止：
 *   1. 任何考试 / 测验 / 测评 / 考核 / 限时答题；
 *   2. 任何作业 / 课后习题 / 章节测验提交；
 *   3. 代刷 / 代课 / 代考 / 代写（代替他人完成学业任务）；
 *   4. 任何商业化或牟利行为（出售、付费代刷、打包销售、引流变现）；
 *   5. 规避或破坏平台安全机制与风控（绕过人脸核验、伪造学习记录）；
 *   6. 向未成年人提供 / 传播 / 演示；
 *   7. 任何违反法律法规、校规校纪或平台服务条款（ToS）的用途。
 *
 * 【风险告知】使用可能导致：账号被检测 / 警告 / 限流 / 封禁、学习记录
 *   被清空、成绩判定无效、通报学校、学分与毕业资格受影响、浏览器数据
 *   异常。若你自行配置第三方 AI 服务或题库接口，题干文本会发送至你配置
 *   的第三方，其数据处理与本项目无关；API 费用由你自行承担。
 *   学习通对题干的 @font-face 保护可能被认定为「计算机信息系统安全保护
 *   措施」，绕过行为在特定情形下可能触及《刑法》第二百八十六条之一，以及
 *   两高《关于办理危害计算机信息系统安全刑事案件应用法律若干问题的解释》
 *   第六条的认定要素。以上风险全部由使用者自行承担。
 *
 * 【无担保】按「现状」(AS IS) 与「现有可用」(AS AVAILABLE) 提供，不作
 *   任何明示或默示担保（适销性、特定用途适用性、不侵权、正确性、无病毒、
 *   兼容性、任何特定结果均不担保）。作者不承诺修复缺陷、不承诺更新、
 *   不承诺响应问题、不承诺长期维护，可能随时删除本项目且无需通知。
 *
 * 【责任限制】在适用法律允许的最大范围内，作者不对任何直接 / 间接 /
 *   偶然 / 特殊 / 惩罚性损害负责，包括利润、数据、学业、名誉、机会
 *   损失；不对第三方行为、使用者违约或修改代码、不可抗力导致的后果
 *   负责。即使已被告知损害可能性，本限制条款依然完全有效。
 *
 * 【使用者承诺】你须已满 18 周岁、具有完全民事行为能力；仅出于个人
 *   技术学习与研究目的使用；不传播、不分发、不上传至任何平台或商店；
 *   不基于本项目提供收费服务；**研究目的达成后（建议 24 小时内）立即
 *   删除本文件、油猴中的脚本条目，以及 localStorage 中的配置与题库缓存**；
 *   并自愿承担由此产生的一切后果。
 *
 * 下载、安装、运行本脚本，即视为你已完整阅读、理解并同意上述全部条款。
 * 若不同意任何一条，请立即停止使用并删除本文件。
 *
 * 与学习通 / 超星 / 尔雅 / 智慧树 / 中国大学MOOC 及任何教育机构均无
 * 关联、合作、授权、赞助或背书关系。若权利主体认为本项目侵权，请通过
 * issue 联系作者，作者将在收到通知后立即下架并删除全部内容。
 * ============================================================================ */



(function () {
  'use strict';

  const W = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
  const LS_KEY = 'cx_fix_cfg_v1';
  const QB_KEY = 'cx_fix_qbank_v1';
  const TTF_KEY = 'cx_fix_ttf_cache_v1';
  const AI_CACHE_KEY = 'cx_fix_ai_cache_v1';
  const NODE_KEY = 'cx_fix_last_node';

  const fnv = (s) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36);
  };

  const CFG_DEFAULTS = {
    enabled: true,
    rate: 1.0,
    muted: true,
    autoAnswer: true,
    autoStart: true,
    autoSubmit: true,
    submitThreshold: 80,
    autoNext: true,
    quizOnly: false,
    skipFinished: true,
    matchThreshold: 65,
    plainStem: true,
    guessSingle: false,
    heuristicJudge: true,
    heuristicMulti: false,
    interval: 2,
    qbApi: '',
    jumpCooldown: 6,
    keepAlive: true,
    decrypt: true,
    aiRepair: true,
    skipIncomplete: true,
    autoConfirmSubmit: true,
    incompleteGrace: 90,
    blockAutoSubmit: true,
    blankReload: true,
    autoSkipStuck: true,
    stuckSkipMin: 8,
    aiPreset: 'glm-flash',
    aiApi: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    aiKey: '',
    aiModel: 'glm-4-flash',
    aiTimeout: 120,
    aiProvider: 'ai',
    aiRps: 3000,
    aiRetry: 2,
    aiBackoff: 4000,
    aiMaxTokens: 3000,
    aiExtraHeader: '',
    aiVerify: true,
    aiVerifyBelow: 70,
    aiVotes: 3,
    aiCross: true,
    aiCrossModel: 'deepseek-reasoner',
    harvest: true,
    faceStop: true,
  };
  const CFG = Object.assign({}, CFG_DEFAULTS, (() => { try { return JSON.parse(GM_getValue(LS_KEY, '{}')) || {}; } catch (e) { return {}; } })());

  const saveCfg = () => { try { GM_setValue(LS_KEY, JSON.stringify(CFG)); } catch (e) {} };

  (() => {
    try {
      const v = Number(CFG.cfgVer) || 0;
      if (v >= 5) return;
      if (v < 2) { CFG.cfgVer = 2; if (Number(CFG.rate) === 2) CFG.rate = 1; }
      if (!CFG.aiTouched && CFG.aiPreset === 'glm-flash' && /^glm-4-flash/.test(String(CFG.aiModel || ''))) {
        CFG.aiPreset = 'glm-47-flash';
        CFG.aiModel = 'glm-4.7-flash';
      }
      if (Number(CFG.aiTimeout) === 25) CFG.aiTimeout = 40;
      const isZhipu = /bigmodel|glm/i.test(String(CFG.aiApi || '') + String(CFG.aiPreset || '') + String(CFG.aiModel || ''));
      const isOther = CFG.aiTouched && !isZhipu && !/deepseek/i.test(String(CFG.aiApi || ''));
      if (!isOther) {
        CFG.aiPreset = 'deepseek';
        CFG.aiApi = 'https://api.deepseek.com/v1/chat/completions';
        CFG.aiModel = 'deepseek-chat';
      }
      CFG.aiProvider = 'ai';
      if (Number(CFG.aiTimeout) < 90) CFG.aiTimeout = 90;
      CFG.cfgVer = 5;
      saveCfg();
    } catch (e) {}
  })();
  (() => {
    try {
      const v = Number(CFG.cfgVer) || 0;
      if (v >= 6) return;
      if (Number(CFG.aiTimeout) < 120) CFG.aiTimeout = 120;
      CFG.cfgVer = 6;
      saveCfg();
    } catch (e) {}
  })();
  (() => {
    try {
      const v = Number(CFG.cfgVer) || 0;
      if (v >= 7) return;
      const api = String(CFG.aiApi || '');
      const preset = String(CFG.aiPreset || '');
      const stillDeepseek = /deepseek/i.test(api) || preset === 'deepseek';
      const neverTouched = !CFG.aiTouched;
      if (stillDeepseek || neverTouched) {
        CFG.aiPreset = 'glm-flash';
        CFG.aiApi = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
        CFG.aiModel = 'glm-4-flash';
        if (Number(CFG.aiTimeout) > 90) CFG.aiTimeout = 90;
      }
      CFG.cfgVer = 7;
      saveCfg();
    } catch (e) {}
  })();
  function migrateCfg9() {
    try {
      const v = Number(CFG.cfgVer) || 0;
      if (v >= 9) return;
      CFG.skipIncomplete = true;
      CFG.cfgVer = 9;
      saveCfg();
    } catch (e) {}
  }
  migrateCfg9();
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const txt = (el) => ((el && (el.innerText || el.textContent)) || '').replace(/\s+/g, ' ').trim();
  const txtFast = (el) => {
    if (!el) return '';
    const s = el.textContent || '';
    return s.length > 40 ? s.slice(0, 40) : s.replace(/\s+/g, ' ').trim();
  };

  const AI_PRESETS = {
    'glm-47-flash': { name: '⭐ 智谱 GLM-4.7-Flash（免费·当前最强 Flash）', api: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', model: 'glm-4.7-flash', needKey: true, tip: 'bigmodel.cn 注册领 key 后免费用（200K 上下文），思政多选题正确率最高。⚠ 但它「会思考」：真机实测单答 100~110 秒、并发 6 题被 429 打回 5 题，抢时间就换下面的 GLM-4-Flash（同一把 key，实测 3 秒答完）' },
    'glm-z1-flash': { name: '智谱 GLM-Z1-Flash（免费·推理模型）', api: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', model: 'glm-z1-flash', needKey: true, tip: '同一个 key。会先想再答（真机实测思考过程**直接内联在 content 里、用 <think>…</think> 包着**，脚本已会自动剥掉），答得稳但要多给 token 预算；抢课/赶时间就用 GLM-4-Flash' },
    'glm-flash': { name: '智谱 GLM-4-Flash（免费·快）', api: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', model: 'glm-4-flash', needKey: true, tip: '真机实测：同一道马原单选题 **3.2 秒**答对、且不带思考过程 —— 免费额度下最实用的抢课选择；思政多选题偶尔漏选，答案要求高就配「AI 投票轮数 2」交叉复核' },
    'glm-air': { name: '智谱 GLM-4-Air（付费·更准）', api: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', model: 'glm-4-air', needKey: true, tip: '同一个密钥，改模型名即可；比 Flash 明显准，价格很低' },
    'or-qwen72b': { name: 'OpenRouter Qwen2.5-72B（:free）', api: 'https://openrouter.ai/api/v1/chat/completions', model: 'qwen/qwen-2.5-72b-instruct:free', needKey: true, tip: 'openrouter.ai 注册领免费 key；72B 级模型答思政题比 7B/Flash 稳，可能有速率限制' },
    'or-ds': { name: 'OpenRouter DeepSeek 系（:free）', api: 'https://openrouter.ai/api/v1/chat/completions', model: 'deepseek/deepseek-chat-v3-0324:free', needKey: true, tip: '免费模型名单会变，404 就在 openrouter.ai/models 里挑一个带 :free 的换上' },
    'deepseek': { name: 'DeepSeek 官方（付费但便宜·准）', api: 'https://api.deepseek.com/v1/chat/completions', model: 'deepseek-chat', needKey: true, tip: '按量计费，一个章节测验约几分钱；答题正确率明显高于免费小模型' },
    'siliconflow': { name: '硅基流动（免费模型）', api: 'https://api.siliconflow.cn/v1/chat/completions', model: 'Qwen/Qwen2.5-7B-Instruct', needKey: true, tip: 'siliconflow.cn 注册送额度；7B 偏弱，能换成 Qwen2.5-14B/32B 就换' },
    'openrouter': { name: 'OpenRouter（Llama 3.3 70B :free）', api: 'https://openrouter.ai/api/v1/chat/completions', model: 'meta-llama/llama-3.3-70b-instruct:free', needKey: true, tip: 'openrouter.ai 注册后可用 :free 结尾的免费模型' },
    'ollama': { name: '本地 Ollama（零成本/不出本机）', api: 'http://localhost:11434/v1/chat/completions', model: 'qwen2.5:7b', needKey: false, tip: '先 ollama pull qwen2.5:7b，并设 OLLAMA_ORIGINS=* 允许跨域' },
    'custom': { name: '自定义（自填地址与模型）', api: '', model: '', needKey: true, tip: '任何 OpenAI 兼容接口' },
  };
  const presetOf = () => AI_PRESETS[CFG.aiPreset] || AI_PRESETS.custom;
  function aiNotReadyNote() {
    const p = presetOf();
    if (p.needKey && !String(CFG.aiKey || '').trim()) {
      return `AI 还没填密钥（当前预设「${p.name}」需要密钥）→ 答题只能靠题库/兜底关键词猜，`
        + '正确率会被算成 0%，测验就只会「暂存」不交卷、平台一直挡住跳转';
    }
    if (!String(CFG.aiApi || '').trim()) {
      return `AI 接口地址是空的（当前预设「${p.name}」）→ 答题只能靠题库/兜底关键词猜`;
    }
    return '';
  }
  if (!CFG.aiApi && presetOf().api) CFG.aiApi = presetOf().api;

  const click = (el) => {
    if (!el) return false;
    try {
      const win = (el.ownerDocument && el.ownerDocument.defaultView) || window;
      const r = el.getBoundingClientRect();
      const opt = { bubbles: true, cancelable: true, composed: true, view: win, button: 0,
        clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
      for (const t of ['pointerdown', 'mousedown', 'pointerup', 'mouseup']) {
        try { el.dispatchEvent(new win.PointerEvent(t, opt)); } catch (e) { el.dispatchEvent(new win.MouseEvent(t, opt)); }
      }
      el.click();
      return true;
    } catch (e) { try { el.click(); return true; } catch (e2) { return false; } }
  };

  const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  W.__CXFIX__ = W.__CXFIX__ || {};

  const logs = [];
  let panel = null, bodyEl = null, currentTab = 'log';

  const CSS = `
  #cxfx-panel{position:fixed;top:10px;right:10px;width:390px;max-width:92vw;background:#0d1117;color:#c9d1d9;
    border:1px solid #30363d;border-radius:8px;font:12px/1.6 ui-monospace,Consolas,"Microsoft YaHei",monospace;
    z-index:2147483000;box-shadow:0 8px 28px rgba(0,0,0,.5);overflow:hidden}
  #cxfx-panel.min .cxfx-body,#cxfx-panel.min .cxfx-tabs{display:none}
  .cxfx-head{display:flex;align-items:center;justify-content:space-between;padding:6px 10px;background:#161b22;
    border-bottom:1px solid #30363d;cursor:move;font-size:12px}
  .cxfx-head b{font-weight:600;color:#58a6ff}
  .cxfx-min,.cxfx-close{padding:0 6px;cursor:pointer;color:#8b949e}
  .cxfx-min:hover,.cxfx-close:hover{color:#fff}
  .cxfx-tabs{display:flex;gap:2px;padding:4px 6px 0;background:#0d1117}
  .cxfx-tabs i{padding:3px 10px;cursor:pointer;color:#8b949e;font-style:normal;border-radius:5px 5px 0 0;font-size:11px}
  .cxfx-tabs i.on{background:#161b22;color:#58a6ff}
  .cxfx-body{max-height:320px;overflow:auto;padding:6px 8px}
  .cxfx-body::-webkit-scrollbar{width:6px}.cxfx-body::-webkit-scrollbar-thumb{background:#3a424d;border-radius:3px}
  .cxfx-log{white-space:pre-wrap;word-break:break-all;font-size:11px;padding:1px 0;border-bottom:1px solid #161b22}
  .t-ok{color:#3fb950}.t-warn{color:#d29922}.t-err{color:#f85149}.t-info{color:#79c0ff}
  .cxfx-cfg{display:grid;grid-template-columns:112px 1fr;gap:5px 8px;align-items:center;font-size:11px}
  .cxfx-cfg label{color:#8b949e}
  .cxfx-cfg input[type=text],.cxfx-cfg input[type=password],.cxfx-cfg input[type=number],.cxfx-cfg select{
    background:#0d1117;color:#c9d1d9;border:1px solid #30363d;border-radius:4px;padding:2px 5px;font-size:11px;width:100%;box-sizing:border-box}
  .cxfx-cfg input[type=checkbox]{justify-self:start}
  .cxfx-sec{grid-column:1/-1;margin:8px 0 2px;padding-top:6px;border-top:1px solid #2a3038;color:#58a6ff;font-size:11px}
  .cxfx-tip{grid-column:1/-1;color:#8b949e;font-size:10px;line-height:1.5;margin-bottom:2px}
  .cxfx-btn{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
  .cxfx-btn button{background:#238636;color:#fff;border:0;border-radius:5px;padding:4px 10px;cursor:pointer;font-size:11px}
  .cxfx-btn button.ghost{background:#21262d;border:1px solid #30363d;color:#c9d1d9}
  .cxfx-btn button:hover{filter:brightness(1.15)}
  .cxfx-qb textarea{width:100%;height:96px;background:#0d1117;color:#c9d1d9;border:1px solid #30363d;border-radius:5px;
    font-size:11px;padding:5px;box-sizing:border-box}
  .cxfx-qb{grid-column:1/-1}
  .cxfx-dbgrow{display:flex;gap:8px;padding:2px 0;border-bottom:1px dashed #2a3038;font-size:11px}
  .cxfx-dbgrow b{color:#79c0ff;flex:0 0 78px;font-weight:400}
  .cxfx-dbgrow span{color:#c9d1d9;word-break:break-all}
  .cxfx-cfg code{background:#161b22;padding:0 3px;border-radius:3px;color:#7ee787}
  /* ★ v1.3.39：人脸核验停手指令 —— 红色横幅，必须比日志更抢眼（用户可能没在看日志页） */
  .cxfx-face{display:none;padding:7px 9px;background:#4a1113;border:1px solid #f85149;border-radius:6px;
    color:#ffd7d5;font-size:11.5px;line-height:1.55;margin:0}
  .cxfx-face.on{display:block}
  .cxfx-face b{color:#ff9c97}
  .cxfx-face button{margin-top:5px;background:#21262d;color:#c9d1d9;border:1px solid #f85149;
    border-radius:5px;padding:2px 8px;cursor:pointer;font-size:11px}
  `;

  function addLog(msg, type = 'info') {
    const t = new Date();
    const p = (n) => String(n).padStart(2, '0');
    const line = `[${p(t.getHours())}:${p(t.getMinutes())}:${p(t.getSeconds())}] ${msg}`;
    logs.push({ line, type });
    if (logs.length > 400) logs.shift();
    try { console.log('[CXFIX]', line); } catch (e) {}
    if (bodyEl && currentTab === 'log') renderLogs();
  }

  function renderLogs() {
    currentTab = 'log';
    if (!bodyEl) return;
    bodyEl.dataset.tab = 'log';
    bodyEl.innerHTML = logs.slice(-160).map((l) =>
      `<div class="cxfx-log t-${l.type}">${escapeHtml(l.line)}</div>`).join('');
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  function buildPanel() {
    if (panel && panel.isConnected) return;
    if (!document.body) { setTimeout(buildPanel, 300); return; }
    panel = document.createElement('div');
    panel.id = 'cxfx-panel';
    panel.innerHTML = `
      <div class="cxfx-head"><b>学习通助手 v1.3.45（修复 + AI 答题）</b>
        <span><span class="cxfx-min">—</span><span class="cxfx-close">×</span></span></div>
      <div class="cxfx-face" id="cxfx-face"></div>
      <div class="cxfx-tabs"><i data-tab="log" class="on">运行日志</i><i data-tab="cfg">设置</i><i data-tab="qb">题库</i><i data-tab="dbg">诊断</i></div>
      <div class="cxfx-body" data-tab="log"></div>`;
    document.body.appendChild(panel);
    bodyEl = panel.querySelector('.cxfx-body');
    panel.querySelector('.cxfx-min').onclick = () => panel.classList.toggle('min');
    panel.querySelector('.cxfx-close').onclick = () => { panel.style.display = 'none'; };
    panel.querySelector('.cxfx-head').onmousedown = (e) => {
      if (e.target.tagName !== 'B') return;
      const ox = e.clientX - panel.offsetLeft, oy = e.clientY - panel.offsetTop;
      const mv = (ev) => { panel.style.left = (ev.clientX - ox) + 'px'; panel.style.top = (ev.clientY - oy) + 'px'; panel.style.right = 'auto'; };
      const up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); };
      document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
    };
    panel.querySelectorAll('.cxfx-tabs i').forEach((tab) => {
      tab.onclick = () => {
        panel.querySelectorAll('.cxfx-tabs i').forEach((x) => x.classList.toggle('on', x === tab));
        const t = tab.dataset.tab;
        if (t === 'cfg') renderCfg();
        else if (t === 'qb') renderQb();
        else if (t === 'dbg') renderDbg();
        else renderLogs();
      };
    });
    renderLogs();
  }

  function showFaceBanner(text) {
    try {
      if (!panel || !panel.isConnected) buildPanel();
      if (!panel) return;
      panel.style.display = '';
      panel.classList.remove('min');
      const bar = panel.querySelector('#cxfx-face');
      if (!bar) return;
      bar.innerHTML = `<b>⏸ 脚本已暂停：检测到人脸核验弹窗，正在等你做完人脸</b><br>`
        + `弹窗内容：${escapeHtml(String(text || '').slice(0, 110))}<br>`
        + `人脸核验<b>点不掉</b>（平台要求真人掏出手机做一次采集/核验），继续自动点下一节、自动交卷`
        + `只会给平台风控留下证据 → 脚本先停手，<b>等你做完</b>。<br>`
        + `请用<b>手机学习通 APP</b> 完成人脸采集/核验：<b>弹窗一消失，脚本会自己接着刷，不用管它</b>。`
        + `想立刻恢复也可以点下面这个按钮。`
        + `<br><button type="button" id="cxfx-face-resume">我已核验完，立刻恢复脚本</button>`;
      bar.classList.add('on');
      try { panel.querySelector('.cxfx-head').classList.remove('min'); } catch (e) {}
      const btn = bar.querySelector('#cxfx-face-resume');
      if (btn) btn.onclick = () => {
        CFG.enabled = true;
        try { if (typeof clearFaceStop === 'function') clearFaceStop(); } catch (e) {}
        saveCfg();
        try { if (CFG.keepAlive) startKeepAlive(); } catch (e) {}
        hideFaceBanner();
        addLog('已手动恢复运行（人脸核验当成做完了）。若弹窗还在，会立刻再次停手', 'ok');
        renderLogs();
      };
    } catch (e) {}
  }
  function hideFaceBanner() {
    try {
      const bar = panel && panel.querySelector('#cxfx-face');
      if (bar) { bar.classList.remove('on'); bar.innerHTML = ''; }
    } catch (e) {}
  }

  function renderCfg() {
    currentTab = 'cfg';
    bodyEl.dataset.tab = 'cfg';
    bodyEl.innerHTML = `
    <div class="cxfx-cfg">
      <label>启用脚本</label><input type="checkbox" data-k="enabled" ${CFG.enabled ? 'checked' : ''}>
      <label>倍速</label><input type="number" step="0.5" min="1" max="2" data-k="rate" value="${CFG.rate}">
      <label>静音播放</label><input type="checkbox" data-k="muted" ${CFG.muted ? 'checked' : ''}>
      <label>自动答题</label><input type="checkbox" data-k="autoAnswer" ${CFG.autoAnswer ? 'checked' : ''}>
      <label>自动开始答题</label><input type="checkbox" data-k="autoStart" ${CFG.autoStart ? 'checked' : ''}>
      <label>自动提交</label><input type="checkbox" data-k="autoSubmit" ${CFG.autoSubmit ? 'checked' : ''}>
      <label>正确率阈值 %</label><input type="number" min="0" max="100" data-k="submitThreshold" value="${CFG.submitThreshold}">
      <label>自动下一章</label><input type="checkbox" data-k="autoNext" ${CFG.autoNext ? 'checked' : ''}>
      <label>只答题</label><input type="checkbox" data-k="quizOnly" ${CFG.quizOnly ? 'checked' : ''}>
      <label>跳过已完成</label><input type="checkbox" data-k="skipFinished" ${CFG.skipFinished ? 'checked' : ''}>
      <label>相似度阈值</label><input type="number" min="0" max="100" data-k="matchThreshold" value="${CFG.matchThreshold}">
      <label>间隔(秒)</label><input type="number" min="1" max="30" data-k="interval" value="${CFG.interval}">
      <label>外部题库接口</label><input type="text" data-k="qbApi" value="${escapeHtml(CFG.qbApi)}" placeholder="留空=不用">
      <label>音频保活</label><input type="checkbox" data-k="keepAlive" ${CFG.keepAlive ? 'checked' : ''}>
      <label>字库解密</label><input type="checkbox" data-k="decrypt" ${CFG.decrypt ? 'checked' : ''}>
      <label>AI 还原乱码题</label><input type="checkbox" data-k="aiRepair" ${CFG.aiRepair === false ? '' : 'checked'}>
      <label>跳过未完成弹窗</label><input type="checkbox" data-k="skipIncomplete" ${CFG.skipIncomplete ? 'checked' : ''}>
      <label>自动确认交卷</label><input type="checkbox" data-k="autoConfirmSubmit" ${CFG.autoConfirmSubmit ? 'checked' : ''}>
      <label>卡住多久跳走(秒)</label><input type="number" min="0" max="600" data-k="incompleteGrace" value="${CFG.incompleteGrace}">
      <label>被挡住时替我交卷</label><input type="checkbox" data-k="blockAutoSubmit" ${CFG.blockAutoSubmit ? 'checked' : ''}>
      <label>白屏/黑屏自动刷新</label><input type="checkbox" data-k="blankReload" ${CFG.blankReload === false ? '' : 'checked'}>
      <label>推不动的任务点</label><input type="checkbox" data-k="autoSkipStuck" ${CFG.autoSkipStuck === false ? '' : 'checked'}>
      <label>推多久算完不成(分)</label><input type="number" min="0" max="120" data-k="stuckSkipMin" value="${CFG.stuckSkipMin}">
      <label>人脸核验自动停</label><input type="checkbox" data-k="faceStop" ${CFG.faceStop === false ? '' : 'checked'}>
      </div>
      <div class="cxfx-sec">AI 答题（默认预设即免费模型）</div>
      <label>服务商</label><select data-k="aiPreset" class="cxfx-preset">
        ${Object.entries(AI_PRESETS).map(([k, p]) =>
          `<option value="${k}" ${CFG.aiPreset === k ? 'selected' : ''}>${escapeHtml(p.name)}</option>`).join('')}
      </select>
      <label>AI 接口</label><input type="text" data-k="aiApi" value="${escapeHtml(CFG.aiApi)}" placeholder="https://.../chat/completions">
      <label>AI 密钥</label><input type="password" data-k="aiKey" value="${escapeHtml(CFG.aiKey)}" placeholder="本地 Ollama 可留空">
      <label>模型</label><input type="text" data-k="aiModel" value="${escapeHtml(CFG.aiModel)}" placeholder="glm-4.7-flash / qwen2.5:7b">
      <label>取答顺序</label><select data-k="aiProvider">
        <option value="auto" ${CFG.aiProvider === 'auto' ? 'selected' : ''}>本地 → 外部题库 → AI</option>
        <option value="local" ${CFG.aiProvider === 'local' ? 'selected' : ''}>只用题库，不调 AI</option>
        <option value="ai" ${CFG.aiProvider === 'ai' ? 'selected' : ''}>只走 AI（跳过外部题库）</option>
      </select>
      <label>AI 超时(秒)</label><input type="number" min="5" max="300" data-k="aiTimeout" value="${CFG.aiTimeout}">
      <label>AI 间隔(ms)</label><input type="number" min="0" max="30000" step="200" data-k="aiRps" value="${CFG.aiRps}">
      <label>AI 复核</label><input type="checkbox" data-k="aiVerify" ${CFG.aiVerify ? 'checked' : ''}>
      <label>复核门槛</label><input type="number" min="0" max="100" data-k="aiVerifyBelow" value="${CFG.aiVerifyBelow}">
      <label>推理模型交叉复核</label><input type="checkbox" data-k="aiCross" ${CFG.aiCross === false ? '' : 'checked'}>
      <label>AI 投票轮数</label><input type="number" min="1" max="4" data-k="aiVotes" value="${CFG.aiVotes}">
      <label>限流重试次数</label><input type="number" min="0" max="5" data-k="aiRetry" value="${CFG.aiRetry}">
      <label>重试退避(ms)</label><input type="number" min="500" max="60000" step="500" data-k="aiBackoff" value="${CFG.aiBackoff}">
      <label>最多生成 token</label><input type="number" min="500" max="16000" step="500" data-k="aiMaxTokens" value="${CFG.aiMaxTokens}">
      <label>答案入库</label><input type="checkbox" data-k="harvest" ${CFG.harvest ? 'checked' : ''}>
      </div>
      <div class="cxfx-tip">${escapeHtml(presetOf().tip)}</div>
      <div class="cxfx-btn">
        <button class="cxfx-save">保存并生效</button>
        <button class="ghost cxfx-aitest">测试 AI 连接</button>
        <button class="ghost cxfx-jump">立即跳下一节</button>
        <button class="ghost cxfx-status">状态自检</button>
        <button class="ghost cxfx-aiclear">清空 AI 缓存</button>
      </div>
    </div>`;

    const collect = () => bodyEl.querySelectorAll('[data-k]').forEach((el) => {
      CFG[el.dataset.k] = el.type === 'checkbox' ? el.checked : (el.type === 'number' ? Number(el.value) : el.value);
    });

    const presetSel = bodyEl.querySelector('.cxfx-preset');
    if (presetSel) presetSel.onchange = () => {
      const p = AI_PRESETS[presetSel.value];
      if (!p) return;
      CFG.aiTouched = true;
      if (p.api) bodyEl.querySelector('[data-k="aiApi"]').value = p.api;
      if (p.model) bodyEl.querySelector('[data-k="aiModel"]').value = p.model;
      collect(); saveCfg();
      addLog(`已切换到「${p.name}」：${p.tip}`, 'info');
      renderCfg();
    };
    const aiModelInp = bodyEl.querySelector('[data-k="aiModel"]');
    if (aiModelInp) aiModelInp.oninput = () => { CFG.aiTouched = true; };
    bodyEl.querySelector('.cxfx-save').onclick = () => {
      collect(); saveCfg();
      if (CFG.keepAlive) startKeepAlive(); else stopKeepAlive();
      addLog('设置已保存并生效', 'ok');
      addLog(`倍速 ${CFG.rate}x · 提交阈值 ${CFG.submitThreshold}% · 相似度 ${CFG.matchThreshold}%`, 'info');
      if (CFG.aiApi) addLog(`AI：${presetOf().name} · ${CFG.aiModel}（${CFG.aiProvider}）`, 'info');
      {
        const nn0 = aiNotReadyNote();
        if (CFG.autoAnswer && nn0) addLog(`⚠ ${nn0}。修好之后：设置页点「测试 AI 连接」应能回一句正常答案`, 'warn');
      }
    };
    bodyEl.querySelector('.cxfx-aitest').onclick = async () => {
      collect(); saveCfg();
      const p = presetOf();
      if (!CFG.aiApi || (p.needKey && !CFG.aiKey)) { addLog(`AI 未就绪：${p.name} ${p.tip}`, 'warn'); return; }
      addLog('测试 AI：中华人民共和国成立于哪一年？', 'info');
      const r = await askAI('中华人民共和国成立于哪一年？', ['1947年', '1949年', '1951年']);
      addLog(r ? `AI 连接正常，返回：${r.join(' / ')}` : 'AI 测试失败，看上面的错误行', r ? 'ok' : 'err');
      renderLogs();
    };
    bodyEl.querySelector('.cxfx-jump').onclick = () => { renderLogs(); Jump.forceNow('手动按钮'); };
    bodyEl.querySelector('.cxfx-status').onclick = () => {
      Object.entries(statusReport()).forEach(([k, v]) => addLog(`${k}: ${v}`, 'info'));
      renderLogs();
    };
    bodyEl.querySelector('.cxfx-aiclear').onclick = () => {
      Object.keys(aiCache).forEach((k) => delete aiCache[k]);
      aiCacheDirty = true; saveAiCache();
      addLog('AI 答案缓存已清空', 'warn');
      renderLogs();
    };
  }

  function renderQb() {
    currentTab = 'qb';
    bodyEl.dataset.tab = 'qb';
    const bank = getBank();
    const aiN = Object.keys(aiCache).length;
    bodyEl.innerHTML = `
    <div class="cxfx-cfg">
      <div class="cxfx-qb">
        <div style="color:#8b949e;margin-bottom:4px">本地题库 <b style="color:#3fb950">${Object.keys(bank).length}</b> 条
          · AI 缓存 <b style="color:#58a6ff">${aiN}</b> 条<br>
          格式：每行一条 <code>题干|答案1;答案2</code>（判断题填 正确/错误）</div>
        <textarea class="cxfx-qbtext" placeholder="中国的首都是哪里|北京&#10;地球是圆的|正确"></textarea>
      </div>
      <div class="cxfx-btn">
        <button class="cxfx-qbsave">追加导入</button>
        <button class="ghost cxfx-qbexport">导出全部</button>
        <button class="ghost cxfx-qbclear">清空题库</button>
      </div>
      <div style="color:#8b949e;margin:6px 0 2px;font-size:11px">AI 缓存可一键转成题库，之后离线也能命中，不再花额度</div>
      <div class="cxfx-btn">
        <button class="ghost cxfx-aiexport">导出 AI 缓存为题库</button>
        <button class="ghost cxfx-aiclear2">清空 AI 缓存</button>
      </div>
    </div>`;
    const copyOut = (out, what) => {
      try { console.log(out); } catch (e) {}
      try {
        navigator.clipboard.writeText(out)
          .then(() => addLog(`${what}已复制到剪贴板`, 'ok'))
          .catch(() => addLog(`剪贴板被拒：${what}已打印到控制台（F12）`, 'warn'));
      } catch (e) { addLog(`${what}已打印到控制台（F12）`, 'warn'); }
      renderLogs();
    };
    bodyEl.querySelector('.cxfx-qbsave').onclick = () => {
      const n = importBank(bodyEl.querySelector('.cxfx-qbtext').value);
      addLog(`已导入 ${n} 条题目（当前 ${Object.keys(getBank()).length} 条）`, 'ok');
      renderQb();
    };
    bodyEl.querySelector('.cxfx-qbexport').onclick = () => copyOut(
      Object.entries(getBank()).map(([q, a]) => `${q}|${Array.isArray(a) ? a.join(';') : a}`).join('\n'), '题库');
    bodyEl.querySelector('.cxfx-qbclear').onclick = () => {
      GM_setValue(QB_KEY, '{}');
      addLog('题库已清空', 'warn');
      renderQb();
    };
    bodyEl.querySelector('.cxfx-aiexport').onclick = () => copyOut(
      Object.entries(aiCache).map(([q, a]) => `${q}|${Array.isArray(a) ? a.join(';') : a}`).join('\n'), `AI 缓存(${aiN}条)`);
    bodyEl.querySelector('.cxfx-aiclear2').onclick = () => {
      Object.keys(aiCache).forEach((k) => delete aiCache[k]);
      aiCacheDirty = true; saveAiCache();
      addLog('AI 答案缓存已清空', 'warn');
      renderQb();
    };
  }

  function renderDbg() {
    currentTab = 'dbg';
    bodyEl.dataset.tab = 'dbg';
    const rows = Object.entries(statusReport()).map(([k, v]) =>
      `<div class="cxfx-dbgrow"><b>${escapeHtml(k)}</b><span>${escapeHtml(String(v))}</span></div>`).join('');
    bodyEl.innerHTML = `
    <div class="cxfx-cfg">
      <div style="color:#8b949e;margin-bottom:4px">页面结构诊断：用于定位「下一节」按钮 / 任务点标记 / 题目容器的实际 DOM 差异</div>
      ${rows}
      <div class="cxfx-btn">
        <button class="cxfx-dump">导出结构快照</button>
        <button class="ghost cxfx-dumpcopy">复制快照到剪贴板</button>
        <button class="ghost cxfx-chan">通道自检（题库/AI/题干）</button>
        <button class="ghost cxfx-dec">字库解密自检</button>
        <button class="ghost cxfx-test">★ 答题全流程测试（当前页题目）</button>
        <button class="ghost cxfx-live">只看不点：列出当前题目结构</button>
        <button class="ghost cxfx-probe">★ 点选探针（点一下看平台反应）</button>
        <button class="ghost cxfx-jumpdiag">★ 跳章诊断（下一节按钮在哪）</button>
        <button class="ghost cxfx-go">★ 交卷并跳下一节（卡住时点这个）</button>
        <button class="ghost cxfx-harvest">★ 抓取本页标准答案入库</button>
        <button class="ghost cxfx-selftest">核心逻辑自检（不联网）</button>
      </div>
    </div>`;
    bodyEl.querySelector('.cxfx-dump').onclick = () => { dumpStructure(); renderLogs(); };
    bodyEl.querySelector('.cxfx-chan').onclick = () => { renderLogs(); diagnoseChannels(); };
    bodyEl.querySelector('.cxfx-dec').onclick = () => { renderLogs(); diagnoseDecrypt(); };
    bodyEl.querySelector('.cxfx-test').onclick = () => { renderLogs(); dryRunCurrentPage(); };
    bodyEl.querySelector('.cxfx-live').onclick = () => { renderLogs(); reportLiveQuestions(); };
    bodyEl.querySelector('.cxfx-probe').onclick = () => { renderLogs(); probePickOptions(); };
    bodyEl.querySelector('.cxfx-jumpdiag').onclick = () => { renderLogs(); diagnoseJump(); };
    bodyEl.querySelector('.cxfx-go').onclick = () => { renderLogs(); resolveAndGo(); };
    bodyEl.querySelector('.cxfx-harvest').onclick = () => { renderLogs(); harvestNow(); };
    bodyEl.querySelector('.cxfx-selftest').onclick = () => { renderLogs(); selfTest(); };
    bodyEl.querySelector('.cxfx-dumpcopy').onclick = () => {
      const d = dumpStructure();
      try {
        navigator.clipboard.writeText(JSON.stringify(d, null, 2))
          .then(() => { addLog('快照已复制到剪贴板', 'ok'); renderLogs(); })
          .catch(() => { addLog('剪贴板被拒：请在控制台执行 copy(__CXFIX_DUMP__)', 'warn'); renderLogs(); });
      } catch (e) { addLog('复制失败：' + e.message, 'warn'); renderLogs(); }
    };
  }

  let ac = null, osc = null, gainNode = null, keepAliveOn = false, workerWake = null;

  const bgStat = { ticks: 0, gapMax: 0, last: Date.now(), hiddenTicks: 0, hiddenGapMax: 0, frozen: 0, lastGapLog: 0, vis: 'visible', visChanges: 0, spoof: false, lock: false };

  const realVis = (() => {
    const grab = (prop) => {
      try {
        const d = Object.getOwnPropertyDescriptor(Document.prototype, prop);
        if (d && typeof d.get === 'function') return () => d.get.call(document);
      } catch (e) {}
      return null;
    };
    return { hidden: grab('hidden'), state: grab('visibilityState') };
  })();
  const realHiddenNow = () => { try { return realVis.hidden ? !!realVis.hidden() : false; } catch (e) { return false; } };
  const realStateNow = () => {
    try { return realVis.state ? String(realVis.state()) : (realHiddenNow() ? 'hidden' : 'visible'); } catch (e) { return 'visible'; }
  };

  function buildAudio() {
    if (ac) return true;
    try {
      const AC = W.AudioContext || W.webkitAudioContext;
      if (!AC) return false;
      ac = new AC();
      osc = ac.createOscillator(); gainNode = ac.createGain();
      osc.type = 'sine'; osc.frequency.value = 20000;
      gainNode.gain.value = 0.002;
      osc.connect(gainNode).connect(ac.destination); osc.start();
      return true;
    } catch (e) { return false; }
  }

  const GESTURES = ['pointerdown', 'keydown', 'touchstart', 'click', 'wheel'];
  let gestureArmed = false;
  function armOnGesture() {
    if (gestureArmed || keepAliveOn) return;
    gestureArmed = true;
    const arm = () => { gestureArmed = false; if (CFG.keepAlive) startKeepAlive(true); };
    GESTURES.forEach((t) => { try { document.addEventListener(t, arm, { once: true, capture: true }); } catch (e) {} });
  }

  function startKeepAlive(quiet) {
    if (keepAliveOn || !buildAudio()) return;
    armOnGesture();
    ac.resume().then(() => {
      if (ac.state !== 'running') throw new Error('state=' + ac.state);
      keepAliveOn = true;
      addLog('后台保活已生效，切后台不再被节流', 'ok');
    }).catch(() => {
      armOnGesture();
      if (!quiet) addLog('保活待激活：请在页面上点一下', 'warn');
    });
  }
  function stopKeepAlive() {
    keepAliveOn = false;
    if (ac && ac.state === 'running') ac.suspend().catch(() => {});
    addLog('后台保活已关闭', 'warn');
  }

  let keepAliveRetryAt = 0;
  function keepAliveRetry() {
    if (!CFG.keepAlive || keepAliveOn) return;
    const now = Date.now();
    if (now - keepAliveRetryAt < 3000) return;
    keepAliveRetryAt = now;
    startKeepAlive(true);
  }

  function holdBgLock() {
    if (bgStat.lock) return true;
    try {
      const L = navigator.locks;
      if (!L || typeof L.request !== 'function') return false;
      bgStat.lock = true;
      L.request('cx-bg-hold', { mode: 'exclusive' }, () => new Promise(() => {})).catch(() => { bgStat.lock = false; });
      return true;
    } catch (e) { bgStat.lock = false; return false; }
  }

  const BG_EVENTS = ['visibilitychange', 'webkitvisibilitychange', 'blur'];
  let bgSpoofOn = false;
  function installVisibilitySpoof() {
    if (bgSpoofOn) return true;
    let ok = 0;
    try { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); ok++; } catch (e) {}
    try { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); ok++; } catch (e) {}
    try { Object.defineProperty(document, 'webkitHidden', { configurable: true, get: () => false }); ok++; } catch (e) {}
    try { document.hasFocus = () => true; ok++; } catch (e) {}
    try {
      const eat = (e) => {
        if (e.type === 'blur' && e.target !== window && e.target !== document) return;
        if (/visibilitychange/i.test(e.type)) {
          const h = realHiddenNow();
          bgStat.vis = h ? 'hidden' : 'visible';
          bgStat.visChanges++;
          if (h) addLog('已切到后台 → 挂机模式接管（视频补播 / 答题 / 跳章照跑）', 'info');
          else if (bgStat.hiddenTicks) addLog(`切回前台：后台期间主循环跑了 ${bgStat.hiddenTicks} 轮，最长间隔 ${(bgStat.hiddenGapMax / 1000).toFixed(1)} 秒`, 'info');
        }
        try { e.stopImmediatePropagation(); } catch (e2) {}
      };
      BG_EVENTS.forEach((t) => {
        window.addEventListener(t, eat, { capture: true });
        document.addEventListener(t, eat, { capture: true });
      });
      ok++;
    } catch (e) {}
    bgSpoofOn = ok > 0;
    bgStat.spoof = bgSpoofOn;
    return bgSpoofOn;
  }

  function bgWatchTick() {
    const now = Date.now();
    const gap = Math.max(0, now - bgStat.last);
    bgStat.last = now;
    bgStat.ticks++;
    if (gap > bgStat.gapMax) bgStat.gapMax = gap;
    if (realHiddenNow()) {
      bgStat.hiddenTicks++;
      if (gap > bgStat.hiddenGapMax) bgStat.hiddenGapMax = gap;
      if (gap > 60000) bgStat.frozen++;
      if (gap > 4000 && now - bgStat.lastGapLog > 300000) {
        bgStat.lastGapLog = now;
        addLog(`后台被浏览器降频：这一轮隔了 ${(gap / 1000).toFixed(1)} 秒才轮到（已用 音频保活 + Web Lock + Worker 心跳 兜底，视频会自己补播）`, 'warn');
      }
    }
    return gap;
  }

  function bgProbe(ms = 12000) {
    return new Promise((resolve) => {
      const t0 = Date.now(), gaps = [];
      let last = t0;
      const id = setInterval(() => {
        const now = Date.now();
        gaps.push(now - last);
        last = now;
        if (now - t0 >= ms) {
          clearInterval(id);
          const sorted = gaps.slice().sort((a, b) => a - b);
          resolve({
            时长秒: +((Date.now() - t0) / 1000).toFixed(1),
            调度次数: gaps.length,
            最小间隔ms: sorted[0] || 0,
            中位间隔ms: sorted[Math.floor(sorted.length / 2)] || 0,
            最大间隔ms: sorted[sorted.length - 1] || 0,
            真实可见性: realStateNow(),
            伪装后document_hidden: document.hidden,
            音频保活: keepAliveOn,
            WebLock: bgStat.lock,
            Worker心跳: !!workerWake,
            判定: (sorted[sorted.length - 1] || 0) > 3000
              ? '已被降频（这就是「挂后台不动了」的原因，看上面哪条通道没生效）'
              : '正常（主循环在后台仍按时跑）',
          });
        }
      }, 250);
    });
  }

  function initWorkerWake() {
    try {
      const src = 'let t=null;onmessage=e=>{var ms=Number(e&&e.data);if(!(ms>50))ms=1500;clearInterval(t);t=setInterval(()=>postMessage(1),ms);};';
      const w = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
      w.onmessage = () => document.dispatchEvent(new Event('cx-tick'));
      w.postMessage(1500);
      workerWake = w;
    } catch (e) {  }
  }

  const tickCost = { last: 0, max: 0, slow: 0 };
  let lastRunAt = 0;
  function loopTick(fn) {
    let n = 0;
    const run = () => {
      if (!CFG.enabled) {
        const nowMs = Date.now();
        if (nowMs - lastRunAt < 200) return;
        lastRunAt = nowMs;
        try { if (typeof Jump !== 'undefined' && Jump.faceGuard && Jump.faceGuard()) return; } catch (e) {}
        return;
      }
      const nowMs = Date.now();
      if (nowMs - lastRunAt < 200) return;
      lastRunAt = nowMs;
      bgWatchTick();
      keepAliveRetry();
      const t0 = Date.now();
      try { fn(++n); } catch (e) { try { console.log('[CXFIX] tick 异常', e); } catch (e2) {} }
      const cost = Date.now() - t0;
      tickCost.last = cost;
      if (cost > tickCost.max) tickCost.max = cost;
      if (cost > 3000) {
        tickCost.slow++;
        addLog(`⚠ 主循环这一轮花了 ${(cost / 1000).toFixed(1)} 秒（页面多半有点卡）`
          + (tickCost.slow >= 3 ? ' —— 已经第 3 次了，建议刷新一下页面' : ''), 'warn');
      }
    };
    document.addEventListener('cx-tick', run);
    setInterval(run, 1500);
  }

  let lastAutoConfirm = 0;
  function confirmSubmitWatch() {
    if (!CFG.autoConfirmSubmit) return;
    const now = Date.now();
    if (now - lastAutoConfirm < 5000) return;
    if (autoConfirmSubmit('自动兜底')) lastAutoConfirm = now;
  }

  const lastWake = new WeakMap();
  const patchedMedia = new WeakSet();

  const rateFellBack = new WeakSet();
  const rateWant = () => Math.min(2, Number(CFG.rate) || 1);
  const rateFor = (el) => ((el && rateFellBack.has(el)) ? 1 : rateWant());
  function fallbackRate(el, why) {
    if (!el) return false;
    if (rateFellBack.has(el)) return false;
    if (!(rateWant() > 1)) return false;
    rateFellBack.add(el);
    try { el.playbackRate = 1; } catch (e) {}
    addLog(`这个视频按 ${rateWant()}x 播不动（${why}）→ 自动调回 1x 继续播（设置里的倍速没改，换一节还是 ${rateWant()}x）`, 'warn');
    return true;
  }

  function wakeMedia(v) {
    const now = Date.now();
    if (now - (lastWake.get(v) || 0) < 8000) return;
    lastWake.set(v, now);
    try {
      if (CFG.muted) v.muted = true;
      if (v.playbackRate !== rateFor(v)) v.playbackRate = rateFor(v);
      const p = v.play();
      if (p && p.catch) p.catch(() => {});
    } catch (e) {}
  }

  function patchMedia(v) {
    if (!v || patchedMedia.has(v)) return;
    patchedMedia.add(v);
    if (CFG.muted && !v.dataset.cxManaged) v.muted = true;
    v.addEventListener('pause', () => {
      setTimeout(() => {
        if (!v.ended && !v.dataset.cxManaged && v.currentTime < (v.duration || Infinity) - 1.5) wakeMedia(v);
      }, 1200);
    });
    v.addEventListener('ratechange', () => { if (v.playbackRate > rateFor(v)) v.playbackRate = rateFor(v); });
    addLog('已接管媒体节点', 'info');
  }

  function scanMediaDeep(doc, seen = new Set()) {
    if (!doc || seen.has(doc)) return;
    seen.add(doc);
    try { doc.querySelectorAll('video,audio').forEach(patchMedia); } catch (e) {}
    try { doc.querySelectorAll('iframe').forEach((f) => { try { scanMediaDeep(f.contentDocument, seen); } catch (e) {} }); } catch (e) {}
  }

  const CHILD_SRC = `(function(){if(window.__CXFXC>=3)return;window.__CXFXC=3;
    var SRC=(function(){try{return (document.currentScript&&document.currentScript.textContent)||''}catch(e){return ''}})();
    var realHidden=(function(){try{var d=Object.getOwnPropertyDescriptor(Document.prototype,'hidden');return d&&d.get?function(){return !!d.get.call(document)}:null}catch(e){return null}})();
    function spoof(){try{Object.defineProperty(document,'hidden',{configurable:true,get:function(){return false}});}catch(e){}
      try{Object.defineProperty(document,'visibilityState',{configurable:true,get:function(){return 'visible'}});}catch(e){}
      try{Object.defineProperty(document,'webkitHidden',{configurable:true,get:function(){return false}});}catch(e){}
      try{document.hasFocus=function(){return true};}catch(e){}
      try{var eat=function(e){if(e.type==='blur'&&e.target!==window&&e.target!==document)return;try{e.stopImmediatePropagation();}catch(e2){}
        if(e.type!=='blur'&&realHidden&&realHidden()){var vs=document.querySelectorAll('video,audio');for(var i=0;i<vs.length;i++)wake(vs[i]);}};
        window.addEventListener('visibilitychange',eat,true);document.addEventListener('visibilitychange',eat,true);
        window.addEventListener('webkitvisibilitychange',eat,true);document.addEventListener('webkitvisibilitychange',eat,true);
        window.addEventListener('blur',eat,true);document.addEventListener('blur',eat,true);}catch(e){}}
    var last=new WeakMap();
    var fellBack=false;   // ★ v1.3.42：这一层媒体按高倍速播不动时，回退 1x（只影响这一个媒体节点）
    var wantRate=function(){return ${Math.min(2, CFG.rate)};};
    var nowRate=function(v){return fellBack?1:wantRate();};
    function wake(v){var n=Date.now();if(n-(last.get(v)||0)<8000)return;last.set(v,n);
      try{v.muted=true;v.playbackRate=nowRate(v);var p=v.play();if(p&&p.catch)p.catch(function(){});}catch(e){}}
    function patch(v){if(!v||v.__cxP)return;v.__cxP=1;v.muted=true;
      v.addEventListener('pause',function(){setTimeout(function(){if(!v.ended&&!v.dataset.cxManaged&&v.currentTime<(v.duration||1/0)-1.5)wake(v);},1200);});
      v.addEventListener('ratechange',function(){if(v.playbackRate>nowRate(v))v.playbackRate=nowRate(v);});}
    function scan(){var vs=document.querySelectorAll('video,audio');for(var i=0;i<vs.length;i++){var v=vs[i];patch(v);
      if(v.paused&&!v.ended&&!v.dataset.cxManaged&&v.currentTime<(v.duration||1/0)-1.5)wake(v);}}
    function injectDeep(){if(!SRC)return;var fs=document.querySelectorAll('iframe');for(var i=0;i<fs.length;i++){
      try{var d=fs[i].contentDocument;if(!d||d.readyState==='loading')continue;if(d.querySelector('script[data-cxfx]'))continue;
        var s=d.createElement('script');s.dataset.cxfx='1';s.textContent=SRC;(d.head||d.documentElement).appendChild(s);}catch(e){}}}
    spoof();injectDeep();setInterval(function(){scan();injectDeep();},3000);scan();})();`;

  function injectChildKeepAlive() {
    const walk = (d, depth) => {
      if (!d || depth > 4) return;
      let frames = [];
      try { frames = [...d.querySelectorAll('iframe')]; } catch (e) { return; }
      frames.forEach((f) => {
        try {
          const cd = f.contentDocument;
          if (!cd || cd.readyState === 'loading') return;
          if (!cd.querySelector('script[data-cxfx]')) {
            const s = cd.createElement('script'); s.dataset.cxfx = '1'; s.textContent = CHILD_SRC;
            (cd.head || cd.documentElement).appendChild(s);
          }
          walk(cd, depth + 1);
        } catch (e) {}
      });
    };
    walk(document, 0);
  }

  const getBank = () => { try { return JSON.parse(GM_getValue(QB_KEY, '{}')) || {}; } catch (e) { return {}; } };
  const normalize = (s) => String(s == null ? '' : s)
    .replace(/<[^>]+>/g, ' ')
    .replace(/[\u3010\u3011\u300a\u300b\u201c\u201d\u2018\u2019\u3002\uff0c\u3001\uff1b\uff1a\uff1f\uff01\uff08\uff09()\[\]{}<>]/g, '')
    .replace(/[（(]\s*\d+(\.\d+)?\s*分\s*[)）]/g, '')
    .replace(/[\s\u3000]/g, '')
    .replace(/[.,;:?!'"-]/g, '')
    .toLowerCase();

  function importBank(text) {
    const bank = getBank();
    let n = 0;
    String(text || '').split('\n').forEach((line) => {
      const i = line.indexOf('|');
      if (i < 1) return;
      const q = normalize(line.slice(0, i));
      const a = line.slice(i + 1).split(/[;；]/).map((s) => s.trim()).filter(Boolean);
      if (!q || !a.length) return;
      bank[q] = a; n++;
    });
    try { GM_setValue(QB_KEY, JSON.stringify(bank)); } catch (e) {}
    return n;
  }

  function levenshtein(a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    if (!m || !n) return Math.max(m, n);
    let prev = new Array(n + 1), cur = new Array(n + 1);
    for (let j = 0; j <= n; j++) prev[j] = j;
    for (let i = 1; i <= m; i++) {
      cur[0] = i;
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      const t = prev; prev = cur; cur = t;
    }
    return prev[n];
  }
  const similarity = (a, b) => (!a || !b) ? 0 : Math.round(100 * (1 - levenshtein(a, b) / Math.max(a.length, b.length)));

  function findMatchedOption(options, answer) {
    const target = normalize(String(answer));
    if (!target) return null;
    let best = null, bestScore = -1;
    for (const opt of options) {
      const score = similarity(normalize(opt.text), target);
      if (score > bestScore) { bestScore = score; best = opt; }
    }
    if (best && bestScore >= CFG.matchThreshold) return { el: best.el, cursor: best.cursor || best.el, score: bestScore, how: '相似度' };

    for (const opt of options) {
      const t = normalize(opt.text);
      if (!t || target.length < 2 || t.length < 2) continue;
      if (t.startsWith(target) || target.startsWith(t) || t.includes(target) || target.includes(t)) {
        return { el: opt.el, cursor: opt.cursor || opt.el, score: Math.max(bestScore, 60), how: '包含' };
      }
    }

    const letter = String(answer).trim().toUpperCase();
    if (/^[A-Z]$/.test(letter)) {
      const i = LETTERS.indexOf(letter);
      if (i >= 0 && i < options.length) {
        return { el: options[i].el, cursor: options[i].cursor || options[i].el, score: 55, how: '选项字母' };
      }
    }
    for (const opt of options) {
      const t = normalize(opt.text);
      if (t.length >= 4 && target.length >= 4 && similarity(t.slice(0, 8), target.slice(0, 8)) >= 50) {
        return { el: opt.el, cursor: opt.cursor || opt.el, score: 50, how: '开头相近' };
      }
    }
    return null;
  }

  const normalizeJudge = (s) => {
    const t = String(s == null ? '' : s).trim().toLowerCase();
    if (/^(a)?(正确|是|对|√|t|true|right|y|yes)$/.test(t)) return true;
    if (/^(b)?(错误|否|错|×|x|f|false|wrong|n|no)$/.test(t)) return false;
    return null;
  };

  function judgePickIndex(opts, wantTrue) {
    for (let i = 0; i < (opts || []).length; i++) {
      const t = String((opts[i] && opts[i].text) || '').trim();
      if (!t) continue;
      const bare = t.replace(/^[\s　]*([A-Za-z]|\d{1,2})\s*[.、．)）:：]?\s*/, '');
      const v = normalizeJudge(t);
      const v2 = v === null ? normalizeJudge(bare) : v;
      if (v2 !== null && v2 === wantTrue) return i;
    }
    return -1;
  }
  const judgeLetterValue = (s) => {
    const l = String(s == null ? '' : s).replace(/[\s,，、;；.。]+/g, '');
    const v = normalizeJudge(l);
    if (v !== null) return v;
    const up = l.toUpperCase();
    if (up === 'A' || up === 'T' || up === 'TRUE' || up === 'Y' || up === 'YES' || up === '√') return true;
    if (up === 'B' || up === 'F' || up === 'FALSE' || up === 'N' || up === 'NO' || up === '×' || up === 'X') return false;
    return null;
  };

  const judgeValueLoose = (s) => {
    const v = judgeLetterValue(s);
    if (v !== null) return v;
    const t = String(s == null ? '' : s);
    if (!t) return null;
    if (/(不正确|不对的|不对|错误|错的|错|否|×|✗|✘)/.test(t)) return false;
    if (/(正确|对的|√|✓|是|真)/.test(t)) return true;
    return null;
  };

  const normalizeOptionMatchText = (s) => String(s == null ? '' : s)
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s*[A-Da-d]\s*[.、．)）]\s*/, '')
    .replace(/[\u3010\u3011\u300a\u300b\u201c\u201d\u2018\u2019\u3002\uff0c\u3001\uff1b\uff1a\uff1f\uff01\uff08\uff09()\[\]{}<>]/g, '')
    .replace(/[\s\u3000]/g, '')
    .toLowerCase();

  function localQuery(question) {
    const bank = getBank();
    const q = normalize(question);
    if (!q) return null;
    if (bank[q]) return bank[q];
    let best = null, bestScore = 0;
    for (const [k, v] of Object.entries(bank)) {
      const s = similarity(k, q);
      if (s > bestScore) { bestScore = s; best = v; }
    }
    return bestScore >= 80 ? best : null;
  }

  function remoteQuery(question) {
    return new Promise((resolve) => {
      if (!CFG.qbApi) return resolve(null);
      try {
        GM_xmlhttpRequest({
          method: 'POST',
          url: CFG.qbApi,
          headers: { 'Content-Type': 'application/json' },
          data: JSON.stringify({ question, q: question }),
          timeout: 15000,
          onload: (res) => {
            try {
              const j = JSON.parse(res.responseText);
              const d = j.data || j;
              const raw = d.answer ?? d.answers ?? d.result ?? null;
              if (raw == null) return resolve(null);
              const list = [].concat(raw).flatMap((x) => String(x).split(/[;；,，\s]+/)).filter(Boolean);
              resolve(list.length ? list : null);
            } catch (e) { resolve(null); }
          },
          onerror: () => resolve(null),
          ontimeout: () => resolve(null),
        });
      } catch (e) { resolve(null); }
    });
  }

  let aiLastCall = 0;
  const aiCache = (() => { try { return JSON.parse(GM_getValue(AI_CACHE_KEY, '{}')) || {}; } catch (e) { return {}; } })();
  let aiCacheDirty = false;
  const saveAiCache = () => { if (!aiCacheDirty) return; try { GM_setValue(AI_CACHE_KEY, JSON.stringify(aiCache)); aiCacheDirty = false; } catch (e) {} };
  setInterval(saveAiCache, 20000);

  let aiCooldownUntil = 0;
  let aiGate = Promise.resolve();
  const aiQueue = (fn) => {
    const run = aiGate.then(fn, fn);
    aiGate = run.then(() => {}, () => {});
    return run;
  };
  const setAiCooldown = (ms, why) => {
    const wait = Math.max(0, Number(ms) || 0);
    const until = Date.now() + wait;
    if (until <= aiCooldownUntil) return;
    aiCooldownUntil = until;
    aiLastCall = Date.now();
    addLog(`AI 限流冷却 ${(wait / 1000).toFixed(1)} 秒（${why || 'HTTP 429'}）`, 'warn');
  };
  const aiCooldownWait = async (why) => {
    const left = aiCooldownUntil - Date.now();
    if (left <= 0) return;
    addLog(`AI 排队等冷却：还要 ${(left / 1000).toFixed(1)} 秒（${why || '限流'}）`, 'dim');
    await sleep(left + 150);
  };
  const aiBusyStatus = (st) => st === 429 || st === 408 || (st >= 500 && st <= 599);
  const aiBusyText = (t) => /(429|rate.?limit|too many requests|concurrency|限流|请求过于频繁|并发|TPM|RPM|QPS|访问量过大|稍后再试|繁忙|busy|overload)/i.test(String(t || ''));
  const aiBackoffMs = (attempt) => Math.round(Math.max(500, Number(CFG.aiBackoff) || 4000)
    * Math.pow(2, Math.max(0, attempt)) * (0.8 + Math.random() * 0.4));
  const aiRetryMax = () => Math.max(0, Math.min(5, Number(CFG.aiRetry) || 0));

  const AI_JSON_RULES = '【输出纪律】你只作为「JSON 输出机器」工作：回答时**只输出一行 JSON**，'
    + '禁止出现 JSON 以外的任何内容 —— 不要 Markdown 代码块（``` 不要写）、不要解释、不要前后缀文字、不要换行。\n'
    + '字段固定为 {"answer":...,"confidence":0-100,"why":"20 字以内理由"}；'
    + 'confidence 必须如实反映把握：不确定就填 40 以下，题干看起来是乱码/缺字就填 0。\n';
  const AI_METHOD = '【作答方法（在心里做，不要输出过程）】\n'
    + '1) 先把题干还原成教材里的原句说法，再逐项对照教材表述；这类网课题的判分标准是**教材原文**，不是日常语感。\n'
    + '2) 概念归属题（"X 是/属于 Y"）先想教材给 X 下的定义，再挑术语最准确的那一项；干扰项往往是听起来顺口的近义词。\n'
    + '3) 判断题按"这句话在教材里成立吗"来判；出现"必须/全部/唯一/只要…就"这类绝对化措辞只是**提示**，不是判据 ——'
    + '教材原话里的绝对化表述仍然算「正确」。\n'
    + '4) why 只写依据（≤20 字），不要复述题干。\n'
    + '【教材容易答错的两类（示范）】'
    + '① 概念归属：意识是**人脑的机能**（不是"分泌物""反映物"，"客观反映"说的是意识的内容来源）；'
    + '② 表述与教材一致即正确：**"静止是运动的一种形式"= 正确**（静止是运动的特殊状态，教材原话如此）。\n';
  const AI_TYPE_RULES = {
    single: '【题型】单选题\n'
      + '【唯一允许的输出】{"answer":"B","confidence":85,"why":"要点"}\n'
      + '【强制规则】1) answer 只能有 1 个字母且必须大写；2) 先逐项排除明显错误项再定；'
      + '3) 概念归属题挑**术语最准确**的那一项（教材原话），别挑听起来最顺的；4) 拿不准就 confidence<40。\n'
      + '【错误示例】```json{"answer":"B"}```（含代码块）／答案是B，{"answer":"B"}（含解释）／{"answer":"b"}（小写）'
      + '／{"answer":"B,C"}（单选给了两个）\n',
    multi: '【题型】多选题\n'
      + '【唯一允许的输出】{"answer":"ACD","confidence":85,"why":"要点"}\n'
      + '【强制规则】1) 必须**逐项判断每一个选项**，把成立的选项字母全部连写、按字母升序；\n'
      + '2) 至少 2 个字母。漏选是这类题最大的失分点 —— 只要该选项在教材/官方表述里成立就必须选上，'
      + '但明显错误项不要为了凑数多选；3) 每个选项在心里过一遍「成立 / 不成立」再汇总。\n'
      + '【错误示例】{"answer":"A"}（只选了一个）／{"answer":["C","A"]}（未排序）／答案是ACD（含解释）'
      + '／{"answer":"ABCD"}（不确定就把全部都选上）\n',
    judge: '【题型】判断题\n'
      + '【唯一允许的输出】{"answer":"正确","confidence":85,"why":"要点"} 或 {"answer":"错误","confidence":85,...}\n'
      + '【强制规则】1) answer 只能是「正确」或「错误」两个词，**不要填字母**、不要填「对/错/√/×/T/F」；\n'
      + '2) 判据只有一条：**这句话在教材/官方表述里成立吗** —— 成立就「正确」，不成立才「错误」；\n'
      + '3) 「必须 / 全部 / 唯一 / 只要…就 / 彻底」这类绝对化措辞只是**提示**，绝不是判据：'
      + '教材原话里的绝对化表述照样算「正确」。**不要**因为句子听起来绝对、或听起来"太像正确的大道理"就改判。\n'
      + '【错误示例】{"answer":"A"}（填了字母）／{"answer":"对"}（表述不规范）／{"answer":true}（布尔值）\n',
    fill: '【题型】填空题\n'
      + '【唯一允许的输出】{"answer":"答案1;答案2","confidence":85,"why":"要点"}\n'
      + '【强制规则】1) 有几个空就给几个答案，用 ; 分隔，顺序与空格一致；2) 用教材原话或专业术语，每空 15 字内；'
      + '3) 不要写「第一个空是…」这类解释。\n'
      + '【错误示例】{"answer":["光合作用","叶绿体"]}（数组，改成 "光合作用;叶绿体"）／{"answer":"第一个空填光合作用"}（含解释）\n',
    essay: '【题型】简答/论述题\n'
      + '【唯一允许的输出】{"answer":"结论式答案正文","confidence":85,"why":"要点"}\n'
      + '【强制规则】1) 直接给结论，30 字内，优先用题干里的专业术语；2) 不分段、不加标题、不用引号、不打句号结尾。\n',
  };
  function aiSysPrompt(typeHint) {
    const body = AI_TYPE_RULES[typeHint]
      || '【题型】未知（按选项自行判断：选择题填字母、只有「对/错」两选项时填「正确」或「错误」、填空/简答填正文）\n';
    return '你是中国高校网课（超星学习通等）的答题助手，擅长思政课（习近平新时代中国特色社会主义思想、'
      + '思想道德与法治、中国近现代史纲要、马克思主义基本原理、形势与政策）等公共课，熟悉教材原文与官方表述。\n'
      + body + AI_METHOD + AI_JSON_RULES;
  }
  function aiUserPrompt(question, opts, typeHint) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const list = (opts || []).map((t, i) => letters[i] + '. ' + String(t).replace(/\s+/g, ' ').trim()).join('\n');
    const head = (typeHint ? `【题型标记】${typeHint}\n` : '');
    return head + (list
      ? '【题目】' + question + '\n【选项】\n' + list + '\n（若一个选项都不成立，answer 填空字符串）'
      : '【题目】' + question + '\n（无选项，请直接给出答案正文）')
      + '\n只输出一行 JSON。';
  }
  function firstJsonObject(s) {
    const t = String(s || '');
    for (let i = 0; i < t.length; i++) {
      if (t[i] !== '{') continue;
      let depth = 0, quote = '';
      for (let j = i; j < t.length && j < i + 4000; j++) {
        const ch = t[j];
        if (quote) {
          if (ch === '\\') { j++; continue; }
          if (ch === quote) quote = '';
          continue;
        }
        if (ch === '"' || ch === "'") { quote = ch; continue; }
        if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) {
            const chunk = t.slice(i, j + 1);
            try { return JSON.parse(chunk); } catch (e) {}
            try { return JSON.parse(chunk.replace(/'/g, '"')); } catch (e) {}
            break;
          }
        }
      }
    }
    return null;
  }
  const stripThink = (s) => String(s == null ? '' : s)
    .replace(/<\s*think\s*>[\s\S]*?<\s*\/\s*think\s*>/gi, '\n')
    .replace(/<\s*(?:thinking|reasoning|analysis)\s*>[\s\S]*?<\s*\/\s*(?:thinking|reasoning|analysis)\s*>/gi, '\n')
    .replace(/<\s*(?:think|thinking|reasoning|analysis)\s*>[\s\S]*$/i, '\n')
    .replace(/<\s*\/\s*(?:think|thinking|reasoning|analysis)\s*>/gi, '\n');
  function parseAiAnswer(content) {
    let t = stripThink(content).trim();
    if (!t) return null;
    const fence = t.match(/```(?:json|JSON)?\s*([\s\S]*?)```/);
    if (fence) t = fence[1].trim();
    t = t.replace(/^```(?:json|JSON)?/i, '').replace(/```$/, '').trim();

    let obj = firstJsonObject(t);
    if (!obj) {
      const line = t.split('\n').map((x) => x.trim()).filter(Boolean).pop() || t;
      const m = line.match(/(?:答案|answer)\s*[:：]?\s*([A-Za-z]{1,8}|正确|错误|对|错)/i);
      const raw = m ? m[1] : line.replace(/^答案[:：]?\s*/, '').replace(/^[^A-Za-z\u4e00-\u9fa5]+/, '');
      obj = { answer: raw, confidence: 50 };
    }
    if (!obj || typeof obj !== 'object') return null;

    let a = obj.answer ?? obj.a ?? obj.result ?? obj.answers ?? obj.value ?? '';
    if (Array.isArray(a)) {
      const parts = a.map((x) => String(x == null ? '' : x).trim()).filter(Boolean);
      const allLetter = parts.length > 0 && parts.every((x) => /^[A-Za-z]$/.test(x));
      a = allLetter ? parts.join('') : parts.join(';');
    }
    a = String(a == null ? '' : a).trim();
    if (/^(true|false)$/i.test(a)) a = /^true$/i.test(a) ? '正确' : '错误';
    let c = obj.confidence ?? obj.conf ?? obj.score ?? 60;
    if (typeof c === 'string') c = parseFloat(c.replace(/[^\d.]/g, ''));
    if (!isFinite(Number(c))) c = 60;
    return {
      ans: a,
      conf: Math.max(0, Math.min(100, Number(c))),
      why: String(obj.why || obj.reason || obj.explain || '').slice(0, 60),
      type: String(obj.type || ''),
    };
  }
  function voteAiRounds(rounds, isJudgeOpts, opts) {
    const list = (rounds || []).filter((r) => r && r.ans);
    if (list.length <= 1) return list[0] || null;
    const byConf = list.slice().sort((a, b) => b.conf - a.conf)[0];
    if (isJudgeOpts) {
      let t = 0, f = 0;
      for (const r of list) {
        const v = judgeValueLoose(r.ans);
        if (v === true) t++;
        else if (v === false) f++;
      }
      if (t === f) return byConf;
      return { ans: t > f ? '正确' : '错误', conf: Math.round(list.reduce((s, r) => s + r.conf, 0) / list.length), why: byConf.why, type: byConf.type };
    }
    const o = opts || [];
    if (!o.length) return byConf;
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const count = new Map();
    for (const r of list) {
      const clean = String(r.ans).replace(/[\s,，、;；/]+/g, '');
      const set = new Set();
      if (/^[A-Za-z]+$/.test(clean)) {
        for (const ch of clean.toUpperCase()) {
          const i = letters.indexOf(ch);
          if (i >= 0 && i < o.length) set.add(i);
        }
      } else {
        const nAns = normalize(String(r.ans));
        o.forEach((t, i) => { const nt = normalize(String(t)); if (nt && nAns.includes(nt)) set.add(i); });
      }
      set.forEach((i) => count.set(i, (count.get(i) || 0) + 1));
    }
    const need = Math.floor(list.length / 2) + 1;
    const keep = [...count.entries()].filter(([, n]) => n >= need).map(([i]) => i).sort((a, b) => a - b);
    if (!keep.length) return byConf;
    const ans = keep.map((i) => letters[i]).join('');
    const avg = Math.round(list.reduce((s, r) => s + r.conf, 0) / list.length);
    return { ans, conf: Math.max(avg, 60), why: byConf.why, type: byConf.type };
  }

  const askAI = async (question, opts = [], typeHint = '') => {
    if (!CFG.aiApi) return null;
    const preset = presetOf();
    if (preset.needKey && !CFG.aiKey) { addLog(`AI 未就绪：${preset.name} 需要密钥`, 'warn'); return null; }

    const key = fnv(normalize(question) + '|' + (typeHint || '') + '|'
      + opts.map((o) => normalize(o)).slice().sort().join('|'));
    if (aiCache[key]) { addLog('AI 缓存命中（不重复消耗额度）', 'info'); return aiCache[key]; }

    const wait = CFG.aiRps - (Date.now() - aiLastCall);
    if (wait > 0) await sleep(wait);
    aiLastCall = Date.now();

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const sys = aiSysPrompt(typeHint);
    const usr = aiUserPrompt(question, opts, typeHint);

    let extra = {};
    if (CFG.aiExtraHeader) { try { extra = JSON.parse(CFG.aiExtraHeader) || {}; } catch (e) {} }

    const sendOnce = (userText, temp, tmo, maxTok) => new Promise((resolve) => {
      try {
        GM_xmlhttpRequest({
          method: 'POST',
          url: CFG.aiApi,
          headers: Object.assign(
            { 'Content-Type': 'application/json' },
            CFG.aiKey ? { Authorization: 'Bearer ' + CFG.aiKey } : {},
            extra
          ),
          data: JSON.stringify({
            model: CFG.aiModel || preset.model,
            temperature: Number.isFinite(temp) ? temp : 0,
            max_tokens: Math.max(200, Number(maxTok) || 3000),
            messages: [{ role: 'system', content: sys }, { role: 'user', content: userText }],
          }),
          timeout: tmo * 1000,
          onload: (res) => resolve({ status: Number(res.status) || 0, text: res.responseText || '' }),
          onerror: () => resolve({ status: 0, text: '' }),
          ontimeout: () => resolve({ status: -1, text: '' }),
        });
      } catch (e) { resolve({ status: 0, text: '' }); }
    });

    const callModel = async (userText, temp) => aiQueue(async () => {
      const tmo = Math.max(5, Number(CFG.aiTimeout) || 40);
      const maxRetry = aiRetryMax();
      let maxTok = Math.max(200, Number(CFG.aiMaxTokens) || 3000);
      for (let attempt = 0; ; attempt++) {
        await aiCooldownWait('上一次 AI 调用被限流');
        const r = await sendOnce(userText, temp, tmo, maxTok);

        if (aiBusyStatus(r.status) && attempt < maxRetry) {
          const w = aiBackoffMs(attempt);
          setAiCooldown(w, `HTTP ${r.status}`);
          addLog(`AI 被限流（HTTP ${r.status}）→ 第 ${attempt + 1}/${maxRetry} 次重试，等 ${(w / 1000).toFixed(1)} 秒`, 'warn');
          continue;
        }
        if (r.status === 429) {
          addLog('AI 还是被限流（HTTP 429，重试用完了）→ 这题先留空。免费额度同时限「并发 + 每分钟次数 + 每日 token」：'
            + '把设置页「AI 投票轮数」调到 2、「AI 间隔」调到 5000 以上，或换付费额度，再重跑这一页', 'err');
          return null;
        }
        if (r.status === -1) {
          addLog(`AI 超时（等了 ${tmo} 秒）→ 这轮作废。推理模型较慢，可到「设置」页把「AI 超时」调大`, 'err');
          return null;
        }
        if (!r.text) {
          addLog(`AI 无响应${r.status ? `（HTTP ${r.status}）` : ''}：${preset.tip}`, 'err');
          return null;
        }

        let content = '';
        let fin = '';
        try {
          const j = JSON.parse(r.text);
          if (j.error) {
            const msg = String(j.error.message || JSON.stringify(j.error)).slice(0, 90);
            addLog('AI 返回错误：' + msg, 'err');
            if (/key|auth|401|403/i.test(msg)) addLog('→ 密钥无效 / 未开通该模型（去「设置」页核对密钥与模型名）', 'warn');
            else if (/额度|quota|balance|insufficient|余额|并发|限流|rate|frequent|访问量|稍后再试|繁忙|busy|overload/i.test(msg)) {
              addLog('→ 额度/限流问题（免费额度用完，或请求太密）', 'warn');
              setAiCooldown(aiBackoffMs(attempt), '接口报额度/限流');
            }
            return null;
          }
          const ch0 = (j.choices && j.choices[0]) || null;
          fin = String((ch0 && ch0.finish_reason) || '');
          content = (ch0 && (ch0.message?.content ?? ch0.text)) || '';
          if (fin === 'length' && !String(content).trim() && attempt < maxRetry && maxTok < 16000) {
            const old = maxTok;
            maxTok = Math.min(16000, maxTok * 2);
            addLog(`AI 思考把 ${old} tokens 用光了（finish_reason=length）→ 上限翻到 ${maxTok} 重问一次`, 'warn');
            continue;
          }
          if (!content && ch0 && ch0.message?.reasoning_content) {
            content = ch0.message.reasoning_content;
            addLog('AI 只给了推理过程（reasoning_content），从里面找答案', 'dim');
          }
        } catch (e) {
          if (aiBusyText(r.text) && attempt < maxRetry) {
            const w = aiBackoffMs(attempt);
            setAiCooldown(w, '响应文本里提到限流');
            addLog(`AI 像是被限流了（响应不是 JSON）→ 第 ${attempt + 1}/${maxRetry} 次重试，等 ${(w / 1000).toFixed(1)} 秒`, 'warn');
            continue;
          }
          addLog('AI 响应不是合法 JSON：' + r.text.slice(0, 80), 'err');
          return null;
        }
        if (!content) {
          addLog(fin === 'length'
            ? `AI 正文被截断（finish_reason=length，上限 ${maxTok} tokens 已被思考过程吃光）→ 到「设置」页把「最多生成 token」调大，或换个不带思考的模型`
            : 'AI 返回空内容', 'err');
          return null;
        }

        const parsed = parseAiAnswer(content);
        if (!parsed) { addLog('AI 回复解析不出答案：' + String(content).slice(0, 60), 'warn'); return null; }
        return parsed;
      }
    });

    addLog(`请求 AI（${CFG.aiModel || preset.model} · ${preset.name}）…`, 'info');
    let got = await callModel(usr, 0);
    if (!got) return null;

    const isJudgeOpts = opts.length === 2 && opts.every((o) => normalizeJudge(o) !== null);
    const looksMulti = got.type === 'multi' || (/^[A-Za-z]{2,}$/.test(got.ans) && opts.length > 2);
    const votes = Math.max(1, Math.min(4, Number(CFG.aiVotes) || 2));
    if (CFG.aiVerify && votes > 1) {
      const rounds = [got];
      const need = looksMulti ? votes : Math.max(2, votes - 1);
      const temps = [0, 0.7, 1.0, 1.2];
      for (let i = 1; i < need; i++) {
        await sleep(300);
        const vusr = usr + `\n【你上一轮的答案】${String(got.ans).slice(0, 40)}（置信度 ${got.conf}）`
          + '\n【复核要求】先假设你上一轮的答案是**错的**，从教材原文出发重新判断：'
          + (looksMulti
            ? '逐项确认每个选项在教材/官方表述里是否成立，特别检查有没有**漏选**（漏选最常见），也要去掉明显错误的凑数项。'
            : '指出最有可能的另一项/另一种判断，并写出教材依据；只有当你确认原答案在教材里成立时才保留它。')
          + '宁可改成有理有据的答案，也不要因为「刚才选过了」而坚持。'
          + '\n按同样格式只输出一行 JSON。';
        const again = await callModel(vusr, temps[i] || 1.0);
        if (again && again.ans) rounds.push(again);
      }
      if (rounds.length > 1) {
        addLog(`AI ${rounds.length} 轮：${rounds.map((r) => String(r.ans).slice(0, 20) + '(' + Math.round(r.conf) + ')').join(' → ')}`, 'info');
        const merged = voteAiRounds(rounds, isJudgeOpts, opts);
        if (merged && merged.ans !== got.ans) {
          addLog(`多轮投票结果：${String(merged.ans).slice(0, 24)}（多数票，已改判）`, 'warn');
          got = merged;
        } else if (merged) {
          got = merged;
        } else {
          addLog('多轮投票没能合成答案，保留第一轮', 'warn');
        }
      }
    }

    const ans = got.ans;
    const conf = got.conf;
    if (got.why) addLog(`AI 理由：${got.why}`, 'dim');
    if (!ans || !isFinite(conf) || conf < 40) {
      addLog(`AI 无把握作答（置信度 ${isFinite(conf) ? conf : '?'}）→ 跳过该题`, 'warn');
      return null;
    }

    let list2 = [];
    const clean = ans.replace(/[\s,，、;；]+/g, '');
    if (isJudgeOpts) {
      const want = judgeValueLoose(ans);
      const idx = want === null ? -1 : judgePickIndex(opts.map((t) => ({ text: t })), want);
      if (idx >= 0) list2 = [opts[idx]];
      else if (want !== null) list2 = [want ? '正确' : '错误'];
      else {
        const i = clean.length === 1 ? 'ABCDEFGH'.indexOf(clean.toUpperCase()) : -1;
        list2 = (i >= 0 && i < opts.length) ? [opts[i]] : [];
      }
    } else if (opts.length && /^[A-Za-z]+$/.test(clean) && clean.length <= opts.length) {
      const seen = [];
      for (const ch of clean.toUpperCase()) {
        const i = letters.indexOf(ch);
        if (i >= 0 && i < opts.length && !seen.includes(i)) seen.push(i);
      }
      list2 = seen.map((i) => opts[i]);
    } else {
      list2 = ans.split(/[;；\n]+/).map((s) => s.trim()).filter(Boolean);
    }
    if (!list2.length) return null;

    if (opts.length && !isJudgeOpts) {
      const ok = list2.some((a) => findMatchedOption(opts.map((t) => ({ text: t, el: null })), a));
      if (!ok) { addLog('AI 答案与选项对不上（已丢弃）：' + ans.slice(0, 30), 'warn'); return null; }
    }

    aiCache[key] = list2; aiCacheDirty = true;
    const shown = (opts.length && !isJudgeOpts)
      ? list2.map((a) => { const i = opts.indexOf(a); return i >= 0 ? letters[i] : a; }).join('')
      : list2.join(' / ');
    if (CFG.aiCross !== false && CFG.aiCrossModel && /deepseek/i.test(String(CFG.aiApi || ''))) {
      try {
        addLog(`[交叉复核] 让 ${CFG.aiCrossModel} 独立再判一次…`, 'info');
        const crossRaw = await aiRawChat(
          '你是中国高校思政课/马克思主义基本原理课的阅卷老师。独立判断这道题，'
          + '只输出一行 JSON：{"answer":"B","confidence":0-100,"why":"20 字以内依据"}；'
          + '选择题填选项字母（多选连写如 ACD），判断题填「正确」或「错误」。',
          aiUserPrompt(question, opts, typeHint) + '\n【要求】独立作答，不要复述别人的答案。',
          0, CFG.aiCrossModel
        );
        const cp = crossRaw ? parseAiAnswer(crossRaw) : null;
        if (cp && cp.ans) {
          const sameAns = (() => {
            const a = String(got.ans || ''), b = String(cp.ans || '');
            try {
              if (isJudgeOpts) {
                const va = normalizeJudge(a);
                const vb = normalizeJudge(b) || (b.length === 1 && /[A-Za-z]/.test(b) ? normalizeJudge(optText(opts[b.toUpperCase().charCodeAt(0) - 65])) : null);
                if (va && vb) return va === vb;
              }
            } catch (e) {}
            const letters = (x) => (String(x).toUpperCase().match(/[A-Z]/g) || []).sort().join('');
            const la = letters(a), lb = letters(b);
            if (la && lb) return la === lb;
            return a.trim() === b.trim();
          })();
          if (sameAns) {
            addLog(`[交叉复核] ${CFG.aiCrossModel} 与主模型一致：${String(got.ans).slice(0, 20)}（置信度 ${Math.round(cp.conf)}）→ 保持`, 'ok');
          } else {
            addLog(`[交叉复核] 两模型不一致：主模型 ${String(got.ans).slice(0, 20)}(置信度 ${Math.round(got.conf)}) vs ${CFG.aiCrossModel} ${String(cp.ans).slice(0, 20)}(置信度 ${Math.round(cp.conf)}) → 采用推理模型的结果`, 'warn');
            got = cp;
          }
        } else {
          addLog('[交叉复核] 推理模型这轮没给出可用答案 → 保留主模型结果', 'warn');
        }
      } catch (e) { addLog('[交叉复核] 出错：' + ((e && e.message) || e), 'warn'); }
    }

    addLog(`AI 命中（置信度 ${Math.round(conf)}）：${String(shown).slice(0, 40)}`, 'ok');
    return list2;
  };

  function hasCJK(s) { return /[\u4e00-\u9fa5]/.test(String(s || '')); }

  const COMMON_CHARS = '的一是在不了有和人这中大为上个国我以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经十三之进着等部度家电力里如水化高自二理起小物现实加量都两体制机当使点从业本去把性好应开它合还因由其些然前外天政四日那社义事平形相全表间样与关各重新线内数正心反你明看原又么利比或但质气第向道命此变条只没结解问意建月公无系军很情者最立代想已通并提直题党程展五果料象员革位入常文总次品式活设及管特件长求老头基资边流路级少图山统接知较将组见计别她手角期根论运农指几九区强放决西被干做必战先回则任取据处队南给色光门即保治北造百规热领七海口东导器压志世金增争济阶油思术极交受联什认六共权收证改清己美再采转更单风切打白教速花带安场身车例真务具万每目至达走积示议声报斗完类八离华名确才科张信马节话米整空元况今集温传土许步群广石记需段研界拉林律叫且究观越织装影算低持音众书布复容儿须际商非验连断深难近矿千周委素技备半办青省列习响约支般史感劳便团往酸历市克何除消构府称太准精值号率族维划选标写存候毛亲快效斯院查江型眼王按格养易置派层片始却专状育厂京识适属圆包火住调满县局照参红细引听该铁价严龙飞';
  const COMMON_PUNCT = '，。、；：？！“”‘’（）《》';
  function garbleScore(s) {
    const t = String(s || '').replace(/[A-Za-z0-9\s]/g, '');
    if (!t.length) return 0;
    let common = 0;
    for (const ch of t) {
      if (COMMON_CHARS.includes(ch) || COMMON_PUNCT.includes(ch)) common++;
    }
    return common / t.length;
  }
  const GARBLE_MIN = 0.5;
  const GAIN_MIN = 0.06;
  const GAIN_MARGIN = 0.02;
  const DECRYPT_JUDGE_VER = 2;
  function isEncryptedStem(s) {
    if (looksCipher(s)) return true;
    if (lastCipherSet && lastCipherSet.size) return false;
    const t = String(s || '').replace(/[A-Za-z0-9\s【】\[\]（）()、，。？?！!]/g, '');
    if (t.length < 8) return false;
    return garbleScore(s) < GARBLE_MIN;
  }

  function plainStem(s) {
    let t = String(s || '');
    t = t.replace(/[\u200b-\u200f\u2060\ufeff]/g, '').replace(/\s+/g, ' ').trim();
    t = t.replace(/^[\s　]*[【\[（(]\s*(单选题?|多选题?|判断题?|填空题?|简答题?|论述题?|问答题?)\s*[】\]）)]\s*/g, '');
    t = t.replace(/[【\[（(]\s*(单选题?|多选题?|判断题?|填空题?|简答题?|论述题?|问答题?)\s*[】\]）)]/g, '');
    t = t.replace(/^[\s　]*[（）()\s　_]+(?=[\u4e00-\u9fa5])/g, '');
    t = t.replace(/^[\s　]*\d{1,2}\s*[.、．)）]\s*(?=[\u4e00-\u9fa5（(])/g, '');
    t = t.replace(/^[\s　]*\d{1,2}\s*(?=[\u4e00-\u9fa5][^0-9])/g, '');
    t = t.replace(/^[A-Da-d][.、．)）]\s*/, '');
    t = t.replace(/[\s　]+[A-Da-d][.、．)）]\s*[\u4e00-\u9fa5].*$/, '');
    return t.trim();
  }

  function labelType(stem) {
    const m = /[【\[（(]?\s*(单选题?|多选题?|判断题?|填空题?|简答题?|论述题?|问答题?)\s*[】\]）)]?/.exec(String(stem || ''));
    if (!m) return '';
    const w = m[1];
    if (/多选/.test(w)) return 'multi';
    if (/判断/.test(w)) return 'judge';
    if (/填空/.test(w)) return 'fill';
    if (/简答|论述|问答/.test(w)) return 'essay';
    return 'single';
  }

  const JUDGE_POS = ['必须', '坚决', '全面', '领导', '核心', '根本', '本质', '关键', '保障', '坚持', '最本质', '首要', '标志', '决定', '基础', '前提', '正确', '重要'];
  const JUDGE_NEG = ['不必', '无需', '不能', '不属于', '错误的是', '不正确', '取消', '放弃', '否定', '无关', '没有关系', '可以代替', '完全独立', '唯一'];
  function guessJudge(stem) {
    const s = String(stem || '');
    if (JUDGE_NEG.some((w) => s.includes(w))) return '错误';
    if (JUDGE_POS.some((w) => s.includes(w))) return '正确';
    return null;
  }

  function heuristicAnswer(stem, opts, kind) {
    const ps = plainStem(stem);
    if (!hasCJK(ps)) return null;
    let type = labelType(ps);
    if (!type) type = inferType(null, opts, [], null);
    if (type === 'judge' && CFG.heuristicJudge) {
      const g = guessJudge(ps);
      return g ? [g] : null;
    }
    if (type === 'multi' && CFG.heuristicMulti && opts.length >= 2) {
      return opts.map((o) => optText(o));
    }
    if (type === 'single' && CFG.guessSingle && opts.length >= 2) {
      const longest = opts.slice().sort((a, b) => optText(b).length - optText(a).length)[0];
      return longest ? [optText(longest)] : null;
    }
    return null;
  }

  async function getAnswer(question, opts = [], kind = '', typeHint = '') {
    if (!question || !String(question).trim()) return null;
    if (isEncryptedStem(question)) {
      encSkipCount++;
      if (CFG.aiRepair !== false) {
        const g = await askAiGarbled(question, opts, typeHint);
        if (g) {
          addLog(`[AI] 题干仍是乱码（可读度 ${Math.round(garbleScore(question) * 100)}%）→ 让 AI 按上下文作答：${String(g.ans).slice(0, 20)}（置信度 ${Math.round(g.conf)}，依据：${String(g.why || '').slice(0, 24)}）`, 'warn');
          return g.ans;
        }
      }
      addLog(`[加密] 题干还是字库乱码（可读度 ${Math.round(garbleScore(question) * 100)}% < ${Math.round(GARBLE_MIN * 100)}%）→ 不发给 AI（发给它只会被当成「乱码无法辨识」瞎猜）`, 'err');
      addLog('  ↳ 三步排查：①诊断页点「字库解密自检」，它会打印每道题的可读度；②菜单「清空字库缓存」→ 刷新页面重新认字；③还认不出就先手动把这几题做了（字库会变，下次刷新可能就认得出）', 'err');
      return null;
    }
    const dbg = { local: false, remote: false, ai: false, aiNote: '', fallback: false };

    const local = localQuery(question);
    if (local) { dbg.local = true; addLog('[题库] 命中本地题库', 'ok'); return local; }

    if (CFG.aiProvider !== 'ai') {
      const remote = await remoteQuery(question);
      if (remote) { dbg.remote = true; addLog('[外部题库] 命中', 'ok'); return remote; }
      if (!CFG.qbApi) addLog('[题库] 未命中且未配置外部题库地址 → 跳过', 'warn');
    }

    const p = presetOf();
    if (CFG.aiApi && !p.needKey) {
      const ai = await askAI(question, opts, typeHint);
      if (ai) { dbg.ai = true; return ai; }
      dbg.aiNote = '调用失败或置信度不足';
    } else if (!CFG.aiKey) {
      dbg.aiNote = aiNotReadyNote() || '还没填密钥';
      addLog('[AI] 未调用：' + dbg.aiNote, 'warn');
    } else if (!CFG.aiApi) {
      dbg.aiNote = '接口地址为空';
      addLog('[AI] 未调用：接口地址为空', 'warn');
    } else {
      const ai = await askAI(question, opts, typeHint);
      if (ai) { dbg.ai = true; return ai; }
      dbg.aiNote = '调用失败或置信度不足';
    }

    const g = heuristicAnswer(question, opts, kind);
    if (g) { dbg.fallback = true; addLog('[兜底] 关键词推断：' + g.join(' / ').slice(0, 20), 'warn'); return g; }

    addLog('[无解] ' + plainStem(question).slice(0, 26) + '…', 'warn');
    W.__CXFIX_LASTDBG__ = dbg;
    return null;
  }

  function diagnoseJump() {
    addLog('===== 跳章诊断 =====', 'info');
    addLog(`URL：${location.href.slice(0, 110)}`, 'dim');
    const nav = () => { try { return Jump.navKey(); } catch (e) { return '(取不到)'; } };
    addLog(`当前导航指纹：${nav().slice(0, 110)}`, 'dim');

    const ov = Jump.overlay();
    if (ov) addLog(`弹层：命中 class="${Jump.clsOf(ov)}" 文字「${txt(ov).slice(0, 30)}」（脚本会先尝试按弹窗语义处理，再继续跳转）`, 'warn');
    else addLog('弹层：无（可正常跳转）', 'dim');

    const docs = Jump.docsAll();
    addLog(`可访问文档：${docs.length} 个（顶层 + 同源 iframe）`, 'info');

    let total = 0;
    docs.forEach((d, di) => {
      const tag = di === 0 ? '顶层' : `iframe#${di}`;
      let hit = [];
      for (const s of Jump.SEL_NEXT) {
        let n = 0;
        try { n = d.querySelectorAll(s).length; } catch (e) {}
        if (n) hit.push(`${s}×${n}`);
      }
      if (hit.length) {
        total += hit.length;
        addLog(`[${tag}] 选择器命中：${hit.join(' , ')}`, 'ok');
        let els = [];
        for (const s of Jump.SEL_NEXT) {
          try { d.querySelectorAll(s).forEach((e) => { if (!els.includes(e)) els.push(e); }); } catch (e) {}
        }
        els.slice(0, 6).forEach((e) => {
          addLog(`   • <${(e.tagName || '').toLowerCase()} class="${Jump.clsOf(e)}">「${txt(e).slice(0, 14)}」 可见=${Jump.vis(e) ? '是' : '否'} 禁用=${Jump.dis(e) ? '是' : '否'}`, 'dim');
        });
      } else {
        let texts = [];
        try {
          texts = [...d.querySelectorAll('a,button,div,span,li')]
            .filter((e) => /^(下一节|下一课|下一章|下一讲|下一个)$/.test(txt(e)))
            .slice(0, 4)
            .map((e) => `<${(e.tagName || '').toLowerCase()} class="${Jump.clsOf(e)}">可见=${Jump.vis(e) ? '是' : '否'}`);
        } catch (e) {}
        addLog(`[${tag}] 选择器没命中${texts.length ? `；但文案匹配到：${texts.join(' , ')}` : '，也没匹配到「下一节」文案'}`, texts.length ? 'warn' : 'dim');
      }
    });
    if (!total) addLog('结论：任何地方都没找到「下一节」按钮 → 只能走侧栏目录 / 键盘兜底（点「只看不点」可看侧栏节点）', 'warn');

    const nodes = (() => { try { return [...document.querySelectorAll(Jump.SEL_NODE.join(','))]; } catch (e) { return []; } })();
    addLog(`侧栏目录节点：${nodes.length} 个${nodes.length ? `，首个：「${txt(nodes[0]).slice(0, 20)}」 class="${Jump.clsOf(nodes[0])}"` : ''}`, nodes.length ? 'ok' : 'warn');

    addLog('提示：诊断只读不点。「立即跳下一节」菜单项会真的执行一次跳转，日志会打印每一步结果。', 'dim');
  }

  async function diagnoseChannels() {
    addLog('=== 通道自检开始 ===', 'ok');
    addLog(`配置：预设=${CFG.aiPreset} 模型=${CFG.aiModel || '(空)'} 密钥=${CFG.aiKey ? '已填(' + CFG.aiKey.length + '位)' : '未填'} 外部题库=${CFG.qbApi || '(未配)'}`, 'dim');

    const qb = getBank();
    addLog(`本地题库：${Object.keys(qb).length} 条`, Object.keys(qb).length ? 'ok' : 'warn');

    const probe = '中国特色社会主义最本质的特征是';
    const pOpts = ['人民代表大会制度', '中国共产党的领导', '共同富裕', '依法治国'];
    const l = localQuery(probe);
    addLog(`本地检索：${l ? '命中 → ' + l.join('/') : '未命中'}`, l ? 'ok' : 'dim');

    const p = presetOf();
    if (!CFG.aiApi) addLog('AI 通道：接口地址为空 → 不会发起请求', 'err');
    else if (p.needKey && !CFG.aiKey) addLog('AI 通道：该服务商需要密钥，当前未填 → 被跳过（这是没答题的直接原因）', 'err');
    else {
      addLog('AI 通道：正在发起测试请求…', 'dim');
      const t0 = Date.now();
      const r = await askAI(probe, pOpts);
      const cost = ((Date.now() - t0) / 1000).toFixed(1);
      if (r) addLog(`AI 通道：连通，${cost}s 返回「${r.join(' / ')}」`, 'ok');
      else addLog(`AI 通道：${cost}s 无有效返回 → 检查密钥/模型名/额度，或看控制台 network`, 'err');
    }

    const preview = await previewCurrentStems();
    addLog(`当前页面：识别到 ${preview.count} 个题目容器，可读题干 ${preview.readable} 个`, preview.count ? 'ok' : 'warn');
    if (preview.count && preview.readable < preview.count) {
      addLog('有题干读不到文字 → 页面开了字库加密，去设置页打开「字库解密」再试', 'warn');
    }
    if (!preview.count) addLog('没识别到题目：先手动进入有题的页面，再点这个按钮', 'warn');
    addLog('=== 通道自检结束 ===', 'ok');
    renderLogs();
  }

  async function diagnoseDecrypt() {
    addLog('=== 字库解密自检 ===', 'ok');
    addLog(`开关 decrypt=${CFG.decrypt ? '开' : '关（先去设置页勾上）'}`, CFG.decrypt ? 'dim' : 'err');

    const docs = [document];
    try { walkIframes(document.documentElement).forEach((f) => { try { if (f.contentDocument) docs.push(f.contentDocument); } catch (e) {} }); } catch (e) {}

    let total = 0, styleHits = 0, b64Len = 0;
    for (const d of docs) {
      let els = [];
      try { els = [...d.querySelectorAll('.font-cxsecret,[class*="cxsecret" i]')]; } catch (e) {}
      let st = null;
      try { d.querySelectorAll('style').forEach((s) => { if (st) return; const t = s.textContent || ''; if (/font-cxsecret|cxsecret/i.test(t)) st = t; }); } catch (e) {}
      const m = st ? st.match(/base64,([\w\W]+?)['")]/) : null;
      const mark = (d === document ? '顶层' : 'iframe');
      if (els.length || st) {
        addLog(`${mark}：加密元素 ${els.length} 个，字体定义 ${st ? '有（' + Math.round((m ? m[1].length : 0) / 1024) + 'KB）' : '无'}`, els.length ? 'warn' : 'dim');
      }
      total += els.length;
      if (st) styleHits++;
      if (m) b64Len = Math.max(b64Len, m[1].length);
    }

    if (!total && !styleHits) {
      addLog('结论：页面没有任何字库加密痕迹 → 题干乱码不是加密导致的，请把题干原文截图给我', 'warn');
      return;
    }
    if (total && !b64Len) {
      addLog('结论：有加密元素但找不到字体 base64 → 加密方式不是 cxsecret 字体，需要新的解密方案', 'err');
      return;
    }

    addLog(`开始实际解密 ${total} 处文本…`, 'dim');
    let okCount = 0;
    for (const d of docs) {
      try { if (await decryptDoc(d)) okCount++; } catch (e) { addLog('解密异常：' + e.message, 'err'); }
    }
    addLog(okCount ? `结论：解密成功 ${okCount} 个文档 → 重新进入章节测验即可正常答题` : '结论：解密未通过（上方有具体原因）', okCount ? 'ok' : 'err');
    const stems = await previewCurrentStems();
    addLog(`解密后回读：${stems.count} 个题目容器，可读题干 ${stems.readable} 个`, stems.readable ? 'ok' : 'warn');
    reportFontFacts();
    try { await diagGlyphCtx(); } catch (e) { addLog('上下文自检出错：' + (e && e.message), 'warn'); }
  }

  function reportFontFacts() {
    const out = { url: location.href, faces: [], styles: [], classes: [], fonts: [] };
    const scan = (d, mark) => {
      try {
        d.querySelectorAll('style').forEach((s, i) => {
          const t = s.textContent || '';
          if (/@font-face|cxsecret|base64/i.test(t)) {
            const fam = (t.match(/font-family\s*:\s*['"]?([^;'"]+)/i) || [])[1] || '?';
            const b64 = (t.match(/base64,([^'")\s]+)/) || [])[1] || '';
            out.styles.push({ doc: mark, idx: i, size: t.length, fam, b64KB: Math.round(b64.length / 1024) });
          }
        });
        d.querySelectorAll('*').forEach((el) => {
          const c = typeof el.className === 'string' ? el.className : '';
          if (/cxsecret|font-cx/i.test(c)) {
            const cs = getComputedStyle(el);
            out.classes.push({ doc: mark, cls: c.slice(0, 60), font: cs.fontFamily.slice(0, 40), text: (el.textContent || '').slice(0, 16) });
          }
        });
      } catch (e) { out.faces.push({ doc: mark, err: e.message }); }
    };
    scan(document, 'top');
    try { walkIframes(document.documentElement).forEach((f) => { try { if (f.contentDocument) scan(f.contentDocument, 'iframe'); } catch (e) {} }); } catch (e) {}
    out.faces = (out.faces || []).slice(0, 6);
    out.styles = out.styles.slice(0, 8);
    out.classes = out.classes.slice(0, 6);
    W.__CXFIX_FONTDUMP__ = out;
    addLog(`字体事实：命中 style ${out.styles.length} 个，加密元素 ${out.classes.length} 个`, out.classes.length ? 'warn' : 'dim');
    out.styles.forEach((s) => addLog(`· style[${s.doc}] ${s.size}字符 家族=${s.fam} base64=${s.b64KB}KB`, 'dim'));
    out.classes.forEach((c) => addLog(`· 元素[${c.doc}] class=${c.cls} font=${c.font} 文本=${c.text}`, 'dim'));
    if (!out.classes.length && !out.styles.length) addLog('页面里没有任何 cxsecret 痕迹 → 乱码可能是别的原因', 'warn');
    try {
      navigator.clipboard.writeText(JSON.stringify(out, null, 2))
        .then(() => { addLog('字体事实已复制到剪贴板，可直接贴给我', 'ok'); renderLogs(); })
        .catch(() => { addLog('剪贴板被拒：控制台执行 copy(__CXFIX_FONTDUMP__)', 'warn'); renderLogs(); });
    } catch (e) {}
  }

  async function diagGlyphCtx() {
    addLog('=== 字形上下文自检（判断是不是「上下文替换」） ===', 'ok');
    if (!lastEncB64) {
      addLog('还没解过这个页面的字体 → 先点「字库解密自检」（或刷新页面），再点这个', 'warn');
      return;
    }
    const fam = 'cxd-' + Date.now().toString(36);
    try {
      const ff = new FontFace(fam, 'url(data:font/ttf;base64,' + lastEncB64 + ')');
      await ff.load();
      document.fonts.add(ff);
      await document.fonts.ready;
      await sleep(150);
    } catch (e) { addLog('字体加载失败：' + (e && e.message), 'err'); return; }

    const scan = (d, mark) => {
      const out = [];
      try { out.push(...d.querySelectorAll('.font-cxsecret,[class*="cxsecret" i]')); } catch (e) {}
      if (!out.length) {
        try { out.push(...[...d.querySelectorAll('*')].filter((el) => /cxsecret/i.test(el.getAttribute('style') || ''))); } catch (e) {}
      }
      return out;
    };
    let els = scan(document, 'top');
    try { walkIframes(document.documentElement).forEach((f) => { try { if (f.contentDocument) els = els.concat(scan(f.contentDocument, 'iframe')); } catch (e) {} }); } catch (e) {}
    if (!els.length) { addLog('页面上没有加密元素（可能不在测验页）→ 到题目页再点这个', 'warn'); return; }

    const nodes = [];
    els.forEach((el) => {
      try {
        const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        while (w.nextNode()) if (w.currentNode.nodeValue && w.currentNode.nodeValue.trim()) nodes.push(w.currentNode);
      } catch (e) {}
    });
    if (!nodes.length) { addLog('加密元素里没有文本节点', 'warn'); return; }

    if (encFontName) addLog(`[字库] 本页加密字体自称「${encFontName}」`, 'dim');
    const fam0 = (refOrderNow && refOrderNow[0]) || REF_FAMS[0];
    const ref = await refTableFor(fam0, 'gb1');
    addLog(`参考字体「${fam0}」·常用字表 ${ref.n} 字（建表完成）`, 'dim');
    let shown = 0, better = 0, same = 0;
    for (const nd of nodes) {
      const t = String(nd.nodeValue || '');
      const cells = featsLine(t, fam, ref.fam);
      for (let i = 0; i < t.length && shown < 12; i++) {
        const ch = t[i];
        if (!ch.trim()) continue;
        const iso = encFeat(ch, fam, ref.fam);
        const a = iso ? bestMatch(iso, ref) : null;
        const b = cells[i] ? bestMatch(cells[i], ref) : null;
        const f = (r) => (r ? `${r.ch}(${r.d1.toFixed(3)}/${r.d2.toFixed(3)})` : '空白');
        if (a && b && b.d1 < a.d1 - 0.02) better++;
        else same++;
        addLog(`· 密文「${ch}」 单独画→${f(a)} ｜ 连上下文画→${f(b)}`, 'dim');
        shown++;
      }
      if (shown >= 12) break;
    }
    addLog(`判读：${shown} 个字里「连上下文画更近」的有 ${better} 个（其余 ${same} 个）。`, better >= shown / 2 ? 'ok' : 'warn');
    if (better >= shown / 2) addLog('→ 结论：这字体就是「上下文替换」型，认字必须按行做（v1.3.14 已按行认字）', 'ok');
    else addLog('→ 结论：按行画也没更近 —— 更像是参考字体与它不同源。把上面这 12 行发我，我换参考字体表', 'warn');
  }

  async function dryRunCurrentPage() {
    addLog('===== 答题全流程测试开始（不会提交）=====', 'info');
    if (!CFG.autoAnswer) addLog('注意：设置里「自动答题」是关的，但仍会测试识别与取答案', 'warn');

    const docs = [];
    try { docs.push(document); } catch (e) {}
    try {
      walkIframes(document.documentElement).forEach((f) => {
        try { if (f.contentDocument) docs.push(f.contentDocument); } catch (e) {}
      });
    } catch (e) {}

    let found = 0;
    for (const d of docs) {
      let kind = 'zj';
      let nodes = pickQuestionNodes(d, kind);
      if (!nodes.length) { kind = 'ks'; nodes = pickQuestionNodes(d, kind); }
      if (!nodes.length) continue;

      addLog(`在${d === document ? '顶层' : 'iframe'}文档里找到 ${nodes.length} 题（kind=${kind}）`, 'ok');
      for (const node of nodes) {
        found++;
        if (found > 6) { addLog('只测前 6 题，够了', 'dim'); break; }
        const { stem, opts } = extractQuestion(node, kind);
        const inputs = pickAnswerInputs(node);
        const ta = node.querySelector('textarea');
        const type = inferType(node, opts, inputs, ta);
        const kinds = [...new Set(inputs.map((i) => (i.getAttribute('type') || '(无type)')))];

        addLog(`── 第 ${found} 题 ──────────────────`, 'info');
        addLog(`题型判定：${TYPE_NAME[type] || type}（题干标签=${labelType(stem) || '无'}，输入框=${inputs.length}个[${kinds.join(',') || '无'}]，选项=${opts.length}个）`, 'dim');
        addLog(`题干：${String(stem).slice(0, 60)}`, 'dim');
        opts.forEach((o, i) => addLog(`  ${LETTERS[i] || i + 1}. ${String(o.text).slice(0, 34)}`, 'dim'));

        if (!stem || !hasCJK(stem)) { addLog('题干读不到 → 跳过（可能是字库加密，去点「字库解密自检」）', 'warn'); continue; }

        const t0 = Date.now();
        const raw = await getAnswer(stem, opts.map((o) => o.text), kind, type);
        addLog(`取答案耗时 ${((Date.now() - t0) / 1000).toFixed(1)}s → ${raw ? JSON.stringify(raw).slice(0, 80) : 'null（没取到）'}`, raw ? 'ok' : 'warn');
        if (!raw) continue;

        const answer = expandAnswer(raw, type, opts);
        if (raw && answer.length !== (Array.isArray(raw) ? raw.length : 1)) addLog(`字母串已拆分：${Array.isArray(raw) ? raw.length : 1} → ${answer.length} 个`, 'dim');
        answer.forEach((a, i) => {
          const hit = findMatchedOption(opts, a);
          addLog(`  答案${i + 1}「${String(a).slice(0, 22)}」→ ${hit ? `匹配到「${String((hit.el && (hit.el.textContent || '')).trim()).slice(0, 20)}」（相似度 ${hit.score}）` : '❌ 匹配不到任何选项'}`, hit ? 'dim' : 'err');
        });

        const r = applyAnswer({ node, stem, opts, inputs, ta, doc: d, win: d.defaultView, kind }, answer);
        const picked = opts.filter((o) => isPicked(o.el)).length;
        addLog(`填写结果：ok=${r.ok} 命中=${r.hits}；点完后页面上被选中的选项数=${picked}`, picked >= answer.length ? 'ok' : 'warn');
        if (answer.length > 1 && picked < answer.length) {
          addLog('⚠ 多选答案没全部选中 → 把上面这几行发我，我直接定位', 'err');
        }
      }
    }
    if (!found) addLog('当前页面没有找到任何题目（先点进测验再跑这个）', 'warn');
    addLog('===== 测试结束 =====', 'info');
    return found;
  }

  function reportLiveQuestions() {
    const docs = [document];
    try {
      walkIframes(document.documentElement).forEach((f) => {
        try { if (f.contentDocument) docs.push(f.contentDocument); } catch (e) {}
      });
    } catch (e) {}
    let n = 0;
    for (const d of docs) {
      let nodes = pickQuestionNodes(d, 'zj');
      let kind = 'zj';
      if (!nodes.length) { nodes = pickQuestionNodes(d, 'ks'); kind = 'ks'; }
      if (!nodes.length) continue;
      addLog(`【${d === document ? '顶层' : 'iframe'}】${nodes.length} 题 · kind=${kind}`, 'info');
      for (const node of nodes.slice(0, 8)) {
        n++;
        const { stem, opts } = extractQuestion(node, kind);
        const inputs = pickAnswerInputs(node);
        const picked = opts.filter((o) => isPicked(o.el)).length;
        addLog(`#${n} 标签=${labelType(stem) || '无'} · 输入框=${inputs.length}[${[...new Set(inputs.map((i) => i.getAttribute('type') || '(无type)'))].join(',')}] · 选项=${opts.length} · 已选中=${picked}`, 'dim');
        addLog(`   容器class="${String(node.className).slice(0, 50)}" 题干="${String(stem).slice(0, 40)}"`, 'dim');
        if (PICK_MARKS && PICK_MARKS.marks && PICK_MARKS.marks.length) addLog(`   本页已学会的选中标记：${PICK_MARKS.marks.join(' / ')}`, 'dim');
        opts.slice(0, 8).forEach((o, i) => {
          const inp = o.el && o.el.querySelector ? o.el.querySelector('input') : null;
          const cur = o.cursor && o.cursor.tagName ? `${o.cursor.tagName.toLowerCase()}.${String(o.cursor.className || '').split(/\s+/)[0] || ''}` : '无';
          addLog(`   ${LETTERS[i] || i + 1}. 点=${cur} 外层class="${String((o.el && o.el.className) || '').slice(0, 34)}" input=${inp ? (inp.checked ? 'checked' : 'unchecked') + '/type=' + (inp.getAttribute('type') || '无') : '无'} 已选=${isPicked(o.el) ? '是' : '否'}`, 'dim');
        });
      }
    }
    if (!n) addLog('当前页面没有题目容器（先点进测验页）', 'warn');
    return n;
  }

  async function previewCurrentStems() {
    let count = 0, readable = 0;
    const docs = [document.documentElement];
    try { walkIframes(document.documentElement).forEach((f) => { try { if (f.contentDocument) docs.push(f.contentDocument.documentElement); } catch (e) {} }); } catch (e) {}
    for (const root of docs) {
      const d = root.ownerDocument;
      let nodes = pickQuestionNodes(d, 'zj');
      if (!nodes.length) nodes = pickQuestionNodes(d, 'ks');
      for (const n of nodes.slice(0, 8)) {
        count++;
        const { stem, opts } = extractQuestion(n, 'zj');
        const sc = garbleScore(stem || '');
        if (stem && hasCJK(stem) && !isEncryptedStem(stem)) {
          readable++;
          addLog(`· ${opts.length}选项 · 可读度 ${Math.round(sc * 100)}% · ${stem.slice(0, 34)}${stem.length > 34 ? '…' : ''}`, 'dim');
        } else if (stem && isEncryptedStem(stem)) {
          addLog(`· ${opts.length}选项 · [仍是乱码] 可读度 ${Math.round(sc * 100)}%（低于 ${Math.round(GARBLE_MIN * 100)}% 就不发给 AI）· ${stem.slice(0, 26)}…`, 'warn');
        } else {
          addLog('· (空题干，可能被字库加密)', 'warn');
        }
      }
    }
    return { count, readable };
  }

  const GLYPH_MAP_KEY = 'cx_fix_glyph_map_v1';
  let lastAlts = {};
  let lastCipherSet = new Set();
  const cipherByFont = new Map();
  const fakeFonts = new Set();
  function registerCipherSet(fp, set) {
    if (!fp || !set) return;
    cipherByFont.set(fp, set);
    const u = new Set();
    cipherByFont.forEach((s) => s.forEach((c) => u.add(c)));
    lastCipherSet = u;
  }
  let lastEncB64 = '';
  let decryptForce = false;
  let decryptBadLoggedAt = 0;
  function looksEncrypted(doc) {
    let fp = '';
    try { fp = fontPrintOfDoc(doc); } catch (e) {}
    if (fp && fakeFonts.has(fp)) return false;
    const set = fp ? cipherByFont.get(fp) : null;
    if (!set || !set.size) return true;
    let els = [];
    try { els = [...doc.querySelectorAll('.font-cxsecret,[class*="cxsecret" i]')]; } catch (e) { return true; }
    let seen = 0;
    for (const el of els) {
      let txt = '';
      try { txt = el.textContent || ''; } catch (e) { continue; }
      seen += txt.length;
      for (const ch of txt) if (set.has(ch)) return true;
      if (seen > 4000) break;
    }
    return false;
  }
  function fontPrintOfDoc(doc) {
    if (!doc) return '';
    const docs = [doc];
    try { if (doc.defaultView && doc.defaultView.top && doc.defaultView.top.document !== doc) docs.push(doc.defaultView.top.document); } catch (e) {}
    for (const d of docs) {
      let hit = '';
      try {
        d.querySelectorAll('style').forEach((s) => {
          if (hit) return;
          const t = s.textContent || '';
          if (!/font-cxsecret|cxsecret/i.test(t)) return;
          const m = t.match(/base64,([\w\W]+?)['")]/);
          if (m && m[1].length > 2000) hit = m[1];
        });
      } catch (e) {}
      if (hit) return fnv(hit.slice(0, 6000) + '|' + hit.length);
    }
    return '';
  }
  const decryptCooldown = new Map();
  function decryptCooling(doc) {
    const t = decryptCooldown.get(doc);
    return !!(t && Date.now() - t < 3 * 60 * 1000);
  }
  const REPAIR_KEY = 'cx_fix_repair_v1';
  let repairCache = {};
  try { repairCache = JSON.parse(GM_getValue(REPAIR_KEY, '{}')) || {}; } catch (e) { repairCache = {}; }
  const REF_FAMS = ['Noto Sans SC', 'Noto Sans SC Medium', '思源黑体', 'Source Han Sans SC', 'Source Han Sans CN',
    'Noto Sans SC Regular', 'Noto Sans SC Bold', '思源黑体 CN', 'Noto Sans CJK SC', 'Source Han Sans',
    'Microsoft YaHei', 'DengXian', 'SimSun', 'SimHei', 'KaiTi', 'sans-serif'];
  const HAN_SANS = ['Noto Sans SC', 'Noto Sans SC Medium', 'Source Han Sans SC', 'Source Han Sans CN',
    '思源黑体', '思源黑体 CN', 'Noto Sans CJK SC', 'Source Han Sans'];
  const HAN_SERIF = ['Noto Serif SC', 'Source Han Serif SC', 'Source Han Serif SC Heavy', '思源宋体', 'Noto Serif CJK SC', 'SimSun'];
  let refOrderNow = null, encFontName = '';
  const FINE = 12, COARSE = 4, COLS = 64, CELL = 64, CHUNK = 512, SHORTLIST = 24;
  const ACCEPT_DIST_SAME = 0.13, ACCEPT_DIST_ALT = 0.095;
  const ACCEPT_STRONG_R = 0.78;
  const ACCEPT_LOOSE_R = 1.25;
  const ACCEPT_MARGIN = 0.80;
  let refSame = false;
  const accDist = () => (refSame ? ACCEPT_DIST_SAME : ACCEPT_DIST_ALT);
  const accStrong = () => accDist() * ACCEPT_STRONG_R;
  const accLoose = () => accDist() * ACCEPT_LOOSE_R;
  const ACCEPT_DIST = ACCEPT_DIST_SAME;
  const ACCEPT_STRONG = 0.085;
  const ENC_EM = 46, ENC_PEN_X = 4, ENC_BASE_Y = CELL - 12;
  const EM_TOP = 0.88, EM_BOT = 0.14;
  const PLAIN_DIST = 0.06;
  const REF_CHARS = (() => {
    const out = [];
    for (let cp = 0x4e00; cp <= 0x9fa5; cp++) out.push(String.fromCharCode(cp));
    for (let cp = 0x3000; cp <= 0x303f; cp++) out.push(String.fromCharCode(cp));
    for (let cp = 0xff01; cp <= 0xff5e; cp++) out.push(String.fromCharCode(cp));
    for (let cp = 0x20; cp <= 0x7e; cp++) out.push(String.fromCharCode(cp));
    return out.join('');
  })();
  let gCv = null, gCtx = null;
  function gCanvas(w, h) {
    if (!gCv) { gCv = document.createElement('canvas'); gCtx = gCv.getContext('2d', { willReadFrequently: true }); }
    if (gCv.width !== w) gCv.width = w;
    if (gCv.height !== h) gCv.height = h;
    return gCtx;
  }
  function gridOf(ink, w, h, minX, minY, bw, bh) {
    const fine = new Uint8Array(FINE * FINE);
    let mx = 0;
    for (let gy = 0; gy < FINE; gy++) {
      const sy0 = minY + Math.floor((gy * bh) / FINE);
      const sy1 = minY + Math.max(Math.floor(((gy + 1) * bh) / FINE), Math.floor((gy * bh) / FINE) + 1);
      for (let gx = 0; gx < FINE; gx++) {
        const sx0 = minX + Math.floor((gx * bw) / FINE);
        const sx1 = minX + Math.max(Math.floor(((gx + 1) * bw) / FINE), Math.floor((gx * bw) / FINE) + 1);
        let s = 0, n = 0;
        for (let y = sy0; y < sy1 && y < h; y++) for (let x = sx0; x < sx1 && x < w; x++) { s += ink[y * w + x]; n++; }
        const v = n ? Math.round(s / n) : 0;
        fine[gy * FINE + gx] = v;
        if (v > mx) mx = v;
      }
    }
    if (!mx) return null;
    for (let i = 0; i < fine.length; i++) fine[i] = Math.round((fine[i] * 255) / mx);
    const coarse = new Uint8Array(COARSE * COARSE);
    const step = FINE / COARSE;
    for (let cy = 0; cy < COARSE; cy++) for (let cx = 0; cx < COARSE; cx++) {
      let s = 0, n = 0;
      for (let y = 0; y < step; y++) for (let x = 0; x < step; x++) { s += fine[(cy * step + y) * FINE + cx * step + x]; n++; }
      coarse[cy * COARSE + cx] = Math.round(s / n);
    }
    return { fine, coarse };
  }
  function featsIn(data, stride, x0, y0, w, h) {
    let minX = w, minY = h, maxX = -1, maxY = -1, inkN = 0;
    const ink = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      const row = (y0 + y) * stride;
      for (let x = 0; x < w; x++) {
        const v = 255 - data[(row + x0 + x) * 4];
        if (v > 40) {
          ink[y * w + x] = v; inkN++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (inkN < 18 || maxX < 0) return null;
    const bw = maxX - minX + 1, bh = maxY - minY + 1;
    if (bw >= w - 1 && bh >= h - 1 && inkN > w * h * 0.18) return null;
    return gridOf(ink, w, h, minX, minY, bw, bh);
  }
  function emFeat(data, stride, penX, baselineY, em, imgW, imgH) {
    const x0 = Math.round(penX), w = Math.round(em);
    const y0 = Math.round(baselineY - EM_TOP * em), h = Math.round((EM_TOP + EM_BOT) * em);
    const ink = new Uint8Array(w * h);
    let inkN = 0, minX = w, minY = h, maxX = -1, maxY = -1;
    for (let y = 0; y < h; y++) {
      const sy = y0 + y;
      if (sy < 0 || sy >= imgH) continue;
      const row = sy * stride;
      for (let x = 0; x < w; x++) {
        const sx = x0 + x;
        if (sx < 0 || sx >= imgW) continue;
        const v = 255 - data[(row + sx) * 4];
        if (v > 40) {
          ink[y * w + x] = v; inkN++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (inkN < 18 || maxX < 0) return null;
    const bw = maxX - minX + 1, bh = maxY - minY + 1;
    if (bw >= w - 1 && bh >= h - 1 && inkN > w * h * 0.18) return null;
    return gridOf(ink, w, h, 0, 0, w, h);
  }
  const isCJK = (ch) => {
    const cp = String(ch || '').codePointAt(0);
    return cp >= 0x2e80 && cp <= 0x9fff || cp >= 0xf900 && cp <= 0xfaff || cp >= 0xff00 && cp <= 0xff60;
  };
  const GENERIC_FAMS = ['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'system-ui', '-apple-system'];
  function fontInstalled(fam) {
    try {
      const f0 = String(fam || '').trim();
      if (!f0) return false;
      if (GENERIC_FAMS.indexOf(f0.toLowerCase()) >= 0) return true;
      const c = gCanvas(120, 60);
      const sig = (f) => {
        c.fillStyle = '#fff'; c.fillRect(0, 0, 120, 60);
        c.fillStyle = '#000'; c.font = `46px ${f}`; c.textBaseline = 'alphabetic';
        c.fillText('国龘', 4, 48);
        const d = c.getImageData(0, 0, 120, 60).data;
        let h = 2166136261;
        for (let i = 0; i < d.length; i += 4) h = ((h ^ d[i]) * 16777619) >>> 0;
        return h;
      };
      const q = /^[A-Za-z0-9_-]+$/.test(f0) ? f0 : `"${f0}"`;
      return sig(q) !== sig('"__no_such_font_zz__"');
    } catch (e) { return true; }
  }
  function distOf(a, offA, b, offB, n) {
    let s = 0;
    for (let i = 0; i < n; i++) s += Math.abs(a[offA + i] - b[offB + i]);
    return s / (n * 255);
  }
  const refCache = {};
  async function refTableFor(fam, which = 'gb1', onp) {
    const ck = fam + '|' + which;
    if (refCache[ck]) return refCache[ck];
    const chars = which === 'full' ? REF_CHARS : REF_CHARS_SMALL;
    const n = chars.length;
    const fine = new Uint8Array(n * FINE * FINE), coarse = new Uint8Array(n * COARSE * COARSE);
    let got = 0;
    for (let base = 0; base < n; base += CHUNK) {
      const cnt = Math.min(CHUNK, n - base);
      const rows = Math.ceil(cnt / COLS);
      const c = gCanvas(COLS * CELL, rows * CELL);
      c.fillStyle = '#fff';
      c.fillRect(0, 0, COLS * CELL, rows * CELL);
      c.fillStyle = '#000';
      c.font = `46px "${fam}"`;
      c.textBaseline = 'alphabetic';
      for (let i = 0; i < cnt; i++) {
        c.fillText(chars[base + i], (i % COLS) * CELL + 4, Math.floor(i / COLS) * CELL + CELL - 12);
      }
      const data = c.getImageData(0, 0, COLS * CELL, rows * CELL).data;
      for (let i = 0; i < cnt; i++) {
        const gx0 = (i % COLS) * CELL, gy0 = Math.floor(i / COLS) * CELL;
        const ch = chars[base + i];
        const f = isCJK(ch)
          ? emFeat(data, COLS * CELL, gx0 + ENC_PEN_X, gy0 + ENC_BASE_Y, ENC_EM, COLS * CELL, rows * CELL)
          : featsIn(data, COLS * CELL, gx0, gy0, CELL, CELL);
        if (!f) continue;
        fine.set(f.fine, (base + i) * FINE * FINE);
        coarse.set(f.coarse, (base + i) * COARSE * COARSE);
        got++;
      }
      if (onp) onp(Math.min(1, (base + cnt) / n));
      await sleep(0);
    }
    refCache[ck] = { chars, fine, coarse, got, n, fam, which };
    return refCache[ck];
  }
  function encFeat(ch, encFam, fbFam) {
    const c = gCanvas(CELL, CELL);
    c.fillStyle = '#fff';
    c.fillRect(0, 0, CELL, CELL);
    c.fillStyle = '#000';
    c.font = fbFam ? `46px "${encFam}", "${fbFam}"` : `46px "${encFam}"`;
    c.textBaseline = 'alphabetic';
    c.fillText(ch, ENC_PEN_X, ENC_BASE_Y);
    const data = c.getImageData(0, 0, CELL, CELL).data;
    return isCJK(ch)
      ? emFeat(data, CELL, ENC_PEN_X, ENC_BASE_Y, ENC_EM, CELL, CELL)
      : featsIn(data, CELL, 0, 0, CELL, CELL);
  }
  function fontNameOf(b64) {
    try {
      const bin = atob(String(b64 || '').replace(/\s+/g, ''));
      const n = bin.length;
      const u8 = new Uint8Array(n);
      for (let i = 0; i < n; i++) u8[i] = bin.charCodeAt(i);
      const dv = new DataView(u8.buffer);
      if (u8[0] !== 0x00 || u8[1] !== 0x01 || u8[2] !== 0x00 || u8[3] !== 0x00) return null;
      const numTab = dv.getUint16(4);
      let off = -1, len = 0;
      for (let i = 0; i < numTab; i++) {
        const p = 12 + i * 16;
        const tag = String.fromCharCode(u8[p], u8[p + 1], u8[p + 2], u8[p + 3]);
        if (tag === 'name') { off = dv.getUint32(p + 8); len = dv.getUint32(p + 12); break; }
      }
      if (off < 0 || off + 6 > n) return null;
      const count = dv.getUint16(off + 2), strOff = off + dv.getUint16(off + 4);
      const got = {};
      for (let i = 0; i < count; i++) {
        const r = off + 6 + i * 12;
        if (r + 12 > n) break;
        const plat = dv.getUint16(r), nid = dv.getUint16(r + 6);
        const slen = dv.getUint16(r + 8), so = dv.getUint16(r + 10);
        if (nid !== 1 && nid !== 4 && nid !== 6) continue;
        const at = strOff + so;
        if (at + slen > n) continue;
        let s = '';
        if (plat === 3 || plat === 0) { for (let k = 0; k + 1 < slen; k += 2) s += String.fromCharCode(dv.getUint16(at + k)); }
        else { for (let k = 0; k < slen; k++) s += String.fromCharCode(u8[at + k]); }
        s = s.replace(/\0/g, '').trim();
        if (s && !got[nid]) got[nid] = s;
      }
      const full = got[4] || got[1] || '', ps = got[6] || '';
      return (full || ps) ? { full, ps, hint: `${full}${ps ? ' / ' + ps : ''}` } : null;
    } catch (e) { return null; }
  }
  const refMissSaid = {};
  function refOrderFor(nameInfo) {
    const hint = nameInfo ? `${nameInfo.full} ${nameInfo.ps}`.toLowerCase() : '';
    let head = null;
    if (/serif|宋|明朝|mincho|song/.test(hint)) head = HAN_SERIF;
    else if (/sans|黑|gothic|hei/.test(hint) || /source han|noto sans/.test(hint)) head = HAN_SANS;
    const list = (head || HAN_SANS).concat(REF_FAMS);
    const seen = {}, out = [];
    for (const f of list) if (!seen[f]) { seen[f] = 1; out.push(f); }
    const have = [], miss = [];
    for (const f of out) (fontInstalled(f) ? have : miss).push(f);
    if (miss.length && !refMissSaid[String(have[0] || 'none')]) {
      refMissSaid[String(have[0] || 'none')] = 1;
      addLog(`[字库] 参考字体：这些系统里没装（${miss.join('、')}）→ 改用「${have[0] || REF_FAMS[0]}」当参照`, 'info');
    }
    const picked = have.length ? have[0] : REF_FAMS[0];
    refSame = !!(head && head.indexOf(picked) >= 0);
    return have.length ? have : REF_FAMS;
  }
  function isGarbledText(s, minLen = 4) {
    const raw = String(s || '');
    const t = raw.replace(/[A-Za-z0-9\s【】\[\]（）()、，。？?！!：:；;]/g, '');
    if (t.length < minLen) return false;
    if (garbleScore(raw) >= 0.45) return false;
    let rare = 0;
    for (const ch of t) if (!COMMON_CHARS.includes(ch) && !COMMON_PUNCT.includes(ch)) rare++;
    return rare >= 2;
  }

  function looksCipher(s) {
    if (!lastCipherSet || !lastCipherSet.size) return false;
    for (const ch of String(s || '')) if (lastCipherSet.has(ch)) return true;
    return false;
  }

  function altsHint(text) {
    const keys = Object.keys(lastAlts || {});
    if (!keys.length) return '';
    const seen = new Set(String(text || ''));
    const lines = [];
    for (const ch of seen) {
      const alts = lastAlts[ch];
      if (alts && alts.length) lines.push(`${ch} → ${alts.join('/')}`);
      if (lines.length >= 40) break;
    }
    return lines.length ? `\n【怪字候选（按字形相似度排序，第一个最像；正确的字很可能就在里面）】\n${lines.join('\n')}` : '';
  }

  async function aiRawChat(sysText, userText, temp, modelOverride) {
    const preset = presetOf();
    if (!CFG.aiApi) { addLog('[字库] AI 接口地址是空的 → 没法还字', 'err'); return null; }
    if (preset.needKey && !String(CFG.aiKey || '').trim()) { addLog('[字库] 当前预设要密钥、还没填 → 没法还字', 'err'); return null; }
    let extra = {};
    if (CFG.aiExtraHeader) { try { extra = JSON.parse(CFG.aiExtraHeader) || {}; } catch (e) {} }
    const tmo = Math.max(5, Number(CFG.aiTimeout) || 40);
    const resp = await aiQueue(async () => {
      const maxRetry = aiRetryMax();
      for (let attempt = 0; ; attempt++) {
        await aiCooldownWait('上一次 AI 调用被限流');
        const r = await new Promise((resolve) => {
          try {
            GM_xmlhttpRequest({
              method: 'POST',
              url: CFG.aiApi,
              headers: Object.assign({ 'Content-Type': 'application/json' }, CFG.aiKey ? { Authorization: 'Bearer ' + CFG.aiKey } : {}, extra),
              data: JSON.stringify({
                model: modelOverride || CFG.aiModel || preset.model,
                temperature: Number.isFinite(temp) ? temp : 0,
                max_tokens: Math.max(1200, Number(CFG.aiMaxTokens) || 3000),
                messages: [{ role: 'system', content: sysText }, { role: 'user', content: userText }],
              }),
              timeout: tmo * 1000,
              onload: (res) => resolve({ status: Number(res.status) || 0, text: res.responseText || '' }),
              onerror: () => resolve({ status: 0, text: '' }),
              ontimeout: () => resolve({ status: -1, text: '' }),
            });
          } catch (e) { resolve({ status: 0, text: '' }); }
        });
        if (aiBusyStatus(r.status) && attempt < maxRetry) {
          const w = aiBackoffMs(attempt);
          setAiCooldown(w, `HTTP ${r.status}`);
          addLog(`[字库] AI 被限流（HTTP ${r.status}）→ 第 ${attempt + 1}/${maxRetry} 次重试，等 ${(w / 1000).toFixed(1)} 秒`, 'warn');
          continue;
        }
        return r;
      }
    });
    const raw = resp.text;
    if (!raw) {
      addLog(resp.status === -1
        ? `[字库] AI 超时（等了 ${tmo} 秒）→ 还字失败（这题先跳过）`
        : `[字库] AI 无响应/超时 → 还字失败（这题先跳过）`, 'err');
      return null;
    }
    try {
      const j = JSON.parse(raw);
      if (j.error) { addLog('[字库] AI 返回错误：' + String((j.error && j.error.message) || '').slice(0, 80), 'err'); return null; }
      const ch0 = (j.choices && j.choices[0]) || null;
      if (ch0 && ch0.finish_reason === 'length') addLog('[字库] AI 正文被截断（思考把 token 用光了）→ 结果可能不全', 'warn');
      const c = stripThink((ch0 && (ch0.message?.content ?? ch0.text)) || '');
      return c.trim() || null;
    } catch (e) { addLog('[字库] AI 响应不是合法 JSON：' + raw.slice(0, 60), 'err'); return null; }
  }

  function pickJsonObj(text) {
    const s = String(text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
    const i = s.indexOf('{'), j = s.lastIndexOf('}');
    if (i < 0 || j <= i) return null;
    try { return JSON.parse(s.slice(i, j + 1)); } catch (e) { return null; }
  }

  function sameSpotRatio(a, b) {
    const A = String(a || ''), B = String(b || '');
    const n = Math.max(A.length, B.length);
    if (!n) return 0;
    let same = 0;
    for (let i = 0; i < n; i++) if (A[i] === B[i]) same++;
    return same / n;
  }

  function keptPlainRatio(before, after) {
    const A = String(before || ''), B = String(after || '');
    let tot = 0, same = 0;
    for (let i = 0; i < A.length; i++) {
      const ch = A[i];
      if (!ch.trim()) continue;
      if (!(COMMON_CHARS.includes(ch) || COMMON_PUNCT.includes(ch))) continue;
      tot++;
      if (B[i] === ch) same++;
    }
    return tot ? same / tot : 1;
  }

  async function repairIfGarbled(stem, opts) {
    if (CFG.aiRepair === false) return null;
    const texts = (opts || []).map((o) => String((o && o.text) || ''));
    const badStem = isEncryptedStem(stem);
    const badOpts = texts.filter((t) => isGarbledText(t));
    const cipherLeft = looksCipher(stem) || texts.some((t) => looksCipher(t));
    if (!badStem && !badOpts.length && !cipherLeft) return null;
    const key = fnv(String(stem) + '|' + texts.join('|'));
    if (repairCache[key]) {
      const c = repairCache[key];
      addLog(`[字库] 这题乱码以前还过字（不重复问 AI）：${String(c.stem).slice(0, 26)}…`, 'info');
      return { stem: c.stem, opts: c.opts, cached: true };
    }
    addLog(`[字库] 题干/选项是字库乱码（题干可读度 ${Math.round(garbleScore(stem) * 100)}%，存疑候选 ${Object.keys(lastAlts || {}).length} 个）→ 让 AI 按上下文还字`, 'warn');
    const sys = '你是中文题库校对员。用户给的题目文字被网站「字体加密」弄坏了：一部分字被换成了形状相近的怪字，'
      + '但整句的上下文仍然完整。请按上下文（多半是高校教材/思政课的原文表述）把怪字还原成正确的汉字。'
      + '规则：① 只还字，不改标点、不增删词语、不重写句子；② 字数必须和原文一致（怪字也是字，别删别增）；'
      + '③ 选项个数必须和给的一模一样；④ 有候选字的优先从候选里挑（按字形相似度排序，第一个最像）；'
      + '⑤ 实在判断不了的字原样保留；⑥ 只输出 JSON，不要任何解释。';
    const usr = `【题干】${stem}\n【选项】${JSON.stringify(texts)}${altsHint(String(stem) + texts.join(''))}`
      + `\n只输出一行 JSON：{"stem":"还字后的题干","opts":["还字后的选项1","还字后的选项2"]}`;
    const content = await aiRawChat(sys, usr, 0);
    if (!content) return null;
    const j = pickJsonObj(content);
    const fixedStem = j && typeof j.stem === 'string' ? j.stem.trim() : '';
    const fixedOpts = j && Array.isArray(j.opts) ? j.opts.map((x) => String(x == null ? '' : x).trim()) : [];
    if (!fixedStem || fixedOpts.length !== texts.length) {
      addLog(`[字库] AI 还字结果不完整（题干 ${fixedStem ? '有' : '空'}、选项 ${fixedOpts.length}/${texts.length}）→ 这次不用它`, 'warn');
      return null;
    }
    const before = garbleScore(stem), after = garbleScore(fixedStem);
    const spot = sameSpotRatio(stem, fixedStem);
    const kept = keptPlainRatio(stem, fixedStem);
    if (after < GARBLE_MIN && after <= before + 0.1) {
      addLog(`[字库] 还字后还是读不通（可读度 ${Math.round(after * 100)}%）→ 不用它`, 'warn');
      return null;
    }
    if (kept < 0.5 || Math.abs(fixedStem.length - String(stem).length) > 5) {
      addLog(`[字库] AI 还字把原本正常的字也改了（正常字保留 ${Math.round(kept * 100)}%、长度 ${String(stem).length}→${fixedStem.length}）→ 不敢用（怕它自己编了道题）`, 'warn');
      return null;
    }
    addLog(`[字库] 还字成功（可读度 ${Math.round(before * 100)}% → ${Math.round(after * 100)}%，正常字保留 ${Math.round(kept * 100)}%，逐位相同 ${Math.round(spot * 100)}%）：${String(stem).slice(0, 18)}… → ${fixedStem.slice(0, 26)}`, 'ok');
    repairCache[key] = { stem: fixedStem, opts: fixedOpts, at: Date.now() };
    try { GM_setValue(REPAIR_KEY, JSON.stringify(repairCache)); } catch (e) {}
    return { stem: fixedStem, opts: fixedOpts };
  }

  const REF_CHARS_SMALL = (() => {
    let gb1 = '';
    try {
      const bytes = [];
      for (let hi = 0xb0; hi <= 0xf7; hi++) for (let lo = 0xa1; lo <= 0xfe; lo++) bytes.push(hi, lo);
      gb1 = new TextDecoder('gbk').decode(new Uint8Array(bytes)).replace(/\ufffd/g, '');
    } catch (e) {}
    const pun = '，。、；：？！“”‘’（）《》【】…—～·〈〉「」『』';
    let ascii = '';
    for (let cp = 0x21; cp <= 0x7e; cp++) ascii += String.fromCharCode(cp);
    return (gb1.length > 3000 ? gb1 : '') + pun + ascii;
  })();
  const lineFont = (encFam, fbFam) => (fbFam ? `46px "${encFam}", "${fbFam}"` : `46px "${encFam}"`);

  function featsLine(text, encFam, fbFam) {
    const str = String(text || '');
    if (!str) return [];
    const m = gCanvas(8, 8);
    m.font = lineFont(encFam, fbFam);
    m.textBaseline = 'alphabetic';
    const adv = [];
    for (const ch of str) adv.push(Math.max(2, m.measureText(ch).width));
    let total = 0;
    for (const w of adv) total += w;
    const PAD = 8, H = CELL;
    const W = Math.max(16, Math.min(6000, Math.ceil(total) + PAD * 2));
    const c = gCanvas(W, H);
    c.fillStyle = '#fff';
    c.fillRect(0, 0, W, H);
    c.fillStyle = '#000';
    c.font = lineFont(encFam, fbFam);
    c.textBaseline = 'alphabetic';
    c.fillText(str, PAD, H - 12);
    const data = c.getImageData(0, 0, W, H).data;
    const out = [];
    const arr = Array.from(str);
    let x = PAD;
    for (let i = 0; i < arr.length; i++) {
      if (isCJK(arr[i])) out.push(emFeat(data, W, x, H - 12, ENC_EM, W, H));
      else {
        const x0 = Math.max(0, Math.floor(x) - 3);
        const w = Math.min(Math.ceil(adv[i]) + 6, W - x0);
        out.push(w >= 4 ? featsIn(data, W, x0, 0, w, H) : null);
      }
      x += adv[i];
    }
    return out;
  }

  function bestMatch(q, ref) {
    const { chars, fine, coarse, n } = ref;
    const CN = COARSE * COARSE, FN = FINE * FINE;
    const idx = new Int32Array(SHORTLIST), cds = new Float32Array(SHORTLIST);
    let len = 0, worst = 1e9;
    for (let i = 0; i < n; i++) {
      const off = i * CN;
      let s = 0;
      for (let k = 0; k < CN; k++) s += Math.abs(q.coarse[k] - coarse[off + k]);
      const d = s / (CN * 255);
      if (len < SHORTLIST) {
        idx[len] = i; cds[len] = d; len++;
        if (len === SHORTLIST) { worst = 0; for (let k = 0; k < len; k++) if (cds[k] > worst) worst = cds[k]; }
      } else if (d < worst) {
        let wi = 0;
        for (let k = 1; k < len; k++) if (cds[k] > cds[wi]) wi = k;
        idx[wi] = i; cds[wi] = d;
        worst = 0;
        for (let k = 0; k < len; k++) if (cds[k] > worst) worst = cds[k];
      }
    }
    let b1 = 1e9, b2 = 1e9, bi = -1;
    for (let k = 0; k < len; k++) {
      const i = idx[k];
      const d = distOf(q.fine, 0, fine, i * FN, FN);
      if (d < b1) { b2 = b1; b1 = d; bi = i; }
      else if (d < b2) b2 = d;
    }
    return bi < 0 ? null : { ch: chars[bi], d1: b1, d2: b2 };
  }

  function matchTextNodes(textNodes, encFam, ref, maxLines = 160) {
    const votes = new Map(), dist = new Map(), plain = new Set();
    const stat = { lines: 0, cells: 0, hit: 0, loose: 0, bad: 0, dists: [], pairs: [] };
    for (const node of textNodes.slice(0, maxLines)) {
      const raw = String(node.nodeValue || '');
      if (!raw.trim()) continue;
      for (let off = 0; off < raw.length; off += 24) {
        const seg = raw.slice(off, off + 24);
        if (!seg.trim()) continue;
        const cells = featsLine(seg, encFam, ref.fam);
        stat.lines++;
        for (let i = 0; i < seg.length; i++) {
          const ch = seg[i];
          if (!ch.trim()) continue;
          const q = cells[i];
          stat.cells++;
          if (!q) { stat.bad++; continue; }
          const r = bestMatch(q, ref);
          if (!r) { stat.bad++; continue; }
          if (r.ch === ch && r.d1 <= PLAIN_DIST) { plain.add(ch); continue; }
          const vm = votes.get(ch) || new Map();
          vm.set(r.ch, (vm.get(r.ch) || 0) + 1);
          votes.set(ch, vm);
          const dv = dist.get(ch);
          if (!dv || r.d1 < dv[0]) dist.set(ch, [r.d1, r.d2]);
          const confident = r.d1 <= accDist() && r.d1 <= ACCEPT_MARGIN * r.d2;
          if (confident) {
            stat.hit++;
            if (stat.pairs.length < 8) stat.pairs.push(`${ch}→${r.ch}(${r.d1.toFixed(3)}/${r.d2.toFixed(3)})`);
          } else {
            stat.loose++;
            if (stat.pairs.length < 8) stat.pairs.push(`${ch}→?${r.ch}(${r.d1.toFixed(3)}/${r.d2.toFixed(3)})`);
          }
        }
      }
    }
    return { votes, dist, plain, stat };
  }

  function rankGlyphs(need, encFam, ref, topN = 3) {
    const { chars, fine, n } = ref;
    const FN = FINE * FINE;
    const out = new Map();
    const keep = Math.max(1, Math.min(topN, 8));
    const bd = new Float64Array(keep), bi = new Int32Array(keep);
    for (const ch of need) {
      const q = encFeat(ch, encFam, ref.fam);
      if (!q) { out.set(ch, null); continue; }
      for (let k = 0; k < keep; k++) { bd[k] = 1e9; bi[k] = -1; }
      for (let i = 0; i < n; i++) {
        const d = distOf(q.fine, 0, fine, i * FN, FN);
        if (d >= bd[keep - 1]) continue;
        let w = keep - 1;
        while (w > 0 && bd[w - 1] > d) { bd[w] = bd[w - 1]; bi[w] = bi[w - 1]; w--; }
        bd[w] = d; bi[w] = i;
      }
      const ranked = [];
      for (let k = 0; k < keep; k++) if (bi[k] >= 0) ranked.push({ ch: chars[bi[k]], d: bd[k] });
      out.set(ch, ranked);
    }
    return out;
  }

  async function askAiGarbled(question, opts, typeHint) {
    const preset = presetOf();
    if (!CFG.aiApi) return null;
    if (preset.needKey && !String(CFG.aiKey || '').trim()) return null;
    const sys = '你是中国高校思政课/马克思主义基本原理题库的答题助手。用户给的题干里有一部分字被网站'
      + '字体加密弄成了怪字（形状对但字不对），可整句大意与选项仍然可辨。请按上下文推断这道题在教材里的'
      + '原意，再从选项里选出最可能正确的那一项。\n'
      + '只输出一行 JSON：{"answer":"B","confidence":0-100,"why":"20 字以内依据"}；'
      + '选择题填选项字母（多选连写如 ACD），判断题填「正确」或「错误」。'
      + '因为题干有乱码，confidence 请如实反映把握（50 上下很正常，别硬写 90）。';
    const usr = aiUserPrompt(question, opts, typeHint)
      + '\n【重要】题干里有乱码字（怪字），请按大意作答，不要因为有个别怪字就说无法辨识。';
    const content = await aiRawChat(sys, usr, 0);
    if (!content) return null;
    const par = parseAiAnswer(content);
    if (!par || !par.ans) {
      addLog('[AI] 乱码题干这一轮没解析出答案 → 放弃这题', 'warn');
      return null;
    }
    if (Number(par.conf) < 35) {
      addLog(`[AI] 乱码题干作答置信度只有 ${Math.round(par.conf)} → 太虚，不采用`, 'warn');
      return null;
    }
    return par;
  }

  async function recognizeChars(need, encFam, maxFonts = 3) {
    const refs = [];
    const fams = (refOrderNow || REF_FAMS).slice();
    if (refSame) fams.length = Math.min(fams.length, 1);
    for (const fam of fams) {
      try {
        const ref = await refTableFor(fam, 'gb1');
        if (ref.got >= 500) refs.push(ref);
      } catch (e) {}
      if (refs.length >= maxFonts) break;
    }
    const map = new Map(), alts = {}, plain = new Set();
    const runner = new Map();
    const stat = { fonts: refs.length, perFont: [], rejects: [] };
    if (!refs.length) { need.forEach((ch) => { alts[ch] = []; }); return { map, runner, alts, plain, stat }; }
    const votes = new Map();
    for (const ref of refs) {
      const t0 = Date.now();
      const ranked = rankGlyphs(need, encFam, ref, 3);
      let plainHit = 0;
      ranked.forEach((list, ch) => {
        if (!list || !list.length) return;
        if (list[0].ch === ch && list[0].d <= PLAIN_DIST) { plain.add(ch); plainHit++; return; }
        const vm = votes.get(ch) || new Map();
        const runner = list[1] ? list[1].d : 9;
        list.forEach((x) => {
          if (!(x.d <= accLoose())) return;
          const cur = vm.get(x.ch) || { pt: 0, best: 9, hits: 0, sum: 0, ro: 9 };
          cur.pt += Math.max(0, 0.35 - Math.min(x.d, 0.35));
          cur.sum += x.d;
          cur.hits++;
          if (x.d < cur.best) cur.best = x.d;
          const ro = (x.ch === list[0].ch) ? runner : list[0].d;
          if (ro < cur.ro) cur.ro = ro;
          vm.set(x.ch, cur);
        });
        votes.set(ch, vm);
      });
      stat.perFont.push(`${ref.fam.split(' ')[0]}·${ref.got}字·${Date.now() - t0}ms`);
      if (plain.size) stat.perFont[stat.perFont.length - 1] += `(明文${plainHit})`;
    }
    votes.forEach((vm, ch) => {
      const ranked = [...vm.entries()].sort((a, b) => (b[1].pt - a[1].pt) || (a[1].sum - b[1].sum));
      const win = ranked[0];
      const b = win ? win[1] : null;
      const ok = !!(b && (b.best <= accStrong()
        || b.best <= accDist()
        || (b.best <= accLoose() && b.best <= ACCEPT_MARGIN * b.ro)));
      if (ok) map.set(ch, win[0]);
      else {
        alts[ch] = ranked.slice(0, 3).map(([c]) => c);
        if (stat.rejects && stat.rejects.length < 10) {
          stat.rejects.push(`${ch}→${win ? win[0] : '?'}（票均 ${win ? win[1].pt.toFixed(2) : '-'}，命中字体 ${win ? win[1].hits : 0}，最近距离 ${win ? win[1].best.toFixed(3) : '-'}，亚军距 ${win ? win[1].ro.toFixed(3) : '-'}）`);
        }
      }
      if (ranked[1]) runner.set(ch, ranked[1][0]); else if (win) runner.set(ch, win[0]);
    });
    need.forEach((ch) => { if (!map.has(ch) && !plain.has(ch) && !alts[ch]) alts[ch] = []; });
    return { map, runner, alts, plain, stat };
  }

  function votesToMap(res) {
    const map = new Map(), alts = {};
    res.votes.forEach((vm, ch) => {
      const ranked = [...vm.entries()].sort((a, b) => (b[1] - a[1]) || 0);
      const best = ranked[0] ? ranked[0][0] : null;
      const dv = res.dist.get(ch) || [9, 9];
      const top = ranked[0] ? ranked[0][1] : 0;
      const second = ranked[1] ? ranked[1][1] : 0;
      const conf = best && dv[0] <= accDist() && top >= second && (top > second || dv[0] <= accDist() * 0.7);
      if (conf) map.set(ch, best);
      else if (best) alts[ch] = ranked.slice(0, 3).map(([c]) => c);
    });
    return { map, alts };
  }

  function matchGlyphs(need, encFam, ref) {
    const { chars, fine, coarse, n } = ref;
    const CN = COARSE * COARSE, FN = FINE * FINE;
    const map = new Map();
    const stat = { hit: 0, blank: 0, loose: 0, plain: [], dists: [], pairs: [] };
    const idx = new Int32Array(SHORTLIST), cds = new Float32Array(SHORTLIST);
    for (const ch of need) {
      const q = encFeat(ch, encFam, ref.fam);
      if (!q) { stat.blank++; continue; }
      let len = 0, worst = 1e9;
      for (let i = 0; i < n; i++) {
        const off = i * CN;
        let s = 0;
        for (let k = 0; k < CN; k++) s += Math.abs(q.coarse[k] - coarse[off + k]);
        const d = s / (CN * 255);
        if (len < SHORTLIST) {
          idx[len] = i; cds[len] = d; len++;
          if (len === SHORTLIST) { worst = 0; for (let k = 0; k < len; k++) if (cds[k] > worst) worst = cds[k]; }
        } else if (d < worst) {
          let wi = 0;
          for (let k = 1; k < len; k++) if (cds[k] > cds[wi]) wi = k;
          idx[wi] = i; cds[wi] = d;
          worst = 0;
          for (let k = 0; k < len; k++) if (cds[k] > worst) worst = cds[k];
        }
      }
      let b1 = 1e9, b2 = 1e9, bi = -1;
      for (let k = 0; k < len; k++) {
        const i = idx[k];
        const d = distOf(q.fine, 0, fine, i * FN, FN);
        if (d < b1) { b2 = b1; b1 = d; bi = i; }
        else if (d < b2) b2 = d;
      }
      if (bi < 0) { stat.blank++; continue; }
      stat.dists.push(b1);
      const same = chars[bi] === ch;
      const good = b1 <= accDist() && b1 <= ACCEPT_MARGIN * b2;
      const plain = same && b1 <= PLAIN_DIST;
      if (plain) stat.plain.push(ch);
      else if (good) { map.set(ch, chars[bi]); stat.hit++; }
      else stat.loose++;
      if (stat.pairs.length < 8 && !plain) stat.pairs.push(`${ch}→${good ? chars[bi] : '?'}(${b1.toFixed(3)}/${b2.toFixed(3)})`);
    }
    return { map, stat };
  }

  function trialScore(map, textNodes) {
    let sum = 0, n = 0;
    for (const node of textNodes.slice(0, 60)) {
      const src = node.nodeValue || '';
      if (!src.trim()) continue;
      let out = '';
      for (const ch of src) out += map.get(ch) || ch;
      sum += garbleScore(out); n++;
    }
    return n ? sum / n : 0;
  }

  function trialGain(map, textNodes) {
    let wBefore = 0, wAfter = 0, wSum = 0;
    for (const node of textNodes.slice(0, 60)) {
      const src = node.nodeValue || '';
      const t = src.replace(/[A-Za-z0-9\s]/g, '');
      if (!t.length) continue;
      let out = '';
      for (const ch of src) out += map.get(ch) || ch;
      const w = t.length;
      wBefore += garbleScore(src) * w;
      wAfter += garbleScore(out) * w;
      wSum += w;
    }
    if (!wSum) return { before: 0, after: 0, gain: 0 };
    const b = wBefore / wSum, a = wAfter / wSum;
    return { before: b, after: a, gain: a - b };
  }

  function trialVerdict(map, runnerMap, textNodes) {
    const tg = trialGain(map, textNodes);
    const rg = runnerMap && runnerMap.size ? trialGain(runnerMap, textNodes) : { gain: -9, after: 0 };
    const margin = tg.gain - rg.gain;
    return {
      before: tg.before,
      after: tg.after,
      gain: tg.gain,
      runnerAfter: rg.after,
      runnerGain: rg.gain,
      margin,
      pass: tg.gain >= GAIN_MIN && margin >= GAIN_MARGIN,
    };
  }

  async function decryptDoc(doc) {
    if (!CFG.decrypt || !doc) return false;
    const forcedNow = decryptForce;
    decryptForce = false;
    if (!forcedNow && decryptCooling(doc)) return false;

    const docs = [doc];
    try { if (doc.defaultView && doc.defaultView.top && doc.defaultView.top.document !== doc) docs.push(doc.defaultView.top.document); } catch (e) {}
    let styleEl = null, b64 = '', where = '';
    for (const d of docs) {
      try {
        d.querySelectorAll('style').forEach((s) => {
          if (styleEl) return;
          const t = s.textContent || '';
          if (!/font-cxsecret|cxsecret/i.test(t)) return;
          const m = t.match(/base64,([\w\W]+?)['")]/);
          if (m && m[1].length > 2000) { styleEl = s; b64 = m[1]; where = d === doc ? '当前文档' : '顶层文档'; }
        });
      } catch (e) {}
    }
    if (!b64) {
      for (const d of docs) {
        try {
          d.querySelectorAll('link[href^="data:font"],style').forEach((s) => {
            if (b64) return;
            const t = (s.textContent || s.getAttribute('href') || '');
            const m = t.match(/base64,([\w\W]+?)['")]/);
            if (m && m[1].length > 2000 && /font|cxsecret/i.test(t.slice(0, 400))) { styleEl = s; b64 = m[1]; where = d === doc ? '当前文档' : '顶层文档'; }
          });
        } catch (e) {}
      }
    }
    if (!b64) { addLog('字库解密：没找到加密字体定义（页面可能未加密）', 'dim'); return false; }
    lastEncB64 = b64;
    const nameInfo = fontNameOf(b64);
    encFontName = nameInfo ? nameInfo.hint : '';
    refOrderNow = refOrderFor(nameInfo);
    if (nameInfo) addLog(`[字库] 加密字体自称「${nameInfo.hint}」→ 参考字体优先用「${refOrderNow[0]}」`, 'info');
    else addLog(`[字库] 读不出加密字体的字体名（name 表缺失）→ 按默认顺序试「${refOrderNow[0]}」`, 'warn');

    let els = [];
    try { els = [...doc.querySelectorAll('.font-cxsecret,[class*="cxsecret" i]')]; } catch (e) {
      els = [...doc.querySelectorAll('.font-cxsecret')];
    }
    if (!els.length) {
      try { els = [...doc.querySelectorAll('*')].filter((el) => /cxsecret/i.test(el.getAttribute('style') || '')); } catch (e) {}
    }
    if (!els.length) { addLog(`字库解密：找到字体（${where}，${Math.round(b64.length / 1024)}KB）但页面上没有加密文本节点`, 'dim'); return false; }
    if (!forcedNow && !looksEncrypted(doc)) {
      if (Date.now() - decryptBadLoggedAt > 60000) {
        decryptBadLoggedAt = Date.now();
        addLog(`字库解密：这 ${els.length} 处虽然挂着加密类，但里面一个密文字都没有（假加密）→ 直接跳过`, 'dim');
      }
      return false;
    }
    addLog(`字库解密：发现 ${els.length} 处加密文本（字体在${where}，${Math.round(b64.length / 1024)}KB），开始破解`, 'info');

    const textNodes = [];
    els.forEach((el) => {
      try {
        const w = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        while (w.nextNode()) if (w.currentNode.nodeValue.trim()) textNodes.push(w.currentNode);
      } catch (e) {}
    });
    if (!textNodes.length) return false;

    const codes = new Set();
    textNodes.forEach((n) => { for (const ch of n.nodeValue) if (ch.trim()) codes.add(ch); });
    const need = [...codes];
    if (need.length > 1200) { addLog('字库解密：本页待解字符过多，已跳过', 'warn'); return false; }

    let family = '';
    try {
      family = 'cxsecret-' + Date.now().toString(36);
      const ff = new FontFace(family, 'url(data:font/ttf;base64,' + b64 + ')');
      await ff.load();
      doc.fonts.add(ff);
      try {
        const topDoc = doc.defaultView && doc.defaultView.top && doc.defaultView.top.document;
        if (topDoc && topDoc !== doc && topDoc.fonts) {
          const ff2 = new FontFace(family, 'url(data:font/ttf;base64,' + b64 + ')');
          await ff2.load();
          topDoc.fonts.add(ff2);
        }
      } catch (e) {}
      await doc.fonts.ready;
      await sleep(200);
    } catch (e) { addLog('字库解密：字体加载失败 ' + e.message, 'warn'); return false; }

    const fp = fnv(b64.slice(0, 6000) + '|' + b64.length);
    let fmaps = {};
    try { fmaps = JSON.parse(GM_getValue(GLYPH_MAP_KEY, '{}')) || {}; } catch (e) {}
    const cached = fmaps[fp];
    const map = new Map();
    const plainSet = new Set((cached && cached.plain) || []);
    if (cached && cached.map) Object.keys(cached.map).forEach((k) => map.set(k, cached.map[k]));
    if (cached && cached.alts) lastAlts = cached.alts;
    const staleJudge = !!(cached && cached.bad && (cached.judge || 0) < DECRYPT_JUDGE_VER);
    if (cached && cached.bad && staleJudge && !forcedNow) {
      addLog('字库解密：发现一条旧版裁判留下的「认不准」记号（旧判据误杀过正确解密）→ 忽略它，重新认一次', 'info');
    }
    if (cached && cached.bad && !staleJudge && !forcedNow && Date.now() - cached.bad < 10 * 60 * 1000 && !map.size) {
      if (Date.now() - decryptBadLoggedAt > 60000) {
        decryptBadLoggedAt = Date.now();
        addLog(`字库解密：这个字体 ${Math.round((Date.now() - cached.bad) / 60000)} 分钟前试过、认不准（认出 ${cached.hit || 0}/${cached.need || '?'}，可读度 ${Math.round((cached.score || 0) * 100)}%）→ 先不重试（菜单「立刻重新认字」可强制再来）`, 'dim');
      }
      return false;
    }
    const todo = need.filter((ch) => !map.has(ch) && !plainSet.has(ch));
    let bestFam = (cached && cached.fam) || '';
    let wroteBadMarker = false;
    if (map.size) addLog(`字库解密：这个字体上次解过，缓存里已有 ${map.size} 个字（另有 ${plainSet.size} 个没加密）`, 'dim');
    if (todo.length) {
      const rec = await recognizeChars(todo, family);
      rec.plain.forEach((ch) => plainSet.add(ch));
      rec.map.forEach((v, k) => map.set(k, v));
      lastAlts = rec.alts || {};
      const vd = trialVerdict(map, rec.runner, textNodes);
      const sc = vd.after;
      addLog(`  · ${refSame ? '同源参考字体（加密字体自称与它同族，只信它一个）' : '多参考字体投票'}：${rec.stat.perFont.join(' / ')} → 认出 ${rec.map.size}/${todo.length}（存疑 ${Object.keys(lastAlts).length}，没加密 ${rec.plain.size}，可读度 ${Math.round(vd.before * 100)}% → ${Math.round(vd.after * 100)}%）`, vd.pass ? 'dim' : 'warn');
      if (Object.keys(lastAlts).length) {
        addLog(`  · 存疑字（候选留给「AI 还原乱码题」补）：${Object.entries(lastAlts).slice(0, 6).map(([k, v]) => `${k}→${v.join('/')}`).join('  ')}`, 'dim');
        if (rec.stat.rejects && rec.stat.rejects.length) addLog(`  · 没认下的原因：${rec.stat.rejects.slice(0, 6).join('；')}`, 'dim');
      }
      bestFam = refSame ? '同源单字体' : '多字体投票';
      addLog(`  · 裁判：冠军增益 ${(vd.gain * 100).toFixed(1)}% vs 亚军 ${(vd.runnerGain * 100).toFixed(1)}%（领先 ${(vd.margin * 100).toFixed(1)}%）→ ${vd.pass ? '采用' : '不采用'}`, vd.pass ? 'dim' : 'warn');
      if (!vd.pass) {
        addLog(`字库解密：认出来的字解不成人话（增益 ${Math.round(vd.gain * 100)}% < ${Math.round(GAIN_MIN * 100)}% 或领先亚军只有 ${Math.round(vd.margin * 100)}% < ${Math.round(GAIN_MARGIN * 100)}%）→ 这份映射不写缓存，10 分钟内也不再自动重试（菜单「立刻重新认字」可强制再来）`, 'warn');
        fmaps[fp] = { bad: Date.now(), judge: DECRYPT_JUDGE_VER, hit: rec.map.size, need: todo.length, score: sc, gain: vd.gain, margin: vd.margin, fam: bestFam };
        wroteBadMarker = true;
        try { GM_setValue(GLYPH_MAP_KEY, JSON.stringify(fmaps)); } catch (e) {}
      } else {
        fmaps[fp] = { judge: DECRYPT_JUDGE_VER, fam: bestFam, map: Object.fromEntries(map), plain: [...plainSet], alts: lastAlts, gain: vd.gain, margin: vd.margin };
        try { GM_setValue(GLYPH_MAP_KEY, JSON.stringify(fmaps)); } catch (e) {}
      }
    }
    if (!map.size) {
      let allTxt = '';
      try { allTxt = els.map((el) => el.textContent || '').join(''); } catch (e) {}
      if (allTxt && garbleScore(allTxt) >= GARBLE_MIN) {
        fakeFonts.add(fp);
        addLog(`字库解密：这 ${els.length} 处挂着加密类、但文字本来就是通顺的（可读度 ${Math.round(garbleScore(allTxt) * 100)}%）→ 判定为「假加密」，记下这个字体，之后不再为它白跑`, 'dim');
      } else {
        addLog('字库解密：一个字都没认出来 → 保持原样（AI 看到的还是乱码，去诊断页跑「字库解密自检」）', 'err');
      }
      decryptCooldown.set(doc, Date.now());
      return false;
    }
    if (map.size / need.length < 0.5) addLog(`字库解密：只认出 ${map.size}/${need.length} 个字，其余保持乱码（宁可乱码，也不换成错别字骗 AI）`, 'warn');

    registerCipherSet(fp, new Set(need.filter((ch) => !plainSet.has(ch))));

    let replaced = 0, partial = 0, skipped = 0, worse = 0, charsTotal = 0, charsDone = 0;
    els.forEach((el) => {
      const nodes = [];
      try {
        const w = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        while (w.nextNode()) if (w.currentNode.nodeValue.trim()) nodes.push(w.currentNode);
      } catch (e) {}
      if (!nodes.length) return;
      let all = 0, ok = 0, bad = 0;
      nodes.forEach((n) => {
        for (const ch of n.nodeValue) {
          if (!ch.trim()) continue;
          all++;
          if (map.has(ch)) ok++;
          else if (!plainSet.has(ch)) bad++;
        }
      });
      charsTotal += all;
      charsDone += ok;
      if (!all || !ok) { skipped++; return; }
      const outs = nodes.map((n) => {
        let out = '';
        for (const ch of n.nodeValue) out += map.get(ch) || ch;
        return out;
      });
      const beforeScore = garbleScore(nodes.map((n) => n.nodeValue).join(''));
      const afterScore = garbleScore(outs.join(''));
      if (afterScore + 0.02 < beforeScore) { worse++; return; }
      nodes.forEach((n, i) => { n.nodeValue = outs[i]; });
      try {
        if (!bad) {
          el.classList.remove('font-cxsecret');
          if (el.style && /cxsecret/i.test(el.style.fontFamily || '')) el.style.fontFamily = '';
        }
      } catch (e) {}
      if (bad) partial++;
      replaced++;
    });
    addLog(`字库解密完成：替换 ${replaced} 段（认出 ${map.size}/${need.length} 字，覆盖 ${charsDone}/${charsTotal} 个字符，另有 ${plainSet.size} 个字本来就没加密，参考字体「${bestFam}」）${partial ? `；其中 ${partial} 段还有没认出的字（留着乱字，交给「AI 还原乱码题」补）` : ''}${skipped ? `；${skipped} 段一个字都没认出，保持原样` : ''}${worse ? `；${worse} 段解出来还不如原文，已丢弃（宁可乱码也不给 AI 错别字）` : ''}`, 'ok');
    if (!wroteBadMarker && (map.size || plainSet.size)) {
      try {
        fmaps[fp] = Object.assign({}, fmaps[fp], { map: Object.fromEntries(map), plain: [...plainSet], alts: lastAlts, fam: bestFam });
        GM_setValue(GLYPH_MAP_KEY, JSON.stringify(fmaps));
      } catch (e) {}
    }
    return true;
  }

  const R = (ok, guessed = false) => ({ ok, guessed });
  const TYPE_NAME = { multi: '多选题', single: '单选题', judge: '判断题', fill: '填空题', essay: '简答题' };
  const LETTERS = 'ABCDEFGHIJ';

  function pickAnswerInputs(node) {
    if (!node) return [];
    let all = [];
    try { all = [...node.querySelectorAll('input')]; } catch (e) { return []; }
    return all.filter((i) => {
      const t = (i.getAttribute('type') || '').toLowerCase();
      return t !== 'hidden' && t !== 'text' && t !== 'button' && t !== 'submit' && t !== 'file';
    });
  }

  function guessQuestionNodes(doc) {
    const out = [];
    try {
      const inputs = [...doc.querySelectorAll('input[type=radio],input[type=checkbox]')];
      const byName = new Map();
      inputs.forEach((i) => {
        const k = i.name || ('_n' + (i.parentElement ? [...(i.parentElement.children || [])].indexOf(i) : 0));
        if (!byName.has(k)) byName.set(k, []);
        byName.get(k).push(i);
      });
      byName.forEach((list) => {
        if (list.length < 2) return;
        let box = list[0].parentElement, hop = 0;
        while (box && hop < 6) {
          const t = (box.innerText || '').trim();
          if (t.length > 10 && box.querySelectorAll('input').length >= list.length) break;
          box = box.parentElement; hop++;
        }
        if (box && !out.some((x) => x === box || x.contains(box))) out.push(box);
      });
    } catch (e) {}
    if (!out.length) {
      try {
        for (const el of doc.querySelectorAll('div,li,section,ul,dl')) {
          const kids = [...el.children];
          if (kids.length < 2 || kids.length > 8) continue;
          let hits = 0;
          for (const k of kids) {
            const t = (k.innerText || k.textContent || '').trim();
            if (/^[A-Ha-h][.、．)）:：]/.test(t) || /^(对|错|正确|错误|是|否)$/.test(t)) hits++;
          }
          if (hits < 2) continue;
          const parent = el.parentElement || el;
          if ((parent.innerText || '').trim().length < 8) continue;
          if (!out.some((x) => x === parent || x.contains(parent))) out.push(parent);
        }
      } catch (e) {}
    }
    const res = out.filter((el, i) => !out.some((o, j) => j !== i && o !== el && o.contains(el)));
    return res;
  }

  function logQuizStructure(doc) {
    try {
      const cand = [];
      const seen = new Set();
      doc.querySelectorAll('div,section,li,ul,form,table').forEach((el) => {
        const t = (el.innerText || el.textContent || '').trim();
        if (t.length < 12 || t.length > 1200) return;
        const kids = [...el.children];
        if (!kids.length) return;
        let letterKids = 0, inputKids = 0;
        for (const k of kids) {
          const kt = (k.innerText || k.textContent || '').trim();
          if (/^[A-Ha-h][.、．)）:：]/.test(kt) || /^(对|错|正确|错误)$/.test(kt)) letterKids++;
          inputKids += k.querySelectorAll('input').length;
        }
        if (letterKids < 2 && inputKids < 2) return;
        const sig = (el.tagName + '.' + (typeof el.className === 'string' ? el.className : '')).slice(0, 70);
        if (seen.has(sig)) return;
        seen.add(sig);
        cand.push({ sig, kids: kids.slice(0, 4).map((k) => (k.tagName + '.' + String(typeof k.className === 'string' ? k.className : '')).slice(0, 40)), text: t.slice(0, 40).replace(/\s+/g, ' ') });
      });
      if (!cand.length) { addLog('结构兜底：这个文档里找不到任何「像题目」的区块（可能还没渲染）', 'dim'); return; }
      addLog(`结构兜底：找到 ${cand.length} 个可疑题目区块，请把下面这几行发我（我用它加选择器）`, 'warn');
      cand.slice(0, 6).forEach((c) => addLog(`  · ${c.sig} ｜ 子级：${c.kids.join(' / ')} ｜ 文本：${c.text}`, 'dim'));
    } catch (e) {}
  }

  function pickQuestionNodes(doc, kind) {
    const sels = kind === 'zj'
      ? ['.TiMu', '.timu', '[class*="TiMu"]', '.q-main', '.Zy_TItle']
      : kind === 'ks'
        ? ['.questionLi', '.q-main', '.TiMu', '[class*="questionLi"]', '[class*="question-li"]']
        : ['#body .q-main', '.TiMu', '.questionLi', '[class*="q-main"]', '[class*="TiMu"]'];
    for (const s of sels) {
      try {
        const list = [...doc.querySelectorAll(s)].filter((n) => {
          if (txt(n).length <= 4) return false;
          const inputs = n.querySelectorAll('input[type=radio],input[type=checkbox]').length;
          const textarea = n.querySelector('textarea');
          const opts = n.querySelectorAll('[class*="answer"],[class*="before-after"],li,label').length;
          return !!(inputs || textarea || opts > 1);
        });
        if (list.length) { addLog(`题目容器命中 ${s} → ${list.length} 题`, 'info'); return list; }
      } catch (e) {}
    }
    const guess = guessQuestionNodes(doc);
    if (guess.length) {
      addLog(`题目容器不认识（选择器全落空）→ 按「选项组」结构兜底认出 ${guess.length} 题`, 'warn');
      return guess;
    }
    return [];
  }

  async function waitQuestions(doc, kind, timeout = 8000) {
    const t0 = Date.now();
    addLog('题目容器暂未出现，等待渲染…', 'info');
    while (Date.now() - t0 < timeout) {
      await sleep(600);
      const list = pickQuestionNodes(doc, kind);
      if (list.length) return list;
    }
    return [];
  }

  const QUIZ_TEXT_SEL = '.TiMu,.timu,[class*="TiMu"],.questionLi,.q-main,.Zy_TItle,[class*="questionLi"]';
  const QUIZ_SUBMITTED_TEXT = /本次成绩|我的答案|作答记录|已交卷/;
  const QUIZ_IFRAME_RE = /api\/work|exam-ans|(\/|\.)(work|exam|quiz|test|homework)(\/|\.|$)/i;
  const quizDoneKeys = new Set();
  const quizFlowInFlight = new Map();
  const quizFlowActiveDocs = new Set();
  const quizFlowStartedAt = new Map();
  let quizFlowQueue = Promise.resolve();
  const QUIZ_FLOW_MAX_MS = 720000;
  const quizFlowBusy = () => {
    for (const d of [...quizFlowActiveDocs]) {
      let connected = false;
      try { connected = !!(d && d.documentElement && d.documentElement.isConnected); } catch (e) {}
      if (!connected) { quizFlowActiveDocs.delete(d); quizFlowInFlight.delete(d); quizFlowStartedAt.delete(d); continue; }
      const t0 = quizFlowStartedAt.get(d) || 0;
      if (t0 && Date.now() - t0 > QUIZ_FLOW_MAX_MS) {
        addLog('测验答题/提交流程超过 12 分钟还没收尾（可能网络挂起）→ 释放它，让主循环继续', 'err');
        quizFlowActiveDocs.delete(d); quizFlowInFlight.delete(d); quizFlowStartedAt.delete(d);
      }
    }
    return quizFlowActiveDocs.size > 0;
  };
  const quizFlowDocCurrent = (doc) => {
    try {
      if (!doc || !doc.documentElement || !doc.documentElement.isConnected) return false;
      if (doc === document) return true;
      const frame = doc.defaultView && doc.defaultView.frameElement;
      return !!(frame && frame.isConnected && frame.contentDocument === doc);
    } catch (e) { return false; }
  };
  const noQuizTries = new Map();
  const quizLive = { total: 0, answered: 0, at: 0, note: '' };
  let quizPageKey = '';
  let quizRetry = null;

  function looksSubmitted(doc) {
    let t = '';
    try { t = txt((doc && (doc.body || doc.documentElement)) || {}); } catch (e) { return false; }
    return QUIZ_SUBMITTED_TEXT.test(t);
  }

  function blankRiskNow(doc) {
    try {
      if (!doc) return '拿不到这一页的文档';
      const qs = pickQuestionNodes(doc, '').length;
      const inputs = [...doc.querySelectorAll('input[type=radio],input[type=checkbox]')];
      const checked = inputs.filter((i) => i.checked).length;
      const tas = [...doc.querySelectorAll('textarea')].filter((t) => String(t.value || '').trim().length > 2).length;
      let picked = 0;
      try {
        const opts = [...doc.querySelectorAll('li,label,[class*="answer"],[class*="option"],[class*="before-after"]')];
        picked = opts.filter((o) => {
          try { if (typeof isPicked === 'function' && isPicked(o)) return true; } catch (e) {}
          const c = typeof o.className === 'string' ? o.className : '';
          if (/check_answer|(^|\s)(on|active|checked|selected)(\s|$)/.test(c)) return true;
          try {
            const inner = o.querySelector('[class*="check_answer"],[class*="on"],.active,.selected');
            if (inner && /check_answer|(^|\s)(on|active|selected)(\s|$)/.test(String(inner.className || ''))) return true;
          } catch (e) {}
          return false;
        }).length;
      } catch (e) {}
      const filled = Math.max(picked, checked + tas);
      const answered = Number(lastAnswerStat && lastAnswerStat.answered) || 0;
      if (!qs) return '这一页现在读不到题目（可能还没渲染出来 / 任务点刚切换）';
      if (!filled) return `读到 ${qs} 道题，但这一页一个选项都没选上、也没有填过填空（答案可能填到别的文档去了）`;
      if (answered > filled) return `按答题记录该填 ${answered} 个，这一页却只数到 ${filled} 个（有几次点选没生效）`;
      return null;
    } catch (e) { return null; }
  }

  function quizSyncPage(k) {
    if (k && k !== quizPageKey) { quizPageKey = k; quizDoneKeys.clear(); quizSavedInfo = null; }
  }
  const quizKeyOf = (doc) => quizPageKey + '#' + String((doc && doc.URL) || '') + '|' + String((doc && doc.title) || '');
  const quizFrameKey = (src) => quizPageKey + '#' + String(src || '') + '|';

  function quizPending(doc) {
    let nodes = [];
    try { nodes = [...(doc.querySelectorAll ? doc.querySelectorAll(QUIZ_TEXT_SEL) : [])]; } catch (e) { return null; }
    nodes = nodes.filter((n) => {
      try {
        if (txt(n).length <= 10) return false;
        const inputs = n.querySelectorAll('input[type=radio],input[type=checkbox]').length;
        const opts = n.querySelectorAll('[class*="answer"],[class*="before-after"],li,label').length;
        return !!(inputs || opts > 1);
      } catch (e) { return false; }
    });
    if (!nodes.length) return null;
    if (quizDoneKeys.has(quizKeyOf(doc))) return null;
    if (looksSubmitted(doc)) return null;
    return { count: nodes.length };
  }

  function markQuizDone(doc, why) {
    try {
      quizDoneKeys.add(quizKeyOf(doc));
      const fe = doc && doc.defaultView && doc.defaultView.frameElement;
      if (fe && fe.src) quizDoneKeys.add(quizFrameKey(fe.src));
      addLog(`本页测验已处理完（${why}）→ 不再拿它挡跳转`, 'dim');
    } catch (e) {}
  }

  let lastAnswerStat = { total: 0, answered: 0, known: 0 };
  let quizSavedInfo = null;
  let encSkipCount = 0;
  const quizRecheck = new Set();
  function scheduleQuizRecheck(doc, win, kind) {
    let key = '';
    try { key = quizKeyOf(doc); } catch (e) { key = String(Math.random()); }
    if (quizRecheck.has(key)) return;
    quizRecheck.add(key);
    setTimeout(() => {
      quizRecheck.delete(key);
      try {
        if (!doc || !doc.documentElement || !doc.documentElement.isConnected) return;
        if (looksSubmitted(doc)) return;
        const n = doc.querySelectorAll(QUIZ_TEXT_SEL).length;
        if (!n) return;
        addLog(`刚才没读到题目，现在出来了（${n} 道）→ 补答一轮`, 'info');
        submitWorkFlow(doc, win, kind);
      } catch (e) {}
    }, 12000);
  }

  function pickStartButton(doc) {
    try {
      return [...doc.querySelectorAll('a,button,span,div')].find((b) => {
        const t = txt(b);
        return t.length > 0 && t.length <= 10 && /^(开始答题|开始测验|开始考试|开始做题|进入答题)$/.test(t);
      }) || null;
    } catch (e) { return null; }
  }

  function extractQuestion(node, kind) {
    let stem = '';
    const stemSels = kind === 'zj'
      ? ['.fontLabel', '.Zy_TItle', 'h3', '.mark_name', '.q-title', '.colorShallow']
      : ['h3', '.mark_name', '.q-title', '.fontLabel', '.Zy_TItle', '.colorShallow', 'p'];
    for (const s of stemSels) {
      const e = node.querySelector(s);
      const t = e ? txt(e) : '';
      if (t.length > 1 && hasCJK(t)) { stem = t; break; }
    }
    if (!stem) {
      const raw = txt(node).replace(/\s+/g, ' ').trim();
      const cut = raw.search(/[？?]/);
      stem = cut >= 0 && cut < 200 ? raw.slice(0, cut + 1) : raw.slice(0, 160);
    }
    if (CFG.plainStem) stem = plainStem(stem);

    let opts = [];
    const stripOptPrefix = (s) => String(s || '')
      .replace(/^[\s　]*([A-Za-z]|\d{1,2})\s*[.、．)）:：]\s*/, '')
      .replace(/^[\s　]*([A-Za-z]|\d{1,2})[\s　]+(?=[\u4e00-\u9fa5(（"“])/, '')
      .trim();
    const mapOpt = (o) => {
      const t = o.querySelector('.fl.after') || o.querySelector('.answer_p')
        || o.querySelector('label') || o.querySelector('span') || o;
      const inner = t === o ? '' : txt(t);
      const text = stripOptPrefix(inner && inner.length > 1 ? inner : txt(o));
      let cursor = null;
      try { cursor = o.querySelector('label') || o.querySelector('input'); } catch (e) {}
      return { text, el: o, cursor: cursor || o };
    };

    const optSels = kind === 'zj'
      ? ['[class*="before-after"]', '[class*="answerBg"]', '[class*="answer_p"]', '[class*="option"]', 'li', 'label']
      : ['.answerBg', '.answer_p', '[class*="option"]', 'li', 'label'];
    for (const s of optSels) {
      let list = [];
      try { list = [...node.querySelectorAll(s)]; } catch (e) { continue; }
      const outer = list.filter((o) => !list.some((p) => p !== o && p.contains(o)));
      const mapped = (outer.length >= 2 ? outer : list).map(mapOpt).filter((o) => o.text);
      if (mapped.length >= 2) { opts = mapped; break; }
    }
    if (!opts.length) {
      let inputs = [];
      try { inputs = pickAnswerInputs(node); } catch (e) {}
      opts = inputs.map((inp) => {
        let el = inp.closest('label');
        if (!el) {
          let p = inp.parentElement, hop = 0;
          while (p && hop < 3 && !txt(p)) { p = p.parentElement; hop++; }
          el = p || inp.parentElement;
        }
        return { text: txt(el), el: el || inp, cursor: inp };
      }).filter((o) => o.text);
    }
    return { stem, opts };
  }

  function optText(o) {
    if (typeof o === 'string') return o;
    if (!o) return '';
    return String(o.text != null ? o.text : (o.label != null ? o.label : ''));
  }
  function looksJudge(opts) {
    if (!opts || opts.length !== 2) return false;
    const pos = /^(对|正确|是|√|✓|t|true|right|正确的)$/i;
    const neg = /^(错|错误|否|×|✗|x|f|false|wrong|不正确的)$/i;
    let hit = 0;
    for (const o of opts) {
      const t = normalizeOptionMatchText(optText(o));
      if (pos.test(t) || neg.test(t)) hit++;
    }
    return hit === 2;
  }

  function inferType(node, opts, inputs, ta) {
    if (ta) return /简答|论述|问答/.test(node ? txt(node) : '') ? 'essay' : 'fill';
    const raw = node ? txt(node) : '';
    const lt = labelType(raw);

    const list = inputs ? [...inputs] : [];
    if (list.length) {
      const kinds = new Set(list.map((i) => (i.getAttribute('type') || '').toLowerCase()));
      if (kinds.has('checkbox')) return 'multi';
      if (lt === 'judge' || looksJudge(opts)) return 'judge';
      if (kinds.has('radio')) return 'single';
      if (lt === 'multi') return 'multi';
      if (lt === 'single') return 'single';
      if (list.length >= 2) return 'multi';
    }

    if (opts.length >= 2) {
      if (lt === 'multi' || /多选题/.test(raw)) return 'multi';
      if (lt === 'judge' || looksJudge(opts)) return 'judge';
      return 'single';
    }
    if (lt === 'judge') return 'judge';
    if (/判断题|正确|错误/.test(raw)) return 'judge';
    return lt || 'single';
  }

  const W_MARK = 'data-cxw';
  const isWritten = (n) => !!(n && n.getAttribute && n.getAttribute(W_MARK));
  const CXV = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'OPTION']);

  function isPicked(el) {
    if (!el) return false;
    try {
      if (!isWritten(el) && el.checked === true) return true;
      if (!isWritten(el) && el.getAttribute && el.getAttribute('aria-checked') === 'true') return true;
      const cls = typeof el.className === 'string' ? el.className : '';
      if (/(^|[\s\-_])(cur|checked|selected|active|on)([\s\-_]|$)/i.test(cls)) return true;
      if (el.getAttribute && isPickedMark(el.getAttribute('class') || '')) return true;
      const inp = el.querySelector && el.querySelector('input');
      if (inp && inp.checked === true && !isWritten(inp)) return true;
    } catch (e) {}
    return false;
  }


  function attrSig(el) {
    let s = '';
    try {
      const at = el.attributes;
      for (let i = 0; i < at.length; i++) {
        const n = at[i].name;
        if (n === 'style' || n.slice(0, 2) === 'on' || n === 'id') continue;
        s += `${n}=${String(at[i].value).slice(0, 60)};`;
      }
    } catch (e) {}
    return s;
  }

  function stateSig(el) {
    if (!el || el.nodeType !== 1) return '';
    let out = '';
    try {
      out += attrSig(el);
      const inp = el.querySelector && el.querySelector('input');
      if (inp) out += `|inp.checked=${inp.checked}|inp.dis=${inp.disabled}`;
      const kids = el.querySelectorAll ? el.querySelectorAll('*') : [];
      const n = Math.min(kids.length, 14);
      for (let i = 0; i < n; i++) out += `|${elSig(kids[i])}`;
    } catch (e) {}
    return out;
  }

  let PICK_MARKS = null;
  try { PICK_MARKS = JSON.parse(GM_getValue('cx_fix_pickmarks_v1', '') || 'null'); } catch (e) { PICK_MARKS = null; }

  function hasPickHint() { return !!(PICK_MARKS && PICK_MARKS.marks && PICK_MARKS.marks.length); }

  const PICKCLS = /(^|[\s\-_])(cur|checked|selected|active|on)([\s\-_]|$)/i;

  function isPickedToken(m) {
    const s = String(m || '');
    if (!s) return false;
    if (/(^|[\s\-_.])checked([\s\-_.]|$)/i.test(s)) return true;
    if (s.indexOf('aria-checked=true') >= 0) return true;
    const parts = s.split('.');
    for (let i = 1; i < parts.length; i++) if (PICKCLS.test(parts[i])) return true;
    if (parts.length === 1 && PICKCLS.test(s)) return true;
    return false;
  }

  function isPickedMark(sig) {
    const m = PICK_MARKS && PICK_MARKS.marks;
    if (!m || !m.length) return false;
    const segs = String(sig || '').split('|').map((s) => String(s).replace(/\n/g, ' '));
    for (const k of m) {
      const t = String(k).trim();
      if (!t) continue;
      const want = t.replace(/\n/g, ' ');
      if (!segs.some((s) => s.indexOf(want) >= 0)) return false;
    }
    return true;
  }

  function elSig(n) {
    const cls = typeof n.className === 'string' ? n.className : '';
    return `${String(n.tagName || '').toUpperCase()}#class=${cls.replace(/\s+/g, ' ').trim()};`;
  }

  function markOf(el) {
    const out = [];
    if (!el) return out;
    try {
      const all = [el, ...(el.querySelectorAll ? el.querySelectorAll('*') : [])];
      for (const n of all) {
        const cls = typeof n.className === 'string' ? n.className : '';
        if (cls.split(/\s+/).filter(Boolean).some((c) => PICKCLS.test(c))) out.push(elSig(n));
        const ac = n.getAttribute && n.getAttribute('aria-checked');
        if (ac === 'true' && !isWritten(n)) out.push(`${String(n.tagName || '').toUpperCase()}#aria-checked=true`);
        if (n.tagName === 'INPUT' && n.checked && !isWritten(n)) out.push('INPUT#checked=true');
      }
    } catch (e) {}
    return [...new Set(out)];
  }

  function optionCandidates(el) {
    const cands = [];
    const push = (x) => { if (x && x.nodeType === 1 && cands.indexOf(x) < 0) cands.push(x); };
    try {
      push(el.querySelector('label'));
      push(el.querySelector('input'));
      push(el.querySelector('[class*="before-after"],[class*="answer_p"],[class*="check"],[class*="radio"],[class*="icon"]'));
      push(el.querySelector('i,em,span,a'));
    } catch (e) {}
    push(pickerOf(el));
    push(el);
    return cands;
  }

  function clickTarget(t) {
    try { click(t); } catch (e) {}
    try { if (t.click) t.click(); } catch (e) {}
    try {
      const inp = (CXV.has(t.tagName) ? t : (t.querySelector && t.querySelector('input')));
      if (inp && !CXV.has(inp.tagName)) return;
      if (inp && inp.checked !== true) {
        try { if (inp.focus) inp.focus(); } catch (e) {}
        inp.checked = true;
        try { inp.setAttribute('checked', 'checked'); } catch (e) {}
        try { inp.setAttribute(W_MARK, '1'); } catch (e) {}
        for (const ev of ['input', 'change', 'click']) {
          try { inp.dispatchEvent(new MouseEvent(ev === 'click' ? 'click' : ev, { bubbles: true, cancelable: true })); } catch (e) {}
        }
      }
    } catch (e) {}
  }

  function pickedNow(el, baseSig, want) {
    if (!el) return false;
    const sure = isPickedAny(el) || (hasPickHint() && isPickedMark(stateSig(el)));
    if (sure) return !!want;
    if (want === false) return true;
    return !!baseSig && stateSig(el) !== baseSig;
  }

  function isPickedAny(el) {
    if (isPicked(el)) return true;
    try { for (const s of el.querySelectorAll('*')) { if (isPicked(s)) return true; } } catch (e) {}
    return false;
  }

  function verifyPicked(el, cursor, want = true) {
    const targets = [cursor, el].filter(Boolean);
    const base = targets.map((t) => stateSig(t));
    const allOk = () => targets.every((t, i) => pickedNow(t, base[i], want));
    if (allOk()) return true;
    for (const t of targets) {
      if (clickAtPoints(t, () => pickedNow(t, stateSig(t), want))) return true;
    }
    for (const t of optionCandidates(el)) {
      if (clickAtPoints(t, () => pickedNow(t, stateSig(t), want))) return true;
    }
    return false;
  }

  function clickPointOn(t, x, y) {
    const base = { bubbles: true, cancelable: true, composed: true, view: (t.ownerDocument && t.ownerDocument.defaultView) || window, clientX: x, clientY: y, button: 0 };
    const seq = ['pointerover', 'pointerenter', 'mouseover', 'mouseenter', 'pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'];
    for (const type of seq) {
      try {
        const Ctor = type.indexOf('pointer') === 0 && typeof window.PointerEvent === 'function' ? window.PointerEvent : window.MouseEvent;
        t.dispatchEvent(new Ctor(type, base));
      } catch (e) {}
    }
  }

  function clickAtPoints(t, onAfter) {
    if (!t || t.nodeType !== 1) return false;
    const rect = t.getBoundingClientRect ? t.getBoundingClientRect() : null;
    const pts = [];
    if (rect && rect.width > 0 && rect.height > 0) {
      pts.push([rect.left + rect.width / 2, rect.top + rect.height / 2]);
      pts.push([rect.left + Math.min(12, rect.width / 2), rect.top + rect.height / 2]);
      pts.push([rect.left + 4, rect.top + rect.height / 2]);
      try {
        for (const k of t.querySelectorAll('*')) {
          const r = k.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) pts.push([r.left + r.width / 2, r.top + r.height / 2]);
        }
      } catch (e) {}
    }
    pts.push(null);
    for (const p of pts) {
      if (p) clickPointOn(t, p[0], p[1]);
      else clickTarget(t);
      if (onAfter && onAfter()) return true;
    }
    return false;
  }

  function pickerOf(el) {
    if (!el) return null;
    try {
      return (el.matches && el.matches('input,label,span,li,a') ? el : null)
        || el.querySelector('input') || el.querySelector('label')
        || el.querySelector('[class*="check"],[class*="radio"],[class*="before"]') || el;
    } catch (e) { return el; }
  }

  function forcePick(el, want = true) {
    if (!el) return false;
    if (want === true && isPickedAny(el)) return true;
    if (want === false && !isPickedAny(el)) return true;

    const before = stateSig(el);
    const beforeMarks = markOf(el);
    const hit = verifyPicked(el, el, want);
    if (!hit) {
      try {
        const inp = el.querySelector && el.querySelector('input');
        addLog(`  ↳ 点选${want ? '' : '取'}消回读失败：class="${String(el.className || '').slice(0, 44)}" 子元素=${el.children ? el.children.length : 0} 内部input=${inp ? (inp.checked ? 'checked' : 'unchecked') : '无'}`, 'warn');
      } catch (e) {}
      return false;
    }
    if (want) { try { learnMarks(el, beforeMarks); } catch (e) {} }
    return true;
  }

  function learnMarks(el, beforeMarks) {
    const base = beforeMarks || [];
    const got = markOf(el).filter((m) => base.indexOf(m) < 0);
    if (!got.length) return;
    PICK_MARKS = PICK_MARKS || { marks: [], hits: 0 };
    PICK_MARKS.marks = [...new Set([...(PICK_MARKS.marks || []), ...got])];
    PICK_MARKS.hits = (PICK_MARKS.hits || 0) + 1;
    try { GM_setValue('cx_fix_pickmarks_v1', JSON.stringify(PICK_MARKS)); } catch (e) {}
  }

  async function probePickOptions() {
    const docs = [document];
    try { walkIframes(document.documentElement).forEach((f) => { try { if (f.contentDocument) docs.push(f.contentDocument); } catch (e) {} }); } catch (e) {}
    let node = null, opts = [];
    for (const d of docs) {
      let nodes = pickQuestionNodes(d, 'zj');
      if (!nodes.length) nodes = pickQuestionNodes(d, 'ks');
      if (nodes.length) { node = nodes[0]; opts = extractQuestion(node, 'zj').opts; if (!opts.length) opts = extractQuestion(node, 'ks').opts; break; }
    }
    if (!opts.length) { addLog('探针：当前页没有选项可测（先点进测验页）', 'warn'); return false; }

    addLog(`===== 点选探针：第 1 题的 ${opts.length} 个选项 =====`, 'info');
    addLog(`点的目标一览：${opts.map((o, i) => `${LETTERS[i] || i + 1}[${o.cursor ? o.cursor.tagName.toLowerCase() : '?'}${o.cursor && o.cursor.className ? '.' + String(o.cursor.className).trim().split(/\s+/)[0] : ''}]`).join(' ')}`, 'dim');

    const base = opts.map((o) => stateSig(o.el));
    const probe = opts[0];
    let worked = false;
    for (const t of optionCandidates(probe.el)) {
      const tb = stateSig(t);
      addLog(`尝试点击：${t.tagName.toLowerCase()}${t.className ? '.' + String(t.className).trim().split(/\s+/).join('.') : ''}`, 'dim');
      const at = Date.now();
      clickAtPoints(t, null);
      await sleep(320);
      const s = stateSig(t);
      const changed = s !== tb;
      const nowPicked = pickedNow(probe.el, base[0], true);
      addLog(`  → DOM${changed ? '变了' : '没变'}｜读作已选中=${nowPicked ? '是' : '否'}｜耗时 ${Date.now() - at}ms`, changed ? 'ok' : 'dim');
      if (changed) {
        for (const m of markOf(probe.el)) addLog(`  → 选中后出现的标记：${m}`, 'ok');
        worked = true;
        break;
      }
    }
    if (!worked) addLog('所有候选点都没让第 1 个选项发生变化 → 严格按子元素坐标点击，或平台状态在伪元素上', 'warn');

    if (opts[1]) { for (const t of optionCandidates(opts[1].el)) { clickAtPoints(t, null); await sleep(200); } }
    addLog(`当前已学会的选中标记：${PICK_MARKS && PICK_MARKS.marks && PICK_MARKS.marks.length ? PICK_MARKS.marks.join(' / ') : '（还没有）'}`, 'info');
    addLog('===== 探针结束：把上面几行发我即可定位 =====', 'info');
    return worked;
  }

  const CALIBRATED = new Set();
  async function calibratePicks(node, opts) {
    const key = (node && node.ownerDocument && node.ownerDocument.URL) || 'doc';
    if (CALIBRATED.has(key) || !opts || opts.length < 2) return false;
    CALIBRATED.add(key);
    for (const o of opts) if (isPicked(o.el)) return false;

    const probe = opts[0];
    const bm = markOf(probe.el);
    const b = stateSig(probe.el);
    const hitMarks = [];
    for (const t of optionCandidates(probe.el)) {
      const tb = stateSig(t);
      if (clickAtPoints(t, () => pickedNow(t, tb, true) || pickedNow(probe.el, b, true))) {
        for (const m of markOf(probe.el)) if (bm.indexOf(m) < 0) hitMarks.push(m);
        break;
      }
    }
    await sleep(500);

    if (hitMarks.length) {
      PICK_MARKS = PICK_MARKS || { marks: [], hits: 0 };
      PICK_MARKS.marks = [...new Set([...(PICK_MARKS.marks || []), ...hitMarks])];
      PICK_MARKS.hits = (PICK_MARKS.hits || 0) + 1;
      try { GM_setValue('cx_fix_pickmarks_v1', JSON.stringify(PICK_MARKS)); } catch (e) {}
      addLog(`已学会选中态标记：${hitMarks.join(' / ')}`, 'ok');
    } else if (stateSig(probe.el) !== b) {
      addLog('点选标定：点后 DOM 变了但看不出具体标记（靠「点前后对比」继续判断）', 'dim');
    } else {
      addLog('点选标定：点第一个选项后 DOM 无变化（平台可能把状态画在伪元素/画布上）', 'dim');
    }

    if (isPickedAny(probe.el) || stateSig(probe.el) !== b) {
      const alt = opts[1];
      const doneOff = alt && (forcePick(alt.el, false) || optionCandidates(alt.el).some((t) => clickAtPoints(t, () => !pickedNow(t, stateSig(t), true))));
      if (!doneOff) optionCandidates(probe.el).some((t) => clickAtPoints(t, () => !pickedNow(t, stateSig(t), true)));
      await sleep(200);
      if (isPickedAny(probe.el)) addLog('点选标定：试探的选中态没能撤销（会多点亮一项，正式答题时会覆盖它）', 'warn');
    }
    return true;
  }

  function applyAnswer(ctx, answer) {
    const { node, opts, inputs, ta, win, kind } = ctx;
    const type = inferType(node, opts, inputs, ta);
    let hits = 0, lost = 0;
    let denom = (answer || []).length;

    const R2 = (ok, guessed = false) => {
      addLog(`  ↳ 判定「${TYPE_NAME[type] || type}」${hits ? ` · 命中 ${hits}/${denom} 个答案` : ''}${lost ? ` · ${lost} 个点了没生效` : ''}${ok ? '' : ' · 未能填写'}`, lost ? 'warn' : 'dim');
      return { ok, guessed, type, hits, lost };
    };

    if (!answer || !answer.length) return R2(false);

    try {
      if (type === 'judge') {
        let val = judgeValueLoose(answer[0]);
        if (val === null) val = judgeValueLoose(answer.join(' '));
        if (val !== null) {
          const idx = judgePickIndex(opts, val);
          if (idx >= 0) {
            const o = opts[idx];
            const okStuck = verifyPicked(o.el, o.cursor);
            if (!okStuck) lost++;
            hits = 1;
            return R2(true);
          }
        }
        if (val === null) {
          const lettersOnly = String(answer[0] || '').replace(/[^A-Za-z]/g, '').toUpperCase();
          const i = lettersOnly ? 'ABCDEFGH'.indexOf(lettersOnly[0]) : -1;
          if (i >= 0 && opts[i]) {
            const okStuck = verifyPicked(opts[i].el, opts[i].cursor);
            if (!okStuck) lost++;
            addLog(`  ↳ 模型的判断答案「${String(answer[0]).slice(0, 12)}」不像对/错 → 按首字母取第 ${i + 1} 项`, 'warn');
            hits = 1;
            return R2(true);
          }
        }
        if (val === null) return R2(false);
        if (kind === 'ks') {
          const t = node.querySelector(`span[data='${val}']`);
          if (t) { verifyPicked(t) || forcePick(t); hits = 1; return R2(true); }
        }
        for (const l of [...node.querySelectorAll('span,li,label')]) {
          const al = l.getAttribute('aria-label') || '';
          if (val ? /对选择|正确|是/.test(al) : /错选择|错误|否/.test(al)) { verifyPicked(l) || forcePick(l); hits = 1; return R2(true); }
        }
        const hit = findMatchedOption(opts, val ? '正确' : '错误');
        if (hit) { if (!verifyPicked(hit.el, hit.cursor)) lost++; hits = 1; return R2(true); }
        return R2(false);
      }

      if (type === 'fill' || type === 'essay') {
        if (!ta) return R2(false);
        const name = ta.name || ta.id;
        const ue = win.UE && name && win.UE.getEditor && win.UE.getEditor(name);
        if (ue && ue.setContent) { ue.setContent(answer.join('\n')); hits = 1; return R2(true); }
        ta.value = answer.join('\n');
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        ta.dispatchEvent(new Event('change', { bubbles: true }));
        hits = 1;
        return R2(true);
      }

      let ansList = answer;
      if (type === 'single' && answer.length > 1) {
        ansList = [answer[0]];
        denom = 1;
        addLog(`  ↳ 这是单选题，答案给了 ${answer.length} 个（${answer.join('、').slice(0, 30)}）→ 只取第一个「${String(answer[0]).slice(0, 16)}」`, 'warn');
      }
      for (const a of ansList) {
        const hit = findMatchedOption(opts, a);
        if (!hit) { addLog(`  ↳ 答案「${String(a).slice(0, 20)}」没匹配到任何选项`, 'warn'); continue; }
        const okStuck = verifyPicked(hit.el, hit.cursor);
        if (!okStuck) lost++;
        else if (hit.how && hit.how !== '相似度') addLog(`  ↳ 「${String(a).slice(0, 16)}」按${hit.how}命中第 ${opts.indexOf(hit.el) + 1} 项`, 'dim');
        hits++;
      }
      if (type === 'single') {
        const keep = ansList.map((a) => findMatchedOption(opts, a)).filter(Boolean).map((h) => h.el);
        for (const o of opts) {
          if (keep.indexOf(o.el) >= 0) continue;
          if (isPickedAny(o.el)) { forcePick(o.el, false); addLog('  ↳ 单选清理：关掉了多余的点亮项', 'dim'); }
        }
      }
      if (hits) return R2(true);
      if (opts.length) {
        const longest = opts.slice().sort((x, y) => (y.text || '').length - (x.text || '').length)[0];
        if (longest && longest.el) { forcePick(longest.el); hits = 1; return R2(true, true); }
      }
      return R2(false);
    } catch (e) { addLog('填答异常：' + e.message, 'err'); return R2(false); }
  }

  function expandAnswer(answer, type, opts) {
    if (answer == null) return [];
    if (!Array.isArray(answer)) answer = [String(answer)];
    if (!answer.length) return answer;
    if (type !== 'single' && type !== 'multi') return answer;

    const out = [];
    for (const item of answer) {
      const s = String(item || '').trim();
      if (!s) continue;
      const compact = s.replace(/[\s,，、;；]+/g, '').toUpperCase();
      if (compact.length > 1 && compact.length <= opts.length && /^[A-Z]+$/.test(compact)) {
        const chs = [...compact].filter((c) => LETTERS.indexOf(c) >= 0 && LETTERS.indexOf(c) < opts.length);
        if (chs.length >= 2) {
          addLog(`  ↳ 答案是字母串「${s}」→ 拆成 ${chs.length} 个选项`, 'dim');
          for (const c of chs) out.push(opts[LETTERS.indexOf(c)].text);
          continue;
        }
      }
      out.push(item);
    }
    const seen = new Set();
    return out.filter((x) => {
      const k = normalize(String(x));
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  function selfTest() {
    const results = [];
    const ok = (name, cond, extra) => results.push({ name, pass: !!cond, extra: extra || '' });
    const EQUIV = { 错: '错误', 对: '正确', F: '错误', T: '正确', '×': '错误', '√': '正确', false: '错误', true: '正确' };
    const eqv = (v) => {
      const s = v == null ? 'null' : String(v);
      return EQUIV[s] !== undefined ? EQUIV[s] : s;
    };
    const chk = (label, got, want) => {
      const g = eqv(got), w = eqv(want);
      ok(label, g === w, g === w ? g : `${g} vs ${w}`);
    };

    const mkOpts = (texts) => texts.map((t, i) => ({ text: t, el: { _i: i }, cursor: { _i: i } }));
    const O4 = mkOpts(['现代化只能在经济发达地区率先实现', '不同阶段的现代化目标完全相同', '每个五年规划独立运作、互不关联', '现代化通过五年规划接续推进、逐步积累']);
    const O4m = mkOpts(['群众组织力', '思想引领力', '政治领导力', '社会号召力']);
    const O2 = mkOpts(['正确', '错误']);

    try {

    chk('expandAnswer "ACD" → 3 个选项', expandAnswer(['ACD'], 'multi', O4m).length, 3);
    chk('expandAnswer "A、C" → 2 个选项', expandAnswer(['A、C'], 'multi', O4m).length, 2);
    chk('expandAnswer 已是文本 → 不拆', expandAnswer(['群众组织力'], 'multi', O4m).length, 1);
    chk('expandAnswer 单选题 "B" → 1 个', expandAnswer(['B'], 'single', O4m).length, 1);
    const m3 = expandAnswer(['ACD'], 'multi', O4m);
    chk('  拆分内容正确', m3.join('/'), '群众组织力/政治领导力/社会号召力');
    chk('expandAnswer 去重', expandAnswer(['A', 'A'], 'multi', O4m).length, 1);
    chk('expandAnswer 传字符串「正确」→ 1 条', expandAnswer('正确', 'single', O2).length, 1);
    chk('  且内容没被拆字', expandAnswer('正确', 'single', O2).join('|'), '正确');
    chk('expandAnswer 传字符串「ACD」→ 3 条', expandAnswer('ACD', 'multi', O4m).length, 3);
    chk('expandAnswer null → 空数组', expandAnswer(null, 'single', O2).length, 0);

    chk('匹配：字母 D → 第 4 项', findMatchedOption(O4, 'D').el._i, 3);
    chk('匹配：字母 D 的方式', findMatchedOption(O4, 'D').how, '选项字母');
    chk('匹配：完整文本 → 相似度', findMatchedOption(O4, '现代化通过五年规划接续推进、逐步积累').el._i, 3);
    chk('匹配：前缀 → 包含', findMatchedOption(O4, '现代化只能在经济发达地区').el._i, 0);
    chk('匹配：判断题文本', findMatchedOption(O2, '错误').el._i, 1);
    chk('匹配：空答案 → null', findMatchedOption(O4, ''), null);

    chk('归一化 对 → 正确', normalizeJudge('对'), '正确');
    chk('归一化 错误 → 错误', normalizeJudge('错误'), '错误');
    chk('归一化 true → 正确', normalizeJudge('true'), '正确');
    chk('归一化 乱写 → null', normalizeJudge('不知道'), null);

    chk('标签【多选题】', labelType('【多选题】党的（）显著增强'), 'multi');
    chk('标签（单选题）', labelType('（单选题）实现社会主义现代化…'), 'single');
    chk('标签【判断题】', labelType('【判断题】新时代党的建设…'), 'judge');
    chk('题干清洗剥标签', plainStem('【单选题】实现社会主义现代化是一个过程'), '实现社会主义现代化是一个过程');

    const fakeInput = (t) => ({ getAttribute: () => t });
    chk('推断：无type+2个input → multi', inferType(null, O4, [fakeInput(null), fakeInput(null)], null), 'multi');
    chk('推断：checkbox → multi', inferType(null, O4, [fakeInput('checkbox'), fakeInput('checkbox')], null), 'multi');
    chk('推断：radio → single', inferType(null, O4, [fakeInput('radio'), fakeInput('radio')], null), 'single');
    chk('推断：有 textarea → fill', inferType(null, O2, [], {}), 'fill');
    chk('推断：对/错 两选项 → judge', inferType(null, O2, [], null), 'judge');
    chk('推断：对/错 两选项 + radio → judge', inferType(null, O2, [fakeInput('radio'), fakeInput('radio')], null), 'judge');
    chk('推断：正确/错误 两选项 → judge', inferType(null, [{ text: '正确' }, { text: '错误' }], [], null), 'judge');
    chk('推断：两选项但不是判断词 → single', inferType(null, [{ text: '发展路径' }, { text: '政治优势' }], [], null), 'single');
    chk('looksJudge：对/错', looksJudge([{ text: '对' }, { text: '错' }]), true);
    chk('looksJudge：三个选项 → 不算', looksJudge([{ text: '对' }, { text: '错' }, { text: '不知道' }]), false);
    chk('选项归一化去 "A." 前缀', normalizeOptionMatchText('A. 对'), '对');
    chk('选项归一化去空白', normalizeOptionMatchText(' 正 确 '), '正确');
    chk('函数存在：normalizeOptionMatchText', typeof normalizeOptionMatchText, 'function');
    chk('函数存在：looksJudge', typeof looksJudge, 'function');
    chk('判断题映射：想要「对」→ 下标 0', judgePickIndex([{ text: '对' }, { text: '错' }], true), 0);
    chk('判断题映射：想要「错」→ 下标 1', judgePickIndex([{ text: '对' }, { text: '错' }], false), 1);
    chk('判断题映射：选项带前缀「A 对」也能认', judgePickIndex([{ text: 'A 对' }, { text: 'B 错' }], true), 0);
    chk('判断题映射：正确/错误 也能认', judgePickIndex([{ text: '正确' }, { text: '错误' }], false), 1);
    chk('判断题映射：两者都不是 → -1', judgePickIndex([{ text: '发展路径' }, { text: '政治优势' }], true), -1);
    chk('字母 A → 对', judgeLetterValue('A'), true);
    chk('字母 B → 错', judgeLetterValue('B'), false);
    chk('字母 T → 对', judgeLetterValue('T'), true);
    chk('字母 F → 错', judgeLetterValue('F'), false);
    chk('「正确」→ 对', judgeLetterValue('正确'), true);
    chk('「×」→ 错', judgeLetterValue('×'), false);
    chk('宽松判断：不正确的是 → 错', judgeValueLoose('不正确的是'), false);
    chk('宽松判断：说法错误 → 错', judgeValueLoose('该说法错误'), false);
    chk('宽松判断：是正确的 → 对', judgeValueLoose('是正确的'), true);
    chk('宽松判断：ACD → 认不出（由首字母兜底）', judgeValueLoose('ACD'), null);
    chk('函数存在：judgeValueLoose（宽松判断值）', typeof judgeValueLoose, 'function');

    const fakeNode = (tag, cls) => ({ tagName: tag, className: cls });
    chk('elSig 格式', elSig(fakeNode('span', 'answer_p on')), 'SPAN#class=answer_p on;');
    chk('elSig 空白折叠', elSig(fakeNode('li', 'a   b')), 'LI#class=a b;');
    chk('isPicked 认 .on', isPicked({ className: 'answer_p on', getAttribute: () => null, querySelector: () => null }), true);
    chk('isPicked 不误判 .online', isPicked({ className: 'online', getAttribute: () => null, querySelector: () => null }), false);
    chk('未标定时 isPickedMark 恒 false', isPickedMark('SPAN#class=answer_p on;'), false);

    const fakeIframe = { closest: () => null, parentElement: null };    const d0 = doneInfo(fakeIframe, { querySelector: () => null });
    chk('未开始的媒体 → 不跳过', d0.score >= 4, false);
    const dFull = doneInfo(fakeIframe, { querySelector: () => ({ duration: 100, currentTime: 100, ended: true }) });
    chk('播完的媒体 → 跳过', dFull.score >= 3, true);
    const dPart = doneInfo(fakeIframe, { querySelector: () => ({ duration: 100, currentTime: 5, ended: false }) });
    chk('只播了5%→ 不跳过', dPart.score >= 4, false);

    const qdoc = document.implementation.createHTMLDocument('quiz-' + Math.random().toString(36).slice(2));
    qdoc.body.innerHTML = '<div class="TiMu"><div class="fontLabel">【单选题】中国特色社会主义最本质的特征是（）</div>'
      + '<div class="answerBg"><span class="answer_p"><input type="radio" name="a">A 人民代表大会制度</span>'
      + '<span class="answer_p"><input type="radio" name="a">B 中国共产党的领导</span></div></div>';
    chk('quizPending 认出没答完的题', (quizPending(qdoc) || {}).count, 1);
    markQuizDone(qdoc, '自检');
    chk('markQuizDone 之后不再算没做完', quizPending(qdoc), null);
    const dDone = document.implementation.createHTMLDocument('done');
    dDone.body.innerHTML = '<div class="TiMu"><div>【单选题】题目题目题目题目题目题目</div>'
      + '<input type="radio"><input type="radio"></div><div>本次成绩：0 分</div>';
    chk('已交卷/看成绩的页面不算没做完', quizPending(dDone), null);
    chk('函数存在：quizWork', typeof Jump.quizWork, 'function');
    chk('函数存在：workState', typeof Jump.workState, 'function');
    chk('函数存在：retryQuiz', typeof retryQuiz, 'function');
    chk('函数存在：scheduleQuizRecheck', typeof scheduleQuizRecheck, 'function');
    chk('上一轮答题战果有 total 字段（空卷保护用）', typeof lastAnswerStat.total, 'number');
    const dNoRes = document.implementation.createHTMLDocument('nores');
    dNoRes.body.innerHTML = '<div>提示：当前章节还有任务点未完成，是否去完成？</div><div>已完成</div><div>待批阅</div>';
    chk('只有「已完成/待批阅」→ 不算结果页', looksSubmitted(dNoRes), false);
    const dRes = document.implementation.createHTMLDocument('res');
    dRes.body.innerHTML = '<div>本次成绩 33.3 分</div>';
    chk('有「本次成绩」→ 结果页', looksSubmitted(dRes), true);
    const dRes2 = document.implementation.createHTMLDocument('res2');
    dRes2.body.innerHTML = '<div>我的答案：A</div>';
    chk('有「我的答案」→ 结果页', looksSubmitted(dRes2), true);
    chk('函数存在：resolveAndGo（一键交卷并跳下一节）', typeof resolveAndGo, 'function');
    chk('函数存在：platformUnfinished（列出平台认为没做完的任务点）', typeof Jump.platformUnfinished, 'function');
    chk('函数存在：explainBlock（卡住时说清原因）', typeof Jump.explainBlock, 'function');
    chk('暂存原因字段存在（卡住原因）', typeof quizSavedInfo, 'object');
    chk('一键交卷能无视阈值（submitWorkFlow 收第 4 个参数 opts）', submitWorkFlow.length, 4);
    chk('函数存在：harvestFromResultPage（结果页抓标准答案）', typeof harvestFromResultPage, 'function');
    chk('函数存在：harvestNow（手动抓取入口）', typeof harvestNow, 'function');
    chk('复核开关有默认值', typeof CFG.aiVerify, 'boolean');
    chk('入库开关有默认值', typeof CFG.harvest, 'boolean');
    const dHarv = document.implementation.createHTMLDocument('harv');
    dHarv.body.innerHTML = '<div class="TiMu"><div class="fontLabel">【单选题】测试题干内容足够长的一段文字（）</div>'
      + '<div class="answerBg"><span class="answer_p">A 甲选项</span>'
      + '<span class="answer_p">B 乙选项</span></div>'
      + '<div class="colorShallow">正确答案：B</div></div>';
    chk('结果页能认出「正确答案：B」', /正确答案\s*[:：]\s*([A-Za-z])/.test(txt(dHarv.body)), true);
    chk('函数存在：optText（选项文字兼容字符串/对象）', typeof optText, 'function');
    chk('optText 收字符串', optText('对'), '对');
    chk('optText 收对象', optText({ text: '错' }), '错');
    chk('looksJudge 认字符串选项「对/错」（旧版传字符串全变 undefined）', looksJudge(['对', '错']), true);
    chk('looksJudge 认对象选项「正确/错误」', looksJudge([{ text: '正确' }, { text: '错误' }]), true);
    chk('判断题型推断：字符串「对/错」', inferType(null, ['对', '错'], [], null), 'judge');
    chk('兜底通道能答判断题（AI 没配好时的最后一道防线）', String(heuristicAnswer('中国共产党领导是中国特色社会主义最本质的特征', ['对', '错'], 'zj')), '正确');
    chk('明文判定线存在（超星只加密一部分字）', typeof PLAIN_DIST, 'number');
    chk('字形比对函数收参考字体当兜底', encFeat.length, 3);
    chk('正负例：没关键词的题干不硬猜', String(heuristicAnswer('这是一道普通的题', ['对', '错'], 'zj')), 'null');
    chk('函数存在：aiSysPrompt / aiUserPrompt', [typeof aiSysPrompt, typeof aiUserPrompt], ['function', 'function']);
    chk('函数存在：parseAiAnswer / firstJsonObject / voteAiRounds',
      [typeof parseAiAnswer, typeof firstJsonObject, typeof voteAiRounds], ['function', 'function', 'function']);
    chk('提示词按题型分（多选题强调漏选）', /漏选/.test(aiSysPrompt('multi')), true);
    chk('提示词带错误示例（防代码块）', /代码块/.test(aiSysPrompt('single')), true);
    chk('判断题提示词不许填字母', /不要填字母/.test(aiSysPrompt('judge')), true);
    chk('用户提示词带题型标记', /题型标记/.test(aiUserPrompt('题干', ['甲', '乙'], 'judge')), true);
    const pa1 = parseAiAnswer('```json\n{"answer":"b","confidence":"85%"}\n```');
    chk('解析：去 ```json 围栏 + answer 小写 + confidence 带 %', [pa1.ans, pa1.conf], ['b', 85]);
    const pa2 = parseAiAnswer('答案是 ACD 吧\n{"answer":["C","A","D"],"confidence":90,"why":"逐项"}');
    chk('解析：答案给数组 → 拼成字符串', pa2.ans, 'CAD');
    const pa3 = parseAiAnswer('{"answer":true,"confidence":70}');
    chk('解析：布尔 true → 正确', pa3.ans, '正确');
    const pa4 = parseAiAnswer('答案：ACD');
    chk('解析：非 JSON 兜底（「答案：ACD」）', pa4.ans, 'ACD');
    chk('firstJsonObject 不被后面的解释吞掉',
      String(firstJsonObject('前言 {"answer":"A"} 后面还有 {"x":1}').answer), 'A');
    const vr1 = voteAiRounds([{ ans: 'A', conf: 65, why: '', type: 'multi' },
      { ans: 'ACD', conf: 92, why: '', type: 'multi' }, { ans: 'ACD', conf: 90, why: '', type: 'multi' }], false, ['甲', '乙', '丙', '丁']);
    chk('多轮投票：两轮 ACD 压过一轮 A → ACD', vr1.ans, 'ACD');
    const vr2 = voteAiRounds([{ ans: 'A', conf: 80, why: '', type: 'single' }, { ans: 'A', conf: 90, why: '', type: 'single' }], false, ['甲', '乙']);
    chk('多轮投票：一轮 A 一轮 B → 取多数（都选 A → A）', vr2.ans, 'A');
    const vr3 = voteAiRounds([{ ans: '正确', conf: 60, why: '', type: 'judge' }, { ans: '错误', conf: 90, why: '', type: 'judge' }], true, ['对', '错']);
    chk('多轮投票：判断题平票 → 取置信度高的一轮', vr3.ans, '错误');
    chk('投票轮数有默认值', typeof CFG.aiVotes, 'number');
    chk('预设表里有 GLM-4.7-Flash 且标为免费', /免费/.test(String((AI_PRESETS['glm-47-flash'] || {}).name)), true);
    chk('GLM-4.7-Flash 的模型名正确', String((AI_PRESETS['glm-47-flash'] || {}).model), 'glm-4.7-flash');
    chk('预设表里有免费推理模型 GLM-Z1-Flash', String((AI_PRESETS['glm-z1-flash'] || {}).model), 'glm-z1-flash');
    chk('默认预设是智谱 GLM-4-Flash', String(CFG_DEFAULTS.aiPreset), 'glm-flash');
    chk('默认模型是 glm-4-flash', String(CFG_DEFAULTS.aiModel), 'glm-4-flash');
    chk('默认地址指向智谱 bigmodel', /open\.bigmodel\.cn/.test(String(CFG_DEFAULTS.aiApi)), true);
    chk('预设表 glm-flash 条目标为免费', /免费/.test(String((AI_PRESETS['glm-flash'] || {}).name)), true);
    chk('配置版本号已打记号（老 glm-4-flash 会被自动迁移）', Number(CFG.cfgVer) >= 3, true);
    chk('默认 AI 超时够推理模型用（≥30 秒）', Number(CFG_DEFAULTS.aiTimeout) >= 30, true);
    chk('新开关存在：被挡住时替我交卷', typeof CFG.blockAutoSubmit, 'boolean');
    chk('新开关存在：白屏自动刷新', typeof CFG.blankReload, 'boolean');
    chk('函数存在：blankCheck（白屏自愈）', typeof Jump.blankCheck, 'function');
    chk('函数存在：blankAreaLen（中间内容区字数，白屏判定用）', typeof Jump.blankAreaLen, 'function');
    chk('函数存在：platformUnfinished（列出平台认为没做完的任务点）', typeof Jump.platformUnfinished, 'function');
    chk('手动跳转不会被单飞锁挡住（forceNow 直连 forceInner）', typeof Jump.forceNow, 'function');
    chk('新开关存在：推不动的任务点自动跳过', typeof CFG.autoSkipStuck, 'boolean');
    chk('推多久算完不成是数字（默认 8 分钟）', typeof CFG.stuckSkipMin, 'number');
    chk('函数存在：nextUnfinishedNodeText（下一个没做的任务点）', typeof Jump.nextUnfinishedNodeText, 'function');
    chk('函数存在：gotoUnfinished（去点那个任务点）', typeof Jump.gotoUnfinished, 'function');
    chk('workState 能数出页面上的任务点图标个数', typeof Jump.workState().icons, 'number');
    chk('函数存在：blankRiskNow（交卷前现场数一次勾）', typeof blankRiskNow, 'function');
    chk('函数存在：forceSubmit（确认答好后强行交卷的出口）', typeof forceSubmit, 'function');
    chk('没有题目的文档会被判成「不能交」', typeof blankRiskNow(document.implementation.createHTMLDocument()) === 'string', true);
    chk('拿不到文档时也会判成「不能交」', typeof blankRiskNow(null) === 'string', true);
    chk('作答方法写进提示词：按教材原文，不按日常语感', /教材原文/.test(aiSysPrompt('single')), true);
    chk('提示词带教材反例：意识是人脑的机能', /人脑的机能/.test(aiSysPrompt('single')), true);
    chk('提示词带教材反例：静止是运动的一种形式 = 正确', /静止是运动的一种形式/.test(aiSysPrompt('judge')), true);
    chk('判断提示词不再拿绝对化措辞当判据', /绝不是判据/.test(aiSysPrompt('judge')), true);
    chk('单选提示词要挑术语最准确的一项', /术语最准确/.test(aiSysPrompt('single')), true);
    chk('复核轮换成反方视角（先假设上一轮错了）', /先假设你上一轮的答案是/.test(String(askAI)), true);
    chk('多轮温度递增（打破「每轮复读同一答案」）', /temps = \[0, 0\.7, 1\.0, 1\.2\]/.test(String(askAI)), true);
    chk('单选/判断也固定复核一轮（不再只看把握<70）', /Math\.max\(2, votes - 1\)/.test(String(askAI)), true);
    chk('模型调用支持温度参数（多轮才有差异）', /callModel = async \(userText, temp\)/.test(String(askAI)), true);
    chk('函数存在：aiNotReadyNote（AI 没配好时说清后果）', typeof aiNotReadyNote, 'function');
    chk('AI 未就绪会给出非空说明', typeof aiNotReadyNote() === 'string', true);
    chk('0% 时点明「不是识别不了题目，是答案来源没有」', /没有一个来自题库\/AI|一道都没填上/.test(String(answerDoc)), true);
    chk('闸没放行时说明理由（不再静默干等）', /本来可以替你交了这一卷/.test(String(Jump.handleTaskBlock)), true);
    chk('同一卷不重复交、换卷自动重新武装', /blockAutoSig !== sig/.test(String(Jump.handleTaskBlock)), true);
    chk('暂存时也复核页面真实勾选（点不上要说出来）', /实际数不到勾\/填空/.test(String(submitWorkFlow)), true);
    chk('常量存在：GARBLE_MIN（乱码判定线）', typeof GARBLE_MIN, 'number');
    chk('函数存在：trialScore（候选映射试解评分）', typeof trialScore, 'function');
    chk('用户那卷乱码题干会被拦下（不再喂给 AI）',
      (() => { const bak = lastCipherSet; lastCipherSet = new Set(); const r = isEncryptedStem('摩摩鳩鳩相对立舄鳩维形态莴()。'); lastCipherSet = bak; return r; })(), true);
    chk('FS3：见过字体后，正文里还有密文字 → 判成乱码（这条才是主力判据）',
      (() => { const bak = lastCipherSet; lastCipherSet = new Set(['銱', '弚']); const r = isEncryptedStem('埃斯銱罗斯弚部曲'); lastCipherSet = bak; return r; })(), true);
    chk('FS3：密文字表在认完字后收窄成真密文字（减去 plainSet）',
      /registerCipherSet\(fp, new Set\(need\.filter\(\(ch\) => !plainSet\.has\(ch\)\)\)\)/.test(String(decryptDoc)), true);
    chk('FS3：收集字符时不再抢先污染密文字表（旧写法把明文也算成密文）',
      !/lastCipherSet = new Set\(need\);/.test(String(decryptDoc)), true);
    chk('FS3：收窄发生在认字之后（plainSet 必须先有值）', (() => {
      const s = String(decryptDoc);
      const iRec = s.indexOf('rec.plain.forEach');
      const iNarrow = s.indexOf('registerCipherSet(fp, new Set(need.filter');
      return iRec >= 0 && iNarrow > iRec;
    })(), true);
    chk('FS3：looksCipher / isEncryptedStem 已导出（控制台里能直接验一道题会不会被拦）',
      [typeof looksCipher, typeof isEncryptedStem], ['function', 'function']);
    chk('乱码选项文本可读度确实极低', garbleScore('蕪幏幏敧主幏') < GARBLE_MIN, true);
    chk('正常题干不会被误判（1）', isEncryptedStem('辩证唯物主义认为,意识不过是人脑的一种()。'), false);
    chk('正常题干不会被误判（2）', isEncryptedStem('黑格尔是一个客观唯心主义者。()'), false);
    chk('FS3：题干预览的主判据是「还有没有密文字」（looksCipher）',
      /if \(looksCipher\(s\)\) return true;/.test(String(isEncryptedStem)), true);
    chk('FS3：见过字体且无密文字 → 直接放行（不再拿可读度卡正确的题）',
      /if \(lastCipherSet && lastCipherSet\.size\) return false;/.test(String(isEncryptedStem)), true);
    chk('FS3：可读度只剩兜底作用（见过字体就走不到 garbleScore）',
      /if \(t\.length < 8\) return false;\s*\n\s*return garbleScore\(s\) < GARBLE_MIN;/.test(String(isEncryptedStem)), true);
    chk('FS3：真机那卷解对后的全文可读度确实低于乱码线（这就是旧判据误杀的现场）',
      garbleScore('库罗三的米和阿伽门乞援七将攻拜荷马史悲烈诗剧作家埃斯索福克南莎士比') < GARBLE_MIN, true);
    chk('FS3：同一段文字「无密文字」时不再被判成乱码（放行给 AI）',
      (() => {
        const bak = lastCipherSet;
        lastCipherSet = new Set(['銱', '廲', '弚']);
        const r = isEncryptedStem('库罗三的米和阿伽门乞援七将攻拜荷马史悲烈诗剧作家埃斯索福克南莎士比');
        lastCipherSet = bak;
        return r;
      })(), false);
    chk('解出来不如原文的段要保留原样', /解出来还不如原文/.test(String(decryptDoc)), true);
    chk('解不成人话的映射不写缓存（并清旧缓存）', /不写缓存/.test(String(decryptDoc)), true);
    chk('常量存在：GAIN_MIN / GAIN_MARGIN（解密成败的两道裁判闸）', [typeof GAIN_MIN, typeof GAIN_MARGIN], ['number', 'number']);
    chk('增益闸必须低于真机正确映射的增益（+0.1739），否则必然误杀正确解密', GAIN_MIN < 0.1739 && GAIN_MIN > 0, true);
    chk('领先闸不能高于真机投票亚军口径的领先（0.0696），否则必然误杀', GAIN_MARGIN <= 0.0696 && GAIN_MARGIN > 0, true);
    chk('裁判版本号存在（用来作废旧版裁判写下的「认不准」坏记号）', typeof DECRYPT_JUDGE_VER, 'number');
    chk('坏记号会带裁判版本号', /judge: DECRYPT_JUDGE_VER/.test(String(decryptDoc)), true);
    chk('旧版裁判留下的坏记号会被忽略并立刻重认（不然升级后还要吃 10 分钟冷却）',
      /staleJudge/.test(String(decryptDoc)) && /cached\.judge \|\| 0\) < DECRYPT_JUDGE_VER/.test(String(decryptDoc)), true);
    chk('函数存在：trialGain / trialVerdict（增益评分 + 冠军对亚军的裁判）', [typeof trialGain, typeof trialVerdict], ['function', 'function']);
    chk('裁判改成「冠军必须打败亚军」（内容无关），不再用绝对可读度', /trialVerdict\(map, rec\.runner, textNodes\)/.test(String(decryptDoc)) && !/sc < GARBLE_MIN/.test(String(decryptDoc)), true);
    chk('recognizeChars 会额外产出「亚军映射」供裁判对照', /runner\.set\(ch, ranked\[1\]\[0\]\)/.test(String(recognizeChars)) && /return \{ map, runner, alts, plain, stat \}/.test(String(recognizeChars)), true);
    chk('试解评分按字数加权（短标签「A」「B」不该和长题干有同等票权）', /garbleScore\(src\) \* w/.test(String(trialGain)), true);
    chk('冠军明显好过亚军 → 放行（真机实测：冠军 +0.174 vs 亚军 −0.076）',
      (() => {
        const C = '銱廲弚弜弙弖弡弝弞弣弢弩妶弤弨弬弳弫弴弭弲弮弰弶弻弸彀弽弼彁彄彂彃';
        const GOOD = '库罗三的米和阿伽门乞援七将攻拜荷马史悲烈诗剧作家埃斯索福克南莎士比';
        const good = new Map(), bad = new Map();
        [...C].forEach((ch, i) => { good.set(ch, GOOD[i]); bad.set(ch, C[i]); });
        const tn = [{ nodeValue: C }];
        const vd = trialVerdict(good, bad, tn);
        return vd.pass && vd.margin >= GAIN_MARGIN;
      })(), true);
    chk('亚军和冠军一样好 → 拦下（说明这份映射没比「换一批近亲字」强，多半认错了）',
      (() => {
        const C = '銱廲弚弜弙弖弡弝弞弣弢弩妶弤弨弬弳弫弴弭弲弮弰弶弻弸彀弽弼彁彄彂彃';
        const GOOD = '库罗三的米和阿伽门乞援七将攻拜荷马史悲烈诗剧作家埃斯索福克南莎士比';
        const good = new Map();
        [...C].forEach((ch, i) => good.set(ch, GOOD[i]));
        const vd = trialVerdict(good, good, [{ nodeValue: C }]);
        return !vd.pass && vd.margin < GAIN_MARGIN;
      })(), true);
    chk('0% 时优先归因「题面是字库乱码」', /字库乱码（可读度不足/.test(String(answerDoc)), true);
    chk('乱码题计数会被清零（每卷重新数）', /encSkipCount = 0/.test(String(answerDoc)), true);
    chk('函数存在：featsLine（连上下文画字 + 按推进宽度切格）', typeof featsLine, 'function');
    chk('函数存在：bestMatch / classifyLine 依赖的 matchTextNodes / votesToMap',
      [typeof bestMatch, typeof matchTextNodes, typeof votesToMap], ['function', 'function', 'function']);
    chk('函数存在：diagGlyphCtx（单独画 vs 连上下文画 对照）', typeof diagGlyphCtx, 'function');
    chk('常用字表够用（GB2312 一级+二级字 + 标点，≥6000）', REF_CHARS_SMALL.length >= 6000, true);
    chk('常用字表含 GB2312 二级字（「弈」这类字不是一级字，缺了就永远认不出）',
      REF_CHARS_SMALL.indexOf('弈') >= 0 && REF_CHARS_SMALL.indexOf('多') >= 0, true);
    chk('参考表按「字体|字表」分开缓存（gb1 先建，认不全再上全表）', /which === 'full' \? REF_CHARS : REF_CHARS_SMALL/.test(String(refTableFor)), true);
    chk('认不准的字体 10 分钟内不再自动重试（不再每 30 秒烧一轮）', /cached\.bad/.test(String(decryptDoc)), true);
    const _fl = featsLine('中文abc', 'Microsoft YaHei', 'Microsoft YaHei');
    chk('featsLine 切出的格子数与字数一致', _fl.length, 5);
    chk('featsLine 每格都取到墨迹（说明切格位置对）', _fl.filter((x) => x).length >= 4, true);
    chk('新开关存在：AI 还原乱码题', typeof CFG.aiRepair, 'boolean');
    chk('函数存在：repairIfGarbled / aiRawChat / altsHint / pickJsonObj',
      [typeof repairIfGarbled, typeof aiRawChat, typeof altsHint, typeof pickJsonObj], ['function', 'function', 'function', 'function']);
    chk('短选项乱码判定：怪字选项会被认出来', isGarbledText('蕪幏幏敧主幏'), true);
    chk('短选项乱码判定：正常选项不会被误判', isGarbledText('唯物辩证法'), false);
    chk('位置重合度：只反映「改了多少」，不参与放行判断', sameSpotRatio('摩摩鳩鳩相对立', '与辩证法相对立') > 0.4, true);
    chk('正常字保留率：还字动了原本正常的字就会被拦（用户那句应接近 100%）',
      keptPlainRatio('摩摩鳩鳩相对立舄鳩维形态莴()。', '与辩证法相对立的思维形态是()。') > 0.9, true);
    chk('函数存在：keptPlainRatio（还字校验用）', typeof keptPlainRatio, 'function');
    chk('函数存在：guessQuestionNodes（题目容器结构兜底）', typeof guessQuestionNodes, 'function');
    chk('函数存在：logQuizStructure（认不出题目时自动打结构）', typeof logQuizStructure, 'function');
    chk('认不出题目时不会一次就永久放弃（noQuizTries 计数）', /noQuizTries/.test(String(submitWorkFlow)), true);
    chk('默认 AI 预设是 glm-flash（用户 m11072 指定）', CFG_DEFAULTS.aiPreset, 'glm-flash');
    chk('默认 AI 接口是智谱地址', /open\.bigmodel\.cn/.test(String(CFG_DEFAULTS.aiApi)), true);
    chk('默认模型是 glm-4-flash（免费·快）', CFG_DEFAULTS.aiModel, 'glm-4-flash');
    chk('默认预设与 AI_PRESETS 表对得上', typeof AI_PRESETS[CFG_DEFAULTS.aiPreset], 'object');
    chk('默认预设的接口地址与 CFG 默认值一致', String(AI_PRESETS[CFG_DEFAULTS.aiPreset].api), String(CFG_DEFAULTS.aiApi));
    chk('默认预设的模型名与 CFG 默认值一致', String(AI_PRESETS[CFG_DEFAULTS.aiPreset].model), String(CFG_DEFAULTS.aiModel));
    chk('默认取答顺序＝只走 AI（用户要求）', CFG_DEFAULTS.aiProvider, 'ai');
    chk('配置版本号已升到 4（DeepSeek 迁移记号）', Number(CFG.cfgVer) >= 4, true);
    chk('函数存在：rankGlyphs（单字渲染取前 N 名）', typeof rankGlyphs, 'function');
    chk('函数存在：recognizeChars（多参考字体投票）', typeof recognizeChars, 'function');
    chk('decryptDoc 已改走投票认字', /recognizeChars\(todo, family\)/.test(String(decryptDoc)), true);
    chk('认不下时写出原因（rejects）', /stat\.rejects/.test(String(recognizeChars)), true);
    chk('函数存在：looksCipher（正文里还有密文字就判定没解干净）', typeof looksCipher, 'function');
    chk('还字触发条件含「密文字残留」', /cipherLeft/.test(String(repairIfGarbled)), true);
    chk('函数存在：askAiGarbled（乱码题干按大意作答）', typeof askAiGarbled, 'function');
    chk('题干乱码时先让 AI 猜一次（不再直接放弃）', /askAiGarbled\(question, opts, typeHint\)/.test(String(getAnswer)), true);
    chk('答题前会自愈解密（answerDoc 里调 decryptDoc）', /await decryptDoc\(doc\)/.test(String(answerDoc)), true);
    chk('有 textContent 版粗筛函数 txtFast（不触发布局）', typeof txtFast, 'function');
    chk('txtFast 用 textContent（不是 innerText）', /el\.textContent/.test(String(txtFast)), true);
    chk('blankAreaLen 不再读 innerText（改 textContent）', /body\.textContent/.test(String(Jump.blankAreaLen)), true);
    chk('blankAreaLen 结果带缓存（同一次 tick 只算一遍）', /blankLenCache/.test(String(Jump.blankAreaLen)), true);
    chk('blankAreaLen 对 iframe 数量封顶', /seen > 8/.test(String(Jump.blankAreaLen)), true);
    chk('blankCheck 有节流', /nowTick - blankCheckAt < 5000/.test(String(Jump.blankCheck)), true);
    chk('findNextText 先用 txtFast 粗筛（不再逐元素 innerText）', /txtFast\(e\)/.test(String(Jump.findNextText)), true);
    chk('连跳打转护栏存在（skipHops）', /skipHops\+\+/.test(String(processChapter)), true);
    chk('连跳打转按 chapterId 判（同一章满 4 次就停手）', /skipHops > 4/.test(String(processChapter)), true);
    chk('跳走的章节换了就清零计数', /skipHops = 0/.test(String(processChapter)), true);
    chk('退避期间不再计入连跳（blockLeft 闸）', /Jump\.blockLeft\(\)/.test(String(processChapter)), true);
    chk('Jump 导出了 blockLeft', typeof Jump.blockLeft, 'function');
    chk('logOnce 在模块级（retryQuiz 也够得着，不再 ReferenceError）', typeof logOnce, 'function');
    chk('verifyPicked 里不再有 280ms 同步忙等（单线程下它永远等不到，只烧主线程）',
      /while \(Date\.now\(\) - t0 < 280\)/.test(String(verifyPicked)), false);
    chk('verifyPicked 仍会逐个候选点一遍（去掉忙等没砍功能）', /clickAtPoints\(t,/.test(String(verifyPicked)), true);
    chk('Jump 导出了 blockFor（护栏用）', typeof Jump.blockFor, 'function');
    chk('主循环会记 tick 耗时', /tickCost/.test(String(loopTick)), true);
    chk('workState 命中整章完成时清零', /本节侧栏已标「已完成」→ 不算活/.test(String(Jump.workState)), true);
    chk('workState 的清零闸落在 quizWork 之后（否则会被测验统计顶开）', (() => {
      const s = String(Jump.workState);
      const iQ = s.indexOf('quizWork()');
      const iZ = s.lastIndexOf('本节侧栏已标「已完成」→ 不算活');
      return iQ > 0 && iZ > iQ;
    })(), true);
    chk('清零闸把测验计数也一起清掉', /out\.quiz = 0;/.test(String(Jump.workState)), true);
    chk('清零后 why 一并换掉（日志里不再同时出现「还有活」）',
      String(Jump.workState).indexOf("out.why = ['本节侧栏已标「已完成」→ 不算活']") > 0, true);
    chk('AI 全局串行闸存在（一次只让一个请求在飞）', typeof aiQueue, 'function');
    chk('串行闸靠 Promise 链排队（不是各发各的）', /aiGate\.then/.test(String(aiQueue)), true);
    chk('callModel 整段关进 aiQueue', /const callModel = async \(userText, temp\) => aiQueue\(/.test(String(askAI)), true);
    chk('callModel 不再丢掉 HTTP 状态码（429 得能认出来）',
      /sendOnce\(userText, temp, tmo, maxTok\)/.test(String(askAI)) && /status: Number\(res\.status\)/.test(String(askAI)), true);
    chk('发请求的地方区分超时(-1)与网络失败(0)',
      /ontimeout: \(\) => resolve\(\{ status: -1/.test(String(askAI)) && /onerror: \(\) => resolve\(\{ status: 0/.test(String(askAI)), true);
    chk('aiBusyStatus 认 429/408/5xx、不冤枉 200 和 401',
      !!(aiBusyStatus(429) && aiBusyStatus(408) && aiBusyStatus(503) && aiBusyStatus(500)
        && !aiBusyStatus(200) && !aiBusyStatus(401) && !aiBusyStatus(0)), true);
    chk('退避是翻倍的（第 2 次等待严格大于第 1 次）', aiBackoffMs(1) > aiBackoffMs(0), true);
    chk('退避基数带随机抖动（不同题不会同时回来敲门）', /Math\.random\(\)/.test(String(aiBackoffMs)), true);
    chk('退避有下限兜底（设置填 0 也不会退化成死循环猛敲）', aiBackoffMs(0) >= 400, true);
    chk('重试次数有封顶（0~5，不会无限重试）', /Math\.min\(5,/.test(String(aiRetryMax)), true);
    chk('默认重试次数是个数字（设置页可调，0=不重试）', typeof CFG.aiRetry, 'number');
    chk('CFG 默认值里有 aiBackoff（老配置靠浅合并自动补齐）', typeof CFG.aiBackoff, 'number');
    chk('限流时整条 AI 通道一起冷却（不是各题各自重试）', /setAiCooldown\(aiBackoffMs/.test(String(askAI)), true);
    chk('重试前先等冷却（不会原地猛敲）', /await aiCooldownWait\(/.test(String(askAI)), true);
    chk('状态码是 429 但重试用尽时，给的是怎么调参而不是一句失败',
      /「AI 投票轮数」调到 2/.test(String(askAI)), true);
    chk('响应不是 JSON 但提到限流时也按限流退避', /aiBusyText\(r\.text\)/.test(String(askAI)), true);
    chk('默认 max_tokens 给得够思考用（≥2000）', Number(CFG_DEFAULTS.aiMaxTokens) >= 2000, true);
    chk('请求体用的是可调的 aiMaxTokens，不再写死 1200',
      /max_tokens: Math\.max\(200, Number\(maxTok\) \|\| 3000\)/.test(String(askAI)), true);
    chk('思考把 token 用光（finish_reason=length）时会把上限翻倍重问',
      /fin === 'length' && !String\(content\)\.trim\(\) && attempt < maxRetry/.test(String(askAI))
      && /maxTok = Math\.min\(16000, maxTok \* 2\)/.test(String(askAI)), true);
    chk('真的还空着时报的是「被思考过程吃光了」而不是含糊的「空内容」',
      /已被思考过程吃光/.test(String(askAI)), true);
    chk('stripThink 会剥掉内联的 <think>…</think>',
      String(stripThink('<think>想半天</think>{"answer":"B"}')).indexOf('想半天') < 0
      && JSON.parse(String(stripThink('<think>想半天</think>{"answer":"B"}')).trim()).answer === 'B', true);
    chk('stripThink 认得没闭合的 <think>（被截断的回复）',
      stripThink('<think>嗯，我现在要解决…').indexOf('嗯') < 0, true);
    chk('parseAiAnswer 认得内联思考过程的回复（真机 glm-z1-flash 的形状）',
      String((parseAiAnswer('<think>\n嗯，我现在要解决这个题目。\n</think>{"answer":"B","confidence":90}') || {}).ans), 'B');
    chk('字库还字那条路也走 stripThink', /stripThink\(\(ch0 &&/.test(String(aiRawChat)), true);
    chk('限流文案认「访问量过大/稍后再试」（智谱 1305 的实际措辞）',
      !!(aiBusyText('该模型当前访问量过大，请您稍后再试') && aiBusyText('gateway busy, try later')), true);
    chk('默认超时 ≥120 秒（实测单答 102.8/109.9 秒）', Number(CFG_DEFAULTS.aiTimeout) >= 120, true);
    chk('cfgVer 已推到 6（超时迁移只跑一次）', Number(CFG.cfgVer) >= 6, true);
    chk('字库还字走同一条串行闸（否则和答题叠出并发）', /await aiQueue\(/.test(String(aiRawChat)), true);
    chk('字库还字也认 429 状态码', /aiBusyStatus\(r\.status\)/.test(String(aiRawChat)), true);
    chk('函数存在：emFeat（按 em 方框取景，不裁墨迹）', typeof emFeat, 'function');
    chk('函数存在：gridOf（切格子，两种取景共用）', typeof gridOf, 'function');
    chk('函数存在：isCJK / fontInstalled / fontNameOf / refOrderFor',
      typeof isCJK === 'function' && typeof fontInstalled === 'function'
      && typeof fontNameOf === 'function' && typeof refOrderFor === 'function', true);
    chk('isCJK 认得汉字与全角标点、不认 ASCII', !!(isCJK('国') && isCJK('，') && !isCJK('A') && !isCJK('7')), true);
    chk('featsIn 改成调 gridOf（切格子只有一份实现）',
      /return gridOf\(ink, w, h, minX, minY, bw, bh\)/.test(String(featsIn)), true);
    chk('emFeat 传的是整个 em 方框（不是墨迹外框）',
      /return gridOf\(ink, w, h, 0, 0, w, h\)/.test(String(emFeat)), true);
    chk('em 方框的上下边界是 0.88 / 0.14（按实测标定，不是随手写的）',
      EM_TOP === 0.88 && EM_BOT === 0.14, true);
    chk('emFeat 有空白/豆腐块的兜底（不会把空白当字）',
      /inkN < 18 \|\| maxX < 0/.test(String(emFeat))
      && /bw >= w - 1 && bh >= h - 1 && inkN > w \* h \* 0\.18/.test(String(emFeat)), true);
    chk('参考表按 CJK 分流到 emFeat', /\?\s*emFeat\(data, COLS \* CELL/.test(String(refTableFor)), true);
    chk('单字指纹按 CJK 分流到 emFeat', /emFeat\(data, CELL, ENC_PEN_X/.test(String(encFeat)), true);
    chk('整行认字也按 em 方框取景', /isCJK\(arr\[i\]\)\) out\.push\(emFeat\(data, W/.test(String(featsLine)), true);
    chk('参考字体表里思源同源排在雅黑前面（这是解不开的根因）',
      REF_FAMS.indexOf('Noto Sans SC') >= 0 && REF_FAMS.indexOf('Noto Sans SC') < REF_FAMS.indexOf('Microsoft YaHei'), true);
    chk('加密字体 name 表解析只认 nameID 1/4/6', /nid !== 1 && nid !== 4 && nid !== 6/.test(String(fontNameOf)), true);
    chk('name 表 platform 3 走 UTF-16BE（否则读出乱码）', /plat === 3 \|\| plat === 0/.test(String(fontNameOf)), true);
    chk('参考字体顺序按「加密字体自称」推导，黑体/宋体分流',
      /serif\|宋\|明朝\|mincho\|song/.test(String(refOrderFor)) && /HAN_SERIF/.test(String(refOrderFor)), true);
    chk('decryptDoc 里会用 fontNameOf 的结果决定参考字体',
      /refOrderNow = refOrderFor\(nameInfo\)/.test(String(decryptDoc)), true);
    chk('认字用的是排好序的参考字体（不是写死的表）',
      /refOrderNow \|\| REF_FAMS/.test(String(recognizeChars)), true);
    chk('距离线按「参考字体同不同源」分两档（同源 0.13 / 不同源 0.095）',
      ACCEPT_DIST_SAME <= 0.15 && ACCEPT_DIST_ALT <= 0.11 && ACCEPT_DIST_ALT < ACCEPT_DIST_SAME, true);
    chk('三条线是函数（会跟着 refSame 走），不是写死的常数',
      /refSame \? ACCEPT_DIST_SAME : ACCEPT_DIST_ALT/.test(String(accDist))
      && /ACCEPT_STRONG_R/.test(String(accStrong)) && /ACCEPT_LOOSE_R/.test(String(accLoose)), true);
    chk('「很硬」线比距离线严、「让步」线比距离线松',
      accStrong() < accDist() && accLoose() > accDist(), true);
    chk('refOrderFor 会判「头一个装了的参考字体是不是同源」',
      /refSame = !!\(head && head\.indexOf\(picked\) >= 0\)/.test(String(refOrderFor)), true);
    chk('投票只收过了「让步线」的候选（别的字族的瞎猜不参与）',
      /if \(!\(x\.d <= accLoose\(\)\)\) return;/.test(String(recognizeChars)), true);
    chk('同源单字体够近就定案，不强求两个字体同时命中',
      /b\.best <= accStrong\(\)/.test(String(recognizeChars))
      && /b\.best <= ACCEPT_MARGIN \* b\.ro/.test(String(recognizeChars)), true);
    chk('rankGlyphs 已取消粗筛（改成全表精比）—— 粗筛会把正确字挤到上千名开外',
      !/new Int32Array\(SHORTLIST\)/.test(String(rankGlyphs)), true);
    chk('rankGlyphs 用 distOf 在整张表上跑（这才是「全表精比」）',
      /distOf\(q\.fine, 0, fine, i \* FN, FN\)/.test(String(rankGlyphs)), true);
    chk('全表精比的循环里**不再读 coarse**（否则还是粗筛）',
      !/coarse/.test(String(rankGlyphs)), true);
    chk('同源时只留一个参考字体（`fams.length` 被砍到 1）',
      /if \(refSame\) fams\.length = Math\.min\(fams\.length, 1\)/.test(String(recognizeChars)), true);
    chk('日志会区分「同源单字体」和「多参考字体投票」',
      /refSame \? '同源参考字体/.test(String(decryptDoc)) && /refSame \? '同源单字体'/.test(String(decryptDoc)), true);
    chk('参考字体名单里 Noto Sans SC Medium 在列表里（真机能用的思源同源字体）',
      REF_FAMS.indexOf('Noto Sans SC Medium') >= 0, true);
    chk('函数存在：mediaBlankCheck（视频黑屏自愈）', typeof Jump.mediaBlankCheck, 'function');
    chk('函数存在：mediaBlankNow（数有几个 video 没出画面）', typeof Jump.mediaBlankNow, 'function');
    chk('黑屏判定看 readyState/videoWidth（出画面或播完就不算黑）',
      /v\.readyState >= 2 \|\| v\.videoWidth > 0 \|\| v\.ended/.test(String(Jump.mediaBlankNow)), true);
    chk('没源的 video 不算黑屏（那是平台的懒加载占位，见 OO1）',
      /v\.currentSrc \|\| v\.src \|\| v\.getAttribute\('src'\)/.test(String(Jump.mediaBlankNow)), true);
    chk('黑屏先温和处理：8 秒后 load() 重载一次',
      /held > 8000 && blankVideoTried < 1/.test(String(Jump.mediaBlankCheck))
      && /v\.load\(\)/.test(String(Jump.mediaBlankCheck)), true);
    chk('黑屏 20 秒还没好就自动刷新（手动刷新一下就好 → 自动做掉）',
      /if \(held < 20000\) return/.test(String(Jump.mediaBlankCheck))
      && /location\.reload\(\)/.test(String(Jump.mediaBlankCheck)), true);
    chk('黑屏自愈和白屏自愈共用 2 次/10 分钟的刷新配额（免得互相刷成死循环）',
      /reloadTimes\.length >= 2/.test(String(Jump.mediaBlankCheck))
      && /reloadTimes\.push\(nowT\)/.test(String(Jump.mediaBlankCheck)), true);
    chk('黑屏判定跳过 0×0 的隐藏/预载 video（免得为一个看不见的 video 去刷整页）',
      /if \(!v\.clientWidth && !v\.clientHeight\) continue/.test(String(Jump.mediaBlankNow)), true);
    chk('黑屏自愈只在「本页确实还有活」时才动手',
      /if \(!w \|\| !w\.busy \|\| !\(w\.media \|\| w\.unfinished\)\)/.test(String(Jump.mediaBlankCheck)), true);
    chk('黑屏自愈**不看** w.playing（平台以为在播、画面却是黑的，正是要救的那种）',
      !/w\.playing\)/.test(String(Jump.mediaBlankCheck)), true);
    chk('黑屏自愈跟着「白屏自动刷新」开关走', /CFG\.blankReload === false\) return/.test(String(Jump.mediaBlankCheck)), true);

    chk('函数存在：facePopupNow（只读地找人脸弹层）', typeof Jump.facePopupNow, 'function');
    chk('函数存在：faceGuard（检测到就停脚本）', typeof Jump.faceGuard, 'function');
    chk('人脸关键词覆盖「人脸信息采集」', Jump.FACE_RE.test('人脸信息采集 请使用学习通APP采集人脸信息后继续学习'), true);
    chk('人脸关键词覆盖「人脸识别」', Jump.FACE_RE.test('请完成人脸识别验证'), true);
    chk('人脸关键词覆盖「活体检测」', Jump.FACE_RE.test('需要进行活体检测'), true);
    chk('人脸关键词**不**误伤普通弹窗', Jump.FACE_RE.test('任务点未完成，是否去完成？'), false);
    chk('人脸关键词**不**误伤普通弹窗（正确率提示）', Jump.FACE_RE.test('正确率 60% 低于阈值，已暂存'), false);
    chk('faceGuard 受「人脸核验自动停」开关控制', /CFG\.faceStop === false\) return false/.test(String(Jump.faceGuard)), true);
    chk('faceGuard 会真的把脚本停掉（CFG.enabled = false）', /CFG\.enabled = false/.test(String(Jump.faceGuard)), true);
    chk('faceGuard 停手后**落盘**（刷新也不会自己开回来）', /saveCfg\(\)/.test(String(Jump.faceGuard)), true);
    chk('faceGuard 停手时关掉音频保活（否则标签页还在响，用户以为没停）',
      /stopKeepAlive/.test(String(Jump.faceGuard)), true);
    chk('faceGuard 同一个人脸弹窗只停一次（不然日志被刷成一片红）',
      /if \(faceStopDone\) return true/.test(String(Jump.faceGuard)), true);
    chk('facePopupNow 要求弹层**当前可见**（隐藏的历史弹层不算，防误停）',
      /if \(!vis\(el\)\) continue/.test(String(Jump.facePopupNow)), true);
    chk('facePopupNow 跨所有可读文档找（人脸框可能在 iframe 里）',
      /for \(const d of docsAll\(\)\)/.test(String(Jump.facePopupNow)), true);
    chk('人脸停手排在主循环**最前面**（比弹层处理还早）', (() => {
      const s = String(Jump.tickBody ? Jump.tickBody() : '');
      const iFace = s.indexOf('faceGuard()');
      const iOverlay = s.indexOf('if (overlay())');
      return !!s && iFace >= 0 && iOverlay >= 0 && iFace < iOverlay;
    })(), true);
    chk('恢复按钮会把停手闸放开（否则立刻又被停一次）',
      /clearFaceStop/.test(String(showFaceBanner)), true);
    chk('FS1：答满不交的卷子被单独识别（不再干等 stuckSkipMin 分钟）',
      /lastAnswerStat\.answered >= lastAnswerStat\.total/.test(String(Jump.tickBody ? Jump.tickBody() : '')), true);
    chk('FS1：不替用户打开「自动提交」（交卷是有后果的动作，只能他自己决定）',
      !/CFG\.autoSubmit = true/.test(String(Jump.tickBody ? Jump.tickBody() : '')), true);
    chk('FS2：函数存在：quizStashedNow（「已答完但只暂存没交卷」单独认出来）',
      typeof Jump.quizStashedNow, 'function');
    chk('FS2：workState 把「暂存未交卷」补进 quiz 计数（否则 busy=false，主循环一直白点下一节）',
      /if \(!qz\) \{\s*\n?\s*const st = quizStashedNow\(\);/.test(String(Jump.workState)), true);
    chk('FS2：暂存判定要求页面上真有提交入口（换章/交卷成功后不再误判）',
      /a\.btnSubmit,\.btnSubmit,a\.btnSave,\.btnSave/.test(String(Jump.quizStashedNow)), true);
    chk('FS2：暂存判定要求 quizSavedInfo 与已填题数（没答过的卷子不算）',
      /if \(!quizSavedInfo\) return null/.test(String(Jump.quizStashedNow))
      && /lastAnswerStat\.total/.test(String(Jump.quizStashedNow)), true);
    chk('FS2：自动提交关掉时绝不替用户交卷（旧版会走到 resolveAndGo 强交）',
      /if \(CFG\.autoSubmit\) \{/.test(String(Jump.tickBody ? Jump.tickBody() : ''))
      && /fs2-hold-skip/.test(String(Jump.tickBody ? Jump.tickBody() : '')), true);
    chk('FS2：不交卷时把「平台会一直挡着下一节」这个后果说清楚',
      /平台这个任务点会一直是「未完成」/.test(String(Jump.tickBody ? Jump.tickBody() : '')), true);
    chk('通用字族关键字不加引号（sans-serif 被加引号就误报「没装」）',
      /GENERIC_FAMS/.test(String(fontInstalled))
      && /GENERIC_FAMS\.indexOf\(f0\.toLowerCase\(\)\) >= 0\) return true/.test(String(fontInstalled)), true);
    chk('emFeat 在真 canvas 上能对汉字出指纹', (() => {
      try {
        const c = gCanvas(CELL, CELL);
        c.fillStyle = '#fff'; c.fillRect(0, 0, CELL, CELL);
        c.fillStyle = '#000'; c.font = `46px "sans-serif"`; c.textBaseline = 'alphabetic';
        c.fillText('国', ENC_PEN_X, ENC_BASE_Y);
        const f = emFeat(c.getImageData(0, 0, CELL, CELL).data, CELL, ENC_PEN_X, ENC_BASE_Y, ENC_EM, CELL, CELL);
        return !!(f && f.fine && f.fine.length === FINE * FINE && f.coarse.length === COARSE * COARSE);
      } catch (e) { return false; }
    })(), true);
    chk('emFeat 与 featsIn 对同一个字给出不同指纹（取景框真的换了）', (() => {
      try {
        const c = gCanvas(CELL, CELL);
        c.fillStyle = '#fff'; c.fillRect(0, 0, CELL, CELL);
        c.fillStyle = '#000'; c.font = `46px "sans-serif"`; c.textBaseline = 'alphabetic';
        c.fillText('国', ENC_PEN_X, ENC_BASE_Y);
        const d = c.getImageData(0, 0, CELL, CELL).data;
        const a = emFeat(d, CELL, ENC_PEN_X, ENC_BASE_Y, ENC_EM, CELL, CELL);
        const b = featsIn(d, CELL, 0, 0, CELL, CELL);
        let diff = 0;
        for (let i = 0; i < a.fine.length; i++) if (a.fine[i] !== b.fine[i]) diff++;
        return diff > 20;
      } catch (e) { return false; }
    })(), true);
    chk('系统里没装的字体名会被 fontInstalled 识破', fontInstalled('__no_such_font_zz__'), false);
    chk('函数存在：sweepPreview（把预览分步滚到底）', typeof sweepPreview, 'function');
    chk('函数存在：pptDoneSignals（平台那边认没认这个任务点）', typeof pptDoneSignals, 'function');
    chk('滚动阈值就是平台那一条：max = scrollHeight - clientHeight',
      /max = Math\.max\(0, sh - ch\)/.test(String(sweepPreview)), true);
    chk('最后一步故意越过阈值（平台要 scrollTop > max - 100 才认）',
      /i === steps \? 500 : 0/.test(String(sweepPreview)) && /scrollTo\(0, max \+ 500\)/.test(String(sweepPreview)), true);
    chk('每步都重新量 scrollHeight（图片懒加载会让它继续变长）',
      /sh = pd\.documentElement\.scrollHeight/.test(String(sweepPreview)), true);
    chk('完成的判定认平台自己的 finishFlag', /win\.finishFlag === true/.test(String(pptDoneSignals)), true);
    chk('完成的判定也认容器上的 ans-job-finished', /host\.classList\.contains\(JOB_DONE\)/.test(String(pptDoneSignals)), true);
    chk('完成后本地补 ans-job-finished（否则 workState 一直报「任务点未完成」永远跳不走）',
      /el\.classList\.add\(JOB_DONE\)/.test(String(markJobDone)), true);
    chk('兜底调平台自己的 finishJob() / checkJobFinish()',
      /win\.finishJob\(\)/.test(String(callPlatformFinish)) && /win\.checkJobFinish/.test(String(callPlatformFinish)), true);
    chk('processPpt 不再只认 .slide/.page 那套分页选择器（新版预览里一个都没有）',
      !/\.slide,\.page/.test(String(processPpt)), true);
    chk('processPpt 会取 #panView（新版 PPT）并兜底 #wpsView（老版 doc）',
      /#panView/.test(String(processPpt)) && /#wpsView/.test(String(processPpt)), true);
    chk('预览读不到（跨域）时不留死等：直接走平台完成调用', /PPT\/文档预览文档读不到/.test(String(processPpt)), true);
    chk('最多滚 2 遍，之后交给平台 finishJob 兜底',
      /pass <= 2/.test(String(processPpt)) && /callPlatformFinish\(win, iframe, doc\)/.test(String(processPpt)), true);
    chk('调用点把 iframe 也传进去了（markJobDone 要靠它找 .ans-attach-ct）',
      /processPpt\(doc, win, ctx, iframe\)/.test(String(handleIframeBody)), true);
    chk('processChapter 先干非媒体任务点，媒体排到最后',
      /const otherFrames = frames\.filter/.test(String(processChapter))
      && /const mediaFrames = frames\.filter/.test(String(processChapter)), true);
    chk('媒体任务点最多只守 25 秒就放它自己在后台播', /MEDIA_WAIT_MS = 25000/.test(String(processChapter)), true);
    chk('放到后台时留一条日志（不是偷偷不管它）', /media-background/.test(String(processChapter)), true);
    chk('workState 顺着 frameElement 看外层盒子的完成标记（媒体在模块 iframe 里，closest 跨不了文档）',
      /frameElement/.test(String(Jump.workState)) && /ans-attach-ct/.test(String(Jump.workState))
      && /media-box-done/.test(String(Jump.workState)), true);
    chk('函数存在：chapterMarkedDoneInSidebar（当前章节是否已被平台标记完成）', typeof chapterMarkedDoneInSidebar, 'function');
    chk('shouldSkipDone 会先看整章完成标记', /chapterMarkedDoneInSidebar\(\)/.test(String(shouldSkipDone)), true);
    chk('processChapter 里整章短路', /整章跳过，去下一个未完成的地方/.test(String(processChapter)), true);
    chk('doneInfo 区分「未加载」与「只到 X%」', /媒体未加载（无法判断进度/.test(String(doneInfo)), true);
    chk('只有真凭实据的「媒体只到」才挡跳过', /mediaBlocks/.test(String(shouldSkipDone)), true);
    chk('jobDoneOf 认侧栏的 icon_Completed 完成标记', /icon_Completed/.test(String(jobDoneOf)), true);
    chk('unfinishedNodes 会去掉被包含的重复节点', /m\.contains\(n\)/.test(String(Jump.unfinishedNodes)), true);
    chk('放弃的视频不再被当成做完（workState 里根本不看 gaveUpMedia，否则会自己跳过章节）',
      !/gaveUpMedia/.test(String(Jump.workState)), true);
    chk('workState 会统计暂停中的媒体', /out\.paused\+\+/.test(String(Jump.workState)), true);
    chk('已做完的任务点里的媒体被跳过', /ans-job-finished|已完成\|已学完/.test(String(Jump.workState)), true);
    chk('有三分钟放弃媒体的兜底变量', typeof Jump !== 'undefined', true);
    chk('开源版：AI 密钥默认留空（由用户自行填写，不内置任何 key）', String(CFG_DEFAULTS.aiKey || ''), '');
    chk('开源版：CFG_DEFAULTS 的 aiKey 是可改的独立副本', typeof CFG_DEFAULTS.aiKey, 'string');
    chk('cfgVer 已推到 9（跳过未完成弹窗的默认值迁移只跑一次）', Number(CFG.cfgVer) >= 9, true);
    chk('cfgVer 已推到 9（跳过未完成弹窗的默认值迁移只跑一次）', Number(CFG.cfgVer) >= 9, true);
    chk('cfgVer 9 迁移函数在（老存档那条 skipIncomplete:false 靠它翻过来）',
      typeof migrateCfg9 === 'function' && /skipIncomplete = true/.test(String(migrateCfg9)), true);
    chk('默认值单独存了一份 CFG_DEFAULTS（改过服务商/填过 key 也不会报假红）', typeof CFG_DEFAULTS.aiKey, 'string');
    chk('那几条「默认值」断言读的是 CFG_DEFAULTS（不是合并后的 CFG）',
      /CFG_DEFAULTS\.aiPreset/.test(String(selfTest)) && /CFG_DEFAULTS\.aiModel/.test(String(selfTest)), true);
    chk('交叉复核用 sameAns 语义比对', /const sameAns = /.test(String(askAI)), true);
    chk('新开关存在：推理模型交叉复核', typeof CFG.aiCross, 'boolean');
    chk('交叉复核模型默认是 deepseek-reasoner', CFG_DEFAULTS.aiCrossModel, 'deepseek-reasoner');
    chk('askAI 里挂了交叉复核', /交叉复核/.test(String(askAI)), true);
    chk('aiRawChat 支持指定模型', /modelOverride/.test(String(aiRawChat)), true);
    chk('blankRiskNow 会认 check_answer 这类平台选中态', /check_answer/.test(String(blankRiskNow)), true);
    chk('下一节候选带行内 onclick 时会直接执行它', /clickNodeOnclick\(el, oc\)/.test(String(Jump.forceInner)), true);
    chk('只有整段认全才摘 font-cxsecret 类', /if \(!bad\) \{\s*\n?\s*el\.classList\.remove\('font-cxsecret'\)/.test(String(decryptDoc)), true);
    chk('还字结果解析：能吃掉 ```json 围栏', String((pickJsonObj('```json\n{"stem":"甲"}\n```') || {}).stem), '甲');
    chk('答题主循环里挂上了还字（乱码题不再直接跳过）', /repairIfGarbled\(stem, opts\)/.test(String(answerDoc)), true);

    chk('后台挂机引擎存在：可见性伪装', typeof installVisibilitySpoof, 'function');
    chk('后台挂机引擎存在：Web Lock 长持有', typeof holdBgLock, 'function');
    chk('后台挂机引擎存在：后台降频监测', typeof bgWatchTick, 'function');
    chk('后台挂机引擎存在：现场探针', typeof bgProbe, 'function');
    chk('可见性伪装改的是 document.hidden（页面脚本看的就是它）',
      /defineProperty\(document, 'hidden', \{ configurable: true, get: \(\) => false \}\)/.test(String(installVisibilitySpoof)), true);
    chk('可见性伪装也改 visibilityState', /defineProperty\(document, 'visibilityState'/.test(String(installVisibilitySpoof)), true);
    chk('可见性伪装吞掉 visibilitychange（capture 阶段抢在平台脚本前面）',
      /addEventListener\(t, eat, \{ capture: true \}\)/.test(String(installVisibilitySpoof)) && /stopImmediatePropagation/.test(String(installVisibilitySpoof)), true);
    chk('真实可见性在伪装之前就存下来了（否则自己也读不到真值）',
      /Object\.getOwnPropertyDescriptor\(Document\.prototype, prop\)/.test(String(realVis.hidden || realVis.state)) || typeof realHiddenNow === 'function', true);
    chk('伪装已装好（document.hidden 恒为 false）', !bgStat.spoof || document.hidden === false, true);
    chk('blur 只吃窗口失焦，放行元素失焦（否则面板输入框没法用）',
      /e\.type === 'blur' && e\.target !== window && e\.target !== document\) return/.test(String(installVisibilitySpoof)), true);
    chk('保活不再只等 pointerdown 一个手势', GESTURES.length >= 3 && GESTURES.indexOf('pointerdown') >= 0 && GESTURES.indexOf('keydown') >= 0, true);
    chk('保活会每轮主循环兜底重试', /keepAliveRetry\(\)/.test(String(loopTick)), true);
    chk('主循环每轮先记后台降频账', /bgWatchTick\(\)/.test(String(loopTick)), true);
    chk('子 iframe 里也装了可见性伪装（每个文档各有一份 document.hidden）',
      /visibilityState'/.test(CHILD_SRC) && /hasFocus/.test(CHILD_SRC), true);
    chk('子 iframe 伪装版本号已升（老版本注入过的会重装）', /__CXFXC>=3/.test(CHILD_SRC), true);
    chk('子 iframe 会自己往下递归注入（播放器常在第 2 层）',
      /injectDeep/.test(CHILD_SRC) && /currentScript/.test(CHILD_SRC), true);
    chk('顶层注入改成递归 walk（depth ≤ 4）',
      /const walk = \(d, depth\)/.test(String(injectChildKeepAlive)) && /depth > 4/.test(String(injectChildKeepAlive)), true);
    chk('init 里伪装排在音频保活之前（否则平台脚本先注册监听，伪装白装）',
      (() => { const s = String(init); const i1 = s.indexOf('installVisibilitySpoof()'); const i2 = s.indexOf('startKeepAlive()'); return i1 >= 0 && i2 >= 0 && i1 < i2; })(), true);
    chk('init 里会拿 Web Lock 与 Worker 心跳', /holdBgLock\(\)/.test(String(init)) && /initWorkerWake\(\)/.test(String(init)), true);
    chk('启动时把四条通道的实况打进日志', /后台挂机已就绪/.test(String(init)), true);
    chk('状态自检里能看到后台挂机的四条通道与真实可见性', /后台挂机: /.test(String(statusReport)) && /真实可见性/.test(String(statusReport)), true);
    chk('后台挂机不进设置面板（用户要求：成为默认功能就好）', !/data-k="bg/.test(String(buildPanel)), true);
    chk('Worker 心跳读的是 e.data（不是 MessageEvent 本身，后者 Number() 得 NaN）',
      /Number\(e&&e\.data\)/.test(String(initWorkerWake)), true);
    chk('Worker 心跳对非法延迟兜底 1500ms（NaN / 0 / 负数都不会再变成 0ms 刷屏）',
      /if\(!\(ms>50\)\)ms=1500/.test(String(initWorkerWake)), true);
    chk('主循环有最小间隔闸（驱动源高频派发也不会把主线程拖死）',
      /nowMs - lastRunAt < 200/.test(String(loopTick)), true);
    chk('解密前先做廉价判断（假加密不建参考表，直接收工）',
      typeof looksEncrypted === 'function' && /looksEncrypted\(doc\)/.test(String(decryptDoc)), true);
    chk('廉价判断比的是「这个字体真正的密文字」（按字体指纹分开存的表）',
      /cipherByFont\.get\(fp\)/.test(String(looksEncrypted)) && /set\.has\(ch\)/.test(String(looksEncrypted)) && /seen > 4000/.test(String(looksEncrypted)), true);
    chk('FS4：密文字表按字体指纹分开存（全局一个表会把真加密判成假加密）',
      /cipherByFont\.set\(fp, set\)/.test(String(registerCipherSet)) && /cipherByFont\.get\(fp\)/.test(String(looksEncrypted)), true);
    chk('FS4：lastCipherSet 降级成所有已知字体的并集（并集只会更保守，不会漏判）',
      /cipherByFont\.forEach\(\(s\) => s\.forEach\(\(c\) => u\.add\(c\)\)\)/.test(String(registerCipherSet)) && /lastCipherSet = u/.test(String(registerCipherSet)), true);
    chk('FS4：没见过的字体一律当作「可能加密」（宁可多跑一轮，也不能把真加密永久跳过）',
      /if \(!set \|\| !set\.size\) return true;/.test(String(looksEncrypted)), true);
    chk('FS4：fontPrintOfDoc 用与 decryptDoc 同一套指纹（b64 前 6000 字 + 长度）',
      /fnv\(hit\.slice\(0, 6000\) \+ '\|' \+ hit\.length\)/.test(String(fontPrintOfDoc)), true);
    chk('FS4：假加密负缓存只收「文字本来通顺」的字体（真加密认不出时绝不能被记进去）',
      /garbleScore\(allTxt\) >= GARBLE_MIN/.test(String(decryptDoc)) && /fakeFonts\.add\(fp\)/.test(String(decryptDoc)), true);
    chk('FS4：负缓存命中时直接判「不加密」（把 26 秒一轮的代价只付一次）',
      /if \(fp && fakeFonts\.has\(fp\)\) return false;/.test(String(looksEncrypted)), true);
    chk('FS4：诊断用的字体表 / 假加密表都已导出（控制台里能查「到底哪些字体被判成不加密」）',
      (() => {
        const X = W.__CXFIX__ || {};
        return typeof X.fontPrintOfDoc === 'function' && typeof X.cipherFontCount === 'function'
          && typeof X.fakeFonts === 'function' && typeof X.isFakeFont === 'function';
      })(), true);
    chk('同一个文档解密失败后有 3 分钟冷却（answerDoc 每轮都 await 它，不挡就会烧穿页面）',
      typeof decryptCooling === 'function' && /decryptCooling\(doc\)/.test(String(decryptDoc)) && /3 \* 60 \* 1000/.test(String(decryptCooling)), true);
    chk('认不出字时落冷却戳（否则下一轮接着烧）',
      /decryptCooldown\.set\(doc, Date\.now\(\)\)/.test(String(decryptDoc)), true);
    chk('强制重试（菜单「立刻重新认字」）能越过冷却与廉价判断',
      /if \(!forcedNow && decryptCooling\(doc\)\) return false/.test(String(decryptDoc)) && /if \(!forcedNow && !looksEncrypted\(doc\)\)/.test(String(decryptDoc)), true);

    chk('v1.3.42：`skipIncomplete` 默认**开**（用户 m14634 决策②，真机连刷取证后改的）',
      CFG_DEFAULTS.skipIncomplete, true);
    chk('v1.3.42：函数存在：fallbackRate（因倍速播不动 → 自动回退 1x）',
      typeof fallbackRate, 'function');
    chk('v1.3.42：倍速回退**只影响这一个媒体节点**（WeakSet，不动设置里的值）',
      /rateFellBack\.add\(el\)/.test(String(fallbackRate))
      && /el\.playbackRate = 1/.test(String(fallbackRate))
      && !/CFG\.rate\s*=/.test(String(fallbackRate)), true);
    chk('v1.3.42：已经回退过的媒体不再被顶回高倍速（rateFor 统一出口）',
      /rateFellBack\.has\(el\)\) \? 1 : rateWant\(\)/.test(String(rateFor)), true);
    chk('v1.3.42：倍速回退的判据是「没暂停却一点不走」，且要连续 3 次（≈7.5 秒）',
      /if \(!still\.paused && rateWant\(\) > 1 && !rateFellBack\.has\(still\)\)/.test(String(processMedia))
      && /rateStall\+\+/.test(String(processMedia))
      && /rateStall >= 3/.test(String(processMedia)), true);
    chk('v1.3.42：主循环那条「点 3 次还是播不动」也顺手回退倍速',
      /mediaPokeTries >= 3\) fallbackRate\(v/.test(String(Jump.tickBody ? Jump.tickBody() : '')), true);
    chk('v1.3.42：人脸弹层消失后观察 10 秒就自动恢复（用户 m14634 决策④「等待人脸完成」）',
      /faceResumeAt/.test(String(Jump.faceGuard))
      && /Date\.now\(\) - faceResumeAt > 10000/.test(String(Jump.faceGuard))
      && /CFG\.enabled = true/.test(String(Jump.faceGuard)), true);
    chk('v1.3.42：停手期间主循环仍然活着（否则 faceGuard 自己也没人调，永远恢复不了）',
      /if \(!CFG\.enabled\) \{[\s\S]{0,400}Jump\.faceGuard/.test(String(loopTick)), true);
    chk('v1.3.42：人脸横幅改成「正在等你做完人脸」并说明会自己继续',
      /正在等你做完人脸/.test(String(showFaceBanner)) && /脚本会自己接着刷/.test(String(showFaceBanner)), true);
    chk('v1.3.42（B2）：函数存在：taskTabs（读 #prev_tab 里的任务点标签）', typeof Jump.taskTabs, 'function');
    chk('v1.3.42（B2）：taskTabs 真的去读 #prev_tab',
      /getElementById\('prev_tab'\)/.test(String(Jump.taskTabs)), true);
    chk('v1.3.42（B2）：函数存在：switchTaskTab（切到没看过的任务点标签）',
      typeof Jump.switchTaskTab, 'function');
    chk('v1.3.42（B2）：切 tab 前先问平台「本页还有几个任务点没做完」',
      /jobUnfinishCount/.test(String(Jump.pageTaskLeft)) && /_studystate/.test(String(Jump.pageTaskLeft)), true);
    chk('v1.3.42（B2）：函数存在：curTabHasUnfinishedMedia（切 tab 的安全闸）',
      typeof Jump.curTabHasUnfinishedMedia, 'function');
    chk('v1.3.42（B2）：**当前标签里还有没做完的媒体就绝不切走**（切走等于把没看完的视频丢下）',
      /if \(curTabHasUnfinishedMedia\(\)\) \{/.test(String(Jump.switchTaskTab)), true);
    chk('v1.3.42（B2）：安全闸认「测验 iframe 不算媒体」（否则测验 tab 永远切不过去）',
      /QUIZ_IFRAME_RE/.test(String(Jump.curTabHasUnfinishedMedia)), true);
    chk('v1.3.42（B2）：每个标签只切一次（tabVisited 记账，免得来回抖）',
      /tabVisited\.add\(/.test(String(Jump.switchTaskTab)) && /!tabVisited\.has\(/.test(String(Jump.switchTaskTab)), true);
    chk('v1.3.42（B2）：主循环在**空闲分支**里先试切标签，再才轮到「跳下一节」',
      (() => {
        const s = String(Jump.tickBody ? Jump.tickBody() : '');
        const iTab = s.indexOf('switchTaskTab(');
        const iIdle = s.lastIndexOf("force('空闲检测')");
        return iTab >= 0 && iIdle >= 0 && iTab < iIdle;
      })(), true);
    chk('v1.3.42（B2）：busy 分支里也试一次（本页还有活但没东西在推进时）',
      (() => {
        const s = String(Jump.tickBody ? Jump.tickBody() : '');
        const iTab = s.indexOf('switchTaskTab(');
        const iRetry = s.indexOf('retryQuiz(w.why.join');
        return iTab >= 0 && iRetry >= 0 && iTab < iRetry;
      })(), true);
    chk('v1.3.42（B3）：「图标没更新 → 按做完处理」的兜底闸加了「必须是媒体图标、且没有测验图标」',
      /iconMediaLike > 0 && iconQuizLike === 0/.test(String(Jump.workState)), true);
    chk('v1.3.42（B3）：图标挂的是测验/作业时明确说「题目还没读到 → 不算做完」',
      /挂的是测验\/作业，题目还没读到/.test(String(Jump.workState)), true);
    chk('v1.3.42（B4）：缺参考字体的提示只说一次，且说人话（重点讲用了哪个）',
      /refMissSaid\[/.test(String(refOrderFor)) && /改用「/.test(String(refOrderFor)), true);
    chk('v1.3.42（B4）：提示降级成 info（以前是 warn，9 个名字刷屏像出了大错）',
      /改用「[\s\S]{0,90}'info'\)/.test(String(refOrderFor)), true);
    chk('v1.3.42：视频弹题（.ans-videoquiz）按用户决定**不做**自动作答（保持不碰）',
      !/ans-videoquiz/.test(String(Jump.tickBody ? Jump.tickBody() : ''))
      && !/ans-videoquiz/.test(String(processMedia)), true);

    chk('v1.3.42（ZD1）：dismissDialog 这个函数**真的存在**（v1.3.6 起只有调用、没有定义）',
      typeof Jump.dismissDialog, 'function');
    chk('v1.3.42（ZD1）：dismissDialog 认平台「✕」的两种写法（onclick=closeDeleteWindow / class=popClose）',
      /closeDeleteWindow\|closeWindow\|closePop\|hidePop/.test(String(Jump.dismissDialog))
      && /popClose\|pop-close\|close_btn\|closeBtn\|icon-close\|ico-close/.test(String(Jump.dismissDialog)), true);
    chk('v1.3.42（ZD1）：兜底直接调平台自己的全局 closeDeleteWindow（真机实测 display: block → none）',
      /W\.closeDeleteWindow/.test(String(Jump.dismissDialog)), true);
    chk('v1.3.42（ZD1）：**绝不点弹层里的「下一节 / 去学习」**（那等于替用户放弃没做完的任务点）',
      !/下一节|去学习/.test(String(Jump.dismissDialog).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')), true);
    chk('v1.3.42（ZD1）：handleTaskBlock 里两处调用点都还在（调用方没被误删）',
      (String(Jump.handleTaskBlock).match(/dismissDialog\(/g) || []).length >= 2, true);

    chk('v1.3.42（ZD2）：pageTaskLeft 是**函数声明**（dialogAction 要提前用，const 箭头函数会踩 TDZ）',
      /function pageTaskLeft\(\)/.test(String(Jump.pageTaskLeft)), true);
    chk('v1.3.42（ZD2）：dialogAction 在平台自己说「0 个待完成任务点」时会收掉这个残留弹层',
      /CFG\.skipIncomplete && pageTaskLeft\(\) === 0/.test(String(Jump.dialogAction))
      && /dismissDialog\(target\)/.test(String(Jump.dialogAction)), true);
    chk('v1.3.42（ZD2）：收残留弹层**不算「脚本决定放弃」**（返回 null，不点「下一节」）',
      (() => {
        const s = String(Jump.dialogAction);
        const i = s.indexOf('pageTaskLeft() === 0');
        if (i < 0) return false;
        const j = s.indexOf('return null;', i);
        if (j < 0) return false;
        const seg = s.slice(i, j);
        return !/click\(nextBtn\)/.test(seg) && !/click\(goBtn\)/.test(seg);
      })(), true);
    chk('v1.3.42（ZD2）：问不出平台进度时（-1）绝不动手收弹层',
      /pageTaskLeft\(\) === 0/.test(String(Jump.dialogAction)) && /return -1/.test(String(Jump.pageTaskLeft)), true);

    chk('v1.3.44：外层 iframe 里还有嵌套测验 iframe 时，不在这里计数（交给内层那一轮）',
      /for \(const nf of cd\.querySelectorAll\('iframe'\)\)/.test(String(Jump.quizFramePending))
      && /if \(QUIZ_IFRAME_RE\.test\(String\(nf\.src \|\| ''\)\)\) return false;/.test(String(Jump.quizFramePending)), true);
    chk('v1.3.44：这一层自己记过 done / 已交卷 → 不算「还在处理」',
      /quizDoneKeys\.has\(quizKeyOf\(cd\)\)/.test(String(Jump.quizFramePending))
      && /looksSubmitted\(cd\)/.test(String(Jump.quizFramePending)), true);
    chk('v1.3.44：读不到内容的作业 iframe 仍算「等它」（有超时兜底，不无限等）',
      /if \(!cd\) return true;/.test(String(Jump.quizFramePending)), true);
    chk('v1.3.44：quizWork 里先在 cd 上判 quizPending，再问 quizFramePending',
      /if \(cd && quizPending\(cd\)\) continue;/.test(String(Jump.quizWork))
      && /if \(!quizFramePending\(f, cd\)\) continue;/.test(String(Jump.quizWork)), true);
    chk('v1.3.44：超时兜底 —— 连续 3 分钟读不到题目的作业 iframe 不再挡跳转',
      Jump.QUIZ_LAZY_MAX_MS === 180000
      && /now - quizLazySince\.get\(k\) > QUIZ_LAZY_MAX_MS/.test(String(Jump.quizWork))
      && /n = Math\.max\(0, n - stuckLazy\)/.test(String(Jump.quizWork)), true);
    chk('v1.3.44：不再出现的作业 iframe 会被清出计时表（换节后重新计时）',
      /if \(!seenLazy\.has\(k\)\) quizLazySince\.delete\(k\)/.test(String(Jump.quizWork)), true);
    chk('v1.3.44：超时只在真有滞留时打一条 warn，且不掩盖其它还有活的计数',
      /logOnce\('quiz-lazy-timeout'/.test(String(Jump.quizWork))
      && /if \(!n\) return null;/.test(String(Jump.quizWork)), true);

    chk('v1.3.44：排队用的是 await quizFlowQueue，不是 .then(...)()（后者会 TypeError）',
      /await quizFlowQueue;/.test(String(submitWorkFlow))
      && !/quizFlowQueue\.then\(async \(\) => \{[\s\S]{0,80}\}\)\(\);/.test(String(submitWorkFlow)), true);
    chk('v1.3.44：入队后一定走 finally 释放（异常路径也不留活动文档）',
      /tracked = run\.finally\(/.test(String(submitWorkFlow))
      && /quizFlowActiveDocs\.delete\(doc\)/.test(String(submitWorkFlow))
      && /quizFlowStartedAt\.delete\(doc\)/.test(String(submitWorkFlow)), true);
    chk('v1.3.44：流程内异常只记日志不炸出去（否则 finally 之前就断了）',
      /测验答题\/提交流程异常/.test(String(submitWorkFlow))
      && /catch \(e\) \{[\s\S]{0,120}return null;/.test(String(submitWorkFlow)), true);

    chk('v1.3.45：开源版不内置任何 AI 密钥，默认留空等用户填',
      String(CFG_DEFAULTS.aiKey || '') === ''
      && CFG.aiPreset === 'glm-flash'
      && CFG.aiApi === 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
      && CFG.aiModel === 'glm-4-flash', true);

    chk('v1.3.43：同一文档只会有一个 submitWorkFlow Promise（并发调用合并等待）',
      /quizFlowInFlight\.get\(doc\)/.test(String(submitWorkFlow))
      && /return inFlight/.test(String(submitWorkFlow))
      && /quizFlowInFlight\.set\(doc, tracked\)/.test(String(submitWorkFlow)), true);
    chk('v1.3.43：不同文档的答题也串行（answerDoc 写共享 lastAnswerStat/quizLive）',
      /await quizFlowQueue;/.test(String(submitWorkFlow))
      && /quizFlowQueue = tracked\.then/.test(String(submitWorkFlow)), true);
    chk('v1.3.43：流程退场会释放文档锁和活动标记',
      /quizFlowInFlight\.delete\(doc\)/.test(String(submitWorkFlow))
      && /quizFlowActiveDocs\.delete\(doc\)/.test(String(submitWorkFlow)), true);
    chk('v1.3.43：主循环只要答题/提交在飞就跳过全部跳章判定',
      /if \(quizFlowBusy\(\)\) \{[\s\S]{0,260}本轮不做跳章或空闲判定/.test(String(Jump.tickBody())), true);
    chk('v1.3.43：所有 force 路径均有答题流程保护（含 allowSkip）',
      /if \(quizFlowBusy\(\)\) \{[\s\S]{0,220}暂不跳章/.test(String(Jump.forceInner)), true);
    chk('v1.3.43：一键交卷/跳章出口先等活动答题 Promise 收尾',
      /Promise\.all\(active\)/.test(String(resolveAndGo)) && /quizFlowBusy\(\)/.test(String(resolveAndGo)), true);
    chk('v1.3.43：文档导航/iframe 替换后不再继续处理旧题或提交旧文档',
      /quizFlowDocCurrent\(doc\)/.test(String(submitWorkFlow))
      && /模型返回时测验文档已被替换/.test(String(answerDoc)), true);
    chk('v1.3.43：看门狗 —— 流程挂死超过 12 分钟就放行主循环（否则整页永久冻结）',
      QUIZ_FLOW_MAX_MS === 720000 && /QUIZ_FLOW_MAX_MS/.test(String(quizFlowBusy)), true);
    chk('v1.3.43：流程开始/结束都记账（quizFlowStartedAt），文档被平台换掉也一并清理',
      /quizFlowStartedAt\.set\(doc, Date\.now\(\)\)/.test(String(submitWorkFlow))
      && /quizFlowStartedAt\.delete\(d\)/.test(String(quizFlowBusy)), true);
    chk('v1.3.43：排队前就把工作项记成 in-flight（关掉「队列还没轮到就被重复排队」的窗口）',
      /let tracked;/.test(String(submitWorkFlow))
      && !/const tracked = run\.finally/.test(String(submitWorkFlow)), true);

    chk('v1.3.42（ZD3）：有当前节点但**没有计数框**时判 0（= 这一节已做完），不再往下掉到 #_studystate',
      /if \(inp\) return Math\.max\(0, Number\(inp\.value\) \|\| 0\);\s*\n\s*return 0;/.test(String(Jump.pageTaskLeft)), true);
    chk('v1.3.42（ZD3）：只有在**当前节点都不存在**时才去读 #_studystate',
      (() => {
        const s = String(Jump.pageTaskLeft);
        const iNode = s.indexOf("getElementById('cur' + cid)");
        const iState = s.indexOf('#_studystate');
        return iNode >= 0 && iState > iNode;
      })(), true);
    chk('v1.3.42（ZD3）：残留弹层收掉后**顺便清退避**（否则弹窗没了还要干等最多 8 分钟）',
      (() => {
        const s = String(Jump.dialogAction);
        const i = s.indexOf('pageTaskLeft() === 0');
        if (i < 0) return false;
        const seg = s.slice(i, i + 700);
        return /blockedUntil = 0;/.test(seg) && /blockStamp\+\+/.test(seg);
      })(), true);
    } catch (e) {
      ok('自检执行中断（有函数/变量未定义？）', false, String((e && e.message) || e));
    }

    const fails = results.filter((r) => !r.pass);
    addLog(`===== 核心逻辑自检：${results.length - fails.length}/${results.length} 通过 =====`, fails.length ? 'err' : 'ok');
    for (const r of results) {
      if (!r.pass) addLog(`  ❌ ${r.name}${r.extra ? ` → ${r.extra}` : ''}`, 'err');
    }
    if (!fails.length) addLog('  全部通过：多选拆分、选项匹配、题型识别、媒体跳过都正常', 'ok');
    return { total: results.length, failed: fails.length, results };
  }

  async function answerDoc(doc, win, kind) {
    if (!doc) return null;
    if (!quizFlowDocCurrent(doc)) return null;
    if (!CFG.autoAnswer) { addLog('自动答题已关闭（设置页可开）', 'warn'); return null; }
    try {
      if (CFG.decrypt && doc.querySelector && doc.querySelector('.font-cxsecret,[class*="cxsecret" i]')) {
        await decryptDoc(doc);
      }
    } catch (e) {}

    if (CFG.autoStart) {
      const sBtn = pickStartButton(doc);
      if (sBtn) { click(sBtn); addLog('点击「开始答题/开始测验」', 'ok'); await sleep(2500); }
    }

    let qNodes = pickQuestionNodes(doc, kind);
    if (!qNodes.length) qNodes = await waitQuestions(doc, kind);
    if (!qNodes.length) {
      addLog(`未识别到题目（${kind}）：已尝试 .TiMu / .questionLi / .q-main，页面可能改版，请到「诊断」页导出结构`, 'warn');
      logQuizStructure(doc);
      lastAnswerStat = { total: 0, answered: 0, known: 0 };
      return null;
    }
    lastAnswerStat = { total: qNodes.length, answered: 0, known: 0 };
    encSkipCount = 0;
    quizLive.total = qNodes.length; quizLive.answered = 0; quizLive.at = Date.now();
    quizLive.note = `${qNodes.length} 道题正在答`;

    try {
      const first = qNodes[0];
      const fq = extractQuestion(first, kind);
      const fInputs = pickAnswerInputs(first);
      const fType = inferType(first, fq.opts, fInputs, first.querySelector('textarea'));
      if ((fType === 'single' || fType === 'multi') && fq.opts.length >= 2) {
        await calibratePicks(first, fq.opts);
      }
    } catch (e) {}

    let answered = 0, known = 0, total = 0, empty = 0;
    for (const node of qNodes) {
      if (!quizFlowDocCurrent(doc)) {
        addLog('测验文档已被平台替换 → 停止处理旧题，避免答案落到过期页面', 'warn');
        break;
      }
      total++;
      let { stem, opts } = extractQuestion(node, kind);
      if (!stem || !hasCJK(stem)) { empty++; addLog(`第 ${total} 题题干为空或未解密，跳过`, 'warn'); continue; }
      try {
        const rep = await repairIfGarbled(stem, opts);
        if (rep) {
          stem = rep.stem;
          opts = opts.map((o, i) => Object.assign({}, o, { text: rep.opts[i] != null ? rep.opts[i] : o.text }));
          if (!rep.cached) encSkipCount = Math.max(0, encSkipCount - 1);
        }
      } catch (e) { addLog('[字库] 还字异常：' + ((e && e.message) || e), 'warn'); }
      const inputs = pickAnswerInputs(node);
      const preType = inferType(node, opts, inputs, node.querySelector('textarea'));
      addLog(`第 ${total} 题 · ${opts.length} 选项 · 预判「${TYPE_NAME[preType] || preType}」· ${stem.slice(0, 30)}${stem.length > 30 ? '…' : ''}`, 'dim');
      opts.forEach((o, i) => addLog(`    ${LETTERS[i] || i + 1}. ${String(o.text).slice(0, 26)}`, 'dim'));
      const raw = await getAnswer(stem, opts.map((o) => o.text), kind, preType);
      const rawList = Array.isArray(raw) ? raw : (raw == null ? [] : [String(raw)]);
      const answer = expandAnswer(rawList, preType, opts);
      if (!quizFlowDocCurrent(doc)) {
        addLog('模型返回时测验文档已被替换 → 丢弃旧题答案，不点旧选项', 'warn');
        break;
      }
      const r = applyAnswer({
        node, stem, opts, inputs,
        ta: node.querySelector('textarea'), doc, win, kind,
      }, answer);
      if (r.ok) answered++;
      if (r.ok && !r.guessed) known++;
      quizLive.answered = answered; quizLive.at = Date.now();
      await sleep(rnd(300, 900));
    }
    const rate = total ? Math.round((known / total) * 100) : null;
    addLog(`答题完成：填写 ${answered}/${total}${empty ? `（${empty} 题没读到题干）` : ''}，有把握 ${known}（正确率估 ${rate}%）`, answered ? 'ok' : 'warn');
    const nn0 = aiNotReadyNote();
    const encNote = `这一卷有 ${encSkipCount} 道题的题干还是字库乱码（可读度不足 ${Math.round(GARBLE_MIN * 100)}%），脚本不敢拿乱码去问 AI`
      + ' —— 这是超星的字体反爬：源码里的字是错的，只有配上它的加密字体才显示正确。'
      + '处理：①诊断页点「字库解密自检」看每题可读度；②菜单「清空字库缓存」→ 刷新页面重新认字；③还认不出就先手动做这几题';
    if (total && !answered) {
      addLog(`⚠ 这一卷 ${total} 道题一道都没填上（题目读到了 ${total} 道，选项没点上 / 填空没写进）→ 交出去就是白卷`, 'err');
      addLog(encSkipCount
        ? `最可能的原因：${encNote}`
        : (nn0
          ? `最可能的原因：${nn0}`
          : '最可能的原因：题库/AI/兜底都没给出能对上选项的答案 —— 去诊断页点「答题全流程测试」，'
            + '它会一步步告诉你卡在「读题 / 问答案 / 点选项」的哪一步'), 'err');
    } else if (answered > 0 && known === 0) {
      addLog('⚠ 这一卷填上的答案里，没有一个来自题库/AI —— 全是脚本自己猜的（兜底关键词 / 最长选项兜一下）', 'err');
      addLog(encSkipCount
        ? `所以正确率按 0% 算，于是只「暂存」不交卷、平台一直挡住跳转 —— 原因：${encNote}`
        : (nn0
          ? `所以正确率按 0% 算，于是只「暂存」不交卷、平台一直挡住跳转 —— 原因：${nn0}。修好这一步就好了`
          : '所以正确率按 0% 算（题目识别是好的，是答案来源没有）。原因：AI 被调用了但没给出可用答案 ——'
            + '上面 [AI] 那几行写着具体是超时/额度/网络还是解析失败；去设置页点「测试 AI 连接」，或诊断页点「AI 通道自检」'), 'err');
    }
    lastAnswerStat = { total, answered, known };
    return rate;
  }


  const CONFIRM_SEL = '.layui-layer,.layui-layer-dialog,.layui-layer-page,.el-message-box,.el-dialog,.ui-dialog,.popup,#cx_popup,.maskDiv';

  function confirmSubmitDialog(root) {
    const scope = root || document;
    let list = [];
    try { list = [...scope.querySelectorAll(CONFIRM_SEL)]; } catch (e) { return null; }
    for (const el of list) {
      if (!el.isConnected) continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      if (!/确认提交|确认交卷|是否提交|提交后|确定提交|确认要提交/.test(txt(el))) continue;
      const btns = [...el.querySelectorAll('a,button,span,div')].filter((b) => {
        const t = txt(b);
        return t.length > 0 && t.length <= 6 && /^(提交|交卷|确定|确认|是|保存并提交)$/.test(t);
      });
      const btn = btns.find((b) => /提交|交卷/.test(txt(b)))
        || el.querySelector('.layui-layer-btn0,.el-button--primary')
        || btns[0];
      if (btn) return { box: el, btn };
    }
    return null;
  }

  function autoConfirmSubmit(reason) {
    const docs = [document];
    try { walkIframes(document.documentElement).forEach((f) => { try { if (f.contentDocument) docs.push(f.contentDocument); } catch (e) {} }); } catch (e) {}
    for (const d of docs) {
      const hit = confirmSubmitDialog(d);
      if (hit) {
        click(hit.btn);
        addLog(`已点「${txt(hit.btn)}」确认提交（${reason}）`, 'ok');
        return true;
      }
    }
    return false;
  }

  function harvestFromResultPage(doc) {
    if (!doc || !CFG.harvest) return 0;
    const nodes = pickQuestionNodes(doc, 'zj');
    if (!nodes.length) return 0;
    const bank = getBank();
    let added = 0;
    for (const node of nodes) {
      try {
        const { stem, opts } = extractQuestion(node, 'zj');
        if (!stem || stem.length < 4) continue;
        const q = normalize(stem);
        if (!q || bank[q]) continue;
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let answer = [];

        const body = txt(node);
        const mt = body.match(/(?:正确答案|参考答案|标准答案|答案)\s*[:：]?\s*([A-Za-z]{1,8}|正确|错误|对|错|是|否)/);
        if (mt) {
          const raw = mt[1];
          const judge = normalizeJudge(raw);
          if (judge !== null) answer = [judge === 'true' ? '正确' : '错误'];
          else if (/^[A-Za-z]+$/.test(raw)) {
            answer = [...raw.toUpperCase()].map((ch) => {
              const i = letters.indexOf(ch);
              return (i >= 0 && opts[i]) ? opts[i].text : '';
            }).filter(Boolean);
          }
        }

        if (!answer.length) {
          const hit = [...node.querySelectorAll('[class*="correct"],[class*="rightAnswer"],[class*="dui"],[class*="isRight"],[class*="answerOk"],[class*="trueAnswer"]')]
            .map((el) => txt(el.querySelector('.fl.after') || el.querySelector('.answer_p') || el))
            .map((s) => String(s).replace(/^[\s　]*[A-Za-z\d]\s*[.、．)）:：]?\s*/, '').trim())
            .filter(Boolean);
          answer = [...new Set(hit)];
        }
        if (!answer.length) continue;

        bank[q] = answer; added++;
      } catch (e) {}
    }
    if (added) {
      try { GM_setValue(QB_KEY, JSON.stringify(bank)); } catch (e) {}
      addLog(`结果页收录：把 ${added} 道题的正确答案存进本地题库（共 ${Object.keys(bank).length} 条）→ 下次这些题直接秒答`, 'ok');
    }
    return added;
  }

  function harvestNow() {
    const ds = [];
    try { ds.push(...Jump.docsAll()); } catch (e) {}
    if (!ds.includes(document)) ds.unshift(document);
    let total = 0, scanned = 0;
    for (const d of ds) {
      try {
        if (!d || !looksSubmitted(d)) continue;
        scanned++;
        total += harvestFromResultPage(d);
      } catch (e) {}
    }
    if (!scanned) addLog('当前页面看不到「本次成绩 / 我的答案」这类结果页 → 没东西可抓（做完题、老师批阅后再点这个）', 'warn');
    else if (!total) addLog('扫了结果页，但没找到写着「正确答案」的题（平台没给标准答案）→ 不动题库', 'warn');
    return total;
  }

  function scheduleHarvest(doc, delay = 8000) {
    if (!CFG.harvest) return;
    for (const ms of [delay, delay + 12000]) {
      setTimeout(() => {
        try {
          if (!looksSubmitted(doc)) return;
          const n = harvestFromResultPage(doc);
          if (n) addLog(`（交卷后的成绩页）又收录了 ${n} 道标准答案`, 'ok');
        } catch (e) {}
      }, ms);
    }
  }

  async function submitWorkFlow(doc, win, kind, opts) {
    if (!doc) return null;
    const inFlight = quizFlowInFlight.get(doc);
    if (inFlight) {
      logOnce('quiz-flow-join', '同一测验已有答题/提交流程在运行 → 合并等待，不重复答题', 'info', 30000);
      return inFlight;
    }
    if (quizDoneKeys.has(quizKeyOf(doc)) || looksSubmitted(doc)) return null;
    quizFlowActiveDocs.add(doc);
    quizFlowStartedAt.set(doc, Date.now());
    let tracked;
    const run = (async () => {
      await quizFlowQueue;
      try {
        if (!quizFlowDocCurrent(doc)) return null;
    const force = !!(opts && opts.force);
    try { win.alert = () => {}; win.confirm = () => true; } catch (e) {}
    try { if (win.layer && typeof win.layer.confirm === 'function') win.layer.confirm = (_, __, ok) => ok && ok(); } catch (e) {}

    const rate = await answerDoc(doc, win, kind);
    if (!quizFlowDocCurrent(doc)) {
      addLog('答题期间测验文档已被平台替换 → 放弃对旧文档的提交/导航', 'warn');
      return null;
    }
    await sleep(CFG.interval * 1000);
    if (!quizFlowDocCurrent(doc)) {
      addLog('等待提交期间测验文档已被平台替换 → 不提交旧文档', 'warn');
      return null;
    }

    if (looksSubmitted(doc)) {
      addLog('这一页已有成绩/我的答案（结果页）→ 不重复作答交卷', 'ok');
      harvestFromResultPage(doc);
      markQuizDone(doc, '结果页，平台侧已完成');
      return;
    }

    if (!lastAnswerStat.total) {
      addLog('这一页没有读到题目 → 不交卷、不暂存（12 秒后回看一次，题出来了就补答）', 'info');
      const nk = quizKeyOf(doc);
      const nt = (noQuizTries.get(nk) || 0) + 1;
      noQuizTries.set(nk, nt);
      if (nt <= 3) addLog(`  ↳ 第 ${nt}/3 次没读到题目 → 先不标记为「已处理」，等它渲染/解密完再试`, 'dim');
      else markQuizDone(doc, '本页连续 3 次没读到题目，不交空卷');
      quizSavedInfo = { note: '一个题目都没读到（题目可能还没渲染）' };
      scheduleQuizRecheck(doc, win, kind);
      return;
    }
    if (force && !lastAnswerStat.answered) {
      addLog(`【一键】读出 ${lastAnswerStat.total} 道题但一道都没填上 → 不交白卷，停在本题（去诊断页看「答题全流程测试」）`, 'warn');
      markQuizDone(doc, '强制交卷时没填上任何答案，放弃交卷');
      quizSavedInfo = { note: `${lastAnswerStat.total} 道题一道都没填上` };
      return;
    }

    if (!CFG.autoSubmit && !force) {
      try { await win.noSubmit(); } catch (e) {}
      addLog('未开启自动提交，已暂存', 'warn');
      markQuizDone(doc, '按你的设置只暂存不提交');
      quizSavedInfo = { note: '设置页「自动提交」是关的' };
      return;
    }
    if (!force && rate !== null && rate < CFG.submitThreshold) {
      const riskStash = blankRiskNow(doc);
      try { await win.noSubmit(); } catch (e) {}
      addLog(`正确率 ${rate}% < ${CFG.submitThreshold}%，已暂存（不硬交）`, 'warn');
      if (riskStash) {
        addLog(`⚠ 而且这一页实际数不到勾/填空：${riskStash} —— 说明答案没有真正点到页面上（不是题目没识别出来）`, 'err');
        addLog('  ↳ 去诊断页点「答题全流程测试」，它会逐题显示「选没选上」；也可以自己手动点一题，看能不能选中', 'info');
      }
      markQuizDone(doc, '正确率低于阈值，按设置暂存');
      quizSavedInfo = { note: `正确率估 ${rate}% < 阈值 ${CFG.submitThreshold}%` };
      return;
    }
    if (force && rate !== null && rate < CFG.submitThreshold) {
      addLog(`【一键】正确率估 ${rate}% 低于阈值 ${CFG.submitThreshold}%，仍按你的命令交卷`, 'warn');
    }

    const risk = blankRiskNow(doc);
    if (risk && !(opts && opts.allowBlank)) {
      addLog(`先不交卷：${risk} → 停在本题继续等（这道闸就是为了不交白卷）`, 'warn');
      addLog('  ↳ 如果这页的题你确认答好了、只是脚本没读到勾：控制台执行 __CXFIX__.forceSubmit() 强制交卷', 'info');
      quizSavedInfo = { note: risk };
      retryQuiz('交卷前复核：' + risk);
      scheduleQuizRecheck(doc, win, kind);
      return;
    }
    if (risk && opts && opts.allowBlank) {
      addLog(`你明确要求强制交卷 → 跳过白卷复核（${risk}）`, 'warn');
    }

    try {
      if (typeof win.btnBlueSubmit === 'function') {
        await win.btnBlueSubmit();
        await sleep((CFG.interval * 1000) / 2);
        if (typeof win.submitCheckTimes === 'function') await win.submitCheckTimes();
        addLog('已调用平台提交接口交卷', 'ok');
        markQuizDone(doc, '已交卷');
        quizSavedInfo = null;
        scheduleHarvest(doc);
        await sleep(1200);
        if (!autoConfirmSubmit('提交后二次确认')) {
          await sleep(1800);
          autoConfirmSubmit('提交后二次确认·重试');
        }
        return;
      }
    } catch (e) { addLog('平台提交接口异常：' + e.message, 'warn'); }

    const btn = [...doc.querySelectorAll('a,button,span,div')].find((b) => {
      const t = txt(b);
      return t.length > 0 && t.length <= 8 && /^(提交|交卷|保存并提交|提交作业|提交答案)$/.test(t);
    });
    if (btn) {
      click(btn);
      addLog('已点击提交按钮', 'ok');
      markQuizDone(doc, '已点提交按钮');
      quizSavedInfo = null;
      scheduleHarvest(doc);
      await sleep(1200);
      autoConfirmSubmit('点击提交按钮后');
    } else {
      addLog('未找到提交入口 → 答案已填好，交卷这一步留给你点（脚本不会因此停在本题干等）', 'warn');
      markQuizDone(doc, '找不到提交入口，已留给用户');
      quizSavedInfo = { note: '答案填好了，但页面上找不到「提交」按钮（去诊断页导出结构快照）' };
    }
      } catch (e) {
        addLog('测验答题/提交流程异常：' + ((e && e.message) || e), 'err');
        return null;
      }
    })();
    tracked = run.finally(() => {
      if (quizFlowInFlight.get(doc) === tracked) quizFlowInFlight.delete(doc);
      quizFlowActiveDocs.delete(doc);
      quizFlowStartedAt.delete(doc);
    });
    quizFlowInFlight.set(doc, tracked);
    quizFlowQueue = tracked.then(() => undefined, () => undefined);
    return tracked;
  }

  async function resolveAndGo() {
    try {
      if (quizFlowBusy()) {
        const active = [...quizFlowActiveDocs].map((d) => quizFlowInFlight.get(d)).filter(Boolean);
        if (active.length) await Promise.all(active);
      }
      const hasSubmitEntry = (d) => {
        try {
          if (d.defaultView && typeof d.defaultView.btnBlueSubmit === 'function') return true;
          return [...d.querySelectorAll('a,button,span,div')].some((b) => {
            const t = txt(b);
            return t.length > 0 && t.length <= 8 && /^(提交|交卷|保存并提交|提交作业|提交答案)$/.test(t);
          });
        } catch (e) { return false; }
      };
      const docs = [document];
      for (const f of [...document.querySelectorAll('iframe')]) {
        try { if (f.contentDocument) docs.push(f.contentDocument); } catch (e) {}
      }
      let qdoc = null, why = '';
      for (const d of docs) {
        if (quizPending(d)) { qdoc = d; why = '还有题没答完'; break; }
      }
      if (!qdoc) {
        for (const d of docs) {
          if (hasSubmitEntry(d) && !looksSubmitted(d)) { qdoc = d; why = '题已答完但还没交卷'; break; }
        }
      }
      if (qdoc) {
        const kind = qdoc.querySelector('.questionLi,.q-main') ? 'ks' : 'zj';
        addLog(`【一键】找到本页测验（${why}，${lastAnswerStat.answered}/${lastAnswerStat.total} 已填）→ 按你的命令交卷…`, 'info');
        await submitWorkFlow(qdoc, qdoc.defaultView || window, kind, { force: true });
        await sleep(1200);
      } else {
        addLog('【一键】这一页没有待交卷的测验 → 直接尝试跳下一节', 'info');
      }
      addLog('【一键】现在强制跳下一节（临时放行保护闸，等同你手点「立即跳下一节」）…', 'info');
      const ok = await Jump.forceNow('一键：交卷并跳下一节');
      if (!ok) addLog('【一键】没跳成功：看上面「点了但页面没变化」那几行，或到诊断页点「★ 跳章诊断」看按钮在哪', 'warn');
    } catch (e) {
      addLog('【一键】执行出错：' + (e && e.message), 'err');
    }
  }

  async function forceSubmit() {
    try {
      const docs = [document];
      for (const f of [...document.querySelectorAll('iframe')]) {
        try { if (f.contentDocument) docs.push(f.contentDocument); } catch (e) {}
      }
      let qdoc = null;
      for (const d of docs) if (quizPending(d)) { qdoc = d; break; }
      if (!qdoc) for (const d of docs) { if (!looksSubmitted(d) && d.querySelector(QUIZ_TEXT_SEL)) { qdoc = d; break; } }
      if (!qdoc) { addLog('强制交卷：这一页找不到测验文档', 'warn'); return false; }
      const kind = qdoc.querySelector('.questionLi,.q-main') ? 'ks' : 'zj';
      addLog('强制交卷：按你的命令跳过白卷复核，直接交这一卷…', 'warn');
      await submitWorkFlow(qdoc, qdoc.defaultView || window, kind, { force: true, allowBlank: true });
      return true;
    } catch (e) { addLog('强制交卷出错：' + (e && e.message), 'err'); return false; }
  }

  const JOB_DONE = 'ans-job-finished';

  function jobDoneOf(el, doc) {
    const d = doc || (el && el.ownerDocument) || document;
    const has = (n) => !!(n && n.classList && n.classList.contains(JOB_DONE));
    const doneMark = (n) => {
      try {
        if (!n || !n.querySelector) return false;
        if (n.querySelector('.icon_Completed,[class*="icon_Completed"],[class*="icon-Completed"]')) return true;
        const tips = n.querySelector('.prevHoverTips,[class*="prevHoverTips"]');
        if (tips && /已完成|已学完|已通过/.test(tips.textContent || '')) return true;
      } catch (e) {}
      return false;
    };
    let n = el, up = 0;
    while (n && up <= 3) {
      if (has(n)) return true;
      if (up === 0 && n.firstElementChild && has(n.firstElementChild)) return true;
      if (up <= 1 && doneMark(n)) return true;
      n = n.parentElement;
      up++;
    }
    try {
      const icons = d.querySelectorAll ? d.querySelectorAll('.ans-job-icon') : null;
      if (icons && icons.length === 1) {
        const icon = icons[0];
        if (has(icon) || has(icon.parentElement)) return true;
      }
    } catch (e) {}
    return false;
  }

  function jobDone(mediaEl) {
    if (!mediaEl) return false;
    try {
      return jobDoneOf(mediaEl) || jobDoneOf(mediaEl.closest('iframe'), mediaEl.ownerDocument);
    } catch (e) { return false; }
  }

  function mediaFinished(el) {
    if (!el) return false;
    if (el.ended) return true;
    const d = Number(el.duration);
    return isFinite(d) && d > 0 && el.currentTime >= d - 1.5;
  }

  function doneInfo(iframe, doc) {
    const out = { score: 0, why: [] };
    if (iframe && jobDoneOf(iframe, document)) { out.score += 2; out.why.push('类名'); }
    let parentText = '';
    try {
      const box = iframe && (iframe.closest('.ans-job-icon') ? iframe.closest('.ans-job-icon').parentElement : iframe.parentElement);
      parentText = txt(box || iframe) || '';
    } catch (e) {}
    if (/已完成|已学完|已阅读|已观看/.test(parentText)) { out.score += 1; out.why.push('父级文案已完成'); }

    let m = null;
    try { m = doc && doc.querySelector && doc.querySelector('video,audio'); } catch (e) {}
    if (m) {
      const d = Number(m.duration);
      const loaded = isFinite(d) && d > 0;
      let hasSrc = false;
      try { hasSrc = !!(m.currentSrc || m.src); } catch (e) {}
      const ratio = loaded ? m.currentTime / d : 0;
      if (mediaFinished(m)) { out.score += 3; out.why.push('媒体已播完'); }
      else if (loaded && ratio >= 0.97) { out.score += 2; out.why.push('媒体接近播完'); }
      else if (!loaded && !hasSrc) {
        out.score += 2; out.why.push('媒体未加载（无法判断进度，按完成处理）');
      } else out.why.push(`媒体只到 ${(ratio * 100).toFixed(0)}%`);
    }
    return out;
  }

  function chapterMarkedDoneInSidebar() {
    try {
      const m = /[?&]chapterId=(\d+)/.exec(location.href);
      if (!m) return false;
      const node = document.getElementById('cur' + m[1]) || document.querySelector('#cur' + m[1]);
      if (!node) return false;
      if (node.querySelector('.icon_Completed,[class*="icon_Completed"],[class*="icon-Completed"]')) return true;
      if (/已完成|已学完/.test(node.innerText || '')) return true;
    } catch (e) {}
    return false;
  }

  function shouldSkipDone(iframe, doc) {
    if (CFG.skipFinished && chapterMarkedDoneInSidebar()) return true;
    if (!CFG.skipFinished) return false;
    const info = doneInfo(iframe, doc);
    if (info.score >= 4) return true;
    const mediaBlocks = info.why.some((x) => /^媒体只到/.test(String(x)));
    if (info.score >= 2 && !mediaBlocks) return true;
    if (jobDoneOf(iframe, document)) {
      addLog(`任务点标记为已完成但内容没走完（${info.why.join('、')}）→ 仍接管播放`, 'warn');
    }
    return false;
  }

  let chapterAbort = new AbortController();
  let chapterRunId = 0;
  let pageKey = '';
  let skipHops = 0;
  let skipChapId = '';
  const seenDocs = new Map();
  const runningDocs = new Map();

  const getRootIframe = () => document.documentElement.querySelector('iframe');

  function currentPageSnapshot() {
    const f = getRootIframe();
    return { url: location.href, iframe: f, src: f && f.src, doc: f && f.contentDocument };
  }
  const samePage = (a, b) => !!a && !!b && a.url === b.url && a.iframe === b.iframe && a.src === b.src && a.doc === b.doc;

  function walkIframes(root, out = [], seen = new Set()) {
    if (!root || seen.has(root)) return out;
    seen.add(root);
    try {
      root.querySelectorAll('iframe').forEach((f) => {
        out.push(f);
        let d = null;
        try { d = f.contentDocument; } catch (e) {}
        if (d) walkIframes(d, out, seen);
      });
    } catch (e) {}
    return out;
  }

  function waitIframeReady(iframe, signal) {
    return new Promise((resolve) => {
      const t0 = Date.now();
      const check = () => {
        if (signal.aborted || !iframe.isConnected) return resolve(false);
        let d = null;
        try { d = iframe.contentDocument; } catch (e) {}
        if (d && d.readyState === 'complete' && d.URL !== 'about:blank') return resolve(true);
        if (Date.now() - t0 > 20000) return resolve(false);
        setTimeout(check, 500);
      };
      check();
    });
  }

  async function processMedia(mediaType, doc, ctx, iframe) {
    return new Promise((resolve) => {
      let el = null, done = false, plays = 0, lastT = -1, stallLogged = 0, sawEmpty = 0, skipped = false;
      let rateStall = 0;
      const ctxCheck = () => ctx.isCurrent() && !ctx.signal.aborted;

      const finish = (ok, msg, tryJump) => {
        if (done) return; done = true;
        clearInterval(probe); clearInterval(guard);
        if (el) { try { el.removeEventListener('ended', onEnded); delete el.dataset.cxManaged; } catch (e) {} }
        if (!skipped) addLog(msg, ok ? 'ok' : 'warn');
        if (tryJump) {
          addLog('本节点改为跳过，尝试前往下一个任务点', 'warn');
          Jump.force('媒体不可用').then((r) => { if (!r) addLog('未能自动跳转：请手动点下一个任务点，或刷新页面', 'err'); });
        }
        resolve(ok);
      };
      const onEnded = () => finish(true, `${mediaType} 播放完成`);
      const markSkip = (msg) => { skipped = true; finish(true, msg); };

      const tryPlay = async (reason) => {
        if (!el || done || el.ended) return true;
        if (plays >= 200) return false;
        plays++;
        try {
          if (CFG.muted) el.muted = true;
          el.playbackRate = rateFor(el);
          if (!el.paused) return true;
          await el.play();
          el.dataset.cxManaged = '1';
          if (reason !== '探针' || plays <= 3) {
            addLog(`${mediaType} 已接管播放（${rateFor(el)}x${CFG.muted ? ' 静音' : ''}）· ${reason}`, 'ok');
          }
          return true;
        } catch (e) {
          if (e && e.name === 'AbortError') return false;
          if (e && e.name === 'NotAllowedError') {
            addLog(`${mediaType} 被浏览器拦截自动播放 → 请在页面上手动点一次播放即可（只需一次）`, 'err');
            return false;
          }
          if (plays <= 3) addLog(`${mediaType} 播放尝试 ${plays} 失败（${(e && e.name) || 'Error'}）`, 'warn');
          return false;
        }
      };

      const probe = setInterval(async () => {
        if (!ctxCheck()) return finish(false, '页面已切换，中止');
        let found = null;
        try { found = doc.documentElement.querySelector(mediaType); } catch (e) {}
        if (found && found !== el) {
          if (jobDoneOf(iframe, document) && mediaFinished(found)) return markSkip(`${mediaType} 已完成任务点，跳过`);
          el = found;
          el.dataset.cxManaged = '1';
          el.addEventListener('ended', onEnded);
          el.addEventListener('loadedmetadata', () => { tryPlay('元数据就绪'); }, { once: true });
          el.addEventListener('canplay', () => { tryPlay('可播放'); }, { once: true });
          addLog(`锁定期望媒体节点（${mediaType}）`, 'info');
        }
        if (!el) {
          if (jobDoneOf(iframe, document)) return markSkip('任务点已完成（无媒体节点），跳过');
          return;
        }
        if (el.ended || (el.duration && el.currentTime >= el.duration - 1)) return finish(true, `${mediaType} 播放完成`);
        if (el.paused) await tryPlay('探针');
      }, 1200);

      const guard = setInterval(async () => {
        if (!ctxCheck()) return finish(false, '页面已切换，中止');
        let still = null;
        try { still = doc.documentElement.querySelector(mediaType); } catch (e) {}
        if (!still) {
          if (jobDoneOf(iframe, document)) return markSkip(`${mediaType} 已完成任务点，节点已移除`);
          let hasInner = false;
          try { hasInner = !!doc.documentElement.querySelector('iframe'); } catch (e) {}
          if (!hasInner) return finish(true, `${mediaType} 节点已移除`);
          return;
        }
        if (still !== el) el = still;
        const t = still.currentTime || 0;
        if (t > lastT + 0.2) { lastT = t; stallLogged = 0; sawEmpty = 0; rateStall = 0; return; }
        if (still.ended || (still.duration && t >= still.duration - 1)) return finish(true, `${mediaType} 播放完成`);
        if (jobDoneOf(iframe, document) && mediaFinished(still)) return markSkip(`${mediaType} 已完成任务点，跳过`);

        if (!still.paused && rateWant() > 1 && !rateFellBack.has(still)) {
          rateStall++;
          if (rateStall >= 3) {
            rateStall = 0;
            if (fallbackRate(still, `${rateWant()}x 下时间轴 ${Math.round(t)}s 处 7.5 秒没推进`)) {
              lastT = t - 1;
              await tryPlay('倍速回退');
            }
          }
        } else rateStall = 0;

        const noSrc = !still.currentSrc && !still.getAttribute('src') && (!still.duration || !isFinite(still.duration));
        if (noSrc) { if (++sawEmpty >= 12) return finish(false, `${mediaType} 无媒体源（可能被平台校验拦截），跳过本节`, true); }
        else sawEmpty = 0;

        const marked = jobDone(still);
        if (still.paused || marked) {
          stallLogged++;
          if (stallLogged === 1 || stallLogged % 12 === 0) {
            addLog(`${marked ? '任务点被标记完成但视频停在 ' : '视频暂停于 '}${t.toFixed(1)}s/${(still.duration || 0).toFixed(0)}s → 继续播放`, 'warn');
          }
          await tryPlay(marked ? '任务点重播' : '停顿补播');
          if (stallLogged >= 36) {
            return finish(false, `${mediaType} 时间轴 90 秒未推进（${t.toFixed(0)}s/${(still.duration || 0).toFixed(0)}s），本节放弃`, true);
          }
          if (stallLogged === 12) addLog('视频反复被打断：请在页面上手动点一次播放，或关掉旧脚本避免抢播放', 'err');
        }
      }, 2500);
    });
  }


  function pptDoneSignals(iframe, doc, win) {
    const why = [];
    try { if (win && win.finishFlag === true) why.push('模块 finishFlag=true'); } catch (e) {}
    try {
      const host = (win && win.frameElement && win.frameElement.parentElement) || (iframe && iframe.parentElement);
      if (host && host.classList && host.classList.contains(JOB_DONE)) why.push('容器带上 ' + JOB_DONE);
    } catch (e) {}
    try { if (iframe && jobDoneOf(iframe, doc || document)) why.push('jobDoneOf'); } catch (e) {}
    return { done: why.length > 0, why };
  }

  async function sweepPreview(pw, pd, steps, ctx) {
    let max = 0;
    for (let i = 1; i <= steps; i++) {
      if (!ctx.isCurrent() || ctx.signal.aborted) return false;
      let sh = 0, ch = 0;
      try {
        sh = pd.documentElement.scrollHeight || (pd.body && pd.body.scrollHeight) || 0;
        ch = pw.innerHeight || pd.documentElement.clientHeight || 0;
      } catch (e) {}
      max = Math.max(0, sh - ch);
      const y = Math.round(max * i / steps) + (i === steps ? 500 : 0);
      try { pw.scrollTo(0, y); } catch (e) {}
      try { pd.documentElement.scrollTop = y; if (pd.body) pd.body.scrollTop = y; } catch (e) {}
      try { pd.dispatchEvent(new Event('scroll')); } catch (e) {}
      await sleep(rnd(260, 420));
    }
    try { pw.scrollTo(0, max + 500); } catch (e) {}
    try { pd.documentElement.scrollTop = max + 500; if (pd.body) pd.body.scrollTop = max + 500; } catch (e) {}
    await sleep(900);
    return true;
  }

  function markJobDone(iframe, doc, win) {
    const cands = [];
    try { if (win && win.frameElement && win.frameElement.parentElement) cands.push(win.frameElement.parentElement); } catch (e) {}
    try { if (iframe && iframe.parentElement) cands.push(iframe.parentElement); } catch (e) {}
    try {
      if (doc && iframe) for (const c of doc.querySelectorAll('.ans-attach-ct')) if (c.contains(iframe)) cands.push(c);
    } catch (e) {}
    for (const el of cands) {
      try {
        if (!el || !el.classList) continue;
        if (el.classList.contains(JOB_DONE)) return false;
        el.classList.add(JOB_DONE);
        addLog('本地补上「已完成」标记（平台那边已经记上了，只是这一页 DOM 不会自己变）', 'ok');
        return true;
      } catch (e) {}
    }
    return false;
  }

  function callPlatformFinish(win, iframe, doc) {
    let already = false;
    try { if (typeof win.checkJobFinish === 'function') already = !!win.checkJobFinish(); } catch (e) {}
    if (already) {
      addLog('平台查得这个文档任务点本来就是完成的', 'ok');
    } else {
      try {
        if (typeof win.finishJob !== 'function') throw new Error('模块里没有 finishJob（可能不是 ppt/doc 模块）');
        win.finishJob();
        addLog('已直接调用平台自己的 finishJob() 完成本任务点', 'ok');
      } catch (e) {
        addLog('PPT/文档任务点没能完成：' + e.message + ' —— 请手动把这一页滚到底一次', 'err');
        return false;
      }
    }
    try { win.finishFlag = true; } catch (e) {}
    markJobDone(iframe, doc, win);
    return true;
  }

  async function processPpt(doc, win, ctx, iframe) {
    const pre = pptDoneSignals(iframe, doc, win);
    if (pre.done) { addLog(`PPT/文档任务点已完成（${pre.why.join('、')}），跳过不重做`, 'info'); return; }

    let frame = null;
    try {
      frame = doc.querySelector('#panView') || doc.querySelector('iframe[id*="panView"]')
        || doc.querySelector('#wpsView') || doc.querySelector('iframe[id*="wpsView"]');
    } catch (e) {}
    let pd = null, pw = null;
    try { pd = frame && frame.contentDocument; pw = frame && frame.contentWindow; } catch (e) {}
    if (!frame || !pd || !pw || !pd.documentElement) {
      addLog('PPT/文档预览文档读不到（可能是跨域）→ 直接走平台自己的完成调用', 'warn');
      callPlatformFinish(win, iframe, doc);
      return;
    }

    for (let pass = 1; pass <= 2; pass++) {
      if (!ctx.isCurrent() || ctx.signal.aborted) return;
      let sh = 0, ch = 0, imgs = 0;
      try {
        sh = pd.documentElement.scrollHeight || 0;
        ch = pw.innerHeight || pd.documentElement.clientHeight || 0;
        imgs = pd.querySelectorAll('img').length;
      } catch (e) {}
      addLog(`PPT/文档预览：第 ${pass} 遍滚到底（内容 ${sh}px / 视口 ${ch}px / ${imgs} 张图）`, 'info');
      if (!sh || sh <= ch + 100) { addLog('预览内容比视口还短 —— 平台自己这时也是直接判完成', 'info'); break; }
      const steps = Math.max(4, Math.min(12, Math.ceil(sh / Math.max(1, ch))));
      const walked = await sweepPreview(pw, pd, steps, ctx);
      if (!walked) return;
      const s = pptDoneSignals(iframe, doc, win);
      if (s.done) {
        addLog(`PPT/文档滚到底 → 平台已判定完成（${s.why.join('、')}）`, 'ok');
        markJobDone(iframe, doc, win);
        return;
      }
      addLog(`第 ${pass} 遍滚到底还没等到平台完成信号${pass < 2 ? '，再滚一遍' : ''}`, 'warn');
    }
    callPlatformFinish(win, iframe, doc);
  }

  function processBook(win, ctx) {
    try {
      const top = W.top || window.top;
      const end = win.getFrameAttr && win.getFrameAttr('end');
      if (top.onchangepage) top.onchangepage(end);
      addLog('电子书翻页完成', 'ok');
    } catch (e) { addLog('电子书处理失败：' + e.message, 'warn'); }
  }

  async function handleIframeBody(iframe, doc, win, ctx) {
    const src = iframe.src || '';
    if (!src || src.indexOf('javascript:') === 0) return;
    const host = iframe.parentElement;

    if (/api\/work/.test(src) || /(^|\/)(work|exam-ans|exam|answer|quiz|test|homework)(\/|\.|$)/i.test(src)) {
      const isExam = /exam|quiz|test/i.test(src);
      if (shouldSkipDone(iframe, doc)) {
        addLog('作业/测验任务点已完成，跳过', 'info');
        markQuizDone(doc, '任务点已完成');
        return;
      }
      return submitWorkFlow(doc, win, isExam ? 'ks' : 'zj');
    }
    if (CFG.quizOnly) return;

    const hasIcon = !!(host && host.querySelector('.ans-job-icon'));
    if (!hasIcon) return;

    const isMedia = /video|audio/.test(src);
    if (!isMedia && shouldSkipDone(iframe, doc)) { addLog('任务点已完成，跳过', 'info'); return; }
    if (isMedia && shouldSkipDone(iframe, doc)) {
      const info = doneInfo(iframe, doc);
      addLog(`媒体任务点已完成（${info.why.join('、')}），跳过不重播`, 'info');
      return;
    }

    if (/video/.test(src)) return processMedia('video', doc, ctx, iframe);
    if (/audio/.test(src)) return processMedia('audio', doc, ctx, iframe);
    if (/modules\/(ppt|doc|pptx|docx|pdf)/.test(src)) return processPpt(doc, win, ctx, iframe);
    if (/modules\/innerbook/.test(src)) return processBook(win, ctx);
  }

  async function processIframe(iframe, ctx) {
    if (!iframe.src || iframe.src.indexOf('javascript:') === 0) return;
    const ready = await waitIframeReady(iframe, ctx.signal);
    if (!ready || !ctx.isCurrent()) return;
    let doc, win;
    try { doc = iframe.contentDocument; win = iframe.contentWindow; } catch (e) { return; }
    if (!doc || !win) return;

    const key = (doc.URL || '') + '|' + (doc.querySelector('iframe') ? '1' : '0');
    if (seenDocs.has(key) || runningDocs.has(key)) return;
    const sub = {
      signal: ctx.signal,
      isCurrent: () => ctx.isCurrent() && iframe.isConnected && iframe.contentDocument === doc,
    };
    const p = (async () => {
      await decryptDoc(doc);
      await handleIframeBody(iframe, doc, win, sub);
      if (sub.isCurrent() && !quizFlowInFlight.has(doc)) seenDocs.set(key, 1);
    })().catch((e) => addLog('任务点处理异常：' + e.message, 'err')).then(() => runningDocs.delete(key));
    runningDocs.set(key, p);
    return p;
  }

  let quizRetryAt = 0, quizRetryCount = 0;

  const onceAt = new Map();
  const logOnce = (key, msg, type, gap = 12000) => {
    if (Date.now() - (onceAt.get(key) || 0) < gap) return;
    onceAt.set(key, Date.now());
    addLog(msg, type || 'warn');
  };

  function retryQuiz(reason) {
    if (Date.now() - quizRetryAt < 20000) return false;
    if (quizRetryCount >= 4) {
      logOnce('quiz-retry-cap', `测验已重试 ${quizRetryCount} 次还是没答完（${reason}）→ 停在本题不再反复重试，请你自己看一眼这一页`, 'warn', 60000);
      return false;
    }
    quizRetryAt = Date.now(); quizRetryCount++;
    let n = 0;
    for (const m of [seenDocs, runningDocs]) {
      for (const k of [...m.keys()]) if (QUIZ_IFRAME_RE.test(k)) { m.delete(k); n++; }
    }
    quizLive.note = `重试答题（第 ${quizRetryCount} 次）`;
    addLog(`测验还没答完（${reason}）→ 清掉 ${n} 条「已处理」记录，重试答题`, 'warn');
    processChapter().catch((e) => addLog('重试答题异常：' + e.message, 'err'));
    return true;
  }

  async function processChapter() {
    if (!CFG.enabled) return;
    const snap = currentPageSnapshot();
    if (!snap.iframe || !snap.doc || snap.doc.URL === 'about:blank') return;

    if (CFG.skipFinished && chapterMarkedDoneInSidebar()) {
      const left = Jump.blockLeft();
      if (left > 0) {
        logOnce('skip-blocked', `本节已完成，但上一步刚判定成打转 → 还要等 ${left} 秒才敢再点「下一节」`, 'warn', 30000);
        return;
      }
      const cidNow = (/(?:chapterId|chapterid|chapter_id)=([^&#]+)/.exec(location.href) || [])[1] || location.href;
      if (cidNow !== skipChapId) { skipChapId = cidNow; skipHops = 0; }
      skipHops++;
      if (skipHops > 4) {
        const sec = Jump.blockFor();
        addLog(`这一章（chapterId=${cidNow}）已经连着跳了 ${skipHops - 1} 次，还停在同一节上 → 判定成打转，`
          + `停 ${sec} 秒不再点「下一节」（多半是平台侧栏的完成标记和实际章节错位了，手动点一下目录即可）`, 'err');
        skipHops = 0;
        return;
      }
      addLog(`本节在侧栏已是「已完成」→ 整章跳过，去下一个未完成的地方（第 ${skipHops} 次）`, 'info');
      if (CFG.autoNext) await sleep(CFG.interval * 1000);
      Jump.force('本节已完成');
      return;
    }

    const my = ++chapterRunId;
    const ctx = {
      signal: chapterAbort.signal,
      isCurrent: () => my === chapterRunId && !chapterAbort.signal.aborted && samePage(snap, currentPageSnapshot()) && CFG.enabled,
    };
    const frames = walkIframes(document.documentElement);
    const isMediaFrame = (f) => /video|audio/i.test(f.getAttribute('src') || f.src || '');
    const mediaFrames = frames.filter(isMediaFrame);
    const otherFrames = frames.filter((f) => !isMediaFrame(f));
    addLog(`发现 ${frames.length} 个 iframe（媒体 ${mediaFrames.length} 个），先处理非媒体任务点`, 'info');
    for (const f of otherFrames) {
      if (!ctx.isCurrent()) return;
      await processIframe(f, ctx);
    }
    const MEDIA_WAIT_MS = 25000;
    for (const f of mediaFrames) {
      if (!ctx.isCurrent()) return;
      const p = processIframe(f, ctx);
      if (p && typeof p.then === 'function') {
        let settled = false;
        const q = p.then(() => { settled = true; }, () => { settled = true; });
        await Promise.race([q, sleep(MEDIA_WAIT_MS)]);
        if (!settled) logOnce('media-background', '媒体还在播 → 先放它在后台继续，去处理同一页其它任务点', 'info', 120000);
      }
    }
    if (!ctx.isCurrent()) return;
    const mainQ = quizPending(document);
    if (mainQ) {
      const kind = document.querySelector('.questionLi,.q-main') ? 'ks' : 'zj';
      addLog(`主文档里发现 ${mainQ.count} 道题（${kind}）→ 直接开始答题`, 'info');
      await submitWorkFlow(document, window, kind);
    }
    if (!ctx.isCurrent()) return;
    addLog('本页任务点处理完毕', 'ok');
    if (CFG.autoNext) await sleep(CFG.interval * 1000);
    if (!ctx.isCurrent()) return;
    Jump.force('任务点已完成');
  }

  function initChapter() {
    const url = location.href;
    if (!/\/mycourse\/studentstudy/.test(url)) return;
    if (!/[?&]mooc2=1/.test(url)) {
      addLog('补齐 mooc2=1 参数后重新进入（F4）', 'warn');
      location.replace(url + (url.indexOf('?') >= 0 ? '&' : '?') + 'mooc2=1');
      return;
    }
    addLog('进入章节学习页，开始解析任务点（5–10 秒无反应请刷新）', 'info');
    let chapKey = '';
    const chapterKeyOf = (s) => {
      const c = /(?:chapterId|chapterid|chapter_id)=([^&#]+)/.exec(String(s || ''));
      const n = /(?:nodeId|nodeid|node_id)=([^&#]+)/.exec(String(s || ''));
      return (c ? c[1] : '') + '|' + (n ? n[1] : '');
    };
    const kick = () => {
      const snap = currentPageSnapshot();
      const key = snap.url + '|' + snap.src;
      if (key === pageKey) return;
      pageKey = key;
      quizSyncPage(key);
      quizRetryCount = 0; quizRetryAt = 0;
      const ck = chapterKeyOf(snap.url) + '#' + chapterKeyOf(snap.src);
      if (ck !== chapKey) {
        chapKey = ck;
        if (/[0-9]/.test(ck)) { try { Jump.clearBlock(); } catch (e) {} }
      }
      chapterAbort.abort();
      chapterAbort = new AbortController();
      seenDocs.clear(); runningDocs.clear();
      processChapter().catch((e) => addLog('章节处理异常：' + e.message, 'err'));
    };
    kick();
    setInterval(kick, 1200);
    const rootIframe = getRootIframe();
    if (rootIframe) rootIframe.addEventListener('load', () => { pageKey = ''; kick(); });
  }

  const Jump = (() => {
    const SEL_NEXT = [
      '#prevNextFocusNext',
      '.jb_btn.jb_btn_92.fr.fs14.nextChapter',
      '.nextChapter', 'a.nextChapter', '.jb_btn.nextChapter',
      '.jb_btn_92', 'a[onclick*="next"]', 'a[onclick*="Next"]', 'a[onclick*="NextChapter"]',
      '[class*="nextChapter"]', '[title="下一节"]', '[aria-label="下一节"]',
      '.prev_next .next', '.chapter_next', '.nextChapterBtn',
    ];
    const SEL_NODE = ['.posCatalog_select', '.chapter_item', '.catalog_points', '[onclick*="getTeacherAjax"]'];
    const SEL_OVERLAY = '.layui-layer,.maskDiv,.popup,#cx_popup,.ui-dialog,.el-overlay,.el-message-box__wrapper,.el-dialog,.layui-layer-dialog,.layui-layer-page';

    let lastClick = 0, fails = 0;
    let tickBodySrc = '';
    let blockedUntil = 0;
    let forcing = false;
    let blockStrikes = 0;
    let blockAutoSig = '';
    let blockStamp = 0;
    let blankSince = 0;
    let reloadTimes = (() => {
      try { const a = JSON.parse(sessionStorage.getItem('cx_fix_reloads_v1') || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; }
    })();
    const saveReloadTimes = () => { try { sessionStorage.setItem('cx_fix_reloads_v1', JSON.stringify(reloadTimes)); } catch (e) {} };
    const blockFor = () => {
      blockStrikes = Math.min(blockStrikes + 1, 4);
      const sec = 120 * blockStrikes;
      blockedUntil = Date.now() + sec * 1000;
      return sec;
    };
    const blockLeft = () => Math.max(0, Math.round((blockedUntil - Date.now()) / 1000));

    const vis = (el) => {
      if (!el || !el.isConnected) return false;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return false;
      const st = getComputedStyle(el);
      return !(st.visibility === 'hidden' || st.display === 'none' || Number(st.opacity) === 0);
    };
    const dis = (el) => !el || el.disabled === true || el.getAttribute('aria-disabled') === 'true'
      || /disabled|ban|gray|hui/i.test(typeof el.className === 'string' ? el.className : '');
    const pick = (sels) => {
      const out = [];
      for (const s of sels) {
        try { document.querySelectorAll(s).forEach((e) => { if (!out.includes(e)) out.push(e); }); } catch (e) {}
      }
      return out;
    };


    const clsOf = (el) => (el && typeof el.className === 'string' ? el.className : '').slice(0, 60);

    const docsAll = () => {
      const out = [document];
      const walk = (doc, depth) => {
        if (depth > 3) return;
        let frames = [];
        try { frames = [...doc.querySelectorAll('iframe')]; } catch (e) { return; }
        for (const f of frames) {
          let d = null;
          try { d = f.contentDocument; } catch (e) { continue; }
          if (d && d.documentElement && !out.includes(d)) { out.push(d); walk(d, depth + 1); }
        }
      };
      walk(document, 0);
      return out;
    };

    const quizLazySince = new Map();
    const QUIZ_LAZY_MAX_MS = 180000;

    const quizFramePending = (f, cd) => {
      const s = String(f.src || '');
      if (quizDoneKeys.has(quizFrameKey(s))) return false;
      if (!cd) return true;
      try {
        for (const nf of cd.querySelectorAll('iframe')) {
          if (QUIZ_IFRAME_RE.test(String(nf.src || ''))) return false;
        }
      } catch (e) {}
      if (quizDoneKeys.has(quizKeyOf(cd))) return false;
      if (looksSubmitted(cd)) return false;
      return true;
    };

    const quizWork = () => {
      let n = 0, why = '';
      const seenLazy = new Set();
      for (const d of docsAll()) {
        const q = quizPending(d);
        if (q) { n += q.count; why = `${q.count} 道题还没答完/没交卷`; continue; }
        let lazy = 0;
        try {
          for (const f of d.querySelectorAll('iframe')) {
            const s = String(f.src || '');
            if (!QUIZ_IFRAME_RE.test(s)) continue;
            let cd = null;
            try { cd = f.contentDocument; } catch (e) {}
            if (cd && quizPending(cd)) continue;
            if (!quizFramePending(f, cd)) continue;
            seenLazy.add(quizFrameKey(s));
            lazy++;
          }
        } catch (e) {}
        if (lazy) { n += lazy; why = `${lazy} 个作业/测验还在处理`; }
      }
      const now = Date.now();
      for (const k of [...quizLazySince.keys()]) if (!seenLazy.has(k)) quizLazySince.delete(k);
      let stuckLazy = 0;
      for (const k of seenLazy) {
        if (!quizLazySince.has(k)) { quizLazySince.set(k, now); continue; }
        if (now - quizLazySince.get(k) > QUIZ_LAZY_MAX_MS) stuckLazy++;
      }
      if (stuckLazy) {
        n = Math.max(0, n - stuckLazy);
        logOnce('quiz-lazy-timeout',
          `${stuckLazy} 个作业/测验 iframe 挂了 ${Math.round(QUIZ_LAZY_MAX_MS / 60000)} 分钟还是读不到题目 → 不再拿它挡跳转（平台侧多半已经做完了）`,
          'warn', 60000);
        if (!n) return null;
      }
      return n ? { n, why } : null;
    };

    const quizStashedNow = () => {
      if (!quizSavedInfo) return null;
      if (!lastAnswerStat || !lastAnswerStat.total) return null;
      let alive = false;
      for (const d of docsAll()) {
        try {
          if (looksSubmitted(d)) continue;
          if (d.querySelector('a.btnSubmit,.btnSubmit,a.btnSave,.btnSave')) { alive = true; break; }
        } catch (e) {}
      }
      if (!alive) return null;
      const a = Number(lastAnswerStat.answered) || 0;
      const t = Number(lastAnswerStat.total) || 0;
      const what = a >= t ? '已答完' : `只填了 ${a}/${t} 题`;
      return { n: 1, why: `1 份测验${what}、只暂存没交卷（${quizSavedInfo.note}）` };
    };

    const workState = () => {
      const out = { unfinished: 0, icons: 0, media: 0, mediaDone: 0, playing: 0, paused: 0, quiz: 0, sig: 0, why: [] };
      let iconMediaLike = 0, iconQuizLike = 0;
      for (const d of docsAll()) {
        let icons = [];
        try { icons = [...d.querySelectorAll('.ans-job-icon')]; } catch (e) {}
        out.icons += icons.length;
        for (const i of icons) {
          if (jobDoneOf(i, d)) continue;
          const holder = i.parentElement || i;
          let quizLike = false;
          try {
            const f = holder.querySelector('iframe');
            const fsrc = f ? (f.getAttribute('src') || f.src || '') : '';
            quizLike = !!(fsrc && QUIZ_IFRAME_RE.test(fsrc));
          } catch (e) {}
          if (quizLike) iconQuizLike++;
          let m = null;
          try { m = holder.querySelector('video,audio'); } catch (e) {}
          if (!m) {
            try {
              const f = holder.querySelector('iframe');
              const fd = f && f.contentDocument;
              if (fd) m = fd.querySelector('video,audio');
            } catch (e) {}
          }
          const clsAll = String(i.className || '') + ' ' + String(holder.className || '');
          if (!quizLike && (m || /ans-job-(video|audio)|video|audio/i.test(clsAll))) iconMediaLike++;
          if (m && mediaFinished(m)) continue;
          out.unfinished++;
        }
        let ms = [];
        try { ms = [...d.querySelectorAll('video,audio')]; } catch (e) {}
        for (const m of ms) {
          if (mediaFinished(m)) { out.mediaDone++; continue; }
          try {
            const fe = m.ownerDocument && m.ownerDocument.defaultView && m.ownerDocument.defaultView.frameElement;
            if (fe) {
              const outer = fe.closest('.ans-attach-ct,.ans-job,[class*="ans-job"],[class*="job-"]');
              if (outer && jobDoneOf(outer, fe.ownerDocument)) {
                logOnce('media-box-done', '任务点容器已被平台标成完成 → 里面的媒体不再算「还有活」', 'info', 300000);
                out.mediaDone++; continue;
              }
            }
          } catch (e) {}
          try {
            const box = m.closest && m.closest('.ans-job,[class*="ans-job"],[class*="job-"]');
            if (box && (jobDoneOf(box, d) || /已完成|已学完|已观看|已阅读/.test(txt(box) || ''))) { out.mediaDone++; continue; }
          } catch (e) {}
          try {
            const dur = Number(m.duration);
            const noSrc = !m.currentSrc && !m.src;
            const tiny = isFinite(dur) && dur > 0 && dur < 5;
            const neverLoaded = m.readyState === 0 && !m.currentSrc;
            if (tiny || noSrc || neverLoaded) { out.mediaDone++; continue; }
          } catch (e) {}
          out.media++;
          if (!m.paused) out.playing++;
          else out.paused++;
          out.sig += (Number(m.currentTime) || 0);
        }
      }
      let chapterDone = false;
      try { chapterDone = !!(CFG.skipFinished && chapterMarkedDoneInSidebar()); } catch (e) {}
      if (out.unfinished && out.icons <= 1 && out.media === 0 && out.mediaDone > 0
          && iconMediaLike > 0 && iconQuizLike === 0) {
        out.why.push(`${out.unfinished} 个图标没更新（媒体已全部播完 → 按做完处理）`);
        out.unfinished = 0;
      } else if (out.unfinished && iconQuizLike > 0 && out.media === 0) {
        out.why.push(`${out.unfinished} 个任务点未完成（挂的是测验/作业，题目还没读到 → 不算做完）`);
      } else if (out.unfinished) {
        out.why.push(`${out.unfinished} 个任务点未完成`);
      }
      if (out.media) out.why.push(out.playing ? `${out.playing} 个媒体正在播` : `${out.media} 个媒体还没播完`);
      const qz = quizWork();
      if (qz) { out.quiz = qz.n; out.why.push(qz.why); }
      if (!qz) {
        const st = quizStashedNow();
        if (st) { out.quiz = st.n; out.why.push(st.why); }
      }
      if (chapterDone) {
        out.unfinished = 0; out.media = 0; out.playing = 0; out.paused = 0; out.quiz = 0;
        out.why = ['本节侧栏已标「已完成」→ 不算活'];
        out.sig += 1;
      }
      out.busy = out.unfinished > 0 || out.media > 0 || out.quiz > 0;
      return out;
    };

    const pickDeep = (sels) => {
      const out = [];
      for (const d of docsAll()) {
        for (const s of sels) {
          try { d.querySelectorAll(s).forEach((e) => { if (!out.includes(e)) out.push(e); }); } catch (e) {}
        }
      }
      return out;
    };

    const findNextText = () => {
      const out = [];
      let scanned = 0;
      for (const d of docsAll()) {
        let list = [];
        try { list = [...d.querySelectorAll('a,button,div,span,li')]; } catch (e) { continue; }
        for (const e of list) {
          if (++scanned > 4000) return out;
          const tf = txtFast(e);
          if (!tf || tf.length > 12) continue;
          if (!/下一节|下一课|下一章|下一讲|下一个/.test(tf)) continue;
          const t = txt(e);
          if (!t || t.length > 8) continue;
          if (!/^(下一节|下一课|下一章|下一讲|下一个)$/.test(t)) continue;
          out.push(e);
        }
      }
      return out;
    };

    const navKey = () => {
      const parts = [location.href];
      try {
        const f = document.documentElement.querySelector('iframe');
        if (f) parts.push(f.getAttribute('src') || '');
      } catch (e) {}
      try {
        const cur = document.querySelector('.posCatalog_select .active, .chapter_item .active, .posCatalog_active, .curChapter, .activeChapter, .posCatalog_activeItem');
        if (cur) parts.push(txt(cur).slice(0, 30));
      } catch (e) {}
      return parts.join(' | ');
    };

    const waitNav = async (before, ms) => {
      const t0 = Date.now();
      while (Date.now() - t0 < ms) {
        await sleep(300);
        if (navKey() !== before) return true;
      }
      return false;
    };

    const overlay = () => {
      const list = pick([SEL_OVERLAY]).filter(vis);
      return list.find((el) => txt(el).trim().length) || list[0];
    };
    function pageTaskLeft() {
      try {
        const m = /[?&]chapterId=(\d+)/.exec(location.href);
        const cid = m ? m[1] : '';
        const node = cid ? (document.getElementById('cur' + cid) || document.querySelector('#cur' + cid)) : null;
        if (node) {
          const inp = node.querySelector('input.jobUnfinishCount,[class*="jobUnfinishCount"]');
          if (inp) return Math.max(0, Number(inp.value) || 0);
          return 0;
        }
        const box = document.querySelector('#_studystate');
        if (box && cid) {
          const j = JSON.parse(box.value || '{}');
          if (String(j.nextChapterId || '') === cid) return Math.max(0, Number(j.unfinishCount) || 0);
        }
      } catch (e) {}
      return -1;
    }

    const closeOverlay = () => {
      const el = overlay();
      if (!el) return false;
      const t = txt(el);
      if (!/继续学习|仍在学习|是否继续|确定|知道了|继续播放|学习时长/.test(t)) return false;
      const btn = [...el.querySelectorAll('a,button,span,div')].find((b) =>
        vis(b) && /^(继续学习|继续|确定|知道了|关闭|是)$/.test(txt(b)));
      if (btn) { click(btn); addLog('关闭确认弹窗', 'info'); return true; }
      return false;
    };

    const dismissDialog = (ovEl) => {
      const el = ovEl || overlay();
      if (!el) return false;
      try {
        if (getComputedStyle(el).display === 'none') return true;
      } catch (e) {}
      let btn = null;
      try {
        btn = [...el.querySelectorAll('a,button,span,i,img')].find((b) => {
          const oc = String(b.getAttribute && b.getAttribute('onclick') || '');
          return /closeDeleteWindow|closeWindow|closePop|hidePop/i.test(oc);
        }) || [...el.querySelectorAll('a,button,span,i,img')].find((b) => {
          const cls = String(b.className || '');
          return /popClose|pop-close|close_btn|closeBtn|icon-close|ico-close/i.test(cls);
        }) || [...el.querySelectorAll('a,button,span,i,img')].find((b) => {
          const aria = String(b.getAttribute && b.getAttribute('aria-label') || '');
          return /关闭|close/i.test(aria);
        });
      } catch (e) {}
      if (btn) {
        const oc = String(btn.getAttribute && btn.getAttribute('onclick') || '');
        let ok = false;
        try {
          if (typeof btn.onclick === 'function') { btn.onclick.call(btn, { target: btn, currentTarget: btn, preventDefault() {}, stopPropagation() {} }); ok = true; }
        } catch (e) {}
        if (!ok && oc) { try { new W.Function(oc).call(W); ok = true; } catch (e) {} }
        if (!ok) { try { click(btn); ok = true; } catch (e) {} }
        if (ok) {
          try { if (getComputedStyle(el).display === 'none') { addLog('已收起弹层（点「✕」）', 'info'); return true; } } catch (e) {}
        }
      }
      try {
        if (typeof W.closeDeleteWindow === 'function') {
          W.closeDeleteWindow();
          try { if (getComputedStyle(el).display === 'none') { addLog('已收起弹层（调用平台 closeDeleteWindow）', 'info'); return true; } } catch (e) {}
        }
      } catch (e) {}
      try {
        el.style.display = 'none';
        addLog('弹层没能被平台收掉 → 先把它隐藏起来（不改平台状态，继续刷）', 'warn');
        return true;
      } catch (e) {}
      return false;
    };

    let skipIntentUntil = 0;
    const setSkipIntent = (on) => { skipIntentUntil = on ? Date.now() + 25000 : 0; };
    const hasSkipIntent = () => Date.now() < skipIntentUntil;
    const dialogAction = () => {
      const els = pick([SEL_OVERLAY]).filter(vis);
      const target = els.find((el) => /任务点未完成|是否去完成|还有任务点/.test(txt(el)));
      if (!target) return null;
      const nextBtn = [...target.querySelectorAll('a,button,span,div')]
        .find((b) => vis(b) && txt(b).length <= 6 && /^(下一节|下一课|跳过|下节)$/.test(txt(b)));
      const goBtn = [...target.querySelectorAll('a,button,span,div')]
        .find((b) => vis(b) && txt(b).length <= 6 && /^(去学习|去完成|继续学习|取消|关闭)$/.test(txt(b)));
      if (!nextBtn && !goBtn) return null;
      if (CFG.skipIncomplete && pageTaskLeft() === 0) {
        const gone = dismissDialog(target);
        if (blockedUntil > Date.now()) {
          addLog(`这个残留弹层挡出来的退避（还剩 ${Math.ceil((blockedUntil - Date.now()) / 1000)} 秒）也一起取消`, 'info');
          blockedUntil = 0;
          blockStamp++;
        }
        addLog(`平台这个「任务点未完成」弹层是残留（平台自己也说本章 ${0} 个待完成任务点）→ 收起它继续走`
          + (gone ? '' : '（没能收掉，不影响继续）'), 'info');
        return null;
      }
      if (CFG.skipIncomplete && hasSkipIntent()) {
        if (nextBtn) { click(nextBtn); addLog('任务点未完成弹窗 → 点「下一节」跳过（本次是脚本决定放弃）', 'ok'); return nextBtn; }
        if (goBtn) { click(goBtn); addLog('任务点未完成弹窗 → 无「下一节」按钮，点「去学习」', 'info'); return goBtn; }
      }
      logOnce('keep-working', '弹窗「任务点未完成」→ 保留没做完的任务点，不点「下一节」（想强跳就把设置里的「跳过未完成弹窗」打开）', 'info', 60000);
      return null;
    };

    const platformUnfinished = () => {
      const out = [];
      for (const d of docsAll()) {
        let icons = [];
        try { icons = [...d.querySelectorAll('.ans-job-icon,[class*="ans-job-icon"]')]; } catch (e) {}
        for (const ic of icons) {
          try {
            if (jobDoneOf(ic, d)) continue;
            const box = ic.closest('.ans-job,[class*="ans-job"],[class*="job-"]') || ic.parentElement;
            const label = (txt(box) || txt(ic) || '任务点').slice(0, 20);
            if (label && out.indexOf(label) < 0) out.push(label + (box && box.querySelector('video,audio') ? '（含媒体）' : ''));
          } catch (e) {}
        }
        if (out.length >= 4) break;
      }
      return out.slice(0, 4);
    };

    const FACE_RE = /人脸(信息采集|识别|验证|核验|认证|采集)|活体检测|请使用学习通APP采集人脸|面部识别|人脸比对|请完成人脸/;
    const facePopupNow = () => {
      for (const d of docsAll()) {
        let cands = [];
        try {
          cands = [...d.querySelectorAll(
            '.maskDiv,.layui-layer,.layui-layer-page,.layui-layer-dialog,.popup,#cx_popup,.ui-dialog,'
            + '.el-dialog,.el-message-box__wrapper,[class*="face"],[class*="faceCheck"],[class*="renlian"],[class*="mask"]'
          )];
        } catch (e) { continue; }
        for (const el of cands) {
          try { if (el.id === 'cxfx-face' || (el.closest && el.closest('#cxfx-panel'))) continue; } catch (e) {}
          let t = '';
          try { t = txt(el); } catch (e) { continue; }
          if (!t || !FACE_RE.test(t)) continue;
          if (!vis(el)) continue;
          return { el, text: t.replace(/\s+/g, ' ').trim().slice(0, 120), doc: d };
        }
      }
      return null;
    };

    let faceStopDone = false;
    let faceStopAt = 0;
    let faceResumeAt = 0;
    const clearFaceStop = () => { faceStopDone = false; faceStopAt = 0; faceResumeAt = 0; };
    const faceGuard = () => {
      if (CFG.faceStop === false) return false;
      const hit = facePopupNow();
      if (!hit) {
        if (faceStopDone) {
          if (!faceResumeAt) {
            faceResumeAt = Date.now();
            addLog('人脸弹窗消失了 → 观察 10 秒，确认真的做完了就自动继续刷课', 'info');
          } else if (Date.now() - faceResumeAt > 10000) {
            faceStopDone = false;
            faceResumeAt = 0;
            CFG.enabled = true;
            saveCfg();
            if (CFG.keepAlive) { try { startKeepAlive(true); } catch (e) {} }
            try { hideFaceBanner(); } catch (e) {}
            addLog('人脸核验已完成（弹窗 10 秒没再出现）→ 脚本自动继续刷课', 'ok');
          }
        }
        return false;
      }
      faceResumeAt = 0;
      if (faceStopDone) return true;
      faceStopDone = true;
      faceStopAt = Date.now();
      CFG.enabled = false;
      saveCfg();
      try { if (typeof stopKeepAlive === 'function') stopKeepAlive(); } catch (e) {}
      addLog('⚠ 检测到「人脸核验」弹窗 → 脚本已停手，在这儿等你做完人脸（这是真人才能过的一步）', 'err');
      addLog(`   弹窗内容：${hit.text}`, 'err');
      addLog('   为什么停：人脸核验点不掉，继续自动点下一节/交卷只会给平台风控留证据，纯粹给账号找麻烦', 'warn');
      addLog('   你要做的：用手机学习通 APP 完成人脸采集/核验。做完了弹窗一消失，脚本会自己接着刷，不用管它', 'warn');
      try { if (typeof showFaceBanner === 'function') showFaceBanner(hit.text); } catch (e) {}
      return true;
    };


    const explainBlock = () => {
      const list = platformUnfinished();
      addLog(list.length
        ? `平台认为本页还有没做完的任务点：${list.join('；')}`
        : '平台说任务点没完成，但页面上找不到未完成的任务点图标（可能任务点在别的分页/别的章节）', 'warn');
      if (quizSavedInfo) {
        addLog(`根因很可能在这：本页测验只「暂存」没交卷（${quizSavedInfo.note}）→ 平台的任务点永远是未完成，所以它不让走。`
          + '三个办法：① 设置页把「正确率阈值」调到 0（答完就交，最省事）；② 打开「跳过未完成弹窗」（放弃这个任务点直接下一节）；'
          + '③ 诊断页点「交卷并跳下一节」（按你的命令交卷再走）', 'warn');
      } else {
        addLog('想强行往下走：① 设置页打开「跳过未完成弹窗」；② 或诊断页点「交卷并跳下一节」（脚本菜单里也有同名项）', 'info');
      }
    };

    const nodeText = (n) => txt(n).slice(0, 24);

    const goSidebarNext = () => {
      const nodes = pick(SEL_NODE).filter(vis);
      if (!nodes.length) { addLog('侧栏没找到目录节点（选择器全落空）', 'warn'); return false; }
      let last = '';
      try { last = localStorage.getItem(NODE_KEY) || ''; } catch (e) {}
      let idx = last ? nodes.findIndex((n) => nodeText(n).indexOf(last) === 0) : -1;
      if (idx < 0) {
        idx = nodes.findIndex((n) => /active|current|select/i.test(typeof n.className === 'string' ? n.className : '')
          || n.querySelector('.active,.current,.posCatalog_active'));
      }
      const order = idx >= 0 ? [...nodes.slice(idx + 1), ...nodes.slice(0, idx + 1)] : nodes;
      for (const n of order) {
        if (jobDoneOf(n, document)) continue;
        try { localStorage.setItem(NODE_KEY, nodeText(n)); } catch (e) {}
        addLog('侧栏跳转：' + nodeText(n), 'info');
        click(n);
        try {
          const oc = n.getAttribute && n.getAttribute('onclick');
          if (oc && /getTeacherAjax|changChapter|toChapter|nextChapter/i.test(oc)) {
            clickNodeOnclick(n, oc);
          }
        } catch (e) {}
        return true;
      }
      addLog('侧栏所有节点都已完成，没有可跳的未完成节点', 'warn');
      return false;
    };

    const clickNodeOnclick = (n, oc) => {
      try {
        if (typeof n.onclick === 'function') {
          n.onclick.call(n, { target: n, currentTarget: n, preventDefault() {}, stopPropagation() {} });
          addLog('行内 onclick 已直接调用', 'info');
          return true;
        }
      } catch (e) {}
      try {
        const fn = new W.Function(oc);
        fn.call(W);
        addLog('行内 onclick 已在页面上下文执行', 'info');
        return true;
      } catch (e) {
        addLog('行内 onclick 调用失败：' + e.message, 'warn');
        return false;
      }
    };

    let tabVisited = new Set();
    let tabVisitedKey = '';
    const taskTabs = () => {
      const bar = document.getElementById('prev_tab');
      if (!bar) return [];
      let lis = [];
      try { lis = [...bar.querySelectorAll('li')]; } catch (e) { return []; }
      return lis.map((li) => ({
        el: li,
        id: li.id || '',
        title: (li.getAttribute('title') || txt(li) || '').trim() || '(无名任务点)',
        active: /(^|\s)active(\s|$)/.test(String(li.className || '')),
        oc: li.getAttribute('onclick') || '',
      })).filter((t) => t.oc || t.el);
    };
    const switchTaskTab = (reason) => {
      const tabs = taskTabs();
      if (tabs.length < 2) return false;
      if (curTabHasUnfinishedMedia()) {
        logOnce('tab-media-hold', '本页还有别的任务点标签，但当前这个标签里的媒体还没做完 → 先不切（切走会把没看完的视频丢下）', 'info', 120000);
        return false;
      }
      const cid = (/(?:chapterId|chapterid)=(\d+)/.exec(location.href) || [])[1] || location.href;
      if (tabVisitedKey !== cid) { tabVisitedKey = cid; tabVisited = new Set(); }
      const cur = tabs.find((t) => t.active) || null;
      if (cur) tabVisited.add(cur.id || cur.title);
      const next = tabs.find((t) => !t.active && !tabVisited.has(t.id || t.title));
      if (!next) return false;
      tabVisited.add(next.id || next.title);
      addLog(`本页还有没做完的任务点（${reason}），但当前标签「${cur ? cur.title : '?'}」已经没活了 → 切到「${next.title}」继续`, 'info');
      if (!clickTabOnclick(next.el, next.oc)) {
        try { next.el.click(); } catch (e) {}
        addLog(`「${next.title}」的行内 onclick 没能执行 → 改用普通点击兜底`, 'warn');
      }
      return true;
    };
    const clickTabOnclick = (el, oc) => {
      try {
        if (typeof el.onclick === 'function') { el.onclick.call(el, { target: el, currentTarget: el, preventDefault() {}, stopPropagation() {} }); return true; }
      } catch (e) {}
      try { if (typeof W.changeDisplayContent === 'function' && oc) { new W.Function(oc).call(W); return true; } } catch (e) {}
      try { if (oc) { new W.Function(oc).call(W); return true; } } catch (e) {}
      return false;
    };
    const allTabsVisited = () => {
      const tabs = taskTabs();
      if (tabs.length < 2) return true;
      const cid = (/(?:chapterId|chapterid)=(\d+)/.exec(location.href) || [])[1] || location.href;
      if (tabVisitedKey !== cid) return false;
      return tabs.every((t) => t.active || tabVisited.has(t.id || t.title));
    };
    const curTabHasUnfinishedMedia = () => {
      for (const d of docsAll()) {
        let icons = [];
        try { icons = [...d.querySelectorAll('.ans-job-icon')]; } catch (e) { continue; }
        for (const i of icons) {
          if (jobDoneOf(i, d)) continue;
          const holder = i.parentElement || i;
          try {
            const f = holder.querySelector('iframe');
            const fsrc = f ? (f.getAttribute('src') || f.src || '') : '';
            if (fsrc && QUIZ_IFRAME_RE.test(fsrc)) continue;
          } catch (e) {}
          let m = null;
          try { m = holder.querySelector('video,audio'); } catch (e) {}
          if (!m) {
            try {
              const f = holder.querySelector('iframe');
              const fd = f && f.contentDocument;
              if (fd) m = fd.querySelector('video,audio');
            } catch (e) {}
          }
          const clsAll = String(i.className || '') + ' ' + String(holder.className || '');
          if (m || /ans-job-(video|audio)|video|audio/i.test(clsAll)) {
            if (m && mediaFinished(m)) continue;
            return true;
          }
        }
      }
      return false;
    };

    const keyboardNext = () => {
      const target = document.body || document.documentElement;
      for (const k of ['ArrowRight', 'PageDown']) {
        const code = k === 'ArrowRight' ? 39 : 34;
        target.dispatchEvent(new KeyboardEvent('keydown', { key: k, code: k, keyCode: code, which: code, bubbles: true }));
        target.dispatchEvent(new KeyboardEvent('keyup', { key: k, code: k, bubbles: true }));
      }
      addLog('已尝试键盘 →/PageDown 切换', 'info');
    };

    const handleTaskBlock = async (ovEl, allowSkip) => {
      explainBlock();
      if (allowSkip) {
        const go = [...ovEl.querySelectorAll('a,button,span,div,i')]
          .find((b) => /^(下一节|跳过|跳过本节|继续下一节)$/.test(txt(b)));
        if (go) {
          addLog('你手动要求跳转 → 按你的意思点弹窗里的「下一节」', 'warn');
          click(go);
          lastClick = Date.now();
          await sleep(1200);
          return true;
        }
        addLog('弹窗里没有「下一节」按钮 → 只收起弹窗，继续找页面上的下一节', 'info');
        dismissDialog(ovEl);
        return false;
      }
      blockStamp++;
      const sec = blockFor();
      setSkipIntent(false);
      logOnce('taskblock' + blockStrikes,
        `平台要求先完成本页任务点 → ${Math.round(sec / 60)} 分钟内不再尝试跳转（脚本会继续刷，刷完了它自己会走）`, 'info', 600000);
      dismissDialog(ovEl);
      if (CFG.blockAutoSubmit && quizSavedInfo
        && lastAnswerStat.total && lastAnswerStat.answered >= Math.ceil(lastAnswerStat.total / 2)) {
        const stat = lastAnswerStat;
        const sig = `${stat.total}/${stat.answered}/${(quizSavedInfo && quizSavedInfo.note) || ''}`;
        if (blockAutoSig !== sig) {
          blockAutoSig = sig;
          addLog(`平台挡住了，而卡住的唯一原因是「${quizSavedInfo.note}」→ 替你交了这一卷，交完继续走`
            + `（不想这样就去设置页关掉「被挡住时替我交卷」）`, 'warn');
          resolveAndGo().catch((e) => addLog('自动交卷出口失败：' + e.message, 'err'));
          return true;
        }
        logOnce('no-auto-submit-' + blockStrikes,
          '本来可以替你交了这一卷（卡住的原因就是它），但这次没交：这一卷已经替你交过一次了（不重复提交）', 'info', 600000);
        return false;
      }
      if (quizSavedInfo) {
        const stat = lastAnswerStat || { total: 0, answered: 0 };
        const why = !CFG.blockAutoSubmit ? '设置页「被挡住时替我交卷」是关的（打开它，或把正确率阈值调 0）'
          : !stat.total ? '这一页还没读到题目（等它渲染 / 点诊断页「交卷并跳下一节」手动交）'
            : `只填了 ${stat.answered}/${stat.total} 题，不足一半 → 怕交成白卷，所以拦住了`;
        logOnce('no-auto-submit-' + blockStrikes,
          `本来可以替你交了这一卷（卡住的原因就是它），但这次没交：${why}`, 'info', 600000);
      }
      return false;
    };

    const forceInner = async (reason, opts) => {
      if (!CFG.enabled || !/\/mycourse\/studentstudy/.test(location.href)) return false;
      if (quizFlowBusy()) {
        logOnce('quiz-flow-hold-jump', '测验仍在答题/提交（含等待模型或二次确认）→ 暂不跳章，等这一流程收尾', 'warn', 15000);
        return false;
      }
      const allowSkip = !!(opts && opts.allowSkip);
      setSkipIntent(allowSkip);
      const now = Date.now();
      if (now - lastClick < CFG.jumpCooldown * 1000) return false;
      if (allowSkip && now < blockedUntil) {
        addLog(`平台的任务点退避被手动命令放行（原还剩 ${Math.ceil((blockedUntil - now) / 1000)} 秒）`, 'info');
        blockedUntil = 0;
      }
      if (now < blockedUntil) {
        logOnce('blocked-wait', `平台要求先做完本页任务点 → 还要等 ${Math.ceil((blockedUntil - now) / 1000)} 秒才会再试跳转`, 'info', 60000);
        setSkipIntent(false);
        return false;
      }

      if (!allowSkip) {
        const w = workState();
        if (w.busy) {
          logOnce('busy-keep', `本页还有活没干完（${w.why.join('、')}）→ 这次不跳，继续刷`, 'info');
          setSkipIntent(false);
          return false;
        }
      }

      if (overlay()) {
        const wasBlocked = blockStamp;
        const acted = dialogAction();
        if (acted) { lastClick = Date.now(); await sleep(900); return true; }
        if (blockStamp !== wasBlocked || Date.now() < blockedUntil) {
          addLog('平台挡住不让走 → 这次到此为止，不再点「下一节」', 'info');
          setSkipIntent(false);
          return false;
        }
        const ovEl = overlay();
        if (ovEl && /任务点未完成|是否去完成|还有任务点/.test(txt(ovEl))) {
          return await handleTaskBlock(ovEl, allowSkip);
        } else if (closeOverlay()) { lastClick = Date.now(); await sleep(600); }
        else {
          const el = overlay();
          logOnce('ov-block', `有弹层但没能处理（继续尝试跳转）：class="${clsOf(el)}" 文字「${txt(el).slice(0, 28)}」`, 'warn');
        }
      }

      lastClick = Date.now();
      const before = navKey();

      const cands = [];
      for (const e of pickDeep(SEL_NEXT)) if (!cands.includes(e)) cands.push(e);
      for (const e of findNextText()) if (!cands.includes(e)) cands.push(e);

      const usable = cands.filter((c) => vis(c) && !dis(c));
      if (!cands.length) {
        addLog('未找到「下一节」按钮（顶层 + iframe 都没有）→ 走侧栏/键盘兜底', 'warn');
      } else if (!usable.length) {
        addLog(`找到 ${cands.length} 个「下一节」候选，但都被禁用/不可见 → 走侧栏兜底`, 'warn');
      }

      const DLG_SEL = '.layui-layer,.el-dialog,.el-message-box,.ui-dialog,.maskDiv,#cx_popup,[class*="dialog"],[class*="popup"],[class*="jobFinishTip"]';
      const inDialog = (el) => { try { return !!(el && el.closest && el.closest(DLG_SEL)); } catch (e) { return false; } };
      const safe = usable.filter((c) => !inDialog(c));
      let use = safe;
      if (!safe.length && usable.length) {
        if (CFG.skipIncomplete && hasSkipIntent()) use = usable;
        else {
          use = [];
          logOnce('dlg-skip-refuse', `找到 ${usable.length} 个「下一节」候选，但都在弹窗里（平台在问「任务点没完成，要跳过吗？」）→ 不点它，保留没做完的任务点（想强跳就打开设置里的「跳过未完成弹窗」）`, 'info', 60000);
        }
      }
      for (const el of use.slice(0, 3)) {
        addLog(`点击下一节（${reason}）：<${(el.tagName || '').toLowerCase()} class="${clsOf(el)}">「${txt(el).slice(0, 12)}」`, 'info');
        click(el);
        if (await waitNav(before, 3000)) { addLog('已跳到下一节 ✔', 'ok'); return true; }
        try {
          const oc = el.getAttribute && el.getAttribute('onclick');
          if (oc && /next|Next|PCount|changeDisplay|toNext/i.test(oc)) {
            addLog('  ↳ 行内 onclick 里有跳转函数 → 直接执行它（合成点击点不动这种 div）', 'info');
            clickNodeOnclick(el, oc);
            if (await waitNav(before, 3000)) { addLog('已跳到下一节 ✔（走行内 onclick）', 'ok'); return true; }
          }
        } catch (e) {}
        const bd = overlay();
        if (bd && /任务点未完成|是否去完成|还有任务点/.test(txt(bd))) {
          addLog('平台弹「任务点未完成」了 → 不再换候选硬点', 'warn');
          return await handleTaskBlock(bd, allowSkip);
        }
        addLog('……点了但页面没变化，换下一个候选', 'warn');
      }

      if (goSidebarNext()) {
        if (await waitNav(before, 3500)) { addLog('侧栏跳转成功 ✔', 'ok'); return true; }
        const bd2 = overlay();
        if (bd2 && /任务点未完成|是否去完成|还有任务点/.test(txt(bd2))) return await handleTaskBlock(bd2, allowSkip);
        addLog('……侧栏点了但页面没变化', 'warn');
      }
      keyboardNext();
      if (await waitNav(before, 2500)) { addLog('键盘跳转生效 ✔', 'ok'); return true; }

      fails++;
      addLog(`跳过失败（第 ${fails} 次）：按钮 / 侧栏 / 键盘三条路都没让页面变化`, 'err');
      setSkipIntent(false);
      return false;
    };

    const force = async (reason, opts) => {
      if (forcing) return false;
      forcing = true;
      try { return await forceInner(reason, opts); } finally { forcing = false; }
    };

    let blankLenCache = { at: 0, v: 0 };
    const blankAreaLen = () => {
      const now = Date.now();
      if (now - blankLenCache.at < 6000) return blankLenCache.v;
      let n = 0, seen = 0;
      for (const f of document.querySelectorAll('iframe')) {
        if (++seen > 8) break;
        try {
          const d = f.contentDocument;
          if (d && d.body) n += (d.body.textContent || '').replace(/\s+/g, '').length;
        } catch (e) {}
      }
      for (const sel of ['#content', '.chapter-content', '.main-content', '#ztext', '.content', '.chapter_body']) {
        for (const el of document.querySelectorAll(sel)) n += (el.textContent || '').replace(/\s+/g, '').length;
      }
      blankLenCache = { at: now, v: n };
      return n;
    };
    let blankCheckAt = 0;
    const blankCheck = () => {
      if (CFG.blankReload === false) return;
      const nowTick = Date.now();
      if (nowTick - blankCheckAt < 5000) return;
      blankCheckAt = nowTick;
      let blocked = [];
      try { blocked = platformUnfinished(); } catch (e) { return; }
      if (!blocked.length) { blankSince = 0; return; }
      if (blankAreaLen() >= 20) { blankSince = 0; return; }
      if (!blankSince) { blankSince = Date.now(); return; }
      if (Date.now() - blankSince < 20000) return;
      const now = Date.now();
      reloadTimes = reloadTimes.filter((t) => now - t < 600000);
      if (reloadTimes.length >= 2) {
        logOnce('blank-nomore', '内容区还是空白，但 10 分钟内已自动刷新 2 次 → 不再自动刷（手动刷新一下或稍后再来）', 'warn', 300000);
        blankSince = 0;
        return;
      }
      reloadTimes.push(now);
      saveReloadTimes();
      addLog('内容区是空白（平台页面自己卡住了）→ 自动刷新一次恢复', 'warn');
      setTimeout(() => { try { location.reload(); } catch (e) {} }, 900);
    };

    let blankVideoSince = 0, blankVideoTried = 0;
    const mediaBlankNow = () => {
      let seen = 0, blank = 0;
      for (const dd of docsAll()) {
        let vs = [];
        try { vs = [...dd.querySelectorAll('video')]; } catch (e) { continue; }
        for (const v of vs) {
          const src = v.currentSrc || v.src || v.getAttribute('src') || '';
          if (!src) continue;
          if (!v.clientWidth && !v.clientHeight) continue;
          seen++;
          if (v.readyState >= 2 || v.videoWidth > 0 || v.ended) continue;
          blank++;
        }
      }
      return { seen, blank };
    };
    const mediaBlankCheck = (w) => {
      if (CFG.blankReload === false) return;
      if (!w || !w.busy || !(w.media || w.unfinished)) { blankVideoSince = 0; blankVideoTried = 0; return; }
      const st = mediaBlankNow();
      if (!st.seen || !st.blank) { blankVideoSince = 0; blankVideoTried = 0; return; }
      const now = Date.now();
      if (!blankVideoSince) { blankVideoSince = now; return; }
      const held = now - blankVideoSince;
      if (held > 8000 && blankVideoTried < 1) {
        blankVideoTried = 1;
        for (const dd of docsAll()) {
          let vs = [];
          try { vs = [...dd.querySelectorAll('video')]; } catch (e) { continue; }
          for (const v of vs) {
            if (!(v.currentSrc || v.src || v.getAttribute('src'))) continue;
            if (v.readyState >= 2 || v.videoWidth > 0 || v.ended) continue;
            try { v.load(); } catch (e) {}
            try { v.muted = true; v.playbackRate = rateFor(v); const p = v.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
          }
        }
        addLog(`视频区是黑的（${st.blank} 个 video 连画面都没加载出来）→ 重新加载一次试试`, 'warn');
        lastProgress = Date.now();
        return;
      }
      if (held < 20000) return;
      const nowT = Date.now();
      reloadTimes = reloadTimes.filter((t) => nowT - t < 600000);
      if (reloadTimes.length >= 2) {
        logOnce('blankvideo-nomore', '视频还是黑屏，但 10 分钟内已自动刷新 2 次 → 不再自动刷（手动刷新一下就好）', 'warn', 300000);
        blankVideoSince = 0;
        return;
      }
      reloadTimes.push(nowT);
      saveReloadTimes();
      addLog('视频黑屏满 20 秒还没恢复（跳转后播放器自己没初始化完）→ 自动刷新一次恢复', 'warn');
      setTimeout(() => { try { location.reload(); } catch (e) {} }, 900);
    };

    let nodeIdx = 0;
    const unfinishedNodes = () => {
      const raw = pick(SEL_NODE).filter(vis).filter((n) => !jobDoneOf(n, document));
      return raw.filter((n) => !raw.some((m) => m !== n && m.contains(n)));
    };
    const nextUnfinishedNodeText = () => {
      const list = unfinishedNodes();
      if (!list.length) return null;
      return nodeText(list[nodeIdx % list.length]) || '';
    };

    const gotoUnfinished = () => {
      if (Date.now() < blockedUntil) {
        logOnce('goto-blocked', `平台挡着没放行 → 连侧栏也不点了（还有 ${Math.ceil((blockedUntil - Date.now()) / 1000)} 秒）`, 'info', 120000);
        return false;
      }
      const list = unfinishedNodes();
      if (!list.length) return false;
      const n = list[nodeIdx % list.length];
      nodeIdx++;
      addLog('兜底跳未完成任务点：' + nodeText(n), 'warn');
      try { localStorage.setItem(NODE_KEY, nodeText(n)); } catch (e) {}
      click(n);
      return true;
    };

    let lastNav = Date.now(), lastUrl = location.href;
    setInterval(() => {
      if (location.href !== lastUrl) { lastUrl = location.href; lastNav = Date.now(); fails = 0; }
    }, 500);

    let lastProgress = Date.now();
    let mediaPokeAt = 0, mediaPokeTries = 0, gaveUpMedia = false;
    let lastSig = -1;
    let lastQSig = '';
    let nodeTries = 0;
    const tickFn = () => {
      if (!/\/mycourse\/studentstudy/.test(location.href)) return;
      if (faceGuard()) return;
      if (quizFlowBusy()) {
        logOnce('quiz-flow-tick-hold', '测验答题/提交仍在进行 → 本轮不做跳章或空闲判定', 'info', 30000);
        return;
      }
      if (overlay()) {
        if (dialogAction()) { lastClick = Date.now(); return; }
        closeOverlay();
      }

      blankCheck();

      const w = workState();
      if (w.sig !== lastSig) { lastSig = w.sig; if (w.media) lastProgress = Date.now(); nodeIdx = 0; nodeTries = 0; }
      const qSig = quizLive.answered + '/' + quizLive.total;
      if (qSig !== lastQSig) { lastQSig = qSig; if (quizLive.total) { lastProgress = Date.now(); nodeTries = 0; } }

      if (w.busy) {
        if (w.paused && !w.playing && Date.now() - mediaPokeAt > 20000) {
          mediaPokeAt = Date.now();
          if (mediaPokeTries < 3) {
            mediaPokeTries++;
            let poked = false;
            try {
              for (const dd of docsAll()) {
                let ms = [];
                try { ms = [...dd.querySelectorAll('video,audio')]; } catch (e) {}
                const v = ms.find((m) => !mediaFinished(m) && m.paused);
                if (v) {
                  click(v);
                  if (mediaPokeTries >= 3) fallbackRate(v, '点了两次都没起来');
                  try { v.muted = true; v.playbackRate = rateFor(v); v.play(); } catch (e) {}
                  poked = true;
                  break;
                }
              }
            } catch (e) {}
            if (poked) { addLog(`视频是暂停的 → 我替它点一下播放（第 ${mediaPokeTries} 次）`, 'info'); lastProgress = Date.now(); return; }
          }
          gaveUpMedia = true;
          logOnce('media-giveup', '点了 3 次还是播不动这个视频 → 不再反复点它了，但**仍算「没做完」**，不会自己跳过；要跳请打开设置里的「跳过未完成弹窗」', 'warn', 600000);
          lastProgress = Date.now();
        }
        logOnce('busy-keep-tick', `本页还在刷（${w.why.join('、')}）→ 干完自动跳下一节，不会提前跳`, 'info', 45000);
        mediaBlankCheck(w);
        const paperFull = !!(quizSavedInfo && lastAnswerStat.total
          && lastAnswerStat.answered >= lastAnswerStat.total);
        if (!w.media && !w.quiz && Date.now() - lastProgress > 12000) {
          const left = pageTaskLeft();
          if (left > 0 && !allTabsVisited() && switchTaskTab(`平台说本页还有 ${left} 个任务点没做完`)) {
            lastProgress = Date.now();
            nodeTries = 0;
            mediaPokeTries = 0;
            gaveUpMedia = false;
            return;
          }
        }
        if (w.quiz && !paperFull && Date.now() - lastProgress > 20000 && retryQuiz(w.why.join('、'))) { lastProgress = Date.now(); return; }
        if (!w.media && !paperFull && Date.now() - lastProgress > 20000) {
          if (nodeTries < 3) {
            const nxt = nextUnfinishedNodeText();
            if (nxt !== null && gotoUnfinished()) {
              nodeTries++;
              lastProgress = Date.now();
              addLog(`本节还有任务点没做（下一个：${nxt || '见侧栏'}）→ 主动去打开它（第 ${nodeTries} 次）`, 'info');
              return;
            }
          } else {
            logOnce('nodes-tried', '本节剩下的任务点都点过了还是没进展 → 交给下面的「卡住」逻辑处理', 'info', 120000);
          }
        }
        if (w.quiz && quizSavedInfo && lastAnswerStat.total
          && lastAnswerStat.answered >= lastAnswerStat.total
          && Date.now() - lastProgress > 25000) {
          const stat = lastAnswerStat;
          const rate = stat.total ? Math.round((stat.answered / stat.total) * 100) : 0;
          if (CFG.autoSubmit && rate >= Number(CFG.submitThreshold || 0)) {
            logOnce('fs1-submit-now', `这一卷已经填满 ${stat.answered}/${stat.total} 但没交上`
              + `（平台因此一直挡着跳转）→ 按设置补交一次`, 'warn', 120000);
            lastProgress = Date.now();
            nodeTries = 0;
            resolveAndGo().catch(() => {});
            return;
          }
          logOnce('fs1-hold',
            `这一卷已经填好 ${stat.answered}/${stat.total} 题，但按你的设置不交卷（${quizSavedInfo.note}）`
            + `→ 平台的任务点会一直是「未完成」，所以它会一直挡着不让跳下一节（这就是你看到的「卡在这个界面」）。`
            + `两条路：① 设置页把「自动提交」打开、并把「正确率阈值」调到 0（答完就交，最省事）；`
            + `② 打开「跳过未完成弹窗」（放弃这个任务点直接下一节）。诊断页的「交卷并跳下一节」也能立刻交了这一卷。`,
            'warn', 90000);
        }
        if (Date.now() - lastProgress < 15000) return;
        const idleMs = Date.now() - lastProgress;
        const skipMin = Number(CFG.stuckSkipMin) || 0;
        if (CFG.autoSkipStuck && skipMin > 0 && idleMs > skipMin * 60000 && Date.now() - lastNav > 8000) {
          if (w.quiz && lastAnswerStat.total && lastAnswerStat.answered) {
            if (CFG.autoSubmit) {
              addLog(`测验卡了 ${Math.round(idleMs / 60000)} 分钟没进展，但答案已经填了 ${lastAnswerStat.answered}/${lastAnswerStat.total}`
                + ` → 先把这一卷交了再走（不交白卷）`, 'warn');
              lastProgress = Date.now();
              nodeTries = 0;
              resolveAndGo().catch(() => {});
              return;
            }
            logOnce('fs2-hold-skip', `这一卷已填好 ${lastAnswerStat.answered}/${lastAnswerStat.total} 题，但「自动提交」是你自己关掉的`
              + ` → 不会替你交卷（这一卷会保持「暂存」）。代价是：平台这个任务点会一直是「未完成」，它会一直挡着下一节。`
              + ` 想让它自己走过去，要么打开「自动提交」，要么打开「跳过未完成弹窗」。`, 'warn', 300000);
            lastProgress = Date.now();
            return;
          }
          addLog(`任务点已经 ${Math.round(idleMs / 60000)} 分钟毫无进展（${w.why.join('、')}）`
            + `→ 判定为「完成不了」，跳过它（想让它一直等就把设置里的「推不动的任务点」关掉或把分钟数调大）`, 'warn');
          lastProgress = Date.now();
          nodeTries = 0;
          force('任务点推不动，跳过这个', { allowSkip: true }).then((ok) => { if (ok) fails = 0; });
          return;
        }
        const grace = Number(CFG.incompleteGrace) || 0;
        if (!grace) {
          logOnce('stuck-wait', `任务点没进展（${w.why.join('、')}），但「卡住多久跳走」是 0 → 一直等它`
            + (CFG.autoSkipStuck ? `（推到 ${skipMin} 分钟还没动就会当「完不成」跳过）` : ''), 'info', 60000);
          return;
        }
        if (idleMs < grace * 1000) return;
        if (Date.now() - lastNav < 8000) return;
        if (!CFG.skipIncomplete) {
          logOnce('stuck-noskip', `任务点已 ${Math.round((Date.now() - lastProgress) / 1000)} 秒没进展（${w.why.join('、')}），但「跳过未完成弹窗」是关的 → 继续等它（想强跳就打开这个开关）`, 'warn', 60000);
          return;
        }
        addLog(`任务点已 ${Math.round((Date.now() - lastProgress) / 1000)} 秒没进展（${w.why.join('、')}）→ 强制尝试下一节`, 'warn');
        lastProgress = Date.now();
        force('卡住超时', { allowSkip: true }).then((ok) => { if (ok) fails = 0; });
        return;
      }

      lastProgress = Date.now();
      if (Date.now() - lastNav < 3000) return;
      {
        const left = pageTaskLeft();
        if (left > 0 && !allTabsVisited() && switchTaskTab(`平台说本页还有 ${left} 个任务点没做完`)) {
          nodeTries = 0;
          mediaPokeTries = 0;
          gaveUpMedia = false;
          return;
        }
      }
      if (fails >= 3) {
        addLog(`连续 ${fails} 次没跳成功 → 改走侧栏目录兜底`, 'warn');
        gotoUnfinished();
        fails = 0;
        lastClick = Date.now();
        return;
      }
      force('空闲检测').then((ok) => { if (ok) fails = 0; });
    };
    tickBodySrc = String(tickFn);
    loopTick(tickFn);

    return {
      force, gotoUnfinished, goSidebarNext, keyboardNext,
      forceNow: (r) => {
        lastClick = 0; blockedUntil = 0; blockStrikes = 0; blockAutoSig = '';
        return forceInner(r || '手动', { allowSkip: true });
      },
      SEL_NEXT, SEL_NODE, docsAll, navKey, overlay, dialogAction, vis, dis, clsOf, workState, quizWork,
      quizFramePending, quizLazySince, QUIZ_LAZY_MAX_MS,
      quizStashedNow,
      platformUnfinished, explainBlock, blankCheck, blankAreaLen, findNextText,
      facePopupNow, faceGuard, FACE_RE, clearFaceStop,
      tickBody: () => tickBodySrc,
      mediaBlankCheck, mediaBlankNow,
      nextUnfinishedNodeText, unfinishedNodes,
      taskTabs, switchTaskTab, pageTaskLeft, allTabsVisited, curTabHasUnfinishedMedia,
      dismissDialog,
      forceInner,
      handleTaskBlock,
      clearBlock: () => { blockedUntil = 0; blockStrikes = 0; blockAutoSig = ''; blankSince = 0; },
      blockFor,
      blockLeft,
    };
  })();

  function statusReport() {
    let w = null;
    try { w = Jump.workState(); } catch (e) {}
    const icons = [];
    for (const d of (() => { try { return Jump.docsAll(); } catch (e) { return [document]; } })()) {
      try { icons.push(...d.querySelectorAll('.ans-job-icon')); } catch (e) {}
    }
    const videos = [];
    for (const d of (() => { try { return Jump.docsAll(); } catch (e) { return [document]; } })()) {
      try { d.querySelectorAll('video,audio').forEach((v) => videos.push(v)); } catch (e) {}
    }
    const qProbe = [];
    document.querySelectorAll('iframe').forEach((f) => {
      try {
        const d = f.contentDocument;
        if (!d) return;
        ['.TiMu', '.questionLi', '.q-main'].forEach((s) => {
          const n = d.querySelectorAll(s).length;
          if (n) qProbe.push(`${s}:${n}`);
        });
      } catch (e) {}
    });
    return {
      页面: location.pathname,
      脚本状态: CFG.enabled ? '启用' : '停用',
      后台保活: keepAliveOn ? '已生效' : (ac && ac.state === 'running' ? '激活中' : '未激活（点一下页面）'),
      音频状态: ac ? ac.state : 'none',
      Worker心跳: workerWake ? '有' : '无（降级为普通定时器）',
      可见性: document.visibilityState,
      后台挂机: `${bgStat.spoof ? '伪装✔' : '伪装✖'} ${bgStat.lock ? '锁✔' : '锁✖'} ${workerWake ? '心跳✔' : '心跳✖'} ${keepAliveOn ? '音频✔' : '音频✖'}`
        + `｜真实可见性 ${realStateNow()}｜主循环 ${bgStat.ticks} 轮`
        + (bgStat.hiddenGapMax ? `｜后台最长间隔 ${(bgStat.hiddenGapMax / 1000).toFixed(1)}s` : '')
        + (bgStat.frozen ? `｜⚠ 有 ${bgStat.frozen} 轮隔了 1 分钟以上` : ''),
      任务点: w
        ? `${icons.length} 个，未完成 ${w.unfinished} 个${w.busy ? `（本页还有活：${w.why.join('、')}）` : '（本页没活干了，会尝试跳下一节）'}`
        : `${icons.length} 个，未完成 ${icons.filter((i) => !jobDoneOf(i, document)).length} 个`,
      媒体进度: videos.length
        ? videos.map((v) => {
            const fin = mediaFinished(v);
            const state = fin ? '已播完' : (v.paused ? '暂停' : '播放中');
            return `${Math.round(v.currentTime)}/${Math.round(v.duration || 0)}s ${state}${jobDone(v) ? ' [已标记完成]' : ''}`;
          }).join(' / ')
        : '无',
      题目容器: qProbe.length ? qProbe.join(' / ') : '未探测到（若当前页有题，请导出结构）',
      测验进度: quizLive.total
        ? `${quizLive.answered}/${quizLive.total} 已填（${quizLive.note}）`
        : (quizPending(document) ? `主文档还有 ${quizPending(document).count} 道题没答完` : '本页没有未完成的测验'),
      卡住原因: quizSavedInfo ? `测验只暂存没交卷：${quizSavedInfo.note}` : (() => {
        try {
          const l = Jump.platformUnfinished();
          return l.length ? `平台认为没做完：${l.join('；')}` : '无（平台没在挡）';
        } catch (e) { return '无'; }
      })(),
      本地题库: `${Object.keys(getBank()).length} 条`,
      AI状态: CFG.aiApi
        ? `${presetOf().name} · ${CFG.aiModel || '未填模型'} · ${CFG.aiProvider} · 缓存 ${Object.keys(aiCache).length} 条${presetOf().needKey && !CFG.aiKey ? ' · ⚠缺密钥' : ''}`
        : '未配置',
      下一节候选: pickNextText(),
      侧栏节点: sideNodeText(),
    };
  }

  function pickNextText() {
    const sels = ['#prevNextFocusNext', '.jb_btn.nextChapter', 'a.nextChapter', '[class*="nextChapter"]', '[title="下一节"]'];
    const out = [];
    for (const s of sels) {
      document.querySelectorAll(s).forEach((e) => {
        const r = e.getBoundingClientRect();
        out.push(`${typeof e.className === 'string' ? e.className : e.id || e.tagName}${r.width ? '' : '(隐藏)'}`);
      });
    }
    return out.join(' | ') || '无';
  }

  function sideNodeText() {
    const sels = ['.posCatalog_select', '.chapter_item', '.catalog_points', '[onclick*="getTeacherAjax"]'];
    const out = [];
    for (const s of sels) document.querySelectorAll(s).forEach((e) => { if (!out.includes(e)) out.push(e); });
    return out.length ? `${out.length} 个（未完成 ${out.filter((n) => !jobDoneOf(n, document)).length}）` : '无';
  }

  function dumpStructure() {
    const desc = (n) => {
      if (!n) return null;
      const cls = typeof n.className === 'string' ? n.className : '';
      return `${n.tagName.toLowerCase()}${n.id ? '#' + n.id : ''}${cls ? '.' + cls.trim().split(/\s+/).join('.') : ''}`;
    };
    const frames = walkIframes(document.documentElement).map((f, i) => {
      let media = [], err = null, q = [];
      try {
        const d = f.contentDocument;
        const root = d && d.documentElement;
        media = [...((root && root.querySelectorAll('video,audio')) || [])]
          .map((v) => `${v.tagName} ${Math.round(v.currentTime)}/${Math.round(v.duration || 0)} ${v.paused ? 'paused' : 'playing'}`);
        ['.TiMu', '.questionLi', '.q-main'].forEach((s) => {
          const n = (d && d.querySelectorAll(s).length) || 0;
          if (n) q.push(`${s}:${n}`);
        });
      } catch (e) { err = String(e.name); }
      return {
        i, src: (f.src || '').slice(0, 160),
        父级: desc(f.parentElement), 父级类: (f.parentElement && f.parentElement.className) || '',
        祖父类: (f.parentElement && f.parentElement.parentElement && f.parentElement.parentElement.className) || '',
        嵌套: !!(f.contentDocument && f.contentDocument.querySelector('iframe')), 媒体: media, 题目: q, 读取失败: err,
      };
    });
    const jobIcons = [...document.querySelectorAll('.ans-job-icon')].map((i) => ({
      图标: desc(i), 图标自身含完成: i.classList.contains(JOB_DONE),
      父级: desc(i.parentElement), 父级类: (i.parentElement && i.parentElement.className) || '',
      完成: jobDoneOf(i, document), 文本: txt(i.parentElement).slice(0, 30),
    }));
    const nodes = ['.posCatalog_select', '.chapter_item', '.catalog_points', '[onclick*="getTeacherAjax"]']
      .flatMap((s) => [...document.querySelectorAll(s)]).map((n) => ({
        元素: desc(n), 文本: txt(n).slice(0, 40),
        上次点击: (() => { try { return localStorage.getItem(NODE_KEY) || ''; } catch (e) { return ''; } })(),
        完成: jobDoneOf(n, document),
      }));
    const cands = [...document.querySelectorAll(
      '#prevNextFocusNext,.jb_btn.nextChapter,a.nextChapter,[class*="nextChapter"],[title="下一节"],[class*="next"],[onclick*="next"],[onclick*="Next"]')]
      .map((e) => ({
        元素: desc(e), 文本: txt(e).slice(0, 16), 可见: !!e.getBoundingClientRect().width,
        onclick: (e.getAttribute('onclick') || '').slice(0, 60),
      }));
    const data = {
      版本: 'v1.3.45', url: location.href, 时间: new Date().toLocaleString('zh-CN'),
      自检: statusReport(), iframe数: frames.length, iframe: frames,
      ansJobIcon: jobIcons, 侧栏节点: nodes, 下一节候选: cands,
      含job类名元素: [...document.querySelectorAll('[class*="job"]')].slice(0, 40).map(desc),
    };
    const json = JSON.stringify(data, null, 2);
    try { W.__CXFIX_DUMP__ = data; } catch (e) {}
    try { console.log('[CXFIX DUMP]', data); } catch (e) {}
    addLog(`结构快照已生成（${json.length} 字符）：控制台执行 copy(__CXFIX_DUMP__) 拷贝`, 'ok');
    try {
      navigator.clipboard.writeText(json)
        .then(() => { addLog('已复制到剪贴板，可直接粘贴反馈', 'ok'); renderLogs(); })
        .catch(() => {});
    } catch (e) {}
    return data;
  }

  function init() {
    GM_addStyle(CSS);
    buildPanel();
    addLog('学习通助手 v1.3.45 已注入', 'ok');
    installVisibilitySpoof();
    if (CFG.keepAlive) startKeepAlive();
    holdBgLock();
    initWorkerWake();
    addLog(`后台挂机已就绪：${bgStat.spoof ? '可见性伪装✔' : '可见性伪装✖'} ${bgStat.lock ? 'Web Lock✔' : 'Web Lock✖'} ${workerWake ? 'Worker 心跳✔' : 'Worker 心跳✖'}（音频保活 ${keepAliveOn ? '✔' : '待激活，点一下页面即可'}）`, 'info');
    if (!keepAliveOn) addLog('提示：切后台挂机前，请先在页面上点一下以激活保活（点过就会一直生效）', 'warn');
    scanMediaDeep(document);
    injectChildKeepAlive();
    loopTick(() => { scanMediaDeep(document); injectChildKeepAlive(); confirmSubmitWatch(); });

    if (/\/mycourse\/studentstudy/.test(location.href)) initChapter();
    else if (/zhihuishu|stuExamWeb/.test(location.href)) addLog('智慧树页面：本整合版仅覆盖学习通', 'warn');
    else addLog('当前非章节学习页，跳章模块待命', 'info');

    GM_registerMenuCommand('显示/隐藏面板', () => {
      if (!panel || !panel.isConnected) buildPanel();
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
    GM_registerMenuCommand('立即跳下一节', () => Jump.forceNow('菜单'));
    GM_registerMenuCommand('★ 交卷并跳下一节（卡住时用）', () => resolveAndGo());
    GM_registerMenuCommand('★ 抓取本页标准答案入库', () => { harvestNow(); renderLogs(); });
    GM_registerMenuCommand('导出页面结构（排查用）', () => dumpStructure());
    GM_registerMenuCommand('状态自检', () => Object.entries(statusReport()).forEach(([k, v]) => addLog(`${k}: ${v}`, 'info')));
    GM_registerMenuCommand('清空日志', () => { logs.length = 0; renderLogs(); });
    GM_registerMenuCommand('清空字库缓存', () => {
      try { GM_setValue(TTF_KEY, 'null'); } catch (e) {}
      try { GM_setValue(GLYPH_MAP_KEY, '{}'); } catch (e) {}
      addLog('字库缓存已清空（宽度表 + 字形映射），下次解密将重建', 'warn');
    });
    GM_registerMenuCommand('立刻重新认字（强制重试一次）', async () => {
      try { GM_setValue(TTF_KEY, 'null'); } catch (e) {}
      try { GM_setValue(GLYPH_MAP_KEY, '{}'); } catch (e) {}
      for (const k of Object.keys(refCache)) delete refCache[k];
      lastAlts = {};
      decryptForce = true;
      decryptBadLoggedAt = Date.now();
      addLog('已清字库缓存并强制重新认字 → 正在重试（下面会打认字过程）…', 'warn');
      let ok = false;
      try {
        ok = await decryptDoc(document);
        const docs = [];
        try { walkIframes(document.documentElement).forEach((f) => { try { if (f.contentDocument) docs.push(f.contentDocument); } catch (e) {} }); } catch (e) {}
        for (const d of docs) { try { if (await decryptDoc(d)) ok = true; } catch (e) {} }
      } catch (e) { addLog('重新认字出错：' + (e && e.message), 'err'); }
      addLog(ok ? '重新认字完成 ✔ 回测验页看看题干是否正常了' : '重新认字没成功（原因见上面的行；把这几行发我）', ok ? 'ok' : 'warn');
      renderLogs();
    });
    GM_registerMenuCommand('测试 AI 连接', async () => {
      const p = presetOf();
      if (!CFG.aiApi || (p.needKey && !CFG.aiKey)) { addLog(`AI 未就绪：${p.name} ${p.tip}`, 'warn'); return; }
      const r = await askAI('中华人民共和国成立于哪一年？', ['1947年', '1949年', '1951年']);
      addLog(r ? `AI 正常：${r.join(' / ')}` : 'AI 测试失败', r ? 'ok' : 'err');
    });

    Object.assign(W.__CXFIX__, {
      CFG, statusReport, Jump, addLog, getBank, importBank, getAnswer,
      dump: dumpStructure, askAI, aiCache, saveCfg, AI_PRESETS,
      dryRun: dryRunCurrentPage, test: dryRunCurrentPage, inspect: reportLiveQuestions,
      selfTest, diagnoseJump, diagnoseChannels, diagnoseDecrypt, probePickOptions,
      diagGlyphCtx, featsLine, matchTextNodes, REF_CHARS_SMALL,
      recognizeChars, rankGlyphs, bestMatch, encFeat, refTableFor,
      trialGain, trialVerdict, GAIN_MIN, GAIN_MARGIN, DECRYPT_JUDGE_VER,
      emFeat, gridOf, isCJK, fontInstalled, fontNameOf, refOrderFor,
      emInfo: () => ({ encFontName, refOrderNow, refSame, dist: accDist() }),
      answerDoc, repairIfGarbled, decryptDoc, askAiGarbled,
      workState: () => Jump.workState(),
      jumpNow: () => Jump.forceNow('控制台'),
      resolveAndGo,
      harvestNow,
      blankRiskNow,
      forceSubmit,
      blocked: () => { try { return Jump.platformUnfinished(); } catch (e) { return []; } },
      looksEncrypted,
      looksCipher,
      isEncryptedStem,
      fontPrintOfDoc,
      cipherFontCount: () => cipherByFont.size,
      cipherSetSize: () => lastCipherSet.size,
      fakeFonts: () => [...fakeFonts],
      isFakeFont: (doc) => { try { const fp = fontPrintOfDoc(doc); return !!(fp && fakeFonts.has(fp)); } catch (e) { return false; } },
      keepAliveRetry,
      bgStat: () => Object.assign({}, bgStat, { realHidden: realHiddenNow(), realState: realStateNow(), keepAliveOn, spoofOn: bgSpoofOn }),
      bgProbe: () => bgProbe(),
      realHiddenNow, realStateNow,
    });
    try {
      Object.defineProperty(W.__CXFIX__, 'logs', { get: () => logs.slice(), configurable: true });
    } catch (e) {
      W.__CXFIX__.logs = logs.slice();
    }
    addLog('控制台可用 __CXFIX__.statusReport() / .dump() / .selfTest() / .jumpNow() / .diagnoseJump()', 'info');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
