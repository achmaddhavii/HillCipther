/**
 * Kalkulator Hill Cipher - Alat Edukasi Profesional
 * @license Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  RefreshCw, 
  Copy, 
  Download, 
  CheckCircle2, 
  Info,
  ChevronDown,
  LayoutGrid,
  Hash,
  Lightbulb,
  AlertCircle,
  HelpCircle,
  Moon,
  Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  mod, 
  charToNum, 
  numToChar, 
  getDeterminant, 
  modInverse, 
  getAdjugate, 
  getMatrixInverse, 
  multiplyMatrixVector,
  MatrixStep,
} from './hillCipher';

const Tooltip = ({ title, content, children }: { title: string; content: string; children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center gap-1">
      <span 
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="underline decoration-dotted decoration-indigo-300 underline-offset-4 cursor-help hover:text-indigo-600 transition-colors"
      >
        {children}
      </span>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 pointer-events-none"
          >
            <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <HelpCircle size={10} /> {title}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {content}
            </p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-slate-800 border-r border-b border-slate-200 dark:border-slate-700 rotate-45 -mt-1.5"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
};

export default function App() {
  const [text, setText] = useState('HELLOWORLD');
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [matrixSize, setMatrixSize] = useState<number>(2);
  const [matrix, setMatrix] = useState<number[][]>([[3, 3], [2, 5]]);
  const [showDetails, setShowDetails] = useState(true);
  const [steps, setSteps] = useState<MatrixStep[]>([]);
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const size = matrixSize;
    let newMatrix: number[][] = [];
    if (size === 2) newMatrix = [[3, 3], [2, 5]];
    else if (size === 3) newMatrix = [[6, 24, 1], [13, 16, 10], [20, 17, 15]];
    else if (size === 4) newMatrix = [[3, 10, 20, 1], [15, 2, 19, 5], [7, 8, 1, 10], [1, 2, 3, 4]];
    else newMatrix = Array(size).fill(0).map((_, i) => Array(size).fill(0).map((_, j) => (i === j ? 1 : 0)));
    setMatrix(newMatrix);
  }, [matrixSize]);

  const handleMatrixChange = (r: number, c: number, val: string) => {
    const num = parseInt(val) || 0;
    const newMatrix = matrix.map((row, ri) => row.map((colVal, ci) => (ri === r && ci === c ? num : colVal)));
    setMatrix(newMatrix);
  };

  const calculate = () => {
    setError(null);
    const generatedSteps: MatrixStep[] = [];
    const n = matrixSize;

    if (!text.trim()) {
      setError("Input teks tidak boleh kosong.");
      return;
    }

    const det = getDeterminant(matrix);
    const detMod26 = mod(det, 26);
    const detInv = modInverse(detMod26, 26);

    if (mode === 'decrypt' && detInv === -1) {
      setError(`Matriks tidak memiliki invers pada mod 26 (Determinan mod 26 = ${detMod26}). GCD(${detMod26}, 26) harus 1.`);
      return;
    }

    // LANGKAH 1: PREPROCESSING
    const processed = text.toUpperCase().replace(/[^A-Z]/g, '');
    generatedSteps.push({
      title: 'LANGKAH 1: PREPROCESSING',
      description: 'Membersihkan teks dari spasi dan karakter non-alfabet, lalu mengubahnya menjadi huruf kapital.',
      result: processed,
      type: 'text'
    });

    // LANGKAH 2: KONVERSI HURUF KE ANGKA
    const numbers = processed.split('').map(c => charToNum(c));
    generatedSteps.push({
      title: 'LANGKAH 2: KONVERSI HURUF KE ANGKA',
      description: 'Memetakan setiap huruf ke posisi indeksnya dalam alfabet (A=0, B=1, ... Z=25).',
      result: `[${numbers.join(', ')}]`,
      type: 'mapping'
    });

    // LANGKAH 3: PEMBAGIAN BLOK
    let blocks: number[] = [...numbers];
    const paddingNeeded = (n - (blocks.length % n)) % n;
    let paddingDesc: React.ReactNode = "Jumlah karakter sesuai dengan ukuran blok.";
    if (paddingNeeded > 0) {
      for (let i = 0; i < paddingNeeded; i++) {
        blocks.push(23); // X is 23
      }
      paddingDesc = (
        <span>
          Menambahkan {paddingNeeded} <Tooltip title="Padding" content="Karakter tambahan (seperti 'X') untuk melengkapi blok teks agar bisa dikalikan dengan matriks.">padding</Tooltip> 'X' (nilai 23) agar panjang teks habis dibagi {n}.
        </span>
      );
    }

    const chunked: number[][] = [];
    for (let i = 0; i < blocks.length; i += n) {
      chunked.push(blocks.slice(i, i + n));
    }

    generatedSteps.push({
      title: 'LANGKAH 3: PEMBAGIAN BLOK',
      description: (<span>Membagi deretan angka menjadi blok berukuran {n}. {paddingDesc}</span>),
      result: chunked.map(b => `[${b.join(', ')}]`).join(' '),
      type: 'blocks'
    });

    // LANGKAH 4: VEKTOR MATRIKS
    generatedSteps.push({
      title: 'LANGKAH 4: REPRESENTASI VEKTOR KOLOM',
      description: 'Setiap blok angka direpresentasikan sebagai vektor kolom yang siap dikalikan dengan matriks kunci.',
      result: (
        <div className="flex gap-6 overflow-x-auto py-2">
          {chunked.map((block, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className="text-[10px] font-black opacity-40 mb-1">Vektor {idx + 1}</div>
              <div className="relative px-2 py-1">
                <div className="absolute inset-y-0 left-0 w-1.5 border-y border-l border-indigo-400/40 rounded-l-sm"></div>
                <div className="absolute inset-y-0 right-0 w-1.5 border-y border-r border-indigo-400/40 rounded-r-sm"></div>
                <div className="flex flex-col gap-1 font-mono text-[11px] font-bold">
                  {block.map((v, i) => <div key={i} className="text-center w-6">{v}</div>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ),
      type: 'blocks'
    });

    let activeMatrix = matrix;
    
    // KHUSUS DEKRIPSI
    if (mode === 'decrypt') {
      const adj = getAdjugate(matrix);
      const invMatrix = getMatrixInverse(matrix)!;
      activeMatrix = invMatrix;

      generatedSteps.push({
        title: 'LANGKAH A: HITUNG DETERMINAN',
        description: 'Menghitung determinan matriks K menggunakan ekspansi Laplace. Determinan diperlukan untuk mencari matriks invers.',
        math: `Determinant(K) = ${det}`,
        type: 'det'
      });
      generatedSteps.push({
        title: 'LANGKAH B: MOD 26 DETERMINAN',
        description: 'Menghitung nilai determinan dalam Modulo 26. Jika hasilnya negatif, tambahkan 26 sampai positif.',
        math: `${det} mod 26 = ${detMod26}`,
        type: 'mod'
      });
      generatedSteps.push({
        title: 'LANGKAH C: CARI INVERS MODULAR',
        description: (
          <span>
            Mencari nilai X sehingga (det × X) mod 26 = 1. Nilai ini disebut <Tooltip title="Invers Multiplikatif" content="Bilangan bulat yang jika dikalikan dengan determinan mod 26 akan menghasilkan sisa bagi 1.">Modular Invers</Tooltip>.
          </span>
        ),
        math: `${detMod26} × X ≡ 1 (mod 26)\nInvers Modular = ${detInv}`,
        type: 'text'
      });
      generatedSteps.push({
        title: 'LANGKAH D: MATRIX ADJOIN',
        description: 'Menghitung Matriks Adjoin (Transpose dari matriks Kofaktor).',
        matrix: adj,
        type: 'multiplication'
      });
      generatedSteps.push({
        title: 'LANGKAH E: MATRIX INVERS (K⁻¹)',
        description: 'Menghitung matriks invers dengan mengalikan Adjoin dengan Invers Modular, lalu di-mod 26.',
        math: `K⁻¹ = (${detInv} × Matrix_Adjoint) mod 26`,
        matrix: invMatrix,
        type: 'inv'
      });
    }

    // LANGKAH 5-6: PERKALIAN & MOD 26
    const finalNumbers: number[] = [];
    const multiplicationLog: string[] = [];

    chunked.forEach((block, idx) => {
      let chunkLog = `BLOK KE-${idx + 1} [${block.map(b => numToChar(b)).join('')}] → [${block.join(', ')}]\n\n`;
      
      const multiplied: number[] = [];
      activeMatrix.forEach((row, ri) => {
        // Build substitution string: (a*x1 + b*x2 + ...)
        const substitution = row.map((val, ci) => `${val}×${block[ci]}`).join(' + ');
        // Build intermediate multiplication result string: (y1 + y2 + ...)
        const mathResults = row.map((val, ci) => val * block[ci]);
        const intermediate = mathResults.join(' + ');
        // Sum
        const sum = mathResults.reduce((a, b) => a + b, 0);
        multiplied.push(sum);

        chunkLog += `Baris ${ri + 1}:\n`;
        chunkLog += `( ${row.map((_, i) => `k${ri+1}${i+1} × p${i+1}`).join(' + ')} )\n`;
        chunkLog += `= ( ${substitution} )\n`;
        chunkLog += `= ( ${intermediate} )\n`;
        chunkLog += `= ${sum}\n\n`;
      });
      
      const reduced = multiplied.map(v => mod(v, 26));
      finalNumbers.push(...reduced);
      
      chunkLog += `Operasi Modulo 26:\n`;
      multiplied.forEach((m, mi) => {
        chunkLog += `${m} mod 26 = ${reduced[mi]}\n`;
      });
      
      multiplicationLog.push(chunkLog);
    });

    generatedSteps.push({
      title: 'LANGKAH 5 & 6: PERKALIAN MATRIKS & MOD 26',
      description: (
        <span>
          Mengalikan matriks kunci [K] dengan setiap vektor blok plaintext [P] menggunakan rumus C = K × P. 
          Setiap elemen hasil kemudian dioperasikan dengan <Tooltip title="Modulo 26" content="Hasil akhir harus berada dalam rentang 0-25 untuk dikonversi kembali menjadi huruf (A-Z).">mod 26</Tooltip>.
        </span>
      ),
      math: multiplicationLog.join('--------------------------\n'),
      type: 'multiplication'
    });

    // LANGKAH 7: KONVERSI ANGKA KE HURUF
    const resultChars = finalNumbers.map(n => numToChar(n)).join('');
    generatedSteps.push({
      title: 'LANGKAH 7: KONVERSI ANGKA → HURUF',
      description: 'Memetakan kembali setiap angka hasil perhitungan ke huruf alfabet yang sesuai.',
      result: resultChars,
      type: 'final'
    });

    setSteps(generatedSteps);
    setResult(resultChars);
  };

  const copyResult = () => {
    navigator.clipboard.writeText(result);
    alert('Hasil disalin ke clipboard!');
  };

  const downloadResult = () => {
    const header = `=== LAPORAN PERHITUNGAN HILL CIPHER ===\n\n`;
    const details = `Mode: ${mode.toUpperCase()}\nMatriks: ${matrixSize}x${matrixSize}\nTeks Input: ${text}\nHasil: ${result}\n\n`;
    const summary = steps.map(s => `[${s.title}]\n${typeof s.description === 'string' ? s.description : 'Analisis Detail'}\nHasil: ${s.result || 'Lihat langkah'}\n\n`).join('');
    const blob = new Blob([header + details + summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hill_cipher_${mode}_result.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`flex flex-col h-screen w-full transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'} font-sans overflow-hidden selection:bg-indigo-500/20`}>
      
      {/* HEADER */}
      <header className={`h-16 border-b transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} flex items-center justify-between px-8 shadow-sm shrink-0 z-20`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200/50">
            <Calculator className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none">Kalkulator Hill Cipher</h1>
            <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Alat Edukasi Kriptografi Profesional</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-lg transition-all ${isDarkMode ? 'bg-slate-800 text-amber-400' : 'bg-slate-100 text-slate-400'}`}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button 
            onClick={() => {
              if (matrixSize === 2) {
                setText('HELLOWORLD');
                setMatrix([[3, 3], [2, 5]]);
              } else if (matrixSize === 3) {
                setText('PRACTICUM');
                setMatrix([[6, 24, 1], [13, 16, 10], [20, 17, 15]]);
              } else if (matrixSize === 4) {
                setText('CRYPTOGRAPHY');
                setMatrix([[3, 10, 20, 1], [15, 2, 19, 5], [7, 8, 1, 10], [1, 2, 3, 4]]);
              } else {
                setText('HILLCIPHERTEST');
                const identity = Array(matrixSize).fill(0).map((_, i) => Array(matrixSize).fill(0).map((_, j) => (i === j ? 1 : 0)));
                setMatrix(identity);
              }
            }}
            className={`px-4 py-2 text-xs font-bold border rounded-lg transition-colors ${isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
             Contoh
          </button>
          <button 
            onClick={calculate}
            className="px-6 py-2 text-xs font-black text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all active:scale-[0.98] uppercase tracking-widest"
          >
            Hitung
          </button>
        </div>
      </header>

      {/* MAIN CONTENT Area */}
      <div className="flex flex-1 overflow-hidden p-6 gap-6">
        
        {/* Sidebar: Konfigurasi */}
        <aside className="w-80 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
          <section className={`p-5 rounded-3xl border shadow-sm space-y-5 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h2 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-4 opacity-70">
              <LayoutGrid size={14} className="text-indigo-600" /> Konfigurasi
            </h2>

            {/* Matriks Ukuran */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Ukuran Matriks</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[2, 3, 4, 5].map(size => (
                  <button 
                    key={size}
                    onClick={() => setMatrixSize(size)}
                    className={`py-1.5 text-[10px] font-bold rounded-xl transition-all border ${matrixSize === size ? 'bg-indigo-600 border-indigo-600 text-white' : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}
                  >
                    {size}x{size}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Operasi */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Mode Operasi</label>
              <div className={`flex p-1 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                <button 
                  onClick={() => setMode('encrypt')}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${mode === 'encrypt' ? (isDarkMode ? 'bg-slate-700 text-indigo-400' : 'bg-white shadow-sm text-indigo-600') : 'text-slate-500'}`}
                >
                  ENKRIPSI
                </button>
                <button 
                  onClick={() => setMode('decrypt')}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${mode === 'decrypt' ? (isDarkMode ? 'bg-slate-700 text-indigo-400' : 'bg-white shadow-sm text-indigo-600') : 'text-slate-500'}`}
                >
                  DEKRIPSI
                </button>
              </div>
            </div>

            {/* Input Teks */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Teks Input</label>
              <input 
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value.toUpperCase())}
                placeholder="MASUKKAN PESAN..."
                className={`w-full p-3 border-2 rounded-2xl outline-none font-mono text-xs uppercase tracking-widest transition-all ${isDarkMode ? 'bg-slate-950 border-slate-800 text-indigo-400' : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-indigo-500/50'}`}
              />
            </div>

            {/* Matrix Input */}
            <div className="space-y-4">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Matriks Kunci (K)</label>
              <div 
                className="grid gap-1.5 p-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/10" 
                style={{ gridTemplateColumns: `repeat(${matrixSize}, 1fr)` }}
              >
                {matrix.map((row, r) => row.map((val, c) => (
                  <input 
                    key={`${r}-${c}`}
                    type="number"
                    value={val}
                    onChange={(e) => handleMatrixChange(r, c, e.target.value)}
                    className={`w-9 h-9 text-center font-mono font-bold rounded-lg border-2 transition-all outline-none text-xs ${isDarkMode ? 'bg-slate-800 border-slate-700 text-indigo-400 focus:border-indigo-500' : 'bg-white border-slate-100 text-indigo-700 focus:border-indigo-600'}`}
                  />
                )))}
              </div>
            </div>
          </section>

          {/* Feedback & Result Summary */}
          <section className="space-y-4">
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-start gap-3"
                >
                  <AlertCircle className="text-rose-500 shrink-0" size={16} />
                  <p className="text-[10px] font-bold text-rose-500 leading-snug">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {result && (
              <div className={`p-5 rounded-3xl shadow-xl space-y-4 transition-all ${isDarkMode ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'}`}>
                <div className="flex justify-between items-center opacity-60">
                   <h3 className="text-[9px] font-black uppercase tracking-widest">Hasil Akhir</h3>
                   <div className="flex gap-1">
                      <button onClick={copyResult} className="p-1.5 hover:bg-white/10 rounded-lg"><Copy size={12} /></button>
                      <button onClick={downloadResult} className="p-1.5 hover:bg-white/10 rounded-lg"><Download size={12} /></button>
                   </div>
                </div>
                <div className="text-3xl font-mono tracking-[0.2em] font-black break-all">{result}</div>
              </div>
            )}
          </section>
        </aside>

        {/* MAIN PANEL: Langkah Detil */}
        <main className="flex-1 overflow-y-auto px-1 group custom-scrollbar">
          <div className={`flex items-center justify-between mb-6 sticky top-0 py-4 z-10 transition-colors ${isDarkMode ? 'bg-slate-950/80' : 'bg-slate-50/80'} backdrop-blur-md`}>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Hash size={18} className="text-indigo-600" /> Analisis Langkah Detail
            </h2>
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity"
            >
              {showDetails ? 'Sembunyikan Detail' : 'Tampilkan Detail'} <ChevronDown size={14} className={showDetails ? 'rotate-180' : ''} />
            </button>
          </div>

          {!result ? (
            <div className="h-[calc(100%-80px)] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] flex flex-col items-center justify-center text-slate-400">
              <Calculator size={48} className="opacity-10 mb-4" />
              <p className="font-bold text-sm">Klik 'Hitung' untuk memulai analisis kriptografi</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-20">
              {steps.map((step, idx) => (
                <motion.div 
                  key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                  className={`p-6 rounded-[2.5rem] border transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} ${idx === steps.length - 1 ? 'xl:col-span-2 border-indigo-500/30' : ''}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em]">{step.title}</span>
                    <div className="w-6 h-6 rounded-lg bg-indigo-500/5 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-500/10">{idx + 1}</div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-[11px] font-semibold leading-relaxed opacity-80">{step.description}</div>
                    
                    <AnimatePresence>
                      {showDetails && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 overflow-hidden">
                          {step.math && (
                            <div className={`p-5 rounded-2xl font-mono text-[10px] leading-relaxed border ${step.type === 'multiplication' ? (isDarkMode ? 'bg-slate-950 border-slate-800 text-indigo-300' : 'bg-slate-900 text-slate-300 border-slate-800') : (isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100 border-slate-200/50 font-medium')}`}>
                               {step.math}
                            </div>
                          )}
                          
                          {step.matrix && (
                            <div className="flex justify-center p-6 rounded-2xl bg-slate-500/5 border border-slate-500/5">
                              <div className="relative p-4">
                                <div className="absolute inset-y-0 left-0 w-3 border-y-2 border-l-2 border-indigo-500/30 rounded-l-lg"></div>
                                <div className="absolute inset-y-0 right-0 w-3 border-y-2 border-r-2 border-indigo-500/30 rounded-r-lg"></div>
                                <div className="grid gap-x-8 gap-y-3 text-xs font-bold font-mono text-center" style={{ gridTemplateColumns: `repeat(${step.matrix[0].length}, 1fr)` }}>
                                  {step.matrix.map(row => row.map((v, i) => <div key={i}>{v}</div>))}
                                </div>
                              </div>
                            </div>
                          )}

                          {step.result && (
                            <div className={`p-4 rounded-2xl border flex items-center gap-4 ${isDarkMode ? 'bg-indigo-500/5 border-indigo-500/10' : 'bg-indigo-50 border-indigo-100'}`}>
                               <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20"><CheckCircle2 size={18} /></div>
                               <div className="overflow-hidden">
                                  <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block mb-0.5 opacity-70">Hasil Langkah</span>
                                  <span className="text-sm font-mono font-black break-all">{step.result}</span>
                               </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* FOOTER */}
      <footer className={`h-10 px-8 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.2em] shrink-0 border-t transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-600' : 'bg-white border-slate-100 text-slate-400'}`}>
        <div className="flex gap-8">
          <span>ALGEBRA RIIL: GF(26)</span>
          <span>REKURSI LAPLACE: ON</span>
          <span>MATRIKS: SUPOR T 5x5</span>
        </div>
        <div className="flex items-center gap-2">
           <Info size={14} /> Kalkulator Hill Cipher Praktikum
        </div>
      </footer>
    </div>
  );
}
