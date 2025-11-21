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
  AlertCircle,
  Menu, 
  Users
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
  EDUCATION: { id: 'education', name: 'Eğitim Takip', pass: 'egitim', access: ['dashboard', 'education', 'filming', 'editing', 'calendar', 'instructors'] },
  FILMING: { id: 'filming', name: 'Çekim Takip', pass: 'c1t2', access: ['filming'] }, // Sadece Çekim Takip sayfasına erişim
  EDITING: { id: 'editing', name: 'Montaj Takip', pass: 'm9t8', access: ['editing'] },
  ADMIN: { id: 'admin', name: 'Yönetici', pass: 'admin2025', access: ['dashboard', 'education', 'filming', 'editing', 'calendar', 'instructors'] }
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
  CEKIM_YAPANLAR_LISTESI: ['Gülnur Kılıç', 'Sadi Demirci', 'Soner Ulu'],
  EVET_HAYIR: ['Yapıldı', 'Yapılmadı'],
  CEKIM_DURUMU: ['Başladı', 'Devam Ediyor', 'Tekrar Çekim', 'Bitti'],
  MONTAJ_DURUMU: ['Devam Ediyor', '1.Revize', '2.Revize', 'Bitti'],
  ICERIK_UZMANI: ['Arzu Mantar', 'Meltem Ermez', 'Nezahat Kara', 'Sevim Aydın Verim'],
  SYNOLOGY_DURUMU: ['Kaydedildi', 'Kaydedilmedi'],
  EGITIM_TASARIM_UZMANI: ['Başak Erkoç', 'Elif Nur Çonak', 'Emine Aytekin', 'Erdem Çevik', 'Umut Meral', 'Zehra Tüfenkçi'],
  CALISMA_GUNLERI: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'],
  CALISMA_SAATLERI: ['08:30 – 17:00', '09:00 – 16:00', '08:30 – 12:00', '12:40 -17:00', '13:00 -16:30', '13:00 – 17:00']
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
      </div>
    </div>
  );
};

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
          {(col.options || []).map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    } else if (col.type === 'multiselect') {
        const currentVals = form[col.key] ? (Array.isArray(form[col.key]) ? form[col.key] : form[col.key].split(', ')) : [];
        const handleCheck = (opt) => {
            let newVals;
            if (currentVals.includes(opt)) {
                newVals = currentVals.filter(v => v !== opt);
            } else {
                newVals = [...currentVals, opt];
            }
            setForm({ ...form, [col.key]: newVals.join(', ') });
        };
        return (
            <div className="w-full p-2 border rounded text-sm max-h-32 overflow-y-auto bg-white shadow-sm">
                {(col.options || []).map(opt => (
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
    // Çekim Başlama, Montaj Başlama, Montaj Sorumlusu kaldırıldı
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
    if(window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'education_tracking', id));
    }
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
    { key: 'cekimBaslama', label: 'Çekim Başlama', type: 'date' },
    { key: 'onCekim', label: 'Ön Çekim', type: 'select', options: LOOKUPS.EVET_HAYIR },
    { key: 'onCekimTarihi', label: 'Ön Çekim Tarihi', type: 'date' },
    { key: 'izlence', label: 'İzlence (İçerik Uzm.)', type: 'select', options: LOOKUPS.ICERIK_UZMANI },
    { key: 'cekimDurumu', label: 'Çekim Durumu', type: 'select', options: LOOKUPS.CEKIM_DURUMU },
    { key: 'cekimBitis', label: 'Çekim Bitiş', type: 'date' },
    { key: 'fotoCekim', label: 'Foto Çekim', type: 'select', options: LOOKUPS.EVET_HAYIR },
    { key: 'fotoCekimYapan', label: 'Foto Çekim Yapan', type: 'select', options: LOOKUPS.CEKIM_SORUMLUSU },
    { key: 'fotoCekimTarihi', label: 'Foto Çekim Tarihi', type: 'date' },
    { key: 'cekimKontrol', label: 'Çekim Kontrol', type: 'select', options: LOOKUPS.EVET_HAYIR },
    { key: 'cekimKontrolTarihi', label: 'Çekim Kontrol Tarihi', type: 'date' },
    { key: 'cekimKontrolYapan', label: 'Çekim Kontrol Yapan', type: 'select', options: LOOKUPS.CEKIM_SORUMLUSU },
    { key: 'tasnif', label: 'Tasnif', type: 'select', options: LOOKUPS.EVET_HAYIR },
    { key: 'tasnifYapan', label: 'Tasnif Yapan', type: 'select', options: LOOKUPS.CEKIM_SORUMLUSU },
    { key: 'dipSes', label: 'Dip Ses Temizliği', type: 'select', options: LOOKUPS.EVET_HAYIR },
    { key: 'cekimTamam', label: 'Çekim', type: 'select', options: LOOKUPS.TAMAMLANDI_DURUMU },
    { key: 'synology', label: 'Synology', type: 'select', options: LOOKUPS.SYNOLOGY_DURUMU },
    { key: 'synologyKlasor', label: 'Synology Klasör Adı' },
    { key: 'cekimYapanlar', label: 'Çekim Yapanlar', type: 'multiselect', options: LOOKUPS.CEKIM_YAPANLAR_LISTESI },
    { key: 'notlar', label: 'Ek Notlar' },
  ];

  useEffect(() => {
    if (!currentUser) return; 
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'filming_tracking'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        if (a.cekimDurumu === 'Bitti' && b.cekimDurumu !== 'Bitti') return 1;
        if (a.cekimDurumu !== 'Bitti' && b.cekimDurumu === 'Bitti') return -1;
        return 0;
      });
      setData(list);
    }, (err) => console.error("Filming fetch error:", err));
    return () => unsub();
  }, [currentUser]);

  const handleAdd = async (form) => {
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'filming_tracking'), { ...form, createdAt: serverTimestamp() });
  };
  const handleUpdate = async (id, form) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'filming_tracking', id), form);
  };
  const handleDelete = async (id) => {
    if(window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'filming_tracking', id));
    }
  };

  return (
    <DataTable
      title="Çekim Takip Listesi"
      columns={cols}
      data={data}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      customRowClass={(row) => row.cekimDurumu === 'Bitti' ? 'bg-green-50 border-green-200' : ''}
    />
  );
};

