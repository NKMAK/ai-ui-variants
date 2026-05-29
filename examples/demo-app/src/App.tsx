import { useState } from "react";
import { SaveButton } from "./components/SaveButton";

export function App() {
  const [memo, setMemo] = useState("");

  return (
    <main className="app-shell">
      <section className="preview-surface">
        <p className="eyebrow">UI Variant Preview Agent</p>
        <h1>クリックしたUIから変更案を選ぶ</h1>
        <p className="lead">
          入力欄は Fast Refresh の状態維持確認用です。ボタンには
          data-ui-source を手書きしています。
        </p>

        <label className="field">
          <span>メモ</span>
          <input
            value={memo}
            onChange={(event) => setMemo(event.currentTarget.value)}
            placeholder="ここに入力してから variant を切り替える"
          />
        </label>

        <SaveButton />
      </section>
    </main>
  );
}
