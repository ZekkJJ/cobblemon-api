'use client';

import { useState } from 'react';

interface SoulDrivenQuestionnaireProps {
    onSubmit: (answers: string[]) => void;
    isLoading: boolean;
}

export default function SoulDrivenQuestionnaire({ onSubmit, isLoading }: SoulDrivenQuestionnaireProps) {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<string[]>(['', '', '', '', '', '']);

    const questions = [
        {
            question: '¿Cuál es tu estilo de combate preferido?',
            type: 'multiple',
            options: [
                'Agresivo y directo',
                'Estratégico y calculador',
                'Defensivo y resistente',
                'Rápido y evasivo'
            ]
        },
        {
            question: '¿Qué ambiente te gusta más?',
            type: 'multiple',
            options: [
                'Bosques y naturaleza',
                'Volcanes y lugares cálidos',
                'Océanos y lagos',
                'Montañas y cuevas'
            ]
        },
        {
            question: '¿Cómo describirías tu personalidad?',
            type: 'multiple',
            options: [
                'Calmado y paciente',
                'Apasionado y energético',
                'Leal y protector',
                'Curioso y aventurero'
            ]
        },
        {
            question: '¿Qué valoras más en un compañero?',
            type: 'multiple',
            options: [
                'Fuerza y poder',
                'Inteligencia y astucia',
                'Lealtad y confianza',
                'Velocidad y agilidad'
            ]
        },
        {
            question: 'Describe tu mayor fortaleza:',
            type: 'text',
            placeholder: 'Escribe tu respuesta aquí...'
        },
        {
            question: '¿Cuál es tu mayor sueño o meta?',
            type: 'text',
            placeholder: 'Escribe tu respuesta aquí...'
        }
    ];

    const handleAnswer = (answer: string) => {
        const newAnswers = [...answers];
        newAnswers[currentQuestion] = answer;
        setAnswers(newAnswers);
    };

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            onSubmit(answers);
        }
    };

    const handlePrevious = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const isAnswered = answers[currentQuestion] && answers[currentQuestion].trim().length > 0;
    const progress = ((currentQuestion + 1) / questions.length) * 100;

    return (
        <div className="w-full flex flex-col items-center">
            <div className="w-full mb-4 bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>

            <div className="text-purple-400 text-xs mb-2">
                Pregunta {currentQuestion + 1} de {questions.length}
            </div>

            <div className="w-full bg-gray-700/50 rounded-xl p-6 mb-4 min-h-[300px] flex flex-col">
                <h3 className="text-white text-lg font-bold mb-4 text-center">
                    {questions[currentQuestion].question}
                </h3>

                <div className="flex-1 flex flex-col justify-center">
                    {questions[currentQuestion].type === 'multiple' ? (
                        <div className="space-y-3">
                            {questions[currentQuestion].options?.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleAnswer(option)}
                                    className={`w-full p-4 rounded-lg text-left transition-all ${
                                        answers[currentQuestion] === option
                                            ? 'bg-purple-600 text-white border-2 border-purple-400'
                                            : 'bg-gray-600 text-gray-200 hover:bg-gray-500 border-2 border-transparent'
                                    }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <textarea
                            value={answers[currentQuestion]}
                            onChange={(e) => handleAnswer(e.target.value)}
                            placeholder={questions[currentQuestion].placeholder}
                            className="w-full bg-gray-600 border-2 border-gray-500 rounded-lg p-4 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none"
                            rows={5}
                            maxLength={200}
                        />
                    )}
                </div>

                {questions[currentQuestion].type === 'text' && (
                    <div className="text-gray-400 text-xs mt-2 text-right">
                        {answers[currentQuestion].length}/200 caracteres
                    </div>
                )}
            </div>

            <div className="w-full flex gap-3">
                {currentQuestion > 0 && (
                    <button
                        onClick={handlePrevious}
                        disabled={isLoading}
                        className="flex-1 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-all"
                    >
                        <i className="fas fa-arrow-left mr-2"></i>
                        Anterior
                    </button>
                )}
                <button
                    onClick={handleNext}
                    disabled={!isAnswered || isLoading}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all"
                >
                    {isLoading ? (
                        <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Analizando...
                        </>
                    ) : currentQuestion === questions.length - 1 ? (
                        <>
                            Descubrir mi Pokémon
                            <i className="fas fa-sparkles ml-2"></i>
                        </>
                    ) : (
                        <>
                            Siguiente
                            <i className="fas fa-arrow-right ml-2"></i>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
