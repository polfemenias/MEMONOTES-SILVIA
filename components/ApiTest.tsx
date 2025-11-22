import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

const ApiTest: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');

    const handleTestApi = async () => {
        setIsLoading(true);
        setResult('');
        setError('');

        const apiKey = process.env.API_KEY;

        if (!apiKey) {
            setError("Error: La variable d'entorn API_KEY no està definida. Assegura't que estigui configurada a Netlify.");
            setIsLoading(false);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: "Escriu 'Hola Món' en català.",
            });
            setResult(response.text.trim());
        } catch (e: any) {
            console.error("Error en la prova de l'API:", e);
            setError(`Ha fallat la crida a l'API: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-xl w-full">
                <h1 className="text-2xl font-bold text-sky-700 mb-4">Prova de l'API de Gemini</h1>
                <p className="text-slate-600 mb-6">
                    Aquest component fa una única crida a l'API per verificar si la clau i la configuració funcionen correctament.
                </p>
                <button
                    onClick={handleTestApi}
                    disabled={isLoading}
                    className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300"
                >
                    {isLoading ? 'Provant...' : 'Executar Prova'}
                </button>

                {result && (
                    <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-md">
                        <h2 className="font-bold text-green-800">Èxit!</h2>
                        <p className="text-green-700">L'API ha respost correctament:</p>
                        <pre className="mt-2 bg-white p-2 rounded text-sm"><code>{result}</code></pre>
                    </div>
                )}

                {error && (
                    <div className="mt-6 p-4 bg-red-100 border border-red-300 rounded-md">
                        <h2 className="font-bold text-red-800">Error</h2>
                        <p className="text-red-700">{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApiTest;
