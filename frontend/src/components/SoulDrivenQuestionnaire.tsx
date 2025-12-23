'use client';

import { useState } from 'react';
import { playSound } from '@/src/lib/sounds';

interface QuestionnaireProps {
  onSubmit: (answers: string[]) => void;
  isLoading: boolean;
}

interface Question {
  id: number;
  question: string;
  options: string[];
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    question: '¿Qué valoras más en un compañero?',
    options: [
      'Lealtad y protección',
      'Inteligencia y astucia',
      'Energía y entusiasmo',
      'Calma y serenidad',
    ],
  },
  {
    id: 2,
    question: '¿Cómo enfrentas los desafíos?',
    options: [
      'Con fuerza y determinación',
      'Con estrategia y planificación',
      'Con creatividad y adaptabilidad',
      'Con paciencia y perseverancia',
    ],
  },
  {
    id: 3,
    question: '¿Qué ambiente prefieres?',
    options: [
      'Montañas y cuevas',
      'Bosques y praderas',
      'Océanos y ríos',
      'Ciudades y lugares urbanos',
    ],
  },
  {
    id: 4,
    question: '¿Cuál es tu estilo de batalla?',
    options: [
      'Ofensivo y agresivo',
      'Defensivo y resistente',
      'Equilibrado y versátil',
      'Táctico y estratégico',
    ],
  },
  {
    id: 5,
    question: '¿Qué te describe mejor?',
    options: [
      'Valiente y audaz',
      'Sabio y reflexivo',
      'Amigable y sociable',
      'Misterioso y reservado',
    ],
  },
];

export default function SoulDrivenQuestionnaire({ onSubmit, isLoading }: QuestionnaireProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  const handleAnswer = (answer: string) => {
    playSound('click');
    
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Todas las preguntas respondidas
      playSound('confirm');
      onSubmit(newAnswers);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      playSound('cancel');
      setCurrentQuestion(currentQuestion - 1);
      setAnswers(answers.slice(0, -1));
    }
  };

  const question = QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-poke-purple font-bold">Soul Driven</span>
          <span className="text-slate-400">
            Pregunta {currentQuestion + 1} de {QUESTIONS.length}
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-poke-purple to-poke-blue h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Question Card */}
      <div className="card mb-6 animate-fadeIn">
        <h3 className="text-2xl font-bold mb-6 text-center text-poke-purple">
          {question.question}
        </h3>

        <div className="space-y-3">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(option)}
              disabled={isLoading}
              className="w-full p-4 bg-slate-800 hover:bg-poke-purple/20 border-2 border-transparent hover:border-poke-purple rounded-lg transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-poke-purple/20 flex items-center justify-center font-bold text-poke-purple">
                  {String.fromCharCode(65 + index)}
                </div>
                <span>{option}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleBack}
          disabled={currentQuestion === 0 || isLoading}
          className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Anterior
        </button>

        <div className="text-sm text-slate-400">
          {answers.length > 0 && (
            <span>
              <i className="fas fa-check-circle text-poke-green mr-1"></i>
              {answers.length} respuesta{answers.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="mt-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-poke-purple border-t-transparent"></div>
          <p className="mt-2 text-poke-purple font-bold">
            Analizando tu alma...
          </p>
        </div>
      )}
    </div>
  );
}
