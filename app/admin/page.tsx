'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

// Тип для наших моделей
interface Model {
  id: number;
  name: string;
  glbPath: string;
  usdzPath: string;
}

export default function AdminPage() {
  const[models, setModels] = useState<Model[]>([]);
  const [name, setName] = useState('');
  const [glbFile, setGlbFile] = useState<File | null>(null);
  const[usdzFile, setUsdzFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Загружаем список моделей при открытии страницы
  useEffect(() => {
    fetchModels();
  },[]);

  const fetchModels = async () => {
    const res = await fetch('/api/models');
    const data = await res.json();
    setModels(data);
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
      fetchModels(); // Обновляем список
    } else {
      alert('Ошибка загрузки');
    }
    setLoading(false);
  };

  // Получаем текущий домен для генерации правильной ссылки в QR
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-black">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Блок добавления модели */}
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
                <label className="block text-sm font-medium mb-1">Файл .glb (Android/PC)</label>
                <input 
                  type="file" 
                  accept=".glb" 
                  onChange={(e) => setGlbFile(e.target.files?.[0] || null)} 
                  className="w-full border p-2 rounded-md bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Файл .usdz (iPhone AR)</label>
                <input 
                  type="file" 
                  accept=".usdz" 
                  onChange={(e) => setUsdzFile(e.target.files?.[0] || null)} 
                  className="w-full border p-2 rounded-md bg-gray-50"
                />
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
          <h2 className="text-xl font-bold mb-6">Доступные модели и QR-коды</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {models.map((model) => (
              <div key={model.id} className="border p-4 rounded-lg flex gap-6 items-center bg-gray-50">
                {/* QR Код */}
                <div className="bg-white p-2 rounded-md shadow-sm border">
                  <QRCodeSVG value={`${baseUrl}/scan/${model.id}`} size={100} />
                </div>
                
                {/* Информация */}
                <div>
                  <h3 className="font-bold text-lg">{model.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">ID: {model.id}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    QR ведет на: <br/> 
                    <span className="text-blue-500">{baseUrl}/scan/{model.id}</span>
                  </p>
                </div>
              </div>
            ))}
            
            {models.length === 0 && (
              <p className="text-gray-500">Пока не загружено ни одной модели.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}