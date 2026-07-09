import { useRef, useState } from "react";
import type * as React from "react";
import { Download, FileJson, FileSpreadsheet, Info, Shield, Upload } from "lucide-react";
import { Toast } from "../components/Toast";
import { APP_NAME, APP_TAGLINE, APP_VERSION } from "../lib/defaults";
import { exportStateAsCsv, exportStateAsJson, parseBackupFile } from "../lib/storage";
import type { Action, AppState } from "../types";

export function SettingsScreen({ state, dispatch }: { state: AppState; dispatch: React.Dispatch<Action>; }) {
  const [showReset, setShowReset] = useState(false);

  // JSON 복원 상태
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<AppState | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importFileName, setImportFileName] = useState<string>("");

  // 완료 토스트
  const [toast, setToast] = useState<string | null>(null);

  // 데이터 요약
  const phaseCount = state.phases.length;
  const totalRecords = state.phases.reduce(
    (sum, p) => sum + Object.keys(p.records).length, 0
  );

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // 같은 파일을 다시 선택해도 onChange가 다시 뜨도록 값 초기화
    e.target.value = "";
    if (!file) return;
    setImportError(null);
    try {
      const imported = await parseBackupFile(file);
      setImportFileName(file.name);
      setPendingImport(imported); // 확인창 띄우기
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "복원에 실패했어요.");
    }
  }

  function confirmImport() {
    if (pendingImport) {
      dispatch({ type: "IMPORT_DATA", state: pendingImport });
      setToast("데이터를 복원했어요");
    }
    setPendingImport(null);
    setImportFileName("");
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <div className="screen-title">설정</div>
        <div className="screen-subtitle">앱 정보 · 데이터 관리</div>
      </div>

      <div className="screen-body-stack6">
        {/* 앱 정보 */}
        <div className="card-pad">
          <div className="row-2-mb3">
            <Info size={14} className="icon-muted" />
            <span className="card-title">앱 정보</span>
          </div>
          <div className="stack-2">
            <div className="settings-info-row">
              <span className="settings-pts">이름</span>
              <span className="settings-info-value">{APP_NAME}</span>
            </div>
            <div className="settings-info-row">
              <span className="settings-pts">버전</span>
              <span className="settings-info-value">v{APP_VERSION}</span>
            </div>
            <div className="settings-info-row">
              <span className="settings-pts">소개</span>
              <span className="settings-info-value">{APP_TAGLINE}</span>
            </div>
          </div>
        </div>

        {/* 데이터 요약 */}
        <div className="stat-grid">
          <div className="card-pad">
            <div className="stat-label">목표</div>
            <div className="stat-value">{phaseCount}</div>
          </div>
          <div className="card-pad">
            <div className="stat-label">기록된 날</div>
            <div className="stat-value">{totalRecords}</div>
          </div>
        </div>

        {/* 데이터 다운로드 */}
        <div className="card-pad">
          <div className="row-2-mb3">
            <Download size={14} className="icon-muted" />
            <span className="card-title">전체 데이터 다운로드</span>
          </div>
          <div className="settings-desc">
            모든 목표와 기록을 파일로 백업할 수 있어요. JSON은 복원용, CSV는 표 계산용이에요.
          </div>
          <div className="stack-2">
            <button onClick={() => exportStateAsJson(state)} className="download-btn">
              <FileJson size={16} className="icon-muted" />
              <div className="download-btn-text">
                <span className="download-btn-title">JSON 백업</span>
                <span className="download-btn-sub">전체 데이터 · 복원 가능</span>
              </div>
              <Download size={15} className="link-ext-icon" />
            </button>
            <button onClick={() => exportStateAsCsv(state)} className="download-btn">
              <FileSpreadsheet size={16} className="icon-muted" />
              <div className="download-btn-text">
                <span className="download-btn-title">CSV 기록표</span>
                <span className="download-btn-sub">날짜별 점수 · 엑셀에서 열기</span>
              </div>
              <Download size={15} className="link-ext-icon" />
            </button>
          </div>
        </div>

        {/* 데이터 복원 */}
        <div className="card-pad">
          <div className="row-2-mb3">
            <Upload size={14} className="icon-muted" />
            <span className="card-title">데이터 복원</span>
          </div>
          <div className="settings-desc">
            내려받은 JSON 백업 파일을 올리면 현재 데이터를 그 시점으로 되돌려요. 현재 데이터는 덮어써져요.
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileSelected}
            style={{ display: "none" }}
          />
          <button onClick={() => fileInputRef.current?.click()} className="download-btn">
            <FileJson size={16} className="icon-muted" />
            <div className="download-btn-text">
              <span className="download-btn-title">JSON 백업 불러오기</span>
              <span className="download-btn-sub">파일 선택 · 덮어쓰기</span>
            </div>
            <Upload size={15} className="link-ext-icon" />
          </button>
          {importError && (
            <div className="import-error">{importError}</div>
          )}
        </div>

        {/* 데이터 초기화 */}
        <div className="card-pad">
          <div className="row-2-mb3">
            <Shield size={14} className="icon-muted" />
            <span className="card-title">데이터 관리</span>
          </div>
          <div className="settings-desc">
            초기화하면 모든 기록·습관·목표가 삭제되고 되돌릴 수 없어요. 먼저 백업을 권장해요.
          </div>
          <button onClick={() => setShowReset(true)} className="btn-reset">
            모든 데이터 초기화
          </button>
        </div>
      </div>

      {showReset && (
        <div className="dialog-overlay">
          <div className="dialog-panel">
            <div className="dialog-title">모든 데이터를 초기화할까요?</div>
            <div className="dialog-body">초기화하면 모든 기록, 습관, 목표 데이터가 삭제돼요. 이 작업은 되돌릴 수 없어요.</div>
            <div className="row-3">
              <button onClick={() => setShowReset(false)} className="btn-muted-flex">취소</button>
              <button onClick={() => { dispatch({ type: "RESET_DATA" }); setShowReset(false); setToast("모든 데이터를 초기화했어요"); }} className="btn-danger-flex">초기화</button>
            </div>
          </div>
        </div>
      )}

      {pendingImport && (
        <div className="dialog-overlay">
          <div className="dialog-panel">
            <div className="dialog-title">이 백업으로 복원할까요?</div>
            <div className="dialog-body">
              현재 데이터는 모두 사라지고 백업 파일 내용으로 덮어써져요. 이 작업은 되돌릴 수 없어요.
            </div>
            <div className="import-summary">
              <div className="import-summary-row">
                <span className="settings-pts">파일</span>
                <span className="settings-info-value">{importFileName}</span>
              </div>
              <div className="import-summary-row">
                <span className="settings-pts">목표</span>
                <span className="settings-info-value">{pendingImport.phases.length}개</span>
              </div>
              <div className="import-summary-row">
                <span className="settings-pts">기록된 날</span>
                <span className="settings-info-value">
                  {pendingImport.phases.reduce((s, p) => s + Object.keys(p.records ?? {}).length, 0)}일
                </span>
              </div>
            </div>
            <div className="row-3">
              <button onClick={() => { setPendingImport(null); setImportFileName(""); }} className="btn-muted-flex">취소</button>
              <button onClick={confirmImport} className="btn-danger-flex">복원</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
