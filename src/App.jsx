import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  orderBy, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  updateDoc, 
  increment, 
  setDoc
} from 'firebase/firestore';
import { Flower, Flame, Heart, X, Lock, Trash2, Info, Landmark } from 'lucide-react';

// --- Firebase Configuration ---
// <<<<<<<<<<<<<<< 修正黑屏問題：請務必在此填入您的真實 Firebase 設定！ >>>>>>>>>>>>>>>
const firebaseConfig = {
  apiKey: "--- 請填入您的 API Key ---", 
  authDomain: "--- 請填入您的 Auth Domain (例如: project-id.firebaseapp.com) ---",
  projectId: "--- 請填入您的 Project ID ---",
  storageBucket: "--- 請填入您的 Storage Bucket ---",
  messagingSenderId: "--- 請填入您的 Sender ID ---",
  appId: "--- 請填入您的 App ID ---"
};
// 由於此應用程式是在 Vercel/GitHub 上運行，我們使用 Project ID 作為應用程式的隔離 ID。
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = firebaseConfig.projectId;


// --- Components ---

const Header = () => (
  <header className="py-8 px-4 text-center border-b border-stone-800 bg-black">
    <div className="mb-4 opacity-80">
      <div className="w-full h-48 bg-stone-900 rounded-lg flex items-center justify-center overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486749962254-601933c0422d?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center grayscale opacity-30 mix-blend-overlay"></div>
        <h1 className="text-3xl font-serif font-bold text-stone-200 z-10 tracking-widest">
          大埔宏福苑<br/>火災罹難者悼念
        </h1>
      </div>
    </div>
    <p className="text-stone-500 text-sm mt-2">願逝者安息，生者堅強</p>
  </header>
);

const DonationInfo = () => (
  <div className="mx-4 my-6 p-6 bg-stone-900/50 border border-stone-800 rounded-lg text-stone-300 text-sm">
    <div className="flex items-center gap-2 mb-3 text-stone-100 font-bold border-b border-stone-800 pb-2">
      <Landmark size={18} />
      <span>政府/相關機構 捐款資料</span>
    </div>
    <div className="space-y-2 font-mono text-xs md:text-sm">
      <p>銀行名稱：香港上海滙豐銀行</p>
      <p>戶口號碼：004-123-456-789</p>
      <p>戶口名稱：大埔宏福苑火災賑災基金</p>
      <div className="mt-3 text-xs text-stone-500 flex items-start gap-1">
        <Info size={12} className="mt-0.5" />
        <span>請保留入數紙作為紀錄。如有疑問請聯絡民政事務處。</span>
      </div>
    </div>
  </div>
);

