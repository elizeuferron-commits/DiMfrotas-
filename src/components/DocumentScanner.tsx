import React, { useState, useRef } from 'react';
import { Camera, FileSearch, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';

interface ScannedData {
  description?: string;
  supplier?: string;
  amount?: number;
  dueDate?: string;
  barcode?: string;
}

interface DocumentScannerProps {
  onScanComplete: (data: ScannedData) => void;
  onClose: () => void;
}

/**
 * 🌑 COMPONENTE EM MODO SOMBRA
 * Fornece interface para escanear documentos financeiros usando a API Gemini.
 */
export const DocumentScanner: React.FC<DocumentScannerProps> = ({ onScanComplete, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem (JPG, PNG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async () => {
    if (!preview) return;

    setIsScanning(true);
    try {
      const base64Data = preview.split(',')[1];
      const mimeType = preview.split(',')[0].split(':')[1].split(';')[0];

      const response = await fetch('/api/finance/scan-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Data, mimeType })
      });

      if (!response.ok) throw new Error('Falha ao processar documento');

      const data = await response.json();
      
      toast.success('Documento processado com sucesso!');
      onScanComplete(data);
    } catch (error) {
      console.error('Scan error:', error);
      toast.error('Erro ao ler documento. Tente novamente ou preencha manualmente.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent">
              <Camera size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Scanner Inteligente</h3>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Boleto / NF / Recibo</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          {!preview ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-800 rounded-2xl p-12 text-center hover:border-brand-accent/50 hover:bg-brand-accent/5 transition-all cursor-pointer group"
            >
              <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <FileSearch className="text-zinc-500 group-hover:text-brand-accent" size={32} />
              </div>
              <p className="text-zinc-300 font-medium">Clique para selecionar ou tirar foto</p>
              <p className="text-zinc-500 text-sm mt-2">Suporta JPG, PNG</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                accept="image/*" 
                capture="environment" 
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative rounded-2xl overflow-hidden border border-zinc-800 h-64 bg-black">
                <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                <button 
                  onClick={() => setPreview(null)}
                  className="absolute top-2 right-2 p-2 bg-zinc-900/80 hover:bg-red-500 text-white rounded-full transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setPreview(null)}
                  disabled={isScanning}
                  className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-2xl font-bold transition-all disabled:opacity-50 uppercase text-xs tracking-widest"
                >
                  Trocar Foto
                </button>
                <button
                  onClick={processImage}
                  disabled={isScanning}
                  className="flex-[2] py-4 bg-brand-accent text-zinc-950 rounded-2xl font-black shadow-lg shadow-brand-accent/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
                >
                  {isScanning ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Confirmar e Iniciar Leitura
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
            <AlertCircle className="text-blue-400 shrink-0" size={18} />
            <p className="text-xs text-blue-300/70 leading-relaxed">
              A IA identificará automaticamente o fornecedor, valor, vencimento e código de barras. 
              Sempre confira os dados antes de salvar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
