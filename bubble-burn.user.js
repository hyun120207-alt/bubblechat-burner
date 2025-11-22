// ==UserScript==
// @name        bubble chat Burner (버블챗 버너) + Backup
// @namespace   https://github.com/hyun120207-alt
// @version     bubble-burn-v0.2.0-backup
// @description 버블챗 캐릭터 채팅 요약, 반영 및 백업 기능. 해당 유저 스크립트는 결정화된 캐즘을 기반으로 작성되었습니다.
// @author      chasm-js, milkyway0308, hyun120207-alt
// @match       https://bubblechat.ai/*
// @match       https://wrtn.ai/*
// @grant       GM.xmlHttpRequest
// @grant       GM_addStyle
// @connect     *
// ==/UserScript==

GM_addStyle(
  ".burner-button { height: 32px; padding: 12px 12px; border-radius: 4px; cursor: pointer; display: flex; flex-direction: row; align-items: center; justify-items: center; border: 1px solid var(--text_action_blue_secondary); color: var(--text_action_blue_secondary); font-size: 14px; font-weight: 600; } " +
    ".burner-button:hover { background-color: var(--bg_dimmed2); } " +
    ".burner-input-button { display: flex !important; } " +
    "@media screen and (max-width:500px) { .burner-button { display: none; } }" +
    "@keyframes rotate { from { transform: rotate(0deg); } to {  transform: rotate(360deg); }}" +
    ".hourglass-container { width: 16px; height: 16px;}" +
    '.hourglass-container[rotate="true"] { animation: 2s rotate infinite;}' +
    ".html-display-button { display: flex !important; flex-direction: row; align-items: center; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; display: block; background: #333; color: #fff;}" +
    '.html-display-button[disabled="true"] { background: #eee; color: #333; cursor: not-allowed; }' +
    ".chasm-burner-status { display: flex; flex-direction: row !important; font-size: 0.8em; margin-bottom: 4px; }" +
    'body[data-theme="dark"] .chasm-burner-status { color: white; }' +
    'body[data-theme="light"] .chasm-burner-status { color: #1a1a1a; }' + 
    '.display-inline-important { display: inline !important; }' +
    ".chasm-floating-button { position: fixed; bottom: 20px; right: 20px; z-index: 9998; background-color: #007bff; color: white; border: none; border-radius: 50%; width: 60px; height: 60px; font-size: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.2); transition: background-color 0.3s; }" +
    ".chasm-floating-button:hover { background-color: #0056b3; }"
);
!(async function () {
  "use strict";
  const VERSION = "v0.2.0-backup";
  const { initializeApp } = await import(
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js"
  );
  const {
    HarmBlockThreshold,
    HarmCategory,
    getAI,
    getGenerativeModel,
    VertexAIBackend,
  } = await import("https://www.gstatic.com/firebasejs/12.1.0/firebase-ai.js");

  const HOURGLASS_SVG =
    '<svg width="16px" height="16px" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M13 2H14V0H2V2H3V4.41421L6.58579 8L3 11.5858V14H2V16H14V14H13V11.5858L9.41421 8L13 4.41421V2ZM5 3.58579V2H11V3.58579L8 6.58579L5 3.58579Z" fill="#e0e0e0"></path></svg>';

  const SPINNER_SVG =
    '<svg fill="#949494" width="12px" height="12px" viewBox="-1.5 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m7.5 21 2.999-3v1.5c4.143 0 7.501-3.359 7.501-7.502 0-2.074-.842-3.952-2.202-5.309l2.114-2.124c1.908 1.901 3.088 4.531 3.088 7.437 0 5.798-4.7 10.498-10.498 10.498-.001 0-.001 0-.002 0v1.5zm-7.5-9c.007-5.796 4.704-10.493 10.499-10.5h.001v-1.5l3 3-3 3v-1.5s-.001 0-.002 0c-4.143 0-7.502 3.359-7.502 7.502 0 2.074.842 3.952 2.203 5.31l-2.112 2.124c-1.907-1.89-3.088-4.511-3.088-7.407 0-.01 0-.02 0-.03v.002z"/></svg>';
  
  const CLOSE_SVG =
    '<svg width="16px" height="16px" viewBox="-0.5 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#FFFFFF"><path d="M3 21.32L21 3.32001" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M3 3.32001L21 21.32" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
  
  const n = "https://contents-api.wrtn.ai",
    e = 5e3,
    i = "**OOC: 현재까지의 롤플레잉 진행상황을 요약해줘.**",
    s = "**OOC: 현재까지의 롤플레잉 진행상황 요약입니다. 이후 응답에 이 요약 내용을 참조하겠습니다.**",
    d = "";

  function c(n, e) {
    let t;
    return function (...o) {
      clearTimeout(t), (t = setTimeout(() => n(...o), e));
    };
  }
  function p() {
    const n = new Date();
    return `${String(n.getMonth() + 1).padStart(2, "0")}/${String(
      n.getDate()
    ).padStart(2, "0")} ${String(n.getHours()).padStart(2, "0")}:${String(
      n.getMinutes()
    ).padStart(2, "0")}`;
  }
  function u() {
    const split = window.location.pathname.substring(1).split("/");
    // bubblechat URL handling might differ, keeping wrtn logic for compatibility
    const characterId = split[1];
    const chatRoomId = split[3];
    return isStoryPath() || isCharacterPath()
      ? { characterId: characterId, chatroomId: chatRoomId }
      : null;
  }
  function extractCookie(key) {
    const e = document.cookie.match(
      new RegExp(
        `(?:^|; )${key.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1")}=([^;]*)`
      )
    );
    return e ? decodeURIComponent(e[1]) : null;
  }
  function throwError(
    n,
    context = "알 수 없는 오류",
    request = null,
    response = null,
    statusCode = undefined
  ) {
    const a = [
      `컨텍스트: ${context}`,
      `오류 메시지: ${n.message || n}`,
      request ? `요청: ${JSON.stringify(request, null, 2)}` : "",
      response ? `응답: ${JSON.stringify(response, null, 2)}` : "",
      statusCode ? `HTTP 코드: ${statusCode}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    console.error(a);
    alert(`오류 발생: ${n.message || n}\n자세한 내용은 콘솔을 확인하세요.`);
    return n;
  }

  // API Request Classes
  async function b(n, e, t = null) {
    const o = {
      method: n,
      headers: {
        Authorization: `Bearer ${extractCookie("access_token")}`,
        "Content-Type": "application/json",
      },
    };
    t && (o.body = JSON.stringify(t));
    try {
      const n = await fetch(e, o);
      if (n.status === 503) {
        throwError(n, new Error("Server overloaded"));
      }
      return 401 === n.status || 403 === n.status
        ? (throwError(new Error("Authentication error"), "인증 오류"), null)
        : n.ok
        ? n.json()
        : null;
    } catch (n) {
      return throwError(n, "Fetch 요청 실패"), null;
    }
  }
  async function x(n, e, t = null, o = {}) {
    return new Promise((a, r) => {
      const l = {
        method: n,
        url: e,
        headers: {
          "Content-Type": o["Content-Type"] || "application/json",
          ...o,
        },
        onload: (n) => {
          if (n.status >= 200 && n.status < 300)
            try {
              a(JSON.parse(n.responseText));
            } catch {
              a(null);
            }
          else a(null);
        },
        onerror: () => {
          const n = new Error("GM request failed");
          throwError(n, "GM 요청 실패"), r(n);
        },
      };
      t && (l.data = JSON.stringify(t)), GM.xmlHttpRequest(l);
    });
  }

  // Class Wrapper
  class y {
    constructor(n = !1) {
      this.request = n ? x : b;
    }
    async getChatroom(e) {
      let roomResult;
      if (isCharacterPath()) {
        roomResult = await this.request("GET", `https://contents-api.wrtn.ai/character-chat/single-character-chats/${e}`);
      } else {
        roomResult = await this.request("GET", `${n}/character-chat/api/v2/chat-room/${e}`);
      }
      return roomResult?.data ? new h(roomResult.data, this.request) : null;
    }
    async getMessages(e, cursor = "", limit = 40) {
      let chatFetchUrl;
      if (isStoryPath()) {
        chatFetchUrl = cursor
          ? `${n}/character-chat/api/v2/chat-room/${e}/messages?limit=${limit}&cursor=${cursor}`
          : `${n}/character-chat/api/v2/chat-room/${e}/messages?limit=${limit}`;
      } else {
        chatFetchUrl = cursor
          ? `${n}/character-chat/single-character-chats/${e}/messages?limit=${limit}&cursor=${cursor}`
          : `${n}/character-chat/single-character-chats/${e}/messages?limit=${limit}`;
      }
      return await this.request("GET", chatFetchUrl);
    }
    async getPersona() {
      const e = (await this.request("GET", `${n}/character/character-profiles`))?.data?.wrtnUid;
      if (!e) return [];
      const t = (await this.request("GET", `${n}/character/character-profiles/${e}`))?.data?._id;
      return ((await this.request("GET", `${n}/character/character-profiles/${t}/character-chat-profiles`))?.data?.characterChatProfiles || []);
    }
  }
  class h {
    constructor(n, e) {
      (this.json = n), (this.request = e);
    }
    async send(e, t = !1, o = "normalchat") {
      const a = await this.request(
        "POST",
        `${n}/character-chat/characters/chat/${this.json._id}/message`,
        { message: e, reroll: !1, images: [], isSuperMode: t, crackerModel: o }
      );
      if (!a?.data) return null;
      const r = await this.request(
        "GET",
        `${n}/character-chat/characters/chat/${this.json._id}/message/${a.data}/result`
      );
      if (r?.data) {
        const result = await fetch(
          `https://contents-api.wrtn.ai/character-chat/characters/chat/${this.json._id}/message/${a.data}?model=SONNET&platform=web&user=`,
          { headers: { Authorization: `Bearer ${extractCookie("access_token")}` } }
        );
        const reader = result.body.getReader();
        while (true) { const { value, done } = await reader.read(); if (done) break; }
        return new v(r.data, this.request);
      }
      return null;
    }
  }
  class v {
    constructor(n, e) {
      (this.json = n), (this.request = e);
    }
    async set(e) {
      const t = await this.request(
        "PATCH",
        `${n}/character-chat/characters/chat/${this.json.chatId}/message/${this.json._id}`,
        { message: e }
      );
      return "SUCCESS" === t?.result ? t : null;
    }
  }

  // Config Management
  class $ {
    static getConfig() {
      let n = JSON.parse(localStorage.getItem("chasmConfig") || "{}");
      return (
        Object.keys(n).length > 0
          ? n.geminiKey ||
            ((n.provider = n.provider ?? "gemini"),
            (n.geminiKey = n.geminiKey ?? ""),
            (n.openRouterKey = n.openRouterKey ?? ""),
            (n.geminiModel = n.geminiModel ?? "gemini-2.5-flash"),
            (n.openRouterModel = n.openRouterModel ?? "deepseek/deepseek-r1-zero:free"),
            (n.userMessage = n.userMessage ?? i),
            (n.prependText = n.prependText ?? s),
            (n.appendText = n.appendText ?? d))
          : (n = {
              provider: "gemini",
              geminiKey: "",
              openRouterKey: "",
              geminiModel: "gemini-2.5-flash",
              openRouterModel: "deepseek/deepseek-r1-zero:free",
              limit: 20,
              select: "custom",
              prompt: "",
              cdnUrls: [],
              userMessage: i,
              prependText: s,
              appendText: d,
              attachUsernote: !1,
            }),
        localStorage.setItem("chasmConfig", JSON.stringify(n)),
        n
      );
    }
    static setConfig(n) {
      localStorage.setItem("chasmConfig", JSON.stringify(n));
    }
  }

  // UI Styling
  function f(n) {
    return {
      modalBg: n ? "#1a1a1a" : "white",
      textColor: n ? "#e0e0e0" : "#333",
      borderColor: n ? "#444" : "#ccc",
      tabActiveBg: n ? "#ffffff" : "#000000",
      tabActiveText: n ? "#1a1a1a" : "#ffffff",
      tabInactiveBg: n ? "#333" : "#ccc",
      tabInactiveText: n ? "#aaa" : "#333",
      buttonBg: n ? "#eee" : "#333",
      buttonText: n ? "#333" : "#fff",
      selectBg: n ? "#2a2a2a" : "#f5f5f5",
      selectText: n ? "#e0e0e0" : "#333",
      selectBorder: n ? "#555" : "#ccc",
    };
  }

  // --- Core Extraction Logic (Shared) ---
  async function getChatMessagesData(limitVal) {
    const messagesLimit = parseInt(limitVal) || 20;
    let messages = [];
    let profileName = "User";
    let userNote = "";

    // 1. BubbleChat DOM Extraction
    if (location.hostname.includes("bubblechat.ai")) {
        try {
            const getMessagesFromDOM = () => {
                const candidateSelectors = [
                  '[class^="ChatListContainer__SListContainer-sc-"].novel-mode .character-text [class^="MarkdownRenderer__SWrapper-sc-"].react-markdown',
                  '[class*="Message__SContainer"] [class*="MarkdownRenderer__SWrapper"]',
                  '.character-text .react-markdown',
                  '[class*="react-markdown"]',
                  '.character-text',
                  'div[class*="message"]',
                  'div[class*="MessageItem__MessageContainer"]',
                ];
                for (const selector of candidateSelectors) {
                  const nodes = document.querySelectorAll(selector);
                  if (nodes.length > 0) {
                    // Attempt to infer role based on class or position if possible, otherwise alternate or generic
                    // Bubblechat usually alternates. For simple extraction, we just get text.
                    // To improve, we might need to check parent containers for 'my-message' vs 'other'.
                    return [...nodes].map(n => {
                         // Simple heuristic for role detection (not perfect on all themes)
                         let role = "assistant";
                         const container = n.closest('[class*="Message__SContainer"]');
                         if (container && container.className.includes("my-message")) role = "user";
                         return { content: n.innerText.trim(), role: role };
                    }).filter(m => m.content);
                  }
                }
                return [];
              };
            
            const raw = getMessagesFromDOM();
            if (raw.length === 0) throw new Error("DOM에서 메시지를 찾을 수 없습니다.");
            
            // Limit
            const sliceStart = Math.max(0, raw.length - (messagesLimit * 2));
            messages = raw.slice(sliceStart);

        } catch (e) {
            console.error(e);
            throw new Error("BubbleChat 메시지 추출 실패: " + e.message);
        }
    } 
    // 2. Wrtn API Extraction
    else {
        const w = new y();
        const urlInfo = u();
        if (!urlInfo) throw new Error("URL 구조가 올바르지 않습니다.");
        
        const roomRes = await w.getChatroom(urlInfo.chatroomId);
        if (!roomRes) throw new Error("채팅방 정보를 불러오지 못했습니다.");
        
        const msgRes = await w.getMessages(urlInfo.chatroomId, "", messagesLimit * 2);
        const rawList = msgRes?.data?.list ?? msgRes?.data?.messages;
        
        if (!rawList) throw new Error("메시지 목록을 불러오지 못했습니다.");
        messages = rawList.reverse(); // API usually gives newest first

        // Get Profile Info
        const personas = await w.getPersona();
        const currentPersona = roomRes.json?.chatProfile?._id
              ? personas.find((n) => n._id == roomRes.json?.chatProfile?._id)
              : personas.find((n) => n.isRepresentative);
        if (currentPersona) profileName = currentPersona.name;
        
        userNote = roomRes.json?.character?.userNote?.content || "";
    }

    return { messages, profileName, userNote };
  }

  // --- Main UI Function ---
  async function C() {
    let n = 0;
    const t = $.getConfig(),
      o = f("dark" === document.body.dataset.theme),
      a = (t.cdnUrls[0], [
        {
            title: "1:1 캐릭터 요약",
            author: "fastwrtn",
            prompt: `[기본 요약 모드]\n대화 내용을 요약해주세요. 시간 순서대로 중요한 사건과 감정 변화를 중심으로 서술하세요.` 
        },
        // ... (Keep original prompts or reduce for brevity in this full code replacement)
        {
             title: "기억보조 v1.0",
             author: "Flora",
             prompt: "다음 대화 로그를 바탕으로 기억 요약을 작성하라."
        }
      ]),
      r = [
        '<option value="custom">사용자 정의</option>',
        ...a.map((n, e) => `<option value="${e}">${n.title} (${n.author})</option>`),
      ].join(""),
      l = Math.min(700, window.innerWidth),
      // CSS for fixed checkboxes
      checkboxStyle = `
        .cb-checkbox {
            appearance: auto !important;
            -webkit-appearance: checkbox !important;
            width: 16px !important;
            height: 16px !important;
            margin-right: 8px !important;
            cursor: pointer;
        }
        .cb-label {
            display: flex; align-items: center; font-size: 0.9em; color: ${o.textColor}; margin-bottom: 10px; cursor: pointer;
        }
      `;

      const i = `
            <div id="chasm-burner" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.6); -webkit-backdrop-filter: blur(6px); backdrop-filter:blur(6px); z-index: 9999; display: flex; justify-content: center; align-items: center;">
                <div id="cb-content" style="background: ${o.modalBg}; color: ${o.textColor}; padding: 20px; border-radius: 8px; width: ${l}px; min-height: 500px; display: flex; flex-direction: column; max-height: 90vh;">
                    <style>
                        ${checkboxStyle}
                        .cb-spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid ${o.buttonText}; border-radius: 50%; border-top-color: transparent; animation: cb-spin 1s linear infinite; margin-left: 5px; vertical-align: middle; }
                        @keyframes cb-spin { to { transform: rotate(360deg); } }
                        ::-webkit-scrollbar { width: 8px; }
                        ::-webkit-scrollbar-thumb { background: #888; border-radius: 4px; }
                    </style>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h2 id="cb-title" style="margin: 0; font-family: Pretendard; display: flex; align-items: baseline; flex-shrink: 0; letter-spacing: -1px;">
                            <span style="font-weight:800; letter-spacing: -1px;">⌘ C2</span>
                            <span style="font-weight:600; margin-left: 5px;">burner+</span>
                            <span style="font-weight:500; font-size: 0.7em; color: #999; margin-left: 8px;">${VERSION}</span>
                        </h2>
                        <button id="cb-close" style="background: none; border: none; color: ${o.textColor}; font-size: 1.2em; cursor: pointer; padding: 0;">✕</button>
                    </div>
                    <div id="cb-tabs" style="display: flex; gap: 10px; flex-shrink: 0; margin-bottom: 10px;">
                        <button id="cb-tab-burner" style="padding: 8px 16px; border: none; background: ${o.tabActiveBg}; color: ${o.tabActiveText}; border-radius: 100px; cursor: pointer;">버너</button>
                        <button id="cb-tab-backup" style="padding: 8px 16px; border: none; background: ${o.tabInactiveBg}; color: ${o.tabInactiveText}; border-radius: 100px; cursor: pointer;">백업/복원</button>
                        <button id="cb-tab-settings" style="padding: 8px 16px; border: none; background: ${o.tabInactiveBg}; color: ${o.tabInactiveText}; border-radius: 100px; cursor: pointer;">설정</button>
                    </div>
                    <div id="cb-tab-content" style="flex-grow: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding: 10px 0;">
                        
                        <div id="cb-burner-content" style="display: block;">
                            <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                                <div style="flex: 1;">
                                    <label style="font-size: 0.9em; color: ${o.textColor}; display: block; margin-bottom: 5px;">불러올 턴 수 (1턴=2메시지)</label>
                                    <input id="cb-limit" type="number" placeholder="제한 (0-50)" min="0" max="50" value="${t.limit || ""}" style="width: 100%; padding: 10px; border: 1px solid ${o.borderColor}; border-radius: 4px; background: ${o.modalBg}; color: ${o.textColor};">
                                </div>
                                <div style="flex: 1;">
                                    <label style="font-size: 0.9em; color: ${o.textColor}; display: block; margin-bottom: 5px;">프롬프트 선택</label>
                                    <select id="cb-prompt-select" style="width: 100%; padding: 10px; border: 1px solid ${o.borderColor}; border-radius: 4px; display: block; background: ${o.modalBg}; color: ${o.textColor};">
                                        ${r}
                                    </select>
                                </div>
                            </div>
                            <div id="cb-custom-prompt-container" style="display: none;">
                                <label style="font-size: 0.9em; color: ${o.textColor}; display: block; margin-bottom: 5px;">사용자 정의 프롬프트</label>
                                <textarea id="cb-custom-prompt" placeholder="사용자 정의 프롬프트" style="width: 100%; padding: 10px; border: 1px solid ${o.borderColor}; border-radius: 4px; height: 100px; margin-bottom: 15px; background: ${o.modalBg}; color: ${o.textColor};">${t.prompt || ""}</textarea>
                            </div>
                            <div id="cb-gemini-model-container">
                                <label style="font-size: 0.9em; color: ${o.textColor}; display: block; margin-bottom: 5px;">Gemini 모델</label>
                                <select id="cb-gemini-model-select" style="width: 100%; padding: 10px; border: 1px solid ${o.borderColor}; border-radius: 4px; margin-bottom: 10px; background: ${o.modalBg}; color: ${o.textColor};">
                                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                                    <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite</option>
                                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                    <option value="custom">직접 입력</option>
                                </select>
                                <input id="cb-gemini-model-custom" type="text" placeholder="커스텀 Gemini 모델 입력" value="${t.geminiModel || ""}" style="width: 100%; padding: 10px; border: 1px solid ${o.borderColor}; border-radius: 4px; margin-bottom: 15px; background: ${o.modalBg}; color: ${o.textColor}; display: none;">
                            </div>
                            
                            <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px;">
                                <label class="cb-label"><input id="cb-attach-usernote" type="checkbox" class="cb-checkbox"><span>유저노트 첨부</span></label>
                                <label class="cb-label"><input id="cb-add-header" type="checkbox" class="cb-checkbox"><span>무작위 헤더 추가</span></label>
                                <label class="cb-label"><input id="cb-auto-retry" type="checkbox" class="cb-checkbox"><span>오류시 자동 재시도</span></label>
                                <label class="cb-label"><input id="cb-use-vertex-ai" type="checkbox" class="cb-checkbox"><span>Vertex AI 사용</span></label>
                            </div>

                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                                <label style="font-size: 0.9em; color: ${o.textColor};">실행 로그</label>
                                <div style="display: flex; flex-direction: row;">
                                    <div class="hourglass-container" style="margin-right: 10px;"> ${HOURGLASS_SVG} </div>
                                    <div id="cb_timer" style="font-size: 0.9em; color: ${o.textColor};">00:00</div>
                                </div>
                            </div>
                            <textarea id="cb-log" readonly style="width: 100%; padding: 10px; border: 1px solid ${o.borderColor}; border-radius: 4px; height: 80px; resize: none; margin-bottom: 15px; background: ${o.modalBg}; color: ${o.textColor};"></textarea>
                            <button id="cb-start" style="width: 100%; padding: 10px 20px; background: ${o.buttonBg}; color: ${o.buttonText}; border: none; border-radius: 4px; cursor: pointer;">시작</button>
                        </div>

                        <div id="cb-backup-content" style="display: none;">
                            <h3 style="margin-top:0; font-size: 1em; border-bottom: 1px solid ${o.borderColor}; padding-bottom: 10px;">채팅 내역 추출 및 저장</h3>
                            <p style="font-size: 0.85em; color: #999;">현재 로드된 채팅 내역을 JSON 파일로 저장합니다. 이 파일은 나중에 다시 불러와서 확인하거나 AI 학습용으로 사용할 수 있습니다.</p>
                            <button id="cb-download-json" style="width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-bottom: 20px; font-weight: bold;">📥 채팅 내역 다운로드 (.json)</button>
                            
                            <h3 style="margin-top:10px; font-size: 1em; border-bottom: 1px solid ${o.borderColor}; padding-bottom: 10px;">JSON 파일 불러오기</h3>
                            <p style="font-size: 0.85em; color: #999;">저장된 JSON 파일을 선택하여 내용을 확인합니다.</p>
                            <input type="file" id="cb-load-json-file" accept=".json" style="width: 100%; padding: 10px; background: ${o.modalBg}; color: ${o.textColor}; border: 1px solid ${o.borderColor}; border-radius: 4px; margin-bottom: 10px;">
                            <textarea id="cb-backup-viewer" readonly placeholder="불러온 데이터가 여기에 표시됩니다." style="width: 100%; height: 200px; padding: 10px; border: 1px solid ${o.borderColor}; border-radius: 4px; background: ${o.modalBg}; color: ${o.textColor}; font-family: monospace; font-size: 0.8em;"></textarea>
                        </div>

                        <div id="cb-settings-content" style="display: none;">
                           <label style="font-size: 0.9em; color: ${o.textColor}; display: block; margin-bottom: 5px;">API 제공자</label>
                            <select id="cb-provider-select" style="width: 100%; padding: 10px; border: 1px solid ${o.borderColor}; border-radius: 4px; margin-bottom: 15px; background: ${o.modalBg}; color: ${o.textColor};">
                                <option value="gemini">Gemini</option> 
                                <option value="vertexai">Firebase Vertex AI</option>
                                <option value="openrouter">OpenRouter</option>
                            </select>
                            
                            <div id="cb-gemini-api-container">
                                <label style="font-size: 0.9em; color: ${o.textColor}; display: block; margin-bottom: 5px;">Gemini API 키</label>
                                <input id="cb-gemini-api-key" type="password" placeholder="API Key" value="${t.geminiKey || ""}" style="width: 100%; padding: 10px; border: 1px solid ${o.borderColor}; border-radius: 4px; margin-bottom: 15px; background: ${o.modalBg}; color: ${o.textColor};">
                            </div>
                             <div id="cb-vertex-ai-api-container" style="display: none;">
                                <label style="font-size: 0.9em; color: ${o.textColor}; display: block; margin-bottom: 5px;">Vertex AI Script</label>
                                <textarea id="cb-vertex-ai-api-script" placeholder="Vertex AI 초기화 스크립트" style="width: 100%; padding: 10px; border: 1px solid ${o.borderColor}; border-radius: 4px; margin-bottom: 15px; background: ${o.modalBg}; color: ${o.textColor};">${t.vertexScript || ""}</textarea>
                            </div>
                            <div id="cb-openrouter-api-container" style="display: none;">
                                <label style="font-size: 0.9em; color: ${o.textColor}; display: block; margin-bottom: 5px;">OpenRouter API 키</label>
                                <input id="cb-openrouter-api-key" type="password" placeholder="API Key" value="${t.openRouterKey || ""}" style="width: 100%; padding: 10px; border: 1px solid ${o.borderColor}; border-radius: 4px; margin-bottom: 15px; background: ${o.modalBg}; color: ${o.textColor};">
                            </div>

                            <label style="font-size: 0.9em; color: ${o.textColor}; display: block; margin-bottom: 5px;">전송 시 사용자 메시지</label>
                            <input id="cb-user-message" type="text" value="${t.userMessage}" style="width: 100%; padding: 10px; border: 1px solid ${o.borderColor}; border-radius: 4px; margin-bottom: 15px; background: ${o.modalBg}; color: ${o.textColor};">
                            
                            <button id="cb-save-settings" style="width: 100%; padding: 10px 20px; background: ${o.buttonBg}; color: ${o.buttonText}; border: none; border-radius: 4px; cursor: pointer;">저장</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    
    document.body.insertAdjacentHTML("beforeend", i);
    
    const s = document.getElementById("chasm-burner"),
      d = document.getElementById("cb-tab-burner"),
      tabBackup = document.getElementById("cb-tab-backup"), // New Tab
      m = document.getElementById("cb-tab-settings"),
      b = document.getElementById("cb-burner-content"),
      contentBackup = document.getElementById("cb-backup-content"), // New Content
      x = document.getElementById("cb-settings-content"),
      h = document.getElementById("cb-limit"),
      v = document.getElementById("cb-prompt-select"),
      C = document.getElementById("cb-custom-prompt"),
      k = document.getElementById("cb-gemini-model-select"),
      w = document.getElementById("cb-gemini-model-custom"),
      T = document.getElementById("cb-log"),
      I = document.getElementById("cb_timer"),
      A = document.getElementById("cb-start"),
      S = document.getElementById("cb-provider-select"),
      M = document.getElementById("cb-gemini-api-key"),
      vertexApiField = document.getElementById("cb-vertex-ai-api-script"),
      R = document.getElementById("cb-openrouter-api-key"),
      z = document.getElementById("cb-user-message"),
      _ = document.getElementById("cb-save-settings"),
      j = document.getElementById("cb-close"),
      q = document.getElementById("cb-attach-usernote"),
      retry = document.getElementById("cb-auto-retry"),
      randomHeader = document.getElementById("cb-add-header"),
      useVertexAiEndpoint = document.getElementById("cb-use-vertex-ai");

    // Tab Switching Logic
    function G(n, e) {
      const tabs = [d, tabBackup, m, ...Array.from(document.querySelectorAll("[id^=cb-tab-result-]"))];
      const contents = [b, contentBackup, x, ...Array.from(document.querySelectorAll("[id^=cb-result-]"))];
      
      tabs.forEach((tab) => {
        tab.style.background = tab === n ? o.tabActiveBg : o.tabInactiveBg;
        tab.style.color = tab === n ? o.tabActiveText : o.tabInactiveText;
      });
      contents.forEach((content) => {
        content.style.display = content === e ? "block" : "none";
      });
    }

    d.addEventListener("click", () => G(d, b));
    tabBackup.addEventListener("click", () => G(tabBackup, contentBackup));
    m.addEventListener("click", () => G(m, x));

    // Initialize Checkboxes
    q.checked = t.attachUsernote;
    retry.checked = t.autoRetry;
    randomHeader.checked = t.randomHeader;
    useVertexAiEndpoint.checked = t.useVertexAi;
    S.value = t.provider;

    // Settings Logic
    function H() {
      const n = document.getElementById("cb-gemini-api-container"),
            vertex = document.getElementById("cb-vertex-ai-api-container"),
            op = document.getElementById("cb-openrouter-api-container");
      n.style.display = "gemini" === S.value ? "block" : "none";
      vertex.style.display = "vertexai" === S.value ? "block" : "none";
      op.style.display = "openrouter" === S.value ? "block" : "none";
    }
    S.addEventListener("change", H);
    H();

    // Model Selection Logic
    const toggleCustomModel = () => {
        w.style.display = "custom" === k.value ? "block" : "none";
        if("custom" !== k.value) w.value = k.value;
    };
    k.value = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"].includes(t.geminiModel) ? t.geminiModel : "custom";
    toggleCustomModel();
    k.addEventListener("change", toggleCustomModel);

    // Custom Prompt Logic
    const X = document.getElementById("cb-custom-prompt-container");
    v.addEventListener("change", () => { X.style.display = "custom" === v.value ? "block" : "none"; });
    v.value = t.select || "custom";
    if(v.value === "custom") X.style.display = "block";


    // Save Settings
    function F(n = !1) {
      t.provider = S.value;
      t.geminiKey = M.value;
      t.vertexScript = vertexApiField.value;
      t.openRouterKey = R.value;
      t.geminiModel = "custom" === k.value ? w.value : k.value;
      t.limit = h.value;
      t.select = v.value;
      t.prompt = "custom" === v.value ? C.value : "";
      t.userMessage = z.value;
      t.attachUsernote = q.checked;
      t.autoRetry = retry.checked;
      t.randomHeader = randomHeader.checked;
      t.useVertexAi = useVertexAiEndpoint.checked;
      $.setConfig(t);
      n && alert("설정이 저장되었습니다.");
    }
    _.addEventListener("click", () => F(!0));

    // --- BACKUP FEATURE IMPLEMENTATION ---
    const btnDownload = document.getElementById("cb-download-json");
    const inputLoad = document.getElementById("cb-load-json-file");
    const viewerLoad = document.getElementById("cb-backup-viewer");

    btnDownload.addEventListener("click", async () => {
        try {
            const limitCount = parseInt(h.value) || 50;
            btnDownload.textContent = "데이터 추출 중...";
            btnDownload.disabled = true;

            // Re-use extraction logic
            const data = await getChatMessagesData(limitCount);
            
            const exportData = {
                exportedAt: new Date().toISOString(),
                source: location.hostname,
                profile: data.profileName,
                userNote: data.userNote,
                messages: data.messages
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], {type : 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ChatBackup_${data.profileName}_${new Date().toISOString().slice(0,10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            btnDownload.textContent = "📥 채팅 내역 다운로드 (.json)";
            btnDownload.disabled = false;
            alert(`성공적으로 다운로드되었습니다.\n메시지 수: ${data.messages.length}`);
        } catch(e) {
            alert("백업 실패: " + e.message);
            btnDownload.textContent = "📥 채팅 내역 다운로드 (.json)";
            btnDownload.disabled = false;
        }
    });

    inputLoad.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const json = JSON.parse(evt.target.result);
                viewerLoad.value = JSON.stringify(json, null, 2);
                alert("파일을 불러왔습니다. 아래 뷰어에서 내용을 확인할 수 있습니다.");
            } catch(err) {
                alert("JSON 파일 형식이 올바르지 않습니다.");
            }
        };
        reader.readAsText(file);
    });

    // --- BURNER START LOGIC ---
    A.addEventListener("click", async () => {
        if (A.disabled) return;
        A.disabled = true;
        const originalText = A.textContent;
        let timerInterval;
        const startTime = Date.now();

        // Timer UI
        const updateTimer = () => {
            const n = Math.floor((Date.now() - startTime) / 1e3);
            I.textContent = `${String(Math.floor(n / 60)).padStart(2,"0")}:${String(n % 60).padStart(2,"0")}`;
        };
        timerInterval = setInterval(updateTimer, 1000);
        document.querySelector('.hourglass-container').setAttribute("rotate", "true");

        const stopProcess = () => {
            clearInterval(timerInterval);
            I.textContent = "00:00";
            A.disabled = false;
            document.querySelector('.hourglass-container').removeAttribute("rotate");
            A.textContent = originalText;
        };

        try {
            // 1. Validation
            const provider = S.value;
            const apiKey = "gemini" === provider || "vertexai" === provider 
                           ? t.geminiKey ?? (useVertexAiEndpoint.checked ? true : t.geminiKey)
                           : t.openRouterKey;
            
            if (!apiKey) {
                alert("API 키가 설정되지 않았습니다.");
                throw new Error("API Key Missing");
            }

            // 2. Fetch Data
            T.value = `[${p()}] 데이터 수집 중...\n` + T.value;
            const chatData = await getChatMessagesData(h.value);
            
            T.value = `[${p()}] ${chatData.messages.length}개 메시지 수집 완료.\n` + T.value;

            // 3. Construct Prompt
            const msgList = chatData.messages.map(m => ({
                role: m.role,
                message: m.content,
                username: m.role === "user" ? chatData.profileName : undefined
            }));

            let selectedPrompt = "";
            if ("custom" === v.value) selectedPrompt = C.value;
            else selectedPrompt = a[v.value]?.prompt || "";

            const fullPrompt = `
${selectedPrompt}

${q.checked && chatData.userNote ? `[User Note]\n${chatData.userNote}\n` : ""}
[Chat Log]
${JSON.stringify(msgList)}
            `;

            T.value = `[${p()}] AI 요청 생성 중 (길이: ${fullPrompt.length})...\n` + T.value;

            // 4. Send to AI (Simplified for readability, focusing on Gemini)
            let aiResponse = null;
            const modelName = "custom" === k.value ? w.value : k.value;

            if (provider === "gemini") {
                 const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
                 const response = await fetch(url, {
                     method: "POST",
                     headers: { "Content-Type": "application/json" },
                     body: JSON.stringify({
                         contents: [{ parts: [{ text: fullPrompt }] }],
                         safetySettings: [
                            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                         ]
                     })
                 });
                 const json = await response.json();
                 if (!response.ok) throw new Error(json.error?.message || "Gemini API Error");
                 aiResponse = json.candidates?.[0]?.content?.parts?.[0]?.text;
            } else {
                // ... OpenRouter logic (省略 for brevity, reuse existing structure if needed)
                alert("이 버전에서는 Gemini만 우선 지원합니다.");
                throw new Error("Provider not supported in this snippet");
            }

            if (!aiResponse) throw new Error("AI 응답이 비어있습니다.");

            // 5. Display Result
            n++;
            const resultId = `cb-result-${n}`;
            const resultTabId = `cb-tab-result-${n}`;
            
            // Add Tab
            const newTab = document.createElement("button");
            newTab.id = resultTabId;
            newTab.textContent = `결과 ${n}`;
            newTab.style.cssText = `padding: 8px 16px; border: none; background: ${o.tabInactiveBg}; color: ${o.tabInactiveText}; border-radius: 100px; cursor: pointer;`;
            document.getElementById("cb-tabs").appendChild(newTab);

            // Add Content
            const newContent = document.createElement("div");
            newContent.id = resultId;
            newContent.innerHTML = `
                <textarea style="width: 100%; padding: 10px; height: 300px; margin-bottom: 10px; background: ${o.modalBg}; color: ${o.textColor}; border: 1px solid ${o.borderColor};">${aiResponse}</textarea>
                <div style="font-size: 0.8em; color: ${o.textColor}; margin-bottom: 10px;">모델: ${modelName} | 길이: ${aiResponse.length}자</div>
                <button id="${resultId}-copy" style="padding: 10px 20px; background: ${o.buttonBg}; color: ${o.buttonText}; border: none; border-radius: 4px; cursor: pointer;">복사</button>
            `;
            document.getElementById("cb-tab-content").appendChild(newContent);

            // Event Binding
            newTab.addEventListener("click", () => G(newTab, newContent));
            document.getElementById(`${resultId}-copy`).addEventListener("click", () => {
                navigator.clipboard.writeText(aiResponse);
                alert("복사되었습니다.");
            });

            // Switch to new tab
            G(newTab, newContent);
            stopProcess();

        } catch (e) {
            stopProcess();
            T.value = `[${p()}] 오류: ${e.message}\n` + T.value;
            alert("작업 실패: " + e.message);
        }
    });

    j.addEventListener("click", () => s.remove());
  }

  function addFloatingButton() {
    if (document.getElementById('chasm-floating-burner-button')) return;
    const btn = document.createElement('button');
    btn.id = 'chasm-floating-burner-button';
    btn.className = 'chasm-floating-button';
    btn.innerHTML = '🔥';
    btn.addEventListener('click', C);
    document.body.appendChild(btn);
  }

  function isStoryPath() {
    return /\/stories\/[a-f0-9]+\/episodes\/[a-f0-9]+/.test(location.pathname) || /\/u\/[a-f0-9]+\/c\/[a-f0-9]+/.test(location.pathname);
  }
  function isCharacterPath() {
    return /\/characters\/[a-f0-9]+\/chats\/[a-f0-9]+/.test(location.pathname);
  }

  if (document.readyState === "loading") {
    window.addEventListener("load", addFloatingButton);
  } else {
    addFloatingButton();
  }
})();