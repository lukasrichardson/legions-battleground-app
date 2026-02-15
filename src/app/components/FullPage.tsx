import Breadcrumbs from "./Breadcrumbs";
import { usePathname } from "next/navigation";

export default function FullPage({ children, showBreadcrumbs }: { children: React.ReactNode, showBreadcrumbs?: boolean }) {
  const pathName = usePathname();
  const breadcrumbs = pathName.split("/").filter(Boolean).map((segment, index, arr) => {
    const name = segment.charAt(0).toUpperCase() + segment.slice(1);
    const path = "/" + arr.slice(0, index + 1).join("/");
    return { name, path };
  });
  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-blue-900/80 to-slate-900 overflow-hidden">
      {showBreadcrumbs && <Breadcrumbs breadcrumbs={[{name: "Home", path: "/"}, ...breadcrumbs]} />}
      <p className="text-white"><a className="fixed right-2 top-2" href="https://buymeacoffee.com/lukasrichardson" target="_blank" rel="noopener noreferrer">Help Keep Legions Battleground Running!☕</a></p>
      <div className="h-full flex flex-col px-4 pb-6 pt-2">
        {children}
      </div>
    </div>
  );
}