const EditingPage = ({ currentUser }) => {
  const [data, setData] = useState([]);
  const cols = [
    { key: 'egitimAdi', label: 'Eğitim Adı' },
    { key: 'egitmen', label: 'Eğitmen Adı Soyadı' },
    { key: 'montajSorumlusu', label: 'Montaj Sorumlusu', type: 'select', options: LOOKUPS.MONTAJ_SORUMLUSU },
    { key: 'icerikUzmani', label: 'İçerik Uzmanı', type: 'select', options: LOOKUPS.ICERIK_UZMANI },
    { key: 'montajBaslama', label: 'Montaj Başlama', type: 'date' },
    { key: 'revize1', label: '1. Revize Tarihi', type: 'date' },
    { key: 'revize2', label: '2. Revize Tarihi', type: 'date' },
    { key: 'montajDurumu', label: 'Montaj Durumu', type: 'select', options: LOOKUPS.MONTAJ_DURUMU },
    { key: 'montajBitis', label: 'Montaj Bitiş', type: 'date' },
    { key: 'notlar', label: 'Ek Notlar' },
  ];

  useEffect(() => {
    if (!currentUser) return; 
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'editing_tracking'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        if (a.montajDurumu === 'Bitti' && b.montajDurumu !== 'Bitti') return 1;
        if (a.montajDurumu !== 'Bitti' && b.montajDurumu === 'Bitti') return -1;
        return 0;
      });
      setData(list);
    }, (err) => console.error("Editing fetch error:", err));
    return () => unsub();
  }, [currentUser]);

  const handleAdd = async (form) => {
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'editing_tracking'), { ...form, createdAt: serverTimestamp() });
  };
  const handleUpdate = async (id, form) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'editing_tracking', id), form);
  };
  const handleDelete = async (id) => {
    if(window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'editing_tracking', id));
    }
  };

  return (
    <DataTable
      title="Montaj Takip Listesi"
      columns={cols}
      data={data}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      customRowClass={(row) => row.montajDurumu === 'Bitti' ? 'bg-green-50 border-green-200' : ''}
    />
  );
};

