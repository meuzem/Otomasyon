import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
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
  serverTimestamp,
  writeBatch,
  getDocs
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
  Menu, 
  Users, 
  ArrowUpDown,
  Check,
  RefreshCw,
  Clock,
  UserCheck
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
  EDUCATION: { id: 'education', name: 'Eğitim Takip', pass: 'no6-7', canEdit: true, canDelete: true, access: ['dashboard', 'education', 'filming', 'editing', 'calendar', 'instructors'] },
  FILMING: { id: 'filming', name: 'Çekim Takip', pass: 'ct123', canEdit: true, canDelete: false, access: ['filming', 'calendar'] },
  EDITING: { id: 'editing', name: 'Montaj Takip', pass: 'mt987', canEdit: true, canDelete: false, access: ['editing'] },
  ADMIN: { id: 'admin', name: 'Admin', pass: 'admin2025', canEdit: false, canDelete: false, access: ['dashboard', 'education', 'filming', 'editing', 'calendar', 'instructors'] },
  MANAGER: { id: 'manager', name: 'Yönetici', pass: 'uzemyonetici', canEdit: true, canDelete: true, access: ['dashboard', 'education', 'filming', 'editing', 'calendar', 'instructors'] }
};

const LOOKUPS = {
  DAL: ['Mesleki ve Teknik', 'Kişisel Gelişim', 'Güzel Sanatlar', 'El Sanatları ve Zanaat'],
  ALAN: [
    'Bilişim Teknolojileri', 'Çocuk Gelişimi ve Eğitimi', 'Dil Eğitimleri', 'İş ve İşleme Sanatları',
    'Gastronomi ve Mutfak Sanatları', 'Görsel İletişim ve Grafik Tasarım', 'Güzellik ve Saç Bakım Hizmetleri',
    'Kişisel Gelişim ve Eğitim', 'Medya ve İletişim', 'Moda Tasarımı ve Tekstil Teknolojisi',
    'Muhasebe ve Finansman', 'Müzik', 'Robotik ve Yapay Zekâ', 'Sahne Sanatları', 'Sanat ve Tasarım',
    'Yönetim ve Hizmet', 'Ziraat', 'Ahşap Tasarımı ve Teknolojileri', 'Süsleme Sanatları',
    'Kuyumculuk ve Takı Tasarımı', 'Teknik Tasarım', 'Tekstil Tasarımı'
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
    'İYS Aşamasında', 'ÖYS Aşamasında', 'Animasyon Programı Bekliyor', 'Eğitmen Ayrıldı'
  ],
  MONTAJ_SORUMLUSU: ['Ayşe Nur Yazıcı', 'Hasan Taşdemir', 'Hatice Yıkılmaz', 'Cihan Çimen'],
  CEKIM_SORUMLUSU: ['Gülnur Köse', 'Sadi Demirci', 'Soner Ulu'],
  CEKIM_YAPANLAR_LISTESI: ['Gülnur Köse', 'Sadi Demirci', 'Soner Ulu'],
  EVET_HAYIR: ['Yapıldı', 'Yapılmadı'],
  TAMAMLANDI_DURUMU: ['Tamamlandı', 'Tamamlanmadı'],
  CEKIM_DURUMU: ['Başlamadı', 'Devam Ediyor', 'Tekrar Çekim', 'Bitti'],
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

const parseDate = (dateStr) => {
    if (!dateStr) return '';
    let parts = dateStr.split(/[./-]/);
    if (parts.length === 3) {
        if (parts[2].length === 4) {
            return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
        }
        if (parts[0].length === 4) {
            return `${parts[0]}-${parts[1].padStart(2,'0')}-${parts[2].padStart(2,'0')}`;
        }
    }
    return dateStr; 
};

const parseCSV = (str) => {
    const arr = [];
    let quote = false;
    let row = 0, col = 0;
    for (let c = 0; c < str.length; c++) {
        let cc = str[c], nc = str[c+1];
        arr[row] = arr[row] || [];
        arr[row][col] = arr[row][col] || '';
        if (cc === '"' && quote && nc === '"') { arr[row][col] += cc; ++c; continue; }
        if (cc === '"') { quote = !quote; continue; }
        if (cc === ',' && !quote) { ++col; continue; }
        if (cc === '\r' && nc === '\n' && !quote) { ++row; col = 0; ++c; continue; }
        if (cc === '\n' && !quote) { ++row; col = 0; continue; }
        if (cc === '\r' && !quote) { ++row; col = 0; continue; }
        arr[row][col] += cc;
    }
    return arr;
};

const TruncatedText = ({ text, maxLength = 40 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const strText = String(text || '');
  
  if (!strText || strText === 'undefined') return <span>-</span>;
  if (strText.length <= maxLength) return <span>{strText}</span>;
  
  return (
    <div className="max-w-[300px]">
      <span className={isExpanded ? 'whitespace-pre-wrap break-words' : 'whitespace-nowrap'}>
        {isExpanded ? strText : `${strText.substring(0, maxLength)}...`}
      </span>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold ml-1 focus:outline-none underline"
      >
        {isExpanded ? 'Daralt' : 'Devamını gör'}
      </button>
    </div>
  );
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
          <h1 className="text-2xl font-bold text-gray-800">Eİİ UZEM Eğitim Takip</h1>
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
              placeholder="••••••••"
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
  onRequestDelete,
  onApproveDelete,
  onRejectDelete, 
  customRowClass, 
  currentUser,
  extraHeaderActions
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(null); 
  const [editForm, setEditForm] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const canEdit = currentUser?.canEdit;
  const canDelete = currentUser?.canDelete;

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const filteredData = useMemo(() => {
    let processedData = [...data];
    
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      processedData = processedData.filter(item => 
        Object.values(item).some(val => 
          String(val).toLowerCase().includes(lowerTerm)
        )
      );
    }

    processedData.sort((a, b) => {
      const getBottomOrder = (status) => {
        if (status === 'Eğitim Beklemede') return 1;
        if (status === 'Eğitmen Ayrıldı') return 2;
        if (status === 'İptal') return 3;
        if (status === 'Yayında') return 4;
        return 0; 
      };

      const aOrder = getBottomOrder(a.durum);
      const bOrder = getBottomOrder(b.durum);

      if (aOrder > 0 && bOrder > 0) {
         if (aOrder > bOrder) return 1;
         if (aOrder < bOrder) return -1;
         return 0;
      }
      if (aOrder > 0) return 1;
      if (bOrder > 0) return -1;

      const isPinned = (row, key) => {
          if (key === 'cekimDurumu' && row.cekimDurumu === 'Bitti') return true;
          if ((key === 'montajDurumu' || key === 'montajSorumlusu') && row.montajDurumu === 'Bitti') return true;
          return false;
      };

      if (sortConfig.key) {
        const aPinned = isPinned(a, sortConfig.key);
        const bPinned = isPinned(b, sortConfig.key);
        if (aPinned && !bPinned) return 1; 
        if (!aPinned && bPinned) return -1;

        const valA = a[sortConfig.key] ? a[sortConfig.key].toString() : "";
        const valB = b[sortConfig.key] ? b[sortConfig.key].toString() : "";
        
        if (valA.toLowerCase() < valB.toLowerCase()) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA.toLowerCase() > valB.toLowerCase()) return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    return processedData;
  }, [data, searchTerm, sortConfig]);

  const handleEditClick = (item) => {
    setIsEditing(item.id);
    setEditForm({ ...item });
  };

  const handleSave = async () => {
    await onUpdate(isEditing, editForm);
    setIsEditing(null);
  };

  const handleAddSubmit = async () => {
    if (Object.keys(addForm).length === 0) return; 
    await onAdd(addForm);
    setAddForm({});
    setIsAdding(false);
  };

  const renderInput = (col, form, setForm) => {
    if (col.readOnly) {
        return <span className="text-gray-500 text-sm whitespace-nowrap">{form[col.key] || '-'}</span>;
    }
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
    } else if (col.type === 'dynamicHours') {
        const days = form[col.dependsOn] ? form[col.dependsOn].split(', ').filter(Boolean) : [];
        if (days.length === 0) return <span className="text-gray-400 text-xs">Önce gün seçiniz</span>;
        
        const currentHours = form[col.key] ? form[col.key].split(', ') : [];
        
        return (
            <div className="flex flex-col gap-1 w-full">
                {days.map((day, idx) => (
                    <div key={day} className="flex items-center gap-2">
                        <span className="text-xs font-medium w-20 truncate" title={day}>{day}:</span>
                        <select
                            value={currentHours[idx] || ''}
                            onChange={(e) => {
                                const newArr = [...currentHours];
                                newArr[idx] = e.target.value;
                                setForm({ ...form, [col.key]: newArr.join(', ') });
                            }}
                            className="flex-1 p-1 border rounded text-xs"
                        >
                            <option value="">Saat Seç</option>
                            {(col.options || []).map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
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
          
          {extraHeaderActions}

          {canEdit && (
            <button onClick={() => exportToExcel(filteredData, title)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors">
                <Download size={16} /> Excel
            </button>
          )}
          
          {canEdit && (
            <button onClick={() => setIsAdding(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors">
                <Plus size={16} /> Yeni Ekle
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar relative">
        <table className="w-full min-w-max text-left text-sm border-collapse">
          <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm text-gray-700">
            <tr>
              <th className="p-0 border-b font-semibold bg-gray-100 align-middle w-12">
                 <div className="p-3 w-full h-full text-center flex items-center justify-center">#</div>
              </th>
              {columns.map(col => (
                <th 
                  key={col.key} 
                  className="p-0 border-b font-semibold bg-gray-100 align-middle relative group"
                >
                  <div 
                     style={{ resize: 'horizontal', overflow: 'hidden', minWidth: '120px', maxWidth: '400px' }}
                     className={`p-3 flex items-center gap-1 h-full ${col.sortable ? 'cursor-pointer hover:bg-gray-200 transition-colors' : ''}`}
                     onClick={() => col.sortable && requestSort(col.key)}
                  >
                    <span className="truncate">{col.label}</span>
                    {col.sortable && <ArrowUpDown size={14} className="text-gray-400 flex-shrink-0" />}
                  </div>
                </th>
              ))}
              {canEdit && <th className="p-3 border-b font-semibold w-24 text-center bg-gray-100 sticky right-0 shadow-l">İşlemler</th>}
            </tr>
          </thead>
          <tbody>
            {isAdding && canEdit && (
              <tr className="bg-indigo-50">
                <td className="p-3 text-center"><Plus size={16} className="mx-auto text-indigo-500"/></td>
                {columns.map(col => (
                  <td key={col.key} className="p-2 border-b align-top">
                    {renderInput(col, addForm, setAddForm)}
                  </td>
                ))}
                <td className="p-2 border-b text-center sticky right-0 bg-indigo-50">
                  <div className="flex justify-center gap-1">
                    <button onClick={handleAddSubmit} className="p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700" title="Kaydet"><Save size={14}/></button>
                    <button onClick={() => setIsAdding(false)} className="p-1.5 bg-gray-400 text-white rounded hover:bg-gray-500" title="İptal"><X size={14}/></button>
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
                      {isRowEditing ? renderInput(col, editForm, setEditForm) : (
                          col.key === 'notlar' 
                            ? <TruncatedText text={row[col.key]} maxLength={40} />
                            : col.type === 'dynamicHours'
                                ? (
                                    <div className="flex flex-col gap-0.5">
                                        {(row[col.dependsOn] ? row[col.dependsOn].split(', ').filter(Boolean) : []).map((d, i) => (
                                            <div key={d} className="text-xs whitespace-nowrap"><span className="font-semibold">{d}:</span> {(row[col.key] || '').split(', ')[i] || '-'}</div>
                                        ))}
                                    </div>
                                )
                                : (col.type === 'date' ? formatDate(row[col.key]) : row[col.key])
                      )}
                    </td>
                  ))}
                  {canEdit && (
                    <td className="p-3 text-center sticky right-0 bg-inherit shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                        {isRowEditing ? (
                        <div className="flex justify-center gap-1">
                            <button onClick={handleSave} className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700" title="Kaydet"><Save size={14}/></button>
                            <button onClick={() => setIsEditing(null)} className="p-1.5 bg-gray-400 text-white rounded hover:bg-gray-500" title="İptal"><X size={14}/></button>
                        </div>
                        ) : (
                        <div className="flex justify-center gap-1 items-center">
                            <button onClick={() => handleEditClick(row)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Düzenle"><Edit2 size={16}/></button>
                            
                            {row.deleteRequested ? (
                                canDelete ? (
                                    <>
                                        <button onClick={() => onApproveDelete(row.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors" title="Silmeyi Onayla"><Check size={16}/></button>
                                        <button onClick={() => onRejectDelete(row.id)} className="p-1.5 text-orange-500 hover:bg-orange-50 rounded transition-colors" title="Silmeyi Reddet"><X size={16}/></button>
                                    </>
                                ) : (
                                    <span className="text-[10px] text-red-500 font-bold px-1 py-0.5 bg-red-100 rounded flex items-center h-6">Silme Bekliyor</span>
                                )
                            ) : (
                                canDelete ? (
                                    <button onClick={() => onDelete(row.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors" title="Sil"><Trash2 size={16}/></button>
                                ) : (
                                    <button onClick={() => onRequestDelete(row.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded transition-colors" title="Silme Talep Et"><Trash2 size={16}/></button>
                                )
                            )}
                        </div>
                        )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Pages ---
const EducationPage = ({ currentUser }) => {
  const [data, setData] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const cols = [
    { key: 'dal', label: 'DAL ADI', type: 'select', options: LOOKUPS.DAL },
    { key: 'alan', label: 'ALAN ADI', type: 'select', options: LOOKUPS.ALAN, sortable: true },
    { key: 'bolum', label: 'BÖLÜM' },
    { key: 'egitim', label: 'EĞİTİM' },
    { key: 'egitmen', label: 'EĞİTMEN', sortable: true },
    { key: 'icerikTakip', label: 'İÇERİK TAKİP', type: 'select', options: LOOKUPS.ICERIK_TAKIP, sortable: true },
    { key: 'durum', label: 'DURUM', type: 'select', options: LOOKUPS.DURUM_GENEL, sortable: true },
    { key: 'icerikBaslama', label: 'İÇERİK BAŞLAMA TARİHİ', type: 'date' },
    { key: 'cekimBaslama', label: 'ÇEKİM BAŞLAMA TARİHİ', type: 'date' },
    { key: 'montajBaslama', label: 'MONTAJ BAŞLAMA TARİHİ', type: 'date' },
    { key: 'montajSorumlusu', label: 'MONTAJ SORUMLUSU', type: 'select', options: LOOKUPS.MONTAJ_SORUMLUSU },
    { key: 'yayinTarihi', label: 'YAYIN TARİHİ', type: 'date' },
    { key: 'notlar', label: 'NOTLAR' },
  ];

  useEffect(() => {
    if (!currentUser) return; 
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'education_tracking'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      if (currentUser.id === 'admin') { 
         const HIDDEN_STATUSES = ['Eğitim Planlanıyor', 'Eğitim Beklemede', 'İptal'];
         list = list.filter(item => !HIDDEN_STATUSES.includes(item.durum));
      }
      setData(list);
    }, (err) => console.error("Education fetch error:", err));
    return () => unsub();
  }, [currentUser]);

  const syncWithSheets = async () => {
    if (isSyncing || currentUser?.id === 'admin') return;
    setIsSyncing(true);
    
    try {
      const sheetUrl = "https://docs.google.com/spreadsheets/d/1OEFazqULDNoEF0p-we8uj1taVLhcQtPP/export?format=csv&gid=1682860427";
      const response = await fetch(sheetUrl);
      const text = await response.text();
      
      if (text.toLowerCase().includes('<!doctype html>') || text.toLowerCase().includes('<html')) {
          console.error("Geçersiz veri veya erişim engellendi (HTML döndü).");
          setIsSyncing(false);
          return;
      }

      const sheetData = parseCSV(text);
      if (sheetData.length < 2) {
          setIsSyncing(false);
          return;
      }

      const batch = writeBatch(db);
      const snapshot = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'education_tracking'));
      
      const existingDocs = {};
      snapshot.docs.forEach(doc => {
          existingDocs[doc.data().egitim?.toLowerCase().trim()] = doc;
      });

      const currentSheetEgitimler = new Set();
      let validRowCount = 0;

      for (let i = 1; i < sheetData.length; i++) {
        const row = sheetData[i];
        if (!row || row.length < 4 || !row[3] || row[3].trim() === '') continue; 
        
        const egitimAdi = row[3].trim();
        currentSheetEgitimler.add(egitimAdi.toLowerCase());
        validRowCount++;

        const recordData = {
             dal: row[0]?.trim() || '',
             alan: row[1]?.trim() || '',
             bolum: row[2]?.trim() || '',
             egitim: egitimAdi,
             egitmen: row[4]?.trim() || '',
             icerikTakip: row[5]?.trim() || '',
             durum: row[6]?.trim() || 'Eğitim Planlanıyor',
             icerikBaslama: parseDate(row[7]?.trim()),
             cekimBaslama: parseDate(row[8]?.trim()),
             montajBaslama: parseDate(row[9]?.trim()),
             montajSorumlusu: row[10]?.trim() || '',
             yayinTarihi: parseDate(row[11]?.trim()),
             notlar: row[12]?.trim() || '',
             updatedAt: serverTimestamp(),
             kaynak: 'GoogleSheets'
        };

        const existingDoc = existingDocs[egitimAdi.toLowerCase()];
        if (existingDoc) {
           batch.update(existingDoc.ref, recordData);
        } else {
           recordData.createdAt = serverTimestamp();
           const newRef = doc(collection(db, 'artifacts', appId, 'public', 'data', 'education_tracking'));
           batch.set(newRef, recordData);
        }
      }

      if (validRowCount > 10) {
          snapshot.docs.forEach(doc => {
              const egitim = doc.data().egitim?.toLowerCase().trim();
              if (egitim && !currentSheetEgitimler.has(egitim)) {
                  batch.delete(doc.ref);
              }
          });
          await batch.commit();
      } else if (validRowCount > 0) {
          await batch.commit();
      }

    } catch (error) {
      console.error("Sheet otomatik veri çekme hatası:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    syncWithSheets();
    const interval = setInterval(syncWithSheets, 5 * 60 * 1000); 
    return () => clearInterval(interval);
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
  const handleRequestDelete = async (id) => {
    if(window.confirm('Bu kayıt için silme onayı talep edilecek. Emin misiniz?')) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'education_tracking', id), { deleteRequested: true });
    }
  };
  const handleApproveDelete = async (id) => {
    if(window.confirm('Bu kaydı kalıcı olarak silmeyi onaylıyor musunuz?')) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'education_tracking', id));
    }
  };
  const handleRejectDelete = async (id) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'education_tracking', id), { deleteRequested: false });
  };

  const syncButton = currentUser?.canEdit ? (
    <button 
      onClick={syncWithSheets} 
      disabled={isSyncing}
      className={`flex items-center gap-1.5 px-3 py-1.5 ${isSyncing ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'} text-white text-sm font-medium rounded-md transition-colors`}
      title="Google Sheets'ten verileri zorla güncelle"
    >
        <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
        {isSyncing ? 'Eşitleniyor...' : 'E-Tablodan Çek ve Sıfırla'}
    </button>
  ) : null;

  return (
    <DataTable
      title="Eğitim Takip Listesi"
      columns={cols}
      data={data}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      onRequestDelete={handleRequestDelete}
      onApproveDelete={handleApproveDelete}
      onRejectDelete={handleRejectDelete}
      extraHeaderActions={syncButton}
      customRowClass={(row) => {
          if (row.deleteRequested) return 'bg-red-50 border-red-200';
          if (row.durum === 'Eğitmen Ayrıldı') return 'bg-blue-50 border-blue-200 text-blue-900';
          if (row.durum === 'Eğitim Beklemede') return 'bg-orange-50 border-orange-200 text-orange-900';
          if (row.durum === 'İptal') return 'bg-gray-100 border-gray-300 text-gray-700';
          if (row.durum === 'Yayında') return 'bg-green-50 border-green-200 text-green-900';
          return '';
      }}
      currentUser={currentUser}
    />
  );
};

const FilmingPage = ({ currentUser }) => {
  const [data, setData] = useState([]);
  
  const cols = [
    { key: 'egitimAdi', label: 'Eğitim Adı' },
    { key: 'modulAdi', label: 'Modül Adı' },
    { key: 'egitmen', label: 'Eğitmen Adı Soyadı' },
    { key: 'cekimSorumlusu', label: 'Çekim Sorumlusu', type: 'select', options: LOOKUPS.CEKIM_SORUMLUSU },
    { key: 'isikSorumlusu', label: 'Işık Sorumlusu', type: 'select', options: LOOKUPS.CEKIM_SORUMLUSU },
    { key: 'cekimBaslama', label: 'Çekim Başlama', type: 'date' },
    { key: 'onCekim', label: 'Ön Çekim', type: 'select', options: LOOKUPS.EVET_HAYIR },
    { key: 'onCekimTarihi', label: 'Ön Çekim Tarihi', type: 'date' },
    { key: 'izlence', label: 'İzlence (İçerik Uzm.)', type: 'select', options: LOOKUPS.ICERIK_UZMANI },
    { key: 'cekimDurumu', label: 'Çekim Durumu', type: 'select', options: LOOKUPS.CEKIM_DURUMU, sortable: true },
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
    { key: 'islemZamani', label: 'İşlem Tarih/Saati', readOnly: true },
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
    const islemZamani = new Date().toLocaleString('tr-TR');
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'filming_tracking'), { ...form, islemZamani, createdAt: serverTimestamp() });
  };
  const handleUpdate = async (id, form) => {
    const islemZamani = new Date().toLocaleString('tr-TR');
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'filming_tracking', id), { ...form, islemZamani, updatedAt: serverTimestamp() });
  };
  const handleDelete = async (id) => {
    if(window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'filming_tracking', id));
    }
  };
  const handleRequestDelete = async (id) => {
    if(window.confirm('Bu kayıt için silme onayı talep edilecek. Emin misiniz?')) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'filming_tracking', id), { deleteRequested: true });
    }
  };
  const handleApproveDelete = async (id) => {
    if(window.confirm('Bu kaydı kalıcı olarak silmeyi onaylıyor musunuz?')) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'filming_tracking', id));
    }
  };
  const handleRejectDelete = async (id) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'filming_tracking', id), { deleteRequested: false });
  };

  return (
    <DataTable
      title="Çekim Takip Listesi"
      columns={cols}
      data={data}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      onRequestDelete={handleRequestDelete}
      onApproveDelete={handleApproveDelete}
      onRejectDelete={handleRejectDelete}
      customRowClass={(row) => {
          if (row.deleteRequested) return 'bg-red-50 border-red-200';
          if (row.cekimDurumu === 'Bitti') return 'bg-green-50 border-green-200';
          return '';
      }}
      currentUser={currentUser}
    />
  );
};

