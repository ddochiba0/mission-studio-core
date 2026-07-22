import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { MissionEngine, MissionService, type MissionDefinition, type MissionCheckpoint } from "@mission-studio/mission-engine";
import { BrowserMissionRepository } from "@mission-studio/browser-repository";
import { LeafletMissionMap } from "@mission-studio/map-adapter-leaflet";
import { CompletionEngine } from "@mission-studio/completion-engine";
import { TemplateEngine } from "@mission-studio/template-engine";
import { SyncEngine, SyncingMissionRepository, type SyncReport } from "@mission-studio/sync-engine";
import { BrowserSyncQueue } from "@mission-studio/browser-sync-queue";
import { createSupabaseMissionConnector } from "@mission-studio/supabase-mission-connector";
import "./style.css";

const engine = new MissionEngine({ createId: crypto.randomUUID, now: () => new Date() });
const syncQueue = new BrowserSyncQueue(localStorage);
const localRepository = new BrowserMissionRepository(localStorage);
const repository = new SyncingMissionRepository(localRepository, syncQueue, { createId: crypto.randomUUID, now: () => new Date() });
const service = new MissionService(engine, repository);
const templateEngine = new TemplateEngine({ createId: crypto.randomUUID, now: () => new Date() });
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const syncEngine = supabaseUrl && supabaseKey ? new SyncEngine(syncQueue, createSupabaseMissionConnector(supabaseUrl, supabaseKey)) : null;

