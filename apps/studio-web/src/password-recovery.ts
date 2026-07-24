import { AuthEngine } from "@mission-studio/auth-engine";
import { createSupabaseClient, SupabaseAuthAdapter } from "@mission-studio/supabase-auth-adapter";
import "./password-recovery.css";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (supabaseUrl && supabaseKey) {
  const engine = new AuthEngine(new SupabaseAuthAdapter(createSupabaseClient(supabaseUrl, supabaseKey)));
  engine.onPasswordRecovery(() => showPasswordRecovery(engine));
}

function showPasswordRecovery(engine: AuthEngine): void {
  if (document.getElementById("password-recovery-panel")) return;

  const overlay = document.createElement("div");
  overlay.id = "password-recovery-panel";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.innerHTML = `
    <div class="password-recovery-card">
      <p class="eyebrow">PASSWORD RECOVERY</p>
      <h2>새 비밀번호 설정</h2>
      <p>새 비밀번호를 두 번 입력하세요. 비밀번호는 저장하거나 화면에 표시하지 않습니다.</p>
      <form>
        <label>새 비밀번호<input name="password" type="password" autocomplete="new-password" minlength="8" required /></label>
        <label>새 비밀번호 확인<input name="confirmation" type="password" autocomplete="new-password" minlength="8" required /></label>
        <button type="submit">비밀번호 변경</button>
      </form>
      <p class="password-recovery-message" aria-live="polite"></p>
    </div>`;
  document.body.appendChild(overlay);

  const form = overlay.querySelector("form")!;
  const message = overlay.querySelector<HTMLElement>(".password-recovery-message")!;
  const button = overlay.querySelector<HTMLButtonElement>("button")!;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    button.disabled = true;
    message.textContent = "";
    try {
      await engine.updatePassword(String(data.get("password") ?? ""), String(data.get("confirmation") ?? ""));
      history.replaceState({}, document.title, location.pathname + location.search);
      message.textContent = "비밀번호가 변경되었습니다. 이제 새 비밀번호로 로그인할 수 있습니다.";
      button.textContent = "변경 완료";
      setTimeout(() => overlay.remove(), 1800);
    } catch (reason) {
      message.textContent = reason instanceof Error ? reason.message : "비밀번호 변경에 실패했습니다.";
      button.disabled = false;
    }
  });
}