const InstructorPage = ({ currentUser }) => {
    const [data, setData] = useState([]);
    const cols = [
        { key: 'egitmen', label: 'Eğitmen' },
        { key: 'dal', label: 'Dal', type: 'select', options: LOOKUPS.DAL },
        { key: 'alan', label: 'Alan', type: 'select', options: LOOKUPS.ALAN },
        { key: 'calismaGunu', label: 'Çalışma Günü', type: 'multiselect', options: LOOKUPS.CALISMA_GUNLERI },
        { key: 'calismaSaati', label: 'Çalışma Saati', type: 'select', options: LOOKUPS.CALISMA_SAATLERI },
        { key: 'icerikGelistirme', label: 'İçerik Geliştirme Uzmanı', type: 'select', options: LOOKUPS.ICERIK_TAKIP },
        { key: 'egitimTasarim', label: 'Eğitim Tasarım Uzmanı', type: 'select', options: LOOKUPS.EGITIM_TASARIM_UZMANI }
    ];

    useEffect(() => {
        if (!currentUser) return;
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'instructor_management'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            setData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (err) => console.error("Instructor fetch error:", err));
        return () => unsub();
    }, [currentUser]);

    const handleAdd = async (form) => {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'instructor_management'), { ...form, createdAt: serverTimestamp() });
    };
    const handleUpdate = async (id, form) => {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'instructor_management', id), form);
    };
    const handleDelete = async (id) => {
        if(window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'instructor_management', id));
        }
    };

    return (
        <DataTable
            title="Eğitmen Yönetimi"
            columns={cols}
            data={data}
            onAdd={handleAdd}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
        />
    );
};

const CalendarPage = () => (
  <div className="w-full h-full bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col">
    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
      <Calendar className="text-indigo-600"/> Stüdyo Çekim Takvimi
    </h2>
    <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden border border-gray-300">
      <iframe src="https://meuzem.github.io/uzem_studyo/" className="w-full h-full border-0" title="Studio Calendar" />
    </div>
  </div>
);

