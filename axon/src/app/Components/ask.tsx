import React, { useState } from 'react';
import axios from 'axios';

const AskQuestion = () => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [message, setMessage] = useState('');

  const handleQuestionChange = (event:any) => {
    setQuestion(event.target.value);
  };

  const handleAskQuestion = async () => {
    if (!question) {
      setMessage('Please enter a question.');
      return;
    }

    try {
      const response = await axios.post('http://127.0.0.1:5000/ask', {
        question: question,
      });

      setResponse(response.data.response);
      setMessage('');
    } catch (error) {
      setMessage('Failed to get response');
      console.error(error);
    }
  };

  return (
    <div>
      <h2>Ask a Question</h2>
      <textarea
      className='text-black'
        value={question}
        onChange={handleQuestionChange}
        placeholder="Enter your question here..."
      />
      <br />
      <button onClick={handleAskQuestion}>Ask</button>
      {message && <p>{message}</p>}
      {response && (
        <div>
          <h3>Response:</h3>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
};

export default AskQuestion;
