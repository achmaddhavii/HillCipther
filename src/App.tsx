/**
 * Hill Cipher Calculator - Professional Educational Tool
 * @license Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, 
  RefreshCw, 
  Copy, 
  Download, 
  ArrowRight, 
  CheckCircle2, 
  Info,
  TextIcon,
  ChevronDown,
  LayoutGrid,
  Hash,
  Lightbulb,
  AlertCircle
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
  ALPHABET 
} from './hillCipher';

export default function App() {
  const [text, setText] = useState('HELLO');
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [matrixSize, setMatrixSize] = useState<2 | 3>(2);
  const [matrix, setMatrix] = useState<number[][]>([[3, 3], [2, 5]]);
  const [showDetails, setShowDetails] = useState(true);
  const [steps, setSteps] = useState<MatrixStep[]>([]);
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Sync matrix size
  useEffect(() => {
    if (matrixSize === 2) {
      setMatrix([[3, 3], [2, 5]]);
    } else {
      setMatrix([[6, 24, 1], [13, 16, 10], [20, 17, 15]]);
    }
  }, [matrixSize]);

  const handleMatrixChange = (r: number, c: number, val: string) => {
    const num = parseInt(val) || 0;
    const newMatrix = [...matrix];
    newMatrix[r][c] = num;
    setMatrix(newMatrix);
  };

  const calculate = () => {
    setError(null);
    const generatedSteps: MatrixStep[] = [];
    const n = matrixSize;

    // Validation
    if (!text.trim()) {
      setError("Input text cannot be empty.");
      return;
    }

    if (mode === 'decrypt') {
      const det = getDeterminant(matrix);
      const detMod26 = mod(det, 26);
      if (modInverse(detMod26, 26) === -1) {
        setError(`Matrix is not invertible mod 26 (Det mod 26 = ${detMod26}). Decryption impossible.`);
        return;
      }
    }

    // STEP 1: Preprocessing
    const processed = text.toUpperCase().replace(/[^A-Z]/g, '');
    generatedSteps.push({
      title: 'STEP 1: PREPROCESSING TEXT',
      description: 'Cleans the text by removing spaces and non-alphabetic characters, then converting to uppercase.',
      result: processed,
      type: 'text'
    });

    // STEP 2: Conversion to Numbers
    const numbers = processed.split('').map(c => charToNum(c));
    const mappingStr = processed.split('').map(c => `${c}=${charToNum(c)}`).join(', ');
    generatedSteps.push({
      title: 'STEP 2: KONVERSI HURUF KE ANGKA',
      description: `Mapping characters to their zero-indexed positions in the alphabet (A=0, B=1, ... Z=25).`,
      math: mappingStr,
      result: `[${numbers.join(', ')}]`,
      type: 'mapping'
    });

    // STEP 3: Blocks & Padding
    let blocks: number[] = [...numbers];
    const paddingNeeded = (n - (blocks.length % n)) % n;
    let paddingMsg = "No padding required.";
    if (paddingNeeded > 0) {
      for (let i = 0; i < paddingNeeded; i++) {
        blocks.push(23); // X is 23
      }
      paddingMsg = `Added ${paddingNeeded} padding character(s) ('X' = 23) to complete the blocks of size ${n}.`;
    }

    const chunked: number[][] = [];
    for (let i = 0; i < blocks.length; i += n) {
      chunked.push(blocks.slice(i, i + n));
    }

    generatedSteps.push({
      title: 'STEP 3: PEMBAGIAN BLOK',
      description: `Split text numbers into blocks of size ${n}. ${paddingMsg}`,
      result: chunked.map(b => `[${b.join(', ')}]`).join(' '),
      type: 'blocks'
    });

    let activeMatrix = matrix;
    
    // DECRYPTION SPECIAL STEPS
    if (mode === 'decrypt') {
      const det = getDeterminant(matrix);
      const detMod26 = mod(det, 26);
      const detInv = modInverse(detMod26, 26);
      const adj = getAdjugate(matrix);
      const invMatrix = getMatrixInverse(matrix)!;
      activeMatrix = invMatrix;

      generatedSteps.push({
        title: 'STEP A: HITUNG DETERMINAN',
        description: 'Before decrypting, we must find the modular inverse of the key matrix.',
        math: `Det(K) = ${det}`,
        type: 'text'
      });
      generatedSteps.push({
        title: 'STEP B: MOD 26 DETERMINAN',
        description: 'Find Det(K) mod 26.',
        math: `${det} mod 26 = ${detMod26}`,
        type: 'mod'
      });
      generatedSteps.push({
        title: 'STEP C: CARI INVERS MODULAR',
        description: `Find x such that (${detMod26} * x) mod 26 = 1.`,
        math: `Modular Multiplicative Inverse (1/${detMod26}) mod 26 = ${detInv}`,
        type: 'text'
      });
      generatedSteps.push({
        title: 'STEP D: ADJOIN MATRIX',
        description: 'Calculate the classical adjoint matrix.',
        matrix: adj,
        type: 'multiplication'
      });
      generatedSteps.push({
        title: 'STEP E: MODULAR INVERSE MATRIX',
        description: `K' = (Det_Inv * Adjoint) mod 26`,
        matrix: invMatrix,
        type: 'multiplication'
      });
    }

    // STEP 4-7: Matrix Multiplication (Loop through blocks)
    const finalNumbers: number[] = [];
    const multiplicationLog: string[] = [];

    chunked.forEach((block, idx) => {
      const multiplied = multiplyMatrixVector(activeMatrix, block);
      const reduced = multiplied.map(v => mod(v, 26));
      finalNumbers.push(...reduced);

      // Detail formatting
      let calcStr = `Block ${idx + 1}: \n`;
      activeMatrix.forEach((row, ri) => {
        const terms = row.map((val, ci) => `(${val} × ${block[ci]})`).join(' + ');
        calcStr += `Row ${ri + 1}: ${terms} = ${multiplied[ri]} \n`;
      });
      calcStr += `Mod 26: [${multiplied.join(', ')}] → [${reduced.join(', ')}]`;
      multiplicationLog.push(calcStr);
    });

    generatedSteps.push({
      title: 'STEPS 4-6: PERKALIAN & MOD 26',
      description: 'Multiply the key matrix by each text block vector, then apply modulo 26.',
      math: multiplicationLog.join('\n\n'),
      type: 'multiplication'
    });

    // STEP 7: Final Conversion
    const resultChars = finalNumbers.map(n => numToChar(n)).join('');
    generatedSteps.push({
      title: 'STEP 7: KONVERSI KE HURUF',
      description: 'Map each resulting number back to its letter in the alphabet.',
      result: resultChars,
      type: 'final'
    });

    setSteps(generatedSteps);
    setResult(resultChars);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    alert('Copied to clipboard!');
  };

  const downloadResult = () => {
    const content = `Hill Cipher Result\nMode: ${mode}\nMatrix: ${JSON.stringify(matrix)}\nOriginal: ${text}\nResult: ${result}\n\nSteps:\n${steps.map(s => `${s.title}\n${s.description}\nValue: ${s.result || s.math || 'See matrix'}`).join('\n\n')}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hill_cipher_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const loadExample = () => {
    setText('HELLOWORLD');
    setMode('encrypt');
    setMatrixSize(2);
    setMatrix([[3, 3], [2, 5]]);
    setTimeout(() => calculate(), 100);
  };

  const reset = () => {
    setText('');
    setSteps([]);
    setResult('');
    setError(null);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 overflow-hidden text-slate-800 font-sans selection:bg-indigo-100">
      
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200/50">
            <Calculator className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-none">Hill Cipher Calculator</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Educational Cryptography Tool v2.1</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadExample}
            className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <Lightbulb size={16} /> Load Example
          </button>
          <button 
            onClick={reset}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all flex items-center gap-2"
          >
            <RefreshCw size={16} /> New Calculation
          </button>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden p-6 gap-6">
        
        {/* Sidebar: Configuration */}
        <aside className="w-80 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
          <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-4">
              <LayoutGrid size={14} className="text-indigo-600" /> Configuration
            </h2>

            {/* Operation Mode */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operation</label>
              <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200/50">
                <button 
                  onClick={() => setMode('encrypt')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${mode === 'encrypt' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  ENCRYPT
                </button>
                <button 
                  onClick={() => setMode('decrypt')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${mode === 'decrypt' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  DECRYPT
                </button>
              </div>
            </div>

            {/* Text Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-between">
                Text Input
                <span className="text-indigo-400 font-mono">{text.replace(/[^A-Z]/gi, '').length} chars</span>
              </label>
              <input 
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="ENTER TEXT..."
                className="w-full p-3 border-2 border-slate-100 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-500/50 outline-none font-mono text-sm uppercase tracking-tighter transition-all"
              />
            </div>

            {/* Matrix Config */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dimension</label>
                <select 
                  value={matrixSize}
                  onChange={(e) => setMatrixSize(parseInt(e.target.value) as 2 | 3)}
                  className="w-full p-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold focus:border-indigo-500/50 outline-none"
                >
                  <option value={2}>2 x 2</option>
                  <option value={3}>3 x 3</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alphabet</label>
                <div className="text-[10px] bg-indigo-50 text-indigo-700 p-2.5 rounded-xl font-mono leading-tight font-medium border border-indigo-100/50">
                  A=0 ... Z=25
                </div>
              </div>
            </div>

            {/* Matrix Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Key Matrix [K]</label>
              <div className="grid gap-2 w-max mx-auto" style={{ gridTemplateColumns: `repeat(${matrixSize}, 1fr)` }}>
                {matrix.map((row, r) => row.map((val, c) => (
                  <input 
                    key={`${r}-${c}`}
                    type="number"
                    value={val}
                    onChange={(e) => handleMatrixChange(r, c, e.target.value)}
                    className="w-12 h-12 text-center font-mono font-bold text-indigo-700 border-2 border-slate-100 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-600 outline-none transition-all"
                  />
                )))}
              </div>
            </div>

            <button 
              onClick={calculate}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]"
            >
              Calculate Steps
            </button>
          </section>

          {/* Validation Alert */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-3 overflow-hidden"
              >
                <AlertCircle className="text-rose-500 shrink-0" size={18} />
                <p className="text-[11px] font-bold text-rose-600 leading-snug">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sticky Summary Card */}
          {result && (
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-5 text-white shadow-xl shadow-indigo-200 mt-auto">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-[10px] font-bold opacity-60 uppercase tracking-[0.2em]">Calculated Result</h3>
                <div className="flex gap-1 opacity-60">
                   <button onClick={copyToClipboard} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><Copy size={12} /></button>
                   <button onClick={downloadResult} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><Download size={12} /></button>
                </div>
              </div>
              <div className="text-3xl font-mono tracking-widest font-black break-all">
                {result}
              </div>
              <p className="text-[10px] opacity-50 mt-3 font-medium leading-relaxed italic">
                {mode === 'encrypt' ? 'Ciphertext' : 'Plaintext'} generated using Hill-{matrixSize} transformation.
              </p>
            </div>
          )}
        </aside>

        {/* Main Content: Steps Display */}
        <main className="flex-1 overflow-y-auto px-1 group">
          <div className="flex items-center justify-between mb-6 sticky top-0 bg-slate-50/90 backdrop-blur-sm py-2 z-10">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Hash size={18} className="text-indigo-600" /> Calculation Steps
            </h2>
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="text-[11px] font-black uppercase tracking-widest text-indigo-600 opacity-70 hover:opacity-100 flex items-center gap-1.5 transition-all"
            >
              {showDetails ? 'Condensed View' : 'Full Detailed View'} <ChevronDown size={12} className={showDetails ? 'rotate-180' : ''} />
            </button>
          </div>

          {steps.length === 0 ? (
            <div className="h-[calc(100%-80px)] border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-slate-400">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                <Calculator size={32} />
              </div>
              <p className="font-bold text-sm tracking-tight">Enter configuration to see step-by-step logic</p>
              <button 
                onClick={loadExample}
                className="mt-4 text-xs font-bold text-indigo-600 hover:underline"
              >
                Or load an example message
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-12">
              {steps.map((step, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={idx}
                  className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col group/card hover:border-indigo-200 transition-all ${idx === steps.length - 1 ? 'xl:col-span-2 bg-indigo-50/30' : ''}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-white bg-indigo-600 px-2 py-0.5 rounded-md shadow-sm">
                        STEP {idx + 1}
                      </span>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">{step.title}</h3>
                    </div>
                    {step.type === 'mod' && <Hash size={14} className="text-slate-300" />}
                  </div>

                  <div className="flex-1 space-y-4">
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      {step.description}
                    </p>

                    <AnimatePresence>
                      {showDetails && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 overflow-hidden"
                        >
                          {/* Math Formula / Calculation View */}
                          {step.math && (
                            <div className={`p-4 rounded-xl font-mono text-[11px] border leading-relaxed whitespace-pre-wrap ${step.type === 'multiplication' ? 'bg-slate-900 text-slate-300 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                              {step.type === 'multiplication' && <div className="text-indigo-400 font-bold mb-2 uppercase tracking-widest text-[9px]">The Core Operation</div>}
                              {step.math}
                            </div>
                          )}

                          {/* Matrix View */}
                          {step.matrix && (
                            <div className="flex justify-center py-2 bg-slate-50 rounded-xl border border-slate-100/50">
                              <div className="relative p-3">
                                <div className="absolute inset-y-0 left-0 w-2.5 border-y-2 border-l-2 border-slate-800 rounded-l-sm"></div>
                                <div className="absolute inset-y-0 right-0 w-2.5 border-y-2 border-r-2 border-slate-800 rounded-r-sm"></div>
                                <div className={`grid gap-x-6 gap-y-2 text-sm font-bold font-mono text-slate-900 text-center`}
                                     style={{ gridTemplateColumns: `repeat(${step.matrix[0].length}, 1fr)` }}>
                                  {step.matrix.map(row => row.map((val, i) => <div key={i}>{val}</div>))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Result Highlight */}
                          {step.result && (
                            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center gap-3">
                              <div className="w-8 h-8 bg-white text-indigo-600 rounded-lg shadow-sm flex items-center justify-center flex-shrink-0">
                                <CheckCircle2 size={16} />
                              </div>
                              <div className="overflow-hidden">
                                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block leading-none mb-1">Result</span>
                                <span className="text-xs font-mono font-bold text-slate-800 break-all">{step.result}</span>
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

      {/* Mini Footer Stats/Info */}
      <footer className="h-8 bg-white border-t border-slate-200 px-8 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] shrink-0">
        <div className="flex gap-6">
          <span>Algebra: GF(26)</span>
          <span>Security: Linear Basis</span>
          <span>Status: Valid Matrix</span>
        </div>
        <div>
          Created for Professional Education
        </div>
      </footer>
    </div>
  );
}