const EditingPage = ({ currentUser }) => {
  const [data, setData] = useState([]);
  
  const cols = [
    { key: 'egitimAdi', label: 'Eğitim Adı' },
    { key: 'egitmen', label: 'Eğitmen Adı Soyadı' },
    { key: 'montajSorumlusu', label: 'Montaj Sorumlusu', type: 'select', options: LOOKUPS.MONTAJ_SORUMLUSU, sortable: true },
    { key: 'icerikUzmani', label: 'İçerik Uzmanı', type: 'select', options: LOOKUPS.ICERIK_UZMANI },
    { key: 'montajBaslama', label: 'Montaj Başlama', type: 'date' },
    { key: 'revize1', label: '1. Revize Tarihi', type: 'date' },
    { key: 'revize2', label: '2. Revize Tarihi', type: 'date' },
    { key: 'montajDurumu', label: 'Montaj Durumu', type: 'select', options: LOOKUPS.MONTAJ_DURUMU, sortable: true },
    { key: 'montajBitis', label: 'Montaj Bitiş', type: 'date' },
    { key: 'notlar', label: 'Ek Notlar' },
    { key: 'islemZamani', label: 'İşlem Tarih/Saati', readOnly: true },
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
    const islemZamani = new Date().toLocaleString('tr-TR');
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'editing_tracking'), { ...form, islemZamani, createdAt: serverTimestamp() });
  };
  const handleUpdate = async (id, form) => {
    const islemZamani = new Date().toLocaleString('tr-TR');
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'editing_tracking', id), { ...form, islemZamani, updatedAt: serverTimestamp() });
  };
  const handleDelete = async (id) => {
    if(window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'editing_tracking', id));
    }
  };
  const handleRequestDelete = async (id) => {
    if(window.confirm('Bu kayıt için silme onayı talep edilecek. Emin misiniz?')) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'editing_tracking', id), { deleteRequested: true });
    }
  };
  const handleApproveDelete = async (id) => {
    if(window.confirm('Bu kaydı kalıcı olarak silmeyi onaylıyor musunuz?')) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'editing_tracking', id));
    }
  };
  const handleRejectDelete = async (id) => {
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'editing_tracking', id), { deleteRequested: false });
  };

  return (
    <DataTable
      title="Montaj Takip Listesi"
      columns={cols}
      data={data}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      onRequestDelete={handleRequestDelete}
      onApproveDelete={handleApproveDelete}
      onRejectDelete={handleRejectDelete}
      customRowClass={(row) => {
          if (row.deleteRequested) return 'bg-red-50 border-red-200';
          if (row.montajDurumu === 'Bitti') return 'bg-green-50 border-green-200';
          return '';
      }}
      currentUser={currentUser}
    />
  );
};

