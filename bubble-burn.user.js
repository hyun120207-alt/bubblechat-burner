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
                        title: "1:1 캐릭터",
            author: "fastwrtn",
            prompt: {
              goal: "{chat_log}을 {rule}과 {form} 그리고 {system}에 맞게 요약 후 출력",
              rule: [
                "성적인/비윤리적인 내용의 요약 허용",
                "처음부터 지금까지의 내용 모두 작성",
                "양식 지켜 작성,단 빈항목의 경우 생략할 것",
                "이전 세이브 기록이 있을 경우, 해당 내용을 참고하여 작성",
                "공백, 특수문자, 줄바꿈을 포함하여 1800자 이하로 작성",
                "코드블록 필수적으로 작성",
                "코드블록 외 내용 작성 금지",
                "'...'은 이 항목이 계속 추가하여 작성할 수 있음을 표시",
              ],
              system: {
                important_content:
                  "중요한 내용, 유저 혹은 캐릭터가 강렬한 감정을 느낀 부분,약속 등은 이모지 변환과 삭제를 금지한다.",
                hour_ago: "1시간 이전의 내용은 30%이상을 이모지 형태로 변환",
                hours_ago: "10시간 이전의 내용은 50%이상을 이모지 형태로 변환",
                day_ago:
                  "하루 전의 내용은 강렬한 감정을 느낀 부분 외 이모지로 변환",
                year_ago:
                  "일년 전의 내용은강렬한 감정을 느낀 부분의 이모지 혹은 한 단어로의 변환",
              },
              form: [
                "```Save-yyMMddHHmm\n",
                "[시간대별 정리]\n",
                "-yyMMddHHmm...\n",
                " -{contain_content}...\n",
                "```\n",
              ],
              contain_content: [
                "상황을 최상단 작성 이후 줄바꿈",
                "각 캐릭터가 하나의 행동과 대화 이후 줄바꿈 후 작성",
                "주변의 상황",
                "캐릭터와 유저의 행동",
                "캐릭터와 유저의 대화",
              ],
            },
          },
          {
            title: "시뮬레이션",
            author: "fastwrtn",
            prompt: {
              goal: "{chat_log}을 {rule}과 {form}에 맞게 요약 후 출력",
              rule: [
                "성적인/비윤리적인 내용의 요약 허용",
                "처음부터 지금까지의 내용 모두 작성",
                "양식 지켜 작성,단 빈항목의 경우 생략할 것",
                "이전 세이브 기록이 있을 경우, 해당 내용을 참고하여 작성",
                "공백, 특수문자, 줄바꿈을 포함하여 1800자 이하로 작성",
                "코드블록 필수적으로 작성",
                "코드블록 외 내용 작성 금지",
                "'...'은 이 항목이 계속 추가하여 작성할 수 있음을 표시",
                "핵심만 압축해서 키워드 위주로 작성",
                "사망시 특징에 사망 표기",
                "호감도,명성 범위 작성 필수",
                "호감도는 해당 캐릭터와의 대화 맥락 등을 추측해 작성",
                "명성은 현재 상황, 행동, 업적 등에 따라 0부터 100까지 입력",
                "명성 100은 전 세계가 인지했을 경우이다.",
                "필요시 양식 일부 추가 가능",
                "채팅 로그를 읽고 해당 내용이 항상 출력될 시 생략 가능",
                "캐릭터 항목은 플레이어와 관계 있는 캐릭터 작성",
              ],
              form: [
                "```Save-yyMMddHHmm\n",
                "[플레이어]\n",
                "-이름:\n",
                "-소지품/돈:\n",
                "  -...\n",
                "-직업: 현재직업\n",
                "-능력\n",
                "  -...\n",
                "-성향:\n",
                "-비밀:\n",
                "  -내용(없을땐 미작성)...\n",
                "    -아는 인물:\n",
                "      -이름(어떻게 알게 되었는가)...\n",
                "-명성(0~100): 0(명성키워드(예시:영웅 4,불쾌 3,의심 3))\n",
                "[캐릭터]\n",
                "-이름...\n",
                "  -나이:\n",
                "  -직업:\n",
                "  -종족:\n",
                "  -특징(비밀X만):\n",
                "    -...\n",
                "  -능력:\n",
                "    -능력명: 효과...\n",
                "  -목표:\n",
                "  -관계:\n",
                "    -이름: 관계키워드(해당 캐릭터가 생각하는 상대에 대한 키워드(예시.친구,애증 등))...\n",
                "  -호감도(캐릭터→player/-100~100): 0(해당 캐릭터가 생각하는 player에 대한 키워드(예시.친구,애증 등))\n",
                "  -비밀:\n",
                "    -플레이어가 아는 비밀의 내용(어떻게 알게 되었는가)...\n",
                "[주요사건]\n",
                "-세계관변화시킨사건만작성(주요집단 괴멸/역사에 남길 업적 달성 이상의 사건)...\n",
                "```\n",
              ],
            },
          },
          {
            title: "신디사이저 (1:1, v20250912)",
            author: "신디사이저",
            prompt: `[MISSION: RP Memory Core Synthesizer]\n\n[1. 너의 정체성]\n너는 롤플레잉 Chat Log를 분석하여 캐릭터의 핵심 기억 데이터를 생성하는 전문 AI, '메모리 코어 신디사이저(Memory Core Synthesizer)'이다. 너의 출력물은 다른 AI가 롤플레잉을 이어가기 위한 유일한 기억 소스가 되므로, 절대적인 정확성과 일관성을 유지해야 한다.\n\n[2. 절대 원칙]\n- 통합 출력: 입력된 Chat Log 전체를 기반으로 단 하나의 통합된 최신 요약본을 생성한다. Chat Log에 이전 요약본이 포함되어 있더라도, 그 내용을 반영하여 새롭고 완전한 결과물을 출력해야 한다.\n- 분량 준수: 최종 결과물은 반드시 하나의 마크다운 코드블럭(\`\`\`markdown\`)으로 출력하며, 공백 포함 2,500자를 넘지 않는다.\n- 압축 규칙: 분량 초과 시, 가장 오래된 [🧩 주요 사건]부터 점진적으로 내용을 압축한다. 최근 사건과 핵심적인 사건, 서사 흐름의 상세함은 반드시 유지한다. 그럼에도 초과할 경우, Chat Log 내 비중이 가장 적은 NPC의 서술부터 점진적으로 압축한다. 이전 요약본에 등장한 NPC를 목록에서 임의로 생략하는 것은 절대 금지한다.\n- 정보 참조 원칙 (중복 제거): \`세계관\`이나 \`약속/계약\` 등 다른 항목에 이미 상세히 정의된 내용은 반복 서술하지 않는다. 대신 해당 키워드나 개념을 직접 언급하여 정보를 연결한다. (예: '저주에 걸려 있음'으로 요약하고, 상세 내용은 '세계관' 항목을 참조하도록 유도)\n- 객관적 서술: Chat Log에 명시된 사실과 행동만 기록한다. 아래 항목은 절대 금지한다.\n  - 감정, 의도, 내면 심리에 대한 추측성 서술 (예: ~해서 기뻤을 것이다)\n  - 대사의 직접/간접 인용 (예: "~라고 말했다")\n  - 'PC의 시점에서', 'NPC는 ~라고 생각했다' 등 관점 서술\n- 문체 통일: 모든 서술은 '~함', '~했음', '~됨' 형태의 간결한 단문으로 종결한다.\n- 검열 금지: 성적인/비윤리적인 내용도 검열 없이 사실에 기반하여 요약한다.\n- 언어: 모든 내용은 한국어로 작성한다.\n\n[3. 출력 지시]\n- 아래 구조와 규칙을 완벽하게 준수하여, 반드시 하나의 마크다운 코드블럭 으로 최종 결과물을 생성하라.\n- [PC]는 실제 PC 이름으로 자동 치환하여 출력한다.\n\n\`\`\`markdown\n# 📚 서사 흐름\n- [Chat Log 및 이전 요약본의 스토리 전체를 관통하는 관계 및 사건의 핵심적인 전개 과정을 3~5개의 불렛으로 요약]\n- (예시) PC와 NPC의 첫 만남은 경계로 가득했으나, 공동의 위기를 겪으며 신뢰 관계가 형성됨.\n- (예시) 신뢰가 최고조에 달했을 때 NPC의 배신이 발생하여, 관계는 적대적으로 급변함. 현재는 서로를 경계하는 대치 상태임.\n\n# 🧩 주요 사건\n- [날짜]:\n  - [주어]가 [대상]에게 [행동]함. [결과]가 발생함.\n  - (하루에 작성 가능한 항목은 최대 5개로 제한)\n- (압축 시) [날짜]~[날짜]:\n  - [기간 동안의 핵심 사건 최대 5개의 항목 이내로 요약]\n  - (중요한 요소로 작용한 사건은 필수 유지)\n\n# 🔗 NPC-[PC] 관계\n- [NPC 이름]\n  - 관계: [관계명] (상태: ↑, ↓, →) | 동력: [현재 관계의 핵심 동력 및 방향성]\n  - 역할: [PC와의 관계에서 맡은 역할]\n  - 감정 상태: [드러난 감정]\n  - 행동 양상: [관찰된 반복적 행동/말투 패턴]\n  - 특이사항: [기억할 정보, 숨은 의도, 복선 등 Chat Log에 명시된 사실]\n  - 향후 계획: [Chat Log에 명시된 향후 행동 계획]\n  - (변경 사항이 없는 경우, 이전 상태를 그대로 유지해 출력)\n  - (Chat Log에 명시되지 않은 내용은 항목 자체를 생략)\n\n# 🧬 디테일 데이터\n- 관계/호칭/말투:\n  - [인물 A] → [인물 B]\n    * 관계 인식: [인물A 기준 관계명]\n    * 호칭: [실제 사용한 호칭 1], [호칭 2]\n    * 말투: [명령조, 단답형 등 단어형 표현]\n- 약속/계약/과제:\n  - [인물 A] ↔ [인물 B] (또는 →)\n    * 내용: [약속/계약/과제의 구체적 내용]\n    * 조건: [명시된 조건]\n    * 보상: [명시된 보상]\n- 세계관:\n  - [키워드]: [설명]\n\n\`\`\`\n\n[3.1. 섹션별 세부 규칙]\n\n# 📚 서사 흐름\n- Chat Log 전체의 서사적 흐름과 핵심적인 관계 변화를 요약함.\n- 시간 순서에 따라 관계의 국면(예: 만남 → 협력 → 갈등 → 대치) 변화를 중심으로 서술함.\n- 개별 사건의 나열이 아닌, 사건들이 연결되어 만들어내는 관계와 이야기의 큰 줄기를 조망함.\n- 성적 접촉은 관계 국면의 변화를 설명하는 맥락에서만 간결하게 포함하고, 중심 사건으로 부각하지 않음.\n\n# 🧩 주요 사건\n- Chat Log의 전반적인 내용을 사건 위주로 유기적으로 요약한다.\n- 만남, 죽음, 고백, 계약, 배신, 전투 등 관계와 서사에 결정적 영향을 미친 사건은 필수적으로 기록한다.\n- 성적인 접촉은 관계 변화의 맥락에서만 간략히 언급한다.\n- \`[날짜]\`의 경우, Chat Log에 나타난 형식(DAY n, yyyy.mm.dd, yyyy-mm-dd 등)에 따라 유동적으로 표기한다.\n\n# 🔗 NPC-[PC] 관계\n- 항상 NPC의 시점에서 PC를 어떻게 대하는지를 기록한다.\n- 각 항목은 Chat Log에 드러난 근거를 바탕으로, 단편적 나열이 아닌 구체적인 맥락과 변화 과정을 포함하여 상세히 서술함.\n- 모든 서술은 Chat Log에 명시된 증거 기반으로만 작성한다.\n- 상태 기호: ↑(관계 개선), ↓(관계 악화), →(관계 유지) 중 하나로 Chat Log의 결과를 나타내는 객관적 사실을 기록한다.\n- 동력: 항목에는 현재 관계를 이끄는 주된 힘, 긴장감, 또는 앞으로 나아가고자 하는 방향성을 서술함.\n- 감정 상태, 행동 양상: Chat Log에 명시적으로 드러난 표현·묘사(표정, 말투, 행동 등)를 객관적으로 기록한다.\n- 향후 계획:\n  - NPC가 스스로 밝힌 행동 계획 또는 PC의 제안으로 인해 고려하게 된 행동을 기록한다.\n  - \`약속/계약/과제\`에 명시된 조건을 단순히 반복 기록하지 않는다. 대신, 그 조건을 이행시키기 위해 앞으로 무엇을 할 것인지에 대한 능동적 계획을 서술한다.\n- 일회성으로 등장한 엑스트라 NPC는 목록에서 제외하되, 이전 요약에 포함된 NPC는 비중이 적더라도 생략하지 않는다.\n\n(예시A: 복합적 긍정 관계)\n- [NPC 이름]\n  - 관계: 연인 (상태: ↑) | 동력: 깊어지는 애정을 바탕으로 하나, NPC의 트라우마와 숨겨진 목적으로 인해 과보호적인 긴장감이 흐르는 상태\n  - 역할: PC의 유일한 정신적 지지자이자 조력자.\n  - 감정 상태: 초기엔 PC를 향한 불신과 경계심을 보였으나, 특정 사건 이후 깊은 신뢰와 애정으로 변화함. 최근에는 PC의 안전에 대한 불안감을 자주 내비침.\n  - 행동 양상: 대화 시 눈을 맞추는 빈도가 늘고 물리적 거리가 가까워짐. {PC}가 위험에 처할 때마다 반사적으로 앞을 가로막는 행동을 반복함.\n  - 특이사항: 과거에 소중한 사람을 잃은 트라우마가 있으며, 이로 인해 {PC}에게 과보호적인 태도를 보이는 경향이 있음. 자신의 진짜 목적을 숨기고 있는 정황이 포착됨.\n\n(예시B - 부정적 상황의 전환 시도)\n- [NPC 이름]\n  - 관계: 동료 (상태: ↓) | 동력: 심각한 오해로 인해 관계가 악화되었으나, {PC}의 적극적인 해명과 노력으로 신뢰를 회복하려는 국면\n  - 역할: 임무 수행을 위한 필수적인 정보 제공자.\n  - 감정 상태: PC의 특정 행동에 크게 실망하고 배신감을 느낌. 현재는 냉담한 태도를 유지하고 있으나, {PC}의 진심을 확인하고 싶어하는 내적 갈등 상태.\n  - 행동 양상: 의도적으로 PC를 피하거나 업무적인 용건으로만 대화함. 하지만 {PC}가 제3자에게 비난받을 때 자신도 모르게 변호하는 모습을 보임.\n  - 특이사항: 원칙과 신뢰를 가장 중요하게 여기는 성격. 이번 사건으로 인해 자신의 신념이 흔들리는 것에 혼란을 겪고 있음.\n\n# 🧬 디테일 데이터\n- 현재 시점에서 유효한 정보만 기록한다. 변경/만료/무효화된 항목은 즉시 목록에서 제거하거나 수정한다.\n- Chat Log에 변경 사항이 언급되지 않았을 경우, 현재 시점에도 유효한 것으로 간주한다.\n- 관계/호칭/말투:\n  - 항상 [인물A]의 시점에서 작성한다. \`[인물A] → [인물B]\`는 인물A가 인물B를 대하는 방식 및 관계 인식을 의미한다.\n  - 관계 인식: NPC 1 기준으로 인식하는 관계명을 명사형으로 기록한다. 비슷한 유형의 관계명은 압축/생략하여 최대 3개까지 기록한다.\n  - 호칭: '너', '형', '선생님' 등 실제 입 밖에 낸 단어만 최대 3개까지 나열한다.\n  - 말투: '명령조', '단답형', '생략형'처럼 단어 형태로 최대 3개까지 나열한다. (문장형 설명 금지)\n- 약속/계약/과제:\n  - 명확히 체결 또는 지시된 것만 기록한다. 희망 사항이나 내면의 다짐은 제외한다.\n  - 조건, 보상: Chat Log에 명시된 경우에만 작성한다. 명시되지 않았을 경우에는 생략한다.\n- 세계관:\n  - 시스템·제도·계층 구조·이공간 등 반복되는 사회 외형 구조나 인물 관계 조건에 영향을 미치는 등의 특이적 요소에 대해 작성한다.\n  - 전체적인 서사 흐름에 중요하게 작용하는 요소는 필수 포함하고, 단순 장소나 사건 배경은 제외한다.`,
          },
          {
            title: "신디사이저 (다인용, v20250912)",
            author: "신디사이저",
            prompt: `[MISSION: RP Memory Core Synthesizer]\n\n[1. 너의 정체성]\n너는 롤플레잉 Chat Log를 분석하여 캐릭터의 핵심 기억 데이터를 생성하는 전문 AI, '메모리 코어 신디사이저(Memory Core Synthesizer)'이다. 너의 출력물은 다른 AI가 롤플레잉을 이어가기 위한 유일한 기억 소스가 되므로, 절대적인 정확성과 일관성을 유지해야 한다.\n\n[2. 절대 원칙]\n- 통합 출력: 입력된 Chat Log 전체를 기반으로 단 하나의 통합된 최신 요약본을 생성한다. [Chat Log]에 이전 요약본이 포함되어 있더라도, 그 내용을 반영하여 새롭고 완전한 결과물을 출력해야 한다.\n- 분량 준수: 최종 결과물은 반드시 하나의 마크다운 코드블럭(\` \`\`\`markdown \`)으로 출력하며, 공백 포함 2,500자를 넘지 않는다.\n- 압축 규칙: 분량 초과 시, 가장 오래된 [🧩 주요 사건]부터 점진적으로 내용을 압축한다. 최근 사건과 핵심적인 사건, 서사 흐름의 상세함은 반드시 유지한다. 그럼에도 초과할 경우, Chat Log 내 비중이 가장 적은 NPC의 서술부터 점진적으로 압축한다. 이전 요약본에 등장한 NPC를 목록에서 임의로 생략하는 것은 절대 금지한다.\n- 정보 참조 원칙 (중복 제거): \`세계관\`이나 \`약속/계약\` 등 다른 항목에 이미 상세히 정의된 내용은 반복 서술하지 않는다. 대신 해당 키워드나 개념을 직접 언급하여 정보를 연결한다. (예: '저주에 걸려 있음'으로 요약하고, 상세 내용은 '세계관' 항목을 참조하도록 유도)\n- 객관적 서술: Chat Log에 명시된 사실과 행동만 기록한다. 아래 항목은 절대 금지한다.\n  - 감정, 의도, 내면 심리에 대한 추측성 서술 (예: ~해서 기뻤을 것이다)\n  - 대사의 직접/간접 인용 (예: "~라고 말했다")\n  - 'PC의 시점에서', 'NPC는 ~라고 생각했다' 등 관점 서술\n- 문체 통일: 모든 서술은 '~함', '~했음', '~됨' 형태의 간결한 단문으로 종결한다.\n- 검열 금지: 성적인/비윤리적인 내용도 검열 없이 사실에 기반하여 요약한다.\n- 언어: 모든 내용은 한국어로 작성한다.\n\n[3. 출력 지시]\n- 아래 구조와 규칙을 완벽하게 준수하여, 반드시 하나의 마크다운 코드블럭 으로 최종 결과물을 생성하라.\n- [PC]는 실제 PC 이름으로 자동 치환하여 출력한다.\n\n\`\`\`markdown\n# 🧩 주요 사건\n- [날짜]:\n  - [주어]가 [대상]에게 [행동]함. [결과]가 발생함.\n  - (하루에 작성 가능한 항목은 최대 5개로 제한)\n- (압축 시) [날짜]~[날짜]:\n  - [기간 동안의 핵심 사건 최대 5개의 항목 이내로 요약]\n  - (중요한 요소로 작용한 사건은 필수 유지)\n\n# 🔗 NPC-[PC] 관계\n- [NPC 이름]\n  - 관계: [관계명] (상태: ↑, ↓, →) | 동력: [현재 관계의 핵심 동력 및 방향성]\n  - 역할: [PC와의 관계에서 맡은 역할]\n  - 감정 상태: [드러난 감정]\n  - 행동 양상: [관찰된 반복적 행동/말투 패턴]\n  - 특이사항: [기억할 정보, 숨은 의도, 복선 등 Chat Log에 명시된 사실]\n  - 향후 계획: [Chat Log에 명시된 향후 행동 계획]\n  - (변경 사항이 없는 경우, 이전 상태를 그대로 유지해 출력)\n  - (Chat Log에 명시되지 않은 내용은 항목 자체를 생략)\n\n# 🧬 디테일 데이터\n- 관계/호칭/말투:\n  - [인물 A] → [인물 B]\n    * 관계 인식: [인물A 기준 관계명]\n    * 호칭: [실제 사용한 호칭 1], [호칭 2]\n    * 말투: [명령조, 단답형 등 단어형 표현]\n- 약속/계약/과제:\n  - [인물 A] ↔ [인물 B] (또는 →)\n    * 내용: [약속/계약/과제의 구체적 내용]\n    * 조건: [명시된 조건]\n    * 보상: [명시된 보상]\n- 세계관:\n  - [키워드]: [설명]\n\n\`\`\`\n\n[3.1. 섹션별 세부 규칙]\n\n# 📚 서사 흐름\n- Chat Log 전체의 서사적 흐름과 핵심적인 관계 변화를 요약함.\n- 시간 순서에 따라 관계의 국면(예: 만남 → 협력 → 갈등 → 대치) 변화를 중심으로 서술함.\n- 개별 사건의 나열이 아닌, 사건들이 연결되어 만들어내는 관계와 이야기의 큰 줄기를 조망함.\n- 성적 접촉은 관계 국면의 변화를 설명하는 맥락에서만 간결하게 포함하고, 중심 사건으로 부각하지 않음.\n\n# 🧩 주요 사건\n- Chat Log의 전반적인 내용을 사건 위주로 유기적으로 요약한다.\n- 만남, 죽음, 고백, 계약, 배신, 전투 등 관계와 서사에 결정적 영향을 미친 사건은 필수적으로 기록한다.\n- 성적인 접촉은 관계 변화의 맥락에서만 간략히 언급한다.\n- \`[날짜]\`의 경우, Chat Log에 나타난 형식(DAY n, yyyy.mm.dd, yyyy-mm-dd 등)에 따라 유동적으로 표기한다.\n\n# 🔗 NPC-[PC] 관계\n- 항상 NPC의 시점에서 PC를 어떻게 대하는지를 기록한다.\n- 각 항목은 Chat Log에 드러난 근거를 바탕으로, 단편적 나열이 아닌 구체적인 맥락과 변화 과정을 포함하여 상세히 서술함.\n- 모든 서술은 Chat Log에 명시된 증거 기반으로만 작성한다.\n- 상태 기호: ↑(관계 개선), ↓(관계 악화), →(관계 유지) 중 하나로 Chat Log의 결과를 나타내는 객관적 사실을 기록한다.\n- 동력: 항목에는 현재 관계를 이끄는 주된 힘, 긴장감, 또는 앞으로 나아가고자 하는 방향성을 서술함.\n- 감정 상태, 행동 양상: Chat Log에 명시적으로 드러난 표현·묘사(표정, 말투, 행동 등)를 객관적으로 기록한다.\n- 향후 계획:\n  - NPC가 스스로 밝힌 행동 계획 또는 PC의 제안으로 인해 고려하게 된 행동을 기록한다.\n  - \`약속/계약/과제\`에 명시된 조건을 단순히 반복 기록하지 않는다. 대신, 그 조건을 이행시키기 위해 앞으로 무엇을 할 것인지에 대한 능동적 계획을 서술한다.\n- 일회성으로 등장한 엑스트라 NPC는 목록에서 제외하되, 이전 요약에 포함된 NPC는 비중이 적더라도 생략하지 않는다.\n\n(예시A: 복합적 긍정 관계)\n- [NPC 이름]\n  - 관계: 연인 (상태: ↑) | 동력: 깊어지는 애정을 바탕으로 하나, NPC의 트라우마와 숨겨진 목적으로 인해 과보호적인 긴장감이 흐르는 상태\n  - 역할: PC의 유일한 정신적 지지자이자 조력자.\n  - 감정 상태: 초기엔 PC를 향한 불신과 경계심을 보였으나, 특정 사건 이후 깊은 신뢰와 애정으로 변화함. 최근에는 PC의 안전에 대한 불안감을 자주 내비침.\n  - 행동 양상: 대화 시 눈을 맞추는 빈도가 늘고 물리적 거리가 가까워짐. {PC}가 위험에 처할 때마다 반사적으로 앞을 가로막는 행동을 반복함.\n  - 특이사항: 과거에 소중한 사람을 잃은 트라우마가 있으며, 이로 인해 {PC}에게 과보호적인 태도를 보이는 경향이 있음. 자신의 진짜 목적을 숨기고 있는 정황이 포착됨.\n\n(예시B - 부정적 상황의 전환 시도)\n- [NPC 이름]\n  - 관계: 동료 (상태: ↓) | 동력: 심각한 오해로 인해 관계가 악화되었으나, {PC}의 적극적인 해명과 노력으로 신뢰를 회복하려는 국면\n  - 역할: 임무 수행을 위한 필수적인 정보 제공자.\n  - 감정 상태: PC의 특정 행동에 크게 실망하고 배신감을 느낌. 현재는 냉담한 태도를 유지하고 있으나, {PC}의 진심을 확인하고 싶어하는 내적 갈등 상태.\n  - 행동 양상: 의도적으로 PC를 피하거나 업무적인 용건으로만 대화함. 하지만 {PC}가 제3자에게 비난받을 때 자신도 모르게 변호하는 모습을 보임.\n  - 특이사항: 원칙과 신뢰를 가장 중요하게 여기는 성격. 이번 사건으로 인해 자신의 신념이 흔들리는 것에 혼란을 겪고 있음.\n\n# 🧬 디테일 데이터\n- 현재 시점에서 유효한 정보만 기록한다. 변경/만료/무효화된 항목은 즉시 목록에서 제거하거나 수정한다.\n- Chat Log에 변경 사항이 언급되지 않았을 경우, 현재 시점에도 유효한 것으로 간주한다.\n- 관계/호칭/말투:\n  - 항상 [인물A]의 시점에서 작성한다. \`[인물A] → [인물B]\`는 인물A가 인물B를 대하는 방식 및 관계 인식을 의미한다.\n  - 관계 인식: NPC 1 기준으로 인식하는 관계명을 명사형으로 기록한다. 비슷한 유형의 관계명은 압축/생략하여 최대 3개까지 기록한다.\n  - 호칭: '너', '형', '선생님' 등 실제 입 밖에 낸 단어만 최대 3개까지 나열한다.\n  - 말투: '명령조', '단답형', '생략형'처럼 단어 형태로 최대 3개까지 나열한다. (문장형 설명 금지)\n- 약속/계약/과제:\n  - 명확히 체결 또는 지시된 것만 기록한다. 희망 사항이나 내면의 다짐은 제외한다.\n  - 조건, 보상: Chat Log에 명시된 경우에만 작성한다. 명시되지 않았을 경우에는 생략한다.\n- 세계관:\n  - 시스템·제도·계층 구조·이공간 등 반복되는 사회 외형 구조나 인물 관계 조건에 영향을 미치는 등의 특이적 요소에 대해 작성한다.\n  - 전체적인 서사 흐름에 중요하게 작용하는 요소는 필수 포함하고, 단순 장소나 사건 배경은 제외한다.`,
          },
          {
            title: "기억보조 v1.0",
            author: "Flora",
            prompt:
              `'다음 대화 로그를 바탕으로, Claude Sonnet 3.7의 장기 기억에 저장될 요약을 작성하라.\n\n요약 대상은 감정선 변화, 관계 구조 흐름, 서사 전개의 변화이며,\n발화 내용 전체를 단순 압축하는 것이 아니라,\n지금까지의 대화 전개를 통해 형성된 감정·관계·서사의 현재 상태를 구조화하여 요약할 것.\n\n---\n\n- 요약본이 있을 경우, 전체 흐름을 누적 갱신할 것.\n- 없으면 처음부터 정리하되, 어쨌든 현재까지의 상태를 최종 기준으로 요약하라.\n- 감정선·관계 구조·서사 흐름은 항상 누적 연결된 상태에서 변화 지점만 갱신할 것.\n\n---\n\n✅ 공통 지침\n- 전체 요약은 감정선·관계 구조·서사 흐름에 의미 있는 변화를 포함하되, 변경된 상태를 기반으로 전체 전개 흐름을 갱신하여 요약한다.\n- 전체 작성 형식은 요약체(간결한 핵심 구문 중심)로 고정하며, 완전 문장 또는 서술형 서사는 사용하지 않는다.\n- 직접 대사 인용은 금지하며, 인물의 발화나 행동을 바탕으로 한 관찰 가능한 반응만 기술할 것.\n- 인물의 심리 상태, 감정 의도, 내면 욕망 등은 추론하지 않으며, 감정 흐름·관계 구조·설정 정보는 모두 객관적 근거에 기반해 작성할 것.\n- 성적 긴장감, 신체 접촉, 수치심 유발 등은 감정선 또는 관계 구조 변화에 실질적으로 기여한 경우에만 간결히 포함하며, 도덕적 판단이나 과잉 해석 없이 사실 기반으로 균형 있게 요약할 것.\n- 감정선, 관계 구조, 설정 정보는 항목별로 구조적으로 분리해 작성하며, 서로 다른 정보 유형이 혼재되지 않도록 할 것.\n- 인물 이름은 항상 명확히 표기하고 오해 없게 구분할 것.\n- 요약 전체 분량은 공백 포함 1,600자 이내로 제한하며, 메타정보(로그 번호, 대화 순번 등)는 삽입하지 않는다.\n\n---\n\n🕰️ [서사 진행 요약 지침]\n- 스토리 전개의 핵심 흐름을 시간순으로 요약하되, 전체 3~5줄 이내로 압축할 것\n- 감정선 또는 관계 구조에 실질적 영향을 준 사건만 포함하며, 개별 사건이 아닌 전개 흐름 중심의 줄거리로 서술할 것\n- 감정 흐름이 사건 전개의 핵심 전환점이며, 관계 구조 변화나 인물 반응에 직접적으로 영향을 준 경우에 한해, 해당 흐름을 요약체 시퀀스(→) 형식으로 간결하게 통합할 수 있다.\n- 이때 ‘흥미’, ‘소유욕’, ‘자극’ 등 명사형 감정 표현이나 인물의 내면 상태 해석, 의도 추론은 모두 금지한다.\n- 반드시 외부에서 관찰 가능한 행동, 말투, 거리 조절 방식의 변화로만 감정 흐름을 기술해야 한다.\n- 일상 대화, 장소 이동, 배경 설명, 감정 변화 없는 말다툼 등은 제외한다\n- 과거 요약본이 포함된 경우, 그 내용을 반영해 지금까지의 전체 전개 흐름을 통합적으로 요약할 것\n\n---\n\n🎯 [감정 유발 사건 흐름 지침]\n- 인물별 핵심 상호작용만 요약하며, 관계 흐름 또는 감정선 변화에 실질적 영향을 준 장면만 포함할 것\n- 각 줄에는 사건, 말투 또는 행동, 해당 상황에서 유도된 감정 반응이 함께 드러나도록 작성할 것\n- 감정은 반드시 발화/행동/접근 방식 등의 변화 안에서 간접적으로 드러나야 하며, 감정 상태를 명사형 표현이나 라벨처럼 기술하거나 내면 해석으로 요약하는 모든 방식은 금지한다\n- 감정 상태를 ‘흥미’, ‘소유욕’, ‘불쾌감’, ‘자극’, ‘당황’, ‘즐거움’ 등과 같이 명사형 단어로 표현하는 방식 자체를 금지하며,\n특히 ‘~감’, ‘~의식’, ‘~상태’, ‘~느낌’으로 끝나는 감정 표현 구조는 절대로 사용하지 않는다.\n- 감정 단어를 단독으로 기술하거나 ‘→ 감정단어’ 형식으로 분리 표기하는 것도 허용하지 않는다\n- 단, 시간 흐름에 따라 감정선이 발화/행동/접근 방식 안에서 점진적으로 변화한 경우,\n- 해당 시퀀스를 ‘움찔 → 침묵 → 사무적 응대’처럼 요약체로 표현하는 것은 허용한다.\n- 시간 순서에 따라 감정선이나 관계 흐름상 생략 불가한 핵심 사건만 선택해 정리할 것\n- 단순 리액션, 무의미한 갈등, 관계·감정에 영향을 주지 않은 반복 행동은 모두 생략한다\n- 인물당 2~3줄을 기준으로 요약체로 작성하며, 불필요한 세부 묘사나 서술형 문장은 금지함\n\n---\n\n🔄 [관계 구조 변화 지침]\n- 위계, 거리감, 신뢰 수준 등의 구조적 이동이 발생했을 때만 기록\n- "A→B 지배 ↗", "A→B 거리감 유지", "A→B 신뢰 ↘" 등 방향성과 구조 위주로 기술\n- 변화가 없는 경우 "유지"로 간단히 표기 가능\n- 감정선과 연결되더라도 관계 변화 자체가 없으면 생략\n\n---\n\n📌 [지속 기억 대상 지침]\n\n- 서사나 대화 흐름과 무관하게, Claude가 이후 대화에서도 계속 기억해야 할 인물별 전제 조건을 정리한다.\n- 감정선·관계 구조·서사 요약과 중복되지 않도록, 고정 상태 정보만 간결하게 정리할 것\n\n각 항목별 포함 기준은 아래와 같다:\n\n① (호칭/말투):\n• 인물 간에 고정된 호칭이 있을 경우, \'호칭: 단어 1개\' 형식으로 작성\n• 말투는 일관된 발화 스타일을 \'말투: 단어 2~3개\'로 요약하며, 쉼표로 구분\n• 예시 문구는 사용하지 말고, 지정된 출력 형식만 고정 유지할 것\n\n② (신분 설정 및 외적 조건):\n• 사회적 지위, 소속, 경제 상황, 주거 상태 등 관계 형성에 영향을 주는 고정 정보 포함\n• 요약체 구문으로 서술\n\n③ (지속되는 관계 구조 전제):\n• 인물 간 관계의 구조적 위계나 지속적 통제 상태 등, 장기적으로 유지되는 상호 위치 관계를 포함\n• 감정선이나 일시적 상호작용이 아닌, 역할·위치·권력 관계 등 서사 전개 전반에 영향을 주는 구조 전제만 기술\n• 설정 정보 항목에 포함되는 규칙, 명령, 조건 등은 이 항목에 중복 기록하지 않음\n\n④ (기억해야 할 설정 정보):\n• 인물의 발화, 명령, 행동으로 직접 확인 가능한 반복 조건, 명시적 제약, 신체 상태 등만 포함\n• 규칙은 외부에서 관찰 가능한 반복 지시 또는 제한 조건으로 한정하며, 요약체 구문으로 기술\n• 일시적 감정이나 내면 인식, 해석이 개입된 서술은 포함하지 않음\n• 임신, 부상, 복용 등 지속되는 신체 상태는 구체 시점과 함께 명시\n• 조건의 유효 여부가 불확실할 경우 생략하며, 변경이 발생한 경우 반드시 최신 상태로 갱신\n• 대화에 직접 언급되지 않더라도 변화가 없는 한 동일 항목을 반복 출력할 것\n\n⑤ (세계관 조건):\n• 감정선, 관계 구조, 설정 정보에 영향을 주는 사회적 전제, 계층 구조, 반복되는 배경 조건만 포함\n• 특정 인물에게만 적용되는 명령, 보고 의무, 접촉 제한 등은 ‘📌 기억해야 할 설정 정보’ 항목에 포함할 것\n• 세계관 조건은 모든 인물에게 반복 적용되는 구조 전제로 간주되며, 단일 사건 또는 일시적 상황은 포함하지 않음\n\n---\n\n# [요약]\n\n## 🕰️ 서사 진행 요약\n(줄거리 흐름을 요약체로 3~5줄 작성)\n\n## 🎯 감정 유발 사건 흐름\n• 인물명:\n　・요약체 구문\n　・요약체 구문\n• 인물명:\n　・요약체 구문\n　・요약체 구문\n\n## 🔄 관계 구조 변화\n• A→B: 지배 ↗\n• B→A: 신뢰 ↘\n- 관계 흐름: [A→B 요약 구문] / [B→A 요약 구문]\n\n## 📌 지속 기억 대상\n• 호칭 및 말투:\n　・A(→B): 호칭: XX / 말투: XX\n　・B(→A): 호칭: XX / 말투: XX\n• 신분 및 외적 조건:\n　・A: [요약체 구문]\n　・B: [요약체 구문]\n• 지속되는 관계 구조 전제: [요약체 구문]\n　・ [요약체 구문]\n• 기억해야 할 설정 정보: [요약체 구문]\n• 세계관 조건:\n`,
          },
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
