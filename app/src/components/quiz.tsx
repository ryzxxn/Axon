'use client'
import { useState } from "react";

const quizData = [
    {
      "question": "What is Node.js primarily used for?",
      "options": [
        "Client-side web development",
        "Server-side web development",
        "Mobile app development",
        "Game development"
      ],
      "correct": 1
    },
    {
      "question": "Which JavaScript engine powers Node.js?",
      "options": [
        "SpiderMonkey",
        "V8",
        "Chakra",
        "JavaScriptCore"
      ],
      "correct": 1
    },
    {
      "question": "What programming language is Node.js written in?",
      "options": [
        "JavaScript",
        "Python",
        "C",
        "Java"
      ],
      "correct": 2
    },
    {
      "question": "What module system does Node.js use?",
      "options": [
        "AMD",
        "CommonJS",
        "ES6 Modules",
        "UMD"
      ],
      "correct": 1
    },
    {
      "question": "What is a key issue Node.js addresses?",
      "options": [
        "Memory management",
        "Concurrency handling",
        "I/O operations",
        "Code compilation"
      ],
      "correct": 2
    },
    {
      "question": "Why is Node.js considered confusing for some?",
      "options": [
        "It uses a non-standard syntax",
        "It's written in C",
        "It lacks documentation",
        "It's too fast"
      ],
      "correct": 1
    },
    {
      "question": "What is the primary purpose of Google's V8 engine?",
      "options": [
        "Compiling JavaScript to machine code",
        "Rendering web pages",
        "Managing server processes",
        "Storing data"
      ],
      "correct": 0
    },
    {
      "question": "Which of the following is NOT a feature of Node.js?",
      "options": [
        "Asynchronous I/O",
        "Event-driven architecture",
        "Synchronous processing",
        "Non-blocking I/O"
      ],
      "correct": 2
    },
    {
      "question": "What does the term 'I/O' stand for in computing?",
      "options": [
        "Input/Output",
        "Input/Operation",
        "Interface/Operation",
        "Input/Output"
      ],
      "correct": 0
    },
    {
      "question": "What is a module in Node.js?",
      "options": [
        "A type of file format",
        "A reusable piece of code",
        "A database system",
        "A network protocol"
      ],
      "correct": 1
    }
  ];

export default function Quiz() {
  const [userAnswers, setUserAnswers] = useState(Array(quizData.length).fill(null));
  const [score, setScore] = useState<number>();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const handleAnswer = (optionIndex: any) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setUserAnswers(newAnswers);

    if (currentQuestionIndex < quizData.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      calculateScore();
    }
  };

  const calculateScore = () => {
    const correctAnswers = userAnswers.filter((answer, index) => answer === quizData[index].correct).length;
    setScore(correctAnswers);
  };

  const currentQuestion = quizData[currentQuestionIndex];

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Node.js Quiz</h1>
      {score === undefined ? (
        <div className="mb-6 p-4 border rounded-lg">
          <p className="font-semibold">{currentQuestion.question}</p>
          {currentQuestion.options.map((option, oIndex) => {
            const isSelected = userAnswers[currentQuestionIndex] === oIndex;
            const isCorrect = currentQuestion.correct === oIndex;
            let bgColor = "bg-gray-200";
            if (isSelected) {
              bgColor = isCorrect ? "bg-green-400" : "bg-red-400";
            }
            return (
              <button
                key={oIndex}
                className={`w-full p-2 mt-2 rounded-lg ${bgColor}`}
                onClick={() => handleAnswer(oIndex)}
                disabled={userAnswers[currentQuestionIndex] !== null}
              >
                {option}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 text-lg font-semibold">
          You got {score} out of {quizData.length} correct!
        </p>
      )}
    </div>
  );
}
