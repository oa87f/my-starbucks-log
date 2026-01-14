const memo = document.getElementById("memo");
const saveBtn = document.getElementById("saveBtn");
const loadBtn = document.getElementById("loadBtn");
const clearBtn = document.getElementById("clearBtn");

// 保存ボタン
saveBtn.addEventListener("click", () => {
  localStorage.setItem("myMemo", memo.value);
  alert("保存しました！");
});

// 読み込みボタン
loadBtn.addEventListener("click", () => {
  const savedMemo = localStorage.getItem("myMemo");
  if (savedMemo) {
    memo.value = savedMemo;
    alert("読み込みました！");
  } else {
    alert("保存されているメモはありません。");
  }
});

// 削除ボタン
clearBtn.addEventListener("click", () => {
  localStorage.removeItem("myMemo");
  memo.value = "";
  alert("削除しました！");
});
