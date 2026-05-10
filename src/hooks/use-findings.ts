import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Finding } from "@/types/finding";

export function useFindings() {
  const [data, setData] = useState<Finding[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("findings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (!mounted) return;
      if (error) setError(error.message);
      else setData((data as Finding[]) ?? []);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { data, error, loading };
}
