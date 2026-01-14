// Firebase SDKのインポート
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    where, 
    orderBy, 
    onSnapshot, 
    serverTimestamp,
    doc,         // 削除機能のために追加
    deleteDoc    // 削除機能のために追加
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// あなたのプロジェクト設定
const firebaseConfig = {
  apiKey: "AIzaSyAIHXwhc8Px_QRtxFdHDd9qIwy_7N_EirU",
  authDomain: "cafe-log-pro.firebaseapp.com",
  projectId: "cafe-log-pro",
  storageBucket: "cafe-log-pro.firebasestorage.app",
  messagingSenderId: "241627470408",
  appId: "1:241627470408:web:f47731c4c1745b0c62967d",
  measurementId: "G-8KFGS69D37"
};

// Firebaseの初期化
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

/**
 * ログイン状態の監視
 */
onAuthStateChanged(auth, (user) => {
    const loginUI = document.getElementById('login-ui');
    const mainUI = document.getElementById('main-ui');
    const userNameDisplay = document.getElementById('user-name');

    if (user) {
        loginUI.style.display = 'none';
        mainUI.style.display = 'block';
        userNameDisplay.textContent = `こんにちは、${user.displayName} さん`;
        
        fetchMyLogs(user.uid);
    } else {
        loginUI.style.display = 'block';
        mainUI.style.display = 'none';
    }
});

/**
 * データの削除機能
 * HTMLのonclickから呼べるようにwindowオブジェクトに追加します
 */
window.deleteLog = async (id) => {
    if (!confirm("この記録を削除してもよろしいですか？")) return;
    
    try {
        await deleteDoc(doc(db, "user_logs", id));
        showToast("削除しました 🗑️");
    } catch (e) {
        console.error("削除エラー:", e);
        alert("削除に失敗しました");
    }
};

/**
 * データの読み込み（自分専用）
 */
const fetchMyLogs = (uid) => {
    const q = query(
        collection(db, "user_logs"),
        where("uid", "==", uid),
        orderBy("timestamp", "desc")
    );

    onSnapshot(q, (snapshot) => {
        const historyDiv = document.getElementById('history');
        const totalPriceDisplay = document.getElementById('totalPriceDisplay');
        historyDiv.innerHTML = "";
        
        // データが空（0件）の場合の処理
        if (snapshot.empty) {
            historyDiv.innerHTML = `
                <div style="text-align: center; color: #888; padding: 40px 0;">
                    <p>まだ記録がありません。<br>最初の1杯を記録しましょう！☕️</p>
                </div>
            `;
            totalPriceDisplay.textContent = "0";
            return; // ここで処理を終了
        }

        let totalPrice = 0;
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            const price = Number(data.price || 0);
            totalPrice += price;

            const date = data.timestamp?.toDate().toLocaleString('ja-JP') || "保存中...";
            
            historyDiv.innerHTML += `
                <div class="log-item" style="border-bottom: 1px solid #eee; padding: 15px 0; position: relative;">
                    <div style="font-size: 0.8rem; color: #888;">${date}</div>
                    <div style="font-weight: bold; color: #007042;">${data.name} (${data.size})</div>
                    <div style="font-size: 0.9rem;">${price.toLocaleString()}円</div>
                    <div style="font-size: 0.8rem; color: #555; margin-top: 5px;">${data.memo || ""}</div>
                    <button onclick="deleteLog('${id}')" 
                            style="position: absolute; top: 15px; right: 0; background: none; border: none; color: #ccc; cursor: pointer; font-size: 0.8rem;">
                        削除
                    </button>
                </div>
            `;
        });

        totalPriceDisplay.textContent = totalPrice.toLocaleString();
    });
};

/**
 * データの保存
 */
document.getElementById('saveBtn').addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) return alert("ログインが必要です");

    const name = document.getElementById('drinkName').value;
    const price = document.getElementById('drinkPrice').value;
    const size = document.getElementById('drinkSize').value;
    const memo = document.getElementById('memo').value;

    if (!name) return alert("ドリンク名を入力してください");

    try {
        await addDoc(collection(db, "user_logs"), {
            name: name,
            price: Number(price),
            size: size,
            memo: memo,
            uid: user.uid,
            timestamp: serverTimestamp()
        });

        document.getElementById('drinkName').value = "";
        document.getElementById('drinkPrice').value = "";
        document.getElementById('memo').value = "";
        
        showToast("記録しました！☕️");
    } catch (e) {
        console.error("保存エラー:", e);
        alert("保存に失敗しました。");
    }
});

/**
 * 共通機能
 */
window.login = () => signInWithPopup(auth, provider).catch(err => console.error(err));
window.logout = () => signOut(auth).catch(err => console.error(err));

const showToast = (message) => {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
};