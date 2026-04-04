import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── Configuration ────────────────────────────────────────────────────────────
// Create React App only exposes environment variables that are prefixed with
// REACT_APP_ to client-side code. Both variables must be defined in .env.
const API_BASE_URL = process.env.REACT_APP_CHATBOT_API_URL;
const API_STAGE    = process.env.REACT_APP_CHATBOT_ENV;
const API_ENDPOINT = `${API_BASE_URL}/${API_STAGE}/chat`;

const CONTACT_EMAIL = 'triet.truongminh211@gmail.com';

// Suggested prompts shown as clickable chips before the first message is sent
const STARTER_MESSAGES = [
  "What is Triet's experience?",
  "What are his main skills?",
  'Has he worked with Shopify?',
  'What AWS projects has he built?',
  'Can Triet work in Australia?',
];

// ─── Markdown renderer ────────────────────────────────────────────────────────
// Handles a subset of Markdown: **bold**, *italic*, [link text](url), and newlines.
// This avoids adding an external library for a small formatting requirement.
function renderMarkdown(text) {
  if (!text) return null;

  return text.split('\n').map((line, lineIndex, allLines) => {
    const renderedParts = [];

    // Matches **bold**, *italic*, and [link text](url) in a single pass
    const markdownPattern = /(\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))/g;
    let cursor = 0;
    let match;

    while ((match = markdownPattern.exec(line)) !== null) {
      // Append any plain text that appeared before this match
      if (match.index > cursor) {
        renderedParts.push(line.slice(cursor, match.index));
      }

      if (match[2] !== undefined) {
        // **bold** syntax
        renderedParts.push(<strong key={match.index}>{match[2]}</strong>);
      } else if (match[3] !== undefined) {
        // *italic* syntax
        renderedParts.push(<em key={match.index}>{match[3]}</em>);
      } else if (match[4] !== undefined) {
        // [link text](url) syntax
        renderedParts.push(
          <a
            key={match.index}
            href={match[5]}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#13adc7', textDecoration: 'underline' }}
          >
            {match[4]}
          </a>
        );
      }

      cursor = markdownPattern.lastIndex;
    }

    // Append any remaining plain text after the last match
    if (cursor < line.length) {
      renderedParts.push(line.slice(cursor));
    }

    return (
      <React.Fragment key={lineIndex}>
        {renderedParts}
        {/* Add a line break between lines, but not after the last one */}
        {lineIndex < allLines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
// Displays the bot's initials "TC" (Triet's Chatbot) in a teal circle.
function Avatar({ size = 28 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: '#13adc7',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size === 28 ? 9 : 12,
        fontWeight: 700,
        flexShrink: 0,
        letterSpacing: '0.5px',
        userSelect: 'none',
      }}
    >
      TC
    </div>
  );
}

// ─── TypingIndicator ─────────────────────────────────────────────────────────
// Three bouncing dots shown while waiting for the API response.
// The animation (.chat-widget__dot keyframes) is defined in App.scss.
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', gap: 8 }}>
      <Avatar />
      <div style={{ backgroundColor: '#252525', borderRadius: '4px 16px 16px 16px', padding: '12px 16px' }}>
        <span className="chat-widget__dot" style={{ animationDelay: '0ms' }} />
        <span className="chat-widget__dot" style={{ animationDelay: '160ms' }} />
        <span className="chat-widget__dot" style={{ animationDelay: '320ms' }} />
      </div>
    </div>
  );
}

