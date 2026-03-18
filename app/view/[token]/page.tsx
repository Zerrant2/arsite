'use client';

import { useEffect, useState } from 'react';
import { prisma } from '@/lib/prisma'; // Замените на прямой импорт модели через API, если серверный рендеринг ругается
import Script from 'next/script';
import React from 'react';

// Типы для TS
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        'ios-src'?: string;
        ar?: boolean;
        'ar-modes'?: string;
        'camera-controls'?: boolean;
        'shadow-intensity'?: string;
        'auto-rotate'?: boolean;
        alt?: string;
      };
    }
  }
}

export default function ViewPage({ params }: { params: Promise<{ token: string }> }) {
  // В клиентском компоненте лучше использовать хуки для параметров
  const [token, setToken] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then((p) => {
      setToken(p.token);
      // Загружаем данные сессии через API
      fetch(`/api/session/${p.token}`)
        .then(res => res.json())
        .then(data => { setSession(data); setLoading(false); });
    });
  }, [params]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>;
  if (!session || new Date() > new Date(session.expiresAt)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 text-center">
        <h1 className="text-3xl font-bold text-red-500 mb-4">Время истекло</h1>
      </div>
    );
  }

  const glbUrl = `/api/files/glb?token=${token}`;
  const usdzUrl = `/api/files/usdz?token=${token}`;

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-white">
      <Script 
        type="module" 
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js" 
      />

      <div className="w-full h-[100dvh] relative">
        <model-viewer
          id="viewer"
          src={glbUrl}
          ios-src={usdzUrl}
          ar
          ar-modes="webxr scene-viewer quick-look"
          camera-controls
          auto-rotate
          shadow-intensity="1"
          alt={session.model.name}
          style={{ width: '100%', height: '100%' }}
        >
          <button
            slot="ar-button"
            id="ar-button"
            className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-full font-bold shadow-lg text-lg z-10 transition-opacity"
          >
            Посмотреть в AR 🚀
          </button>
        </model-viewer>
      </div>

      <Script id="ar-fallback" strategy="afterInteractive">{`
        const viewer = document.getElementById('viewer');
        const arButton = document.getElementById('ar-button');

        // 1. ОПРЕДЕЛЯЕМ ЯНДЕКС БРАУЗЕР
        const isYandexBrowser = /YaBrowser/i.test(navigator.userAgent);

        if (isYandexBrowser) {
          // Создаем красивое предупреждение
          const warning = document.createElement('div');
          warning.innerHTML = '⚠️ Для наилучшего качества AR рекомендуем открыть ссылку в <b>Google Chrome</b>';
          warning.style.cssText = 'position: absolute; top: 10px; left: 10px; right: 10px; background: rgba(255,200,0,0.9); color: black; padding: 10px; border-radius: 8px; text-align: center; font-size: 14px; z-index: 50; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-family: sans-serif;';
          
          // Добавляем крестик для закрытия
          const closeBtn = document.createElement('span');
          closeBtn.innerHTML = ' ✖';
          closeBtn.style.cursor = 'pointer';
          closeBtn.onclick = () => warning.remove();
          warning.appendChild(closeBtn);

          document.body.appendChild(warning);
        }


        // Ждем события готовности самого model-viewer
        viewer.addEventListener('load', () => {
          // Даем компоненту еще немного времени на инициализацию AR-модулей
          setTimeout(() => {
            if (!viewer.canActivateAR) {
              console.log('AR недоступен, режим подиума включен');
              if (arButton) arButton.style.display = 'none';
              viewer.autoRotate = true; 
            } else {
              console.log('AR успешно активирован');
            }
          }, 1000);
        });
      `}</Script>
    </div>
  );
}