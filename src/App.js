import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken,
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title 
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { 
  LogOut, 
  LayoutDashboard, 
  Video, 
  Scissors, 
  BookOpen, 
  Calendar, 
  Download, 
  Plus, 
  Save, 
  X, 
  Edit2, 
  Trash2,
  Search,
  Filter,
  AlertCircle
} from 'lucide-react';

// --- ChartJS Registration ---
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// --- FIREBASE AYARLARI ---
const firebaseConfig = {
  apiKey: "AIzaSyBIZZyjDjd9Tb5wsiFcYw5iO-j1bt-DUAA",
  authDomain: "uzem-takip.firebaseapp.com",
  projectId: "uzem-takip",
  storageBucket: "uzem-takip.firebasestorage.app",
  messagingSenderId: "305465233892",
  appId: "1:305465233892:web:7dc7505941605af4b577f1",
  measurementId: "G-SPTL6T9BZ6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'uzem-takip-prod-v1'; 

// --- Sabitler ve Listeler ---
const ROLES = {
  EDUCATION: { id: 'education', name: 'Eğitim Takip', pass: 'egitim', access: ['dashboard', 'education', 'filming', 'editing', 'calendar'] },
  FILMING: { id: 'filming', name: 'Çekim Takip', pass: 'c1t2', access: ['filming', 'calendar'] },
  EDITING: { id: 'editing', name: 'Montaj Takip', pass: 'm9t8', access: ['editing'] },
  ADMIN: { id: 'admin', name: 'Yönetici', pass: 'admin2025', access: ['dashboard', 'education', 'filming', 'editing', 'calendar'] }
};

const LOOKUPS = {
  DAL: ['Mesleki ve Teknik', 'Kişisel Gelişim', 'Güzel Sanatlar', 'El Sanatları ve Zanaat'],
  ALAN: [
    'Bilişim Teknolojileri', 'Çocuk Gelişimi ve Eğitimi', 'Dil Eğitimleri', 'Örgü ve İşleme Sanatları',
    'Gastronomi ve Mutfak Sanatları', 'Görsel İletişim ve Grafik Tasarım', 'Güzellik ve Saç Bakım Hizmetleri',
    'Kişisel Gelişim ve Eğitim', 'Medya ve İletişim', 'Moda Tasarımı ve Tekstil Teknolojisi',
    'Muhasebe ve Finansman', 'Müzik', 'Robotik ve Yapay Zekâ', 'Sahne Sanatları', 'Sanat ve Tasarım',
    'Yönetim ve Hizmet', 'Ziraat', 'Ahşap Tasarımı ve Teknolojileri', 'Süsleme Sanatları',
    'Kuyumculuk ve Takı Tasarımı', 'Teknik Tasarım', 'Tekstil Tasarım'
  ],
  ICERIK_TAKIP: [
    'Arzu Mantar', 'Meltem Ermez', 'Meltem Ermez - Nezahat Kara', 'Nezahat Kara',
    'Nezahat Kara - Meltem Ermez', 'Sevim Aydın Verim', 'Sevim Aydın Verim - Meltem Ermez - Nezahat Kara'
  ],
  DURUM_GENEL: [
    'Eğitim Planlanıyor', 'Eğitmen İçerik Hazırlıyor', 'Ekran Çekiminde', 'Etkileşimli İçerik Hazırlanıyor',
    'Çekim Bekliyor', 'Çekimde', 'Çekim Bitti', 'Çekim Revize', 'İçerik Bitti', 'Ses Çekimi Bekleniyor',
    'İçerik Kontrolü', 'İçerik Revize', 'Montaj Sırasında', 'Etkileşimli İçerik Sırasında', 'Montajda',
    'Montaj Kontrolü', 'Montaj Revize', 'ID Bekliyor', 'Yayında', 'Eğitim Beklemede', 'İptal',
    'ÖYS Aşamasında', 'Animasyon Programı Bekliyor'
  ],
  MONTAJ_SORUMLUSU: ['Ayşe Nur Yazıcı', 'Hasan Taşdemir', 'Hatice Yürük', 'Cihan Çimen'],
  CEKIM_SORUMLUSU: ['Gülnur Kılıç', 'Sadi Demirci', 'Soner Ulu'],
  // Multiselect için seçenekler
  CEKIM_YAPANLAR_LISTESI: ['Gülnur Kılıç', 'Sadi Demirci', 'Soner Ulu'],
  EVET_HAYIR: ['Yapıldı', 'Yapılmadı'],
  CEKIM_DURUMU: ['Başladı', 'Devam Ediyor', 'Tekrar Çekim', 'Bitti'],
  // 'Başladı' seçeneği kaldırıldı
  MONTAJ_DURUMU: ['Devam Ediyor', '1.Revize', '2.Revize', 'Bitti'],
  TAMAMLANDI_DURUMU: ['Tamamlandı', 'Tamamlanmadı'],
  ICERIK_UZMANI: ['Arzu Mantar', 'Meltem Ermez', 'Nezahat Kara', 'Sevim Aydın Verim'],
  SYNOLOGY_DURUMU: ['Kaydedildi', 'Kaydedilmedi']
};

// --- Yardımcı Fonksiyonlar ---
const exportToExcel = (data, fileName) => {
  if (!data || data.length === 0) {
    alert("Dışa aktarılacak veri bulunamadı.");
    return;
  }
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(';'),
    ...data.map(row => headers.map(header => {
      let cell = row[header] === null || row[header] === undefined ? '' : row[header];
      cell = cell.toString().replace(/"/g, '""'); 
      if (cell.search(/("|,|;|\n)/g) >= 0) cell = `"${cell}"`;
      return cell;
    }).join(';'))
  ].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${fileName}_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('tr-TR');
};

// --- Bileşenler ---

// 1. Login Component
const Login = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    const role = Object.values(ROLES).find(r => r.pass === password);
    if (role) {
      onLogin(role);
    } else {
      setError('Hatalı şifre! Lütfen yetkili şifrenizi giriniz.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
             {/* Logo Kullanımı - public/logo.png yolunu kullanır */}
             <img src="/logo.png" alt="İBB Logo" className="h-24 object-contain" onError={(e) => {e.target.onerror = null; e.target.src="https://placehold.co/100x100?text=Logo"}} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">UZEM Eğitim Takip Sistemi</h1>
          <p className="text-gray-500 mt-2">Yetkili Girişi</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              placeholder="••••••"
            />
          </div>
          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition-colors shadow-md"
          >
            Giriş Yap
          </button>
        </form>
        {/* Şifreler gizlendi */}
        <div className="mt-6 text-xs text-center text-gray-400">
          Eİİ UZEM &copy; 2025
        </div>
      </div>
    </div>
  );
};

// 2. Generic Table Component
const DataTable = ({ 
  title, 
  columns, 
  data, 
  onAdd, 
  onUpdate, 
  onDelete, 
  customRowClass
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(null); 
  const [editForm, setEditForm] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState({});

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const lowerTerm = searchTerm.toLowerCase();
    return data.filter(item => 
      Object.values(item).some(val => 
        String(val).toLowerCase().includes(lowerTerm)
      )
    );
  }, [data, searchTerm]);

  const handleEditClick = (item) => {
    setIsEditing(item.id);
    setEditForm({ ...item });
  };

  const handleSave = async () => {
    await onUpdate(isEditing, editForm);
    setIsEditing(null);
  };

  const handleAddSubmit = async () => {
    await onAdd(addForm);
    setAddForm({});
    setIsAdding(false);
  };

  const renderInput = (col, form, setForm) => {
    if (col.type === 'select') {
      return (
        <select
          value={form[col.key] || ''}
          onChange={(e) => setForm({ ...form, [col.key]: e.target.value })}
          className="w-full p-1 border rounded text-sm"
        >
          <option value="">Seçiniz</option>
          {col.options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    } else if (col.type === 'multiselect') {
        // Multiselect Mantığı (Checkbox listesi olarak)
        const currentVals = form[col.key] ? (Array.isArray(form[col.key]) ? form[col.key] : form[col.key].split(', ')) : [];
        
        const handleCheck = (opt) => {
            let newVals;
            if (currentVals.includes(opt)) {
                newVals = currentVals.filter(v => v !== opt);
            } else {
                newVals = [...currentVals, opt];
            }
            // Veritabanına string olarak kaydetmek daha kolay (virgülle ayrılmış)
            setForm({ ...form, [col.key]: newVals.join(', ') });
        };

        return (
            <div className="w-full p-2 border rounded text-sm max-h-32 overflow-y-auto bg-white shadow-sm">
                {col.options.map(opt => (
                    <label key={opt} className="flex items-center gap-2 mb-1 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input 
                            type="checkbox" 
                            checked={currentVals.includes(opt)} 
                            onChange={() => handleCheck(opt)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-gray-700">{opt}</span>
                    </label>
                ))}
            </div>
        );
    } else if (col.type === 'date') {
      return (
        <input
          type="date"
          value={form[col.key] || ''}
          onChange={(e) => setForm({ ...form, [col.key]: e.target.value })}
          className="w-full p-1 border rounded text-sm"
        />
      );
    } else {
      return (
        <input
          type="text"
          value={form[col.key] || ''}
          onChange={(e) => setForm({ ...form, [col.key]: e.target.value })}
          className="w-full p-1 border rounded text-sm"
        />
      );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4 bg-gray-50 rounded-t-xl">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          {title} <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{data.length} Kayıt</span>
        </h2>
        
        <div className="flex items-center gap-3 flex-1 max-w-3xl justify-end">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none w-48 md:w-64"
            />
          </div>
          <button onClick={() => exportToExcel(filteredData, title)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors">
            <Download size={16} /> Excel
          </button>
          <button onClick={() => setIsAdding(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors">
            <Plus size={16} /> Yeni Ekle
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar relative">
        <table className="w-full min-w-max text-left text-sm border-collapse">
          <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm text-gray-700">
            <tr>
              <th className="p-3 border-b font-semibold w-12 text-center">#</th>
              {columns.map(col => (
                <th key={col.key} className="p-3 border-b font-semibold min-w-[120px]">
                  {col.label}
                </th>
              ))}
              <th className="p-3 border-b font-semibold w-24 text-center bg-gray-100 sticky right-0 shadow-l">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {isAdding && (
              <tr className="bg-indigo-50">
                <td className="p-3 text-center"><Plus size={16} className="mx-auto text-indigo-500"/></td>
                {columns.map(col => (
                  <td key={col.key} className="p-2 border-b align-top">
                    {renderInput(col, addForm, setAddForm)}
                  </td>
                ))}
                <td className="p-2 border-b text-center sticky right-0 bg-indigo-50">
                  <div className="flex justify-center gap-1">
                    <button onClick={handleAddSubmit} className="p-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"><Save size={14}/></button>
                    <button onClick={() => setIsAdding(false)} className="p-1 bg-gray-400 text-white rounded hover:bg-gray-500"><X size={14}/></button>
                  </div>
                </td>
              </tr>
            )}
            {filteredData.map((row, idx) => {
              const isRowEditing = isEditing === row.id;
              const rowClass = customRowClass ? customRowClass(row) : '';
              return (
                <tr key={row.id} className={`border-b hover:bg-gray-50 transition-colors ${rowClass}`}>
                  <td className="p-3 text-center text-gray-500">{idx + 1}</td>
                  {columns.map(col => (
                    <td key={col.key} className="p-3 align-top">
                      {isRowEditing ? renderInput(col, editForm, setEditForm) : (col.type === 'date' ? formatDate(row[col.key]) : row[col.key])}
                    </td>
                  ))}
                  <td className="p-3 text-center sticky right-0 bg-inherit shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                    {isRowEditing ? (
                      <div className="flex justify-center gap-1">
                        <button onClick={handleSave} className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700"><Save size={14}/></button>
                        <button onClick={() => setIsEditing(null)} className="p-1.5 bg-gray-400 text-white rounded hover:bg-gray-500"><X size={14}/></button>
                      </div>
                    ) : (
                      <div className="flex justify-center gap-1">
                        <button onClick={() => handleEditClick(row)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"><Edit2 size={16}/></button>
                        <button onClick={() => onDelete(row.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"><Trash2 size={16}/></button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 3. Pages
const EducationPage = ({ currentUser }) => {
  const [data, setData] = useState([]);
  const cols = [
    { key: 'dal', label: 'Dal', type: 'select', options: LOOKUPS.DAL },
    { key: 'alan', label: 'Alan', type: 'select', options: LOOKUPS.ALAN },
    { key: 'bolum', label: 'Bölüm' },
    { key: 'egitim', label: 'Eğitim' },
    { key: 'egitmen', label: 'Eğitmen' },
    { key: 'icerikTakip', label: 'İçerik Takip', type: 'select', options: LOOKUPS.ICERIK_TAKIP },
    { key: 'durum', label: 'Durum', type: 'select', options: LOOKUPS.DURUM_GENEL },
    { key: 'icerikBaslama', label: 'İçerik Başlama', type: 'date' },
    { key: 'cekimBaslama', label: 'Çekim Başlama', type: 'date' },
    { key: 'montajBaslama', label: 'Montaj Başlama', type: 'date' },
    { key: 'montajSorumlusu', label: 'Montaj Sorumlusu', type: 'select', options: LOOKUPS.MONTAJ_SORUMLUSU },
    { key: 'yayinTarihi', label: 'Yayın Tarihi', type: 'date' },
    { key: 'notlar', label: 'Notlar' },
  ];

  useEffect(() => {
    if (!currentUser) return; 
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'education_tracking'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        if (a.durum === 'Yayında' && b.durum !== 'Yayında') return 1;
        if (a.durum !== 'Yayında' && b.durum === 'Yayında') return -1;
        return 0;
      });
      setData(list);
    }, (err) => console.error("Education fetch error:", err));
    return () => unsub();
  }, [currentUser]);

  const handleAdd = async (form) => {
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'education_tracking'), { ...form, createdAt: serverTimestamp() });
  };
  const handleUpdate = async (id, form) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'education_tracking', id), form);
  };
  const handleDelete = async (id) => {
    if(confirm('Silmek istediğinize emin misiniz?')) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'education_tracking', id));
  };

  return (
    <DataTable
      title="Eğitim Takip Listesi"
      columns={cols}
      data={data}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      customRowClass={(row) => row.durum === 'Yayında' ? 'bg-green-50 border-green-200' : ''}
    />
  );
};

const FilmingPage = ({ currentUser }) => {
  const [data, setData] = useState([]);
  const cols = [
    { key: 'egitimAdi', label: 'Eğitim Adı' },
    { key: 'egitmen', label: 'Eğitmen Adı Soyadı' },
    { key: 'cekimSorumlusu', label: 'Çekim Sorumlusu', type: 'select', options: LOOKUPS.CEKIM_SORUMLUSU },
    { key: 'isikSorumlusu', label: 'Işık Sorumlusu', type: 'select', options: LOOKUPS.CEKIM_SORUMLUSU },
    // videoAdi ve Video Synology Adı kaldırıldı
    { key: 'cekimBaslama', label: '
