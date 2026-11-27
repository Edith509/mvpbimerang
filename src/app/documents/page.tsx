'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  FolderArchive,
  Search,
  Plus,
  Upload,
  FileText,
  FileImage,
  Download,
  Eye,
  Trash2,
  Edit3,
  X,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Receipt,
  CreditCard,
  Shield,
  FileSignature,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { DocumentCategory, StoredDocument } from '@/types';

/* ── Category configurations ───────────────────────────────── */
const CATEGORIES: {
  id: DocumentCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeColor: string;
  bgLight: string;
  description: string;
}[] = [
  {
    id: 'receipts',
    label: 'Чеки и квитанции',
    icon: Receipt,
    badgeColor: 'text-amber-700 bg-amber-50 border-amber-200/80',
    bgLight: 'bg-amber-500/10 text-amber-600',
    description: 'Кассовые чеки, топливные квитанции, отчёты водителей и терминальные слипы',
  },
  {
    id: 'driver_licenses',
    label: 'Водительские удостоверения',
    icon: CreditCard,
    badgeColor: 'text-blue-700 bg-blue-50 border-blue-200/80',
    bgLight: 'bg-blue-500/10 text-blue-600',
    description: 'Права водителей категорий D, D1, DE, международные карты водителя',
  },
  {
    id: 'passports',
    label: 'Паспорта',
    icon: User,
    badgeColor: 'text-purple-700 bg-purple-50 border-purple-200/80',
    bgLight: 'bg-purple-500/10 text-purple-600',
    description: 'Паспорта экипажа, заграничные паспорта и визовые страницы',
  },
  {
    id: 'warranty',
    label: 'Гарантийные документы',
    icon: Shield,
    badgeColor: 'text-orange-700 bg-orange-50 border-orange-200/80',
    bgLight: 'bg-orange-500/10 text-orange-600',
    description: 'Талоны на агрегаты, гарантия на ремонт узлов, двигателей и электроники',
  },
  {
    id: 'contracts',
    label: 'Договоры',
    icon: FileSignature,
    badgeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200/80',
    bgLight: 'bg-indigo-500/10 text-indigo-600',
    description: 'Договоры аренды стоянок, вокзалов, корпоративного сервиса и поставок',
  },
  {
    id: 'insurance',
    label: 'Страховые документы',
    icon: FileCheck,
    badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200/80',
    bgLight: 'bg-emerald-500/10 text-emerald-600',
    description: 'Полисы ОСАГО, КАСКО, страхование ответственности перевозчика перед пассажирами',
  },
  {
    id: 'other',
    label: 'Прочие документы',
    icon: Layers,
    badgeColor: 'text-slate-700 bg-slate-100 border-slate-200/80',
    bgLight: 'bg-slate-500/10 text-slate-600',
    description: 'Акты санитарной обработки, сертификаты, регламенты и служебные инструкции',
  },
];

const CATEGORY_MAP = new Map(CATEGORIES.map((c) => [c.id, c]));

/* ── Allowed format validation ─────────────────────────────── */
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'webp', 'heic'];
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileType(extension: string): 'pdf' | 'word' | 'image' {
  const ext = extension.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'doc' || ext === 'docx') return 'word';
  return 'image';
}

