// -------------------------
// 要素を取ってくる（HTMLの部品を使えるようにする）
// -------------------------
const titleInput = document.getElementById("title");
const authorInput = document.getElementById("author");
const addBtn = document.getElementById("addBtn");
const bookList = document.getElementById("bookList");
const searchInput = document.getElementById("search");
const startInput = document.getElementById("startDate");
const endInput = document.getElementById("endDate");
const searchBtn = document.getElementById("searchBtn");
const  sortSelect = document.getElementById("sortSelect");
const filterSelect = document.getElementById("filterSelect");

// -------------------------
// 検索処理を関数化
// -------------------------
function applySearchFilter() {
  const keyword = searchInput.value.toLowerCase();
  const books = document.querySelectorAll(".book-item");

  books.forEach(book => {
    const text = book.textContent.toLowerCase();
    if (text.includes(keyword)) {
      book.style.display = "flex";
    } else {
      book.style.display = "none";
    }
  });
}

searchBtn.addEventListener("click", () => {
    applySearchFilter();
});

// フィルター変更時に再描画
filterSelect.addEventListener("change", () => {
  renderBooks();
});

// 検索欄に入力があるたびにフィルターを適用
searchInput.addEventListener("input", applySearchFilter);

// -------------------------
// データを入れる配列（アプリの「本棚」）
// -------------------------
let books = []; // ここに {id, title, author} のオブジェクトを入れていく

// -------------------------
// localStorage に保存する関数
// -------------------------
function saveBooks() {
  // 配列 -> 文字列 にして保存
  localStorage.setItem("books", JSON.stringify(books));
}

// -------------------------
// localStorage から読み込む関数
// -------------------------
function loadBooks() {
  const saved = localStorage.getItem("books");
  if (saved) {
    books = JSON.parse(saved); // 文字列 -> 配列 に戻す
  }
}

// -------------------------
// 画面に表示する関数（配列の中身を全て描画する）
// -------------------------
function renderBooks() {
  sortBooks(); // ソートを適用
  // まず表示部分を空にする（クリア）
  bookList.innerHTML = "";

   // フィルター条件を取得
  const filter = filterSelect.value;

  // 検索キーワード
  const keyword = searchInput.value.toLowerCase();

  // 条件に合う本だけ抽出
  const filteredBooks = books.filter(book => {
    const matchesSearch =
      book.title.toLowerCase().includes(keyword) ||
      book.author.toLowerCase().includes(keyword);

    const matchesFilter =
      filter === "all" ||
      (filter === "unread" && book.status === "未読") ||
      (filter === "done" && book.status === "完了");

    return matchesSearch && matchesFilter;
  });

  // 抽出した本だけ表示
  filteredBooks.forEach((book, index) => {
    const bookItem = document.createElement("div");
    bookItem.className = "book-item";

    const bookText = document.createElement("span");
    bookText.textContent = "📖 " + book.title + " - " + book.author + " - " + book.status;

    if (book.startDate) {
      bookText.textContent += ` | 開始日: ${book.startDate}`;
    }
    if (book.endDate) {
      bookText.textContent += ` | 完了日: ${book.endDate}`;
    }
    // ステータス切替ボタン
    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = "切替";
    toggleBtn.className = "toggle-btn";
    toggleBtn.addEventListener("click", () => {
      // 未読 ⇔ 完了 を切り替える
      book.status = (book.status === "未読") ? "完了" : "未読";
      saveBooks();
      renderBooks();
    });

    //削除ボタン
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "削除";
    deleteBtn.className = "delete-btn";

    // 編集ボタン
const editBtn = document.createElement("button");
editBtn.textContent = "編集";
editBtn.className = "edit-btn";

editBtn.addEventListener("click", () => {
  editBook(index);
});

bookItem.appendChild(editBtn);

    // 削除ボタン：押されたら配列から消して保存・再描画
    deleteBtn.addEventListener("click", () => {
      books.splice(index, 1); // index番目を1個だけ消す
      saveBooks();           // 変化を保存
      renderBooks();         // 画面を更新（配列に合わせる）
    });

    bookItem.appendChild(bookText);
    bookItem.appendChild(toggleBtn);
    bookItem.appendChild(editBtn);
    bookItem.appendChild(deleteBtn);
    bookList.appendChild(bookItem);
  });
    updateProgress(); // 進捗バーを更新
    applySearchFilter(); // 検索フィルターを再適用
}
// -------------------------
// 本の情報を編集する関数
// -------------------------
function editBook(index) {
  const book = books[index];

  const newTitle = prompt("新しいタイトルを入力してください", book.title);
  const newAuthor = prompt("新しい著者を入力してください", book.author);
  const newStartDate = prompt("開始日を入力してください (YYYY-MM-DD)", book.startDate || "");
  const newEndDate = prompt("完了日を入力してください (YYYY-MM-DD)", book.endDate || "");

  // 入力が空じゃなければ更新
  if (newTitle !== null && newTitle.trim() !== "") book.title = newTitle;
  if (newAuthor !== null && newAuthor.trim() !== "") book.author = newAuthor;
  if (newStartDate !== null) book.startDate = newStartDate;
  if (newEndDate !== null) book.endDate = newEndDate;

  saveBooks();
  renderBooks();
}

// -------------------------
// 追加ボタンが押されたときの処理
// -------------------------
addBtn.addEventListener("click", () => {
    const title = titleInput.value.trim();  // 前後の空白を削る
    const author = authorInput.value.trim();

    const startDate = startInput.value;//日付
    const endDate = endInput.value;

  if (title === "" && author === "") {
    alert("タイトルか著者を入力してください！");
    return;
  }

  // 新しい本（オブジェクト）を作って配列に追加
  const newBook = {
    id: Date.now(), // 後で使える一意のID（念のため）
    title: title,
    author: author,
    startDate: startDate,
    endDate: endDate,
    status: "未読"  // 初期状態は「未読」
  };

  books.push(newBook); // 配列に入れる
  saveBooks();         // 保存
  renderBooks();       // 画面に反映

  // 入力欄を空に戻す
  titleInput.value = "";
  authorInput.value = "";

  startInput.value = "";
endInput.value = "";

});

// -------------------------
// ソート機能
// -------------------------
function sortBooks() {
  const sortBy = sortSelect.value;

  if (sortBy === "title") {
    //タイトル順（あいうえお順）
    books.sort((a, b) => a.title.localeCompare(b.title));
  }else if (sortBy === "author") {
    //著者順（あいうえお順）
    books.sort((a, b) => a.author.localeCompare(b.author));
  }
}
sortSelect.addEventListener("change", () => {
  sortBooks();
  saveBooks();
  renderBooks();
});

// -------------------------
// 進捗バーを更新する
// -------------------------
function updateProgress() {
  const total = books.length;
  const done = books.filter(book => book.status === "完了").length;

  const percent = total > 0 ? (done / total) * 100 : 0;

  // バーを更新
  const progressBar = document.getElementById("progressBar");
  progressBar.style.width = percent + "%";

  // テキストを更新
  const progressText = document.getElementById("progressText");
  progressText.textContent = `進捗: ${done} / ${total}`;
}

// -------------------------
// ページ読み込み時：保存データを読み込んで描画する
// -------------------------
window.addEventListener("load", () => {
  loadBooks();
  renderBooks();
});