const InstructorPage = ({ currentUser }) => {
    const [data, setData] = useState([]);
    
    const cols = [
        { key: 'egitmen', label: 'Eğitmen', sortable: true },
        { key: 'alan', label: 'Alan', type: 'select', options: LOOKUPS.ALAN, sortable: true },
        { key: 'calismaGunu', label: 'Çalışma Günü', type: 'multiselect', options: LOOKUPS.CALISMA_GUNLERI },
        { key: 'calismaSaati', label: 'Çalışma Saati', type: 'dynamicHours', dependsOn: 'calismaGunu', options: LOOKUPS.CALISMA_SAATLERI },
        { key: 'kursMerkezi', label: 'Kurs Merkezi' }, 
        { key: 'icerikGelistirme', label: 'İçerik Geliştirme Uzmanı', type: 'select', options: LOOKUPS.ICERIK_TAKIP, sortable: true },
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
    const handleRequestDelete = async (id) => {
        if(window.confirm('Bu kayıt için silme onayı talep edilecek. Emin misiniz?')) {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'instructor_management', id), { deleteRequested: true });
        }
    };
    const handleApproveDelete = async (id) => {
        if(window.confirm('Bu kaydı kalıcı olarak silmeyi onaylıyor musunuz?')) {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'instructor_management', id));
        }
    };
    const handleRejectDelete = async (id) => {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'instructor_management', id), { deleteRequested: false });
    };

    return (
        <DataTable
            title="Eğitmen Yönetimi"
            columns={cols}
            data={data}
            onAdd={handleAdd}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onRequestDelete={handleRequestDelete}
            onApproveDelete={handleApproveDelete}
            onRejectDelete={handleRejectDelete}
            customRowClass={(row) => row.deleteRequested ? 'bg-red-50 border-red-200' : ''}
            currentUser={currentUser}
        />
    );
};

