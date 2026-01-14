const input = document.getElementById("todoInput");   // 入力ボックス
const deadlineInput = document.getElementById("deadlineInput"); // 締め切り日入力
const addBtn = document.getElementById("addBtn");     // 追加ボタン
const todoList = document.getElementById("todoList"); // やることリスト
const clearBtn = document.getElementById("clearBtn"); // すべて消すボタン

//ボタンが押された時
function addTodo() {
    const text = input.value;
    const deadline = deadlineInput.value;
    if(text) {
        const li = document.createElement("li");

        //チェックボックス作成
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";

        //テキストノードを作成
        const textNode = document.createTextNode(text);

        //締め切り日を表示
        let deadlineNode = null;
        if (deadline) {
            deadlineNode = document.createElement("span");
            deadlineNode.textContent = "（締め切り: " + deadline + "）";
        }

        //削除ボタンを作成
        const delBtn = document.createElement("button");
        delBtn.textContent = "削除";
        delBtn.addEventListener("click", () => {
            todoList.removeChild(li);
        });

        //liにチェックボックスとテキストを追加
        li.appendChild(checkbox);
        li.appendChild(textNode);
        if (deadlineNode) {
            li.appendChild(deadlineNode);
        }
        li.appendChild(delBtn);

        todoList.appendChild(li);   //リストに追加
        input.value = "";          //入力ボックスを空にする
        deadlineInput.value = "";  //締め切り日入力を空にする
    }
}

// 追加ボタンがクリックされたらaddTodoを実行
addBtn.addEventListener("click", addTodo);

// すべて消すボタンがクリックされたらリストを空にする
clearBtn.addEventListener("click", () => {
    todoList.innerHTML = "";
});