function App() {
  const [missions, setMissions] = useState<readonly MissionDefinition[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [pendingSync, setPendingSync] = useState(0);
  const [syncReport, setSyncReport] = useState<SyncReport | null>(null);
  const selected = missions.find((mission) => mission.id === selectedId) ?? null;
  const refresh = async (selectId?: string) => {
    const next = await service.list(); setMissions(next);
    if (selectId) setSelectedId(selectId);
    else if (selectedId && !next.some((mission) => mission.id === selectedId)) setSelectedId(null);
    setSavedAt(new Date());
    setPendingSync((await syncQueue.list()).length);
  };
  useEffect(() => { void refresh(); }, []);
  useEffect(() => {
    if (!syncEngine) return;
    const synchronize = async () => { const report = await syncEngine.flush(); setSyncReport(report); setPendingSync(report.pending); };
    void synchronize(); window.addEventListener("online", synchronize); return () => window.removeEventListener("online", synchronize);
  }, []);

  async function createMission(event: React.FormEvent) {
    event.preventDefault(); if (!title.trim()) return;
    const mission = await service.create({ title, description });
    setTitle(""); setDescription(""); await refresh(mission.id);
  }

  async function rename(mission: MissionDefinition) {
    const nextTitle = window.prompt("새 미션 이름", mission.title)?.trim();
    if (!nextTitle) return; await service.update(mission.id, { title: nextTitle }); await refresh();
  }

  async function remove(mission: MissionDefinition) {
    if (!window.confirm(`'${mission.title}' 미션을 삭제할까요?`)) return;
    await service.delete(mission.id); await refresh();
  }

  async function duplicate(mission: MissionDefinition) {
    const copy = templateEngine.duplicate(mission); await repository.save(copy); await refresh(copy.id);
  }

  function exportMission(mission: MissionDefinition) {
    const exchangeDocument = templateEngine.export(mission);
    const blob = new Blob([JSON.stringify(exchangeDocument, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `${safeFilename(mission.title)}.sia-mission.json`; anchor.click(); URL.revokeObjectURL(url);
  }

  async function importMission(file: File) {
    try {
      const result = templateEngine.import(JSON.parse(await file.text()));
      if (!result.ok || !result.mission) return window.alert(`불러올 수 없습니다.\n${result.errors.join("\n")}`);
      await repository.save(result.mission); await refresh(result.mission.id);
    } catch { window.alert("불러올 수 없습니다. JSON 파일이 손상되었는지 확인하세요."); }
  }

  return <main>
    <header><div><p className="eyebrow">MISSION STUDIO CORE V2</p><h1>Mission Studio</h1></div><div className="header-status"><span className="saved">● {savedAt ? `${savedAt.toLocaleTimeString()} 로컬 저장 완료` : "불러오기 완료"}</span><SyncBadge connected={!!syncEngine} pending={pendingSync} report={syncReport} /><span className="sprint">SPRINT 9</span></div></header>
    <div className="workspace">
      <aside>
        <form onSubmit={createMission}>
          <h2>새 미션 만들기</h2>
          <label>미션 이름<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 숲길 보물찾기" /></label>
          <label>설명<textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="참여자가 수행할 미션을 설명하세요." /></label>
          <button type="submit">미션 생성</button>
        </form>
      </aside>
      <section className="list">
        <div className="list-title"><h2>미션 목록</h2><div><label className="import-button">파일 불러오기<input type="file" accept=".json,.sia-mission.json" onChange={(e) => { const file = e.target.files?.[0]; if (file) void importMission(file); e.target.value = ""; }} /></label><span>{missions.length}개 · 자동저장</span></div></div>
        {missions.length === 0 && <p className="empty">아직 미션이 없습니다.<br />첫 번째 미션을 만들어 보세요.</p>}
        {missions.map((mission) => <article className={selectedId === mission.id ? "selected" : ""} key={mission.id} onClick={() => setSelectedId(mission.id)}>
          <div><small>{mission.status.toUpperCase()} · 지점 {mission.checkpoints.length}</small><strong>{mission.title}</strong><p>{mission.description || "설명 없음"}</p></div>
          <div className="actions"><button type="button" onClick={(e) => { e.stopPropagation(); void duplicate(mission); }}>복제</button><button type="button" onClick={(e) => { e.stopPropagation(); exportMission(mission); }}>내보내기</button><button type="button" onClick={(e) => { e.stopPropagation(); void rename(mission); }}>수정</button><button className="danger" type="button" onClick={(e) => { e.stopPropagation(); void remove(mission); }}>삭제</button></div>
        </article>)}
      </section>
      <CheckpointEditor mission={selected} onChange={() => refresh()} />
      <ParticipantPreview mission={selected} />
    </div>
  </main>;
}

function SyncBadge({ connected, pending, report }: { connected: boolean; pending: number; report: SyncReport | null }) {
  if (!connected) return <span className="pending">서버 미설정 · 전송대기 {pending}건</span>;
  if (report?.state === "error") return <span className="sync-error" title={report.errors.join("\n")}>동기화 오류 · 대기 {pending}건</span>;
  if (pending > 0) return <span className="pending">서버 전송대기 {pending}건</span>;
  return <span className="synced">서버 동기화 완료</span>;
}

function ParticipantPreview({ mission }: { mission: MissionDefinition | null }) {
  const [completed, setCompleted] = useState<string[]>([]);
  useEffect(() => setCompleted([]), [mission?.id]);
  if (!mission) return null;
  const evaluation = new CompletionEngine().evaluate(mission, { completedCheckpointIds: completed });
  return <section className="preview"><div className="preview-head"><div><p className="eyebrow">PARTICIPANT PREVIEW</p><h2>{mission.title}</h2></div><strong>{evaluation.completedCount}/{evaluation.requiredCount}</strong></div>
    <div className="progress"><i style={{ width: `${evaluation.requiredCount ? Math.min(100, evaluation.completedCount / evaluation.requiredCount * 100) : 100}%` }} /></div>
    <div className="preview-points">{mission.checkpoints.map((point) => <button className={completed.includes(point.id) ? "done" : ""} key={point.id} onClick={() => setCompleted((current) => current.includes(point.id) ? current.filter((id) => id !== point.id) : [...current, point.id])}><span>{completed.includes(point.id) ? "✓" : point.sequence}</span>{point.title}</button>)}</div>
    {evaluation.violations.length > 0 && <p className="warning">순서대로 체크포인트를 완료해야 합니다.</p>}
    {evaluation.completed && <div className="reward"><b>미션 완료!</b>{mission.rules.reward.enabled && <span>보상: {mission.rules.reward.title}</span>}</div>}
  </section>;
}

function CheckpointEditor({ mission, onChange }: { mission: MissionDefinition | null; onChange: () => Promise<void> }) {
  const [name, setName] = useState(""); const [latitude, setLatitude] = useState(""); const [longitude, setLongitude] = useState("");
  if (!mission) return <section className="editor empty-editor"><h2>체크포인트 편집</h2><p>미션을 선택하면 지점을 편집할 수 있습니다.</p></section>;
  async function add(event: React.FormEvent) {
    event.preventDefault();
    const checkpoint: MissionCheckpoint = { id: crypto.randomUUID(), title: name.trim(), sequence: mission!.checkpoints.length + 1, position: { latitude: Number(latitude), longitude: Number(longitude) } };
    if (!checkpoint.title || !latitude || !longitude) return;
    await service.addCheckpoint(mission!.id, checkpoint); setName(""); setLatitude(""); setLongitude(""); await onChange();
  }
  async function move(index: number, direction: -1 | 1) {
    const ids = mission!.checkpoints.map((item) => item.id); const target = index + direction;
    if (target < 0 || target >= ids.length) return; [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    await service.reorderCheckpoints(mission!.id, ids); await onChange();
  }
  async function mapAdd(latitude: number, longitude: number) {
    const title = window.prompt("지도에 추가할 지점 이름", `지점 ${mission!.checkpoints.length + 1}`)?.trim();
    if (!title) return;
    await service.addCheckpoint(mission!.id, { id: crypto.randomUUID(), title, sequence: mission!.checkpoints.length + 1, position: { latitude, longitude } }); await onChange();
  }
  async function transition(target: MissionDefinition["status"]) {
    try { await service.transition(mission!.id, target); await onChange(); }
    catch (error) { window.alert(error instanceof Error ? error.message : "상태를 변경할 수 없습니다."); }
  }
  async function configureRules(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const mode = data.get("mode") === "at_least" ? "at_least" : "all";
    await service.updateRules(mission!.id, {
      completion: { mode, requiredCount: mode === "all" ? 0 : Number(data.get("requiredCount")), enforceOrder: data.get("enforceOrder") === "on" },
      reward: { enabled: data.get("rewardEnabled") === "on", title: String(data.get("rewardTitle") ?? "").trim(), description: "" },
    }); await onChange();
  }
  return <section className="editor">
    <div className="editor-title"><div><h2>체크포인트 편집 · {mission.title}</h2><span className={`status ${mission.status}`}>{mission.status.toUpperCase()}</span></div><div className="transitions">
      {mission.status !== "draft" && <button onClick={() => transition("draft")}>초안으로</button>}
      {mission.status === "draft" && <button onClick={() => transition("published")}>게시하기</button>}
      {mission.status === "published" && <button onClick={() => transition("archived")}>보관하기</button>}
    </div></div>
    <div className="map-wrap"><LeafletMissionMap
      initialViewport={{ center: { latitude: 35.791, longitude: 127.425 }, zoom: 11 }}
      points={mission.checkpoints.map((point, index) => ({ id: point.id, label: point.title, sequence: index + 1, position: point.position }))}
      onSelect={({ position }) => mapAdd(position.latitude, position.longitude)}
    /><p className="map-help">지도를 클릭하면 체크포인트를 추가합니다. 등록된 지점은 자동으로 화면에 맞춰집니다.</p></div>
    <form className="rules-form" onSubmit={configureRules}>
      <label>완료 조건<select name="mode" defaultValue={mission.rules.completion.mode}><option value="all">전체 지점 완료</option><option value="at_least">지정 개수 이상</option></select></label>
      <label>필수 개수<input name="requiredCount" type="number" min="0" max={mission.checkpoints.length} defaultValue={mission.rules.completion.requiredCount} /></label>
      <label className="check"><input name="enforceOrder" type="checkbox" defaultChecked={mission.rules.completion.enforceOrder} />순서대로 수행</label>
      <label className="check"><input name="rewardEnabled" type="checkbox" defaultChecked={mission.rules.reward.enabled} />완료 보상</label>
      <label>보상 이름<input name="rewardTitle" defaultValue={mission.rules.reward.title} placeholder="예: 탐험가 배지" /></label>
      <button type="submit">규칙 저장</button>
    </form>
    <form className="checkpoint-form" onSubmit={add}>
      <input aria-label="지점 이름" value={name} onChange={(e) => setName(e.target.value)} placeholder="지점 이름" />
      <input aria-label="위도" type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="위도" />
      <input aria-label="경도" type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="경도" />
      <button type="submit">지점 추가</button>
    </form>
    <div className="checkpoints">{mission.checkpoints.length === 0 && <p className="empty">등록된 지점이 없습니다.</p>}{mission.checkpoints.map((point, index) => <div className="checkpoint" key={point.id}>
      <b>{index + 1}</b><div><strong>{point.title}</strong><small>{point.position.latitude}, {point.position.longitude}</small></div>
      <div className="point-actions"><button onClick={() => move(index, -1)} disabled={index === 0}>↑</button><button onClick={() => move(index, 1)} disabled={index === mission.checkpoints.length - 1}>↓</button><button className="danger" onClick={async () => { await service.removeCheckpoint(mission.id, point.id); await onChange(); }}>삭제</button></div>
    </div>)}</div>
  </section>;
}

createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);

function safeFilename(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, "-").trim() || "mission";
}
