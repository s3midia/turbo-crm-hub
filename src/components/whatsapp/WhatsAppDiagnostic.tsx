import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const WhatsAppDiagnostic = () => {
    const [testing, setTesting] = useState(false);
    const [results, setResults] = useState<any[]>([]);

    const runDiagnostics = async () => {
        setTesting(true);
        const testResults: any[] = [];

        // Teste 1: Verificar se Edge Function responde
        try {
            testResults.push({ name: 'Edge Function', status: 'testing', message: 'Testando conexão...' });
            setResults([...testResults]);

            const { data, error } = await supabase.functions.invoke('evolution-api', {
                body: { action: 'fetchInstances' }
            });

            if (error) {
                testResults[0] = {
                    name: 'Edge Function',
                    status: 'error',
                    message: `Erro: ${error.message}`
                };
            } else if (data?.error) {
                testResults[0] = {
                    name: 'Edge Function',
                    status: 'error',
                    message: `${data.error}: ${data.message}`
                };
            } else {
                testResults[0] = {
                    name: 'Edge Function',
                    status: 'success',
                    message: 'Edge Function respondendo!'
                };
            }
        } catch (err: any) {
            testResults[0] = {
                name: 'Edge Function',
                status: 'error',
                message: err.message
            };
        }

        setResults([...testResults]);
        setTesting(false);
    };

    const resetInstance = async () => {
        setTesting(true);
        const resetResults: any[] = [];

        try {
            // Passo 1: Logout
            resetResults.push({ name: 'Logout', status: 'testing', message: 'Desconectando...' });
            setResults([...resetResults]);

            await supabase.functions.invoke('evolution-api', {
                body: { action: 'logout', instanceName: 'crm-turbo' }
            });

            resetResults[0].status = 'success';
            resetResults[0].message = 'Logout concluído';
            setResults([...resetResults]);

            // Aguardar 2 segundos
            await new Promise(r => setTimeout(r, 2000));

            // Passo 2: Criar nova instância
            resetResults.push({ name: 'Nova Instância', status: 'testing', message: 'Criando nova instância...' });
            setResults([...resetResults]);

            const { data, error } = await supabase.functions.invoke('evolution-api', {
                body: { action: 'createInstance', instanceName: 'crm-turbo' }
            });

            if (error || data?.error) {
                resetResults[1] = {
                    name: 'Nova Instância',
                    status: 'error',
                    message: error?.message || data?.message || 'Erro desconhecido'
                };
            } else {
                resetResults[1] = {
                    name: 'Nova Instância',
                    status: 'success',
                    message: 'Instância criada! Recarregue a página e tente conectar.'
                };
            }
        } catch (err: any) {
            resetResults.push({
                name: 'Erro',
                status: 'error',
                message: err.message
            });
        }

        setResults([...resetResults]);
        setTesting(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Diagnóstico WhatsApp
                </CardTitle>
                <CardDescription>
                    Teste a conexão com Evolution API e resolva problemas
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Button onClick={runDiagnostics} disabled={testing}>
                        {testing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Testando...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Testar Conexão
                            </>
                        )}
                    </Button>

                    <Button onClick={resetInstance} disabled={testing} variant="outline">
                        {testing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Resetando...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Resetar Instância
                            </>
                        )}
                    </Button>
                </div>

                {results.length > 0 && (
                    <div className="space-y-2">
                        {results.map((result, index) => (
                            <Alert key={index} variant={result.status === 'error' ? 'destructive' : 'default'}>
                                <div className="flex items-center gap-2">
                                    {result.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                    {result.status === 'error' && <XCircle className="h-4 w-4" />}
                                    {result.status === 'testing' && <Loader2 className="h-4 w-4 animate-spin" />}
                                    <AlertDescription>
                                        <strong>{result.name}:</strong> {result.message}
                                    </AlertDescription>
                                </div>
                            </Alert>
                        ))}
                    </div>
                )}

                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                        <strong>Erros comuns:</strong>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li><strong>EVOLUTION_API_URL não configurada</strong> → Configure em Cloud → Edge functions → Secrets</li>
                            <li><strong>Network error</strong> → Servidor Evolution API offline</li>
                            <li><strong>401/403</strong> → API Key incorreta</li>
                        </ul>
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
};
