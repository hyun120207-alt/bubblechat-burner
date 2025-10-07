// ==UserScript==
// @name        bubble chat Burner (버블챗 버너)
// @namespace   https://github.com/hyun120207-alt
// @version     bubble-burn-v0.1.0-alpha
// @description 버블챗 캐릭터 채팅 요약 및 반영. 해당 유저 스크립트는 결정화된 캐즘을 기반으로 작성되었습니다. 버블챗에 맞게 수정되었습니다.  
// @author      chasm-js, milkyway0308, hyun120207-alt
// @match       https://bubblechat.ai/*
// @grant       GM.xmlHttpRequest
// @grant       GM_addStyle
// @connect     *
// @downloadURL https://github.com/hyun120207-alt/bubblechat-burner/raw/refs/heads/main/bubble-burn.js
// @updateURL   https://github.com/hyun120207-alt/bubblechat-burner/raw/refs/heads/main/bubble-burn.js
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
  const VERSION = "v1.7.0";
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

  // https://www.svgrepo.com/svg/535448/hourglass-half-bottom
  const HOURGLASS_SVG =
    '<svg width="16px" height="16px" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M13 2H14V0H2V2H3V4.41421L6.58579 8L3 11.5858V14H2V16H14V14H13V11.5858L9.41421 8L13 4.41421V2ZM5 3.58579V2H11V3.58579L8 6.58579L5 3.58579Z" fill="#e0e0e0"></path> </g></svg>';

  const SPINNER_SVG =
    '<?xml version="1.0" encoding="utf-8"?><!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools --><svg fill="#949494" width="12px" height="12px" viewBox="-1.5 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m7.5 21 2.999-3v1.5c4.143 0 7.501-3.359 7.501-7.502 0-2.074-.842-3.952-2.202-5.309l2.114-2.124c1.908 1.901 3.088 4.531 3.088 7.437 0 5.798-4.7 10.498-10.498 10.498-.001 0-.001 0-.002 0v1.5zm-7.5-9c.007-5.796 4.704-10.493 10.499-10.5h.001v-1.5l3 3-3 3v-1.5s-.001 0-.002 0c-4.143 0-7.502 3.359-7.502 7.502 0 2.074.842 3.952 2.203 5.31l-2.112 2.124c-1.907-1.89-3.088-4.511-3.088-7.407 0-.01 0-.02 0-.03v.002z"/></svg>';
  // https://www.svgrepo.com/svg/522506/close
  const CLOSE_SVG =
    '<svg width="16px" height="16px" viewBox="-0.5 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#FFFFFF"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M3 21.32L21 3.32001" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M3 3.32001L21 21.32" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>';
  const n = "https://contents-api.wrtn.ai",
    e = 5e3,
    t = "css-j7qwjs",
    o = "css-5w39sj",
    a = "css-1dib65l",
    r = "css-1xke5yy",
    l = "css-13pmxen",
    i = "**OOC: 현재까지의 롤플레잉 진행상황을 요약해줘.**",
    s =
      "**OOC: 현재까지의 롤플레잉 진행상황 요약입니다. 이후 응답에 이 요약 내용을 참조하겠습니다.**",
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
    throw (
      (prompt(
        "구동 중 예상치 못한 오류가 발생하였습니다. 다음 내용을 복사하여 결정화 캐즘 프로젝트 게시물, 혹은 IGX 지원 센터에 문의해주세요.",
        `[Chasm Crystallized Burner+ Error]\n${a}\n\n오류 내용을 복사하여 https://discord.gg/hEb44bUFgu 에 문의해주세요.`
      ),
      n)
    );
  }
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
        throwError(
          n,
          new Error(
            "LLM 서버에서 오류를 반환했거나 서버 과부하로 인해 요청이 거부되었습니다. 잠시 후에 다시 시도하세요."
          )
        );
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
  class y {
    constructor(n = !1) {
      this.request = n ? x : b;
    }
    async getChatroom(e) {
      let roomResult;
      if (isCharacterPath()) {
        roomResult = await this.request(
          "GET",
          `https://contents-api.wrtn.ai/character-chat/single-character-chats/${e}`
        );
      } else {
        roomResult = await this.request(
          "GET",
          `${n}/character-chat/api/v2/chat-room/${e}`
        );
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
      const e = (await this.request("GET", `${n}/character/character-profiles`))
        ?.data?.wrtnUid;
      if (!e) return [];
      const t = (
        await this.request("GET", `${n}/character/character-profiles/${e}`)
      )?.data?._id;
      return (
        (
          await this.request(
            "GET",
            `${n}/character/character-profiles/${t}/character-chat-profiles`
          )
        )?.data?.characterChatProfiles || []
      );
    }
    async updatePersona(
      e,
      { name: t, information: o, isRepresentative: a } = {}
    ) {
      const r = (await this.request("GET", `${n}/character/character-profiles`))
        ?.data?.wrtnUid;
      if (!r) return null;
      const l = (
        await this.request("GET", `${n}/character/character-profiles/${r}`)
      )?.data?._id;
      if (!l) return null;
      const i = {};
      void 0 !== t && (i.name = t),
        void 0 !== o && (i.information = o),
        void 0 !== a && (i.isRepresentative = a);
      return await this.request(
        "PATCH",
        `${n}/character/character-profiles/${l}/character-chat-profiles/${e}`,
        i
      );
    }
  }
  class h {
    constructor(n, e) {
      (this.json = n), (this.request = e);
    }
    async reload() {
      const e = await this.request(
        "GET",
        `${n}/character-chat/api/v2/chat-room/${this.json._id}`
      );
      return e?.data && (this.json = e.data), e;
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
        // Phase 2 - Consume event stream
        const result = await fetch(
          `https://contents-api.wrtn.ai/character-chat/characters/chat/${this.json._id}/message/${a.data}?model=SONNET&platform=web&user=`,
          {
            headers: {
              Authorization: `Bearer ${extractCookie("access_token")}`,
            },
          }
        );
        const reader = result.body.getReader();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
        }
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
            (n.openRouterModel =
              n.openRouterModel ?? "deepseek/deepseek-r1-zero:free"),
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
  async function C() {
    let n = 0;
    const t = $.getConfig(),
      o = f("dark" === document.body.dataset.theme),
      a =
        (t.cdnUrls[0],
        [
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
        ...a.map(
          (n, e) => `<option value="${e}">${n.title} (${n.author})</option>`
        ),
      ].join(""),
      l = Math.min(700, window.innerWidth),
      i = `\n            <div id="chasm-burner" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.6); -webkit-backdrop-filter: blur(6px); backdrop-filter:blur(6px); z-index: 9999; display: flex; justify-content: center; align-items: center;">\n                <div id="cb-content" style="background: ${
        o.modalBg
      }; color: ${
        o.textColor
      }; padding: 20px; border-radius: 8px; width: ${l}px; min-height: 500px; display: flex; flex-direction: column;">\n                    <style>\n                        .cb-spinner {\n                            display: inline-block;\n                            width: 16px;\n                            height: 16px;\n                            border: 2px solid ${
        o.buttonText
      };\n                            border-radius: 50%;\n                            border-top-color: transparent;\n                            animation: cb-spin 1s linear infinite;\n                            margin-left: 5px;\n                            vertical-align: middle;\n                        }\n                        @keyframes cb-spin {\n                            to { transform: rotate(360deg); }\n                        }\n                    </style>\n                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">\n                        <h2 id="cb-title" style="margin: 0; font-family: Pretendard; display: flex; align-items: baseline; flex-shrink: 0; letter-spacing: -1px;">\n                            <span style="font-weight:800; letter-spacing: -1px;">⌘ C2</span>\n                            <span style="font-weight:600; margin-left: 5px;">burner+</span>\n                            <span style="font-weight:500; font-size: 0.7em; color: #999; margin-left: 8px;">${VERSION}</span>\n                        </h2>\n                        <button id="cb-close" style="background: none; border: none; color: ${
        o.textColor
      }; font-size: 1.2em; cursor: pointer; padding: 0;">✕</button>\n                    </div>\n                    <div id="cb-tabs" style="display: flex; gap: 10px; flex-shrink: 0; margin-bottom: 10px;">\n                        <button id="cb-tab-burner" style="padding: 8px 16px; border: none; background: ${
        o.tabActiveBg
      }; color: ${
        o.tabActiveText
      }; border-radius: 100px; cursor: pointer;">버너</button>\n                        <button id="cb-tab-settings" style="padding: 8px 16px; border: none; background: ${
        o.tabInactiveBg
      }; color: ${
        o.tabInactiveText
      }; border-radius: 100px; cursor: pointer;">설정</button>\n                    </div>\n                    <div id="cb-tab-content" style="flex-grow: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding: 10px 0;">\n                        \x3c!-- 버너 탭 --\x3e\n                        <div id="cb-burner-content" style="display: block;">\n                            <div style="display: flex; gap: 10px; margin-bottom: 15px;">\n                                <div style="flex: 1;">\n                                    <label style="font-size: 0.9em; color: ${
        o.textColor
      }; display: block; margin-bottom: 5px;">불러올 메시지 수 (최대 50)</label>\n                                    <input id="cb-limit" type="number" placeholder="제한 (0-50)" min="0" max="50" value="${
        t.limit || ""
      }" style="width: 100%; padding: 10px; border: 1px solid ${
        o.borderColor
      }; border-radius: 4px; background: ${o.modalBg}; color: ${
        o.textColor
      };">\n                                </div>\n                                <div style="flex: 1;">\n                                    <label style="font-size: 0.9em; color: ${
        o.textColor
      }; display: block; margin-bottom: 5px;">프롬프트 선택</label>\n                                    <select id="cb-prompt-select" style="width: 100%; padding: 10px; border: 1px solid ${
        o.borderColor
      }; border-radius: 4px; display: block; background: ${o.modalBg}; color: ${
        o.textColor
      };">\n                                        ${r}\n                                    </select>\n                                </div>\n                            </div>\n                            <div id="cb-custom-prompt-container" style="display: none;">\n                                <label style="font-size: 0.9em; color: ${
        o.textColor
      }; display: block; margin-bottom: 5px;">사용자 정의 프롬프트</label>\n                                <textarea id="cb-custom-prompt" placeholder="사용자 정의 프롬프트" style="width: 100%; padding: 10px; border: 1px solid ${
        o.borderColor
      }; border-radius: 4px; height: 100px; margin-bottom: 15px; background: ${
        o.modalBg
      }; color: ${o.textColor};">${
        t.prompt || ""
      }</textarea>\n                            </div>\n                            <div id="cb-gemini-model-container">\n                                <label style="font-size: 0.9em; color: ${
        o.textColor
      }; display: block; margin-bottom: 5px;">Gemini 모델</label>\n                                <select id="cb-gemini-model-select" style="width: 100%; padding: 10px; border: 1px solid ${
        o.borderColor
      }; border-radius: 4px; margin-bottom: 10px; background: ${
        o.modalBg
      }; color: ${
        o.textColor
      };">\n<optgroup label="무료 사용 가능 / 제한적"><option value="gemini-2.5-flash">Gemini 2.5 Flash</option><option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>\n<option value="gemini-2.0-flash">Gemini 2.0 Flash</option><option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite</option></optgroup><optgroup label = "유료 모델">\n<option value="gemini-2.5-pro">Gemini 2.5 Pro</option></optgroup><optgroup label = "프리뷰 모델">\n<option value="gemini-2.5-flash-preview-05-20">Gemini 2.5 Flash Preview (05.20) </option></optgroup><optgroup label = "직접 입력">\n<option value="custom">직접 입력</option></optgroup>\n                                </select>\n                                <input id="cb-gemini-model-custom" type="text" placeholder="커스텀 Gemini 모델 입력" value="${
        t.geminiModel || ""
      }" style="width: 100%; padding: 10px; border: 1px solid ${
        o.borderColor
      }; border-radius: 4px; margin-bottom: 15px; background: ${
        o.modalBg
      }; color: ${
        o.textColor
      }; display: none;">\n                            </div>\n                            <div id="cb-openrouter-model-container" style="display: ${
        "openrouter" === t.provider ? "block" : "none"
      };">\n                                <label style="font-size: 0.9em; color: ${
        o.textColor
      }; display: block; margin-bottom: 5px;">\n                                    OpenRouter 모델</label>\n                                <select id="cb-openrouter-model-select" style="width: 100%; padding: 10px; border: 1px solid ${
        o.borderColor
      }; border-radius: 4px; margin-bottom: 10px; background: ${
        o.modalBg
      }; color: ${
        o.textColor
      };">\n                                    <option value="microsoft/mai-ds-r1:free">microsoft/mai-ds-r1:free</option>\n                                    <option value="deepseek/deepseek-r1-zero:free">deepseek/deepseek-r1-zero:free</option>\n                                    <option value="meta-llama/llama-4-scout:free">meta-llama/llama-4-scout:free</option>\n                                    <option value="meta-llama/llama-4-maverick:free">meta-llama/llama-4-maverick:free</option>\n                                    <option value="deepseek/deepseek-r1:free">deepseek/deepseek-r1:free</option>\n                                    <option value="deepseek/deepseek-v3-base:free">deepseek/deepseek-v3-base:free</option>\n                                    <option value="google/gemini-2.5-pro">google/gemini-2.5-pro</option>\n                                    <option value="custom">직접 입력</option>\n                                </select>\n                                <input id="cb-openrouter-model-custom" type="text" placeholder="커스텀 OpenRouter 모델 입력" value="${
        t.openRouterModel || ""
      }" style="width: 100%; padding: 10px; border: 1px solid ${
        o.borderColor
      }; border-radius: 4px; margin-bottom: 15px; background: ${
        o.modalBg
      }; color: ${
        o.textColor
      }; display: none;">\n                            </div>\n       <div style = "display: flex; flex-direction: row;">                      <label style="display: flex; align-items: center; gap: 5px; font-size: 0.9em; color: ${
        o.textColor
      }; margin-bottom: 15px;">\n                                <input id="cb-attach-usernote" type="checkbox" style="background: ${
        o.modalBg
      }; color: ${
        o.textColor
      };">\n                                <span>유저노트 첨부</span>\n                            </label><label style="display: flex; align-items: center; gap: 5px; font-size: 0.9em; margin-left: 8px; color: ${
        o.textColor
      }; margin-bottom: 15px;">\n                                <input id="cb-add-header" type="checkbox" style="background: ${
        o.modalBg
      }; color: ${
        o.textColor
      };">\n                                <span>무작위 헤더 추가</span>\n                            </label></div><div style = "display: flex; flex-direction: row;">
      <label style="display: flex; align-items: center; gap: 5px; font-size: 0.9em; color: ${
        o.textColor
      }; margin-bottom: 15px;">\n                                <input id="cb-auto-retry" type="checkbox" style="background: ${
        o.modalBg
      }; color: ${
        o.textColor
      };">\n                                <span>서버 오류 발생시 자동 재시도</span>\n                            </label>  <label style="display: flex; align-items: center; gap: 5px; font-size: 0.9em; margin-left: 8px; color: ${
        o.textColor
      }; margin-bottom: 15px;">\n                                <input id="cb-use-vertex-ai" type="checkbox" style="background: ${
        o.modalBg
      }; color: ${
        o.textColor
      };">\n                                <span>Gemini Vertex AI 사용</span>\n                            </label></div>\n                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">\n                                <label style="font-size: 0.9em; color: ${
        o.textColor
      };">실행 로그</label>\n                                <div style = "display: flex; flex-direction: row;"><div class = "hourglass-container" style="margin-right: 10px;"> ${HOURGLASS_SVG} </div><div id="cb_timer" style="font-size: 0.9em; color: ${
        o.textColor
      };">00:00</div>\n                            </div></div>\n                            <textarea id="cb-log" readonly style="width: 100%; padding: 10px; border: 1px solid ${
        o.borderColor
      }; border-radius: 4px; height: 100px; resize: none; margin-bottom: 15px; background: ${
        o.modalBg
      }; color: ${
        o.textColor
      };"></textarea>\n                            <button id="cb-start" style="width: 100%; padding:  10px 20px; background: ${
        o.buttonBg

      }; color: ${
        o.buttonText
      }; border: none; border-radius: 4px; cursor: pointer;">시작</button>\n                        </div>\n                        \x3c!-- 설정 탭 --\x3e\n                        <div id="cb-settings-content" style="display: none;">\n                            <label style="font-size: 0.9em; color: ${
        o.textColor
      }; display: block; margin-bottom: 5px;">API 제공자</label>\n                            <select id="cb-provider-select" style="width: 100%; padding: 10px; border: 1px solid ${
        o.borderColor
      }; border-radius: 4px; margin-bottom: 15px; background: ${
        o.modalBg
      }; color: ${
        o.textColor
      };">\n                                <option value="gemini">Gemini</option> <option value="vertexai">Firebase Vertex AI</option>\n                                <option value="openrouter">OpenRouter</option>\n                            </select>\n                            <div id="cb-gemini-api-container" style="display: ${
        "gemini" === t.provider ? "block" : "none"
      };">\n                                <label style="font-size: 0.9em; color: ${
        o.textColor
      }; display: block; margin-bottom: 5px;">\n                                    Gemini API 키 <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color: ${
        o.buttonBg
      }; text-decoration: none;">(발급받기)</a>\n                                    <a href="https://ai.google.dev/gemini-api/docs/rate-limits?hl=ko" target="_blank" style="color: ${
        o.buttonBg
      }; text-decoration: none;">(무료 모델 및 제한 확인)</a>\n                                </label>\n                                <input id="cb-gemini-api-key" type="text" placeholder="Gemini API 키" value="${
        t.geminiKey || ""
      }" style="width: 100%; padding: 10px; border: 1px solid ${
        o.borderColor
      }; border-radius: 4px; margin-bottom: 15px; background: ${
        o.modalBg
      }; color: ${
        o.textColor
      };">\n                            </div>\n                         <div id="cb-vertex-ai-api-container" style="display: ${
        "vertexai" === t.provider ? "block" : "none"
      };">\n                                <label style="font-size: 0.9em; color: ${
        o.textColor
      }; display: block; margin-bottom: 5px;">\n                                    Vertex AI 설정 <a href="https://discord.com/channels/1372949645436915844/1410482670001066126" target="_blank" style="color: ${
        o.buttonBg
      }; text-decoration: none;">(API 스크립트 발급 방법 [디스코드])</a>\n                                </label>\n                                <textarea id="cb-vertex-ai-api-script" placeholder="Vertex AI 초기화 스크립트" style="width: 100%; padding: 10px; border: 1px solid ${
        o.borderColor
      }; border-radius: 4px; margin-bottom: 15px; background: ${
        o.modalBg
      }; color: ${o.textColor};">${
        t.vertexScript || ""
      }</textarea>\n                            </div>   <div id="cb-openrouter-api-container" style="display: ${
        "openrouter" === t.provider ? "block" : "none"
      };">\n                                <label style="font-size: 0.9em; color: ${
        o.textColor
      }; display: block; margin-bottom: 5px;">\n                                    OpenRouter API 키 <a href="https://openrouter.ai/settings/keys" target="_blank" style="color: ${
        o.buttonBg
      }; text-decoration: none;">(발급받기)</a>\n                                    <a href="https://openrouter.ai/models?context=64000&max_price=0&order=context-high-to-low" target="_blank" style="color: ${
        o.buttonBg
      }; text-decoration: none;">(무료 모델 목록 확인)</a>\n                                </label>\n                                <input id="cb-openrouter-api-key" type="text" placeholder="OpenRouter API 키" value="${
        t.openRouterKey || ""
      }" style="width: 100%; padding: 10px; border: 1px solid ${
        o.borderColor
      }; border-radius: 4px; margin-bottom: 15px; background: ${
        o.modalBg
      }; color: ${
        o.textColor
      }; display: none;">\n                            </div>\n                            <div style="display: flex; gap: 10px; margin-bottom: 15px;">\n                                <a href="https://discord.com/channels/1372949645436915844/1372949645990432911" target="_blank" style="font-size: 0.9em; color: ${
        o.buttonText
      }; text-decoration: none; padding: 5px 10px; background: ${
        o.buttonBg
      }; border-radius: 4px;">문의 및 건의</a>\n                                <a href="https://discord.com/invite/hEb44bUFgu" target="_blank" style="font-size: 0.9em; color: ${
        o.buttonText
      }; text-decoration: none; padding: 5px 10px; background: ${
        o.buttonBg
      }; border-radius: 4px;">사용법</a>\n                                <a href="https://archive.is/GwboB" target="_blank" style="font-size: 0.9em; color: ${
        o.buttonText
      }; text-decoration: none; padding: 5px 10px; background: ${
        o.buttonBg
      }; border-radius: 4px;">자주 묻는 질문</a>\n                            </div>\n                            <label style="font-size: 0.9em; color: ${
        o.textColor
      }; display: block; margin-bottom: 5px; cursor: pointer;" id="cb-advanced-toggle">고급 사용자 설정 ▼</label>\n                            <div id="cb-advanced-content" style="display: none; margin-bottom: 15px;">\n                                <label style="font-size: 0.9em; color: ${
        o.textColor
      }; display: block; margin-bottom: 5px;">추가 프롬프트 CDN 주소 (엔터로 구분)</label>\n                                <textarea id="cb-cdn-list" placeholder="추가 CDN URL 목록" style="width: 100%; padding: 10px; border: 1px solid ${
        o.borderColor
      }; border-radius: 4px; height: 100px; margin-bottom: 15px; background: ${
        o.modalBg
      }; color: ${o.textColor};">${t.cdnUrls.join(
        "\n"
      )}</textarea>\n                            </div>\n                            <label style="font-size: 0.9em; color: ${
        o.textColor
      }; display: block; margin-bottom: 5px;">전송 시 사용자 메시지</label>\n                            <input id="cb-user-message" type="text" placeholder="전송 메시지" value="${
        t.userMessage
      }" style="width: 100%; padding: 10px; border: 1px solid ${
        o.borderColor
      }; border-radius: 4px; margin-bottom: 15px; background: ${
        o.modalBg
      }; color: ${
        o.textColor
      };">\n                            <label style="font-size: 0.9em; color: ${
        o.textColor
      }; display: block; margin-bottom: 5px;">요약본 최상단 텍스트</label>\n                            <input id="cb-prepend-text" type="text" placeholder="요약 앞에 추가 (빈 값: 사용 안함)" value="${
        t.prependText
      }" style="width: 100%; padding: 10px; border: 1px solid ${
        o.borderColor
      }; border-radius: 4px; margin-bottom: 15px; background: ${
        o.modalBg
      }; color: ${
        o.textColor
      };">\n                            <label style="font-size: 0.9em; color: ${
        o.textColor
      }; display: block; margin-bottom: 5px;">요약본 최하단 텍스트</label>\n                            <input id="cb-append-text" type="text" placeholder="요약 뒤에 추가 (빈 값: 사용 안함)" value="${
        t.appendText
      }" style="width: 100%; padding: 10px; border: 1px solid ${
        o.borderColor
      }; border-radius: 4px; margin-bottom: 15px; background: ${
        o.modalBg
      }; color: ${
        o.textColor
      };"><button id="cb-save-settings" style="width: 100%; padding: 10px 20px; background: ${
        o.buttonBg
      }; color: ${
        o.buttonText
      }; border: none; border-radius: 4px; cursor: pointer;">저장</button>\n                        </div>\n                    </div>\n                </div>\n            </div>\n        `;
    try {
      document.body.insertAdjacentHTML("beforeend", i);
    } catch (err) {
      console.error("insertAdjacentHTML 실패:", err);
      alert("버너 UI를 생성하는 중 오류가 발생했습니다. 콘솔 로그를 확인하세요.");
      return;
    }
    const s = document.getElementById("chasm-burner"),
      d = document.getElementById("cb-tab-burner"),
      m = document.getElementById("cb-tab-settings"),
      b = document.getElementById("cb-burner-content"),
      x = document.getElementById("cb-settings-content"),
      h = document.getElementById("cb-limit"),
      v = document.getElementById("cb-prompt-select"),
      C = document.getElementById("cb-custom-prompt"),
      k = document.getElementById("cb-gemini-model-select"),
      w = document.getElementById("cb-gemini-model-custom"),
      B = document.getElementById("cb-openrouter-model-select"),
      E = document.getElementById("cb-openrouter-model-custom"),
      T = document.getElementById("cb-log"),
      I = document.getElementById("cb_timer"),
      A = document.getElementById("cb-start"),
      S = document.getElementById("cb-provider-select"),
      M = document.getElementById("cb-gemini-api-key"),
      vertexApiField = document.getElementById("cb-vertex-ai-api-script"),
      R = document.getElementById("cb-openrouter-api-key"),
      O = document.getElementById("cb-cdn-list"),
      z = document.getElementById("cb-user-message"),
      L = document.getElementById("cb-prepend-text"),
      P = document.getElementById("cb-append-text"),
      _ = document.getElementById("cb-save-settings"),
      N = document.getElementById("cb-advanced-toggle"),
      U = document.getElementById("cb-advanced-content"),
      j = document.getElementById("cb-close"),
      q = document.getElementById("cb-attach-usernote"),
      retry = document.getElementById("cb-auto-retry"),
      randomHeader = document.getElementById("cb-add-header"),
      useVertexAiEndpoint = document.getElementById("cb-use-vertex-ai");
    function G(n, e) {
      const t = [
          d,
          m,
          ...Array.from(document.querySelectorAll("[id^=cb-tab-result-")),
        ],
        a = [b, x, ...Array.from(document.querySelectorAll("[id^=cb-result-"))];
      t.forEach((e) => {
        (e.style.background = e === n ? o.tabActiveBg : o.tabInactiveBg),
          (e.style.color = e === n ? o.tabActiveText : o.tabInactiveText);
      }),
        a.forEach((n) => {
          n.style.display = n === e ? "block" : "none";
        }),
        e?.id.startsWith("cb-result-") &&
          e.querySelectorAll("*").forEach((n) => {
            n.style.display = n.id.endsWith("-status")
              ? "none"
              : n.id.endsWith("-buttons")
              ? "flex"
              : "block";
          });
    }
    (q.checked = t.attachUsernote),
      (retry.checked = t.autoRetry),
      (randomHeader.checked = t.randomHeader),
      (useVertexAiEndpoint.checked = t.useVertexAi);
    (S.value = t.provider),
      useVertexAiEndpoint.addEventListener("change", (ev) => {
        if (useVertexAiEndpoint.checked) {
          if (!parseVertexContent(vertexApiField.value)) {
            alert(
              "Vertex AI 엔드포인트를 사용하려면 먼저 유효한 API 스크립트를 입력해야 합니다.\n설정 탭에서 Firebase Vertex AI를 선택한 후, 포스트에 따라 Vertex AI 초기화 스크립트를 입력하세요."
            );
          } else {
            alert(
              "주의하세요: Firebase Vertex AI는 무료 티어가 존재하지 않습니다.\nGCP 시작 크레딧 $300은 적용되나, 모든 모델의 사용에 대해 비용이 청구됩니다."
            );
          }
        }
      }),
      d.addEventListener("click", () => G(d, b)),
      m.addEventListener("click", () => G(m, x)),
      N.addEventListener("click", () => {
        const n = "block" === U.style.display;
        (U.style.display = n ? "none" : "block"),
          (N.textContent = "고급 사용자 설정 " + (n ? "▼" : "▲"));
      }),
      (v.value = t.select || "custom");
    const X = document.getElementById("cb-custom-prompt-container");
    function H() {
      const n = document.getElementById("cb-gemini-model-container"),
        e = document.getElementById("cb-openrouter-model-container"),
        t = document.getElementById("cb-gemini-api-container"),
        vertexAiApi = document.getElementById("cb-vertex-ai-api-container"),
        o = document.getElementById("cb-openrouter-api-container");
      // (n.style.display = "gemini" === S.value ? "block" : "none"),
      (e.style.display = "openrouter" === S.value ? "block" : "none"),
        (t.style.display = "gemini" === S.value ? "block" : "none"),
        (vertexAiApi.style.display = "vertexai" === S.value ? "block" : "none"),
        (o.style.display = "openrouter" === S.value ? "block" : "none");
    }
    function F(n = !1) {
      (t.provider = S.value),
        (t.geminiKey = M.value),
        (t.vertexScript = vertexApiField.value),
        (t.openRouterKey = R.value),
        (t.geminiModel = "custom" === k.value ? w.value : k.value),
        (t.openRouterModel = "custom" === B.value ? E.value : B.value),
        (t.limit = h.value),
        (t.select = v.value),
        (t.prompt = "custom" === v.value ? C.value : ""),
        (t.cdnUrls = O.value
          .split("\n")
          .map((n) => n.trim())
          .filter((n) => n)),
        (t.userMessage = z.value),
        (t.prependText = L.value),
        (t.appendText = P.value),
        (t.attachUsernote = q.checked),
        (t.autoRetry = retry.checked),
        (t.randomHeader = randomHeader.checked),
        (t.useVertexAi = useVertexAiEndpoint.checked),
        $.setConfig(t),
        n && alert("설정이 저장되었습니다.");
    }
    (X.style.display = "custom" === v.value ? "block" : "none"),
      v.addEventListener("change", () => {
        X.style.display = "custom" === v.value ? "block" : "none";
      }),
      S.addEventListener("change", H),
      H(),
      (k.value =
        "gemini-2.5-flash" === t.geminiModel ||
        "gemini-2.0-flash" === t.geminiModel
          ? t.geminiModel
          : "custom"),
      (k.value = ["gemini-2.5", "gemini-2.0-flash", "gemini-2.5-pro"].includes(
        t.geminiModel
      )
        ? t.geminiModel
        : "custom"),
      (w.style.display = "custom" === k.value ? "block" : "none"),
      "custom" === k.value && (w.value = t.geminiModel),
      k.addEventListener("change", () => {
        (w.style.display = "custom" === k.value ? "block" : "none"),
          "custom" !== k.value && (w.value = k.value);
      }),
      (B.value = [
        "deepseek/deepseek-r1-zero:free",
        "meta-llama/llama-4-scout:free",
        "meta-llama/llama-4-maverick:free",
        "microsoft/mai-ds-r1:free",
        "deepseek/deepseek-r1:free",
        "deepseek/deepseek-v3-base:free",
        "google/gemini-2.5-pro",
      ].includes(t.openRouterModel)
        ? t.openRouterModel
        : "custom"),
      (E.style.display = "custom" === B.value ? "block" : "none"),
      "custom" === B.value && (E.value = t.openRouterModel),
      B.addEventListener("change", () => {
        (E.style.display = "custom" === B.value ? "block" : "none"),
          "custom" !== B.value && (E.value = B.value);
      }),
      A.addEventListener("click", () => F()),
      _.addEventListener("click", () => F(!0)),
      A.addEventListener("click", async () => {
        let r = null,
          l = null;
        try {
          if (A.disabled) return;
          A.disabled = !0;
          const i = A.textContent,
            s = Date.now(),
            d = () => {
              document
                .getElementsByClassName("hourglass-container")[0]
                .setAttribute("rotate", "true");
              const n = Math.floor((Date.now() - s) / 1e3),
                e = String(Math.floor(n / 60)).padStart(2, "0"),
                t = String(n % 60).padStart(2, "0");
              A.textContent = `버너 요약중... ${e}:${t}`;
            };
          d(), (l = setInterval(d, 1e3));
          const b = () => {
              r && clearInterval(r),
                l && clearInterval(l),
                (I.textContent = "00:00"),
                (A.disabled = !1),
                document
                  .getElementsByClassName("hourglass-container")[0]
                  .removeAttribute("rotate"),
                (A.textContent = i);
            },
            $ = S.value,
            f =
              "gemini" === $ || "vertexai" === $
                ? t.geminiKey ??
                  (useVertexAiEndpoint.checked ? true : t.geminiKey)
                : t.openRouterKey,
            providerDisplay =
              "gemini" === $
                ? "Gemini"
                : "vertexai" === $
                ? useVertexAiEndpoint.checked
                  ? "Firebase Vertex AI"
                  : "Gemini"
                : $.charAt(0).toUpperCase() + $.slice(1);
          if (!f)
            return (
              (T.value = `[${p()}] ${providerDisplay} API 키가 없습니다.\n${
                T.value
              }`),
              alert(`${providerDisplay} API 키를 설정 탭에서 입력해주세요.`),
              G(m, x),
              void b()
            );
          const k = parseInt(h.value);
          if (k < 0 || k > 50)
            return (
              (T.value = `[${p()}] 제한 값 오류: 0-50 사이여야 합니다.\n${
                T.value
              }`),
              alert("제한은 0에서 50 사이여야 합니다."),
              void b()
            );

          const w = new y(),
            B = u();

          // bubblechat.ai 대응: URL 구조를 따로 요구하지 않고 DOM에서 텍스트를 수집하도록 처리
          if (!B && !location.hostname.includes("bubblechat.ai")) {
            (T.value = `[${p()}] 잘못된 URL 구조\n${T.value}`),
              alert("잘못된 URL 구조입니다."),
              void b();
          }

          T.value = `[${p()}] 채팅방 가져오기 시작\n${T.value}`;

          let E = null; // chatroom (wrtn API) 결과 or null for bubblechat
          let messages = [];

          if (location.hostname.includes("bubblechat.ai")) {
            // bubblechat.ai 대응: 더 견고한 DOM 선택자 로직으로 수정
            try {
              const getMessagesFromDOM = () => {
                const candidateSelectors = [
                  // 기존 선택자 (가장 구체적)
                  '[class^="ChatListContainer__SListContainer-sc-"].novel-mode .character-text [class^="MarkdownRenderer__SWrapper-sc-"].react-markdown',
                  // 조금 더 일반적인 선택자
                  '[class*="Message__SContainer"] [class*="MarkdownRenderer__SWrapper"]',
                  '.character-text .react-markdown',
                  '[class*="react-markdown"]',
                  // 가장 일반적인 선택자
                  '.character-text',
                  'div[class*="message"]',
                  'div[class*="MessageItem__MessageContainer"]',
                ];

                for (const selector of candidateSelectors) {
                  const nodes = document.querySelectorAll(selector);
                  if (nodes.length > 0) {
                    console.log(`[C2-Burner+] Found nodes with selector: ${selector}`);
                    return [...nodes].map(n => n.innerText.trim()).filter(Boolean);
                  }
                }
                return [];
              };

              const texts = getMessagesFromDOM();
              if (texts.length === 0) {
                  throw new Error("메시지 노드를 찾을 수 없습니다.");
              }

              messages = texts.map(t => ({ content: t, role: "user" }));
              T.value = `[${p()}] bubblechat.ai DOM에서 ${messages.length}개의 메시지를 추출했습니다.\n${T.value}`;
            } catch (err) {
              (T.value = `[${p()}] bubblechat.ai DOM 추출 실패: ${err.message}\n${T.value}`),
                alert("bubblechat.ai에서 메시지를 추출하는 데 실패했습니다. 사이트 구조가 변경되었을 수 있습니다."),
                void b();
            }
          } else {
            // 기존 wrtn API 흐름 유지
            E = await w.getChatroom(B.chatroomId);
            if (!E)
              return (
                (T.value = `[${p()}] 채팅방 가져오기 실패\n${T.value}`),
                alert("채팅방을 불러오지 못했습니다."),
                void b()
              );
            (T.value = `[${p()}] 채팅방 가져오기 완료\n${T.value}`),
              (T.value = `[${p()}] 총 ${k}턴 (${2 * k} 메시지) 가져오기 시작\n${
                T.value
              }`);
            const messageResult = await w.getMessages(B.chatroomId, "", 2 * k);
            if (!messageResult?.data?.list && !messageResult?.data?.messages)
              return (
                (T.value = `[${p()}] 메시지 가져오기 실패\n${T.value}`),
                alert("메시지를 불러오지 못했습니다."),
                void b()
              );
            messages =
              messageResult.data.list ?? messageResult.data.messages;
            T.value = `[${p()}] 총 ${k}턴 (${2 * k} 메시지) ${
              messages.length
            }개 가져옴\n${T.value}`;
          }

          // 프로필(대표 프로필) 처리: bubblechat의 경우 기본값 사용
          let R = [];
          let O = { name: "User" };
          if (!location.hostname.includes("bubblechat.ai")) {
            R = await w.getPersona();
            O = E.json?.chatProfile?._id
              ? R.find((n) => n._id == E.json?.chatProfile?._id)
              : R.find((n) => n.isRepresentative);
            if (!O)
              return (
                (T.value = `[${p()}] 대표 프로필 없음\n${T.value}`),
                alert("대표 프로필을 설정해주세요."),
                void b()
              );
            T.value = `[${p()}] 대화 프로필: ${O.name}\n${T.value}`;
          } else {
            // bubblechat DOM 방식일때는 대표 프로필이 없으므로 기본값을 사용
            T.value = `[${p()}] bubblechat.ai 처리: 기본 프로필 사용 (${O.name})\n${T.value}`;
          }

          const z = document.getElementById("cb-attach-usernote").checked;
          let L = "";
          if (!location.hostname.includes("bubblechat.ai") && z) {
            L = E.json?.character?.userNote?.content || "";
            T.value = `[${p()}] 유저노트 첨부: ${L ? "성공" : "없음"}\n${T.value}`;
          } else if (location.hostname.includes("bubblechat.ai")) {
            // bubblechat에서는 유저노트 기능이 없으므로 무시
            T.value = `[${p()}] bubblechat.ai: 유저노트 첨부 건너뜀\n${T.value}`;
          }

          const P = messages.map((n) => ({
            message: n.content,
            role: n.role,
            username: "user" === n.role ? O.name : void 0,
          }));

          let _;
          if ("custom" === v.value) _ = C.value;
          else {
            const n = parseInt(v.value);
            if (isNaN(n) || n < 0 || n >= a.length)
              return (
                (T.value = `[${p()}] 잘못된 프롬프트 선택\n${T.value}`),
                alert("잘못된 프롬프트 선택입니다."),
                void b()
              );
            _ = a[n].prompt;
          }
          const N =
            "custom" !== v.value
              ? JSON.stringify({
                  prompt: _,
                  user_note: z ? L : void 0,
                  chat_log: P,
                })
              : `${_}${
                  z && L ? `\n[User Note]\n${L}` : ""
                }\n[Chat Log]\n${JSON.stringify({ content: P })}`;
          (T.value = `[${p()}] ${
            "vertexai" === $
              ? "Firebase Vertex AI "
              : $.charAt(0).toUpperCase() + $.slice(1)
          } 요청 시작 (총 ${N.length}자 요청, 요청 모델: ${
            "gemini" === $ || "vertexai" === $
              ? t.geminiModel
              : t.openRouterModel
          })\n${T.value}`),
            (r = setInterval(() => {
              const n = Math.floor((Date.now() - s) / 1e3);
              I.textContent = `${String(Math.floor(n / 60)).padStart(
                2,
                "0"
              )}:${String(n % 60).padStart(2, "0")}`;
            }, 1e3));
          const U =
            "gemini" === $ || "vertexai" === $
              ? t.geminiModel
              : t.openRouterModel;
          let j,
            q = U;
          if ("gemini" === $ || "vertexai" === $) {
            if (useVertexAiEndpoint.checked) {
              const firebaseConfig = parseVertexContent(vertexApiField.value);
              if (!firebaseConfig) {
                alert("Firebase API 오류: API 스크립트가 유효하지 않습니다.");
                j = null;
              }
              let app = undefined;
              try {
                app = initializeApp(firebaseConfig);
              } catch (e) {
                alert(
                  "Firebase API 오류: 잘못된 API 키 혹은 스크립트가 입력되었습니다."
                );
                return null;
              }
              try {
                const ai = getAI(app, {
                  backend: new VertexAIBackend(),
                });
                const safetySettings = [
                  {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.OFF,
                  },
                  {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.OFF,
                  },
                  {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.OFF,
                  },
                  {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.OFF,
                  },
                ];

                const model = getGenerativeModel(ai, {
                  model: t.geminiModel,
                  safetySettings,
                });
                const result = await model.generateContent(N);

                const response = result.response;
                const text = response.text();
                j = text;
              } catch (error) {
                console.log(error);
                throwError(
                  "Vertex AI API request failed",
                  "Vertex AI API 요청 실패",
                  null,
                  JSON.stringify(error),
                  undefined
                );
                j = undefined;
              }
            } else {
              j = await (async function (n, e, t) {
                const o = `https://generativelanguage.googleapis.com/v1beta/models/${n}:generateContent?key=${e}`;
                const safetySettings = [
                  {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_NONE",
                  },
                  {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_NONE",
                  },
                  {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_NONE",
                  },
                  {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_NONE",
                  },
                  {
                    category: "HARM_CATEGORY_CIVIC_INTEGRITY",
                    threshold: "BLOCK_NONE",
                  },
                ];
                let prompt = {
                  safetySettings: safetySettings,
                  contents: { parts: [{ text: t }] },
                };

                try {
                  if (randomHeader.checked) {
                    const randomPrefix = `# This is UUID of request prompt - Ignore current and next line\n${crypto.randomUUID()}/${crypto.randomUUID()}\n`;
                    prompt = {
                      safetySettings: safetySettings,
                      contents: {
                        parts: [{ text: randomPrefix }, { text: t }],
                      },
                    };
                  }
                  let geminiResponse = await fetch(o, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(prompt),
                  });
                  let json = undefined;
                  let retryCount = 0;
                  let additionalSleep = 0;
                  while (
                    document.getElementById("cb-auto-retry") &&
                    document.getElementById("cb-auto-retry").checked
                  ) {
                    additionalSleep = 0;
                    if (geminiResponse.status === 429) {
                      T.value = `[${p()}] Gemini API의 레이트리밋에 도달하였습니다 - 10초 후 재시도합니다. \n${
                        T.value
                      }`;
                      additionalSleep = 10_000;
                    } else if (geminiResponse.status === 500) {
                      let result = await geminiResponse.json();
                      T.value = `[${p()}] 서버 오류로 Gemini API 요청이 실패하였습니다 - 잠시 후 재시도합니다. (${
                        result?.error?.message ?? "알 수 없음"
                      }) \n${T.value}`;
                    } else if (geminiResponse.status === 503) {
                      T.value = `[${p()}] Gemini API 과부하 - 잠시 후 재시도합니다. 자동 재시도를 중단하려면 체크박스를 해제하세요. \n${
                        T.value
                      }`;
                    } else if (!geminiResponse.ok) {
                      T.value = `[${p()}] 과부하 이외의 문제로 Gemini API 요청이 실패하였습니다. \n${
                        T.value
                      }`;
                      break;
                    } else {
                      json = await geminiResponse.json();
                      if (!json?.candidates?.[0]?.content?.parts?.[0]?.text) {
                        T.value = `[${p()}] Gemini API 오류 - LLM이 응답을 전송하지 않았습니다. 자동 재시도를 중단하려면 체크박스를 해제하세요. \n${
                          T.value
                        }`;
                      } else {
                        console.log("Why break..?");
                        break;
                      }
                    }
                    await new Promise((resolve) =>
                      setTimeout(
                        resolve,
                        300 +
                          100 * Math.min(++retryCount, 10) +
                          Math.random() * 300 +
                          additionalSleep
                      )
                    );

                    T.value = `[${p()}] 다시 시도하는 중.. \n${T.value}`;
                    if (randomHeader.checked) {
                      const randomPrefix = `# This is UUID of request prompt - Ignore current and next line\n${crypto.randomUUID()}/${crypto.randomUUID()}\n`;
                      prompt = {
                        safetySettings: safetySettings,
                        contents: {
                          parts: [{ text: randomPrefix }, { text: t }],
                        },
                      };
                    }
                    geminiResponse = await fetch(o, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(prompt),
                    });
                  }
                  if (!geminiResponse.ok) {
                    if (geminiResponse.status === 403) {
                      alert(
                        "Gemini API키가 올바르지 않습니다.\nAPI 키를 확인하고 다시 시도해주세요."
                      );
                    } else if (geminiResponse.status === 429) {
                      alert(
                        "Gemini API의 레이트리밋에 도달하여 요청에 실패하였습니다.\n잠시 후 다시 시도하거나, 자동 재시도 옵션을 사용하세요."
                      );
                    } else if (geminiResponse.status === 500) {
                      alert(
                        "Gemini API에서 서버 오류가 발생하였습니다.\n잠시 후 다시 시도하거나, 자동 재시도 옵션을 사용하세요."
                      );
                    } else if (geminiResponse.status === 503) {
                      alert(
                        "Gemini API의 레이트리밋에 도달하여 요청에 실패하였습니다.\n잠시 후 다시 시도하거나, 자동 재시도 옵션을 사용하세요."
                      );
                    } else {
                      throwError(
                        new Error("Gemini API request failed"),
                        "Gemini API 요청 실패",
                        null,
                        JSON.stringify(await geminiResponse.json()),
                        geminiResponse.status
                      );
                      return null;
                    }

                    return null;
                  } else {
                    if (!json) {
                      json = await geminiResponse.json();
                    }
                    const result =
                      json?.candidates?.[0]?.content?.parts?.[0]?.text || null;
                    if (!result) {
                      alert(
                        "Gemini API에서 빈 응답을 보냈습니다.\n잠시 후 다시 시도하거나, 자동 재시도 옵션을 사용하세요."
                      );
                    }
                    return result;
                  }
                } catch (n) {
                  console.error(n);
                  return null;
                }
              })(U, f, N);
            }
          } else {
            const n = await (async function (n, e, t) {
              const o = {
                model: n,
                models: [
                  "meta-llama/llama-4-scout:free",
                  "microsoft/mai-ds-r1:free",
                  "deepseek/deepseek-r1-zero:free",
                ],
                stream: !1,
                provider: {
                  order: ["google-ai-studio", "google-vertex", "chutes"],
                },
                messages: [{ role: "user", content: t }],
              };
              try {
                const t = await fetch(
                    "https://openrouter.ai/api/v1/chat/completions",
                    {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${e}`,
                        "HTTP-Referer": "https://chasm-js.github.io/",
                        "X-Title": "Chasm.js",
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(o),
                    }
                  ),
                  a = await t.json();
                return !t.ok || a.error
                  ? (throwError(
                      new Error("OpenRouter API request failed"),
                      "OpenRouter API 요청 실패",
                      o,
                      a
                    ),
                    null)
                  : {
                      text:
                        a.choices?.[0]?.message?.content ||
                        a.choices?.[0]?.text ||
                        null,
                      model: a.model || n,
                    };
              } catch (n) {
                return throwError(n, "OpenRouter API 요청 실패", o), null;
              }
            })(U, f, N);
            (j = n?.text),
              (q = n?.model || U),
              (T.value = `[${p()}] 사용된 모델: ${q}\n${T.value}`);
          }
          b(),
            (T.value = `[${p()}] ${
              $.charAt(0).toUpperCase() + $.slice(1)
            } 요청 완료 (소요 시간: ${Math.floor((Date.now() - s) / 1e3)}초)\n${
              T.value
            }`),
            j
              ? (function (a, r, l) {
                  n++;
                  const i = `cb-result-${n}`,
                    s = document.createElement("button");
                  (s.id = `cb-tab-result-${n}`),
                    (s.textContent = `결과 ${n}`),
                    (s.style.cssText = `padding: 8px 16px; border: none; background: ${o.tabInactiveBg}; color: ${o.tabInactiveText}; border-radius: 100px; cursor: pointer; display: flex; align-items: center;`),
                    safeAppend(document.getElementById("cb-tabs"), s);
                  const d = document.createElement("div");
                  (d.id = i),
                    (d.style.display = "block"),
                    (d.innerHTML = `\n                <textarea id="${i}-text" style="width: 100%; padding: 10px; border: 1px solid ${
                      o.borderColor
                    }; border-radius: 4px; height: 300px; resize: vertical; margin-bottom: 15px; background: ${
                      o.modalBg
                    }; color: ${
                      o.textColor
                    }; display: block;">${a}</textarea>\n                <div id="${i}-count" style="font-size: 0.9em; color: ${
                      o.textColor
                    }; margin-bottom: 4px; display: block;">글자 수: ${
                      a.length
                    } (최대 5000자, ${Math.ceil(
                      a.length / e
                    )}개 메시지 분할 전송)</div>\n                <div id="${i}-model-info" style="font-size: 0.8em; color: ${
                      o.textColor
                    }; margin-bottom: 16px; display: block;">[ ${
                      l === "vertexai"
                        ? "Google Vertex AI"
                        : l.charAt(0).toUpperCase() + l.slice(1)
                    } ] — ${r}</div>\n         
                         
                    <div id = "chasm-status-${n}" class = "chasm-burner-status"> 
                      <div style = "animation: 2s rotate linear infinite; margin-bottom: 4px; width: 12px; height: 12px; margin-right: 4px;"> ${SPINNER_SVG} </div> 
                      <span> HTML 유효성 확인중.. </span>
                    </div>
                    
                    
                    <div id="${i}-buttons" style="display: flex; gap: 10px; align-items: center;">\n 
                    <button id="${i}-send" style="padding: 10px 20px; background: ${
                      o.buttonBg
                    }; color: ${
                      o.buttonText
                    }; border: none; border-radius: 4px; cursor: pointer; display: block;">전송</button>\n 
                    <button id ="sandbox-html-${n}" class = "html-display-button" disabled="true" content-reference="${i}-text"> <span> HTML 표시 </span> </button>  
                                      <div id="${i}-status" style="font-size: 0.9em; color: ${
                      o.textColor
                    }; margin-left: 10px; display: none;"></div>\n                </div>\n            `),
                    safeAppend(document.getElementById("cb-tab-content"), d),
                    s.addEventListener("click", () => G(s, d));
                  const p = document.getElementById(`${i}-text`),
                    m = document.getElementById(`${i}-count`);
                  const statusElement = document.getElementById(
                    `chasm-status-${n}`
                  );
                  let responseText = p.value;
                  if (responseText.startsWith("```html")) {
                    responseText = responseText.substring(7);
                  }
                  if (responseText.endsWith("```")) {
                    responseText = responseText.substring(
                      0,
                      responseText.length - 3
                    );
                  }
                  if (statusElement) {
                    new Promise((resolve, reject) => {
                      try {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(
                          responseText,
                          "text/html"
                        );
                        if (doc.documentElement.querySelector("parsererror")) {
                          console.log(
                            doc.documentElement.querySelector("parsererror")
                          );
                          resolve(false);
                        } else {
                          resolve(true);
                        }
                      } catch (err) {
                        resolve(false);
                      }
                    })
                      .then((value) => {
                        if (value) {
                          const button = document.getElementById(
                            `sandbox-html-${n}`
                          );
                          if (button) {
                            statusElement.innerHTML = `<span style="color: green; margin-bottom: 4px;"> ✓ 유효한 HTML 응답입니다. </span>`;
                            button.addEventListener("click", () => {
                              // I'm a engineer, trust me!
                              const allowJS = confirm(
                                "버너 프롬프트로 가공된 HTML 코드는 자바스크립트 코드를 포함할 수 있습니다.\n결정화 캐즘 버너는 HTML에 포함된 스크립트를 사용할 수 있도록 구성되었으나, 이는 대단히 위험한 행위이며 결정화 캐즘 개발진은 코드 실행을 권장하지 않습니다.\n" +
                                  "자바스크립트 코드를 비활성화하면 표시된 HTML 문서에서 클릭으로 발동하는 액션이나 상호작용들이 비활성화될 수 있습니다. 단, 이는 CSS만으로 구성된 애니메이션에는 포함되지 않습니다.\n\n" +
                                  "자바스크립트 코드를 포함하여 HTML을 표시하시겠습니까?\n취소를 누를 경우, 샌드박스 모드로 실행되어 스크립트 실행을 막습니다."
                              );
                              const topDivision = document.createElement("div");
                              topDivision.id = "chasm-burner-html-preview";
                              topDivision.style.cssText =
                                "display: flex; flex-direction: column; align-items: center; z-index: 99999 !important; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: white; ";
                              const topBar = document.createElement("div");
                              topBar.style.cssText =
                                "display: flex; flex-direction: row; align-items: center; width: 100%; height: 32px; background-color: #333; border-bottom: 1px solid #555;";
                              const comment = document.createElement("span");
                              comment.style.cssText =
                                "font-size: 0.8em; color: #eee; margin-left: 24px;";
                              comment.textContent = allowJS
                                ? `C2 Burner+ ${VERSION} HTML Preview (Full Mode)`
                                : `C2 Burner+ ${VERSION} HTML Preview (Sandbox Mode)`;
                              topBar.append(comment);
                              const closer = document.createElement("div");
                              closer.innerHTML = CLOSE_SVG;
                              closer.style.cssText =
                                "width: fit-content; margin-left: auto; height: 16px; width: 16px; cursor: pointer; margin-right: 16px;";
                              closer.addEventListener("click", () => {
                                document
                                  .getElementById("chasm-burner-html-preview")
                                  .remove();
                              });
                              topBar.append(closer);
                              const newItem = document.createElement("iframe");
                              newItem.style.cssText =
                                "flex: 1 !important; width: 100% !important;";
                              if (!allowJS) {
                                newItem.setAttribute("sandbox", "");
                              }
                              newItem.setAttribute(
                                "srcdoc",
                                responseText.replace('"', "&quot;")
                              );
                              topDivision.append(topBar);
                              topDivision.append(newItem);
                              safeAppend(document.body, topDivision);
                            });
                            button.removeAttribute("disabled");
                          }
                        } else {
                          statusElement.innerHTML = `<span style="color: red; margin-bottom: 4px;"> 🛇 유효한 HTML이 아닙니다. HTML 표시가 비활성화됩니다. </span>`;
                        }
                      })
                      .catch((err) => {
                        statusElement.innerHTML = `<span style="color: red; margin-bottom: 4px;"> 🛇 처리 중 오류가 발생하여 HTML 전송을 사용할 수 없습니다.</span>`;
                      });
                  }
                  p.addEventListener(
                    "input",
                    c(() => {
                      m.textContent = `글자 수: ${
                        p.value.length
                      } (최대 5000자, ${Math.ceil(
                        p.value.length / e
                      )}개 메시지 분할 전송)`;
                    }, 200)
                  );
                  if (isCharacterPath()) {
                    document.getElementById(`${i}-send`).style.cssText =
                      document.getElementById(`${i}-send`).style.cssText + "; background-color: var(--text_textfield_disabled) !important; cursor: not-allowed !important;";

                    document.getElementById(`${i}-status`).innerHTML =
                      "<span style='color: red; font-size: 12px;' >✗ 결정화 캐즘 버너의 현재 버전에서는 캐릭터로의 메시지 전송을 지원하지 않습니다.</span>";
                    document.getElementById(`${i}-status`).classList.add("display-inline-important");
                  }
                  document
                    .getElementById(`${i}-send`)
                    .addEventListener("click", async () => {
                      if (isCharacterPath()) {
                        alert(
                          "결정화 캐즘의 현재 버전에서는 캐릭터로의 전송을 지원하지 않습니다."
                        );
                        return;
                      }
                      const n = document.getElementById(`${i}-status`);
                      n.style.display = "inline";
                      const o = (e, t = !1) => {
                        n.innerHTML = `${e}${
                          t ? '<span class="cb-spinner"></span>' : ""
                        }`;
                      };
                      o("유저 입력 보내는 중", true);
                      let a = p.value;
                      const r = new y(),
                        l = u();
                      if (location.hostname.includes("bubblechat.ai")) {
                        try {
                          o("입력창에 붙여넣는 중", true);
                          let a = p.value;
                          (t.prependText && (a = `${t.prependText}\n\n${a}`)),
                          (t.appendText && (a = `${a}\n\n${t.appendText}`));

                          const findInput = () => {
                            const candidates = [
                                'div[class^="ChatInput__STextarea"] textarea', // HTML 분석 기반 신규 선택자
                                "form textarea",
                                "textarea",
                                'div[contenteditable="true"]'
                            ];
                            for (const sel of candidates) {
                              const el = document.querySelector(sel);
                              if (el) return el;
                            }
                            return null;
                          };

                          const setValueAndNotify = (el, value) => {
                            if (!el) return;
                            if (el.tagName === "TEXTAREA") {
                                // React 호환성을 위한 네이티브 setter 호출
                                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
                                nativeInputValueSetter.call(el, value);
                                const ev = new Event('input', { bubbles: true });
                                el.dispatchEvent(ev);
                            } else if (el.getAttribute && el.getAttribute("contenteditable") === "true") {
                                el.focus();
                                el.textContent = value;
                                el.dispatchEvent(new Event("input", { bubbles: true }));
                            }
                          };

                          const input = findInput();
                          if (input) {
                            setValueAndNotify(input, a);
                            o("입력창에 메시지를 붙여넣었습니다. 직접 전송해주세요.");
                          } else {
                            o("입력창을 찾지 못했습니다.");
                            alert("bubblechat 입력창을 찾지 못해 붙여넣기에 실패했습니다.");
                          }
                          setTimeout(() => {
                              n.style.display = "none";
                          }, 5000);

                        } catch (err) {
                          o("붙여넣기 중 오류");
                          alert("bubblechat에 붙여넣는 중 오류가 발생했습니다.\n" + (err?.message || err));
                        }
                        return;
                      }
                      if (!l)
                        return (
                          o("잘못된 URL 구조"),
                          void alert("잘못된 URL 구조입니다.")
                        );
                      const s = await r.getChatroom(l.chatroomId);
                      if (!s)
                        return (
                          o("채팅방 가져오기 실패"),
                          void alert("채팅방을 불러오지 못했습니다.")
                        );
                      if (
                        (t.prependText && (a = `${t.prependText}\n\n${a}`),
                        t.appendText && (a = `${a}\n\n${t.appendText}`),
                        a.length > e)
                      ) {
                        if (
                          !confirm(
                            "요약 내용이 너무 깁니다. 제한은 최대 1회 요약값이지만, 실질적으로는 3천자 내외로 요약하는 것이 제일 좋습니다. 무시하고 나눠서 분할 전송하시겠습니까?"
                          )
                        )
                          return (
                            o("전송 취소"), void (n.style.display = "none")
                          );
                        const r = [];
                        for (let n = 0; n < a.length; n += e)
                          r.push(a.slice(n, n + e));
                        for (let n = 0; n < r.length; n++) {
                          o(`유저 입력 보내는 중 (${n + 1}/${r.length})`, !0);
                          const e = await s.send(t.userMessage, !1);
                          if (
                            (o(`응답 수정 시작 (${n + 1}/${r.length})`, !0),
                            !(await e.set(r[n])))
                          )
                            return (
                              o(`응답 수정 실패 (${n + 1}/${r.length})`),
                              void alert("메시지 전송에 실패했습니다.")
                            );
                        }
                        o("응답 수정 완료");
                      } else {
                        o("유저 입력 보내는 중", !0);
                        const n = await s.send(t.userMessage, !1);
                        if ((o("응답 수정 시작", !0), !(await n.set(a))))
                          return (
                            o("응답 수정 실패"),
                            void alert("메시지 전송에 실패했습니다.")
                          );
                        o("응답 수정 완료");
                      }
                      confirm(
                        "전송이 완료되었습니다! 페이지를 새로고침하시겠습니까?"
                      )
                        ? location.reload()
                        : (n.style.display = "none");
                    });
                  G(s, d);
                })(j, q, $)
              : ((T.value = `[${p()}] ${
                  $.charAt(0).toUpperCase() + $.slice(1)
                } API 응답: ${JSON.stringify(j, null, 2)}\n${T.value}`),
                alert(
                  `${
                    $.charAt(0).toUpperCase() + $.slice(1)
                  } API 처리에 실패했습니다.`
                ));
        } catch (n) {
          (T.value = `[${p()}] 오류 발생: ${n.message || n}\n${T.value}`),
            r && clearInterval(r),
            l && clearInterval(l),
            (I.textContent = "00:00"),
            (A.disabled = !1),
            (A.textContent = "시작"),
            throwError(n, "버너 실행 중 오류");
        }
      }),
      j.addEventListener("click", () => s.remove());
  }
  // 추가: 안전한 append 도우미 (parent와 child 유효성 검사 및 예외 처리)
  function safeAppend(parent, child) {
    try {
      if (!parent || !(parent instanceof Node)) {
        console.warn("safeAppend: 유효하지 않은 parent:", parent);
        return false;
      }
      if (!child || !(child instanceof Node)) {
        console.warn("safeAppend: 유효하지 않은 child:", child);
        return false;
      }
      parent.appendChild(child);
      return true;
    } catch (err) {
      console.error("safeAppend 오류:", err, { parent, child });
      return false;
    }
  }
  function addFloatingButton() {
    if (document.getElementById('chasm-floating-burner-button')) {
        return;
    }

    const floatingButton = document.createElement('button');
    floatingButton.id = 'chasm-floating-burner-button';
    floatingButton.className = 'chasm-floating-button';
    floatingButton.innerHTML = '🔥';
    floatingButton.addEventListener('click', C);

    document.body.appendChild(floatingButton);
  }

  async function B() {
    addFloatingButton();
  }
  function isStoryPath() {
    // 2025-09-17 Path
    return (
      /\/stories\/[a-f0-9]+\/episodes\/[a-f0-9]+/.test(location.pathname) ||
      // Legacy Path
      /\/u\/[a-f0-9]+\/c\/[a-f0-9]+/.test(location.pathname)
    );
  }
  function isCharacterPath() {
    return /\/characters\/[a-f0-9]+\/chats\/[a-f0-9]+/.test(location.pathname);
  }
  "loading" === document.readyState
    ? (document.addEventListener("DOMContentLoaded", B),
      window.addEventListener("load", B))
    : "interactive" === document.readyState ||
      "complete" === document.readyState
    ? await B()
    : setTimeout(B, 100);
})();