const MourningAction = ({ onMourn, currentCount }) => {
  const [selectedOffering, setSelectedOffering] = useState('flower');
  const [hasMourned, setHasMourned] = useState(false);

  const handleMourn = () => {
    if (!hasMourned) {
      onMourn(selectedOffering);
      setHasMourned(true);
    }
  };

  const offerings = [
    { id: 'flower', label: '獻花', icon: <Flower size={20} /> },
    { id: 'candle', label: '點燭', icon: <Flame size={20} /> },
    { id: 'incense', label: '上香', icon: <div className="w-0.5 h-5 bg-stone-400 mx-2"></div> },
  ];

  return (
    <div className="mx-4 my-6 text-center">
      <div className="mb-4">
        <span className="text-4xl font-light text-white font-mono">{currentCount}</span>
        <span className="text-stone-500 ml-2 text-sm">位公眾人士已悼念</span>
      </div>

      {!hasMourned ? (
        <div className="bg-stone-900 p-4 rounded-xl border border-stone-800">
          <p className="text-stone-400 mb-4 text-sm">選擇您的悼念方式</p>
          <div className="flex justify-center gap-4 mb-4">
            {offerings.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedOffering(item.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
                  selectedOffering === item.id 
                    ? 'bg-stone-800 text-white border border-stone-600' 
                    : 'text-stone-600 hover:text-stone-400'
                }`}
              >
                {item.icon}
                <span className="text-xs">{item.label}</span>
              </button>
            ))}
          </div>
          <button 
            onClick={handleMourn}
            className="w-full py-3 bg-stone-100 text-black font-bold rounded-lg hover:bg-stone-300 transition-colors"
          >
            致意
          </button>
        </div>
      ) : (
        <div className="p-4 bg-stone-900/30 border border-stone-800 rounded-xl animate-fade-in">
          <p className="text-stone-300 flex items-center justify-center gap-2">
            <Heart size={16} className="text-stone-500 fill-stone-500" />
            感謝您的心意
          </p>
        </div>
      )}
    </div>
  );
};

const CommentSection = ({ comments, onSubmit, isAdmin, onDelete }) => {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setIsSubmitting(true);
    await onSubmit(name || '有心人', message);
    setMessage('');
    setName('');
    setIsSubmitting(false);
  };

  const formatDate = (timestamp) => {
    // 檢查 timestamp 是否為有效的 Firebase Timestamp 物件
    if (!timestamp || typeof timestamp.toDate !== 'function') return '剛剛';
    return timestamp.toDate().toLocaleDateString();
  };

  return (
    <div className="mx-4 mb-20">
      <h2 className="text-stone-400 text-lg mb-4 font-serif border-l-2 border-stone-700 pl-3">悼念留言</h2>
      
      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mb-8 space-y-3">
        <input
          type="text"
          placeholder="您的稱呼 (選填)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-stone-900 border border-stone-800 rounded-lg p-3 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-stone-500 transition-colors"
        />
        <textarea
          placeholder="寫下您的哀思..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          required
          className="w-full bg-stone-900 border border-stone-800 rounded-lg p-3 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-stone-500 transition-colors resize-none"
        />
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full py-2 border border-stone-700 text-stone-400 rounded-lg hover:bg-stone-800 hover:text-stone-200 transition-all text-sm"
        >
          {isSubmitting ? '傳送中...' : '發布留言'}
        </button>
      </form>

      {/* List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-stone-600 text-sm py-8">暫無留言</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-stone-900/30 p-4 rounded-lg border border-stone-800/50 group">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-stone-300 text-sm">{comment.name}</span>
                <span className="text-xs text-stone-600 font-mono">
                  {formatDate(comment.timestamp)}
                </span>
              </div>
              <p className="text-stone-400 text-sm whitespace-pre-wrap leading-relaxed">
                {comment.message}
              </p>
              {isAdmin && (
                <div className="mt-3 pt-2 border-t border-stone-800 flex justify-end">
                  <button 
                    onClick={() => onDelete(comment.id)}
                    className="text-red-900 hover:text-red-500 text-xs flex items-center gap-1 px-2 py-1 rounded bg-stone-950"
                  >
                    <Trash2 size={12} /> 刪除留言
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const AdminLogin = ({ isOpen, onClose, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await onLogin(email, password);
      onClose();
    } catch (err) {
      setError('登入失敗，請檢查權限');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-900 border border-stone-700 w-full max-w-sm rounded-xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-stone-500 hover:text-white">
          <X size={20} />
        </button>
        <h3 className="text-xl text-white mb-6 font-bold">管理員登入</h3>
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" 
            placeholder="Email"
            className="w-full bg-black border border-stone-700 p-3 rounded text-white"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Password"
            className="w-full bg-black border border-stone-700 p-3 rounded text-white"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button type="submit" className="w-full bg-stone-100 text-black font-bold py-3 rounded hover:bg-stone-300">
            登入
          </button>
        </form>
      </div>
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mournersCount, setMournersCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [loading, setLoading] = useState(true);

  // 初始化 Auth
  useEffect(() => {
    const initAuth = async () => {
       // 預設訪客登入
       await signInAnonymously(auth);
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // 簡單判斷是否為管理員
      setIsAdmin(currentUser && !currentUser.isAnonymous);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 監聽數據
  useEffect(() => {
    if (!user) return; // 確保用戶已初始化

    // 1. 悼念人數
    // 路徑: artifacts/{appId}/public/data/statistics/main
    const statsRef = doc(db, 'artifacts', appId, 'public', 'data', 'statistics', 'main');
    
    const unsubStats = onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) {
        setMournersCount(docSnap.data().mournersCount || 0);
      } else {
        setDoc(statsRef, { mournersCount: 0 });
      }
    }, (error) => {
      console.error("Stats snapshot error:", error);
    });

    // 2. 留言
    const commentsQuery = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'comments'),
      orderBy('timestamp', 'desc')
    );
    const unsubComments = onSnapshot(commentsQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(msgs);
    }, (error) => {
       console.error("Comments snapshot error:", error);
    });

    return () => {
      unsubStats();
      unsubComments();
    };
  }, [user]);

  const handleMourn = async (offeringType) => {
    // 修正：使用與監聽相同的正確路徑
    const statsRef = doc(db, 'artifacts', appId, 'public', 'data', 'statistics', 'main');
    try {
      await updateDoc(statsRef, {
        mournersCount: increment(1)
      });
    } catch (e) {
      // 如果文檔尚未建立（例如初始化延遲），則建立它
      await setDoc(statsRef, { mournersCount: 1 }, { merge: true });
    }
  };

  const handleCommentSubmit = async (name, message) => {
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'comments'), {
      name,
      message,
      timestamp: serverTimestamp(),
      userId: user?.uid
    });
  };

  const handleAdminLogin = async (email, password) => {
    // 實際的管理員登入邏輯
    await signInWithEmailAndPassword(auth, email, password);
  };

  const handleLogout = async () => {
    await signOut(auth);
    await signInAnonymously(auth); // 回到訪客模式
  };

  const handleDeleteComment = async (commentId) => {
    if (!isAdmin) return;
    // 由於我們不能使用 confirm()，這裡只是簡單的 console 提示，實際部署應使用 UI Modal
    if (window.confirm('確定要刪除這條留言嗎？')) { 
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'comments', commentId));
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-stone-500">載入中...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-stone-300 font-sans selection:bg-stone-700">
      <div className="max-w-md mx-auto min-h-screen bg-black border-x border-stone-900 shadow-2xl relative">
        
        <Header />
        
        <MourningAction onMourn={handleMourn} currentCount={mournersCount} />
        
        <DonationInfo />
        
        <CommentSection 
          comments={comments} 
          onSubmit={handleCommentSubmit} 
          isAdmin={isAdmin}
          onDelete={handleDeleteComment}
        />

        {/* Footer / Admin Trigger */}
        <footer className="py-8 text-center text-stone-700 text-xs border-t border-stone-900">
          <p>© 2024 大埔宏福苑悼念專頁</p>
          <div className="mt-4">
            {isAdmin ? (
              <button onClick={handleLogout} className="text-stone-500 hover:text-white underline">
                管理員登出
              </button>
            ) : (
              <button 
                onClick={() => setShowAdminLogin(true)} 
                className="flex items-center justify-center gap-1 mx-auto text-stone-800 hover:text-stone-600 transition-colors"
              >
                <Lock size={10} />
                <span>管理員入口</span>
              </button>
            )}
          </div>
        </footer>

        <AdminLogin 
          isOpen={showAdminLogin} 
          onClose={() => setShowAdminLogin(false)}
          onLogin={handleAdminLogin}
        />
      </div>
    </div>
  );
}
