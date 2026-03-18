'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import React from 'react';

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
  const[token, setToken] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const[showPrompt, setShowPrompt] = useState(false);
  const [chromeLink, setChromeLink] = useState('');

  useEffect(() => {
    const ua = navigator.userAgent;
    
    // 1. Кто перед нами?
    const isAndroid = /Android/i.test(ua);
    const isHuawei = /Huawei|HONOR|HMSCore/i.test(ua);
    const isYandex = /YaBrowser/i.test(ua);
    const isInApp = /Telegram|VK|Instagram/i.test(ua);
    
    // 2. Поддерживает ли браузер WebXR (честная проверка для неизвестных браузеров)
    const isWebXRSupported = 'xr' in navigator;

    // 3. ФОРМУЛА ИДЕАЛЬНОГО UX:
    // Показываем окно, ЕСЛИ это Android, И это НЕ Huawei, И (это Яндекс ИЛИ Внутри-приложения ИЛИ нет WebXR)
    const needsChromePrompt = isAndroid && !isHuawei && (isYandex || isInApp || !isWebXRSupported);

    if (needsChromePrompt) {
      const urlWithoutProtocol = window.location.host + window.location.pathname + window.location.search;
      
      setChromeLink(`intent://${urlWithoutProtocol}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(window.location.href)};end`);
      setShowPrompt(true);
    }

    // 4. Загружаем модель в любом случае
    params.then((p) => {
      setToken(p.token);
      fetch(`/api/session/${p.token}`)
        .then(res => res.json())
        .then(data => { 
          setSession(data); 
          setLoading(false); 
        });
    });
  }, [params]);

  // Функция копирования ссылки (для тех браузеров, что блокируют переход)
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('✅ Ссылка скопирована! Откройте приложение Google Chrome и вставьте её в адресную строку.');
    }).catch(() => {
      alert('Не удалось скопировать. Пожалуйста, скопируйте ссылку вручную из адресной строки.');
    });
  };

  if (loading) {
    return <div className="min-h-[100dvh] flex items-center justify-center bg-white text-black">Загрузка модели...</div>;
  }

  if (!session || new Date() > new Date(session.expiresAt)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-gray-100 p-4 text-center">
        <h1 className="text-3xl font-bold text-red-500 mb-4">Время истекло</h1>
        <p className="text-gray-700">Пожалуйста, отсканируйте QR-код заново.</p>
      </div>
    );
  }

  const glbUrl = `/api/files/glb?token=${token}`;
  const usdzUrl = `/api/files/usdz?token=${token}`;

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-white relative">
      
      {/* ВСПЛЫВАЮЩЕЕ ОКНО РЕКОМЕНДАЦИИ */}
      {showPrompt && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-md">
          <div className="bg-white p-8 rounded-2xl max-w-sm text-center shadow-2xl">
            <h2 className="text-2xl font-bold mb-3 text-gray-800">Рекомендуем Chrome</h2>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              Ваш текущий браузер блокирует 3D/AR функции. Для просмотра модели перейдите в <b>Google Chrome</b>.
            </p>
            <div className="flex flex-col gap-3">
              
              {/* Попытка 1: Автоматический переход */}
              <a 
                href={chromeLink} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-md"
              >
                1. Открыть в Chrome
              </a>
              
              {/* Попытка 2: Ручное копирование (если Яндекс блокирует кнопку выше) */}
              <button 
                onClick={copyLink}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-md"
              >
                2. Скопировать ссылку
              </button>

              {/* Отмена */}
              <button 
                onClick={() => setShowPrompt(false)}
                className="w-full mt-2 text-gray-400 hover:text-gray-600 font-medium py-2 px-4 transition-colors underline"
              >
                Остаться здесь (может работать с ошибками)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3D ПЛЕЕР */}
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

        viewer.addEventListener('load', () => {
          setTimeout(() => {
            if (!viewer.canActivateAR) {
              console.log('AR недоступен, режим подиума включен');
              if (arButton) arButton.style.display = 'none';
              viewer.autoRotate = true; 
            }
          }, 1000);
        });
      `}</Script>
    </div>
  );
}