import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let editingId = null;
let currentUser = 'her'; // デフォルトは彼女

let latestSnapshot = null; // 最新のデータを保持する変数
let showFavoritesOnly = false; // フィルター状態

const firebaseConfig = {
  apiKey: "AIzaSyDqwYZPGDL2ui4M5SZwdxa5dax61aXYlKc",
  authDomain: "starbucks-log-6ca9a.firebaseapp.com",
  projectId: "starbucks-log-6ca9a",
  storageBucket: "starbucks-log-6ca9a.firebasestorage.app",
  messagingSenderId: "978424563884",
  appId: "1:978424563884:web:afe21482c9b9f6b71e7709"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const collectionName = isLocal ? "starbucks_logs_test" : "starbucks_logs";
const logsCol = collection(db, collectionName);

console.log("現在接続中のコレクション:", collectionName);

/**
 * 編集モードを解除する関数
 */
window.cancelEdit = () => {
    editingId = null;
    document.getElementById('drinkName').value = "";
    document.getElementById('drinkSize').value = "Tall";
    document.getElementById('drinkPrice').value = "";
    document.getElementById('drinkCalories').value = "";
    document.getElementById('memo').value = "";
    
    // 見た目を元に戻す
    document.getElementById('saveBtn').textContent = "記録する";
    document.getElementById('cancelBtn').style.display = "none";
    document.body.style.backgroundColor = "white"; 
};

window.switchUser = (user) => {
    currentUser = user;
    
    // ボタンの見た目を更新
    const herBtn = document.getElementById('userHer');
    const meBtn = document.getElementById('userMe');
    
    if (user === 'her') {
        herBtn.style.background = "#007042"; herBtn.style.color = "white";
        meBtn.style.background = "white"; meBtn.style.color = "#333";
        showToast("彼女のログに切り替えたよ☕️");
    } else {
        meBtn.style.background = "#007042"; meBtn.style.color = "white";
        herBtn.style.background = "white"; herBtn.style.color = "#333";
        showToast("俺のログに切り替えたよ💪");
    }
    
    // 再描画
    if (latestSnapshot) renderLogs(latestSnapshot);
};

/**
 * 編集ボタンが押された時の処理
 */
window.editLog = (id, name, size, price, calories, memo) => {
    editingId = id;
    document.getElementById('drinkName').value = name;
    document.getElementById('drinkSize').value = size;
    document.getElementById('drinkPrice').value = price || "";
    document.getElementById('drinkCalories').value = calories || "";
    document.getElementById('memo').value = memo;

    // 見た目を編集モードに変える
    document.getElementById('saveBtn').textContent = "更新を確定する";
    document.getElementById('cancelBtn').style.display = "inline-block";
    document.body.style.backgroundColor = "#fff9e6"; 
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

/**
 * 削除ボタン
 */
window.deleteLog = async (id) => {
    if (confirm("このスタバの記録を削除してもいい？")) {
        try {
            await deleteDoc(doc(db, collectionName, id));
        } catch (e) {
            alert("削除に失敗しちゃった: " + e.message);
        }
    }
};

// トースト通知を表示する関数
const showToast = (message) => {
    const toast = document.getElementById('toast');
    toast.textContent = message; // メッセージを書き換え
    toast.classList.add('show'); // 表示

    // 2秒後に非表示にする
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
};

/**
 * 保存・更新ボタンの処理
 */
document.getElementById('saveBtn').addEventListener('click', async () => {
    const name = document.getElementById('drinkName').value;
    const size = document.getElementById('drinkSize').value;
    const memo = document.getElementById('memo').value;
    const price = document.getElementById('drinkPrice').value;
    const calories = document.getElementById('drinkCalories').value;

    if (!name) return alert("ドリンク名を入れてね！");

    try {
        if (editingId) {
            // 【更新処理】
            await updateDoc(doc(db, collectionName, editingId), {
                name, size, memo, price, calories
            });
        } else {
            // 【新規保存】
            await addDoc(logsCol, {
                name: name,
                size: size,
                memo: memo,
                price: price,
                calories: calories,
                favorite: false,
                user: currentUser,
                timestamp: new Date()
            });
        }
        // 成功メッセージを表示
        if (editingId) {
            showToast("内容を更新したよ！✨");
        } else {
            showToast("新しい記録を保存したよ！☕️");
        }
        
        // ★ここがポイント：保存・更新が成功したらリセット関数を呼ぶ
        cancelEdit();
        
    } catch (e) {
        alert("操作に失敗したよ: " + e.message);
    }
});

/**
 * データの読み込みと合計計算
 */
const q = query(logsCol, orderBy("timestamp", "desc"));

onSnapshot(q, (snapshot) => {
    latestSnapshot = snapshot; // 届いたデータを変数に保存しておく
    renderLogs(snapshot);      // 表示関数を実行
});

// 表示処理を共通化した関数
const renderLogs = (snapshot) => {
    const historyDiv = document.getElementById('history');
    historyDiv.innerHTML = "";
    
    let totalPrice = 0;
    let totalCalories = 0;
    
    snapshot.forEach((snapshotDoc) => {
        const data = snapshotDoc.data();
        
        // --- 【重要】ユーザーごとの表示制御 ---
        // データに user がない場合は 'her'（彼女）として扱う（後方互換性）
        const recordUser = data.user || 'her'; 
        if (recordUser !== currentUser) return;

        // 【重要】お気に入りフィルターロジック
        if (showFavoritesOnly && !data.favorite) return;

        // --- 以下、表示用の計算とHTML生成 ---
        const id = snapshotDoc.id;
        const isFavorite = data.favorite || false; 
        const starIcon = isFavorite ? "★" : "☆";
        const starColor = isFavorite ? "#ffcc00" : "#ccc";
        const date = data.timestamp?.toDate().toLocaleString('ja-JP') || "";
        
        // 今見えている人の分だけを合計する
        totalPrice += Number(data.price || 0);
        totalCalories += Number(data.calories || 0);
        
        const searchUrl = `https://www.google.com/search?q=site:starbucks.co.jp+${encodeURIComponent(data.name)}`;
        
        historyDiv.innerHTML += `
            <div class="log-item" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding: 10px 0;">
                <div style="flex-grow: 1;">
                    <div style="cursor: pointer; font-size: 1.2rem; color: ${starColor}; display: inline-block; margin-bottom: 4px;" 
                         onclick="toggleFavorite('${id}', ${isFavorite})">
                        ${starIcon}
                    </div>
                    
                    <div class="log-date" style="font-size: 0.8rem; color: #888;">${date}</div>
                    
                    <div class="log-name" style="font-weight: bold;">
                        <a href="${searchUrl}" target="_blank" style="color: #007042; text-decoration: none;">
                            ${data.name} (${data.size}) 🔗
                        </a>
                    </div>
                    
                    <div style="font-size: 0.9rem; color: #2d5e35; font-weight: bold;">
                        ${data.price ? data.price + '円' : ''}
                        ${data.calories ? ' / ' + data.calories + 'kcal' : ''}
                    </div>
                    <div style="font-size: 0.8rem; color: #555;">${data.memo}</div>
                </div>
                
                <div style="display: flex; gap: 10px;">
                    <button onclick="editLog('${id}', '${data.name}', '${data.size}', '${data.price || ""}', '${data.calories || ""}', '${data.memo}')" style="background: none; border: none; cursor: pointer; font-size: 1.2rem;">✏️</button>
                    <button onclick="deleteLog('${id}')" style="background: none; border: none; cursor: pointer; font-size: 1.2rem;">🗑️</button>
                </div>
            </div>
        `;
    });

    // 合計表示の更新（現在表示されているユーザーの合計になる）
    document.getElementById('totalPriceDisplay').textContent = totalPrice.toLocaleString();
    document.getElementById('totalCaloriesDisplay').textContent = totalCalories.toLocaleString();
};

// フィルターボタンが押された時の処理
window.toggleFilter = () => {
    showFavoritesOnly = !showFavoritesOnly;
    const btn = document.getElementById('filterBtn');

    if (showFavoritesOnly) {
        btn.textContent = "★ 全て表示に戻す";
        btn.style.backgroundColor = "#ffcc00";
        showToast("お気に入りで絞り込んだよ！🌟");
    } else {
        btn.textContent = "☆ お気に入りのみ表示";
        btn.style.backgroundColor = "#eee";
    }
    
    // 保存しておいた最新データを使って再描画
    if (latestSnapshot) renderLogs(latestSnapshot);
};

// お気に入りのオンオフを切り替える関数
window.toggleFavorite = async (id, currentStatus) => {
    try {
        await updateDoc(doc(db, collectionName, id), {
            favorite: !currentStatus // 今の反対の状態にする（trueならfalse、falseならtrue）
        });
        // お気に入りになった時だけトーストを出す
        if (!currentStatus) {
            showToast("お気に入りに追加したよ！🌟");
        }
    } catch (e) {
        console.error("エラー:", e);
    }
};