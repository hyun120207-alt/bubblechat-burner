// ==UserScript==
// @name         버블챗 플로팅 툴 (All Text & Mobile HTML) - Refined
// @namespace    http://tampermonkey.net/
// @version      5.1
// @description  업로드된 로직을 참고하여 모든 텍스트(대사, 지문, 시스템) 추출, 모바일 최적화 HTML 저장, 맨 위로 스크롤 기능을 제공합니다.
// @author       Combined & Refined
// @match        https://bubblechat.ai/*
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/marked@4.3.0/marked.min.js
// ==/UserScript==

(function() {
    'use strict';

    // ============================================================================
    // [1] 설정 & 유틸리티
    // ============================================================================
    const CONFIG = {
        storageKey: 'bubble_chat_last_turn_count',
        saveOrderKey: 'bubble_chat_save_order',
        defaultTurnCount: 100,
    };

    const utils = {
        formatDate(date) {
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            const hh = String(date.getHours()).padStart(2, '0');
            const min = String(date.getMinutes()).padStart(2, '0');
            const ss = String(date.getSeconds()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}`;
        },
        async copyToClipboard(text, statusEl, successMsg) {
            try {
                await navigator.clipboard.writeText(text);
                this.updateStatus(statusEl, successMsg + ' (클립보드 복사됨)', 'success');
            } catch (err) {
                // 보안 정책으로 실패 시 fallback
                const textArea = document.createElement("textarea");
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    this.updateStatus(statusEl, successMsg + ' (클립보드 복사됨)', 'success');
                } catch (fallbackErr) {
                    this.updateStatus(statusEl, successMsg + ' (파일만 저장됨, 복사 실패)', 'success');
                }
                document.body.removeChild(textArea);
            }
        },
        downloadFile(content, fileName, mimeType) {
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },
        updateStatus(element, message, type) {
            element.textContent = message;
            element.className = 'status-message ' + type;
            element.style.display = 'block';
            setTimeout(() => { element.style.display = 'none'; }, 3000);
        }
    };

    // ============================================================================
    // [2] 핵심 기능 로직 (스크롤 & 파서 재점검)
    // ============================================================================

    const parser = {
        // 경로 기반 모드 감지 (업로드된 파일 로직 참고)
        detectMode() {
            const path = window.location.pathname;
            if (/\/stories\/[a-f0-9]+\/episodes\/[a-f0-9]+/.test(path)) return 'story'; // 소설/에피소드 모드
            if (/\/characters\/[a-f0-9]+\/chats\/[a-f0-9]+/.test(path)) return 'chat';  // 일반 채팅 모드
            return 'unknown';
        },

        getMessages(limitVal) {
            const messagesLimit = parseInt(limitVal) || 50;
            let rawMessages = [];
            
            // 1. 가장 확실한 채팅 리스트 컨테이너 찾기
            // "ChatListContainer" 혹은 "MessageList" 등으로 시작하는 클래스 탐색
            let listContainer = document.querySelector('[class*="ChatListContainer"], [class*="MessageList"]');
            
            // 컨테이너를 찾았다면 그 직계 자식(개별 메시지 행)을 순회
            let messageNodes = [];
            if (listContainer) {
                messageNodes = Array.from(listContainer.children);
            } else {
                // 컨테이너를 못 찾은 경우(소설 모드 등), 메시지처럼 보이는 모든 블록 수집
                messageNodes = Array.from(document.querySelectorAll('[class*="MessageItem"], [class*="Message__SContainer"], .novel-mode p, .novel-mode div'));
            }

            // 메시지 파싱
            rawMessages = messageNodes.map(node => {
                // 텍스트가 없는 빈 노드(로딩바 등) 제외
                if (!node.innerText || node.innerText.trim() === '') return null;

                let role = "Bot"; // 기본값
                let rawHtml = "";
                let text = node.innerText.trim();

                // (A) 역할 판별 로직 (재점검됨)
                // 1. 클래스에 'my-message'나 'User'가 포함되어 있는가?
                if (node.className && (node.className.includes('my-message') || node.className.includes('User'))) {
                    role = "User";
                }
                // 2. CSS 스타일이 우측 정렬(flex-end)인가?
                else {
                    const style = window.getComputedStyle(node);
                    // Flex 컨테이너의 아이템 정렬 확인
                    if (style.alignSelf === 'flex-end' || style.justifyContent === 'flex-end' || style.marginLeft === 'auto') {
                        role = "User";
                    }
                    // 부모가 flex이고 row-reverse거나 justify-end인 경우 확인
                    else if (node.parentElement) {
                        const parentStyle = window.getComputedStyle(node.parentElement);
                        if (parentStyle.display === 'flex' && (parentStyle.justifyContent === 'flex-end' || parentStyle.flexDirection === 'row-reverse')) {
                            role = "User";
                        }
                    }
                }

                // (B) 텍스트 추출 로직
                // node 안에 실제 마크다운 렌더러가 있는지 확인 (더 깔끔한 HTML을 위해)
                const markdownContent = node.querySelector('.react-markdown, [class*="MarkdownRenderer"]');
                if (markdownContent) {
                    rawHtml = markdownContent.innerHTML;
                } else {
                    // 마크다운 컨테이너가 없으면(시스템 메시지 등) 노드 전체 HTML 사용
                    // 불필요한 버튼/아이콘 제거 (필요시 추가)
                    const clone = node.cloneNode(true);
                    const buttons = clone.querySelectorAll('button, svg');
                    buttons.forEach(btn => btn.remove());
                    rawHtml = clone.innerHTML;
                }

                // (C) 시스템 메시지/내레이션 판별 (소설 모드 등)
                // 보통 시스템 메시지는 가운데 정렬이거나, 특정 클래스가 없거나, 텍스트가 옅은 색임
                // 여기서는 간단히 Bot/User 판단이 애매하고 텍스트 길이가 짧거나 포맷이 다르면 System으로 분류 가능
                // 현재는 안전하게 Bot으로 두되, User가 아니면 전부 Bot(Character/System)으로 처리

                return { role, text, rawHtml };
            }).filter(msg => msg !== null); // null 제거

            if (rawMessages.length === 0) throw new Error("메시지를 찾을 수 없습니다. 페이지가 로딩되었는지 확인하세요.");

            // 개수 제한 및 역순 처리(최신순 정렬일 경우를 대비해 슬라이싱 위치 조정)
            // 보통 DOM 순서는 과거 -> 최신임.
            const sliceStart = Math.max(0, rawMessages.length - messagesLimit);
            return rawMessages.slice(sliceStart);
        }
    };

    const contentGenerator = {
        generateHtml(messages, title) {
            // 모바일 최적화 CSS (카톡/아이메시지 스타일)
            const css = `
                :root {
                    --bg-color: #abc1d1; /* 카카오톡 기본 배경색 느낌 */
                    --user-bg: #fef01b; /* 카카오톡 노란색 */
                    --bot-bg: #ffffff;
                    --text-color: #000000;
                    --date-color: #556677;
                }
                body { 
                    font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
                    background-color: var(--bg-color);
                    margin: 0; padding: 0;
                    -webkit-text-size-adjust: 100%;
                }
                .header {
                    background: rgba(255,255,255,0.95);
                    padding: 12px 16px;
                    text-align: center;
                    font-weight: bold;
                    border-bottom: 1px solid rgba(0,0,0,0.1);
                    position: sticky; top: 0; z-index: 100;
                    backdrop-filter: blur(5px);
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                }
                .chat-container { 
                    display: flex; flex-direction: column; 
                    gap: 8px; padding: 16px;
                    max-width: 600px; margin: 0 auto;
                }
                .message-row {
                    display: flex;
                    flex-direction: column;
                    max-width: 80%;
                    position: relative;
                }
                .message-row.user {
                    align-self: flex-end;
                    align-items: flex-end;
                }
                .message-row.bot {
                    align-self: flex-start;
                    align-items: flex-start;
                }
                .sender-name {
                    font-size: 11px; color: var(--date-color);
                    margin-bottom: 4px; margin-left: 4px;
                }
                .message-row.user .sender-name { display: none; }
                
                .bubble {
                    padding: 8px 12px;
                    border-radius: 12px;
                    font-size: 15px;
                    line-height: 1.5;
                    word-break: break-word;
                    box-shadow: 0 1px 1px rgba(0,0,0,0.1);
                    position: relative;
                }
                .message-row.user .bubble {
                    background-color: var(--user-bg);
                    color: var(--text-color);
                    border-top-right-radius: 2px;
                }
                .message-row.bot .bubble {
                    background-color: var(--bot-bg);
                    color: var(--text-color);
                    border-top-left-radius: 2px;
                }
                
                /* 이미지 및 마크다운 스타일 리셋 */
                .bubble img { max-width: 100%; border-radius: 8px; height: auto; }
                .bubble p { margin: 0; padding: 0; }
                .bubble blockquote { border-left: 3px solid #ccc; margin: 4px 0; padding-left: 8px; color: #666; }
                
                /* 모바일 뷰포트 대응 */
                @media (max-width: 480px) {
                    .chat-container { padding: 10px; }
                    .bubble { font-size: 14px; }
                }
            `;

            let html = `
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>${title}</title>
<style>${css}</style>
</head>
<body>
<div class="header">${title}</div>
<div class="chat-container">
`;
            messages.forEach(msg => {
                const roleClass = (msg.role === 'User' || msg.role === 'user') ? 'user' : 'bot';
                html += `
                <div class="message-row ${roleClass}">
                    <div class="sender-name">${msg.role}</div>
                    <div class="bubble">${msg.rawHtml}</div>
                </div>`;
            });

            return html + `</div></body></html>`;
        },
        generateTxt(messages) { return messages.map(msg => `[${msg.role}]\n${msg.text}`).join('\n\n'); },
        generateJson(messages) { return JSON.stringify(messages, null, 2); }
    };

    // ============================================================================
    // [3] 통합 UI
    // ============================================================================
    const ui = {
        init() {
            this.addStyles();
            this.createDraggableTool();
            this.createDownloadPopup();
        },
        addStyles() {
            const css = `
                /* UI 스타일 - 충돌 방지를 위해 id 셀렉터 위주 사용 */
                #bc-tool-container {
                    position: fixed; top: 120px; left: 20px; z-index: 999999;
                    display: flex; flex-direction: column; align-items: center; gap: 10px;
                }
                .bc-fab {
                    width: 48px; height: 48px;
                    border-radius: 0; /* 원형 제거 */
                    clip-path: polygon(50% 0%, 95% 25%, 100% 70%, 75% 100%, 20% 100%, 0% 60%, 15% 20%); /* 제멋대로 다각형 */
                    border: none;
                    cursor: pointer; display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    font-size: 22px; transition: transform 0.2s, opacity 0.2s;
                    user-select: none; background: white;
                }
                .bc-fab:active { transform: scale(0.92); }
                
                #bc-main-btn { background-color: #3b82f6; color: white; z-index: 2; }
                #bc-main-btn:hover { background-color: #2563eb; }
                
                #bc-sub-menu {
                    display: flex; flex-direction: column; gap: 8px;
                    opacity: 0; transform: translateY(-10px); visibility: hidden;
                    transition: all 0.25s ease;
                    position: absolute; top: 55px;
                }
                #bc-tool-container.expanded #bc-sub-menu {
                    opacity: 1; transform: translateY(0); visibility: visible;
                }
                
                .bc-sub-btn { width: 40px; height: 40px; font-size: 18px; }
                #bc-btn-download { background-color: #10b981; color: white; }
                #bc-btn-scroll { background-color: #f59e0b; color: white; }
                
                /* 팝업 창 */
                #crack-downloader-popup {
                    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                    width: 320px; background: white; border-radius: 16px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.2); padding: 24px;
                    z-index: 1000000; font-family: -apple-system, sans-serif;
                    border: 1px solid rgba(0,0,0,0.1);
                }
                .popup-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #f3f4f6; padding-bottom: 12px; }
                .popup-header strong { font-size: 1.1rem; color: #1f2937; }
                .setting-group { margin-bottom: 16px; display: flex; flex-direction: column; gap: 6px; }
                .setting-group label { font-size: 0.9rem; color: #4b5563; font-weight: 500; }
                .setting-input { 
                    width: 100%; padding: 10px; border: 1px solid #d1d5db; 
                    border-radius: 8px; font-size: 1rem; box-sizing: border-box;
                }
                .radio-group { display: flex; gap: 15px; }
                .radio-group label { display: flex; align-items: center; gap: 4px; font-weight: normal; cursor: pointer; }
                
                .button-group { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-top: 20px; }
                .format-btn { 
                    padding: 10px; border: 1px solid #e5e7eb; background: #f9fafb; 
                    border-radius: 8px; cursor: pointer; font-weight: 600; color: #374151;
                    transition: background 0.2s;
                }
                .format-btn:hover { background: #f3f4f6; }
                
                .status-message { margin-top: 12px; padding: 10px; border-radius: 8px; font-size: 0.9rem; display: none; text-align: center; }
                .status-message.success { background-color: #ecfdf5; color: #047857; }
                .status-message.error { background-color: #fef2f2; color: #b91c1c; }
                .hidden { display: none !important; }
            `;
            const style = document.createElement('style');
            style.textContent = css;
            document.head.appendChild(style);
        },
        createDraggableTool() {
            const container = document.createElement('div');
            container.id = 'bc-tool-container';
            
            const mainBtn = document.createElement('button');
            mainBtn.id = 'bc-main-btn';
            mainBtn.className = 'bc-fab';
            mainBtn.innerHTML = '⚡'; // 아이콘 변경
            mainBtn.title = '드래그 이동 / 클릭 확장';

            const subMenu = document.createElement('div');
            subMenu.id = 'bc-sub-menu';

            const dlBtn = document.createElement('button');
            dlBtn.id = 'bc-btn-download';
            dlBtn.className = 'bc-fab bc-sub-btn';
            dlBtn.innerHTML = '💾';
            dlBtn.title = '대화 저장';
            dlBtn.onclick = (e) => {
                e.stopPropagation();
                this.togglePopup();
                container.classList.remove('expanded');
            };

            subMenu.appendChild(dlBtn);

            const scrollBtn = document.createElement('button');
            scrollBtn.id = 'bc-btn-scroll';
            scrollBtn.className = 'bc-fab bc-sub-btn';
            scrollBtn.innerHTML = '↑';
            scrollBtn.title = '맨 위로 스크롤';
            scrollBtn.onclick = () => {
                // 메인 윈도우 스크롤
                window.scrollTo({ top: 0, behavior: 'smooth' });

                // 채팅창 등 내부 스크롤 영역 감지하여 스크롤
                const scrollableElements = document.querySelectorAll('*');
                scrollableElements.forEach(el => {
                    if (el.scrollTop > 0) {
                        el.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                });
            };
            subMenu.appendChild(scrollBtn);
            
            container.appendChild(mainBtn);
            container.appendChild(subMenu);
            document.body.appendChild(container);

            // 드래그 로직
            let isDragging = false;
            let startX, startY, initialLeft, initialTop;

            mainBtn.addEventListener('mousedown', (e) => {
                isDragging = false;
                startX = e.clientX;
                startY = e.clientY;
                const rect = container.getBoundingClientRect();
                initialLeft = rect.left;
                initialTop = rect.top;

                const onMouseMove = (moveEvent) => {
                    const dx = moveEvent.clientX - startX;
                    const dy = moveEvent.clientY - startY;
                    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                        isDragging = true;
                        container.style.left = `${initialLeft + dx}px`;
                        container.style.top = `${initialTop + dy}px`;
                        container.classList.remove('expanded');
                    }
                };
                const onMouseUp = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                    if (!isDragging) container.classList.toggle('expanded');
                };
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        },
        createDownloadPopup() {
            const popup = document.createElement('div');
            popup.id = 'crack-downloader-popup';
            popup.className = 'hidden';

            const lastCount = localStorage.getItem(CONFIG.storageKey) || CONFIG.defaultTurnCount;
            const saveOrder = localStorage.getItem(CONFIG.saveOrderKey) || 'newest';

            popup.innerHTML = `
                <div class="popup-header">
                    <strong>대화 내보내기</strong>
                    <span style="cursor:pointer; font-size:1.5rem; color:#9ca3af;" onclick="document.getElementById('crack-downloader-popup').classList.add('hidden')">&times;</span>
                </div>
                <div class="setting-group">
                    <label>추출할 메시지 수</label>
                    <input type="number" id="turn-count" class="setting-input" value="${lastCount}" min="1" placeholder="예: 100">
                </div>
                <div class="setting-group">
                    <label>저장 순서</label>
                    <div class="radio-group">
                        <label><input type="radio" name="save-order" value="oldest" ${saveOrder === 'oldest' ? 'checked' : ''}> 과거부터 (정주행)</label>
                        <label><input type="radio" name="save-order" value="newest" ${saveOrder === 'newest' ? 'checked' : ''}> 최신부터</label>
                    </div>
                </div>
                <div class="setting-group" style="flex-direction:row; align-items:center;">
                     <input type="checkbox" id="copy-to-clipboard" style="width:auto; margin-right:8px;">
                     <label for="copy-to-clipboard" style="margin:0; cursor:pointer;">클립보드에 텍스트 복사</label>
                </div>
                <div class="button-group">
                    <button class="format-btn" data-format="html">HTML (모바일)</button>
                    <button class="format-btn" data-format="txt">TXT (텍스트)</button>
                    <button class="format-btn" data-format="json">JSON (백업)</button>
                </div>
                <div class="status-message"></div>
            `;
            document.body.appendChild(popup);

            popup.querySelectorAll('.format-btn').forEach(btn => {
                btn.onclick = () => this.processDownload(btn.dataset.format);
            });
        },
        togglePopup() {
            document.getElementById('crack-downloader-popup').classList.toggle('hidden');
        },
        async processDownload(format) {
            const popup = document.getElementById('crack-downloader-popup');
            const statusEl = popup.querySelector('.status-message');
            const turnCount = parseInt(popup.querySelector('#turn-count').value, 10);
            const saveOrder = popup.querySelector('input[name="save-order"]:checked').value;
            const shouldCopy = popup.querySelector('#copy-to-clipboard').checked;

            if (!turnCount || turnCount < 1) return utils.updateStatus(statusEl, '숫자를 확인해주세요.', 'error');
            utils.updateStatus(statusEl, '데이터 추출 중...', 'success');

            try {
                // 파서 호출
                let messages = parser.getMessages(turnCount);
                
                // 순서 처리 (DOM은 보통 과거->최신(아래) 순서로 쌓임)
                // 유저가 "최신부터"를 원하면 뒤집고, "과거부터"를 원하면 그대로 둠.
                // 단, getMessages에서 slice를 뒤에서부터 했으므로 기본은 최신 데이터들임.
                if (saveOrder === 'newest') {
                    messages.reverse(); // 최신이 위로 오게
                }

                const title = `BubbleChat_Log_${utils.formatDate(new Date())}`;
                const fileName = `${title}.${format}`;
                let fileContent = '', clipboardContent = '';

                switch (format) {
                    case 'html':
                        fileContent = contentGenerator.generateHtml(messages, title);
                        clipboardContent = messages.map(m => `[${m.role}] ${m.text}`).join('\n\n');
                        break;
                    case 'txt':
                        fileContent = contentGenerator.generateTxt(messages);
                        clipboardContent = fileContent;
                        break;
                    case 'json':
                        fileContent = contentGenerator.generateJson(messages);
                        clipboardContent = fileContent;
                        break;
                }

                utils.downloadFile(fileContent, fileName, {
                    html: 'text/html;charset=utf-8',
                    txt: 'text/plain;charset=utf-8',
                    json: 'application/json;charset=utf-8'
                }[format]);

                // 설정 저장
                localStorage.setItem(CONFIG.storageKey, turnCount);
                localStorage.setItem(CONFIG.saveOrderKey, saveOrder);

                const msg = `성공! 총 ${messages.length}개 저장됨.`;
                if (shouldCopy) await utils.copyToClipboard(clipboardContent, statusEl, msg);
                else utils.updateStatus(statusEl, msg, 'success');

            } catch (error) {
                console.error(error);
                utils.updateStatus(statusEl, `오류 발생: ${error.message}`, 'error');
            }
        }
    };

    // 실행
    ui.init();
})();
