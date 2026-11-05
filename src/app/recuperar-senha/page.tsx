import PasswordForm from "@shared/components/admin/PasswordForm";
import "@shared/styles/admin.css";

export const metadata = {
  title: "Recuperar senha",
  referrer: "no-referrer" as const,
};

export default function RecoveryPage() {
  return (
    <main className="admin-password-recovery">
      <h1>Recuperar senha</h1>
      <PasswordForm mode="recovery" />
      <p>
        <a href="/login/">Voltar ao login</a>
      </p>
    </main>
  );
}