const CalendarPage = ({ currentUser }) => {
  const canEditCalendar = currentUser?.id === 'manager' || currentUser?.id === 'education';
  const isReadOnly = !canEditCalendar;

  return (
    <div className="w-full h-full bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col relative">
      <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Calendar className="text-indigo-600"/> Stüdyo Çekim Takvimi
        {isReadOnly && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full ml-2">İzleme Modu</span>}
      </h2>
      
      <div className="flex-1 bg-gray-100 rounded-lg border border-gray-300 relative overflow-y-auto custom-scrollbar">
        <div className="relative w-full" style={{ height: '2400px' }}>
          
          {isReadOnly && (
             <div 
               className="absolute inset-0 z-10 cursor-not-allowed" 
               title="Sadece görüntüleme yetkiniz bulunmaktadır."
             ></div>
          )}
          
          <iframe 
            src="https://meuzem.github.io/uzem_studyo/"
            className="w-full h-full border-0 absolute top-0 left-0"
            title="Studio Calendar"
            scrolling="no"
            style={isReadOnly ? { pointerEvents: 'none' } : {}}
          />
        </div>
      </div>
    </div>
  );
};

const DashboardPage = ({ currentUser }) => {
  const [dashTab, setDashTab] = useState('genel');
  const [eduData, setEduData] = useState([]);
  const [filmData, setFilmData] = useState([]);
  const [editData, setEditData] = useState([]);

  useEffect(() => {
    if (!currentUser) return; 
    const unsub1 = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'education_tracking'), s => setEduData(s.docs.map(d=>d.data())));
    const unsub2 = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'filming_tracking'), s => setFilmData(s.docs.map(d=>d.data())));
    const unsub3 = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'editing_tracking'), s => setEditData(s.docs.map(d=>d.data())));
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [currentUser]);

  // --- 1. TAB: GENEL ÖZET VERİLERİ ---
  const inFilmingStatuses = ['Çekimde', 'Çekim Revize', 'Ekran Çekiminde'];
  const inFilming = eduData.filter(d => inFilmingStatuses.includes(d.durum)).length;
  const inEditing = editData.filter(d => d.montajDurumu !== 'Bitti').length;
  const published = eduData.filter(d => d.durum === 'Yayında').length;
  
  const PREPARING_STATUSES = [
    'Eğitim Planlanıyor', 'Eğitmen İçerik Hazırlıyor', 'Ekran Çekiminde',
    'Etkileşimli İçerik Hazırlanıyor', 'Çekim Bekliyor', 'Çekim Bitti', 'İçerik Bitti',
    'Ses Çekimi Bekleniyor', 'İçerik Kontrolü', 'İçerik Revize',
    'Montaj Sırasında', 'Etkileşimli İçerik Sırasında', 'ID Bekliyor',
    'İYS Aşamasında', 'ÖYS Aşamasında', 'Animasyon Programı Bekliyor'
  ];
  const hazirlanan = eduData.filter(d => PREPARING_STATUSES.includes(d.durum)).length;
  
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
      label: 'Sayı',
      data: [inFilming, inEditing, published, hazirlanan],
      backgroundColor: ['#f97316', '#8b5cf6', '#22c55e', '#64748b'],
    }]
  };

  // --- 2. TAB: DETAYLI RAPORLAR VERİLERİ ---
  const cekimBekleyenler = useMemo(() => eduData.filter(d => d.durum === 'Çekim Bekliyor'), [eduData]);
  const montajBekleyenler = useMemo(() => eduData.filter(d => d.durum === 'Montaj Sırasında'), [eduData]);
  
  const egitmenCounts = useMemo(() => {
      const counts = {};
      eduData.forEach(d => {
          const egitmen = d.egitmen?.trim();
          if (egitmen) counts[egitmen] = (counts[egitmen] || 0) + 1;
      });
      return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [eduData]);

  const alanStats = useMemo(() => {
      const stats = {};
      eduData.forEach(d => {
          const alan = d.alan?.trim();
          if (!alan) return;
          if (!stats[alan]) stats[alan] = { yayinda: 0, hazirlanan: 0 };
          if (d.durum === 'Yayında') stats[alan].yayinda++;
          else if (PREPARING_STATUSES.includes(d.durum)) stats[alan].hazirlanan++;
      });
      return stats;
  }, [eduData]);

  const dalStats = useMemo(() => {
      const stats = {};
      eduData.forEach(d => {
          const dal = d.dal?.trim();
          if (!dal) return;
          if (!stats[dal]) stats[dal] = { yayinda: 0, hazirlanan: 0 };
          if (d.durum === 'Yayında') stats[dal].yayinda++;
          else if (PREPARING_STATUSES.includes(d.durum)) stats[dal].hazirlanan++;
      });
      return stats;
  }, [eduData]);

  const alanChartData = {
      labels: Object.keys(alanStats),
      datasets: [
          { label: 'Yayında', data: Object.values(alanStats).map(s => s.yayinda), backgroundColor: '#22c55e' },
          { label: 'Hazırlanan', data: Object.values(alanStats).map(s => s.hazirlanan), backgroundColor: '#f97316' }
      ]
  };

  const dalChartData = {
      labels: Object.keys(dalStats),
      datasets: [
          { label: 'Yayında', data: Object.values(dalStats).map(s => s.yayinda), backgroundColor: '#22c55e' },
          { label: 'Hazırlanan', data: Object.values(dalStats).map(s => s.hazirlanan), backgroundColor: '#f97316' }
      ]
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent overflow-hidden">
      
      {/* Üst Sekmeler */}
      <div className="flex gap-6 mb-4 px-2 border-b border-gray-300 shrink-0">
         <button 
            onClick={() => setDashTab('genel')} 
            className={`pb-2 text-sm font-bold transition-colors ${dashTab === 'genel' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
         >
            Genel Özet
         </button>
         <button 
            onClick={() => setDashTab('raporlar')} 
            className={`pb-2 text-sm font-bold transition-colors ${dashTab === 'raporlar' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
         >
            Detaylı Raporlar
         </button>
      </div>

      {/* Yana Kaydırmalı Kapsayıcı */}
      <div className="flex-1 relative w-full overflow-hidden">
         <div 
            className="absolute top-0 left-0 h-full flex transition-transform duration-500 ease-in-out w-[200%]"
            style={{ transform: dashTab === 'genel' ? 'translateX(0)' : 'translateX(-50%)' }}
         >
            
            {/* 1. SEKM: GENEL ÖZET */}
            <div className="w-1/2 h-full overflow-y-auto custom-scrollbar px-2 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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

            {/* 2. SEKM: DETAYLI RAPORLAR */}
            <div className="w-1/2 h-full overflow-y-auto custom-scrollbar px-2 pb-6 space-y-6">
                
                {/* Bekleyen İşler Kartları */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-red-50 to-white p-4 rounded-xl shadow-sm border border-red-100 flex items-center justify-between">
                    <div>
                        <div className="text-red-800 text-xs font-bold uppercase">Çekim Bekleyen Eğitim</div>
                        <div className="text-3xl font-bold text-red-600 mt-1">{cekimBekleyenler.length}</div>
                    </div>
                    <Clock size={32} className="text-red-200" />
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl shadow-sm border border-blue-100 flex items-center justify-between">
                    <div>
                        <div className="text-blue-800 text-xs font-bold uppercase">Montaj Bekleyen Eğitim</div>
                        <div className="text-3xl font-bold text-blue-600 mt-1">{montajBekleyenler.length}</div>
                    </div>
                    <Clock size={32} className="text-blue-200" />
                  </div>
                </div>

                {/* Listeler (İki Kolon) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Bekleyen Eğitimler Listesi */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[350px]">
                        <div className="p-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                            <h3 className="text-sm font-bold text-gray-800">Bekleyen Eğitimler Listesi</h3>
                        </div>
                        <div className="flex-1 overflow-auto p-2">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b text-gray-500">
                                        <th className="py-2 px-1 font-semibold">Eğitim Adı</th>
                                        <th className="py-2 px-1 font-semibold">Eğitmen</th>
                                        <th className="py-2 px-1 font-semibold">Aşama</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...cekimBekleyenler, ...montajBekleyenler].map(item => (
                                        <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                                            <td className="py-2 px-1 truncate max-w-[150px]" title={item.egitim}>{item.egitim}</td>
                                            <td className="py-2 px-1 text-gray-600">{item.egitmen || '-'}</td>
                                            <td className="py-2 px-1">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.durum === 'Çekim Bekliyor' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {item.durum}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {cekimBekleyenler.length === 0 && montajBekleyenler.length === 0 && (
                                        <tr><td colSpan="3" className="text-center py-4 text-gray-400">Bekleyen kayıt yok</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Eğitmen Performans Raporu */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[350px]">
                        <div className="p-3 border-b border-gray-100 bg-gray-50 rounded-t-xl flex justify-between items-center">
                            <h3 className="text-sm font-bold text-gray-800">Eğitmen Performans Raporu</h3>
                            <UserCheck size={16} className="text-indigo-400" />
                        </div>
                        <div className="flex-1 overflow-auto p-2">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b text-gray-500">
                                        <th className="py-2 px-2 font-semibold">Eğitmen Adı</th>
                                        <th className="py-2 px-2 font-semibold text-center w-24">Eğitim Sayısı</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {egitmenCounts.map(([isim, count]) => (
                                        <tr key={isim} className="border-b border-gray-50 hover:bg-gray-50">
                                            <td className="py-2 px-2 font-medium text-gray-700">{isim}</td>
                                            <td className="py-2 px-2 text-center">
                                                <span className="bg-indigo-100 text-indigo-800 py-0.5 px-2 rounded-full font-bold">{count}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Grafikler (Alan ve Dal) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 h-[350px] flex flex-col">
                    <h3 className="text-sm font-bold text-gray-700 mb-4">Alanlara Göre Eğitim Dağılımı</h3>
                    <div className="flex-1 relative w-full">
                      <Bar data={alanChartData} options={{ maintainAspectRatio: false, responsive: true, scales: { x: { stacked: true }, y: { stacked: true } } }} />
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 h-[350px] flex flex-col">
                    <h3 className="text-sm font-bold text-gray-700 mb-4">Dallara Göre Eğitim Dağılımı</h3>
                    <div className="flex-1 relative w-full">
                      <Bar data={dalChartData} options={{ maintainAspectRatio: false, responsive: true, scales: { x: { stacked: true }, y: { stacked: true } } }} />
                    </div>
                  </div>
                </div>

                {/* 
                   ÖZEL KURAL UYGULAMASI: 
                   "Her alanı ayrı bir başlık altında raporlamak zorundadır" kuralını yerine getiren Alan Raporlama Izgarası 
                */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-700 mb-4">Alan Bazlı Detaylı Dağılım Raporu</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Object.entries(alanStats).map(([alanAdi, stats]) => (
                            <div key={alanAdi} className="p-3 border border-indigo-100 bg-indigo-50/30 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                <h4 className="font-bold text-xs text-indigo-800 mb-2 border-b border-indigo-200 pb-1 h-8 overflow-hidden">{alanAdi}</h4>
                                <div className="flex justify-between text-xs text-gray-600 mt-2">
                                    <span className="flex flex-col items-center">Yayında <strong className="text-green-600 text-sm">{stats.yayinda}</strong></span>
                                    <span className="flex flex-col items-center">Hazırlanan <strong className="text-orange-500 text-sm">{stats.hazirlanan}</strong></span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

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
        <main className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col h-full w-full">
          {activeTab === 'dashboard' && <DashboardPage currentUser={userRole} />}
          {activeTab === 'education' && <EducationPage currentUser={userRole} />}
          {activeTab === 'filming' && <FilmingPage currentUser={userRole} />}
          {activeTab === 'editing' && <EditingPage currentUser={userRole} />}
          {activeTab === 'calendar' && <CalendarPage currentUser={userRole} />}
          {activeTab === 'instructors' && <InstructorPage currentUser={userRole} />}
        </main>
      </div>
    </div>
  );
}
