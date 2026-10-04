import Finder from "@/components/finder";
import { query } from "@/lib/repository";
export const dynamic = "force-dynamic";
export default function Page() {
  return <Finder initial={query(new URLSearchParams())} />;
}
