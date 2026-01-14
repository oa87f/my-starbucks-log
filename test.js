// HTMLの要素をJavaScriptで使えるようにする
const titleInput = document.getElementById("title");   // タイトル入力欄
const authorInput = document.getElementById("author"); // 著者入力欄
const addBtn = document.getElementById("addBtn");      // 追加ボタン
const bookList = document.getElementById("bookList");  // 本を表示する場所

//本のデータを入れる配列
let books = [];

// 「追加」ボタンをクリックしたら動く処理
addBtn.addEventListener("click", () => {
  // 入力された値を取得
  const title = titleInput.value;
  const author = authorInput.value;

  // 入力が空なら登録しない
  if (title === "" && author === "") {
    alert("タイトルか著者を入力してください！");
    return;
  }

  // 本をまとめるコンテナ（div）を作成
  const bookItem = document.createElement("div");
  bookItem.className = "book-item"; // CSSでデザインしやすくする用

  // 本の情報を表示する部分
  const bookText = document.createElement("span");
  bookText.textContent = "📖" + title + "-" + author;

  // 削除ボタンを作成
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "削除";
  deleteBtn.className = "delete-btn";

  // 削除ボタンを押したらこの本をリストから消す
  deleteBtn.addEventListener("click", () => {
    bookList.removeChild(bookItem);
  });

  // bookItem の中にテキストと削除ボタンを追加
  bookItem.appendChild(bookText);
  bookItem.appendChild(deleteBtn);

  // 表示エリアに追加
  bookList.appendChild(bookItem);
    saveBooks(); // 本のリストを保存

  // 入力欄を空に戻す
  titleInput.value = "";
  authorInput.value = "";
});

// 本を保存する関数(配列をJSON文字列に変換して保存)
function saveBooks() {
  localStorage.setItem("books", JSON.stringify(books));
}

// 保存したデータを読み込み
function loadBooks() {
  const saved = localStorage.getItem("books");
  if (saved) {
    books = JSON.parse(saved); // JSONを配列に戻す
  }
}

// ページを開いたら保存していた本を読み込む
window.addEventListener("load", loadBooks);
