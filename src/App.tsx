import React, { useState, useEffect } from 'react';
import { Search, AlertCircle, CheckCircle2, Info, Loader2, Flame, Share2, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const formatCpf = (value: string) => {
    let v = value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return v;
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCpf(e.target.value));
    if (error) setError(null);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Consulta Gás do Povo',
          text: 'Consulte de forma rápida e fácil o benefício do Gás do Povo.',
          url: currentUrl,
        });
      } catch (err) {
        console.log('Erro ao compartilhar', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      setError('Por favor, digite um CPF válido com 11 dígitos.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/consultar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cpf: cleanCpf }),
      });

      if (!response.ok) {
        throw new Error('Erro ao consultar o servidor.');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-200">
      {/* Header */}
      <header className="bg-blue-700 text-white shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-6 flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
            <Flame className="w-8 h-8 text-yellow-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gás do Povo</h1>
            <p className="text-blue-100 text-sm font-medium">Consulta simplificada de benefício</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        
        {/* Share Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3 text-blue-800">
            <div className="bg-blue-100 p-2 rounded-full">
              <Share2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Compartilhe com seu grupo</h3>
              <p className="text-xs text-blue-600/80">Ajude outras pessoas a consultarem o benefício</p>
            </div>
          </div>
          <div className="flex w-full sm:w-auto gap-2">
            <button
              onClick={handleCopyLink}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-50 transition-colors"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado!' : 'Copiar Link'}
            </button>
            <button
              onClick={handleShare}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Compartilhar
            </button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <div className="p-6 sm:p-8">
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              Consulte seu Benefício
            </h2>
            <p className="text-slate-500 mb-6">
              Digite o CPF do Responsável Familiar cadastrado no CadÚnico para verificar a disponibilidade do benefício.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="cpf" className="block text-sm font-medium text-slate-700 mb-1">
                  CPF do Responsável Familiar
                </label>
                <input
                  type="text"
                  id="cpf"
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  className={`w-full px-4 py-3 rounded-xl border ${error ? 'border-red-300 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-200'} focus:border-blue-500 focus:ring-4 outline-none transition-all text-lg`}
                  disabled={loading}
                  autoComplete="off"
                />
                {error && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || cpf.length < 14}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Consultando...
                  </>
                ) : (
                  'Consultar Benefício'
                )}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Results Area */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6"
            >
              {result.status === 'not_found' || result.status === 'invalid' ? (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-red-100 p-2 rounded-full shrink-0">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-red-800 mb-1">
                        Atenção
                      </h3>
                      <p className="text-red-700">
                        {result.message}
                      </p>
                      
                      {result.status === 'not_found' && (
                        <div className="mt-4 pt-4 border-t border-red-200/60">
                          <h4 className="font-medium text-red-800 mb-2 text-sm">Possíveis motivos:</h4>
                          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                            <li>CPF não cadastrado no programa Gás do Povo</li>
                            <li>Família não atende aos critérios de elegibilidade</li>
                            <li>Cadastro Único (CadÚnico) desatualizado há mais de 24 meses</li>
                            <li>Renda familiar per capita superior a meio salário-mínimo</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : result.status === 'success' ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="bg-emerald-100 p-2 rounded-full shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-emerald-800 mb-1">
                        Benefício Encontrado!
                      </h3>
                      {result.message && (
                        <p className="text-emerald-700">{result.message}</p>
                      )}
                    </div>
                  </div>

                  {result.beneficios && result.beneficios.length > 0 && (
                    <div className="space-y-4">
                      {result.beneficios.map((beneficio: any, index: number) => (
                        <div key={index} className="bg-white rounded-xl border border-emerald-100 p-5 shadow-sm">
                          {beneficio.title && (
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                              <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                                <Flame className="w-5 h-5 text-blue-600" />
                                {beneficio.title}
                              </h4>
                              {beneficio.isExpired && (
                                <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
                                  EXPIRADO
                                </span>
                              )}
                            </div>
                          )}
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                            {Object.entries(beneficio.details || {}).map(([key, value]: [string, any]) => (
                              <div key={key} className="flex flex-col">
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{key}</span>
                                <span className="text-slate-800 font-medium">{value}</span>
                              </div>
                            ))}
                          </div>
                          
                          {beneficio.origin && (
                            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                              {beneficio.origin}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-100 p-2 rounded-full shrink-0">
                      <Info className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-amber-800 mb-1">
                        Aviso
                      </h3>
                      <p className="text-amber-700">
                        {result.message || 'Não foi possível interpretar a resposta do servidor.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Card */}
        <div className="mt-8 bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            Como retirar o benefício?
          </h3>
          <ul className="space-y-2 text-blue-800/80 text-sm">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Cartão Bolsa Família (com chip)
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Cartão de Débito da CAIXA
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              CPF do beneficiário + código de validação no celular
            </li>
          </ul>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="text-center py-8 text-slate-500 text-sm">
        <p>Este é um aplicativo ponte simplificado.</p>
        <p>Os dados são consultados diretamente no site oficial: <a href="https://gasdopovo.mds.gov.br/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">gasdopovo.mds.gov.br</a></p>
      </footer>
    </div>
  );
}