const DashboardPage = ({ currentUser }) => {
  const [eduData, setEduData] = useState([]);
  const [editData, setEditData] = useState([]);

  useEffect(() => {
    if (!currentUser) return; 
    const unsub1 = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'education_tracking'), s => setEduData(s.docs.map(d=>d.data())));
    const unsub2 = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'editing_tracking'), s => setEditData(s.docs.map(d=>d.data())));
    return () => { unsub1(); unsub2(); };
  }, [currentUser]);

  // Dashboard Verilerini Hesapla
  const inFilming = eduData.filter(d => d.durum === 'Çekimde' || d.durum === 'Ekran Çekiminde' || d.durum === 'Ses Çekimi Bekleniyor' || d.durum === 'Çekim Bekliyor').length;
  const inEditing = editData.filter(d => d.montajDurumu !== 'Bitti').length;
  const published = eduData.filter(d => d.durum === 'Yayında').length;
  const hazirlanan = eduData.filter(d => d.durum !== 'Yayında' && d.durum !== 'Eğitim Beklemede' && d.durum !== 'İptal').length;

  const eduStatusCounts = eduData.reduce((acc, curr) => {
    const s = curr.durum || 'Belirsiz';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const pieData = {
    labels: Object.keys(eduStatusCounts),
    datasets: [{
      data: Object.values(eduStatusCounts),
      backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#64748b'],
      borderWidth: 1,
    }]
  };

  const barData = {
    labels: ['Çekimde', 'Montajda', 'Yayında', 'Hazırlanan'],
    datasets: [{
      label: 'Süreç Dağılımı',
      data: [inFilming, inEditing, published, hazirlanan],
      backgroundColor: ['#f97316', '#8b5cf6', '#22c55e', '#64748b'],
    }]
  };

  return (
    <div className="p-2 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="text-gray-500 text-xs font-bold uppercase">Çekimdeki Eğitim</div>
          <div className="text-3xl font-bold text-orange-600 mt-1">{inFilming}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="text-gray-500 text-xs font-bold uppercase">Montajdaki Eğitim</div>
          <div className="text-3xl font-bold text-purple-600 mt-1">{inEditing}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="text-gray-500 text-xs font-bold uppercase">Yayındaki Eğitim</div>
          <div className="text-3xl font-bold text-green-600 mt-1">{published}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="text-gray-500 text-xs font-bold uppercase">Hazırlanan Eğitim</div>
          <div className="text-3xl font-bold text-slate-600 mt-1">{hazirlanan}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 h-[400px] flex flex-col">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Eğitim Durum Dağılımı</h3>
          <div className="flex-1 relative w-full">
            <Pie data={pieData} options={{ maintainAspectRatio: false, responsive: true }} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 h-[400px] flex flex-col">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Genel İstatistikler</h3>
          <div className="flex-1 relative w-full">
            <Bar data={barData} options={{ maintainAspectRatio: false, responsive: true }} />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App Shell ---
export default function App() {
  const [userRole, setUserRole] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try { await signInAnonymously(auth); } 
      catch (error) { if (isMounted) setAuthError("Bağlantı hatası. İnternet bağlantınızı kontrol edin."); }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, (u) => { if (isMounted) { setFirebaseUser(u); setLoading(false); } });
    return () => { isMounted = false; unsub(); };
  }, []);

  const handleLogin = (roleObj) => {
    setUserRole(roleObj);
    if (roleObj.id === 'filming') setActiveTab('filming');
    else if (roleObj.id === 'editing') setActiveTab('editing');
    else setActiveTab('dashboard');
  };

  const handleLogout = async () => { setUserRole(null); };

  if (loading) return <div className="h-screen flex items-center justify-center text-indigo-600">Yükleniyor...</div>;
  if (authError) return <div className="h-screen flex items-center justify-center text-red-600">{authError}</div>;
  if (!userRole) return <Login onLogin={handleLogin} />;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20}/> },
    { id: 'education', label: 'Eğitim Takip', icon: <BookOpen size={20}/> },
    { id: 'filming', label: 'Çekim Takip', icon: <Video size={20}/> },
    { id: 'editing', label: 'Montaj Takip', icon: <Scissors size={20}/> },
    { id: 'calendar', label: 'Çekim Takvimi', icon: <Calendar size={20}/> },
    { id: 'instructors', label: 'Eğitmen Yönetimi', icon: <Users size={20}/> },
  ];

  const allowedMenu = menuItems.filter(item => userRole.access.includes(item.id));

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden relative">
      
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white flex flex-col shadow-xl transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Eİİ <span className="text-indigo-400">UZEM</span></h1>
            <p className="text-xs text-slate-400 mt-1">Panel</p>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400"><X size={20}/></button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {allowedMenu.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800 rounded-lg p-3 mb-3">
            <div className="text-xs text-slate-400">Giriş Yapan</div>
            <div className="font-bold text-sm truncate" title={userRole.name}>{userRole.name}</div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut size={16}/> Çıkış Yap
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-4 md:px-8 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-semibold text-gray-800">
              {menuItems.find(m => m.id === activeTab)?.label}
            </h2>
          </div>
          <div className="text-sm text-gray-500 hidden sm:block">
             {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col">
          {activeTab === 'dashboard' && <div className="h-full overflow-y-auto custom-scrollbar"><DashboardPage currentUser={firebaseUser} /></div>}
          {activeTab === 'education' && <EducationPage currentUser={firebaseUser} />}
          {activeTab === 'filming' && <FilmingPage currentUser={firebaseUser} />}
          {activeTab === 'editing' && <EditingPage currentUser={firebaseUser} />}
          {activeTab === 'calendar' && <CalendarPage />}
          {activeTab === 'instructors' && <InstructorPage currentUser={firebaseUser} />}
        </main>
      </div>
    </div>
  );
}
