'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/firebase.config';
import { collection, addDoc, getDocs } from 'firebase/firestore';

export default function FirebaseTest() {
  const [testMessage, setTestMessage] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState(null);

  // Firebase 연결 테스트
  useEffect(() => {
    const testConnection = async () => {
      try {
        // Firestore 연결 테스트
        const testCollection = collection(db, 'test');
        await getDocs(testCollection);
        console.log('Firestore 연결 성공!');
        setError(null);
      } catch (err) {
        console.error('Firestore 연결 에러:', err);
        setError(err.message);
      }
    };

    testConnection();
  }, []);

  // Firestore에 데이터 추가 테스트
  const handleAddData = async () => {
    try {
      if (!testMessage.trim()) {
        setResult('메시지를 입력해주세요.');
        return;
      }

      const docRef = await addDoc(collection(db, 'test'), {
        message: testMessage,
        createdAt: new Date().toISOString()
      });
      
      console.log('Document written with ID: ', docRef.id);
      setResult(`문서가 성공적으로 추가되었습니다! Document ID: ${docRef.id}`);
      setTestMessage('');
      setError(null);
    } catch (err) {
      console.error('Error adding document: ', err);
      setError(err.message);
      setResult('문서 추가 중 오류가 발생했습니다.');
    }
  };

  // Firestore에서 데이터 읽기 테스트
  const handleReadData = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'test'));
      let messages = [];
      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      setResult('읽어온 데이터:\n' + JSON.stringify(messages, null, 2));
      setError(null);
    } catch (err) {
      console.error('Error reading documents: ', err);
      setError(err.message);
      setResult('데이터 읽기 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Firebase/Firestore 테스트</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h2 className="font-bold">에러 발생:</h2>
          <p>{error}</p>
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          placeholder="테스트 메시지 입력"
          className="border p-2 mr-2 rounded"
        />
        <button
          onClick={handleAddData}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2 hover:bg-blue-600"
        >
          데이터 추가
        </button>
        <button
          onClick={handleReadData}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          데이터 읽기
        </button>
      </div>

      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <pre className="whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  );
} 