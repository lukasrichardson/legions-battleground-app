import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/client/ui/breadcrumb";
import Link from "next/link";

export default function Breadcrumbs({breadcrumbs, className}: {breadcrumbs: {name: string, path: string}[], className?: string}) {
  const currentIndex = breadcrumbs.length - 1;

  return (
    <div className={`inline-flex max-w-[calc(100vw-5rem)] rounded-xl border border-b-0 border-r-0 border-white/20 bg-slate-950/10 p-1.5 shadow-sm backdrop-blur-sm sm:max-w-[calc(100vw-9rem)] ${className ?? ""}`}>
      <Breadcrumb>
        <BreadcrumbList className="flex-nowrap gap-1 text-sm sm:gap-1.5 sm:text-base">
          {breadcrumbs.map((breadcrumb, index) => (
            <div
              key={breadcrumb.path}
              className={`min-w-0 items-center gap-1 flex`}
            >
              {index > 0 && <BreadcrumbSeparator key={`sep-${index}`} />}
              <BreadcrumbItem key={breadcrumb.name}>
                {index === currentIndex ? (
                  <span aria-current="page" className="block max-w-40 truncate px-1.5 font-semibold text-white sm:max-w-72 sm:px-2">
                    {breadcrumb.name}
                  </span>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      href={breadcrumb.path}
                      aria-label={index === 0 ? "Home" : undefined}
                      className="flex items-center gap-1 rounded-md px-1.5 font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white sm:px-2"
                    >
                      <span className={index === 0 ? "hidden sm:inline" : "truncate"}>{breadcrumb.name}</span>
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}
