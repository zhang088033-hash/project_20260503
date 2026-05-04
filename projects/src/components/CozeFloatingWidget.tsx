'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

declare global {
  interface Window {
    CozeWebSDK?: any;
    cozeChatWidget?: any;
  }
}

export function CozeFloatingWidget() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [botCode, setBotCode] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const enabled = localStorage.getItem('coze_enable_widget') === 'true';
    const code = localStorage.getItem('coze_bot_code') || '';
    
    setIsEnabled(enabled);
    setBotCode(code);

    if (enabled && code) {
      loadCozeWidget(code);
    }

    return () => {
      if (window.cozeChatWidget) {
        window.cozeChatWidget.destroy();
      }
    };
  }, []);

  const loadCozeWidget = (code: string) => {
    const script = document.createElement('script');
    script.src = 'https://lf-cdn.coze.cn/cdnagent/coco-js/v1.0.0/web-sdk.js';
    script.async = true;
    
    script.onload = () => {
      if (window.CozeWebSDK) {
        try {
          window.cozeChatWidget = new window.CozeWebSDK.ChatWidget({
            config: {
              botCode: code,
            },
            component: {
              conversation: {
                title: '宠物AI助手',
                description: '有什么可以帮你的吗？',
              },
              chatInterface: {
                showPestore: false,
              },
            },
            layout: {
              position: 'right',
              width: 380,
              height: 600,
            },
          });
          
          window.cozeChatWidget.init();
          setIsLoaded(true);
        } catch (error) {
          console.error('Failed to initialize Coze widget:', error);
        }
      }
    };

    script.onerror = () => {
      console.error('Failed to load Coze SDK');
    };

    document.body.appendChild(script);
  };

  if (!isEnabled || !botCode) {
    return null;
  }

  if (!isLoaded) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isMinimized ? (
        <button
          onClick={() => setIsMinimized(true)}
          className="w-14 h-14 rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700 flex items-center justify-center transition-all hover:scale-105"
          aria-label="打开聊天"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      ) : (
        <div className="w-[380px] h-[600px] bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col">
          <div className="bg-purple-600 text-white px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">宠物AI助手</h3>
              <p className="text-xs text-purple-200">点击展开聊天</p>
            </div>
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1 hover:bg-purple-500 rounded"
              aria-label="最小化"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1" id="coze-chat-container">
          </div>
        </div>
      )}
    </div>
  );
}
