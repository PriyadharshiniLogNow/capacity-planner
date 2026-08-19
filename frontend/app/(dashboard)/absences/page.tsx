import { AbsencesPage } from "@/components/absences/AbsencesPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Absences",
};

export default function Page() {
  return <AbsencesPage />;
}
