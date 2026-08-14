'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, ExternalLink, Bot, CheckCheck } from 'lucide-react';
import styles from './WhatsAppBotWidget.module.css';
import { processWhatsAppBotMessage, BotResponse } from '@/lib/whatsappBot';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  options?: Array<{ id: string; text: string }>;
  actionLink?: string;
  timestamp: string;
}

export default function WhatsAppBotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize bot greeting
  useEffect(() => {
    const initialRes = processWhatsAppBotMessage('hi');
    setMessages([
      {
        id: 'msg-init',
        sender: 'bot',
        text: initialRes.replyText,
        options: initialRes.options,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // User message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: timeStr,
    };

    // Process Bot reply
    const botRes: BotResponse = processWhatsAppBotMessage(text);
    const botMsg: ChatMessage = {
      id: `bot-${Date.now() + 1}`,
      sender: 'bot',
      text: botRes.replyText,
      options: botRes.options,
      actionLink: botRes.actionLink,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInputVal('');
  };

  return (
    <div className={styles.floatContainer}>
      {/* Interactive Chat Window Drawer */}
      {isOpen && (
        <div className={styles.chatWindow}>
          {/* Header */}
          <div className={styles.chatHeader}>
            <div className={styles.headerTitle}>
              <div className={styles.avatar}>🐝</div>
              <div className={styles.botInfo}>
                <h4>BeeVibe WhatsApp Bot</h4>
                <span>
                  <span className={styles.badgeDot} /> Instant AI Assistant
                </span>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={() => setIsOpen(false)} aria-label="Close Chat">
              <X size={20} />
            </button>
          </div>

          {/* Messages Listing */}
          <div className={styles.messagesList}>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`${styles.messageRow} ${m.sender === 'bot' ? styles.botMsgRow : styles.userMsgRow}`}
              >
                <div className={`${styles.bubble} ${m.sender === 'bot' ? styles.botBubble : styles.userBubble}`}>
                  {m.text}

                  {/* Interactive Action Link */}
                  {m.actionLink && (
                    <a
                      href={m.actionLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.actionLinkBtn}
                    >
                      Open Link <ExternalLink size={14} />
                    </a>
                  )}

                  {/* Interactive Quick Option Chips */}
                  {m.options && m.options.length > 0 && (
                    <div className={styles.optionsGrid}>
                      {m.options.map((opt) => (
                        <button
                          key={opt.id}
                          className={styles.optionChip}
                          onClick={() => handleSendMessage(opt.id)}
                        >
                          {opt.text}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            className={styles.inputArea}
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <input
              type="text"
              className={styles.inputField}
              placeholder="Ask about slots, prices, food..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
            />
            <button type="submit" className={styles.sendBtn} aria-label="Send Message">
              <Send size={18} />
            </button>
          </form>

          {/* Native WhatsApp Direct Link Footer */}
          <div className={styles.nativeWaFooter}>
            <a
              href="https://wa.me/919900106474?text=Hi%20Bee%20Vibe!%20I%20want%20to%20chat%20with%20your%20WhatsApp%20Bot."
              target="_blank"
              rel="noopener noreferrer"
              className={styles.nativeWaLink}
            >
              💬 Open in Native WhatsApp (+919900106474) <ExternalLink size={12} />
            </a>
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button className={styles.triggerBtn} onClick={() => setIsOpen(!isOpen)}>
        <MessageSquare size={22} />
        <span>WhatsApp Bot</span>
        <span className={styles.badgeDot} />
      </button>
    </div>
  );
}