export default function DocumentsPage() {
  const { documents, addDocument, updateDocument, deleteDocument, currentUser } = useApp();

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<'all' | 'pdf' | 'word' | 'image'>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'title_asc' | 'size_desc'>('date_desc');

  // Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<StoredDocument | null>(null);
  const [editingDoc, setEditingDoc] = useState<StoredDocument | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<StoredDocument | null>(null);

  // Notifications
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Upload Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDataUrl, setUploadDataUrl] = useState<string>('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('contracts');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Form State
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<DocumentCategory>('contracts');
  const [editDescription, setEditDescription] = useState('');

  // Handle file selection & validation
  const processSelectedFile = (file: File) => {
    setUploadError(null);
    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setUploadError(
        `Формат «.${extension}» не поддерживается. Разрешена загрузка исключительно файлов: PDF (.pdf), Word (.doc, .docx) и изображений (.jpg, .png, .webp, .heic).`
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError(`Размер файла (${formatBytes(file.size)}) превышает лимит 15 МБ.`);
      return;
    }

    setUploadFile(file);
    if (!uploadTitle.trim()) {
      // Auto-populate title from file name without extension
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      // Clean up underscores and dashes for neat title
      const cleanedName = baseName.replace(/[-_]/g, ' ').trim();
      setUploadTitle(cleanedName.charAt(0).toUpperCase() + cleanedName.slice(1));
    }

    // Read preview dataUrl
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadDataUrl((e.target?.result as string) || '');
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleSaveUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Пожалуйста, выберите файл для загрузки.');
      return;
    }
    if (!uploadTitle.trim()) {
      setUploadError('Укажите название документа.');
      return;
    }

    const extension = uploadFile.name.split('.').pop()?.toLowerCase() || '';
    const fileType = getFileType(extension);
    const catConfig = CATEGORY_MAP.get(uploadCategory);

    addDocument({
      title: uploadTitle.trim(),
      category: uploadCategory,
      categoryLabel: catConfig?.label || 'Документ',
      fileName: uploadFile.name,
      fileSize: formatBytes(uploadFile.size),
      fileSizeBytes: uploadFile.size,
      fileType,
      fileExtension: extension,
      mimeType: uploadFile.type || 'application/octet-stream',
      dataUrl: uploadDataUrl,
      description: uploadDescription.trim(),
      uploadedBy: currentUser ? `${currentUser.name} (${currentUser.roleLabel})` : 'Администратор',
    });

    // Reset form
    setUploadFile(null);
    setUploadDataUrl('');
    setUploadTitle('');
    setUploadDescription('');
    setUploadError(null);
    setUploadModalOpen(false);
    showToast('success', `Документ «${uploadTitle.trim()}» успешно добавлен в архив.`);
  };

  // Open Edit Modal
  const handleOpenEdit = (doc: StoredDocument) => {
    setEditingDoc(doc);
    setEditTitle(doc.title);
    setEditCategory(doc.category);
    setEditDescription(doc.description || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    if (!editTitle.trim()) {
      showToast('error', 'Название документа не может быть пустым.');
      return;
    }

    const catConfig = CATEGORY_MAP.get(editCategory);
    updateDocument(editingDoc.id, {
      title: editTitle.trim(),
      category: editCategory,
      categoryLabel: catConfig?.label || editingDoc.categoryLabel,
      description: editDescription.trim(),
    });

    setEditingDoc(null);
    showToast('success', `Сведения о документе «${editTitle.trim()}» обновлены.`);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!deletingDoc) return;
    deleteDocument(deletingDoc.id);
    showToast('success', `Документ «${deletingDoc.title}» удалён из архива.`);
    setDeletingDoc(null);
    if (previewDoc?.id === deletingDoc.id) {
      setPreviewDoc(null);
    }
  };

  // Download handler
  const handleDownload = (doc: StoredDocument) => {
    if (doc.dataUrl) {
      const link = document.createElement('a');
      link.href = doc.dataUrl;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Create text blob for simulated download of demo doc
      const content = `Документ: ${doc.title}\nКатегория: ${doc.categoryLabel}\nФайл: ${doc.fileName}\nДата загрузки: ${doc.uploadedAt}\nЗагрузил: ${doc.uploadedBy}\n\nОписание:\n${doc.description || 'Нет примечаний'}\n\nООО «Бумеранг Транс Лайн» — Официальный архив компании.`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.fileName.endsWith('.txt') ? doc.fileName : `${doc.fileName}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    showToast('success', `Файл «${doc.fileName}» скачан на устройство.`);
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: documents.length };
    CATEGORIES.forEach((c) => {
      counts[c.id] = documents.filter((d) => d.category === c.id).length;
    });
    return counts;
  }, [documents]);

  // Filtered & Sorted documents
  const filteredDocuments = useMemo(() => {
    let result = [...documents];

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter((d) => d.category === selectedCategory);
    }

    // Format filter
    if (formatFilter !== 'all') {
      result = result.filter((d) => d.fileType === formatFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.fileName.toLowerCase().includes(q) ||
          (d.description && d.description.toLowerCase().includes(q)) ||
          d.categoryLabel.toLowerCase().includes(q) ||
          d.uploadedBy.toLowerCase().includes(q)
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'title_asc') {
        return a.title.localeCompare(b.title, 'ru');
      }
      if (sortBy === 'size_desc') {
        return b.fileSizeBytes - a.fileSizeBytes;
      }
      if (sortBy === 'date_asc') {
        return a.id.localeCompare(b.id);
      }
      // date_desc (default)
      return b.id.localeCompare(a.id);
    });

    return result;
  }, [documents, selectedCategory, formatFilter, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white shadow-xl shadow-slate-900/20 text-sm font-medium animate-in fade-in slide-in-from-bottom-4 duration-200">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-8 space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-600 mb-1">
              <FolderArchive className="w-4 h-4" />
              <span>Архив и документооборот</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
              Документы компании
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Единое хранилище и оперативный учет договоров, страховых полисов, водительских удостоверений, чеков и актов автопарка.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setUploadError(null);
                setUploadFile(null);
                setUploadDataUrl('');
                setUploadTitle('');
                setUploadDescription('');
                setUploadModalOpen(true);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-medium rounded-xl shadow-sm shadow-red-500/20 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Загрузить документ</span>
            </button>
          </div>
        </div>

        {/* Quick Category Summary Cards (Adaptive Carousel on Mobile, Grid on Tablet/Desktop) */}
        <div className="flex sm:grid gap-2.5 overflow-x-auto pb-2 -mx-3.5 px-3.5 sm:mx-0 sm:px-0 sm:grid-cols-4 lg:grid-cols-7 sm:overflow-visible sm:pb-0 category-scrollbar">
          {CATEGORIES.map((cat) => {
            const count = categoryCounts[cat.id] || 0;
            const isSelected = selectedCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(isSelected ? 'all' : cat.id)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between shrink-0 w-38 sm:w-auto ${
                  isSelected
                    ? 'bg-red-50/50 border-red-500 ring-2 ring-red-500/10 shadow-sm'
                    : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cat.bgLight}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {count}
                  </span>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-800 line-clamp-1 leading-snug">
                    {cat.label}
                  </h3>
                </div>
              </button>
            );
          })}
        </div>

        {/* Search, Filter & View Controls */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs space-y-3 sm:space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-full lg:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию, файлу, описанию или автору..."
                className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Format Filter Chips & Sort Select */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
              <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl text-xs font-medium text-slate-600 overflow-x-auto max-w-full category-scrollbar">
                <button
                  onClick={() => setFormatFilter('all')}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all shrink-0 cursor-pointer ${
                    formatFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'hover:text-slate-900'
                  }`}
                >
                  Все форматы
                </button>
                <button
                  onClick={() => setFormatFilter('pdf')}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                    formatFilter === 'pdf' ? 'bg-white text-red-600 shadow-xs font-semibold' : 'hover:text-slate-900'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  PDF
                </button>
                <button
                  onClick={() => setFormatFilter('word')}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                    formatFilter === 'word' ? 'bg-white text-blue-600 shadow-xs font-semibold' : 'hover:text-slate-900'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  Word
                </button>
                <button
                  onClick={() => setFormatFilter('image')}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                    formatFilter === 'image' ? 'bg-white text-emerald-600 shadow-xs font-semibold' : 'hover:text-slate-900'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Фото
                </button>
              </div>

              {/* Sort Selector */}
              <div className="relative shrink-0 w-full sm:w-auto">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full sm:w-auto appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors cursor-pointer"
                >
                  <option value="date_desc">Сначала новые</option>
                  <option value="date_asc">Сначала старые</option>
                  <option value="title_asc">По названию (А–Я)</option>
                  <option value="size_desc">По размеру файла</option>
                </select>
                <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Active Category Pill Bar */}
          <div className="flex items-center gap-2 pt-2.5 pb-3 border-t border-slate-100 overflow-x-auto text-xs category-scrollbar -mx-1 px-1">
            <span className="text-slate-400 font-medium shrink-0">Категория:</span>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full font-medium transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-red-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Все ({categoryCounts.all})
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1 rounded-full font-medium transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                  selectedCategory === c.id
                    ? 'bg-red-600 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c.label} ({categoryCounts[c.id] || 0})
              </button>
            ))}
          </div>
        </div>

        {/* Documents Grid / Empty State */}
        {filteredDocuments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-xs">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <FolderArchive className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">
              Документы не найдены
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-5 sm:mb-6">
              {searchQuery || selectedCategory !== 'all' || formatFilter !== 'all'
                ? 'По заданным параметрам поиска и фильтрации ничего не найдено. Попробуйте сбросить фильтры.'
                : 'В архиве пока нет сохраненных документов. Вы можете загрузить первый документ прямо сейчас.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
              {(searchQuery || selectedCategory !== 'all' || formatFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setFormatFilter('all');
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium rounded-xl transition-colors cursor-pointer"
                >
                  Сбросить фильтры
                </button>
              )}
              <button
                onClick={() => {
                  setUploadError(null);
                  setUploadFile(null);
                  setUploadDataUrl('');
                  setUploadTitle('');
                  setUploadDescription('');
                  setUploadModalOpen(true);
                }}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-medium rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Загрузить документ</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
            {filteredDocuments.map((doc) => {
              const catConfig = CATEGORY_MAP.get(doc.category);
              const isWord = doc.fileType === 'word';
              const isPdf = doc.fileType === 'pdf';
              const isImg = doc.fileType === 'image';

              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Category badge & File format badge */}
                    <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-3">
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border max-w-[190px] truncate ${
                          catConfig?.badgeColor || 'text-slate-600 bg-slate-100 border-slate-200'
                        }`}
                      >
                        {doc.categoryLabel}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0 ${
                          isPdf
                            ? 'bg-red-100 text-red-700'
                            : isWord
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {doc.fileExtension.toUpperCase()}
                      </span>
                    </div>

                    {/* File Icon + Title */}
                    <div className="flex items-start gap-2.5 sm:gap-3 mb-2.5">
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl shrink-0 flex items-center justify-center ${
                          isPdf
                            ? 'bg-red-50 text-red-600'
                            : isWord
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-emerald-50 text-emerald-600'
                        }`}
                      >
                        {isPdf ? (
                          <FileText className="w-5 h-5" />
                        ) : isWord ? (
                          <FileText className="w-5 h-5" />
                        ) : (
                          <FileImage className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3
                          className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-2 leading-snug break-words cursor-pointer"
                          onClick={() => setPreviewDoc(doc)}
                          title={doc.title}
                        >
                          {doc.title}
                        </h3>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5" title={doc.fileName}>
                          {doc.fileName} · {doc.fileSize}
                        </p>
                      </div>
                    </div>

                    {/* Description or Notes */}
                    {doc.description && (
                      <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-2 mb-3 bg-slate-50/80 p-2 sm:p-2.5 rounded-xl border border-slate-100 break-words">
                        {doc.description}
                      </p>
                    )}
                  </div>

                  {/* Card Footer: Metadata & Actions */}
                  <div className="pt-2.5 sm:pt-3 border-t border-slate-100 mt-2 space-y-2 sm:space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 gap-1.5 min-w-0">
                      <div className="flex items-center gap-1 shrink-0" title={doc.uploadedAt}>
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{doc.uploadedAt}</span>
                      </div>
                      <div className="flex items-center gap-1 min-w-0 truncate" title={doc.uploadedBy}>
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{doc.uploadedBy.split(' ')[0]}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="flex-1 min-w-0 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                        title="Предварительный просмотр"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        <span className="truncate">Просмотр</span>
                      </button>

                      <button
                        onClick={() => handleDownload(doc)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-lg transition-colors shrink-0 cursor-pointer"
                        title="Скачать документ"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenEdit(doc)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-lg transition-colors shrink-0 cursor-pointer"
                        title="Редактировать данные"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeletingDoc(doc)}
                        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 active:bg-red-100 rounded-lg transition-colors shrink-0 cursor-pointer"
                        title="Удалить"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* Upload Document Modal (with Drag & Drop + strict validation) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 sm:p-7 shadow-2xl border border-slate-200/80 space-y-4 sm:space-y-5 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">Загрузка документа</h2>
                  <p className="text-[11px] sm:text-xs text-slate-500 truncate">Добавление документа в защищенный архив компании</p>
                </div>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Notification */}
            {uploadError && (
              <div className="p-3 sm:p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 sm:gap-3 text-xs text-rose-800 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{uploadError}</div>
              </div>
            )}

            <form onSubmit={handleSaveUpload} className="space-y-3.5 sm:space-y-4">
              {/* Drag and Drop Upload Zone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Файл документа <span className="text-red-500">*</span>
                </label>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 sm:p-6 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-red-500 bg-red-50/50 scale-[1.01]'
                      : uploadFile
                      ? 'border-emerald-400 bg-emerald-50/30'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.heic"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  {uploadFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <FileCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {uploadFile.name}
                        </p>
                        <p className="text-[11px] sm:text-xs text-emerald-700 font-medium">
                          {formatBytes(uploadFile.size)} · Готов к сохранению
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadFile(null);
                          setUploadDataUrl('');
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white transition-colors shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
                        <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="text-xs sm:text-sm">
                        <span className="font-semibold text-red-600 hover:underline">
                          Выберите файл
                        </span>
                        <span className="text-slate-500"> или перетащите его сюда</span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-400">
                        Поддерживаются: PDF, Word (.doc, .docx), фото (.jpg, .png, .webp, .heic) до 15 МБ
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Title input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Название документа <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Например: Договор аренды стоянки №42"
                  className="w-full px-3 sm:px-3.5 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
                />
              </div>

              {/* Category selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Категория <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => {
                    const isSelected = uploadCategory === cat.id;
                    const Icon = cat.icon;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setUploadCategory(cat.id)}
                        className={`p-2 sm:p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 sm:gap-2.5 ${
                          isSelected
                            ? 'bg-red-50/60 border-red-500 text-slate-900 ring-1 ring-red-500/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cat.bgLight}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-medium leading-tight truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description / Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Описание или примечание
                </label>
                <textarea
                  rows={2}
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Дополнительные детали: срок действия, номер ТС, условия..."
                  className="w-full px-3 sm:px-3.5 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium rounded-xl transition-colors cursor-pointer text-center"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile}
                  className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-medium rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Сохранить в архив</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* Preview Modal (PDF / Images / Word Documents)               */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start sm:items-center justify-between p-3.5 sm:p-5 border-b border-slate-100 bg-white gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                      CATEGORY_MAP.get(previewDoc.category)?.badgeColor || 'text-slate-600 bg-slate-100'
                    }`}
                  >
                    {previewDoc.categoryLabel}
                  </span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-500 font-medium">{previewDoc.fileSize}</span>
                </div>
                <h2 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 line-clamp-2 leading-snug" title={previewDoc.title}>
                  {previewDoc.title}
                </h2>
              </div>
              <div className="flex items-center gap-2 shrink-0 pt-0.5 sm:pt-0">
                <button
                  onClick={() => handleDownload(previewDoc)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Скачать</span>
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Viewer Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-100/70 flex items-center justify-center">
              {previewDoc.fileType === 'image' ? (
                <div className="max-w-full max-h-[55vh] sm:max-h-[65vh] flex items-center justify-center">
                  {previewDoc.dataUrl ? (
                    <img
                      src={previewDoc.dataUrl}
                      alt={previewDoc.title}
                      className="max-h-[55vh] sm:max-h-[65vh] w-auto object-contain rounded-xl shadow-lg border border-slate-200 bg-white"
                    />
                  ) : (
                    <div className="p-6 sm:p-8 text-center bg-white rounded-2xl shadow-sm border border-slate-200">
                      <FileImage className="w-12 h-12 sm:w-16 sm:h-16 text-slate-400 mx-auto mb-3" />
                      <p className="text-xs sm:text-sm font-semibold text-slate-800">{previewDoc.fileName}</p>
                      <p className="text-[11px] sm:text-xs text-slate-400 mt-1">Изображение доступно для скачивания</p>
                    </div>
                  )}
                </div>
              ) : previewDoc.fileType === 'pdf' ? (
                <div className="w-full max-w-2xl">
                  {previewDoc.dataUrl ? (
                    <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-white flex justify-center">
                      <img
                        src={previewDoc.dataUrl}
                        alt={previewDoc.title}
                        className="max-h-[55vh] sm:max-h-[65vh] w-auto object-contain"
                      />
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl p-6 sm:p-8 text-center shadow-md border border-slate-200">
                      <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-3" />
                      <h4 className="text-sm sm:text-base font-bold text-slate-900">{previewDoc.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 mb-4">{previewDoc.fileName} · Документ PDF</p>
                      <button
                        onClick={() => handleDownload(previewDoc)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Скачать PDF-файл
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Word Document (.doc, .docx) */
                <div className="bg-white rounded-2xl p-5 sm:p-8 text-center shadow-md border border-slate-200 max-w-md w-full">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-xs">
                    <FileText className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-blue-100 text-blue-700">
                    Microsoft Word (.docx)
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 mt-2.5 sm:mt-3 mb-1">
                    {previewDoc.title}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 mb-3 sm:mb-4">{previewDoc.fileName} · {previewDoc.fileSize}</p>

                  <div className="text-left bg-slate-50 rounded-xl p-3 mb-4 border border-slate-100 text-[11px] sm:text-xs text-slate-600 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Категория:</span>
                      <span className="font-semibold text-slate-800">{previewDoc.categoryLabel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Загружен:</span>
                      <span className="text-slate-700">{previewDoc.uploadedAt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Автор:</span>
                      <span className="text-slate-700 truncate max-w-[180px] sm:max-w-[200px]">{previewDoc.uploadedBy}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownload(previewDoc)}
                    className="w-full py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl inline-flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Скачать файл Word на устройство
                  </button>
                </div>
              )}
            </div>

            {/* Description & Details footer */}
            {previewDoc.description && (
              <div className="p-3 sm:p-4 bg-white border-t border-slate-100 text-[11px] sm:text-xs text-slate-600 break-words">
                <span className="font-semibold text-slate-800">Примечание: </span>
                {previewDoc.description}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* Edit Document Modal                                         */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 sm:p-7 shadow-2xl border border-slate-200/80 space-y-4 sm:space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">Редактирование документа</h2>
                  <p className="text-[11px] sm:text-xs text-slate-500 truncate">{editingDoc.fileName}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingDoc(null)}
                className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 sm:space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Название документа <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 sm:px-3.5 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Категория <span className="text-red-500">*</span>
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as DocumentCategory)}
                  className="w-full px-3 sm:px-3.5 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Описание или примечание
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 sm:px-3.5 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors resize-none"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium rounded-xl transition-colors cursor-pointer text-center"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-medium rounded-xl shadow-xs transition-colors cursor-pointer text-center"
                >
                  Сохранить изменения
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* Delete Confirmation Modal (с подтверждением действия)        */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {deletingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-200/80 space-y-3.5 sm:space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Удалить документ?</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed break-words">
                Вы действительно хотите удалить документ{' '}
                <span className="font-semibold text-slate-800">«{deletingDoc.title}»</span> ({deletingDoc.fileName})? Это действие нельзя отменить.
              </p>
            </div>

            <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500 space-y-1">
              <div>Категория: <span className="font-medium text-slate-700">{deletingDoc.categoryLabel}</span></div>
              <div>Размер файла: <span className="font-medium text-slate-700">{deletingDoc.fileSize}</span></div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingDoc(null)}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium rounded-xl transition-colors cursor-pointer text-center"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-medium rounded-xl shadow-xs transition-colors cursor-pointer text-center"
              >
                Удалить документ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
