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
    doc,
    deleteDoc,
    updateDoc // ★編集機能のために追加
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
 * 編集モードを開始する
 * （履歴の「編集」ボタンから呼ばれます）
 */
window.startEdit = (id, name, price, size, memo) => {
    // フォームに値をセット
    document.getElementById('editId').value = id;
    document.getElementById('drinkName').value = name;
    document.getElementById('drinkPrice').value = price;
    document.getElementById('drinkSize').value = size;
    // メモの中の改行コード変換（簡易対応）
    document.getElementById('memo').value = memo;

    // ボタンの見た目を変える
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.textContent = "変更を更新する 🔄";
    saveBtn.style.backgroundColor = "#dda0dd"; // わかりやすく色を変える（紫など）

    // キャンセルボタンを表示
    document.getElementById('cancelEditBtn').style.display = "block";

    // フォームまでスクロール
    document.querySelector('.container').scrollIntoView({ behavior: 'smooth' });
};

/**
 * 編集をキャンセルする
 */
window.cancelEdit = () => {
    // フォームをリセット
    document.getElementById('editId').value = "";
    document.getElementById('drinkName').value = "";
    document.getElementById('drinkPrice').value = "";
    document.getElementById('memo').value = "";
    
    // ボタンを元に戻す
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.textContent = "自分専用に記録する";
    saveBtn.style.backgroundColor = "#007042";

    // キャンセルボタンを隠す
    document.getElementById('cancelEditBtn').style.display = "none";
};

/**
 * データの削除機能
 */
window.deleteLog = async (id) => {
    if (!confirm("この記録を削除してもよろしいですか？")) return;
    
    try {
        await deleteDoc(doc(db, "user_logs", id));
        showToast("削除しました 🗑️");
        // もし編集中だったらキャンセル扱いにする
        if(document.getElementById('editId').value === id) {
            window.cancelEdit();
        }
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
        const monthlyPriceDisplay = document.getElementById('monthlyPriceDisplay');
        
        historyDiv.innerHTML = "";
        
        // データが空（0件）の場合
        if (snapshot.empty) {
            historyDiv.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #888;">
                    <p style="font-size: 3rem; margin-bottom: 10px;">☕️</p>
                    <p>まだ記録がありません。<br>今日の一杯を記録してみよう！</p>
                </div>
            `;
            if(totalPriceDisplay) totalPriceDisplay.textContent = "0";
            if(monthlyPriceDisplay) monthlyPriceDisplay.textContent = "0";
            return;
        }

        let totalPrice = 0;
        let monthlyPrice = 0;
        
        // 今月かどうか判定するための準備
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            const price = Number(data.price || 0);
            
            totalPrice += price;

            // 今月の計算
            const dateObj = data.timestamp ? data.timestamp.toDate() : null;
            if (dateObj && dateObj.getMonth() === currentMonth && dateObj.getFullYear() === currentYear) {
                monthlyPrice += price;
            }

            const dateStr = dateObj ? dateObj.toLocaleString('ja-JP') : "保存中...";
            
            // メモのエスケープ（簡易版：HTMLが崩れないように）
            const safeMemo = (data.memo || "").replace(/"/g, '&quot;'); 
            const safeName = (data.name || "").replace(/"/g, '&quot;');
            
            historyDiv.innerHTML += `
                <div class="log-item" style="position: relative; padding-right: 80px;"> <div class="log-date">${dateStr}</div>
                    <div class="log-title">${data.name} <span style="font-size:0.8em; font-weight:normal;">(${data.size})</span></div>
                    <div style="font-size: 1.1rem; font-weight: bold; color: #333;">${price.toLocaleString()}円</div>
                    <div style="font-size: 0.9rem; color: #666; margin-top: 5px; white-space: pre-wrap;">${data.memo || "メモなし"}</div>
                    
                    <div style="position: absolute; top: 15px; right: 10px; display: flex; gap: 5px;">
                        <button onclick="startEdit('${id}', '${safeName}', '${price}', '${data.size}', '${safeMemo.replace(/\n/g, '\\n')}')" 
                                style="background: white; border: 1px solid #ccc; border-radius: 4px; color: #555; cursor: pointer; font-size: 0.8rem; padding: 4px 8px;">
                            🖊️
                        </button>
                        <button onclick="deleteLog('${id}')" 
                                style="background: white; border: 1px solid #ff4d4d; border-radius: 4px; color: #ff4d4d; cursor: pointer; font-size: 0.8rem; padding: 4px 8px;">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        });

        if (totalPriceDisplay) totalPriceDisplay.textContent = totalPrice.toLocaleString();
        if (monthlyPriceDisplay) monthlyPriceDisplay.textContent = monthlyPrice.toLocaleString();
    });
};

/**
 * データの保存（新規・更新 共通）
 */
document.getElementById('saveBtn').addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) return alert("ログインが必要です");

    const name = document.getElementById('drinkName').value;
    const price = document.getElementById('drinkPrice').value;
    const size = document.getElementById('drinkSize').value;
    const memo = document.getElementById('memo').value;
    const editId = document.getElementById('editId').value; // ★編集中のIDを取得
    const saveBtn = document.getElementById('saveBtn');

    // バリデーション
    if (!name) return alert("ドリンク名を入力してください 🥤");
    if (price === "" || Number(price) < 0) return alert("正しい金額を入力してください 💰");

    // ボタン無効化（連打防止）
    saveBtn.disabled = true;
    saveBtn.textContent = "処理中...";

    try {
        if (editId) {
            // ★IDがあるなら「更新 (update)」
            await updateDoc(doc(db, "user_logs", editId), {
                name: name,
                price: Number(price),
                size: size,
                memo: memo,
                // timestampは更新しない方が「いつ飲んだか」が残るのであえて更新しない設計にします
                updatedAt: serverTimestamp() // 編集日時だけ記録しておく
            });
            showToast("修正しました！✏️");
            window.cancelEdit(); // 編集モード終了
        } else {
            // ★IDがないなら「新規作成 (add)」
            await addDoc(collection(db, "user_logs"), {
                name: name,
                price: Number(price),
                size: size,
                memo: memo,
                uid: user.uid,
                timestamp: serverTimestamp()
            });
            
            // フォームのリセット
            document.getElementById('drinkName').value = "";
            document.getElementById('drinkPrice').value = "";
            document.getElementById('memo').value = "";
            showToast("記録しました！☕️");
        }

    } catch (e) {
        console.error("エラー:", e);
        alert("処理に失敗しました。");
    } finally {
        saveBtn.disabled = false;
        // 編集モードでなければボタン文字を戻す
        if(!document.getElementById('editId').value) {
            saveBtn.textContent = "自分専用に記録する";
        }
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

/**
 * PWA（アプリ化）の登録
 */
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then(function() { console.log('Service Worker Registered'); });
}