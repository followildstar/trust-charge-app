import { useState } from "react";
import { makeId } from "../lib/calc";
import type { QuickLink } from "../types";

export function AddLinkModal({
  link, onSave, onClose,
}: {
  link?: QuickLink;
  onSave: (l: QuickLink) => void;
  onClose: () => void;
}) {
  const [emoji, setEmoji] = useState(link?.emoji ?? "🔗");
  const [name, setName] = useState(link?.name ?? "");
  const [url, setUrl] = useState(link?.url ?? "");

  function handleSave() {
    if (!name.trim() || !url.trim()) return;
    onSave({ id: link?.id ?? makeId(), emoji: emoji || "🔗", name: name.trim(), url: url.trim() });
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="modal-center-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{link ? "링크 편집" : "링크 추가"}</div>
        <div className="stack-3">
          <div className="row-3">
            <div className="field-emoji-wrap">
              <div className="field-label">아이콘</div>
              <input
                className="field-input-emoji"
                value={emoji}
                onChange={e => setEmoji(e.target.value)}
                maxLength={2}
              />
            </div>
            <div className="fill">
              <div className="field-label">링크명 *</div>
              <input
                className="field-input-b"
                placeholder="예: 요가 클래스 Notion"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          </div>
          <div>
            <div className="field-label">URL *</div>
            <input
              className="field-input-b"
              placeholder="https://..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              type="url"
              inputMode="url"
            />
          </div>
        </div>
        <div className="modal-actions">
          <button onClick={onClose} className="btn-muted-flex">취소</button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !url.trim()}
            className="btn-primary-flex2"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}