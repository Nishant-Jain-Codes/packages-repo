import { useEffect } from "react";
import { ReportsApp } from "@aditya-sharma-salescode/reports-ui";
import "@reports-ui/styles";

import { DUMMY_REPORT_CARDS } from "./dummyReportCards";
import { syncReportsAuthLocalStorage } from "./syncReportsAuth";

export default function ReportsPage() {
  useEffect(() => {
    syncReportsAuthLocalStorage();
  }, []);

  return <ReportsApp reportCards={DUMMY_REPORT_CARDS} />;
}
