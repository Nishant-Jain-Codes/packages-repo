/**
 * Values the @aditya-sharma-salescode/reports-ui package reads from localStorage.
 * Maps from this app's `auth_cookie` and pins accountId for UAT reports.
 */
export const REPORTS_ACCOUNT_ID = "ckcoedemo";

export function syncReportsAuthLocalStorage(): void {
  try {
    const raw = localStorage.getItem("auth_cookie");
    if (!raw) return;
    const cookieData = JSON.parse(raw) as {
      token?: string;
      userId?: string;
      email?: string;
    };
    if (cookieData.token) {
      localStorage.setItem("authToken", cookieData.token);
    }
    localStorage.setItem("accountId", REPORTS_ACCOUNT_ID);
    localStorage.setItem(
      "authContext",
      JSON.stringify({
        user: {
          loginId: cookieData.userId ?? "",
          email: cookieData.email ?? "",
        },
      })
    );
  } catch {
    // ignore malformed storage
  }
}