// ─── ChatWidget ───────────────────────────────────────────────────────────────
// A floating chat panel that lets visitors ask questions about Triet's
// professional background. Messages are sent to AWS API Gateway → Lambda → Bedrock.
export default function ChatWidget() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [messages,    setMessages]    = useState([]);
  const [inputValue,  setInputValue]  = useState('');
  const [isLoading,   setIsLoading]   = useState(false);

  // sessionId is generated once per page load and reused for the entire session
  // so the Lambda function can maintain conversation context on the backend.
  const sessionIdRef   = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  // Generate a unique session ID when the component first mounts
  useEffect(() => {
    sessionIdRef.current = crypto.randomUUID();
  }, []);

  // Scroll to the bottom of the message list whenever a new message arrives
  // or when the typing indicator appears / disappears
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Move keyboard focus to the text input whenever the chat panel is opened
  useEffect(() => {
    if (isPanelOpen) inputRef.current?.focus();
  }, [isPanelOpen]);

  const sendMessage = useCallback(
    async (text) => {
      const trimmedText = text.trim();

      // Guard: do nothing if the message is blank or a request is already in-flight
      if (!trimmedText || isLoading) return;

      // Optimistically add the user's message to the conversation immediately
      setMessages((previousMessages) => [
        ...previousMessages,
        { role: 'user', content: trimmedText },
      ]);
      setInputValue('');
      setIsLoading(true);

      try {
        const apiResponse = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmedText, sessionId: sessionIdRef.current }),
        });

        if (!apiResponse.ok) throw new Error(`HTTP ${apiResponse.status}`);

        const responseData = await apiResponse.json();
        setMessages((previousMessages) => [
          ...previousMessages,
          {
            role: 'bot',
            content: responseData.response,
            // When true, the Lambda has determined a human follow-up is warranted
            flagForHuman: responseData.flagForHuman === true,
          },
        ]);
      } catch {
        setMessages((previousMessages) => [
          ...previousMessages,
          {
            role: 'bot',
            content: 'Sorry, something went wrong. Please try again.',
            isError: true,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  const handleFormSubmit = (event) => {
    event.preventDefault();
    sendMessage(inputValue);
  };

  return (
    // The outer wrapper is fixed to the bottom-right corner of the viewport.
    // The flex-column layout naturally stacks the panel above the floating button.
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 12,
        fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* ── Chat panel ─────────────────────────────────────────────────────── */}
      {isPanelOpen && (
          <div
            className="chat-widget__panel"
            role="dialog"
            aria-label="Chat with Triet's Assistant"
            style={{
              width: 380,
              height: 520,
              backgroundColor: '#1a1a1a',
              borderRadius: 16,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 8px 40px rgba(0,0,0,0.65)',
              border: '1px solid rgba(255,255,255,0.07)',
              overflow: 'hidden',
            }}
          >
          {/* ── Panel header ──────────────────────────────────────────────── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 16px',
              backgroundColor: '#111',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              flexShrink: 0,
            }}
          >
            <Avatar size={36} />
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>Triet's Assistant</div>
              <div style={{ color: '#6b7688', fontSize: 12, marginTop: 2 }}>Ask me anything</div>
            </div>
            <button
              className="chat-widget__close-button"
              onClick={() => setIsPanelOpen(false)}
              aria-label="Close chat"
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7688',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4,
                transition: 'color 0.15s',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6"  x2="6"  y2="18" />
                <line x1="6"  y1="6"  x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* ── Message list ──────────────────────────────────────────────── */}
          <div
            className="chat-widget__messages"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {/* Starter chips — visible before the first message is sent */}
            {messages.length === 0 && (
              <>
                <p style={{ color: '#7a8494', fontSize: 13, lineHeight: 1.55, textAlign: 'center', padding: '4px 0 8px' }}>
                  Hi! I can answer questions about Triet's professional background and experience.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {STARTER_MESSAGES.map((starterMessage) => (
                    <button
                      key={starterMessage}
                      className="chat-widget__chip"
                      disabled={isLoading}
                      onClick={() => sendMessage(starterMessage)}
                        style={{
                          backgroundColor: '#252525',
                          color: '#c9d1dc',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 20,
                          padding: '7px 13px',
                          fontSize: 12,
                          cursor: 'pointer',
                          textAlign: 'left',
                          lineHeight: 1.4,
                          transition: 'background-color 0.15s, border-color 0.15s, color 0.15s',
                        }}
                      >
                        {starterMessage}
                      </button>
                  ))}
                </div>
              </>
            )}
            {/* Conversation messages */}
            {messages.map((message, index) =>
              message.role === 'user' ? (
                // User messages — right-aligned teal bubble
                <div key={index} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div
                    style={{
                      maxWidth: '72%',
                      backgroundColor: '#13adc7',
                      color: '#fff',
                      borderRadius: '16px 16px 4px 16px',
                      padding: '10px 14px',
                      fontSize: 14,
                      lineHeight: 1.5,
                      wordBreak: 'break-word',
                    }}
                  >
                    {message.content}
                  </div>
                </div>
              ) : (
                // Bot messages — left-aligned dark bubble with avatar
                <div key={index} style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', gap: 8 }}>
                  <Avatar />
                  <div
                    style={{
                      maxWidth: '78%',
                      backgroundColor: '#252525',
                      color: '#d1d5db',
                      borderRadius: '4px 16px 16px 16px',
                      padding: '10px 14px',
                      fontSize: 14,
                      lineHeight: 1.5,
                      wordBreak: 'break-word',
                    }}
                  >
                    <div>{renderMarkdown(message.content)}</div>

                    {/* Human follow-up suggestion — shown when the backend sets flagForHuman: true */}
                    {message.flagForHuman && (
                      <div
                        style={{
                          marginTop: 10,
                          paddingTop: 10,
                          borderTop: '1px solid rgba(255,255,255,0.08)',
                          fontSize: 12,
                          color: '#f5a623',
                        }}
                      >
                        For this query, you may want to contact Triet directly at{' '}
                        <a
                          href={`mailto:${CONTACT_EMAIL}`}
                          style={{ color: '#13adc7', textDecoration: 'underline' }}
                        >
                          {CONTACT_EMAIL}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {/* Typing indicator — shown while waiting for the API to respond */}
            {isLoading && <TypingIndicator />}

            {/* Invisible anchor element — scrolled into view after each message */}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Input area ────────────────────────────────────────────────── */}
          <form
            onSubmit={handleFormSubmit}
            style={{
              display: 'flex',
              gap: 8,
              padding: '12px 14px',
              borderTop: '1px solid rgba(255,255,255,0.07)',
              backgroundColor: '#111',
              flexShrink: 0,
              alignItems: 'center',
            }}
          >
            <input
              ref={inputRef}
              className="chat-widget__input"
              type="text"
              placeholder="Type a message…"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              disabled={isLoading}
              aria-label="Type a message"
              style={{
                flex: 1,
                backgroundColor: '#252525',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 24,
                color: '#fff',
                fontSize: 14,
                padding: '9px 16px',
                outline: 'none',
                minWidth: 0,
                transition: 'border-color 0.15s',
              }}
            />
            <button
              type="submit"
              className="chat-widget__send-button"
              disabled={isLoading || !inputValue.trim()}
              aria-label="Send message"
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                backgroundColor: '#13adc7',
                color: '#fff',
                border: 'none',
                cursor: isLoading || !inputValue.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                opacity: isLoading || !inputValue.trim() ? 0.35 : 1,
                transition: 'opacity 0.15s, background-color 0.15s',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* ── Floating action button ───────────────────────────────────────────── */}
      {/* Clicking this button toggles the chat panel open and closed */}
      <button
        className="chat-widget__toggle-button"
        onClick={() => setIsPanelOpen((isCurrentlyOpen) => !isCurrentlyOpen)}
        aria-label={isPanelOpen ? 'Close chat' : 'Open chat'}
        aria-expanded={isPanelOpen}
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: '#1e2a38',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
          transition: 'transform 0.15s, box-shadow 0.15s',
          flexShrink: 0,
        }}
      >
        {isPanelOpen ? (
          // X icon — shown when the panel is open
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6"  x2="6"  y2="18" />
            <line x1="6"  y1="6"  x2="18" y2="18" />
          </svg>
        ) : (
          // Chat bubble icon — shown when the panel is closed
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </div>
  );
}
