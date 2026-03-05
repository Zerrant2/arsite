'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface Model {
  id: number;
  name: string;
  glbPath: string;
  usdzPath: string;
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [models, setModels] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [glbFile, setGlbFile] = useState<File | null>(null);
  const [usdzFile, setUsdzFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authenticated) {
      fetchModels();
    }
  }, [authenticated]);

  const fetchModels = async () => {
    try {
      const res = await fetch('/api/models');
      const data = await res.json();
      setModels(data);
    } catch (error) {
      console.error('Ошибка загрузки списка:', error);
    }
  };

 const handleLogin = async () => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ password }),
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) setAuthenticated(true);
    else alert('Неверный пароль');
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-lg border w-80">
          <h2 className="text-xl font-bold mb-4 text-black">Вход в админку</h2>
          <input 
            type="password" 
            className="w-full border p-2 mb-4 text-black rounded"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleLogin} className="w-full bg-blue-600 text-white p-2 rounded">Войти</button>
        </div>
      </div>
    );
  }

  

  
  const downloadQRCode = (id: number, name: string) => {
    // Находим SVG элемент внутри нашего блока
    const svg = document.getElementById(`qr-${id}`)?.querySelector('svg');
    if (!svg) return;

    // Превращаем SVG в DataURL
    const serializer = new XMLSerializer();
    const source = '<?xml version="1.0" standalone="no"?>\r\n' + serializer.serializeToString(svg);
    const image = new Image();
    image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);

    // Создаем холст для конвертации в PNG
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 300; // Высокое разрешение для печати
      canvas.height = 300;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#FFFFFF'; // Белый фон
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, 300, 300);
        
        // Создаем ссылку для скачивания
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `QR_${name.replace(/\s+/g, '_')}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };
  };

  const deleteModel = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту модель?')) return;
    
    try {
      const res = await fetch(`/api/models?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchModels(); // Обновляем список после удаления
      } else {
        alert('Ошибка при удалении');
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !glbFile || !usdzFile) return alert('Заполните все поля!');

    setLoading(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('glb', glbFile);
    formData.append('usdz', usdzFile);

    const res = await fetch('/api/models', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      alert('Модель успешно загружена!');
      setName('');
      setGlbFile(null);
      setUsdzFile(null);
      fetchModels();
    } else {
      alert('Ошибка загрузки');
    }
    setLoading(false);
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-black">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h1 className="text-2xl font-bold mb-6">Добавить новую 3D модель</h1>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Название модели</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="w-full border p-2 rounded-md"
                placeholder="Например: Стул IKEA"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Файл .glb</label>
                <input type="file" accept=".glb" onChange={(e) => setGlbFile(e.target.files?.[0] || null)} className="w-full border p-2 rounded-md bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Файл .usdz</label>
                <input type="file" accept=".usdz" onChange={(e) => setUsdzFile(e.target.files?.[0] || null)} className="w-full border p-2 rounded-md bg-gray-50" />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors disabled:bg-blue-300"
            >
              {loading ? 'Загрузка...' : 'Загрузить на сервер'}
            </button>
          </form>
        </div>

        {/* Список загруженных моделей */}
<div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
  <h2 className="text-xl font-bold mb-6">Доступные модели</h2>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {models.map((model) => (
      <div key={model.id} className="border p-4 rounded-lg flex justify-between items-center bg-gray-50">
        <div className="flex gap-4 items-center">
          {/* Контейнер QR с ID для захвата */}
          <div id={`qr-${model.id}`} className="bg-white p-2 rounded-md shadow-sm border">
            <QRCodeSVG value={`${baseUrl}/scan/${model.id}`} size={80} />
          </div>
          <div>
            <h3 className="font-bold">{model.name}</h3>
            <p className="text-xs text-gray-400">ID: {model.id}</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          {/* Кнопка скачивания */}
          <button 
            onClick={() => downloadQRCode(model.id, model.name)}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Скачать QR
          </button>
          {/* Кнопка удаления */}
          <button 
            onClick={() => deleteModel(model.id)}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Удалить
          </button>
        </div>
      </div>
    ))}
    {models.length === 0 && <p className="text-gray-500">Моделей пока нет.</p>}
  </div>
</div>

      </div>
    </div>
  );

  
}