import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/client/ui/breadcrumb";
import Link from "next/link";

export default function Breadcrumbs({breadcrumbs, className}: {breadcrumbs: {name: string, path: string}[], className?: string}) {
  return (
    <div className={"inline-block bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-1 mb-2 absolute top-2 left-2 " + className || ""}>
      <Breadcrumb>
        <BreadcrumbList className="flex gap-1">
          {breadcrumbs.map((breadcrumb, index) => (
            <div key={breadcrumb.name} className="flex items-center gap-1">
              {index > 0 && <BreadcrumbSeparator key={`sep-${index}`} />}
              <BreadcrumbItem key={breadcrumb.name}>
                <BreadcrumbLink asChild>
                  <Link 
                    href={breadcrumb.path}
                    className="px-2 py-1 text-white font-medium rounded hover:bg-white/10 transition-colors flex items-center gap-1 text-xs"
                  >
                    {index === 0 && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>}
                    {breadcrumb.name}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}